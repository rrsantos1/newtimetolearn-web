import api from "@/lib/api";
import type { ActivityVisibility } from "@/modules/activities/types/activityList.types";

export const updateActivityVisibilityService = {
  async execute(slug: string, visibility: ActivityVisibility): Promise<void> {
    await api.patch(`/activities/${encodeURIComponent(slug)}/visibility`, { visibility });
  },
};
