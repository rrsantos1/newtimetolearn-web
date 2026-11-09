import { useTranslation } from "@/hooks/useTranslation";

export function PublicFooter() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto flex w-full flex-col gap-2 px-5 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <span>© {new Date().getFullYear()} TimeToLearn</span>
        <span>{t("footer.tagline")}</span>
      </div>
    </footer>
  );
}
