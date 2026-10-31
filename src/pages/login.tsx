import { useState } from "react";
import Link from "next/link";
import { useFormik } from "formik";
import axios from "axios";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react";
import api from "@/lib/api";
import * as Yup from "yup";
import type {
  ApiErrorResponse,
  LoginResponse,
} from "@/modules/auth/types/auth.types";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { useRouter } from "next/router";
import { PublicHeader } from "@/components/layout/PublicHeader";

const loginSchema = Yup.object({
  email: Yup.string()
    .trim()
    .email("Informe um e-mail válido.")
    .required("Informe seu e-mail."),
  password: Yup.string()
    .required("Informe sua senha."),
});

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const { setSession } = useAuth();
  const router = useRouter();

  const formik = useFormik<LoginFormValues>({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: loginSchema,
    onSubmit: async (values, helpers) => {
      setNotice("");

      try {
        const response = await api.post<LoginResponse>("/auth/login", {
          email: values.email.trim().toLowerCase(),
          password: values.password,
        });

        const loginData = response.data.data;

        setSession(loginData.accessToken, loginData.user);

        await router.replace("/dashboard");
      } catch (error: unknown) {
        if (axios.isAxiosError<ApiErrorResponse>(error)) {
          const data = error.response?.data;

          if (data?.success === false) {
            switch (data.error.code) {
              case "INVALID_CREDENTIALS":
                setNotice("E-mail ou senha inválidos.");
                break;
              case "EMAIL_NOT_VERIFIED":
                setNotice(
                  "Confirme seu e-mail antes de entrar. Acesse o link enviado para sua caixa de entrada.",
                );
                break;
              case "ACCOUNT_BLOCKED":
                setNotice(
                  "Esta conta está bloqueada. Entre em contato com o suporte.",
                );
                break;
              default:
                setNotice(data.error.message);
            }
          } else {
            setNotice(
              error.response
                ? "Não foi possível realizar o login. Tente novamente."
                : "Não foi possível conectar ao servidor. Verifique sua conexão.",
            );
          }

          return;
        }

        setNotice("Ocorreu um erro inesperado. Tente novamente.");
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
            <h1 className="text-3xl font-bold tracking-tight text-dark sm:text-4xl">
              Bem-vindo de volta
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
              Entre na sua conta para continuar.
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-white p-6 shadow-xl shadow-zinc-200/40 sm:p-8">
            {notice && (
              <div
                className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
                role="alert"
              >
                {notice}

                {notice.includes("Confirme seu e-mail") && (
                  <p className="mt-2">
                    Se precisar de outro link, volte à página de verificação
                    ou solicite um novo envio.
                  </p>
                )}
              </div>
            )}

            <form
              noValidate
              onSubmit={(event) => {
                setNotice("");
                void formik.handleSubmit(event);
              }}
            >
              <div>
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
                    className={`${fieldClass} pl-11`}
                  />
                </div>
                {formik.touched.email && formik.errors.email && (
                  <p className="mt-2 text-sm text-red-600">
                    {formik.errors.email}
                  </p>
                )}
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-dark"
                  >
                    Senha
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-zinc-600 underline-offset-4 hover:text-dark hover:underline"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>

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
                    autoComplete="current-password"
                    placeholder="Digite sua senha"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    aria-invalid={
                      Boolean(formik.touched.password) &&
                      Boolean(formik.errors.password)
                    }
                    className={`${fieldClass} pl-11 pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-dark"
                  >
                    {showPassword ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>
                {formik.touched.password && formik.errors.password && (
                  <p className="mt-2 text-sm text-red-600">
                    {formik.errors.password}
                  </p>
                )}
              </div>

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
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar
                    <ArrowRight size={18} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-7 border-t border-border pt-6 text-center">
              <p className="text-sm text-muted">
                Ainda não tem uma conta?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-dark underline decoration-amber-400 decoration-2 underline-offset-4 hover:text-amber-700"
                >
                  Cadastre-se
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}