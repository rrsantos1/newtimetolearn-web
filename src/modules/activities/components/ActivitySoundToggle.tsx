import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { areActivitySoundsEnabled, setActivitySoundsEnabled } from "@/modules/users/utils/activitySounds";

export function ActivitySoundToggle() {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setEnabled(areActivitySoundsEnabled());
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  function toggleSounds(): void {
    const nextEnabled = !enabled;
    setEnabled(nextEnabled);
    setActivitySoundsEnabled(nextEnabled);
  }

  return (
    <button
      type="button"
      onClick={toggleSounds}
      aria-pressed={enabled}
      aria-label={enabled ? t("activity.sound.disable") : t("activity.sound.enable")}
      title={enabled ? t("activity.sound.disable") : t("activity.sound.enable")}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted transition hover:border-primary hover:text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
    >
      {enabled ? <Volume2 size={17} aria-hidden="true" /> : <VolumeX size={17} aria-hidden="true" />}
      <span className="hidden sm:inline">{enabled ? t("activity.sound.enabled") : t("activity.sound.disabled")}</span>
    </button>
  );
}
