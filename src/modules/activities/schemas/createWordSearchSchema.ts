import * as Yup from "yup";

function normalizeWord(word: unknown): string {
  if (typeof word !== "string") {
    return "";
  }

  return word
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]/g, "")
    .toUpperCase();
}

export const createWordSearchSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required("Informe o nome da atividade.")
    .min(3, "O nome deve ter pelo menos 3 caracteres.")
    .max(120, "O nome deve ter no máximo 120 caracteres."),

  description: Yup.string()
    .trim()
    .max(2000, "A descrição deve ter no máximo 2.000 caracteres.")
    .optional(),

  difficulty: Yup.string()
    .oneOf(
      ["EASY", "MEDIUM", "HARD"],
      "Selecione uma dificuldade válida.",
    )
    .required("Selecione a dificuldade."),

  timeLimitSeconds: Yup.number()
    .transform((value, originalValue) => {
      return originalValue === "" || originalValue === null
        ? null
        : value;
    })
    .nullable()
    .optional()
    .integer("O tempo deve ser informado em segundos inteiros.")
    .positive("O tempo deve ser maior que zero."),

  words: Yup.array()
    .of(
      Yup.string()
        .trim()
        .required("Informe uma palavra.")
        .max(50, "Cada palavra deve ter no máximo 50 caracteres.")
        .matches(
          /^[\p{L}\s-]+$/u,
          "Use apenas letras, espaços e hífens.",
        )
        .test(
          "word-length",
          "Cada palavra deve ter entre 2 e 20 letras, desconsiderando espaços e hífens.",
          (word) => {
            if (typeof word !== "string" || word.trim().length === 0) {
              return false;
            }

            const normalized = normalizeWord(word);

            return normalized.length >= 2 && normalized.length <= 20;
          },
        ),
    )
    .required("Informe as palavras da atividade.")
    .min(3, "Informe pelo menos 3 palavras.")
    .max(30, "Informe no máximo 30 palavras.")
    .test(
      "unique-words",
      "Existem palavras duplicadas na atividade.",
      (words) => {
        if (!Array.isArray(words)) {
          return true;
        }

        const normalizedWords = words
          .filter(
            (word): word is string =>
              typeof word === "string" && word.trim().length > 0,
          )
          .map(normalizeWord);

        return new Set(normalizedWords).size === normalizedWords.length;
      },
    ),
});

export type CreateWordSearchFormValues = Yup.InferType<
  typeof createWordSearchSchema
>;