import api from "@/lib/api";
import type { ActivityDifficulty } from "@/modules/activities/types/activities.types";

export interface EditableMemoryActivity {
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
    content: { pairs?: unknown; [key: string]: unknown };
    submittedAt: string | null;
    publishedAt: string | null;
    reviewFeedback: string | null;
  };
}

interface Response { success: true; data: EditableMemoryActivity; }

export const getMemoryService = {
  async execute(slug: string): Promise<EditableMemoryActivity> {
    const response = await api.get<Response>(`/activities/${encodeURIComponent(slug)}`);
    return response.data.data;
  },
};
