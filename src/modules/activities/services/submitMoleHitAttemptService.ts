import api from "@/lib/api";

export interface MoleHitAttemptResult {
  attempt: {
    id: string;
    score: number;
    accuracyPoints: number;
    speedPoints: number;
    hits: number;
    misses: number;
    elapsedSeconds: number;
    createdAt: string;
  };
  ranking: Array<{ position: number; studentName: string; score: number; elapsedSeconds: number; createdAt: string }>;
  isInRanking: boolean;
}

interface Response { success: true; data: MoleHitAttemptResult; }

export const submitMoleHitAttemptService = {
  async execute(slug: string, attemptToken: string, hits: number, misses: number, elapsedSeconds: number): Promise<MoleHitAttemptResult> {
    const response = await api.post<Response>(`/activities/${encodeURIComponent(slug)}/mole-hit/attempts`, {
      attemptToken, hits, misses, elapsedSeconds,
    });
    return response.data.data;
  },
};
