import api from "@/lib/api";

export interface QuizRankingEntry {
  position: number;
  studentName: string;
  score: number;
  createdAt: string;
}

interface GetQuizRankingResponse {
  success: true;
  data: { ranking: QuizRankingEntry[] };
}

export const getQuizRankingService = {
  async execute(slug: string): Promise<QuizRankingEntry[]> {
    const response = await api.get<GetQuizRankingResponse>(
      `/activities/${encodeURIComponent(slug)}/ranking`,
    );
    return response.data.data.ranking;
  },
};
