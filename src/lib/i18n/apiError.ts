import { translate, type TranslationKey } from "@/lib/i18n/translations";

type ApiErrorRecord = Record<string, unknown>;

const apiErrorKeys: Partial<Record<string, TranslationKey>> = {
  INVALID_CREDENTIALS: "auth.invalidCredentials",
  EMAIL_NOT_VERIFIED: "auth.verifyEmail",
  ACCOUNT_BLOCKED: "auth.blocked",
  EMAIL_ALREADY_REGISTERED: "register.emailExists",
  EMAIL_ALREADY_IN_USE: "register.emailExists",
  INVALID_OR_EXPIRED_TOKEN: "verify.invalid",
  INVALID_RESET_TOKEN: "reset.invalidToken",
  INVALID_CURRENT_PASSWORD: "profile.password.failed",
  INVALID_PASSWORD: "profile.password.failed",
  USER_NOT_FOUND: "profile.loadFailed",
  ACTIVITY_NOT_FOUND: "activities.play.openError",
  MERCADO_PAGO_MARKETPLACE_NOT_CONFIGURED: "marketplace.connectionError",
};

function asRecord(value: unknown): ApiErrorRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as ApiErrorRecord;
}

/**
 * Converts known backend error codes into the active interface language.
 * Unknown backend messages are never shown verbatim in English because the
 * API currently returns Portuguese messages.
 */
export function translateApiError(
  error: unknown,
  locale: string,
  fallbackKey: TranslationKey,
): string {
  const errorRecord = asRecord(error);
  const response = asRecord(errorRecord?.response);
  const data = asRecord(response?.data);
  const payload = asRecord(data?.error);
  const code = typeof payload?.code === "string" ? payload.code : null;
  const translationKey = code ? apiErrorKeys[code] : undefined;

  if (translationKey) {
    return translate(locale, translationKey);
  }

  if (locale === "pt-BR" && typeof payload?.message === "string") {
    return payload.message;
  }

  return translate(locale, fallbackKey);
}
