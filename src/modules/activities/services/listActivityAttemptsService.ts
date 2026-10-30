import api from "@/lib/api";

export interface ActivityAttemptHistoryItem {
  id: string;
  studentName: string;
  score: number;
  accuracyPoints: number;
  speedPoints: number;
  totalWords: number;
  wordsFound: string[];
  elapsedSeconds: number;
  createdAt: string;
}

export interface ActivityAttemptHistoryData {
  items: ActivityAttemptHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ActivityAttemptHistoryResponse {
  success: true;
  data: ActivityAttemptHistoryData;
}

export const listActivityAttemptsService = {
  async execute(
    slug: string,
    page = 1,
    limit = 20,
  ): Promise<ActivityAttemptHistoryData> {
    const response = await api.get<ActivityAttemptHistoryResponse>(
      `/activities/${encodeURIComponent(slug)}/attempts`,
      { params: { page, limit } },
    );

    return response.data.data;
  },
};
