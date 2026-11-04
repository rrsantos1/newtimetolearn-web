export type ActivitySound = "success" | "error" | "applause";

const SOUND_PATHS: Record<ActivitySound, string> = {
  success: "/audios/success.mp3",
  error: "/audios/error.mp3",
  applause: "/audios/applause.mp3",
};

const SOUND_PREFERENCE_KEY = "timetolearn:activity-sounds-enabled";

export function areActivitySoundsEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(SOUND_PREFERENCE_KEY) !== "false";
}

export function setActivitySoundsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SOUND_PREFERENCE_KEY, String(enabled));
}

export function playActivitySound(sound: ActivitySound): void {
  if (typeof window === "undefined" || !areActivitySoundsEnabled()) return;

  const audio = new Audio(SOUND_PATHS[sound]);
  audio.preload = "auto";
  audio.volume = sound === "applause" ? 0.55 : 0.4;
  void audio.play().catch(() => undefined);
}
