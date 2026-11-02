import { useState } from "react";
import { useFormikContext } from "formik";
import { Sparkles, X } from "lucide-react";
import api from "@/lib/api";

type ActivityType = "word_search" | "crossword" | "quiz";
type Difficulty = "easy" | "medium" | "hard";
type Suggestion =
  | { activityType: "word_search"; words: string[] }
  | { activityType: "crossword"; entries: { answer: string; clue: string }[] }
  | { activityType: "quiz"; questions: { question: string; options: { text: string; isCorrect: boolean }[]; explanation?: string }[] };

type FormValues = Record<string, unknown>;

interface Props {
  activityType: ActivityType;
  open: boolean;
  onClose: () => void;
}

const fieldClass = "min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-dark focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `ai-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function AiActivitySuggestionsPanel({ activityType, open, onClose }: Readonly<Props>) {
  const { values, setFieldValue } = useFormikContext<FormValues>();
  const [topic, setTopic] = useState("");
  const [quantity, setQuantity] = useState(activityType === "quiz" ? 5 : 10);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [gradeLevel, setGradeLevel] = useState("");
  const [optionCount, setOptionCount] = useState(4);
  const [suggestions, setSuggestions] = useState<Suggestion | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function generateSuggestions(): Promise<void> {
    setLoading(true);
    setError("");
    setNotice("");
    setSuggestions(null);
    setSelected([]);

    try {
      const response = await api.post<{ success: boolean; data: Suggestion }>("/activities/ai/suggestions", {
        activityType,
        topic,
        quantity,
        difficulty,
        gradeLevel: gradeLevel.trim() || undefined,
        ...(activityType === "quiz" ? { optionCount } : {}),
      }, { timeout: 60_000 });
      setSuggestions(response.data.data);
      const itemsCount = response.data.data.activityType === "word_search"
        ? response.data.data.words.length
        : response.data.data.activityType === "crossword"
          ? response.data.data.entries.length
          : response.data.data.questions.length;
      setSelected(Array.from({ length: itemsCount }, (_, index) => index));
    } catch (cause: unknown) {
      const message = typeof cause === "object" && cause !== null && "response" in cause
        ? ((cause as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message)
        : undefined;
      setError(message ?? "Não foi possível gerar sugestões. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function applySelected(): Promise<void> {
    if (!suggestions || selected.length === 0) return;

    if (suggestions.activityType === "word_search") {
      const currentWords = Array.isArray(values.words)
        ? values.words.filter((word): word is string => typeof word === "string" && word.trim().length > 0)
        : [];
      const existing = new Set(currentWords.map((word) => word.trim().toLocaleUpperCase("pt-BR")));
      const additions = selected.map((index) => suggestions.words[index]).filter((word): word is string => Boolean(word))
        .filter((word) => !existing.has(word.trim().toLocaleUpperCase("pt-BR")));
      await setFieldValue("words", [...currentWords, ...additions].filter((word, index, all) => all.indexOf(word) === index));
      setNotice(`${additions.length} palavra(s) adicionada(s). Revise os campos antes de salvar.`);
    } else if (suggestions.activityType === "crossword") {
      const current = Array.isArray(values.words) ? values.words : [];
      const currentEntries = current.filter((entry): entry is { word: string; clue: string } =>
        typeof entry === "object" && entry !== null && "word" in entry && "clue" in entry &&
        typeof entry.word === "string" && typeof entry.clue === "string" && entry.word.trim().length > 0 && entry.clue.trim().length > 0);
      const existing = new Set(currentEntries.map((entry) => entry.word.trim().toLocaleUpperCase("pt-BR")));
      const additions = selected.map((index) => suggestions.entries[index]).filter((entry): entry is { answer: string; clue: string } => Boolean(entry))
        .filter((entry) => !existing.has(entry.answer.trim().toLocaleUpperCase("pt-BR")))
        .map((entry) => ({ word: entry.answer, clue: entry.clue }));
      await setFieldValue("words", [...currentEntries, ...additions]);
      setNotice(`${additions.length} par(es) de resposta e pista adicionado(s). Revise antes de salvar.`);
    } else {
      const rawContent = values.content;
      const content = typeof rawContent === "object" && rawContent !== null ? rawContent as { questions?: unknown } : {};
      const currentQuestions = Array.isArray(content.questions) ? content.questions : [];
      const additions = selected.flatMap((index) => {
        const question = suggestions.questions[index];
        if (!question) return [];
        const options = question.options.map((option) => ({ id: createId(), text: option.text, images: [] }));
        const correctIndex = question.options.findIndex((option) => option.isCorrect);
        return [{
          id: createId(),
          statement: question.question,
          images: [],
          options,
          correctOptionId: options[Math.max(correctIndex, 0)]?.id ?? options[0]?.id ?? "",
          explanation: question.explanation ?? "",
        }];
      });
      await setFieldValue("content.questions", [...currentQuestions, ...additions]);
      setNotice(`${additions.length} questão(ões) adicionada(s). Revise enunciados e alternativas antes de salvar.`);
    }

    setSuggestions(null);
    setSelected([]);
  }

  const maxQuantity = activityType === "word_search" ? 25 : activityType === "crossword" ? 20 : 10;
  const minQuantity = activityType === "quiz" ? 1 : 3;
  const title = activityType === "word_search" ? "Sugerir palavras com IA"
    : activityType === "crossword" ? "Sugerir respostas e pistas com IA" : "Criar questões com IA";

  const itemCount = !suggestions ? 0 : suggestions.activityType === "word_search"
    ? suggestions.words.length : suggestions.activityType === "crossword"
      ? suggestions.entries.length : suggestions.questions.length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="ai-suggestions-title">
      <section className="mx-auto my-4 max-h-[calc(100dvh-2rem)] max-w-3xl overflow-y-auto rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-xl sm:my-8 sm:p-7">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-yellow-300 text-gray-900">
          <Sparkles aria-hidden="true" size={20} />
        </span>
        <div>
          <h2 id="ai-suggestions-title" className="text-lg font-semibold text-dark">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted">Opcional: gere ideias, selecione o que deseja aproveitar e revise os campos. Nada é salvo automaticamente.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Fechar sugestões com IA" className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-amber-300 text-dark hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900">
          <X aria-hidden="true" size={18} />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="ai-topic" className="mb-2 block text-sm font-medium text-dark">Tema *</label>
          <input id="ai-topic" value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={160} placeholder="Ex.: sistema solar, ecossistemas, frações..." className={fieldClass} />
        </div>
        <div>
          <label htmlFor="ai-quantity" className="mb-2 block text-sm font-medium text-dark">Quantidade</label>
          <input id="ai-quantity" type="number" min={minQuantity} max={maxQuantity} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="ai-difficulty" className="mb-2 block text-sm font-medium text-dark">Dificuldade</label>
          <select id="ai-difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)} className={fieldClass}>
            <option value="easy">Fácil</option><option value="medium">Média</option><option value="hard">Difícil</option>
          </select>
        </div>
        <div>
          <label htmlFor="ai-grade" className="mb-2 block text-sm font-medium text-dark">Ano/série (opcional)</label>
          <input id="ai-grade" value={gradeLevel} onChange={(event) => setGradeLevel(event.target.value)} maxLength={80} placeholder="Ex.: 6º ano do Ensino Fundamental" className={fieldClass} />
        </div>
        {activityType === "quiz" && (
          <div>
            <label htmlFor="ai-option-count" className="mb-2 block text-sm font-medium text-dark">Alternativas por questão</label>
            <select id="ai-option-count" value={optionCount} onChange={(event) => setOptionCount(Number(event.target.value))} className={fieldClass}>
              {[3, 4, 5, 6].map((count) => <option key={count} value={count}>{count} alternativas</option>)}
            </select>
          </div>
        )}
      </div>

      <button type="button" onClick={() => void generateSuggestions()} disabled={loading || topic.trim().length < 2 || quantity < minQuantity || quantity > maxQuantity}
        className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:opacity-50">
        <Sparkles aria-hidden="true" size={17} /> {loading ? "Gerando sugestões..." : "Gerar sugestões"}
      </button>

      {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}

      {suggestions && (
        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold text-dark">Revise as sugestões ({itemCount})</h3>
            <div className="flex gap-3 text-sm">
              <button type="button" onClick={() => setSelected(Array.from({ length: itemCount }, (_, index) => index))} className="font-medium underline">Selecionar todas</button>
              <button type="button" onClick={() => setSelected([])} className="font-medium underline">Limpar seleção</button>
            </div>
          </div>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {Array.from({ length: itemCount }, (_, index) => {
              const label = suggestions.activityType === "word_search" ? suggestions.words[index]
                : suggestions.activityType === "crossword" ? `${suggestions.entries[index]?.answer}: ${suggestions.entries[index]?.clue}`
                  : `${suggestions.questions[index]?.question} — ${suggestions.questions[index]?.options.map((option) => `${option.isCorrect ? "✓ " : ""}${option.text}`).join(" | ")}`;
              return <label key={index} className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-white p-3 text-sm text-dark">
                <input type="checkbox" checked={selected.includes(index)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, index] : current.filter((item) => item !== index))} className="mt-1 size-4 shrink-0 accent-yellow-500" />
                <span>{label}</span>
              </label>;
            })}
          </div>
          <button type="button" onClick={() => void applySelected()} disabled={selected.length === 0}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-yellow-400 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-yellow-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600 disabled:cursor-not-allowed disabled:opacity-50">
            Adicionar selecionados ao formulário ({selected.length})
          </button>
        </div>
      )}
      </section>
    </div>
  );
}
