import * as Yup from "yup";

export interface CreateMoleHitFormValues {
  name: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  timeLimitSeconds: number;
  content: { holeCount: 6 | 9 | 12 };
  coverMediaAssetId?: string | null;
  coverImageUrl?: string | null;
  coverAltText?: string | null;
}

export const createMoleHitSchema = Yup.object({
  name: Yup.string().trim().required("Informe o nome da atividade.").max(120),
  description: Yup.string().max(2000).defined(),
  difficulty: Yup.mixed<"EASY" | "MEDIUM" | "HARD">().oneOf(["EASY", "MEDIUM", "HARD"]).required(),
  timeLimitSeconds: Yup.number().integer().min(10).max(300).required(),
  content: Yup.object({
    holeCount: Yup.number().oneOf([6, 9, 12]).required(),
  }).required(),
});
