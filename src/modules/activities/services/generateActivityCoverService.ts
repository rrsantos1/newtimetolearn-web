import api from "@/lib/api";

export interface GeneratedActivityCover {
  id: string;
  publicUrl: string;
  altText: string;
  fileName: string;
  storageKey: string;
  status: "APPROVED" | "PENDING_REVIEW";
}

interface GenerateActivityCoverResponse {
  success: true;
  data: GeneratedActivityCover & { message?: string };
}

export const generateActivityCoverService = {
  async execute(prompt: string): Promise<GeneratedActivityCover> {
    const response = await api.post<GenerateActivityCoverResponse>(
      "/activities/ai/activity-cover",
      { prompt: prompt.trim() },
    );

    if (response.data.data.status !== "APPROVED") {
      throw new Error(
        response.data.data.message ??
          "A imagem está aguardando revisão administrativa e ainda não pode ser usada.",
      );
    }

    return response.data.data;
  },
};
