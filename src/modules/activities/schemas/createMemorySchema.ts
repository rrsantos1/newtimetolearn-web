import * as Yup from "yup";

export type MemoryItemValue =
  | { type: "text"; value: string }
  | { type: "image"; storageKey: string; altText: string };

export interface MemoryPairValue {
  id: string;
  first: MemoryItemValue;
  second: MemoryItemValue;
}

export interface CreateMemoryFormValues {
  name: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  timeLimitSeconds: number | null;
  content: { pairs: MemoryPairValue[] };
}

export const createMemorySchema = Yup.object({
  name: Yup.string().trim().required("Informe o nome da atividade.").max(120),
  description: Yup.string().max(2000),
  difficulty: Yup.mixed<"EASY" | "MEDIUM" | "HARD">().oneOf(["EASY", "MEDIUM", "HARD"]).required(),
  timeLimitSeconds: Yup.number().nullable().integer().positive().required(),
  content: Yup.object({
    pairs: Yup.array().of(Yup.object({
      id: Yup.string().required(),
      first: Yup.object().required(),
      second: Yup.object().required(),
    })).min(3, "Adicione pelo menos 3 pares.").max(50, "O limite é de 50 pares.").required(),
  }).required(),
});
