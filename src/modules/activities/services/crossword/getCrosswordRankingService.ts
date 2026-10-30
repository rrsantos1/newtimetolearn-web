import api from "@/lib/api";

export interface CrosswordRankingEntry {
  position: number;
  studentName: string;
  score: number;
  elapsedSeconds: number;
  createdAt: string;
}

interface GetCrosswordRankingResponse {
  success: true;
  data: { ranking: CrosswordRankingEntry[] };
}

export const getCrosswordRankingService = {
  async execute(slug: string): Promise<CrosswordRankingEntry[]> {
    const response = await api.get<GetCrosswordRankingResponse>(
      `/activities/${encodeURIComponent(slug)}/ranking`,
    );
    return response.data.data.ranking;
  },
};
