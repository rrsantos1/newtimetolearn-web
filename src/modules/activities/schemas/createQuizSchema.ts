import * as Yup from "yup";

const imageSchema = Yup.object({
  storageKey: Yup.string().trim().required().max(500),
  altText: Yup.string().trim().max(250).default(""),
});

const optionSchema = Yup.object({
  id: Yup.string().required().max(50),
  text: Yup.string().trim().max(1000).when("images", {
    is: (images: unknown[]) => !Array.isArray(images) || images.length === 0,
    then: (schema) => schema.required("Informe o texto ou adicione uma imagem."),
    otherwise: (schema) => schema.optional(),
  }),
  images: Yup.array().of(imageSchema).max(5).default([]),
});

const questionSchema = Yup.object({
  id: Yup.string().required().max(50),
  statement: Yup.string().trim().required("Informe o enunciado.").max(2000),
  images: Yup.array().of(imageSchema).max(5).default([]),
  options: Yup.array().of(optionSchema).required().min(3, "Adicione pelo menos 3 alternativas.").max(6, "Use no máximo 6 alternativas."),
  correctOptionId: Yup.string().required("Marque a alternativa correta."),
  explanation: Yup.string().trim().max(2000).default(""),
}).test("correct-option-exists", "A resposta correta deve corresponder a uma alternativa.", (question) => {
  if (!question?.options) return false;
  return question.options.some((option) => option?.id === question.correctOptionId);
});

export const createQuizSchema = Yup.object({
  name: Yup.string().trim().required("Informe o nome do Quiz.").max(120),
  description: Yup.string().trim().max(2000).optional(),
  difficulty: Yup.string().oneOf(["EASY", "MEDIUM", "HARD"]).required(),
  timeLimitSeconds: Yup.number().nullable().integer().positive().optional(),
  content: Yup.object({
    questions: Yup.array().of(questionSchema).required().min(1, "Adicione pelo menos uma questão.").max(1000),
  }).required(),
});

export type CreateQuizFormValues = Yup.InferType<typeof createQuizSchema>;
