import api from "@/lib/api";
import type { CrosswordRankingEntry } from "./getCrosswordRankingService";

export interface CrosswordAttemptResult {
  attempt: {
    id: string;
    score: number;
    accuracyPoints: number;
    totalWords: number;
    wordsFound: string[];
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
  async execute(slug: string, answers: string[]): Promise<CrosswordAttemptResult> {
    const response = await api.post<SubmitCrosswordAttemptResponse>(
      `/activities/${encodeURIComponent(slug)}/attempts`,
      { wordsFound: answers },
    );
    return response.data.data;
  },
};
