import * as Yup from "yup";

function normalizeAnswer(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]/g, "")
    .toUpperCase();
}

export const createCrosswordSchema = Yup.object({
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
    .oneOf(["EASY", "MEDIUM", "HARD"], "Selecione uma dificuldade válida.")
    .required("Selecione a dificuldade."),
  timeLimitSeconds: Yup.number()
    .transform((value, originalValue) =>
      originalValue === "" || originalValue === null ? null : value,
    )
    .nullable()
    .optional()
    .integer("O tempo deve ser informado em segundos inteiros.")
    .positive("O tempo deve ser maior que zero."),
  words: Yup.array()
    .of(
      Yup.object({
        word: Yup.string()
          .trim()
          .required("Informe a resposta.")
          .max(100, "A resposta deve ter no máximo 100 caracteres.")
          .matches(/^[\p{L}\s-]+$/u, "Use apenas letras, espaços e hífens.")
          .test(
            "answer-length",
            "A resposta deve ter entre 2 e 25 letras, desconsiderando espaços e hífens.",
            (value) =>
              typeof value === "string" &&
              normalizeAnswer(value).length >= 2 &&
              normalizeAnswer(value).length <= 25,
          ),
        clue: Yup.string()
          .trim()
          .required("Informe a pista.")
          .max(500, "A pista deve ter no máximo 500 caracteres."),
      }).required(),
    )
    .required("Informe as respostas e pistas.")
    .min(3, "Informe pelo menos 3 respostas.")
    .max(20, "Informe no máximo 20 respostas.")
    .test(
      "unique-answers",
      "Existem respostas duplicadas na atividade.",
      (words) => {
        if (!Array.isArray(words)) return true;
        const normalized = words
          .filter((entry) => typeof entry?.word === "string" && entry.word.trim())
          .map((entry) => normalizeAnswer(entry.word));
        return new Set(normalized).size === normalized.length;
      },
    ),
});

export type CreateCrosswordFormValues = Yup.InferType<
  typeof createCrosswordSchema
>;
