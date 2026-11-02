import api from "@/lib/api";
import type { CreateMemoryFormValues } from "@/modules/activities/schemas/createMemorySchema";

interface MemoryMutationResponse {
  success: true;
  data: {
    activity: { id: string; slug: string; type: "memory"; status: string };
    version: { id: string; versionNumber: number; status: string };
  };
}

export const createMemoryService = {
  async execute(input: CreateMemoryFormValues): Promise<MemoryMutationResponse["data"]> {
    const response = await api.post<MemoryMutationResponse>("/activities/memory", {
      ...input,
      name: input.name.trim(),
      description: input.description.trim() || null,
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
