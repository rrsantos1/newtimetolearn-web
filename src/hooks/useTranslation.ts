import { useRouter } from "next/router";
import { translate, type TranslationKey } from "@/lib/i18n/translations";

export function useTranslation() {
  const { locale } = useRouter();

  function t(key: TranslationKey): string {
    return translate(locale, key);
  }

  return { t, locale: locale ?? "en" };
}
