import api from "@/lib/api";

export interface QuizAttemptResult {
  attempt: {
    id: string;
    score: number;
    accuracyPoints: number;
    totalWords: number;
    wordsFound: string[];
    createdAt: string;
  };
  ranking: Array<{
    position: number;
    studentName: string;
    score: number;
    createdAt: string;
  }>;
  isInRanking: boolean;
}

interface SubmitQuizAttemptResponse {
  success: true;
  data: QuizAttemptResult;
}

export const submitQuizAttemptService = {
  async execute(slug: string, selectedOptionIds: string[]): Promise<QuizAttemptResult> {
    const response = await api.post<SubmitQuizAttemptResponse>(
      `/activities/${encodeURIComponent(slug)}/attempts`,
      { wordsFound: selectedOptionIds },
    );
    return response.data.data;
  },
};
