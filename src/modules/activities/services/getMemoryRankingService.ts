import api from "@/lib/api";

export interface MemoryRankingEntry {
  position: number;
  studentName: string;
  score: number;
  createdAt: string;
}

interface GetMemoryRankingResponse {
  success: true;
  data: { ranking: MemoryRankingEntry[] };
}

export const getMemoryRankingService = {
  async execute(slug: string): Promise<MemoryRankingEntry[]> {
    const response = await api.get<GetMemoryRankingResponse>(
      `/activities/${encodeURIComponent(slug)}/ranking`,
    );
    return response.data.data.ranking;
  },
};
