import api from "@/lib/api";

export interface ActivityAttemptHistoryItem {
  id: string;
  studentName: string;
  score: number;
  accuracyPoints?: number;
  totalWords?: number;
  wordsFound?: string[];
  totalBlanks?: number;
  correctBlanks?: number;
  createdAt: string;
}

export interface ActivityAttemptHistoryData {
  activityType: "listening" | "standard";
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
  data: Omit<ActivityAttemptHistoryData, "activityType">;
}

interface ActivityTypeResponse {
  success: true;
  data: { type: string };
}

interface ListeningAttemptHistoryResponse {
  success: true;
  data: Omit<ActivityAttemptHistoryData, "activityType">;
}

export const listActivityAttemptsService = {
  async execute(
    slug: string,
    page = 1,
    limit = 20,
  ): Promise<ActivityAttemptHistoryData> {
    const encodedSlug = encodeURIComponent(slug);
    const activityResponse = await api.get<ActivityTypeResponse>(`/activities/${encodedSlug}`);

    if (activityResponse.data.data.type === "listening") {
      const response = await api.get<ListeningAttemptHistoryResponse>(
        `/activities/${encodedSlug}/listening/attempts`,
        { params: { page, limit } },
      );
      return { ...response.data.data, activityType: "listening" };
    }

    const response = await api.get<ActivityAttemptHistoryResponse>(
      `/activities/${encodedSlug}/attempts`,
      { params: { page, limit } },
    );

    return { ...response.data.data, activityType: "standard" };
  },
};
