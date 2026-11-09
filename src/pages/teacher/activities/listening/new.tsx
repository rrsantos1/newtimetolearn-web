import { useMemo, useRef, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { ActivityCoverSelector, type ActivityCoverSelection } from "@/modules/activities/components/ActivityCoverSelector";
import { activityCoverService } from "@/modules/activities/services/activityCoverService";
import type { ChangeEvent, MouseEvent } from "react";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft, AudioLines, CheckCircle2, CirclePlus, FileAudio, Plus, Sparkles, Trash2 } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { listeningService } from "@/modules/activities/services/listeningService";
import { ListeningAiTextGenerator } from "@/modules/activities/components/ListeningAiTextGenerator";
import type { ListeningBlankInput, ListeningPassageInput, ListeningVoice } from "@/modules/activities/services/listeningService";

type CoverGenerationState = "idle" | "generating" | "awaiting_selection" | "failed";

interface PassageDraft extends ListeningPassageInput {
  audio?: ListeningPassageInput["audio"];
}

const voices: Array<{ value: ListeningVoice; label: string }> = [
  { value: "coral", label: "Coral — natural" },
  { value: "alloy", label: "Alloy — equilibrada" },
  { value: "ash", label: "Ash — clara" },
  { value: "nova", label: "Nova — expressiva" },
  { value: "shimmer", label: "Shimmer — suave" },
  { value: "onyx", label: "Onyx — grave" },
  { value: "sage", label: "Sage — serena" },
  { value: "echo", label: "Echo — firme" },
  { value: "fable", label: "Fable — narrativa" },
  { value: "ballad", label: "Ballad — calorosa" },
  { value: "verse", label: "Verse — versátil" },
  { value: "marin", label: "Marin — natural" },
  { value: "cedar", label: "Cedar — natural" },
];

function newPassage(id: string = crypto.randomUUID()): PassageDraft {
  return {
    id,
    title: "",
    text: "",
    blanks: [],
    audio: {
      storageKey: null, publicUrl: null, disclosure: null, status: "PENDING",
      model: null, voice: null, textHash: null, durationSeconds: null,
    },
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

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined;
    return data?.error?.message ?? data?.message ?? "Não foi possível concluir a operação.";
  }
  return "Ocorreu um erro inesperado.";
}

