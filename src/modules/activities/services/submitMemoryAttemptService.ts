import api from "@/lib/api";

export interface MemoryAttemptResult {
  attempt: {
    id: string;
    score: number;
    accuracyPoints: number;
    totalPairs: number;
    matchedPairs: number;
    wrongAttempts: number;
    penaltyPoints: number;
    createdAt: string;
  };
  ranking: Array<{ position: number; studentName: string; score: number; elapsedSeconds: number; createdAt: string }>;
  isInRanking: boolean;
}

interface Response { success: true; data: MemoryAttemptResult; }

export const submitMemoryAttemptService = {
  async execute(slug: string, matchedPairIds: string[], wrongAttempts: number): Promise<MemoryAttemptResult> {
    const response = await api.post<Response>(`/activities/${encodeURIComponent(slug)}/memory/attempts`, {
      matchedPairIds, wrongAttempts
    });
    return response.data.data;
  },
};
