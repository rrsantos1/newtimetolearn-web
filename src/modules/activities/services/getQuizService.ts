import api from "@/lib/api";
import type { ActivityDifficulty } from "@/modules/activities/types/activities.types";

export interface EditableQuizActivity {
  slug: string;
  type: string;
  status: string;
  isOwner: boolean;
  version: {
    versionNumber: number;
    name: string;
    description: string | null;
    difficulty: ActivityDifficulty;
    timeLimitSeconds: number | null;
    status: string;
    revision: number;
    content: {
      questions?: unknown;
      [key: string]: unknown;
    };
    submittedAt: string | null;
    publishedAt: string | null;
    reviewFeedback: string | null;
  };
}

interface GetQuizResponse {
  success: true;
  data: EditableQuizActivity;
}

export const getQuizService = {
  async execute(slug: string): Promise<EditableQuizActivity> {
    const response = await api.get<GetQuizResponse>(`/activities/${encodeURIComponent(slug)}`);
    return response.data.data;
  },
};
