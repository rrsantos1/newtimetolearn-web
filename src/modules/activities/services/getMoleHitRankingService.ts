import api from "@/lib/api";

export interface MoleHitRankingEntry {
  position: number;
  studentName: string;
  score: number;
  elapsedSeconds: number;
  createdAt: string;
}

interface GetMoleHitRankingResponse {
  success: true;
  data: { ranking: MoleHitRankingEntry[] };
}

export const getMoleHitRankingService = {
  async execute(slug: string): Promise<MoleHitRankingEntry[]> {
    const response = await api.get<GetMoleHitRankingResponse>(
      `/activities/${encodeURIComponent(slug)}/mole-hit/ranking`,
    );
    return response.data.data.ranking;
  },
};
