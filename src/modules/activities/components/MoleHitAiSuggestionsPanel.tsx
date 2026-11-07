import { useEffect, useState } from "react";
import { useFormikContext } from "formik";
import { Sparkles } from "lucide-react";
import axios from "axios";
import api from "@/lib/api";
import type { CreateMoleHitFormValues } from "@/modules/activities/schemas/createMoleHitSchema";

interface SuggestionsResponse {
  success: true;
  data: {
    activityType: "mole_hit";
    correctOptions: string[];
    incorrectOptions: string[];
  };
}

export function MoleHitAiSuggestionsPanel() {
  const { values, setFieldValue } = useFormikContext<CreateMoleHitFormValues>();
  const [isOpen, setIsOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [correctQuantity, setCorrectQuantity] = useState(6);
  const [incorrectQuantity, setIncorrectQuantity] = useState(6);
  const [suggestions, setSuggestions] = useState<SuggestionsResponse["data"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function generate(): Promise<void> {
    if (topic.trim().length < 2) {
      setError("Informe primeiro o tema da atividade.");
      return;
    }
    setLoading(true);
    setError("");
    setNotice("");
    setSuggestions(null);
    try {
      const response = await api.post<SuggestionsResponse>("/activities/ai/suggestions", {
        activityType: "mole_hit",
        topic: topic.trim(),
        quantity: correctQuantity,
        incorrectQuantity,
        difficulty: values.difficulty.toLowerCase(),
      }, { timeout: 60_000 });
      setSuggestions(response.data.data);
    } catch (cause: unknown) {
      const message = axios.isAxiosError(cause)
        ? (cause.response?.data as { error?: { message?: string } } | undefined)?.error?.message
        : undefined;
      setError(message ?? "Não foi possível gerar opções com IA. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function apply(): Promise<void> {
    if (!suggestions) return;
    await setFieldValue("content.correctOptions", suggestions.correctOptions);
    await setFieldValue("content.incorrectOptions", suggestions.incorrectOptions);
    setNotice("Opções adicionadas ao formulário. Revise-as antes de salvar.");
    setSuggestions(null);
  }

  useEffect(() => {
    if (!isOpen) return;
    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape" && !loading) setIsOpen(false);
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, loading]);

  async function apply(): Promise<void> {
    if (!suggestions) return;
    await setFieldValue("content.correctOptions", suggestions.correctOptions);
    await setFieldValue("content.incorrectOptions", suggestions.incorrectOptions);
    setNotice("Opções adicionadas ao formulário. Revise-as antes de salvar.");
    setSuggestions(null);
    setIsOpen(false);
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-4">
        <div className="min-w-0">
          <p className="font-semibold text-dark">Precisa de sugestões?</p>
          <p className="mt-1 text-sm text-muted">Use a IA para criar opções corretas e incorretas a partir de um tema.</p>
          {notice && <p role="status" className="mt-2 text-sm text-green-800">{notice}</p>}
        </div>
        <button type="button" onClick={() => { setError(""); setSuggestions(null); setIsOpen(true); }} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-dark px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
          <Sparkles size={16} aria-hidden="true" />Gerar opções com IA
        </button>
      </div>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-6" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="mole-ai-modal-title" className="my-auto max-h-[ min(90vh, 760px)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2"><Sparkles size={20} aria-hidden="true" className="text-amber-700" /><h2 id="mole-ai-modal-title" className="text-xl font-bold text-dark">Gerar opções com IA</h2></div>
              <button type="button" onClick={() => setIsOpen(false)} disabled={loading} aria-label="Fechar modal" className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50">×</button>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">Informe o tema do desafio. Esse texto será usado somente para gerar as sugestões e não será salvo junto à atividade.</p>
            <div className="mt-5">
              <label htmlFor="mole-ai-topic" className="mb-1 block text-sm font-medium text-dark">Tema / categoria <span className="text-red-600">*</span></label>
              <input id="mole-ai-topic" value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={160} placeholder="Ex.: Cidades que são capitais de estados brasileiros" className="min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div><label htmlFor="mole-ai-correct-quantity" className="mb-1 block text-sm font-medium text-dark">Quantidade de opções corretas</label><input id="mole-ai-correct-quantity" type="number" min={2} max={15} value={correctQuantity} onChange={(event) => setCorrectQuantity(Number(event.target.value))} className="min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-dark" /></div>
              <div><label htmlFor="mole-ai-incorrect-quantity" className="mb-1 block text-sm font-medium text-dark">Quantidade de opções incorretas</label><input id="mole-ai-incorrect-quantity" type="number" min={2} max={15} value={incorrectQuantity} onChange={(event) => setIncorrectQuantity(Number(event.target.value))} className="min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-dark" /></div>
            </div>
            {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
            {suggestions && <div className="mt-5 space-y-3 rounded-xl border border-border bg-background p-4">
              <div><p className="text-sm font-semibold text-emerald-800">Corretas</p><p className="mt-1 text-sm leading-6 text-dark">{suggestions.correctOptions.join(" · ")}</p></div>
              <div><p className="text-sm font-semibold text-red-800">Incorretas</p><p className="mt-1 text-sm leading-6 text-dark">{suggestions.incorrectOptions.join(" · ")}</p></div>
            </div>}
            <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <button type="button" onClick={() => setIsOpen(false)} disabled={loading} className="min-h-11 rounded-xl border border-border px-5 py-2 text-sm font-semibold text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50">Cancelar</button>
              {suggestions ? <button type="button" onClick={() => void apply()} className="min-h-11 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">Usar estas opções</button> : <button type="button" onClick={() => void generate()} disabled={loading || topic.trim().length < 2 || !Number.isInteger(correctQuantity) || correctQuantity < 2 || correctQuantity > 15 || !Number.isInteger(incorrectQuantity) || incorrectQuantity < 2 || incorrectQuantity > 15} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-dark px-5 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50"><Sparkles size={16} aria-hidden="true" />{loading ? "Gerando opções..." : "Gerar sugestões"}</button>}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
