import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityCoverSelector, type ActivityCoverSelection } from "@/modules/activities/components/ActivityCoverSelector";
import { activityCoverService } from "@/modules/activities/services/activityCoverService";
import type { ChangeEvent, MouseEvent } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft, AudioLines, CheckCircle2, CirclePlus, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { listeningService } from "@/modules/activities/services/listeningService";
import { ListeningAiTextGenerator } from "@/modules/activities/components/ListeningAiTextGenerator";
import type { CreateListeningInput, ListeningBlankInput, ListeningPassageInput, ListeningVoice } from "@/modules/activities/services/listeningService";

type Difficulty = CreateListeningInput["difficulty"];
type CoverGenerationState = "idle" | "generating" | "awaiting_selection" | "failed";

type PassageDraft = ListeningPassageInput;

const voices: Array<{ value: ListeningVoice; label: string }> = [
  { value: "coral", label: "Coral — natural" }, { value: "alloy", label: "Alloy — equilibrada" },
  { value: "ash", label: "Ash — clara" }, { value: "nova", label: "Nova — expressiva" },
  { value: "shimmer", label: "Shimmer — suave" }, { value: "onyx", label: "Onyx — grave" },
  { value: "sage", label: "Sage — serena" }, { value: "echo", label: "Echo — firme" },
  { value: "fable", label: "Fable — narrativa" }, { value: "ballad", label: "Ballad — calorosa" },
  { value: "verse", label: "Verse — versátil" }, { value: "marin", label: "Marin — natural" },
  { value: "cedar", label: "Cedar — natural" },
];

function createPassage(): PassageDraft {
  return {
    id: crypto.randomUUID(), title: "", text: "", blanks: [],
    audio: { storageKey: null, publicUrl: null, disclosure: null, status: "PENDING", model: null, voice: null, textHash: null, durationSeconds: null },
  };
}

function makeSuggestedBlanks(text: string, suggestions: string[]): ListeningBlankInput[] {
  const blanks: ListeningBlankInput[] = [];
  const normalizedText = text.toLocaleLowerCase("pt-BR");
  for (const suggestion of suggestions) {
    const normalizedSuggestion = suggestion.toLocaleLowerCase("pt-BR");
    const startOffset = normalizedText.indexOf(normalizedSuggestion);
    if (startOffset < 0) continue;
    const endOffset = startOffset + suggestion.length;
    if (blanks.some((blank) => startOffset < blank.endOffset && endOffset > blank.startOffset)) continue;
    blanks.push({
      id: crypto.randomUUID(),
      startOffset,
      endOffset,
      expectedAnswer: text.slice(startOffset, endOffset),
      alternatives: [],
      grammarCategory: null,
    });
  }
  return blanks.sort((first, second) => first.startOffset - second.startOffset);
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined;
    return data?.error?.message ?? data?.message ?? "Não foi possível concluir a operação.";
  }
  return "Ocorreu um erro inesperado.";
}

