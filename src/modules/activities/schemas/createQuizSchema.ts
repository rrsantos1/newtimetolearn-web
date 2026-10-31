import * as Yup from "yup";

const imageSchema = Yup.object({
  storageKey: Yup.string().trim().required().max(500),
  altText: Yup.string().trim().max(250).default(""),
  publicUrl: Yup.string().url().optional(),
});

const optionSchema = Yup.object({
  id: Yup.string().required().max(50),
  text: Yup.string().trim().max(1000).optional().default(""),
  images: Yup.array().of(imageSchema).max(5).default([]),
});

const questionSchema = Yup.object({
  id: Yup.string().required().max(50),
  statement: Yup.string().trim().max(2000).optional().default(""),
  images: Yup.array().of(imageSchema).max(5).default([]),
  options: Yup.array().of(optionSchema).required().max(6, "Use no máximo 6 alternativas.").default([]),
  correctOptionId: Yup.string().optional().default(""),
  explanation: Yup.string().trim().max(2000).default(""),
}).test("correct-option-exists", "A resposta correta deve corresponder a uma alternativa.", (question) => {
  if (!question?.correctOptionId) return true;
  return question.options?.some((option) => option?.id === question.correctOptionId) ?? false;
});

export const createQuizSchema = Yup.object({
  name: Yup.string().trim().required("Informe o nome do Quiz.").max(120),
  description: Yup.string().trim().max(2000).optional(),
  difficulty: Yup.string().oneOf(["EASY", "MEDIUM", "HARD"]).required(),
  timeLimitSeconds: Yup.number().nullable().integer().positive().optional(),
  content: Yup.object({
    questions: Yup.array().of(questionSchema).required().max(1000).default([]),
  }).required(),
});

export type CreateQuizFormValues = Yup.InferType<typeof createQuizSchema>;
