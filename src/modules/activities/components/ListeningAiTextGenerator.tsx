import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { LoaderCircle, Sparkles, X } from "lucide-react";
import { listeningService } from "@/modules/activities/services/listeningService";

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (title: string, text: string) => void;
}

type Difficulty = "easy" | "medium" | "hard";

const fieldClass = "mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined;
    return data?.error?.message ?? data?.message ?? "Não foi possível gerar o texto. Tente novamente.";
  }
  return error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
}

export function ListeningAiTextGenerator({ open, onClose, onApply }: Readonly<Props>) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const [topic, setTopic] = useState("");
  const [objective, setObjective] = useState("");
  const [wordCount, setWordCount] = useState(180);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [gradeLevel, setGradeLevel] = useState("");
  const [generated, setGenerated] = useState<{ title: string; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleGenerate(): Promise<void> {
    setLoading(true);
    setError("");
    setNotice("");
    setGenerated(null);
    try {
      const result = await listeningService.generateText({
        topic: topic.trim(),
        objective: objective.trim(),
        wordCount,
        difficulty,
        ...(gradeLevel.trim() ? { gradeLevel: gradeLevel.trim() } : {}),
      });
      setGenerated(result);
    } catch (caught: unknown) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  function handleApply(): void {
    if (!generated) return;
    onApply(generated.title, generated.text);
    setGenerated(null);
    setError("");
    setNotice("");
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="listening-ai-title" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !loading) onClose();
    }}>
    <section className="mx-auto my-4 max-h-[calc(100dvh-2rem)] max-w-3xl overflow-y-auto rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-xl sm:my-8 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-yellow-300 text-gray-900">
          <Sparkles size={20} aria-hidden="true" />
        </span>
        <div>
          <h3 id="listening-ai-title" className="text-base font-semibold text-dark">Criar texto com auxílio da IA</h3>
          <p className="mt-1 text-sm leading-6 text-muted">Informe o tema, o tamanho aproximado e o objetivo pedagógico. O texto gerado poderá ser revisado antes de criar o áudio.</p>
        </div>
        </div>
        <button ref={closeButtonRef} type="button" onClick={onClose} disabled={loading} aria-label="Fechar janela de geração com IA" className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-amber-100 hover:text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50">
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="listening-ai-topic" className="block text-sm font-medium text-dark">Tema do texto *</label>
          <input id="listening-ai-topic" value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={160} required className={fieldClass} placeholder="Ex.: Uma viagem ao interior" />
        </div>
        <div>
          <label htmlFor="listening-ai-objective" className="block text-sm font-medium text-dark">Objetivo da prática *</label>
          <input id="listening-ai-objective" value={objective} onChange={(event) => setObjective(event.target.value)} maxLength={500} required className={fieldClass} placeholder="Ex.: praticar verbos irregulares no passado" />
        </div>
        <div>
          <label htmlFor="listening-ai-word-count" className="block text-sm font-medium text-dark">Tamanho aproximado (palavras)</label>
          <input id="listening-ai-word-count" type="number" min={50} max={600} step={10} value={wordCount} onChange={(event) => setWordCount(Number(event.target.value))} className={fieldClass} />
          <p className="mt-1 text-xs text-muted">Entre 50 e 600 palavras; o áudio suporta textos de até 4.096 caracteres.</p>
        </div>
        <div>
          <label htmlFor="listening-ai-difficulty" className="block text-sm font-medium text-dark">Dificuldade</label>
          <select id="listening-ai-difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)} className={fieldClass}>
            <option value="easy">Fácil</option>
            <option value="medium">Média</option>
            <option value="hard">Difícil</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="listening-ai-grade" className="block text-sm font-medium text-dark">Ano/série ou nível de idioma (opcional)</label>
          <input id="listening-ai-grade" value={gradeLevel} onChange={(event) => setGradeLevel(event.target.value)} maxLength={80} className={fieldClass} placeholder="Ex.: 8º ano ou inglês intermediário" />
        </div>
      </div>

      <button type="button" onClick={() => void handleGenerate()} disabled={loading || topic.trim().length < 2 || objective.trim().length < 2 || !Number.isInteger(wordCount) || wordCount < 50 || wordCount > 600} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:opacity-50">
        {loading ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : <Sparkles size={17} aria-hidden="true" />}
        {loading ? "Gerando texto..." : "Gerar texto com IA"}
      </button>

      {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}

      {generated && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-white p-4 sm:p-5">
          <h4 className="font-semibold text-dark">{generated.title}</h4>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-dark">{generated.text}</p>
          <p className="mt-3 text-xs text-muted">{generated.text.trim().split(/\s+/).filter(Boolean).length} palavras · Revise o conteúdo e a adequação pedagógica antes de usar.</p>
          <button type="button" onClick={handleApply} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
            Adicionar texto à atividade
          </button>
        </div>
      )}
    </section>
    </div>
  );
}
