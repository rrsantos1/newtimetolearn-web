import api from "@/lib/api";
import type {
  ActivityListResponse,
  ActivityListData,
} from "@/modules/activities/types/activityList.types";

const ENDPOINT = "/activities/";

export const listActivitiesService = {
  async execute(page = 1, limit = 20): Promise<ActivityListData> {
    const response = await api.get<ActivityListResponse>(ENDPOINT, {
      params: { page, limit },
    });

    return response.data.data;
  },
};