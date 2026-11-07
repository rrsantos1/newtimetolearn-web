import * as Yup from "yup";

export type MemoryItemValue =
  | { type: "text"; value: string }
  | { type: "image"; storageKey: string; altText: string; publicUrl?: string };

export interface MemoryPairValue {
  id: string;
  first: MemoryItemValue;
  second: MemoryItemValue;
}

export interface CreateMemoryFormValues {
  coverMediaAssetId?: string | null;
  coverImageUrl?: string | null;
  coverAltText?: string | null;
  name: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  content: { pairs: MemoryPairValue[] };
}

const memoryItemSchema = Yup.mixed<MemoryItemValue>().required().test(
  "valid-memory-item",
  "Preencha o texto ou selecione uma imagem aprovada.",
  (item) => {
    if (typeof item !== "object" || item === null || !("type" in item)) return false;
    if (item.type === "text") return "value" in item && typeof item.value === "string" && item.value.trim().length > 0 && item.value.trim().length <= 300;
    if (item.type === "image") return "storageKey" in item && typeof item.storageKey === "string" && item.storageKey.trim().length > 0 && "altText" in item && typeof item.altText === "string" && item.altText.length <= 250;
    return false;
  },
);

const memoryPairSchema = Yup.object({
  id: Yup.string().required("Identificador do par obrigatório.").max(50),
  first: memoryItemSchema,
  second: memoryItemSchema,
}).required();

export const createMemorySchema = Yup.object({
  name: Yup.string().trim().required("Informe o nome da atividade.").max(120),
  description: Yup.string().max(2000),
  difficulty: Yup.mixed<"EASY" | "MEDIUM" | "HARD">().oneOf(["EASY", "MEDIUM", "HARD"]).required(),
  timeLimitSeconds: Yup.number().nullable().integer().positive().defined(),
  content: Yup.object({
    pairs: Yup.array().of(memoryPairSchema).min(3, "Adicione pelo menos 3 pares.").max(50, "O limite é de 50 pares.").required()
      .test("unique-pair-ids", "Cada par precisa ter um identificador único.", (pairs) => {
        if (!pairs) return false;
        const ids = pairs.map((pair) => pair?.id);
        return new Set(ids).size === ids.length;
      }),
  }).required(),
});