export default function EditListeningPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState("15");
  const [instructions, setInstructions] = useState("Ouça o áudio e preencha as lacunas.");
  const [language, setLanguage] = useState("pt-BR");
  const [passages, setPassages] = useState<PassageDraft[]>([]);
  const [voice, setVoice] = useState<ListeningVoice>("coral");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cover, setCover] = useState<ActivityCoverSelection | null>(null);
  const [coverGenerationState, setCoverGenerationState] = useState<CoverGenerationState>("idle");
  const [coverChanged, setCoverChanged] = useState(false);
  const [generatingId, setGeneratingId] = useState("");
  const [previewingId, setPreviewingId] = useState("");
  const [audioPreviews, setAudioPreviews] = useState<Record<string, { url: string; disclosure: string; voice: ListeningVoice }>>({});
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const textareas = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const totalBlanks = useMemo(() => passages.reduce((sum, passage) => sum + passage.blanks.length, 0), [passages]);

  useEffect(() => {
    if (!router.isReady || !slug) return;

    let cancelled = false;

    async function loadActivity(): Promise<void> {
      try {
        const activity = await listeningService.get(slug);

        if (cancelled) return;

        if (activity.type !== "listening") {
          setError("A atividade informada não é do tipo Listening.");
          return;
        }

        setCover(activity.coverMediaAssetId && activity.coverImageUrl
          ? { id: activity.coverMediaAssetId, publicUrl: activity.coverImageUrl, altText: activity.coverAltText ?? "" }
          : null);
        setName(activity.version.name);
        setDescription(activity.version.description ?? "");
        setDifficulty(activity.version.difficulty);
        setTimeLimitMinutes(
          activity.version.timeLimitSeconds == null
            ? ""
            : String(Math.floor(activity.version.timeLimitSeconds / 60)),
        );
        setInstructions(activity.version.content.instructions ?? "");
        setLanguage(activity.version.content.language ?? "pt-BR");
        setPassages(
          activity.version.content.passages.map((passage) => ({
            ...passage,
            blanks: passage.blanks ?? [],
          })),
        );
        setError("");
      } catch (caught: unknown) {
        if (!cancelled) {
          setError(getErrorMessage(caught));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadActivity();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, slug]);

  function updatePassage(id: string, update: (passage: PassageDraft) => PassageDraft): void {
    setPassages((current) => current.map((passage) => passage.id === id ? update(passage) : passage));
  }

  function handleTextChange(id: string, event: ChangeEvent<HTMLTextAreaElement>): void {
    const text = event.target.value;
    setAudioPreviews((current) => { const next = { ...current }; delete next[id]; return next; });
    updatePassage(id, (passage) => ({
      ...passage,
      text,
      blanks: [],
      audio: { storageKey: null, publicUrl: null, disclosure: null, status: "PENDING", model: null, voice: null, textHash: null, durationSeconds: null },
    }));
  }

  function addSelectedBlank(passage: PassageDraft): void {
    const textarea = textareas.current[passage.id];
    if (!textarea || textarea.selectionStart === textarea.selectionEnd) {
      setError("Selecione uma palavra ou trecho no texto antes de adicionar uma lacuna.");
      return;
    }
    const startOffset = textarea.selectionStart;
    const endOffset = textarea.selectionEnd;
    const expectedAnswer = passage.text.slice(startOffset, endOffset);
    if (passage.blanks.some((blank) => startOffset < blank.endOffset && endOffset > blank.startOffset)) {
      setError("Esse trecho se sobrepõe a uma lacuna existente.");
      return;
    }
    const blank: ListeningBlankInput = { id: crypto.randomUUID(), startOffset, endOffset, expectedAnswer, alternatives: [], grammarCategory: null };
    updatePassage(passage.id, (current) => ({ ...current, blanks: [...current.blanks, blank].sort((a, b) => a.startOffset - b.startOffset) }));
    setError("");
    setNotice(`Lacuna adicionada: “${expectedAnswer}”.`);
  }

  function updateBlank(passageId: string, blankId: string, alternativesText: string): void {
    const alternatives = alternativesText.split(";").map((item) => item.trim()).filter(Boolean);
    updatePassage(passageId, (passage) => ({
      ...passage,
      blanks: passage.blanks.map((blank) => blank.id === blankId ? { ...blank, alternatives } : blank),
    }));
  }

  async function handleSave(): Promise<void> {
    if (coverGenerationState !== "idle") {
      setError(coverGenerationState === "generating"
        ? "Aguarde a geração da capa terminar antes de salvar."
        : coverGenerationState === "awaiting_selection"
          ? "Escolha usar ou descartar a capa gerada antes de salvar."
          : "A geração da capa falhou. Tente novamente ou descarte a tentativa antes de salvar.");
      return;
    }
    setError("");
    setNotice("");
    if (!name.trim()) { setError("Informe o nome da atividade."); return; }
    if (passages.length === 0 || passages.some((passage) => !passage.text.trim() || passage.blanks.length === 0)) {
      setError("Cada texto precisa ter conteúdo e pelo menos uma lacuna."); return;
    }
    if (passages.some((passage) => passage.text.length > 4096)) { setError("Cada texto pode ter no máximo 4.096 caracteres."); return; }
    if (timeLimitMinutes.trim() && (!Number.isInteger(Number(timeLimitMinutes)) || Number(timeLimitMinutes) < 1 || Number(timeLimitMinutes) > 240)) { setError("O tempo limite deve estar entre 1 e 240 minutos ou ficar vazio."); return; }
    setSaving(true);
    try {
      await listeningService.edit(slug, {
        name: name.trim(), description: description.trim(), difficulty,
        timeLimitSeconds: timeLimitMinutes.trim() ? Math.round(Number(timeLimitMinutes) * 60) : null,
        content: {
          language, instructions: instructions.trim(),
          passages: passages.map(({ id, title, text, blanks }) => ({ id, title: title.trim(), text, blanks })),
        },
      });
      if (coverChanged) await activityCoverService.update(slug, cover?.id ?? null);
      let savedPreviewCount = 0;
      const previewErrors: string[] = [];

      for (const passage of passages) {
        const preview = audioPreviews[passage.id];
        if (!preview) continue;

        const audioBase64 = preview.url.split(",")[1];
        if (!audioBase64) {
          previewErrors.push(passage.title.trim() || "Texto sem título");
          continue;
        }

        try {
          await listeningService.generateAudio(slug, passage.id, preview.voice, audioBase64);
          savedPreviewCount += 1;
        } catch {
          previewErrors.push(passage.title.trim() || "Texto sem título");
        }
      }

      const updated = await listeningService.get(slug);
      setPassages(updated.version.content.passages);
      if (previewErrors.length === 0) setAudioPreviews({});
      if (previewErrors.length > 0) {
        setError(`Alterações salvas, mas não foi possível persistir o áudio de: ${previewErrors.join(", ")}. Gere novamente ou crie outra prévia.`);
      }
      setNotice(savedPreviewCount > 0
        ? `Alterações salvas e ${savedPreviewCount} prévia(s) armazenada(s) como áudio definitivo.`
        : "Alterações salvas.");
    } catch (caught: unknown) {
      setError(getErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  async function handlePreviewAudio(passage: PassageDraft): Promise<void> {
    setError("");
    setNotice("");
    setPreviewingId(passage.id);
    try {
      const result = await listeningService.generateAudioPreview(passage.text, voice, language);
      setAudioPreviews((current) => ({
        ...current,
        [passage.id]: { url: result.audioDataUrl, disclosure: result.disclosure, voice },
      }));
      setNotice(`Prévia gerada para “${passage.title.trim() || "Texto sem título"}”.`);
    } catch (caught: unknown) {
      setError(getErrorMessage(caught));
    } finally {
      setPreviewingId("");
    }
  }

  async function handleGenerateAudio(passage: PassageDraft): Promise<void> {
    setError("");
    setNotice("");
    setGeneratingId(passage.id);
    try {
      await listeningService.edit(slug, {
        name: name.trim(), description: description.trim(), difficulty,
        timeLimitSeconds: timeLimitMinutes.trim() ? Math.round(Number(timeLimitMinutes) * 60) : null,
        content: { language, instructions: instructions.trim(), passages: passages.map(({ id, title, text, blanks }) => ({ id, title: title.trim(), text, blanks })) },
      });
      const preview = audioPreviews[passage.id];
      const audioBase64 = preview?.url.split(",")[1];
      const result = await listeningService.generateAudio(
        slug,
        passage.id,
        preview?.voice ?? voice,
        audioBase64,
      );
      updatePassage(passage.id, (current) => ({ ...current, audio: result.audio }));
      setAudioPreviews((current) => { const next = { ...current }; delete next[passage.id]; return next; });
      setNotice(`Áudio salvo para “${passage.title.trim() || "Texto sem título"}”.`);
    } catch (caught: unknown) {
      setError(getErrorMessage(caught));
    } finally {
      setGeneratingId("");
    }
  }

  function ignoreSelection(event: MouseEvent<HTMLButtonElement>): void { event.preventDefault(); }

  return (
    <RoleBasedLayout area="teacher" allowedRoles={["TEACHER"]} title="Editar atividade de Listening" description="Edite os textos, revise as lacunas e atualize as narrações.">
      <div className="mb-6">
        <Link href="/teacher/activities" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted hover:text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
          <ArrowLeft aria-hidden="true" size={16} /> Voltar às atividades
        </Link>
      </div>
      {loading ? <p role="status" className="rounded-xl border border-border p-6 text-sm text-muted">Carregando atividade...</p> : (
        <div className="space-y-6">
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          {notice && <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">{notice}</p>}
          <ActivityCoverSelector value={cover} onChange={(value) => { setCover(value); setCoverChanged(true); }} onGenerationStateChange={setCoverGenerationState} disabled={saving} />
          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-dark">Informações da atividade</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2"><label htmlFor="listening-name" className="block text-sm font-medium text-dark">Nome *</label><input id="listening-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-dark" /></div>
              <div className="md:col-span-2"><label htmlFor="listening-description" className="block text-sm font-medium text-dark">Descrição</label><textarea id="listening-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={2} maxLength={2000} className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-dark" /></div>
              <div><label htmlFor="listening-difficulty" className="block text-sm font-medium text-dark">Dificuldade</label><select id="listening-difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-dark"><option value="EASY">Fácil</option><option value="MEDIUM">Média</option><option value="HARD">Difícil</option></select></div>
              <div><label htmlFor="listening-time" className="block text-sm font-medium text-dark">Tempo limite (minutos, opcional)</label><input id="listening-time" type="number" min={1} max={240} value={timeLimitMinutes} onChange={(event) => setTimeLimitMinutes(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-dark" /></div>
              <div className="md:col-span-2"><label htmlFor="listening-instructions" className="block text-sm font-medium text-dark">Instruções</label><textarea id="listening-instructions" value={instructions} onChange={(event) => setInstructions(event.target.value)} rows={2} maxLength={2000} className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-dark" /></div>
            </div>
          </section>
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-dark">Textos e lacunas</h2><p className="mt-1 text-sm text-muted">Selecione um trecho no texto para transformá-lo em lacuna.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setIsAiModalOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-dark px-3 text-sm font-semibold text-white hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><Sparkles aria-hidden="true" size={17} /> Criar texto com IA</button><button type="button" onClick={() => setPassages((current) => [...current, createPassage()])} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><Plus aria-hidden="true" size={17} /> Adicionar texto</button></div></div>
          <ListeningAiTextGenerator open={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} onApply={(title, text, suggestedBlanks) => {
            const blanks = makeSuggestedBlanks(text, suggestedBlanks);
            setPassages((current) => [...current, { ...createPassage(), title, text, blanks }]);
            setNotice(`Texto adicionado à atividade com ${blanks.length} lacuna(s) sugerida(s). Revise as lacunas antes de salvar.`);
          }} />
          {passages.map((passage, index) => (
            <article key={passage.id} className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-semibold text-dark">Texto {index + 1}</h3>{passages.length > 1 && <button type="button" onClick={() => setPassages((current) => current.filter((item) => item.id !== passage.id))} className="inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><Trash2 aria-hidden="true" size={16} /> Remover</button>}</div>
              <label htmlFor={`passage-title-${passage.id}`} className="block text-sm font-medium text-dark">Título (opcional)</label><input id={`passage-title-${passage.id}`} value={passage.title} onChange={(event) => updatePassage(passage.id, (current) => ({ ...current, title: event.target.value }))} maxLength={160} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-dark" />
              <div className="mt-4"><label htmlFor={`passage-text-${passage.id}`} className="block text-sm font-medium text-dark">Texto completo * ({passage.text.length}/4096)</label><textarea ref={(element) => { textareas.current[passage.id] = element; }} id={`passage-text-${passage.id}`} value={passage.text} onChange={(event) => handleTextChange(passage.id, event)} maxLength={4096} rows={7} className="mt-1 w-full rounded-xl border border-border bg-background p-3 leading-7 text-dark" /></div>
              <div className="mt-2 flex flex-wrap items-center gap-3"><button type="button" onMouseDown={ignoreSelection} onClick={() => addSelectedBlank(passage)} disabled={!passage.text} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-dark px-3 text-sm font-semibold text-white disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><CirclePlus aria-hidden="true" size={17} /> Adicionar lacuna da seleção</button><span className="text-xs text-muted">O áudio narra o texto completo, incluindo as lacunas.</span></div>
              {passage.blanks.length > 0 && <div className="mt-5 space-y-3"><h4 className="text-sm font-semibold text-dark">Lacunas ({passage.blanks.length})</h4>{passage.blanks.map((blank, blankIndex) => <div key={blank.id} className="flex flex-col gap-3 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="text-sm font-medium text-dark">{blankIndex + 1}. “{blank.expectedAnswer}”</p><label htmlFor={`alternatives-${blank.id}`} className="mt-2 block text-xs font-medium text-muted">Respostas alternativas separadas por ponto e vírgula</label><input id={`alternatives-${blank.id}`} value={blank.alternatives.join("; ")} onChange={(event) => updateBlank(passage.id, blank.id, event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-dark" /></div><button type="button" onClick={() => updatePassage(passage.id, (current) => ({ ...current, blanks: current.blanks.filter((item) => item.id !== blank.id) }))} aria-label={`Remover lacuna ${blank.expectedAnswer}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><Trash2 aria-hidden="true" size={16} /> Remover</button></div>)}</div>}
              <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 flex-wrap items-center gap-3"><label htmlFor={`voice-${passage.id}`} className="text-sm font-medium text-dark">Voz</label><select id={`voice-${passage.id}`} value={voice} onChange={(event) => { setVoice(event.target.value as ListeningVoice); setAudioPreviews({}); }} className="min-h-10 max-w-full rounded-lg border border-border bg-background px-3 text-sm text-dark">{voices.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>{passage.audio?.status === "READY" && <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700"><CheckCircle2 size={14} aria-hidden="true" /> Áudio pronto</span>}</div><div className="flex flex-wrap items-center gap-3"><button type="button" onClick={() => void handlePreviewAudio(passage)} disabled={Boolean(previewingId) || !passage.text.trim()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-semibold text-dark disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><AudioLines aria-hidden="true" size={16} />{previewingId === passage.id ? "Gerando prévia..." : "Ouvir prévia"}</button><button type="button" onClick={() => void handleGenerateAudio(passage)} disabled={Boolean(generatingId) || !passage.text.trim() || passage.blanks.length === 0} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-white disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><AudioLines aria-hidden="true" size={16} />{generatingId === passage.id ? "Gerando..." : "Salvar e gerar áudio"}</button>{passage.audio?.publicUrl && <audio controls preload="none" src={passage.audio.publicUrl} className="min-h-10 max-w-full" aria-label={`Ouvir ${passage.title || "texto"}`} />}{audioPreviews[passage.id] && <div className="w-full rounded-xl border border-blue-200 bg-blue-50 p-3"><audio controls preload="none" src={audioPreviews[passage.id].url} className="min-h-10 w-full" aria-label={`Prévia de áudio de ${passage.title || "texto"}`} /><p className="mt-2 text-xs text-blue-900">{audioPreviews[passage.id].disclosure}</p></div>}</div></div>
              {passage.audio?.disclosure && <p className="mt-2 text-xs text-muted">{passage.audio.disclosure}</p>}
            </article>
          ))}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted">{passages.length} texto(s) · {totalBlanks} lacuna(s)</p><button type="button" onClick={() => void handleSave()} disabled={saving || coverGenerationState !== "idle"} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><Save aria-hidden="true" size={18} />{saving ? "Salvando..." : "Salvar alterações"}</button></div>
        </div>
      )}
    </RoleBasedLayout>
  );
}
