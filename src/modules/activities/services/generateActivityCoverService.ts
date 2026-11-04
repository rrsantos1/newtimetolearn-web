import api from "@/lib/api";

export interface GeneratedActivityCover {
  id: string;
  publicUrl: string;
  altText: string;
  fileName: string;
  storageKey: string;
  status: "APPROVED";
}

type GenerationStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "REVIEW_PENDING" | "FAILED";

interface CreateGenerationResponse {
  success: true;
  data: { jobId: string; status: "PENDING" };
}

interface GenerationStatusResponse {
  success: true;
  data: {
    jobId: string;
    status: GenerationStatus;
    message: string | null;
    errorCode: string | null;
    asset: GeneratedActivityCover | null;
  };
}

const POLL_INTERVAL_MS = 4_000;
const MAX_POLL_ATTEMPTS = 150;

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export const generateActivityCoverService = {
  async execute(
    prompt: string,
    onStatusChange?: (status: "PENDING" | "PROCESSING") => void,
  ): Promise<GeneratedActivityCover> {
    const created = await api.post<CreateGenerationResponse>(
      "/activities/ai/activity-cover",
      { prompt: prompt.trim() },
    );
    const { jobId } = created.data.data;
    onStatusChange?.("PENDING");

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
      await wait(POLL_INTERVAL_MS);
      const response = await api.get<GenerationStatusResponse>(
        `/activities/ai/activity-cover/${jobId}`,
      );
      const job = response.data.data;
      if (job.status === "PROCESSING") onStatusChange?.("PROCESSING");
      else if (job.status === "PENDING") onStatusChange?.("PENDING");

      if (job.status === "COMPLETED" && job.asset) return job.asset;

      if (job.status === "REVIEW_PENDING") {
        throw new Error(
          job.message ??
            "A imagem aguarda revisão administrativa e ainda não pode ser utilizada como capa.",
        );
      }

      if (job.status === "FAILED") {
        throw new Error(job.message ?? "Não foi possível gerar a capa. Tente novamente.");
      }
    }

    throw new Error(
      "A geração continua em processamento. Você pode continuar preenchendo a atividade e tentar novamente mais tarde.",
    );
  },
};
