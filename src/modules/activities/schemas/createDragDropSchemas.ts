import * as Yup from "yup";

export interface DragDropBaseValues {
  name: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  timeLimitSeconds: number | null;
}

export interface WordMatchingPairValue {
  id: string;
  source: string;
  target: string;
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

export const createWordMatchingSchema = Yup.object({
  ...baseFields,
  content: Yup.object({
    pairs: Yup.array().of(Yup.object({
      id: Yup.string().required().max(50),
      source: Yup.string().trim().required("Informe a palavra de origem.").max(500),
      target: Yup.string().trim().required("Informe a correspondência.").max(500),
    }).required()).min(3, "Adicione pelo menos 3 associações.").max(50, "O limite é de 50 associações.").required()
      .test("unique-pair-ids", "Cada associação precisa ter um identificador único.", (pairs) => {
        if (!pairs) return false;
        return new Set(pairs.map((pair) => pair?.id)).size === pairs.length;
      })
      .test("unique-sources-and-targets", "As palavras de origem e as correspondências precisam ser únicas.", (pairs) => {
        if (!pairs) return false;
        const sources = pairs.flatMap((pair) =>
          typeof pair?.source === "string" && pair.source.trim().length > 0
            ? [pair.source.trim().toLocaleLowerCase("pt-BR")]
            : [],
        );
        const targets = pairs.flatMap((pair) =>
          typeof pair?.target === "string" && pair.target.trim().length > 0
            ? [pair.target.trim().toLocaleLowerCase("pt-BR")]
            : [],
        );
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
