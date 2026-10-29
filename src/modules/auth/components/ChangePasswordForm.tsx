import { useState } from "react";
import axios from "axios";
import { useFormik } from "formik";
import { CheckCircle2, KeyRound, LoaderCircle } from "lucide-react";
import type { ApiErrorResponse } from "@/modules/auth/types/auth.types";
import { changePasswordSchema } from "@/modules/auth/schemas/changePasswordSchema";
import { changePasswordService } from "@/modules/auth/services/changePasswordService";

interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const initialValues: ChangePasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function ChangePasswordForm() {
  const [successMessage, setSuccessMessage] = useState("");
  const [requestError, setRequestError] = useState("");

  const formik = useFormik<ChangePasswordFormValues>({
    initialValues,
    validationSchema: changePasswordSchema,
    onSubmit: async (values, { resetForm }) => {
      setSuccessMessage("");
      setRequestError("");

      try {
        const message = await changePasswordService.execute({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });

        resetForm();
        setSuccessMessage(message);
      } catch (error: unknown) {
        if (axios.isAxiosError<ApiErrorResponse>(error)) {
          const response = error.response?.data;

          if (response?.success === false) {
            setRequestError(response.error.message);
          } else {
            setRequestError(
              error.response
                ? "Não foi possível alterar sua senha."
                : "Falha de conexão. Verifique sua internet e tente novamente.",
            );
          }
        } else {
          setRequestError(
            "Ocorreu um erro inesperado ao alterar sua senha.",
          );
        }
      }
    },
  });

  const fieldClassName =
    "mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 text-sm text-dark outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10";

  const renderError = (field: keyof ChangePasswordFormValues) => {
    const error = formik.touched[field] && formik.errors[field];

    if (!error) {
      return null;
    }

    return (
      <p id={`${field}-error`} className="mt-2 text-sm text-danger">
        {error}
      </p>
    );
  };

  return (
    <form onSubmit={formik.handleSubmit} noValidate>
      {requestError && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
        >
          {requestError}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800"
        >
          <CheckCircle2
            size={19}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
          {successMessage}
        </div>
      )}

      <div className="space-y-5">
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
            value={formik.values.currentPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            aria-invalid={Boolean(
              formik.touched.currentPassword &&
                formik.errors.currentPassword,
            )}
            aria-describedby={
              formik.touched.currentPassword &&
              formik.errors.currentPassword
                ? "currentPassword-error"
                : undefined
            }
            className={fieldClassName}
          />

          {renderError("currentPassword")}
        </div>

        <div>
          <label
            htmlFor="newPassword"
            className="text-sm font-semibold text-dark"
          >
            Nova senha
          </label>

          <input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            value={formik.values.newPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            aria-invalid={Boolean(
              formik.touched.newPassword && formik.errors.newPassword,
            )}
            aria-describedby={
              formik.touched.newPassword && formik.errors.newPassword
                ? "newPassword-error"
                : undefined
            }
            className={fieldClassName}
          />

          {renderError("newPassword")}

          <p className="mt-2 text-xs leading-5 text-muted">
            Utilize entre 8 e 72 caracteres.
          </p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="text-sm font-semibold text-dark"
          >
            Confirmar nova senha
          </label>

          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            aria-invalid={Boolean(
              formik.touched.confirmPassword &&
                formik.errors.confirmPassword,
            )}
            aria-describedby={
              formik.touched.confirmPassword &&
              formik.errors.confirmPassword
                ? "confirmPassword-error"
                : undefined
            }
            className={fieldClassName}
          />

          {renderError("confirmPassword")}
        </div>
      </div>

      <div className="mt-6">
        <button
          type="submit"
          disabled={formik.isSubmitting || !formik.isValid || !formik.dirty}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {formik.isSubmitting ? (
            <>
              <LoaderCircle
                size={17}
                className="animate-spin"
                aria-hidden="true"
              />
              Alterando senha...
            </>
          ) : (
            <>
              <KeyRound size={17} aria-hidden="true" />
              Alterar senha
            </>
          )}
        </button>
      </div>
    </form>
  );
}