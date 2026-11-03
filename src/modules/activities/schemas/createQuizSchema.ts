import * as Yup from "yup";

const imageSchema = Yup.object({
  storageKey: Yup.string().trim().required("A imagem precisa ter uma referência válida.").max(500),
  altText: Yup.string().trim().max(250).default(""),
  publicUrl: Yup.string().url().optional(),
});

const optionSchema = Yup.object({
  id: Yup.string().required("Identificador da alternativa obrigatório.").max(50),
  text: Yup.string().trim().max(1000, "O texto deve ter no máximo 1000 caracteres.").optional().default(""),
  images: Yup.array().of(imageSchema).max(5, "Use no máximo 5 imagens por alternativa.").default([]),
}).test(
  "option-has-content",
  "Preencha o texto da alternativa ou adicione uma imagem.",
  function (option) {
    if (option?.text?.trim() || (option?.images?.length ?? 0) > 0) return true;
    return this.createError({ path: `${this.path}.text`, message: "Preencha o texto da alternativa ou adicione uma imagem." });
  },
);

const questionSchema = Yup.object({
  id: Yup.string().required().max(50),
  statement: Yup.string().trim().required("Informe o enunciado da questão.").max(2000, "O enunciado deve ter no máximo 2000 caracteres."),
  images: Yup.array().of(imageSchema).max(5, "Use no máximo 5 imagens por enunciado.").default([]),
  options: Yup.array()
    .of(optionSchema)
    .required()
    .min(3, "A questão precisa ter pelo menos 3 alternativas.")
    .max(6, "Use no máximo 6 alternativas.")
    .default([]),
  correctOptionId: Yup.string().required("Marque uma alternativa correta."),
  explanation: Yup.string().trim().max(2000).default(""),
}).test(
  "correct-option-exists",
  "A resposta correta deve corresponder a uma alternativa.",
  function (question) {
    if (question?.correctOptionId && question.options?.some((option) => option?.id === question.correctOptionId)) return true;
    return this.createError({ path: `${this.path}.correctOptionId`, message: "Marque uma alternativa correta válida." });
  },
);

export const createQuizSchema = Yup.object({
  coverMediaAssetId: Yup.string().uuid().nullable().optional(),
  coverImageUrl: Yup.string().url().nullable().optional(),
  coverAltText: Yup.string().nullable().optional(),
  name: Yup.string().trim().required("Informe o nome do Quiz.").max(120, "O nome deve ter no máximo 120 caracteres."),
  description: Yup.string().trim().max(2000).optional(),
  difficulty: Yup.string().oneOf(["EASY", "MEDIUM", "HARD"]).required("Selecione a dificuldade."),
  timeLimitSeconds: Yup.number().nullable().integer().positive().optional(),
  content: Yup.object({
    questions: Yup.array().of(questionSchema).required().min(1, "Adicione pelo menos uma questão.").max(1000).default([]),
  }).required(),
});

export type CreateQuizFormValues = Yup.InferType<typeof createQuizSchema>;
