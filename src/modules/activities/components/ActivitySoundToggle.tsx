import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { areActivitySoundsEnabled, setActivitySoundsEnabled } from "@/modules/activities/utils/activitySounds";

export function ActivitySoundToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(areActivitySoundsEnabled());
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
      aria-label={enabled ? "Desativar efeitos sonoros" : "Ativar efeitos sonoros"}
      title={enabled ? "Desativar efeitos sonoros" : "Ativar efeitos sonoros"}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted transition hover:border-primary hover:text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
    >
      {enabled ? <Volume2 size={17} aria-hidden="true" /> : <VolumeX size={17} aria-hidden="true" />}
      <span className="hidden sm:inline">{enabled ? "Som ligado" : "Som desligado"}</span>
    </button>
  );
}
