import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useFormik } from "formik";
import axios from "axios";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  LoaderCircle,
  Mail,
  UserRound,
} from "lucide-react";
import api from "@/lib/api";
import { registerSchema } from "@/modules/auth/schemas/registerSchema";
import type { RegisterFormValues } from "@/modules/auth/schemas/registerSchema";
import type {
  ApiErrorResponse,
  RegisterResponse,
} from "@/modules/auth/types/auth.types";
import { PublicHeader } from "@/components/layout/PublicHeader";

const initialValues: RegisterFormValues = {
  name: "",
  email: "",
  password: "",
  role: "STUDENT",
};

export default function RegisterPage() {
  const [successMessage, setSuccessMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik<RegisterFormValues>({
    initialValues,
    validationSchema: registerSchema,
    onSubmit: async (values, helpers) => {
      setNotice("");
      setSuccessMessage("");

      try {
        const response = await api.post<RegisterResponse>(
          "/auth/register",
          {
            ...values,
            name: values.name.trim(),
            email: values.email.trim().toLowerCase(),
          },
        );

        setSuccessMessage(response.data.data.message);
        helpers.resetForm();
      } catch (error: unknown) {
        if (axios.isAxiosError<ApiErrorResponse>(error)) {
          const data = error.response?.data;

          if (data?.success === false) {
            if (data.error.code === "EMAIL_ALREADY_REGISTERED") {
              helpers.setFieldError(
                "email",
                "Este e-mail já está cadastrado.",
              );
              return;
            }

            if (data.error.code === "VERIFICATION_EMAIL_FAILED") {
              setNotice(data.error.message);
              return;
            }

            if (
              data.error.code === "VALIDATION_ERROR" &&
              data.error.details
            ) {
              for (const detail of data.error.details) {
                if (
                  detail.field === "name" ||
                  detail.field === "email" ||
                  detail.field === "password" ||
                  detail.field === "role"
                ) {
                  helpers.setFieldError(detail.field, detail.message);
                }
              }

              return;
            }

            setNotice(data.error.message);
            return;
          }

          setNotice(
            error.response
              ? "Não foi possível concluir o cadastro. Confira os dados e tente novamente."
              : "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
          );
          return;
        }

        setNotice("Ocorreu um erro inesperado. Tente novamente.");
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const getFieldClass = (field: keyof RegisterFormValues) => {
    const hasError =
      Boolean(formik.touched[field]) &&
      Boolean(formik.errors[field]);

    return [
      "mt-2 min-h-12 w-full rounded-xl border bg-white px-4 text-sm text-dark outline-none transition",
      "placeholder:text-zinc-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100",
      hasError ? "border-red-400" : "border-border",
    ].join(" ");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    setNotice("");
    void formik.handleSubmit(event);
  };

  if (successMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 py-12">
        <section className="w-full max-w-lg rounded-3xl border border-border bg-white p-7 text-center shadow-xl shadow-zinc-200/40 sm:p-10">
          <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-green-50 text-green-700">
            <CheckCircle2 size={32} aria-hidden="true" />
          </span>

          <h1 className="mt-6 text-2xl font-bold text-dark">
            Cadastro realizado!
          </h1>

          <p className="mt-3 leading-7 text-muted" role="status">
            {successMessage}
          </p>

          <p className="mt-4 text-sm leading-6 text-muted">
            Acesse sua caixa de entrada e siga as instruções enviadas para
            ativar sua conta.
          </p>

          <Link
            href="/"
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-dark transition hover:bg-primary-hover"
          >
            Voltar ao início
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <PublicHeader />

      <section className="mx-auto flex max-w-7xl justify-center px-5 py-10 sm:px-8 sm:py-16">
        <div className="w-full max-w-xl">
          <div className="mb-8 text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-yellow-100 text-dark">
              <GraduationCap size={28} aria-hidden="true" />
            </span>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-dark sm:text-4xl">
              Crie sua conta
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
              Comece sua jornada de aprendizagem com o TimeToLearn.
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-white p-6 shadow-xl shadow-zinc-200/40 sm:p-9">
            {notice && (
              <div
                className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
                role="alert"
              >
                {notice}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div>
                <label
                  htmlFor="name"
                  className="text-sm font-semibold text-dark"
                >
                  Nome completo
                </label>

                <div className="relative">
                  <UserRound
                    size={18}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Como podemos chamar você?"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    aria-invalid={
                      Boolean(formik.touched.name) &&
                      Boolean(formik.errors.name)
                    }
                    aria-describedby={
                      formik.touched.name && formik.errors.name
                        ? "name-error"
                        : undefined
                    }
                    className={`${getFieldClass("name")} pl-11`}
                  />
                </div>

                {formik.touched.name && formik.errors.name && (
                  <p id="name-error" className="mt-2 text-sm text-red-600">
                    {formik.errors.name}
                  </p>
                )}
              </div>

              <div className="mt-5">
                <label
                  htmlFor="email"
                  className="text-sm font-semibold text-dark"
                >
                  E-mail
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="voce@exemplo.com"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    aria-invalid={
                      Boolean(formik.touched.email) &&
                      Boolean(formik.errors.email)
                    }
                    aria-describedby={
                      formik.touched.email && formik.errors.email
                        ? "email-error"
                        : undefined
                    }
                    className={`${getFieldClass("email")} pl-11`}
                  />
                </div>

                {formik.touched.email && formik.errors.email && (
                  <p id="email-error" className="mt-2 text-sm text-red-600">
                    {formik.errors.email}
                  </p>
                )}
              </div>

              <div className="mt-5">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold text-dark"
                >
                  Senha
                </label>

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Crie uma senha com pelo menos 8 caracteres"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  aria-invalid={
                    Boolean(formik.touched.password) &&
                    Boolean(formik.errors.password)
                  }
                  aria-describedby={
                    formik.touched.password && formik.errors.password
                      ? "password-error"
                      : "password-help"
                  }
                  className={getFieldClass("password")}
                />

                <div className="mt-2 flex items-center justify-between gap-3">
                  <p id="password-help" className="text-xs text-muted">
                    Use entre 8 e 72 caracteres.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="text-xs font-semibold text-zinc-600 underline-offset-4 hover:text-dark hover:underline"
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>

                {formik.touched.password && formik.errors.password && (
                  <p
                    id="password-error"
                    className="mt-2 text-sm text-red-600"
                  >
                    {formik.errors.password}
                  </p>
                )}
              </div>

              <fieldset className="mt-6">
                <legend className="text-sm font-semibold text-dark">
                  Como você vai utilizar o TimeToLearn?
                </legend>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                      formik.values.role === "STUDENT"
                        ? "border-amber-400 bg-amber-50"
                        : "border-border hover:bg-zinc-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="STUDENT"
                      checked={formik.values.role === "STUDENT"}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="mt-1 accent-amber-500"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-dark">
                        Sou aluno
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-muted">
                        Quero aprender e realizar atividades.
                      </span>
                    </span>
                  </label>

                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                      formik.values.role === "TEACHER"
                        ? "border-amber-400 bg-amber-50"
                        : "border-border hover:bg-zinc-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="TEACHER"
                      checked={formik.values.role === "TEACHER"}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="mt-1 accent-amber-500"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-dark">
                        Sou professor
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-muted">
                        Quero organizar atividades de aprendizagem.
                      </span>
                    </span>
                  </label>
                </div>

                {formik.touched.role && formik.errors.role && (
                  <p className="mt-2 text-sm text-red-600">
                    {formik.errors.role}
                  </p>
                )}
              </fieldset>

              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 font-semibold text-dark transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:cursor-not-allowed disabled:opacity-60" style={{ color: "var(--primary-foreground)" }}
              >
                {formik.isSubmitting ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                    Criando sua conta...
                  </>
                ) : (
                  <>
                    Criar minha conta
                    <ArrowRight size={18} aria-hidden="true" />
                  </>
                )}
              </button>

              <p className="mt-5 text-center text-sm text-muted">
                Ao se cadastrar, você receberá um e-mail para ativar sua conta.
              </p>
            </form>

            <div className="mt-7 border-t border-border pt-6 text-center">
              <p className="text-sm text-muted">
                Já tem uma conta?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-dark underline decoration-amber-400 decoration-2 underline-offset-4 hover:text-amber-700"
                >
                  Entrar
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}