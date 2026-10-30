import api from "@/lib/api";
import type {
  ActivityDifficulty,
  ActivityType,
  ActivityListResponse,
  ActivityListData,
} from "@/modules/activities/types/activityList.types";

const ENDPOINT = "/activities/";

export type ActivityListScope = "mine" | "explore" | "all";

export interface ActivityListFilters {
  page?: number;
  limit?: number;
  scope?: ActivityListScope;
  search?: string;
  type?: ActivityType;
  difficulty?: ActivityDifficulty;
}

export const listActivitiesService = {
  async execute(
    page = 1,
    limit = 20,
    scope: ActivityListScope = "mine",
    filters: Omit<ActivityListFilters, "page" | "limit" | "scope"> = {},
  ): Promise<ActivityListData> {
    const response = await api.get<ActivityListResponse>(ENDPOINT, {
      params: { page, limit, scope, ...filters },
    });

    return response.data.data;
  },
};
