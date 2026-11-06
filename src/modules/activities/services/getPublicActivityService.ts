import api from "@/lib/api";
import type { GetActivityResponse } from "@/modules/activities/types/activity.types";

export const getPublicActivityService = {
  async execute(slug: string): Promise<GetActivityResponse["data"]> {
    const response = await api.get<GetActivityResponse>(`/activities/public/${encodeURIComponent(slug)}`);
    return response.data.data;
  },
};
