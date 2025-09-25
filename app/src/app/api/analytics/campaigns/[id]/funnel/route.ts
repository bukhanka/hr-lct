import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    const { id: campaignId } = await params;
    
    if (!session || (session as any)?.user?.role !== "architect") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get funnel analytics for the campaign
    const funnelData = await prisma.$queryRaw`
      SELECT
        m.id,
        m.name,
        m.experience_reward,
        m.mana_reward,
        COUNT(um.user_id) FILTER (WHERE um.status != 'LOCKED') AS users_started,
        COUNT(um.user_id) FILTER (WHERE um.status = 'COMPLETED') AS users_completed,
        COUNT(um.user_id) FILTER (WHERE um.status = 'IN_PROGRESS') AS users_in_progress,
        COUNT(um.user_id) FILTER (WHERE um.status = 'PENDING_REVIEW') AS users_pending,
        ROUND(
          CASE 
            WHEN COUNT(um.user_id) FILTER (WHERE um.status != 'LOCKED') > 0
            THEN (COUNT(um.user_id) FILTER (WHERE um.status = 'COMPLETED') * 100.0) / 
                 COUNT(um.user_id) FILTER (WHERE um.status != 'LOCKED')
            ELSE 0
          END, 2
        ) AS completion_rate,
        ROUND(
          AVG(
            CASE 
              WHEN um.completed_at IS NOT NULL AND um.started_at IS NOT NULL
              THEN EXTRACT(EPOCH FROM (um.completed_at - um.started_at)) / 3600.0
              ELSE NULL
            END
          ), 2
        ) AS avg_completion_hours
      FROM missions m
      LEFT JOIN user_missions um ON m.id = um.mission_id
      WHERE m.campaign_id = ${campaignId}
      GROUP BY m.id, m.name, m.experience_reward, m.mana_reward
      ORDER BY m.position_y ASC
    `;

    // Get overall campaign stats
    const campaignStats = await prisma.$queryRaw`
      SELECT
        COUNT(DISTINCT um.user_id) AS total_users,
        COUNT(DISTINCT CASE WHEN um.status != 'LOCKED' THEN um.user_id END) AS active_users,
        COUNT(um.id) FILTER (WHERE um.status = 'COMPLETED') AS total_completions,
        COUNT(um.id) FILTER (WHERE um.status != 'LOCKED') AS total_attempts,
        ROUND(
          CASE 
            WHEN COUNT(um.id) FILTER (WHERE um.status != 'LOCKED') > 0
            THEN (COUNT(um.id) FILTER (WHERE um.status = 'COMPLETED') * 100.0) / 
                 COUNT(um.id) FILTER (WHERE um.status != 'LOCKED')
            ELSE 0
          END, 2
        ) AS overall_completion_rate
      FROM user_missions um
      JOIN missions m ON um.mission_id = m.id
      WHERE m.campaign_id = ${campaignId}
    `;

    // Get time-based analytics (last 30 days)
    const timeSeriesData = await prisma.$queryRaw`
      SELECT
        DATE(um.completed_at) as completion_date,
        COUNT(*) as completions
      FROM user_missions um
      JOIN missions m ON um.mission_id = m.id
      WHERE m.campaign_id = ${campaignId}
        AND um.status = 'COMPLETED'
        AND um.completed_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(um.completed_at)
      ORDER BY completion_date ASC
    `;

    // Get top performing missions
    const topMissions = await prisma.$queryRaw`
      SELECT
        m.name,
        COUNT(um.id) FILTER (WHERE um.status = 'COMPLETED') AS completions,
        ROUND(AVG(EXTRACT(EPOCH FROM (um.completed_at - um.started_at)) / 3600.0), 2) AS avg_hours
      FROM missions m
      LEFT JOIN user_missions um ON m.id = um.mission_id
      WHERE m.campaign_id = ${campaignId}
        AND um.status = 'COMPLETED'
      GROUP BY m.id, m.name
      ORDER BY completions DESC
      LIMIT 5
    `;

    return NextResponse.json({
      funnel: funnelData,
      campaignStats: (campaignStats as any[])[0] || {},
      timeSeries: timeSeriesData,
      topMissions: topMissions,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error generating analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