export default function NewListeningPage() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [instructions, setInstructions] = useState(t("activity.listening.instructionsDefault"));
  const [passages, setPassages] = useState<PassageDraft[]>([newPassage("passage-1")]);
  const [voice, setVoice] = useState<ListeningVoice>("coral");
  const [savedSlug, setSavedSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [cover, setCover] = useState<ActivityCoverSelection | null>(null);
  const [coverGenerationState, setCoverGenerationState] = useState<CoverGenerationState>("idle");
  const [generatingId, setGeneratingId] = useState("");
  const [previewingId, setPreviewingId] = useState("");
  const [audioPreviews, setAudioPreviews] = useState<Record<string, { url: string; disclosure: string; voice: ListeningVoice }>>({});
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const textareas = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const totalBlanks = useMemo(() => passages.reduce((sum, passage) => sum + passage.blanks.length, 0), [passages]);

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
      setError(t("activity.listening.overlapError"));
      return;
    }
    const blank: ListeningBlankInput = {
      id: crypto.randomUUID(),
      startOffset,
      endOffset,
      expectedAnswer,
      alternatives: [],
      grammarCategory: null,
    };
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
        ? t("activity.listening.generateCoverWait")
        : coverGenerationState === "awaiting_selection"
          ? "Escolha usar ou descartar a capa gerada antes de salvar."
          : t("activity.listening.generateCoverFailed"));
      return;
    }
    setError("");
    setNotice("");
    if (!name.trim()) {
      setError("Informe o nome da atividade.");
      return;
    }
    if (passages.some((passage) => !passage.text.trim() || passage.blanks.length === 0)) {
      setError(t("activity.listening.contentRequired"));
      return;
    }
    if (passages.some((passage) => passage.text.length > 4096)) {
      setError(t("activity.listening.maxCharacters"));
      return;
    }
    setSaving(true);
    try {
      const result = await listeningService.create({
        name: name.trim(),
        description: description.trim(),
        difficulty,
        content: {
          language: "pt-BR",
          instructions: instructions.trim(),
          passages: passages.map(({ id, title, text, blanks }) => ({ id, title: title.trim(), text, blanks })),
        },
      });
      if (cover) await activityCoverService.update(result.activity.slug, cover.id);
      setSavedSlug(result.activity.slug);

      let savedPreviewCount = 0;
      const previewErrors: string[] = [];

      for (const passage of passages) {
        const preview = audioPreviews[passage.id];
        if (!preview) continue;

        const audioBase64 = preview.url.split(",")[1];
        if (!audioBase64) {
          previewErrors.push(passage.title.trim() || t("activity.listening.untitled"));
          continue;
        }

        try {
          const audioResult = await listeningService.generateAudio(
            result.activity.slug,
            passage.id,
            preview.voice,
            audioBase64,
          );
          updatePassage(passage.id, (current) => ({ ...current, audio: audioResult.audio }));
          savedPreviewCount += 1;
        } catch {
          previewErrors.push(passage.title.trim() || t("activity.listening.untitled"));
        }
      }

      if (previewErrors.length > 0) {
        setError(t("activity.listening.audioPersistError").replace("{titles}", previewErrors.join(", ")));
        setNotice(t("activity.listening.previewSaved").replace("{count}", String(savedPreviewCount)));
      } else if (savedPreviewCount > 0) {
        setAudioPreviews({});
        setNotice(t("activity.listening.audioSavedCount").replace("{count}", String(savedPreviewCount)));
      } else {
        setNotice(t("activity.listening.savedPreview"));
      }
    } catch (caught: unknown) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  async function handlePreviewAudio(passage: PassageDraft): Promise<void> {
    setError("");
    setNotice("");
    setPreviewingId(passage.id);
    try {
      const result = await listeningService.generateAudioPreview(passage.text, voice, "pt-BR");
      setAudioPreviews((current) => ({
        ...current,
        [passage.id]: { url: result.audioDataUrl, disclosure: result.disclosure, voice },
      }));
      setNotice(t("activity.listening.previewGenerated").replace("{title}", passage.title.trim() || t("activity.listening.untitled")));
    } catch (caught: unknown) {
      setError(errorMessage(caught));
    } finally {
      setPreviewingId("");
    }
  }

  async function handleGenerateAudio(passage: PassageDraft): Promise<void> {
    if (!savedSlug) return;
    setError("");
    setNotice("");
    setGeneratingId(passage.id);
    try {
      const preview = audioPreviews[passage.id];
      const audioBase64 = preview?.url.split(",")[1];
      const result = await listeningService.generateAudio(
        savedSlug,
        passage.id,
        preview?.voice ?? voice,
        audioBase64,
      );
      updatePassage(passage.id, (current) => ({ ...current, audio: result.audio }));
      setAudioPreviews((current) => { const next = { ...current }; delete next[passage.id]; return next; });
      setNotice(t("activity.listening.audioStored").replace("{title}", passage.title.trim() || t("activity.listening.untitled")));
    } catch (caught: unknown) {
      setError(errorMessage(caught));
    } finally {
      setGeneratingId("");
    }
  }  

  function addPassage(): void {
    setPassages((current) => [...current, newPassage()]);
  }

  function removePassage(id: string): void {
    setPassages((current) => current.filter((passage) => passage.id !== id));
  }

  function ignoreSelection(event: MouseEvent<HTMLButtonElement>): void {
    event.preventDefault();
  }

  return (
    <RoleBasedLayout area="teacher" allowedRoles={["TEACHER"]} title={t("activity.page.create.listening")} description={t("activity.page.description.listening")}>
      <div className="mb-6">
        <Link href="/teacher/activities/new" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted hover:text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
          <ArrowLeft aria-hidden="true" size={16} /> Voltar aos formatos
        </Link>
      </div>

      {savedSlug ? (
        <section className="space-y-6">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-5" role="status">
            <div className="flex items-start gap-3">
              <CheckCircle2 aria-hidden="true" className="mt-0.5 text-green-700" size={22} />
              <div>
                <h2 className="font-semibold text-green-900">Rascunho salvo</h2>
                <p className="mt-1 text-sm leading-6 text-green-800">{t("activity.listening.savedDraft")}</p>
                <Link href="/teacher/activities" className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-white px-4 text-sm font-semibold text-green-900 ring-1 ring-green-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">{t("activity.page.viewActivities")}</Link>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <label htmlFor="listening-voice" className="block text-sm font-medium text-dark">Voz da narração</label>
            <select id="listening-voice" value={voice} onChange={(event) => { setVoice(event.target.value as ListeningVoice); setAudioPreviews({}); }} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-dark sm:max-w-md">
              {voices.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
          {passages.map((passage, index) => (
            <article key={passage.id} className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold text-dark">{index + 1}. {passage.title.trim() || t("activity.listening.untitled")}</h3>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${passage.audio?.status === "READY" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900"}`}>{passage.audio?.status === "READY" ? t("activity.listening.audioReady") : t("activity.listening.audioPending")}</span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted">{passage.text}</p>
              <p className="mt-2 text-sm text-muted">{passage.blanks.length} lacuna(s)</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={() => void handlePreviewAudio(passage)} disabled={Boolean(previewingId) || !passage.text.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-dark disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                  <AudioLines aria-hidden="true" size={17} /> {previewingId === passage.id ? t("activity.listening.generatingPreview") : t("activity.listening.listenPreview")}
                </button>
                <button type="button" onClick={() => void handleGenerateAudio(passage)} disabled={Boolean(generatingId)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                  <AudioLines aria-hidden="true" size={17} /> {generatingId === passage.id ? t("activity.listening.generatingAudio") : passage.audio?.status === "READY" ? t("activity.listening.generateAgain") : t("activity.listening.generateAudio")}
                </button>
                {passage.audio?.publicUrl && <audio controls preload="none" src={passage.audio.publicUrl} className="min-h-11 max-w-full" aria-label={`Ouvir narração de ${passage.title || "texto"}`} />}
                {audioPreviews[passage.id] && <div className="w-full rounded-xl border border-blue-200 bg-blue-50 p-3"><audio controls preload="none" src={audioPreviews[passage.id].url} className="min-h-11 w-full" aria-label={`Prévia de áudio de ${passage.title || "texto"}`} /><p className="mt-2 text-xs text-blue-900">{audioPreviews[passage.id].disclosure}</p></div>}
              </div>
              {passage.audio?.disclosure && <p className="mt-3 text-xs text-muted">{passage.audio.disclosure}</p>}
            </article>
          ))}
        </section>
      ) : (
        <div className="space-y-6">
          <ActivityCoverSelector value={cover} onChange={setCover} onGenerationStateChange={setCoverGenerationState} disabled={saving} />
          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-dark">Informações da atividade</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="listening-name" className="block text-sm font-medium text-dark">Nome da atividade *</label>
                <input id="listening-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-dark" />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="listening-description" className="block text-sm font-medium text-dark">Descrição</label>
                <textarea id="listening-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={2} maxLength={2000} className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-dark" />
              </div>
              <div>
                <label htmlFor="listening-difficulty" className="block text-sm font-medium text-dark">Dificuldade</label>
                <select id="listening-difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value as typeof difficulty)} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-dark">
                  <option value="EASY">Fácil</option><option value="MEDIUM">Média</option><option value="HARD">Difícil</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="listening-instructions" className="block text-sm font-medium text-dark">Instruções para o aluno</label>
                <textarea id="listening-instructions" value={instructions} onChange={(event) => setInstructions(event.target.value)} rows={2} maxLength={2000} className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-dark" />
              </div>
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-lg font-semibold text-dark">Textos e lacunas</h2><p className="mt-1 text-sm text-muted">Selecione uma palavra ou trecho no texto e clique em “Adicionar lacuna”.</p></div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setIsAiModalOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-dark px-3 text-sm font-semibold text-white hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><Sparkles aria-hidden="true" size={17} /> Criar texto com IA</button>
              <button type="button" onClick={addPassage} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold text-dark hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><Plus aria-hidden="true" size={17} /> Adicionar texto</button>
            </div>
          </div>

          <ListeningAiTextGenerator open={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} onApply={(title, text, suggestedBlanks) => {
            const blanks = makeSuggestedBlanks(text, suggestedBlanks);
            const newDraft = {
              ...newPassage(),
              title,
              text,
              blanks,
            };

            setPassages((current) => {
              const emptyPassageIndex = current.findIndex((passage) => !passage.text.trim());
              if (emptyPassageIndex === -1) return [...current, newDraft];

              return current.map((passage, index) => index === emptyPassageIndex
                ? {
                    ...passage,
                    title,
                    text,
                    blanks,
                    audio: {
                      storageKey: null,
                      publicUrl: null,
                      disclosure: null,
                      status: "PENDING" as const,
                      model: null,
                      voice: null,
                      textHash: null,
                      durationSeconds: null,
                    },
                  }
                : passage);
            });
            setAudioPreviews({});
            setError("");
            setNotice(t("activity.listening.addedText").replace("{count}", String(blanks.length)));
          }} />

          {passages.map((passage, index) => (
            <article key={passage.id} className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-dark">Texto {index + 1}</h3>
                {passages.length > 1 && <button type="button" onClick={() => removePassage(passage.id)} className="inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><Trash2 aria-hidden="true" size={16} /> Remover</button>}
              </div>
              <div>
                <label htmlFor={`passage-title-${passage.id}`} className="block text-sm font-medium text-dark">Título do texto (opcional)</label>
                <input id={`passage-title-${passage.id}`} value={passage.title} maxLength={160} onChange={(event) => updatePassage(passage.id, (current) => ({ ...current, title: event.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-dark" />
              </div>
              <div className="mt-4">
                <label htmlFor={`passage-text-${passage.id}`} className="block text-sm font-medium text-dark">Texto completo * <span className="font-normal text-muted">({passage.text.length}/4096)</span></label>
                <textarea ref={(element) => { textareas.current[passage.id] = element; }} id={`passage-text-${passage.id}`} value={passage.text} onChange={(event) => handleTextChange(passage.id, event)} maxLength={4096} rows={7} required className="mt-1 w-full rounded-xl border border-border bg-background p-3 leading-7 text-dark" placeholder={t("activity.listening.passageTextPlaceholder")} />
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button type="button" onMouseDown={ignoreSelection} onClick={() => addSelectedBlank(passage)} disabled={!passage.text} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-dark px-3 text-sm font-semibold text-white disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><CirclePlus aria-hidden="true" size={17} /> Adicionar lacuna da seleção</button>
                  <span className="text-xs text-muted">A narração inclui também as palavras ocultas.</span>
                </div>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                  <div>
                    <label htmlFor={`preview-voice-${passage.id}`} className="block text-xs font-medium text-muted">Voz da prévia</label>
                    <select id={`preview-voice-${passage.id}`} value={voice} onChange={(event) => { setVoice(event.target.value as ListeningVoice); setAudioPreviews({}); }} className="mt-1 min-h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-dark sm:w-auto">
                      {voices.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </div>
                  <button type="button" onClick={() => void handlePreviewAudio(passage)} disabled={Boolean(previewingId) || !passage.text.trim()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-dark disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                    <AudioLines aria-hidden="true" size={16} /> {previewingId === passage.id ? t("activity.listening.generatingPreview") : t("activity.listening.listenPreview")}
                  </button>
                  {audioPreviews[passage.id] && <div className="w-full rounded-xl border border-blue-200 bg-blue-50 p-3"><audio controls preload="none" src={audioPreviews[passage.id].url} className="min-h-10 w-full" aria-label={`Prévia do áudio de ${passage.title || "texto"}`} /><p className="mt-2 text-xs text-blue-900">{audioPreviews[passage.id].disclosure}</p></div>}
                </div>
              </div>
              {passage.blanks.length > 0 && (
                <div className="mt-5 space-y-3">
                  <h4 className="text-sm font-semibold text-dark">Lacunas ({passage.blanks.length})</h4>
                  {passage.blanks.map((blank, blankIndex) => (
                    <div key={blank.id} className="flex flex-col gap-3 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-dark">{blankIndex + 1}. “{blank.expectedAnswer}”</p>
                        <label htmlFor={`blank-alternatives-${blank.id}`} className="mt-2 block text-xs font-medium text-muted">Respostas alternativas, separadas por ponto e vírgula (opcional)</label>
                        <input id={`blank-alternatives-${blank.id}`} value={blank.alternatives.join("; ")} onChange={(event) => updateBlank(passage.id, blank.id, event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-dark" placeholder={t("activity.listening.alternativePlaceholder")} />
                      </div>
                      <button type="button" aria-label={`Remover lacuna ${blank.expectedAnswer}`} onClick={() => updatePassage(passage.id, (current) => ({ ...current, blanks: current.blanks.filter((item) => item.id !== blank.id) }))} className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg px-3 text-sm text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><Trash2 aria-hidden="true" size={16} /> Remover</button>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}

          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          {notice && <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">{notice}</p>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">{passages.length} texto(s) · {totalBlanks} lacuna(s)</p>
            <button type="button" onClick={() => void handleSave()} disabled={saving || coverGenerationState !== "idle"} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
              <FileAudio aria-hidden="true" size={18} /> {saving ? "Salvando rascunho..." : "Salvar rascunho"}
            </button>
          </div>
        </div>
      )}
      {error && savedSlug && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && savedSlug && <p role="status" className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">{notice}</p>}
    </RoleBasedLayout>
  );
}
