import api from "@/lib/api";
import type {
  EditableCrosswordActivity,
  GetCrosswordResponse,
} from "@/modules/activities/types/crossword.types";

export const getCrosswordService = {
  async execute(slug: string): Promise<EditableCrosswordActivity> {
    const response = await api.get<GetCrosswordResponse>(
      `/activities/${encodeURIComponent(slug)}`,
    );

    return response.data.data;
  },
};
