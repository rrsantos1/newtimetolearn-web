import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { CheckCircle2, CircleAlert, LoaderCircle, Mail } from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import type { ApiErrorResponse } from "@/modules/auth/types/auth.types";
import { emailChangeService } from "@/modules/auth/services/emailChangeService";

type ConfirmationStatus = "loading" | "success" | "error";

export default function ConfirmEmailChangePage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();

  const [status, setStatus] = useState<ConfirmationStatus>("loading");
  const [message, setMessage] = useState(
    "Estamos confirmando a alteração do seu e-mail.",
  );

  const token = router.query.token;

  const isInvalidToken =
    router.isReady &&
    (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token));

  const visibleStatus: ConfirmationStatus = isInvalidToken
    ? "error"
    : status;

  const visibleMessage = isInvalidToken
    ? "O link de confirmação é inválido ou está incompleto."
    : message;

  useEffect(() => {
    if (!router.isReady || isInvalidToken || typeof token !== "string") {
      return;
    }

    const confirmationToken: string = token;

    let isMounted = true;

    async function confirmEmailChange() {
      try {
        const result = await emailChangeService.confirmEmailChange({
          token: confirmationToken,
        });

        await refreshProfile();

        if (!isMounted) return;

        setStatus("success");
        setMessage(result);
      } catch (error: unknown) {
        if (!isMounted) return;

        if (axios.isAxiosError<ApiErrorResponse>(error)) {
          const response = error.response?.data;

          if (response?.success === false) {
            setMessage(response.error.message);
          } else {
            setMessage(
              error.response
                ? "Não foi possível confirmar a alteração do e-mail."
                : "Falha de conexão. Verifique sua internet e tente novamente.",
            );
          }
        } else {
          setMessage("Ocorreu um erro inesperado ao confirmar o e-mail.");
        }

        setStatus("error");
      }
    }

    void confirmEmailChange();

    return () => {
      isMounted = false;
    };
  }, [router.isReady, token, isInvalidToken, refreshProfile]);

  return (
    <div className="min-h-dvh bg-background">
      <PublicHeader />

      <main className="flex min-h-[calc(100dvh-5rem)] items-center justify-center px-5 py-12">
        <section className="w-full max-w-lg rounded-2xl border border-border bg-surface p-7 text-center shadow-sm sm:p-10">
          <span
            className={`mx-auto flex size-14 items-center justify-center rounded-2xl ${
              status === "success"
                ? "bg-green-100 text-green-700"
                : status === "error"
                  ? "bg-red-100 text-red-700"
                  : "bg-accent-soft text-accent"
            }`}
          >
            {status === "loading" ? (
              <LoaderCircle size={28} className="animate-spin" aria-hidden="true" />
            ) : status === "success" ? (
              <CheckCircle2 size={28} aria-hidden="true" />
            ) : (
              <CircleAlert size={28} aria-hidden="true" />
            )}
          </span>

          <h1 className="mt-6 text-2xl font-bold text-dark">
            {visibleStatus === "loading"
              ? "Confirmando seu e-mail"
              : visibleStatus === "success"
                ? "E-mail alterado"
                : "Não foi possível confirmar"}
          </h1>

          <p
            className="mt-3 text-sm leading-6 text-muted"
            role={visibleStatus === "error" ? "alert" : "status"}
          >
            {visibleMessage}
          </p>

          {status !== "loading" && (
            <button
              type="button"
              onClick={() =>
                void router.replace(status === "success" ? "/profile" : "/login")
              }
              className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
            >
              {status === "success" ? (
                <>
                  <Mail size={17} aria-hidden="true" />
                  Voltar ao perfil
                </>
              ) : (
                "Ir para o login"
              )}
            </button>
          )}
        </section>
      </main>
    </div>
  );
}