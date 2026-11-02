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
    });
    return response.data.data;
  },
};
