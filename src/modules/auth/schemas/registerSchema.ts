import * as Yup from "yup";

export const registerSchema = Yup.object({
  name: Yup.string()
    .trim()
    .min(2, "Informe pelo menos 2 caracteres.")
    .max(120, "O nome deve ter no máximo 120 caracteres.")
    .required("Informe seu nome."),

  email: Yup.string()
    .trim()
    .email("Informe um e-mail válido.")
    .required("Informe seu e-mail."),

  password: Yup.string()
    .min(8, "A senha deve ter pelo menos 8 caracteres.")
    .max(72, "A senha deve ter no máximo 72 caracteres.")
    .required("Informe sua senha."),

  role: Yup.mixed<"STUDENT" | "TEACHER">()
    .oneOf(["STUDENT", "TEACHER"], "Selecione um perfil.")
    .required("Selecione seu perfil."),
});

export type RegisterFormValues = Yup.InferType<
  typeof registerSchema
>;