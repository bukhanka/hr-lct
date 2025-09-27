import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { MissionSubmission, QuizSubmission, validatePayload } from '@/lib/mission-types';

// POST /api/missions/[id]/submit
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: missionId } = await params;
    const body = await request.json();
    const submission = body.submission as MissionSubmission;

    // Get mission with campaign info
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      include: {
        campaign: true,
        userMissions: {
          where: { userId: session.user.id }
        }
      }
    });

    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    // Check if user already completed this mission
    const existingUserMission = mission.userMissions[0];
    if (existingUserMission?.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Mission already completed' }, { status: 400 });
    }

    // Validate submission based on mission type and payload
    const validationResult = validateSubmission(mission.missionType, mission.payload, submission);
    if (!validationResult.isValid) {
      return NextResponse.json({ 
        error: 'Invalid submission', 
        details: validationResult.errors 
      }, { status: 400 });
    }

    // Create or update user mission
    const userMissionData = {
      userId: session.user.id,
      missionId: mission.id,
      submission: submission as any,
      completedAt: new Date(),
      status: mission.confirmationType === 'AUTO' ? 'COMPLETED' as const : 'PENDING_REVIEW' as const
    };

    let userMission;
    if (existingUserMission) {
      userMission = await prisma.userMission.update({
        where: { id: existingUserMission.id },
        data: userMissionData
      });
    } else {
      userMission = await prisma.userMission.create({
        data: userMissionData
      });
    }

    // If auto-confirmation, award rewards
    if (mission.confirmationType === 'AUTO') {
      await awardMissionRewards(session.user.id, mission);
    }

    return NextResponse.json({ 
      success: true, 
      userMission,
      autoCompleted: mission.confirmationType === 'AUTO'
    });

  } catch (error) {
    console.error('Error submitting mission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Validation function for different mission types
function validateSubmission(
  missionType: string, 
  payload: any, 
  submission: MissionSubmission
): { isValid: boolean; errors?: string[] } {
  const errors: string[] = [];

  switch (missionType) {
    case 'COMPLETE_QUIZ':
      const quizSubmission = submission as QuizSubmission;
      
      if (!quizSubmission.answers || !Array.isArray(quizSubmission.answers)) {
        errors.push('Quiz answers are required');
        break;
      }

      if (!payload || !payload.questions) {
        errors.push('Invalid quiz configuration');
        break;
      }

      // Validate that all required questions are answered
      for (const question of payload.questions) {
        if (question.required) {
          const answer = quizSubmission.answers.find(a => a.questionId === question.id);
          if (!answer || (!answer.answerIds?.length && !answer.textAnswer?.trim())) {
            errors.push(`Question "${question.text}" is required`);
          }
        }
      }

      // Check passing score
      if (quizSubmission.score < payload.passingScore) {
        errors.push(`Score ${quizSubmission.score}% is below passing threshold ${payload.passingScore}%`);
      }

      break;

    case 'WATCH_VIDEO':
      const videoSubmission = submission as any;
      
      if (!videoSubmission.watchPercentage || videoSubmission.watchPercentage < 0) {
        errors.push('Invalid watch percentage');
      }

      if (payload?.watchThreshold && videoSubmission.watchPercentage < payload.watchThreshold) {
        errors.push(`Must watch at least ${Math.round(payload.watchThreshold * 100)}% of video`);
      }

      break;

    case 'UPLOAD_FILE':
      const fileSubmission = submission as any;
      
      if (!fileSubmission.files || !Array.isArray(fileSubmission.files) || fileSubmission.files.length === 0) {
        errors.push('At least one file is required');
      }

      if (payload?.requiredFiles && fileSubmission.files.length !== payload.requiredFiles) {
        errors.push(`Exactly ${payload.requiredFiles} files required`);
      }

      break;

    case 'SUBMIT_FORM':
      const formSubmission = submission as any;
      
      if (!formSubmission.responses || !Array.isArray(formSubmission.responses)) {
        errors.push('Form responses are required');
        break;
      }

      if (!payload || !payload.fields) {
        errors.push('Invalid form configuration');
        break;
      }

      // Validate required fields
      for (const field of payload.fields) {
        if (field.required) {
          const response = formSubmission.responses.find((r: any) => r.fieldId === field.id);
          if (!response || !response.value || 
              (typeof response.value === 'string' && !response.value.trim()) ||
              (Array.isArray(response.value) && response.value.length === 0)) {
            errors.push(`Field "${field.label}" is required`);
          }
        }
      }

      break;

    case 'ATTEND_OFFLINE':
    case 'ATTEND_ONLINE':
      const eventSubmission = submission as any;
      
      if (!eventSubmission.attendedAt) {
        errors.push('Attendance timestamp is required');
      }

      break;

    case 'CUSTOM':
    case 'EXTERNAL_ACTION':
      const customSubmission = submission as any;
      
      if (!customSubmission.content?.trim() && (!customSubmission.attachments || customSubmission.attachments.length === 0)) {
        errors.push('Either content or attachments are required');
      }

      break;
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

// Award experience, mana, and competency points
async function awardMissionRewards(userId: string, mission: any) {
  // Update user experience and mana
  await prisma.user.update({
    where: { id: userId },
    data: {
      experience: { increment: mission.experienceReward },
      mana: { increment: mission.manaReward }
    }
  });

  // Award competency points
  if (mission.competencies && mission.competencies.length > 0) {
    for (const competency of mission.competencies) {
      await prisma.userCompetency.upsert({
        where: {
          userId_competencyId: {
            userId: userId,
            competencyId: competency.competencyId
          }
        },
        update: {
          points: { increment: competency.points }
        },
        create: {
          userId: userId,
          competencyId: competency.competencyId,
          points: competency.points
        }
      });
    }
  }

  // TODO: Check if user can rank up based on new experience/competencies
  // TODO: Send notification about mission completion
}
