import api from "@/lib/api";
import type { CreateMemoryFormValues } from "@/modules/activities/schemas/createMemorySchema";

interface Response {
  success: true;
  data: {
    activity: { id: string; slug: string; type: string; status: string };
    version: { id: string; versionNumber: number; status: string; revision: number };
  };
}

export const updateMemoryService = {
  async execute(slug: string, input: CreateMemoryFormValues): Promise<Response["data"]> {
    const response = await api.patch<Response>(`/activities/${encodeURIComponent(slug)}/memory`, {
      name: input.name.trim(),
      description: input.description.trim() || null,
      difficulty: input.difficulty,
      timeLimitSeconds: input.timeLimitSeconds,
      content: {
        pairs: input.content.pairs.map((pair) => ({
          id: pair.id,
          first: pair.first.type === "text"
            ? { type: "text", value: pair.first.value.trim() }
            : { type: "image", storageKey: pair.first.storageKey, altText: pair.first.altText.trim() },
          second: pair.second.type === "text"
            ? { type: "text", value: pair.second.value.trim() }
            : { type: "image", storageKey: pair.second.storageKey, altText: pair.second.altText.trim() },
        })),
      },
    });
    return response.data.data;
  },
};
