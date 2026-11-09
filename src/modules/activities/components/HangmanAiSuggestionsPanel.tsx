import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useFormikContext } from "formik";
import { Sparkles } from "lucide-react";
import axios from "axios";
import api from "@/lib/api";
import type { CreateHangmanFormValues } from "@/modules/activities/schemas/createHangmanSchema";

interface SuggestionsResponse { success: true; data: { activityType: "hangman"; words: Array<{ word: string; clue: string }> }; }

export function HangmanAiSuggestionsPanel() {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<CreateHangmanFormValues>();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [quantity, setQuantity] = useState(8);
  const [suggestions, setSuggestions] = useState<SuggestionsResponse["data"]["words"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function generate(): Promise<void> {
    if (topic.trim().length < 2 || !Number.isInteger(quantity) || quantity < 3 || quantity > 30) { setError(t("activity.ai.quantityRange")); return; }
    setLoading(true); setError(""); setSuggestions(null);
    try {
      const response = await api.post<SuggestionsResponse>("/activities/ai/suggestions", { activityType: "hangman", topic: topic.trim(), quantity, difficulty: values.difficulty.toLowerCase() }, { timeout: 60_000 });
      setSuggestions(response.data.data.words);
    } catch (cause: unknown) {
      const message = axios.isAxiosError(cause) ? (cause.response?.data as { error?: { message?: string } } | undefined)?.error?.message : undefined;
      setError(message ?? t("activity.ai.generateWordsError"));
    } finally { setLoading(false); }
  }

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent): void { if (event.key === "Escape" && !loading) setOpen(false); }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, loading]);

  async function apply(): Promise<void> {
    if (!suggestions) return;
    const generated = suggestions.map((item) => ({ id: crypto.randomUUID(), word: item.word, clue: item.clue, imageUrl: "", imageAlt: "" }));
    await setFieldValue("content.words", [...values.content.words, ...generated].slice(0, 30));
    setNotice(t("activity.ai.addedWordsReview"));
    setSuggestions(null); setOpen(false);
  }

  return <>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-4">
      <div><p className="font-semibold text-dark">{t("activity.ai.askAi")}</p><p className="mt-1 text-sm text-muted">{t("activity.ai.generateIdeas")}</p>{notice && <p role="status" className="mt-2 text-sm text-green-800">{notice}</p>}</div>
      <button type="button" onClick={() => { setError(""); setSuggestions(null); setOpen(true); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-dark px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><Sparkles size={16} aria-hidden="true" />{t("activity.ai.askAi")}</button>
    </div>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-6">
      <section role="dialog" aria-modal="true" aria-labelledby="hangman-ai-title" className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface p-5 shadow-2xl sm:p-7">
        <div className="flex items-center justify-between gap-3"><h2 id="hangman-ai-title" className="text-xl font-bold text-dark">{t("activity.ai.wordSuggestions")}</h2><button type="button" onClick={() => setOpen(false)} disabled={loading} aria-label="Fechar" className="size-10 rounded-xl border border-border text-muted">×</button></div>
        <p className="mt-2 text-sm text-muted">{t("activity.ai.topicAbout")}</p>
        <label htmlFor="hangman-ai-topic" className="mt-5 block text-sm font-medium text-dark">{t("activity.ai.topic")}</label><input id="hangman-ai-topic" value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={160} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" placeholder="Ex.: Sistema solar" />
        <label htmlFor="hangman-ai-quantity" className="mt-4 block text-sm font-medium text-dark">{t("activity.ai.wordQuantity")}</label><input id="hangman-ai-quantity" type="number" min={3} max={30} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" />
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
        {suggestions && <div className="mt-5 grid gap-2 sm:grid-cols-2">{suggestions.map((item, index) => <div key={item.word + index} className="rounded-xl border border-border bg-background p-3"><strong className="text-sm text-dark">{item.word}</strong><p className="mt-1 text-xs text-muted">{item.clue}</p></div>)}</div>}
        <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row"><button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-xl border border-border px-5 text-sm font-semibold text-dark">{t("activity.ai.cancel")}</button>{suggestions ? <button type="button" onClick={() => void apply()} disabled={values.content.words.length + suggestions.length > 30} className="min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white disabled:opacity-50">{t("activity.ai.addWords")}</button> : <button type="button" onClick={() => void generate()} disabled={loading || topic.trim().length < 2 || !Number.isInteger(quantity) || quantity < 3 || quantity > 30} className="min-h-11 rounded-xl bg-dark px-5 text-sm font-semibold text-white disabled:opacity-50">{loading ? t("activity.ai.generating") : t("activity.ai.generate")}</button>}</div>
      </section>
    </div>}
  </>;
}
