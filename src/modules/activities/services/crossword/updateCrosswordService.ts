import api from "@/lib/api";
import type {
  CreateCrosswordInput,
  UpdateCrosswordResponse,
} from "@/modules/activities/types/crossword.types";

export const updateCrosswordService = {
  async execute(
    slug: string,
    input: CreateCrosswordInput,
  ): Promise<UpdateCrosswordResponse["data"]> {
    const response = await api.patch<UpdateCrosswordResponse>(
      `/activities/${encodeURIComponent(slug)}/crossword`,
      {
        name: input.name.trim(),
        description: input.description?.trim() ?? "",
        difficulty: input.difficulty,
        timeLimitSeconds: input.timeLimitSeconds,
        words: input.words.map((entry) => ({
          word: entry.word.trim(),
          clue: entry.clue.trim(),
        })),
      },
    );

    return response.data.data;
  },
};
