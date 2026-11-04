import * as Yup from "yup";
import type { MemoryItemValue } from "@/modules/activities/schemas/createMemorySchema";

export interface DragDropBaseValues {
  coverMediaAssetId?: string | null;
  coverImageUrl?: string | null;
  coverAltText?: string | null;
  name: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  timeLimitSeconds: number | null;
}

export interface WordMatchingPairValue {
  id: string;
  source: MemoryItemValue;
  target: MemoryItemValue;
}

export interface CreateWordMatchingFormValues extends DragDropBaseValues {
  content: { pairs: WordMatchingPairValue[] };
}

export type SentencePartValue =
  | { id: string; type: "text"; value: string }
  | { id: string; type: "blank"; expectedWordId: string };

export interface SentenceWordValue {
  id: string;
  text: string;
}

export interface SentenceValue {
  id: string;
  parts: SentencePartValue[];
}

export interface CreateSentenceCompletionFormValues extends DragDropBaseValues {
  content: {
    words: SentenceWordValue[];
    sentences: SentenceValue[];
  };
}

const baseFields = {
  name: Yup.string().trim().required("Informe o nome da atividade.").max(120),
  description: Yup.string().max(2000).default("").defined(),
  difficulty: Yup.mixed<DragDropBaseValues["difficulty"]>().oneOf(["EASY", "MEDIUM", "HARD"]).required(),
  timeLimitSeconds: Yup.number().nullable().integer().min(60).max(14400).defined(),
};

function isValidMatchingItem(item: unknown): item is MemoryItemValue {
  if (typeof item !== "object" || item === null || !("type" in item)) return false;
  if (item.type === "text") return "value" in item && typeof item.value === "string" && item.value.trim().length > 0 && item.value.trim().length <= 300;
  if (item.type === "image") return "storageKey" in item && typeof item.storageKey === "string" && item.storageKey.trim().length > 0 && "altText" in item && typeof item.altText === "string" && item.altText.length <= 250;
  return false;
}

function matchingItemKey(item: MemoryItemValue): string {
  return item.type === "text"
    ? `text:${item.value.trim().toLocaleLowerCase("pt-BR")}`
    : `image:${item.storageKey}`;
}

const matchingItemSchema = Yup.mixed<MemoryItemValue>().required().test(
  "valid-matching-item",
  "Preencha o texto ou selecione uma imagem aprovada.",
  isValidMatchingItem,
);

export const createWordMatchingSchema = Yup.object({
  ...baseFields,
  content: Yup.object({
    pairs: Yup.array().of(Yup.object({
      id: Yup.string().required().max(50),
      source: matchingItemSchema,
      target: matchingItemSchema,
    }).required()).min(3, "Adicione pelo menos 3 associações.").max(50, "O limite é de 50 associações.").required()
      .test("unique-pair-ids", "Cada associação precisa ter um identificador único.", (pairs) => {
        if (!pairs) return false;
        return new Set(pairs.map((pair) => pair?.id)).size === pairs.length;
      })
      .test("unique-sources-and-targets", "Os itens de origem e as correspondências precisam ser únicos.", (pairs) => {
        if (!pairs) return false;
        const sources = pairs.flatMap((pair) => pair && isValidMatchingItem(pair.source) ? [matchingItemKey(pair.source)] : []);
        const targets = pairs.flatMap((pair) => pair && isValidMatchingItem(pair.target) ? [matchingItemKey(pair.target)] : []);
        return new Set(sources).size === sources.length && new Set(targets).size === targets.length;
      }),
  }).required(),
});

export const createSentenceCompletionSchema = Yup.object({
  ...baseFields,
  content: Yup.object({
    words: Yup.array().of(Yup.object({
      id: Yup.string().required().max(50),
      text: Yup.string().trim().required("Informe a palavra.").max(150),
    }).required()).min(1, "Adicione pelo menos uma palavra.").max(200, "O limite é de 200 palavras.").required(),
    sentences: Yup.array().of(Yup.object({
      id: Yup.string().required().max(50),
      parts: Yup.array().of(Yup.mixed<SentencePartValue>().required()).min(2, "Inclua texto e pelo menos uma lacuna.").required()
        .test("has-blank", "Cada frase precisa ter pelo menos uma lacuna.", (parts) => parts?.some((part) => part.type === "blank") ?? false)
        .test("valid-blanks", "Selecione uma palavra para cada lacuna.", (parts) => parts?.every((part) => part.type !== "blank" || Boolean(part.expectedWordId)) ?? false),
    }).required()).min(1, "Adicione pelo menos uma frase.").max(100, "O limite é de 100 frases.").required(),
  }).required().test("valid-word-usage", "Cada palavra correta deve existir no banco e só pode ser usada uma vez.", (content) => {
    if (!content?.words || !content.sentences) return false;
    const wordIds = new Set(content.words.map((word) => word.id));
    const expectedIds = content.sentences.flatMap((sentence) => sentence.parts
      .filter((part): part is Extract<SentencePartValue, { type: "blank" }> => part.type === "blank")
      .map((part) => part.expectedWordId));
    return expectedIds.every((id) => wordIds.has(id)) && new Set(expectedIds).size === expectedIds.length;
  }),
});

export function createDragDropId(prefix: string): string {
  return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
