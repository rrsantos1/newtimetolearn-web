import { useRouter } from "next/router";
import { Languages } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export function LanguageSwitcher() {
  const router = useRouter();
  const { t, locale } = useTranslation();

  async function changeLanguage(nextLocale: "en" | "pt-BR"): Promise<void> {
    if (nextLocale === locale) return;

    await router.push(
      { pathname: router.pathname, query: router.query },
      router.asPath,
      { locale: nextLocale, scroll: false },
    );
  }

  return (
    <div className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-white/25 bg-white/10 px-2 text-white">
      <Languages size={16} aria-hidden="true" />
      <label className="sr-only" htmlFor="site-language">{t("language.label")}</label>
      <select
        id="site-language"
        value={locale}
        onChange={(event) => void changeLanguage(event.target.value as "en" | "pt-BR")}
        className="min-h-9 max-w-28 cursor-pointer bg-transparent text-xs font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-white sm:text-sm"
      >
        <option value="en" className="text-dark">{t("language.english")}</option>
        <option value="pt-BR" className="text-dark">{t("language.portuguese")}</option>
      </select>
    </div>
  );
}
