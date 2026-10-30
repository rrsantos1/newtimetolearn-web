import api from "@/lib/api";

export interface WordSearchRankingEntry {
  position: number;
  studentName: string;
  score: number;
  elapsedSeconds: number;
  createdAt: string;
}

export interface WordSearchAttemptResult {
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
  ranking: WordSearchRankingEntry[];
  isInRanking: boolean;
}

interface SubmitWordSearchAttemptResponse {
  success: true;
  data: WordSearchAttemptResult;
}

export const submitWordSearchAttemptService = {
  async execute(
    slug: string,
    wordsFound: string[],
    elapsedSeconds: number,
  ): Promise<WordSearchAttemptResult> {
    const response = await api.post<SubmitWordSearchAttemptResponse>(
      `/activities/${encodeURIComponent(slug)}/attempts`,
      { wordsFound, elapsedSeconds },
    );

    return response.data.data;
  },
};
