import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { validatePayload } from '@/lib/mission-types';

// GET /api/missions/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: missionId } = await params;

    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            description: true,
            theme: true,
            isActive: true
          }
        },
        competencies: {
          include: {
            competency: true
          }
        },
        userMissions: {
          where: { userId: session.user.id }
        },
        dependenciesTo: {
          include: {
            sourceMission: {
              include: {
                userMissions: {
                  where: { 
                    userId: session.user.id,
                    status: 'COMPLETED'
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    // Check if campaign is active
    if (!mission.campaign.isActive) {
      return NextResponse.json({ error: 'Campaign is not active' }, { status: 403 });
    }

    // Check mission dependencies
    const uncompletedDependencies = mission.dependenciesTo.filter(
      dep => dep.sourceMission.userMissions.length === 0
    );

    if (uncompletedDependencies.length > 0) {
      return NextResponse.json({ 
        error: 'Mission dependencies not met',
        dependencies: uncompletedDependencies.map(dep => ({
          id: dep.sourceMission.id,
          name: dep.sourceMission.name
        }))
      }, { status: 403 });
    }

    // Get user's current rank
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { currentRank: true, experience: true, mana: true }
    });

    if (!user || user.currentRank < mission.minRank) {
      return NextResponse.json({ 
        error: 'Insufficient rank',
        required: mission.minRank,
        current: user?.currentRank || 1
      }, { status: 403 });
    }

    // Determine mission status for user
    const userMission = mission.userMissions[0];
    let status = 'AVAILABLE';
    
    if (userMission) {
      status = userMission.status;
    }

    // Prepare response with payload (hide sensitive data like correct answers)
    const responsePayload = mission.payload ? prepareSafePayload(mission.missionType, mission.payload) : null;

    const response = {
      id: mission.id,
      name: mission.name,
      description: mission.description,
      missionType: mission.missionType,
      experienceReward: mission.experienceReward,
      manaReward: mission.manaReward,
      confirmationType: mission.confirmationType,
      minRank: mission.minRank,
      payload: responsePayload,
      status,
      campaign: mission.campaign,
      competencies: mission.competencies.map(mc => ({
        competency: mc.competency,
        points: mc.points
      })),
      userSubmission: userMission?.submission || null,
      completedAt: userMission?.completedAt || null
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching mission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Remove sensitive information from payload (like correct quiz answers)
function prepareSafePayload(missionType: string, payload: any): any {
  if (!payload) return null;

  switch (missionType) {
    case 'COMPLETE_QUIZ':
      return {
        ...payload,
        questions: payload.questions?.map((q: any) => ({
          ...q,
          correctAnswerIds: undefined // Remove correct answers for security
        }))
      };
    
    default:
      return payload;
  }
}

// PUT /api/missions/[id] - Update mission (for architects)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user || (session.user as any).role !== 'architect') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: missionId } = await params;
    const data = await request.json();

    // Validate payload if provided
    if (data.payload && data.missionType) {
      const isValid = validatePayload(data.missionType, data.payload);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid payload for mission type' }, { status: 400 });
      }
    }

    const mission = await prisma.mission.update({
      where: { id: missionId },
      data: {
        name: data.name,
        description: data.description,
        missionType: data.missionType,
        experienceReward: data.experienceReward,
        manaReward: data.manaReward,
        positionX: data.positionX,
        positionY: data.positionY,
        confirmationType: data.confirmationType,
        minRank: data.minRank,
        payload: data.payload
      }
    });

    return NextResponse.json(mission);

  } catch (error) {
    console.error('Error updating mission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/missions/[id] - Delete mission (for architects)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user || (session.user as any).role !== 'architect') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: missionId } = await params;

    await prisma.mission.delete({
      where: { id: missionId }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting mission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
