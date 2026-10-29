import * as Yup from "yup";

export const updateUserProfileSchema = Yup.object({
  name: Yup.string()
    .trim()
    .min(2, "Informe pelo menos 2 caracteres.")
    .max(120, "O nome deve ter no máximo 120 caracteres.")
    .required("Informe seu nome."),
});

export type UpdateUserProfileFormValues = Yup.InferType<
  typeof updateUserProfileSchema
>;