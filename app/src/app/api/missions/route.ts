import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { validatePayload } from '@/lib/mission-types';

// POST /api/missions - Create new mission
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session || !(session as any)?.user || ((session as any).user as any).role !== 'architect') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.campaignId || !data.name || !data.missionType) {
      return NextResponse.json({ 
        error: 'Missing required fields: campaignId, name, missionType' 
      }, { status: 400 });
    }

    // Validate payload if provided
    if (data.payload) {
      const isValid = validatePayload(data.missionType, data.payload);
      if (!isValid) {
        return NextResponse.json({ 
          error: 'Invalid payload for mission type',
          missionType: data.missionType
        }, { status: 400 });
      }
    }

    // Check if campaign exists and user has access
    const campaign = await prisma.campaign.findUnique({
      where: { id: data.campaignId }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const mission = await prisma.mission.create({
      data: {
        campaignId: data.campaignId,
        name: data.name,
        description: data.description,
        missionType: data.missionType,
        experienceReward: data.experienceReward || 0,
        manaReward: data.manaReward || 0,
        positionX: data.positionX || 0,
        positionY: data.positionY || 0,
        confirmationType: data.confirmationType || 'MANUAL_REVIEW',
        minRank: data.minRank || 1,
        payload: data.payload
      }
    });

    return NextResponse.json(mission);

  } catch (error) {
    console.error('Error creating mission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/missions - Get missions (with filters)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session || !(session as any)?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const missionType = searchParams.get('missionType');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId'); // For admin/architect to see user progress

    let whereClause: any = {};
    
    // Filter by campaign
    if (campaignId) {
      whereClause.campaignId = campaignId;
    }

    // Filter by mission type
    if (missionType) {
      whereClause.missionType = missionType;
    }

    // For cadets, only show missions they have access to
    if (((session as any).user as any).role === 'cadet') {
      // Get user's current rank
      const user = await prisma.user.findUnique({
        where: { id: (session as any).user.id },
        select: { currentRank: true }
      });

      whereClause.minRank = {
        lte: user?.currentRank || 1
      };

      // Only show missions from active campaigns
      whereClause.campaign = {
        isActive: true
      };
    }

    const missions = await prisma.mission.findMany({
      where: whereClause,
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            theme: true,
            isActive: true
          }
        },
        competencies: {
          include: {
            competency: true
          }
        },
        userMissions: userId ? {
          where: { userId }
        } : (((session as any).user as any).role === 'cadet' ? {
          where: { userId: (session as any).user.id }
        } : false),
        dependenciesTo: {
          include: {
            sourceMission: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { campaign: { name: 'asc' } },
        { positionY: 'asc' },
        { positionX: 'asc' }
      ]
    });

    // Filter by status if specified
    let filteredMissions = missions;
    if (status && ((session as any).user as any).role === 'cadet') {
      filteredMissions = missions.filter(mission => {
        const userMission = mission.userMissions?.[0];
        const currentStatus = userMission?.status || 'AVAILABLE';
        return currentStatus === status;
      });
    }

    // Prepare safe response (remove sensitive payload data for cadets)
    const safeMissions = filteredMissions.map(mission => ({
      ...mission,
      payload: ((session as any).user as any).role === 'cadet' 
        ? prepareSafePayload(mission.missionType, mission.payload)
        : mission.payload
    }));

    return NextResponse.json(safeMissions);

  } catch (error) {
    console.error('Error fetching missions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to prepare safe payload for cadets
function prepareSafePayload(missionType: string, payload: any): any {
  if (!payload) return null;

  switch (missionType) {
    case 'COMPLETE_QUIZ':
      return {
        ...payload,
        questions: payload.questions?.map((q: any) => ({
          ...q,
          correctAnswerIds: undefined // Remove correct answers
        }))
      };
    
    default:
      return payload;
  }
}