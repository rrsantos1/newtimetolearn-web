import api from "@/lib/api";

export interface WordSearchRankingEntry {
  position: number;
  studentName: string;
  score: number;
  elapsedSeconds: number;
  createdAt: string;
}

interface GetWordSearchRankingResponse {
  success: true;
  data: { ranking: WordSearchRankingEntry[] };
}

export const getWordSearchRankingService = {
  async execute(slug: string): Promise<WordSearchRankingEntry[]> {
    const response = await api.get<GetWordSearchRankingResponse>(
      `/activities/${encodeURIComponent(slug)}/ranking`,
    );
    return response.data.data.ranking;
  },
};
