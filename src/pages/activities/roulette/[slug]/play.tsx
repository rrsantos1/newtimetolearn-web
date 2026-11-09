import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useRouter } from "next/router";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft, RotateCw, Sparkles } from "lucide-react";
import { PublicActivityLayout } from "@/modules/activities/components/PublicActivityLayout";
import { ActivitySoundToggle } from "@/modules/activities/components/ActivitySoundToggle";
import { prepareActivitySpinSound, startActivitySpinSound, stopActivitySpinSound } from "@/modules/users/utils/activitySounds";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import api from "@/lib/api";

interface RouletteResponse {
  success: true;
  data: { slug: string; type: string; version: { name: string; description: string | null; content: { topics: string[] } } };
}
const COLORS = ["#facc15", "#111827", "#eab308", "#374151", "#f59e0b", "#1f2937", "#fde047", "#4b5563"];
function getMessage(error: unknown): string {
  if (axios.isAxiosError(error)) { const data = error.response?.data as { error?: { message?: string } } | undefined; return data?.error?.message ?? "Não foi possível carregar a roleta."; }
  return "Não foi possível carregar a roleta.";
}
export default function RoulettePlayPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const backHref = !user ? "/" : user.roles.includes("ADMIN") ? "/admin/activities" : user.roles.includes("TEACHER") ? "/teacher/activities" : "/student/activities";
  const [activity, setActivity] = useState<RouletteResponse["data"] | null>(null);
  const [remaining, setRemaining] = useState<string[]>([]);
  const [rotation, setRotation] = useState(0);
  const [selected, setSelected] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!router.isReady || !slug) return;
    let active = true;
    void (async () => {
      try {
        const endpoint = user ? `/activities/${encodeURIComponent(slug)}` : `/activities/public/${encodeURIComponent(slug)}`;
        const response = await api.get<RouletteResponse>(endpoint);
        if (!active) return;
        if (response.data.data.type !== "roulette") throw new Error("Esta atividade não é uma roleta.");
        setActivity(response.data.data);
        setRemaining(response.data.data.version.content.topics);
      } catch (cause: unknown) { if (active) setError(getMessage(cause)); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [router.isReady, slug, user]);
  useEffect(() => { prepareActivitySpinSound(); return () => stopActivitySpinSound(); }, []);
  const wheelTopics = remaining;
  function spin(): void {
    if (spinning || remaining.length === 0 || wheelTopics.length === 0) return;
    const availableTopics = selected
      ? remaining.filter((topic) => topic !== selected)
      : remaining;
    if (availableTopics.length === 0) {
      setRemaining([]);
      return;
    }
    const topic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
    const index = availableTopics.indexOf(topic ?? "");
    if (index < 0) return;
    const sector = 360 / availableTopics.length;
    const sectorCenter = (index + 0.5) * sector;
    const alignment = (360 - ((rotation % 360 + sectorCenter) % 360)) % 360;
    setRemaining(availableTopics);
    setSelected(topic ?? "");
    startActivitySpinSound();
    setRotation(rotation + 360 * 6 + alignment);
    setSpinning(true);
  }
  function finishSpin(): void {
    if (!spinning) return;
    stopActivitySpinSound();
    setRotation((current) => current % 360);
    setSpinning(false);
  }
  const gradient = wheelTopics.length > 0
    ? `conic-gradient(${wheelTopics.map((_, index) => `${COLORS[index % COLORS.length]} ${(index / wheelTopics.length) * 100}% ${((index + 1) / wheelTopics.length) * 100}%`).join(", ")})`
    : "conic-gradient(#e5e7eb 0% 100%)";
  return <PublicActivityLayout immersive title={activity?.version.name ?? "Roleta"} description={activity?.version.description ?? "Gire a roleta e converse sobre o assunto sorteado."} titleActions={<><ActivitySoundToggle /><Link href={backHref} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted"><ArrowLeft size={16} aria-hidden="true" />Voltar</Link></>}>
    {loading ? <p role="status" className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">Carregando roleta...</p> : error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{error}</p> : activity ? <section className="relative z-0 w-full rounded-2xl border border-border bg-surface p-4 sm:p-8">
      <div className="grid w-full items-start gap-6 lg:grid-cols-[minmax(0,620px)_minmax(260px,320px)] lg:justify-center">
        <div className="flex min-w-0 flex-col items-center">
          <p className="text-sm text-muted">{t("play.remainingTopics")}:  <strong className="text-dark">{remaining.length}</strong></p>
          <div className="relative mt-6 aspect-square w-full max-w-155">
            <div aria-hidden="true" className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 border-x-16 border-t-28 border-x-transparent border-t-primary drop-shadow" />
            <div onTransitionEnd={(event) => { if (event.target === event.currentTarget) finishSpin(); }} role="img" aria-label="Roleta de assuntos" className="pointer-events-none absolute inset-0 rounded-full border-8 border-dark shadow-xl" style={{ background: gradient, transform: `rotate(${rotation}deg)`, transition: spinning ? "transform 4.02s cubic-bezier(0.12, 0.78, 0.12, 1)" : "none" }}>
              {wheelTopics.map((topic, index) => {
                const angle = (index + 0.5) * (360 / wheelTopics.length);
                const labelWidth = Math.max(58, Math.min(130, 2 * 0.35 * 310 * Math.sin(Math.PI / wheelTopics.length) * 0.82));
                return (
                  <span key={topic} aria-hidden="true" className="absolute inset-0" style={{ transform: `rotate(${angle}deg)` }}>
                    <span className="absolute left-1/2 top-[16%] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center text-center text-xs font-bold leading-tight text-white drop-shadow sm:text-sm" style={{ width: `${labelWidth}px`, transform: `rotate(-${angle + rotation}deg)` }}>
                      {topic}
                    </span>
                  </span>
                );
              })}
              <div className="absolute inset-[38%] flex items-center justify-center rounded-full border-4 border-dark bg-surface text-dark"><Sparkles size={28} aria-hidden="true" /></div>
            </div>
          </div>
          {remaining.length > 0 ? <button type="button" onClick={spin} disabled={spinning} className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-dark px-8 py-3 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"><RotateCw size={19} aria-hidden="true" />{spinning ? t("play.spinning") : selected ? t("play.spinNext") : t("play.spin")}</button> : <div className="mt-6 rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-800">{t("play.allDrawn")}</div>}
          {remaining.length === 0 && <button type="button" onClick={() => { setRemaining(activity.version.content.topics); setSelected(""); setRotation(0); }} className="mt-3 min-h-10 rounded-xl border border-border px-5 text-sm font-semibold text-dark">{t("play.resetWheel")}</button>}
        </div>
        {selected && !spinning && <div aria-live="polite" className="w-full rounded-2xl border border-primary/30 bg-primary/10 p-5 text-left lg:mt-12"><p className="text-xs font-bold uppercase tracking-wider text-muted">{t("play.selectedTopic")}</p><h2 className="mt-2 text-2xl font-bold text-dark">{selected}</h2><p className="mt-2 text-sm text-muted">{t("play.topicHint")}</p></div>}
      </div>
    </section> : null}
  </PublicActivityLayout>;
}
