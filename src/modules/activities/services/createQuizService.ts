import api from "@/lib/api";
import type { CreateQuizFormValues } from "@/modules/activities/schemas/createQuizSchema";

interface CreatedQuiz {
  activity: { slug: string; type: "quiz" };
  version: { versionNumber: number; status: string };
}

interface CreateQuizResponse {
  success: true;
  data: CreatedQuiz;
}

export const createQuizService = {
  async execute(input: CreateQuizFormValues): Promise<CreatedQuiz> {
    const response = await api.post<CreateQuizResponse>("/activities/quiz", {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      difficulty: input.difficulty,
      timeLimitSeconds: input.timeLimitSeconds,
      content: {
        questions: input.content.questions.map((question) => ({
          ...question,
          statement: question.statement.trim(),
          explanation: question.explanation?.trim() ?? "",
          options: question.options.map((option) => ({
            ...option,
            text: option.text?.trim() ?? "",
            images: option.images ?? [],
          })),
          images: question.images ?? [],
        })),
      },
    });

    return response.data.data;
  },
};
