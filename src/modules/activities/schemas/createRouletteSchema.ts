import * as Yup from "yup";

export interface CreateRouletteFormValues {
  name: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  content: { topics: string[] };
}

export const createRouletteSchema = Yup.object({
  name: Yup.string().trim().required("Informe o nome da atividade.").max(120),
  description: Yup.string().max(2000).default(""),
  difficulty: Yup.mixed<"EASY" | "MEDIUM" | "HARD">().oneOf(["EASY", "MEDIUM", "HARD"]).required(),
  content: Yup.object({ topics: Yup.array().of(Yup.string().trim().min(2, "Informe um assunto com pelo menos 2 caracteres.").max(100)).min(2, "Cadastre pelo menos 2 assuntos.").max(30).required() }).required(),
});
