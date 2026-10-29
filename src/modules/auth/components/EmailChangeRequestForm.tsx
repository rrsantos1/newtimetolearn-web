import { useState } from "react";
import axios from "axios";
import { LoaderCircle, Send } from "lucide-react";
import type { ApiErrorResponse } from "@/modules/auth/types/auth.types";
import { emailChangeService } from "@/modules/auth/services/emailChangeService";

interface EmailChangeRequestFormProps {
  currentEmail: string;
  onSuccess: (message: string) => void;
}

export function EmailChangeRequestForm({
  currentEmail,
  onSuccess,
}: EmailChangeRequestFormProps) {
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (newEmail.trim().toLowerCase() === currentEmail.toLowerCase()) {
      setErrorMessage("O novo e-mail deve ser diferente do atual.");
      return;
    }

    setIsSubmitting(true);

    try {
      const message = await emailChangeService.requestEmailChange({
        newEmail,
        currentPassword,
      });

      setNewEmail("");
      setCurrentPassword("");
      onSuccess(message);
    } catch (error: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        const response = error.response?.data;

        if (response?.success === false) {
          setErrorMessage(response.error.message);
        } else {
          setErrorMessage(
            error.response
              ? "Não foi possível solicitar a alteração do e-mail."
              : "Falha de conexão. Verifique sua internet e tente novamente.",
          );
        }
      } else {
        setErrorMessage("Ocorreu um erro inesperado.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {errorMessage}
        </div>
      )}

      <div>
        <label
          htmlFor="newEmail"
          className="text-sm font-semibold text-dark"
        >
          Novo e-mail
        </label>
        <input
          id="newEmail"
          name="newEmail"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          value={newEmail}
          onChange={(event) => setNewEmail(event.target.value)}
          disabled={isSubmitting}
          placeholder="voce@exemplo.com"
          className="mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 text-sm text-dark outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-60"
        />
      </div>

      <div>
        <label
          htmlFor="currentPassword"
          className="text-sm font-semibold text-dark"
        >
          Senha atual
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          maxLength={72}
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          disabled={isSubmitting}
          className="mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 text-sm text-dark outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-60"
        />
        <p className="mt-2 text-xs leading-5 text-muted">
          Por segurança, confirme sua identidade com a senha atual.
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !newEmail.trim() || !currentPassword}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
            Enviando...
          </>
        ) : (
          <>
            <Send size={17} aria-hidden="true" />
            Solicitar alteração
          </>
        )}
      </button>
    </form>
  );
}