import { useCallback } from "react";
import { useRouter } from "next/router";
import { translate, type TranslationKey } from "@/lib/i18n/translations";

export function useTranslation() {
  const { locale } = useRouter();
  const t = useCallback(
    (key: TranslationKey): string => translate(locale, key),
    [locale],
  );

  return { t, locale: locale ?? "en" };
}
