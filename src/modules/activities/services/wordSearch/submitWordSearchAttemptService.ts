import api from "@/lib/api";

export interface WordSearchRankingEntry {
  position: number;
  studentName: string;
  score: number;
  createdAt: string;
}

export interface WordSearchAttemptResult {
  attempt: {
    id: string;
    score: number;
    accuracyPoints: number;
    totalWords: number;
    wordsFound: string[];
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
  ): Promise<WordSearchAttemptResult> {
    const response = await api.post<SubmitWordSearchAttemptResponse>(
      `/activities/${encodeURIComponent(slug)}/attempts`,
      { wordsFound },
    );

    return response.data.data;
  },
};
