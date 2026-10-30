import api from "@/lib/api";
import type {
  CreateCrosswordInput,
  CreateCrosswordResponse,
} from "@/modules/activities/types/crossword.types";

export const createCrosswordService = {
  async execute(
    input: CreateCrosswordInput,
  ): Promise<CreateCrosswordResponse["data"]> {
    const response = await api.post<CreateCrosswordResponse>(
      "/activities/crossword",
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
