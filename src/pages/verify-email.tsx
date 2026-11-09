import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import axios from "axios";
import {
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  Mail,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import api from "@/lib/api";
import type { ApiErrorResponse } from "@/modules/auth/types/auth.types";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { useTranslation } from "@/hooks/useTranslation";

type VerificationStatus =
  | "loading"
  | "success"
  | "error";

const TOKEN_PATTERN = /^[a-f0-9]{64}$/;

export default function VerifyEmailPage() {
  const router = useRouter();
  const startedRef = useRef(false);
  const { t } = useTranslation();

  const [status, setStatus] =
    useState<VerificationStatus>("loading");
  const [message, setMessage] = useState(
    t("verify.loadingMessage"),
  );
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState(false);

  const token = router.query.token;

  const isInvalidToken =
    router.isReady &&
    (typeof token !== "string" || !TOKEN_PATTERN.test(token));

  const visibleStatus: VerificationStatus = isInvalidToken
    ? "error"
    : status;

  const visibleMessage = isInvalidToken
    ? t("verify.invalid")
    : message;

  useEffect(() => {
    if (!router.isReady || startedRef.current || isInvalidToken) {
      return;
    }

    if (typeof token !== "string") {
      return;
    }

    startedRef.current = true;

    async function verifyEmail() {
      try {
        const response = await api.post<{
          data: { message: string };
        }>("/auth/verify-email", { token });

        setStatus("success");
        setMessage(
          t("verify.success"),
        );
      } catch (error: unknown) {
        if (axios.isAxiosError<ApiErrorResponse>(error)) {
          const data = error.response?.data;

          if (data?.success === false) {
            setMessage(t("verify.failed"));
          } else {
            setMessage(
              error.response
                ? t("verify.failed")
                : t("profile.connectionFailed"),
            );
          }
        } else {
          setMessage(
            t("auth.unexpected"),
          );
        }

        setStatus("error");
      }
    }

    void verifyEmail();
  }, [router.isReady, token, isInvalidToken, t]);

  async function handleResend() {
    setResendMessage("");
    setResendError(false);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setResendError(true);
      setResendMessage(t("verify.emailRequired"));
      return;
    }

    setResending(true);

    try {
      await api.post("/auth/resend-verification", {
        email: normalizedEmail,
      });

      setResendMessage(
        t("verify.resendSuccess"),
      );
    } catch (error: unknown) {
      setResendError(true);

      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        const data = error.response?.data;

        setResendMessage(
          data?.success === false
            ? t("verify.resendFailed")
            : t("verify.resendFailed"),
        );
      } else {
        setResendMessage(
          t("auth.unexpected"),
        );
      }
    } finally {
      setResending(false);
    }
  }

  const isLoading = visibleStatus === "loading";
  const isSuccess = visibleStatus === "success";

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <PublicHeader />

      <section className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-border bg-white p-7 text-center shadow-xl shadow-zinc-200/40 sm:p-10">
          <span
            className={`mx-auto flex size-16 items-center justify-center rounded-2xl ${
              isLoading
                ? "bg-amber-50 text-amber-700"
                : isSuccess
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-600"
            }`}
          >
            {isLoading ? (
              <LoaderCircle
                size={32}
                className="animate-spin"
                aria-hidden="true"
              />
            ) : isSuccess ? (
              <CheckCircle2 size={32} aria-hidden="true" />
            ) : (
              <XCircle size={32} aria-hidden="true" />
            )}
          </span>

          <h1 className="mt-6 text-2xl font-bold tracking-tight text-dark sm:text-3xl">
            {isLoading
              ? t("verify.titleLoading")
              : isSuccess
                ? t("verify.titleSuccess")
                : t("verify.titleError")}
          </h1>

          <p
            className="mt-3 text-sm leading-7 text-muted sm:text-base"
            role="status"
            aria-live="polite"
          >
            {visibleMessage}
          </p>

          {isSuccess ? (
            <Link
              href="/login"
              className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-dark transition hover:bg-primary-hover" style={{ color: "var(--primary-foreground)" }}
            >
              {t("verify.login")}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          ) : !isLoading ? (
            <div className="mt-8 border-t border-border pt-7 text-left">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-dark">
                  <Mail size={20} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-semibold text-dark">
                    {t("verify.needLink")}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {t("verify.resendDescription")}
                  </p>
                </div>
              </div>

              <label
                htmlFor="resend-email"
                className="mt-5 block text-sm font-semibold text-dark"
              >
                {t("verify.emailLabel")}
              </label>

              <input
                id="resend-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setResendMessage("");
                }}
                placeholder="voce@exemplo.com"
                className="mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 text-sm text-dark outline-none transition placeholder:text-zinc-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
              />

              <button
                type="button"
                onClick={() => void handleResend()}
                disabled={resending}
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-border px-5 font-semibold text-dark transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resending ? (
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <RefreshCw size={18} aria-hidden="true" />
                )}
                {resending
                  ? t("verify.requesting")
                  : t("verify.resend")}
              </button>

              {resendMessage && (
                <p
                  className={`mt-3 text-sm leading-6 ${
                    resendError ? "text-red-600" : "text-green-700"
                  }`}
                  role="status"
                >
                  {resendMessage}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-7 flex items-center justify-center gap-2 text-sm text-muted">
              <ShieldCheck size={17} aria-hidden="true" />
              {t("verify.await")}
            </div>
          )}

          <p className="mt-7 text-sm text-muted">
            {t("verify.help")}{" "}
            <Link
              href="/"
              className="font-semibold text-dark underline decoration-amber-400 underline-offset-4 hover:text-amber-700"
            >
              {t("verify.backHome")}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}