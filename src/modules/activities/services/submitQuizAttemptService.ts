import api from "@/lib/api";

export interface QuizAttemptResult {
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
  ranking: Array<{
    position: number;
    studentName: string;
    score: number;
    elapsedSeconds: number;
    createdAt: string;
  }>;
  isInRanking: boolean;
}

interface SubmitQuizAttemptResponse {
  success: true;
  data: QuizAttemptResult;
}

export const submitQuizAttemptService = {
  async execute(slug: string, selectedOptionIds: string[], elapsedSeconds: number): Promise<QuizAttemptResult> {
    const response = await api.post<SubmitQuizAttemptResponse>(
      `/activities/${encodeURIComponent(slug)}/attempts`,
      { wordsFound: selectedOptionIds, elapsedSeconds },
    );
    return response.data.data;
  },
};
