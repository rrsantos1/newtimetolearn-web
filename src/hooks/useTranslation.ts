import { useCallback } from "react";
import { useRouter } from "next/router";
import { translate, type TranslationKey } from "@/lib/i18n/translations";

export function useTranslation() {
  const { locale } = useRouter();
  const t = useCallback(
    (key: TranslationKey, values?: Readonly<Record<string, string | number>>): string => {
      const message = translate(locale, key);
      return values
        ? message.replace(/\\{(\\w+)\\}/g, (placeholder, name: string) => String(values[name] ?? placeholder))
        : message;
    },
    [locale],
  );

  return { t, locale: locale ?? "en" };
}
