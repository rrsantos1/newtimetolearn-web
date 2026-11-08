import * as Yup from "yup";

export interface HangmanWordForm { id: string; word: string; clue: string; imageUrl: string | null; imageAlt: string; coverMediaAssetId?: string | null; coverImageUrl?: string | null; coverAltText?: string | null; }
export interface CreateHangmanFormValues {
  name: string; description: string; difficulty: "EASY" | "MEDIUM" | "HARD";
  content: { words: HangmanWordForm[] };
  coverMediaAssetId?: string | null; coverImageUrl?: string | null; coverAltText?: string | null;
}

export const createHangmanSchema = Yup.object({
  name: Yup.string().trim().required("Informe o nome da atividade.").max(120),
  description: Yup.string().max(2000).default(""),
  difficulty: Yup.mixed<"EASY" | "MEDIUM" | "HARD">().oneOf(["EASY", "MEDIUM", "HARD"]).required(),
  content: Yup.object({
    words: Yup.array().of(Yup.object({
      id: Yup.string().transform((value) => value || undefined).uuid().optional(),
      word: Yup.string().trim().required("Informe a palavra.").max(50).test("letter-limit", "A palavra deve ter até 20 letras.", (value) => (value ?? "").replace(/[\\s-]/g, "").length <= 20),
      clue: Yup.string().trim().required("Informe uma dica.").min(3).max(240),
      imageUrl: Yup.string().trim().max(2048).default("").test("optional-url", "Informe uma URL válida.", (value) => !value || /^(https?):\/\//i.test(value)),
      imageAlt: Yup.string().max(180).default(""),
      coverMediaAssetId: Yup.string().nullable().optional(),
      coverImageUrl: Yup.string().nullable().optional(),
      coverAltText: Yup.string().nullable().optional(),
    }).required()).min(1, "Cadastre pelo menos 1 palavra.").max(30).required(),
  }).required(),
});
