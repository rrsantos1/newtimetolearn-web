import * as Yup from "yup";

export interface CreateMoleHitFormValues {
  name: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  timeLimitSeconds: number;
  content: {
    holeCount: 6 | 9 | 12;
    correctOptions: string[];
    incorrectOptions: string[];
  };
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
    correctOptions: Yup.array().of(Yup.string().trim().min(1).max(80).required()).compact((option) => !option?.trim()).min(2, "Cadastre pelo menos 2 opções corretas.").max(30).required(),
    incorrectOptions: Yup.array().of(Yup.string().trim().min(1).max(80).required()).compact((option) => !option?.trim()).min(2, "Cadastre pelo menos 2 opções incorretas.").max(30).required(),
  }).required(),
});
