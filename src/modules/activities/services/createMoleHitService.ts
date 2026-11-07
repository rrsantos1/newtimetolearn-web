import api from "@/lib/api";
import type { CreateMoleHitFormValues } from "@/modules/activities/schemas/createMoleHitSchema";

interface MoleHitMutationResponse {
  success: true;
  data: {
    activity: { id: string; slug: string; type: "mole_hit"; status: string };
    version: { id: string; versionNumber: number; status: string };
  };
}

export const createMoleHitService = {
  async execute(input: CreateMoleHitFormValues): Promise<MoleHitMutationResponse["data"]> {
    const response = await api.post<MoleHitMutationResponse>("/activities/mole-hit", {
      name: input.name.trim(),
      description: input.description.trim() || null,
      difficulty: input.difficulty,
      timeLimitSeconds: input.timeLimitSeconds,
      content: input.content,
    });
    return response.data.data;
  },
};
