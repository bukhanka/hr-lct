export type TestMissionStatus =
  | "LOCKED"
  | "AVAILABLE"
  | "IN_PROGRESS"
  | "PENDING_REVIEW"
  | "COMPLETED";

export interface TestModeSummary {
  total: number;
  completed: number;
  available: number;
  locked: number;
  pending: number;
}

export interface TestModeMission {
  id: string;
  missionId: string;
  status: TestMissionStatus;
  mission: {
    id: string;
    name: string;
    description?: string | null;
    missionType: string;
    experienceReward: number;
    manaReward: number;
    confirmationType: string;
    minRank: number;
    positionX?: number;
    positionY?: number;
    dependenciesFrom: Array<{ sourceMissionId: string; targetMissionId: string }>;
    dependenciesTo: Array<{ sourceMissionId: string; targetMissionId: string }>;
    competencies: Array<{
      competencyId: string;
      competency?: {
        id: string;
        name: string;
        iconUrl?: string | null;
      } | null;
      points: number;
    }>;
  };
}

export interface TestModeState {
  missions: TestModeMission[];
  summary: TestModeSummary;
}
