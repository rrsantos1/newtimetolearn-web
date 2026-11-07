import { useState } from "react";
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
  const [correctQuantity, setCorrectQuantity] = useState(6);
  const [incorrectQuantity, setIncorrectQuantity] = useState(6);
  const [suggestions, setSuggestions] = useState<SuggestionsResponse["data"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function generate(): Promise<void> {
    if (values.content.theme.trim().length < 2) {
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
        topic: values.content.theme,
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

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Sparkles size={19} aria-hidden="true" className="text-amber-700" />
        <h3 className="font-semibold text-dark">Criar opções com IA</h3>
      </div>
      <p className="mt-1 text-sm text-muted">A IA usará o tema informado para sugerir respostas certas e erradas. Você poderá revisar tudo antes de salvar.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="mole-ai-correct-quantity" className="mb-1 block text-sm font-medium text-dark">Opções corretas</label>
          <input id="mole-ai-correct-quantity" type="number" min={2} max={15} value={correctQuantity} onChange={(event) => setCorrectQuantity(Number(event.target.value))} className="min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-dark" />
        </div>
        <div>
          <label htmlFor="mole-ai-incorrect-quantity" className="mb-1 block text-sm font-medium text-dark">Opções incorretas</label>
          <input id="mole-ai-incorrect-quantity" type="number" min={2} max={15} value={incorrectQuantity} onChange={(event) => setIncorrectQuantity(Number(event.target.value))} className="min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-dark" />
        </div>
      </div>
      <button type="button" onClick={() => void generate()} disabled={loading || correctQuantity < 2 || correctQuantity > 15 || incorrectQuantity < 2 || incorrectQuantity > 15} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-dark px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
        <Sparkles size={16} aria-hidden="true" />{loading ? "Gerando opções..." : "Gerar opções"}
      </button>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mt-3 text-sm text-green-800">{notice}</p>}
      {suggestions && <div className="mt-4 space-y-3">
        <div><p className="text-sm font-semibold text-emerald-800">Corretas</p><p className="mt-1 text-sm text-dark">{suggestions.correctOptions.join(" · ")}</p></div>
        <div><p className="text-sm font-semibold text-red-800">Incorretas</p><p className="mt-1 text-sm text-dark">{suggestions.incorrectOptions.join(" · ")}</p></div>
        <button type="button" onClick={() => void apply()} className="min-h-11 rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-gray-900">Usar estas opções</button>
      </div>}
    </div>
  );
}
