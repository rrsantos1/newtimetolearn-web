import api from "@/lib/api";
import type {
  CreateWordSearchInput,
  CreateWordSearchResponse,
} from "@/modules/activities/types/activities.types";

const ENDPOINT = "/activities/";

export const updateWordSearchActivityService = {
  async execute(
    slug: string,
    input: CreateWordSearchInput,
  ): Promise<CreateWordSearchResponse["data"]> {
    const response = await api.patch<CreateWordSearchResponse>(
      `${ENDPOINT}${encodeURIComponent(slug)}`,
      {
        name: input.name.trim(),
        description: input.description?.trim() || undefined,
        difficulty: input.difficulty,
        timeLimitSeconds: input.timeLimitSeconds,
        words: input.words.map((word) => word.trim()),
      },
    );

    return response.data.data;
  },
};