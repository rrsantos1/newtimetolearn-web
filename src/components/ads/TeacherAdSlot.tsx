import { useTranslation } from "@/hooks/useTranslation";

interface TeacherAdSlotProps {
  placement: "teacher-top" | "teacher-bottom";
}

export function TeacherAdSlot({ placement }: TeacherAdSlotProps) {
  const { t } = useTranslation();
  return (
    <div
      data-ad-provider="adsense"
      data-ad-placement={placement}
      aria-label={t("common.adLabel")}
      role="complementary"
      className="my-6 flex min-h-24 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-surface/60 px-4 py-5 text-center md:min-h-28"
    >
      <span className="text-xs font-medium uppercase tracking-wider text-muted">
        {t("common.adPlaceholder")}
      </span>
    </div>
  );
}
