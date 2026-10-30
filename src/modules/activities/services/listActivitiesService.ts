import api from "@/lib/api";
import type {
  ActivityListResponse,
  ActivityListData,
} from "@/modules/activities/types/activityList.types";

const ENDPOINT = "/activities/";

export type ActivityListScope = "mine" | "explore" | "all";

export const listActivitiesService = {
  async execute(
    page = 1,
    limit = 20,
    scope: ActivityListScope = "mine",
  ): Promise<ActivityListData> {
    const response = await api.get<ActivityListResponse>(ENDPOINT, {
      params: { page, limit, scope },
    });

    return response.data.data;
  },
};
