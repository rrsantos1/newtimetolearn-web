import api from "@/lib/api";
import type { ActivityListResponse, ActivityListData } from "@/modules/activities/types/activityList.types";
import type { ActivityListFilters } from "@/modules/activities/services/listActivitiesService";

export const listPublicActivitiesService = {
  async execute(filters: ActivityListFilters = {}): Promise<ActivityListData> {
    const response = await api.get<ActivityListResponse>("/activities/public", { params: filters });
    return response.data.data;
  },
};
