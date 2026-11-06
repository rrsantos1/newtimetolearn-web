import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";

import api from "@/lib/api";
import type { ApiErrorResponse } from "@/modules/auth/types/auth.types";
import { PublicHeader } from "@/components/layout/PublicHeader";

const TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

const resetPasswordSchema = Yup.object({
  password: Yup.string()
    .min(8, "A senha deve ter pelo menos 8 caracteres.")
    .max(72, "A senha deve ter no máximo 72 caracteres.")
    .required("Informe sua nova senha."),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "As senhas não coincidem.")
    .required("Confirme sua nova senha."),
});

interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const token = router.query.token;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [notice, setNotice] = useState("");
  const [completed, setCompleted] = useState(false);

  const validToken =
    router.isReady && typeof token === "string" && TOKEN_PATTERN.test(token);

  const formik = useFormik<ResetPasswordFormValues>({
    initialValues: { password: "", confirmPassword: "" },
    validationSchema: resetPasswordSchema,
    onSubmit: async (values, helpers) => {
      setNotice("");

      if (!validToken || typeof token !== "string") {
        setNotice("O link de redefinição é inválido ou está incompleto.");
        helpers.setSubmitting(false);
        return;
      }

      try {
        const response = await api.post<{ success: true; data: { message: string } }>(
          "/auth/reset-password",
          { token, password: values.password },
        );

        setNotice(response.data.data.message);
        setCompleted(true);
        helpers.resetForm();
      } catch (error: unknown) {
        if (axios.isAxiosError<ApiErrorResponse>(error)) {
          const data = error.response?.data;
          setNotice(
            data?.success === false
              ? data.error.message
              : error.response
                ? "Não foi possível redefinir sua senha. O link pode ter expirado ou já ter sido utilizado."
                : "Não foi possível conectar ao servidor. Verifique sua conexão.",
          );
        } else {
          setNotice("Ocorreu um erro inesperado. Tente novamente.");
        }
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const fieldClass =
    "mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 text-sm text-dark outline-none transition placeholder:text-zinc-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100";

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <PublicHeader />

      <section className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
              {completed ? (
                <CheckCircle2 size={26} aria-hidden="true" />
              ) : (
                <KeyRound size={26} aria-hidden="true" />
              )}
            </span>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-dark sm:text-4xl">
              {completed ? "Senha redefinida!" : "Crie uma nova senha"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
              {completed
                ? "Sua senha foi atualizada. Agora você já pode entrar na sua conta."
                : "Escolha uma senha segura com pelo menos 8 caracteres."}
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-white p-6 shadow-xl shadow-zinc-200/40 sm:p-8">
            {notice && (
              <div
                className={`mb-6 rounded-xl border p-4 text-sm leading-6 ${
                  completed
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
                role="status"
                aria-live="polite"
              >
                {notice}
              </div>
            )}

            {!router.isReady ? (
              <div className="flex min-h-20 items-center justify-center text-sm text-muted">
                <LoaderCircle size={20} className="mr-2 animate-spin" aria-hidden="true" />
                Validando link...
              </div>
            ) : completed ? (
              <Link
                href="/login"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 font-semibold transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
                style={{ color: "var(--primary-foreground)" }}
              >
                Ir para o login
                <LockKeyhole size={18} aria-hidden="true" />
              </Link>
            ) : !validToken ? (
              <div>
                <p className="text-sm leading-6 text-red-700">
                  Este link não é válido. Solicite uma nova mensagem de recuperação.
                </p>
                <Link
                  href="/forgot-password"
                  className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-5 font-semibold transition hover:bg-primary-hover"
                  style={{ color: "var(--primary-foreground)" }}
                >
                  Solicitar novo link
                </Link>
              </div>
            ) : (
              <form
                noValidate
                onSubmit={(event) => {
                  setNotice("");
                  void formik.handleSubmit(event);
                }}
              >
                <div>
                  <label htmlFor="password" className="text-sm font-semibold text-dark">
                    Nova senha
                  </label>
                  <div className="relative">
                    <LockKeyhole
                      size={18}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                    />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      autoFocus
                      placeholder="Digite sua nova senha"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      aria-invalid={Boolean(formik.touched.password && formik.errors.password)}
                      aria-describedby={formik.touched.password && formik.errors.password ? "password-error" : undefined}
                      className={`${fieldClass} pl-11 pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
                    >
                      {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </button>
                  </div>
                  {formik.touched.password && formik.errors.password && (
                    <p id="password-error" className="mt-2 text-sm text-red-600">
                      {formik.errors.password}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted">Use entre 8 e 72 caracteres.</p>
                </div>

                <div className="mt-5">
                  <label htmlFor="confirmPassword" className="text-sm font-semibold text-dark">
                    Confirme a nova senha
                  </label>
                  <div className="relative">
                    <LockKeyhole
                      size={18}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                    />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmation ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Digite novamente sua senha"
                      value={formik.values.confirmPassword}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      aria-invalid={Boolean(formik.touched.confirmPassword && formik.errors.confirmPassword)}
                      aria-describedby={formik.touched.confirmPassword && formik.errors.confirmPassword ? "confirm-password-error" : undefined}
                      className={`${fieldClass} pl-11 pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmation((current) => !current)}
                      aria-label={showConfirmation ? "Ocultar confirmação" : "Mostrar confirmação"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
                    >
                      {showConfirmation ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </button>
                  </div>
                  {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                    <p id="confirm-password-error" className="mt-2 text-sm text-red-600">
                      {formik.errors.confirmPassword}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={formik.isSubmitting}
                  className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 font-semibold transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ color: "var(--primary-foreground)" }}
                >
                  {formik.isSubmitting ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      Redefinir senha
                      <KeyRound size={18} aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-7 border-t border-border pt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-dark underline decoration-amber-400 decoration-2 underline-offset-4 hover:text-amber-700"
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Voltar para o login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
