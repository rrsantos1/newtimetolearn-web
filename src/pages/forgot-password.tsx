import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ArrowLeft, CheckCircle2, LoaderCircle, Mail, Send } from "lucide-react";

import api from "@/lib/api";
import type { ApiErrorResponse } from "@/modules/auth/types/auth.types";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { useTranslation } from "@/hooks/useTranslation";

const forgotPasswordSchema = Yup.object({
  email: Yup.string()
    .trim()
    .email("Informe um e-mail válido.")
    .required("Informe seu e-mail."),
});

interface ForgotPasswordFormValues {
  email: string;
}

export default function ForgotPasswordPage() {
  const [notice, setNotice] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { t } = useTranslation();

  const formik = useFormik<ForgotPasswordFormValues>({
    initialValues: { email: "" },
    validationSchema: forgotPasswordSchema,
    onSubmit: async (values, helpers) => {
      setNotice("");
      setSubmitted(false);

      try {
        const response = await api.post<{ success: true; data: { message: string } }>(
          "/auth/forgot-password",
          { email: values.email.trim().toLowerCase() },
        );

        setNotice(t("forgot.sentNotice"));
        setSubmitted(true);
      } catch (error: unknown) {
        if (axios.isAxiosError<ApiErrorResponse>(error)) {
          const data = error.response?.data;
          setNotice(
            data?.success === false
              ? t("auth.loginFailed")
              : error.response
                ? t("auth.loginFailed")
                : t("auth.connectionFailed"),
          );
        } else {
          setNotice(t("auth.unexpected"));
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
              <Mail size={26} aria-hidden="true" />
            </span>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-dark sm:text-4xl">
              {t("forgot.title")}
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
              {t("forgot.description")}
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-white p-6 shadow-xl shadow-zinc-200/40 sm:p-8">
            {notice && (
              <div
                className={`mb-6 rounded-xl border p-4 text-sm leading-6 ${
                  submitted
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
                role="status"
                aria-live="polite"
              >
                {submitted && (
                  <CheckCircle2 size={18} className="mb-2" aria-hidden="true" />
                )}
                {notice}
              </div>
            )}

            {!submitted && (
              <form
                noValidate
                onSubmit={(event) => {
                  setNotice("");
                  void formik.handleSubmit(event);
                }}
              >
                <label htmlFor="email" className="text-sm font-semibold text-dark">
                  {t("forgot.emailLabel")}
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
                    autoFocus
                    placeholder={t("register.emailPlaceholder")}
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    aria-invalid={Boolean(formik.touched.email && formik.errors.email)}
                    aria-describedby={formik.touched.email && formik.errors.email ? "email-error" : undefined}
                    className={`${fieldClass} pl-11`}
                  />
                </div>
                {formik.touched.email && formik.errors.email && (
                  <p id="email-error" className="mt-2 text-sm text-red-600">
                    {formik.errors.email}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={formik.isSubmitting}
                  className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 font-semibold transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ color: "var(--primary-foreground)" }}
                >
                  {formik.isSubmitting ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
                      {t("forgot.sending")}
                    </>
                  ) : (
                    <>
                      {t("forgot.submit")}
                      <Send size={18} aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>
            )}

            {submitted && (
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setNotice("");
                }}
                className="min-h-12 w-full rounded-xl border border-border px-5 text-sm font-semibold text-dark transition hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
              >
                {t("forgot.resend")}
              </button>
            )}

            <div className="mt-7 border-t border-border pt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-dark underline decoration-amber-400 decoration-2 underline-offset-4 hover:text-amber-700"
              >
                <ArrowLeft size={16} aria-hidden="true" />
                {t("forgot.backLogin")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
