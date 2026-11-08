import api from "@/lib/api";
import type { CreateRouletteFormValues } from "@/modules/activities/schemas/createRouletteSchema";

interface CreateRouletteResponse {
  success: true;
  data: { activity: { id: string; slug: string; type: "roulette"; status: string }; version: { id: string; versionNumber: number; status: string } };
}

export const createRouletteService = {
  async execute(values: CreateRouletteFormValues): Promise<CreateRouletteResponse["data"]> {
    const response = await api.post<CreateRouletteResponse>("/activities/roulette", {
      name: values.name.trim(),
      description: values.description.trim() || null,
      difficulty: values.difficulty,
      content: { topics: values.content.topics.map((topic) => topic.trim()) },
    });
    return response.data.data;
  },
};
