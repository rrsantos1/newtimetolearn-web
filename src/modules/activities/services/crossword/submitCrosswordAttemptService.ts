import api from "@/lib/api";
import type { CrosswordRankingEntry } from "./getCrosswordRankingService";

export interface CrosswordAttemptResult {
  attempt: {
    id: string;
    score: number;
    accuracyPoints: number;
    speedPoints: number;
    totalWords: number;
    wordsFound: string[];
    elapsedSeconds: number;
    createdAt: string;
  };
  ranking: CrosswordRankingEntry[];
  isInRanking: boolean;
}

interface SubmitCrosswordAttemptResponse {
  success: true;
  data: CrosswordAttemptResult;
}

export const submitCrosswordAttemptService = {
  async execute(slug: string, answers: string[], elapsedSeconds: number): Promise<CrosswordAttemptResult> {
    const response = await api.post<SubmitCrosswordAttemptResponse>(
      `/activities/${encodeURIComponent(slug)}/attempts`,
      { wordsFound: answers, elapsedSeconds },
    );
    return response.data.data;
  },
};
