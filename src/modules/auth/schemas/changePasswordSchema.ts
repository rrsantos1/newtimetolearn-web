import * as Yup from "yup";

export const changePasswordSchema = Yup.object({
  currentPassword: Yup.string()
    .required("Informe sua senha atual.")
    .max(72, "A senha deve ter no máximo 72 caracteres."),

  newPassword: Yup.string()
    .required("Informe a nova senha.")
    .min(8, "A nova senha deve ter pelo menos 8 caracteres.")
    .max(72, "A senha deve ter no máximo 72 caracteres.")
    .notOneOf(
      [Yup.ref("currentPassword")],
      "A nova senha deve ser diferente da senha atual.",
    ),

  confirmPassword: Yup.string()
    .required("Confirme sua nova senha.")
    .oneOf([Yup.ref("newPassword")], "As senhas não coincidem."),
});