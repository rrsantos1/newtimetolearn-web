import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft, RotateCw, Sparkles } from "lucide-react";
import { PublicActivityLayout } from "@/modules/activities/components/PublicActivityLayout";
import { ActivitySoundToggle } from "@/modules/activities/components/ActivitySoundToggle";
import { startActivitySpinSound, stopActivitySpinSound } from "@/modules/users/utils/activitySounds";
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
  const router = useRouter();
  const { user } = useAuth();
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const backHref = !user ? "/" : user.roles.includes("ADMIN") ? "/admin/activities" : user.roles.includes("TEACHER") ? "/teacher/activities" : "/dashboard";
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
  useEffect(() => () => stopActivitySpinSound(), []);
  function spin(): void {
    if (spinning || remaining.length === 0) return;
    const index = Math.floor(Math.random() * remaining.length);
    const sector = 360 / remaining.length;
    const sectorCenter = (index + 0.5) * sector;
    const alignment = (360 - ((rotation % 360 + sectorCenter) % 360)) % 360;
    setSelected(remaining[index] ?? "");
    startActivitySpinSound();
    setRotation(rotation + 360 * 6 + alignment);
    setSpinning(true);
  }
  function finishSpin(): void {
    if (!spinning) return;
    stopActivitySpinSound();
    setRemaining((current) => current.filter((topic) => topic !== selected));
    setSpinning(false);
  }
  const gradient = remaining.length > 0
    ? `conic-gradient(${remaining.map((_, index) => `${COLORS[index % COLORS.length]} ${(index / remaining.length) * 100}% ${((index + 1) / remaining.length) * 100}%`).join(", ")})`
    : "conic-gradient(#e5e7eb 0% 100%)";
  return <PublicActivityLayout title={activity?.version.name ?? "Roleta"} description={activity?.version.description ?? "Gire a roleta e converse sobre o assunto sorteado."} titleActions={<><ActivitySoundToggle /><Link href={backHref} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted"><ArrowLeft size={16} aria-hidden="true" />Voltar</Link></>}>
    {loading ? <p role="status" className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">Carregando roleta...</p> : error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{error}</p> : activity ? <section className="flex w-full flex-col items-center rounded-2xl border border-border bg-surface p-4 text-center sm:p-8">
      <p className="text-sm text-muted">Assuntos restantes: <strong className="text-dark">{remaining.length}</strong></p>
      <div className="relative mt-6 aspect-square w-[min(92vw,620px)]">
        <div aria-hidden="true" className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 border-x-[16px] border-t-[28px] border-x-transparent border-t-primary drop-shadow" />
        <div onTransitionEnd={finishSpin} role="img" aria-label="Roleta de assuntos" className="absolute inset-0 rounded-full border-[8px] border-dark shadow-xl" style={{ background: gradient, transform: `rotate(${rotation}deg)`, transition: spinning ? "transform 5s cubic-bezier(0.12, 0.78, 0.12, 1)" : "none" }}>
          {remaining.map((topic, index) => {
            const angle = (index + 0.5) * (360 / remaining.length);
            const readableAngle = angle > 90 && angle < 270 ? angle + 180 : angle;
            return <span key={topic} className="absolute left-1/2 top-1/2 flex w-[min(30%,150px)] -translate-x-1/2 -translate-y-1/2 items-center justify-center text-center text-[10px] font-bold leading-tight text-white drop-shadow sm:text-xs" style={{ transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${remaining.length > 10 ? 34 : 36}%) rotate(${readableAngle - angle}deg)` }}>{topic}</span>;
          })}
          <div className="absolute inset-[38%] flex items-center justify-center rounded-full border-4 border-dark bg-surface text-dark"><Sparkles size={28} aria-hidden="true" /></div>
        </div>
      </div>
      {selected && !spinning && <div aria-live="polite" className="mt-6 max-w-xl rounded-2xl border border-primary/30 bg-primary/10 p-5"><p className="text-xs font-bold uppercase tracking-wider text-muted">Assunto escolhido</p><h2 className="mt-2 text-2xl font-bold text-dark">{selected}</h2><p className="mt-2 text-sm text-muted">Conversem sobre esse assunto. Quando terminarem, gire novamente.</p></div>}
      {remaining.length > 0 ? <button type="button" onClick={spin} disabled={spinning} className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-dark px-8 py-3 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"><RotateCw size={19} aria-hidden="true" />{spinning ? "Girando..." : selected ? "Sortear próximo assunto" : "Girar roleta"}</button> : <div className="mt-6 rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-800">Todos os assuntos foram sorteados!</div>}
      {remaining.length === 0 && <button type="button" onClick={() => { setRemaining(activity.version.content.topics); setSelected(""); setRotation(0); }} className="mt-3 min-h-10 rounded-xl border border-border px-5 text-sm font-semibold text-dark">Reiniciar roleta</button>}
    </section> : null}
  </PublicActivityLayout>;
}
