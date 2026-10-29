import api from "@/lib/api";
import type {
  EditableWordSearchActivity,
  GetWordSearchActivityResponse,
} from "@/modules/activities/types/activities.types";

const ENDPOINT = "/activities/";

export const getWordSearchActivityService = {
  async execute(slug: string): Promise<EditableWordSearchActivity> {
    const response = await api.get<GetWordSearchActivityResponse>(
      `${ENDPOINT}${encodeURIComponent(slug)}`,
    );

    return response.data.data;
  },
};