import api from "@/lib/api";
import type { CreateQuizFormValues } from "@/modules/activities/schemas/createQuizSchema";

interface QuizMutationResponse {
  success: true;
  data: {
    activity: { id: string; slug: string; type: string; status: string };
    version: { id: string; versionNumber: number; status: string; revision: number };
  };
}

export const updateQuizService = {
  async execute(slug: string, input: CreateQuizFormValues): Promise<QuizMutationResponse["data"]> {
    const response = await api.patch<QuizMutationResponse>(
      `/activities/${encodeURIComponent(slug)}/quiz`,
      {
        name: input.name.trim(),
        description: input.description?.trim() ?? null,
        difficulty: input.difficulty,
        timeLimitSeconds: input.timeLimitSeconds,
        content: {
          questions: input.content.questions.map((question) => ({
            ...question,
            statement: question.statement.trim(),
            explanation: question.explanation?.trim() ?? "",
            images: question.images ?? [],
            options: question.options.map((option) => ({
              ...option,
              text: option.text?.trim() ?? "",
              images: option.images ?? [],
            })),
          })),
        },
      },
    );
    return response.data.data;
  },
};
