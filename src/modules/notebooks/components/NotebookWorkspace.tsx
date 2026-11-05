import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Bold, BookOpen, Download, ExternalLink, FileText, Italic, ListOrdered, MessageCircle, Paperclip, Send, SplitSquareHorizontal, Underline } from "lucide-react";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import {
  createNotebookAttachment,
  createNotebookEntry,
  downloadNotebookAttachment,
  createNotebookNote,
  getNotebook,
  listNotebookNotes,
  reorderNotebookEntries,
} from "../services/notebookService";
import type { NotebookDay, NotebookNote } from "../types/notebook.types";

interface NotebookWorkspaceProps {
  relationshipId: string;
  mode: "teacher" | "student";
  studentName?: string;
}

function formatDay(value: string): string {
  const [year, month, day] = value.slice(0, 10).split("-");
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))));
}

function contentText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function renderFormattedText(value: string): ReactNode[] {
  const pattern = /\*\*[\s\S]+?\*\*|__[\s\S]+?__|\/\/[\s\S]+?\/\/|\[size=(?:12|14|16|18|20|24)\][\s\S]+?\[\/size\]/g;
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let index = 0;

  for (const match of value.matchAll(pattern)) {
    const token = match[0];
    const start = match.index ?? 0;
    if (start > cursor) nodes.push(value.slice(cursor, start));

    if (token.startsWith("**")) {
      nodes.push(<strong key={index}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("__")) {
      nodes.push(<u key={index}>{token.slice(2, -2)}</u>);
    } else if (token.startsWith("//")) {
      nodes.push(<em key={index}>{token.slice(2, -2)}</em>);
    } else {
      const size = token.match(/^\[size=(12|14|16|18|20|24)\]/)?.[1] ?? "16";
      nodes.push(<span key={index} style={{ fontSize: Number(size) }}>{token.replace(/^\[size=\d+\]/, "").replace(/\[\/size\]$/, "")}</span>);
    }
    cursor = start + token.length;
    index += 1;
  }

  if (cursor < value.length) nodes.push(value.slice(cursor));
  return nodes;
}

export function NotebookWorkspace({
  relationshipId,
  mode,
  studentName,
}: NotebookWorkspaceProps) {
  const { user } = useAuth();
  const [days, setDays] = useState<NotebookDay[]>([]);
  const [notes, setNotes] = useState<NotebookNote[]>([]);
  const [entryText, setEntryText] = useState("");
  const entryEditorRef = useRef<HTMLTextAreaElement | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [entryKind, setEntryKind] = useState<"TEXT" | "ACTIVITY_LINK">("TEXT");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [noteText, setNoteText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(true);
  const [twoPages, setTwoPages] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [error, setError] = useState("");

  const loadContent = useCallback(async () => {
    setError("");
    try {
      const [notebookDays, notebookNotes] = await Promise.all([
        getNotebook(relationshipId),
        listNotebookNotes(relationshipId),
      ]);
      setDays(notebookDays);
      setNotes(notebookNotes);
    } catch {
      setError("Não foi possível carregar o caderno. Atualize a página para tentar novamente.");
    } finally {
      setIsLoading(false);
    }
  }, [relationshipId]);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialContent(): Promise<void> {
      try {
        const [notebookDays, notebookNotes] = await Promise.all([
          getNotebook(relationshipId),
          listNotebookNotes(relationshipId),
        ]);

        if (isMounted) {
          setDays(notebookDays);
          setNotes(notebookNotes);
        }
      } catch {
        if (isMounted) {
          setError("Não foi possível carregar o caderno. Atualize a página para tentar novamente.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialContent();

    return () => {
      isMounted = false;
    };
  }, [relationshipId]);

  function applyTextFormat(prefix: string, suffix = prefix): void {
    const editor = entryEditorRef.current;
    if (!editor) return;

    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = entryText.slice(start, end);
    const replacement = `${prefix}${selectedText}${suffix}`;
    const updatedText = `${entryText.slice(0, start)}${replacement}${entryText.slice(end)}`;
    setEntryText(updatedText);

    requestAnimationFrame(() => {
      editor.focus();
      const selectionStart = start + prefix.length;
      const selectionEnd = selectionStart + selectedText.length;
      editor.setSelectionRange(selectionStart, selectionEnd);
    });
  }

  async function moveEntry(day: NotebookDay, entryIndex: number, direction: -1 | 1): Promise<void> {
    const targetIndex = entryIndex + direction;
    if (isSavingOrder || targetIndex < 0 || targetIndex >= day.entries.length) return;

    const reorderedEntries = [...day.entries];
    const [movedEntry] = reorderedEntries.splice(entryIndex, 1);
    reorderedEntries.splice(targetIndex, 0, movedEntry);

    setIsSavingOrder(true);
    try {
      await reorderNotebookEntries(relationshipId, day.id, reorderedEntries.map((entry) => entry.id));
      setDays((currentDays) => currentDays.map((currentDay) => (
        currentDay.id === day.id ? { ...currentDay, entries: reorderedEntries } : currentDay
      )));
    } catch {
      setError("Não foi possível salvar a nova ordem dos itens.");
    } finally {
      setIsSavingOrder(false);
    }
  }

  function renderOrderControls(day: NotebookDay, entryIndex: number): ReactNode {
    return (
      <div className="mb-2 flex items-center justify-end gap-1">
        <span className="mr-auto text-[11px] font-semibold text-[#76694f]">Posição {entryIndex + 1}</span>
        <button type="button" disabled={isSavingOrder || entryIndex === 0} onClick={() => void moveEntry(day, entryIndex, -1)} aria-label="Mover item para cima" className="inline-flex size-8 items-center justify-center rounded-md border border-[#c8b994] bg-white text-[#51452f] disabled:opacity-30">
          <ArrowUp size={15} aria-hidden="true" />
        </button>
        <button type="button" disabled={isSavingOrder || entryIndex === day.entries.length - 1} onClick={() => void moveEntry(day, entryIndex, 1)} aria-label="Mover item para baixo" className="inline-flex size-8 items-center justify-center rounded-md border border-[#c8b994] bg-white text-[#51452f] disabled:opacity-30">
          <ArrowDown size={15} aria-hidden="true" />
        </button>
      </div>
    );
  }

  async function handleAttachmentDownload(entryId: string, fileName: string): Promise<void> {
    try {
      const blob = await downloadNotebookAttachment(relationshipId, entryId);
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      setError("Não foi possível baixar este anexo.");
    }
  }

  async function handleAddAttachment(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!selectedFile) return;
    const form = event.currentTarget;

    const maxBytes = selectedFile.type.startsWith("video/")
      ? 50 * 1024 * 1024
      : selectedFile.type.startsWith("image/") ? 5 * 1024 * 1024 : 20 * 1024 * 1024;
    if (selectedFile.size > maxBytes) {
      setError(selectedFile.type.startsWith("video/")
        ? "Vídeos podem ter no máximo 50 MB."
        : selectedFile.type.startsWith("image/") ? "Imagens podem ter no máximo 5 MB." : "Documentos podem ter no máximo 20 MB.");
      return;
    }

    setError("");
    setIsUploadingAttachment(true);
    try {
      await createNotebookAttachment(relationshipId, selectedFile);
      setSelectedFile(null);
      form.reset();
      await loadContent();
    } catch {
      setError("Não foi possível anexar o arquivo. Verifique o formato e tente novamente.");
    } finally {
      setIsUploadingAttachment(false);
    }
  }

  async function handleAddEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSavingEntry(true);
    try {
      if (entryKind === "TEXT") {
        await createNotebookEntry(relationshipId, "TEXT", { text: entryText.trim() });
        setEntryText("");
      } else {
        await createNotebookEntry(relationshipId, "ACTIVITY_LINK", {
          title: linkTitle.trim(),
          url: linkUrl.trim(),
        });
        setLinkTitle("");
        setLinkUrl("");
      }
      await loadContent();
    } catch {
      setError("Não foi possível publicar o conteúdo no caderno.");
    } finally {
      setIsSavingEntry(false);
    }
  }

  async function handleAddNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSavingNote(true);
    try {
      await createNotebookNote(relationshipId, noteText.trim(), replyTo);
      setNoteText("");
      setReplyTo(null);
      const updatedNotes = await listNotebookNotes(relationshipId);
      setNotes(updatedNotes);
    } catch {
      setError("Não foi possível enviar sua mensagem.");
    } finally {
      setIsSavingNote(false);
    }
  }

  const orderedDays = [...days].reverse();
  const visibleDays = twoPages ? orderedDays.slice(-2) : orderedDays.slice(-1);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{mode === "teacher" ? "Caderno do aluno" : "Seu caderno de estudos"}</p>
          <h2 className="text-xl font-bold text-dark">{mode === "student" && studentName ? `Professor: ${studentName}` : studentName ?? "Caderno virtual"}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {mode === "teacher" && (
            <button
              type="button"
              onClick={() => setIsReordering((value) => !value)}
              aria-pressed={isReordering}
              className={isReordering ? "inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-white" : "inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-dark hover:bg-background"}
            >
              <ListOrdered size={16} aria-hidden="true" />
              {isReordering ? "Concluir organização" : "Organizar itens"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setTwoPages((value) => !value)}
            aria-pressed={twoPages}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-dark hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <SplitSquareHorizontal size={16} aria-hidden="true" />
            {twoPages ? "Uma página" : "Duas páginas"}
          </button>
          <button
            type="button"
            onClick={() => setShowNotes((value) => !value)}
            aria-expanded={showNotes}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-dark hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <MessageCircle size={16} aria-hidden="true" />
            {showNotes ? "Ocultar notas" : "Bloco de notas"}
          </button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <div className={showNotes ? "grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]" : "grid"}>
        <section className="min-w-0">
          <div className="relative rounded-2xl border border-[#d5c7a8] bg-[#e8dfcb] p-3 shadow-inner sm:p-5">
            <div className={twoPages ? "grid gap-3 md:grid-cols-[minmax(0,1fr)_22px_minmax(0,1fr)]" : "mx-auto grid max-w-3xl"}>
              {twoPages && (
                <div className="hidden items-center justify-center md:col-start-2 md:flex" aria-hidden="true">
                  <div className="flex h-full min-h-80 flex-col justify-around border-x-2 border-[#9b8b6d] px-1">
                    {Array.from({ length: 13 }, (_, index) => (
                      <span key={index} className="size-3 rounded-full border-2 border-[#8b7b60] bg-[#d5c7a8] shadow-sm" />
                    ))}
                  </div>
                </div>
              )}
              {visibleDays.length === 0 ? (
                <div className="flex min-h-[28rem] items-center justify-center rounded-lg border border-[#d8c9a9] bg-[repeating-linear-gradient(to_bottom,#fffdf5_0px,#fffdf5_27px,#dce5ef_28px)] p-8 text-center shadow-sm">
                  <div>
                    <BookOpen className="mx-auto text-[#8b7b60]" size={34} aria-hidden="true" />
                    <h3 className="mt-3 font-semibold text-[#51452f]">Este caderno ainda está em branco</h3>
                    <p className="mt-1 text-sm text-[#76694f]">{mode === "teacher" ? "Publique o primeiro conteúdo para começar." : "Seu professor ainda não publicou conteúdo."}</p>
                  </div>
                </div>
              ) : (
                visibleDays.map((day, index) => (
                  <article key={day.id} className={"min-h-[28rem] rounded-lg border border-[#d8c9a9] bg-[repeating-linear-gradient(to_bottom,#fffdf5_0px,#fffdf5_27px,#dce5ef_28px)] p-5 shadow-sm sm:p-7 " + (twoPages && visibleDays.length > 1 ? (index === 0 ? "md:col-start-1" : "md:col-start-3") : "md:col-start-1")}>
                    <div className="mb-5 flex items-center justify-between border-b border-[#d8c9a9] pb-2">
                      <h3 className="text-sm font-bold capitalize text-[#66583e]">{formatDay(day.dayDate)}</h3>
                      <span className="text-xs text-[#998b70]">TimeToLearn</span>
                    </div>
                    <div className="space-y-4">
                      {day.entries.map((entry, entryIndex) => {
                        if (entry.kind === "IMAGE" || entry.kind === "FILE") {
                          const fileName = contentText(entry.content.fileName) || "Anexo";
                          return (
                            <div key={entry.id} className="rounded-lg border border-[#d8c9a9] bg-white/75 p-3">
                              {isReordering && renderOrderControls(day, entryIndex)}
                              <div className="flex items-center gap-3">
                                <FileText size={22} className="shrink-0 text-[#8b7b60]" aria-hidden="true" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-[#51452f]">{fileName}</p>
                                  <p className="text-xs text-[#76694f]">{entry.kind === "IMAGE" ? "Imagem" : "Arquivo anexado"}</p>
                                </div>
                                <button type="button" onClick={() => void handleAttachmentDownload(entry.id, fileName)} aria-label={`Baixar ${fileName}`} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#c8b994] bg-white px-3 text-xs font-semibold text-[#51452f] hover:bg-[#f5efdf]">
                                  <Download size={15} aria-hidden="true" /> Baixar
                                </button>
                              </div>
                            </div>
                          );
                        }
                        if (entry.kind === "ACTIVITY_LINK") {
                          const url = contentText(entry.content.url);
                          return (
                            <div key={entry.id} className="rounded-lg border border-[#d8c9a9] bg-white/70 p-3">
                              {isReordering && renderOrderControls(day, entryIndex)}
                              <p className="font-semibold text-[#51452f]">{contentText(entry.content.title) || "Atividade"}</p>
                              <a href={url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 underline">
                                Abrir atividade <ExternalLink size={14} aria-hidden="true" />
                              </a>
                            </div>
                          );
                        }
                        return (
                          <div key={entry.id}>
                            {isReordering && renderOrderControls(day, entryIndex)}
                            <p className="whitespace-pre-wrap text-sm leading-7 text-[#51452f]">
                              {renderFormattedText(contentText(entry.content.text))}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                ))
              )}
            </div>
            {twoPages && <div className="mt-3 text-center text-xs text-[#76694f] md:hidden">A visualização em duas páginas fica disponível em telas maiores.</div>}
          </div>

          {isLoading && <p className="mt-3 text-sm text-muted">Carregando caderno...</p>}

          {mode === "teacher" && (
            <form onSubmit={(event) => void handleAddEntry(event)} className="mt-5 rounded-2xl border border-border bg-surface p-4 sm:p-5">
              <h3 className="font-semibold text-dark">Adicionar conteúdo</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => setEntryKind("TEXT")} aria-pressed={entryKind === "TEXT"} className={entryKind === "TEXT" ? "rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white" : "rounded-lg border border-border px-3 py-2 text-sm font-semibold text-dark"}>Texto</button>
                <button type="button" onClick={() => setEntryKind("ACTIVITY_LINK")} aria-pressed={entryKind === "ACTIVITY_LINK"} className={entryKind === "ACTIVITY_LINK" ? "rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white" : "rounded-lg border border-border px-3 py-2 text-sm font-semibold text-dark"}>Link de atividade</button>
              </div>
              {entryKind === "TEXT" ? (
                <label className="mt-3 block text-sm font-medium text-dark">
                  Texto
                  <div className="mt-2 flex flex-wrap items-center gap-1 rounded-t-xl border border-b-0 border-border bg-background p-2">
                    <button type="button" onClick={() => applyTextFormat("**")} aria-label="Aplicar negrito" title="Negrito" className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-white text-dark hover:bg-primary/10"><Bold size={17} aria-hidden="true" /></button>
                    <button type="button" onClick={() => applyTextFormat("//")} aria-label="Aplicar itálico" title="Itálico" className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-white text-dark hover:bg-primary/10"><Italic size={17} aria-hidden="true" /></button>
                    <button type="button" onClick={() => applyTextFormat("__")} aria-label="Aplicar sublinhado" title="Sublinhado" className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-white text-dark hover:bg-primary/10"><Underline size={17} aria-hidden="true" /></button>
                    <span className="mx-1 h-6 border-l border-border" aria-hidden="true" />
                    <span className="px-1 text-xs font-medium text-muted">Fonte</span>
                    {[12, 14, 16, 18, 20, 24].map((size) => (
                      <button key={size} type="button" onClick={() => applyTextFormat(`[size=${size}]`, "[/size]")} aria-label={`Aplicar tamanho de fonte ${size}`} title={`${size}px`} className="min-h-9 min-w-9 rounded-lg border border-border bg-white px-2 text-xs font-semibold text-dark hover:bg-primary/10">{size}</button>
                    ))}
                  </div>
                  <textarea ref={entryEditorRef} required value={entryText} onChange={(event) => setEntryText(event.target.value)} rows={5} className="w-full rounded-b-xl border border-border bg-white p-3 text-sm text-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Escreva o conteúdo da aula..." />
                  <span className="mt-1 block text-xs font-normal text-muted">Selecione um trecho e use a barra para formatar. A formatação será mantida para o aluno.</span>
                </label>
              ) : (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-medium text-dark">Nome da atividade<input required value={linkTitle} onChange={(event) => setLinkTitle(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary" /></label>
                  <label className="text-sm font-medium text-dark">Endereço do link<input required type="url" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary" placeholder="https://..." /></label>
                </div>
              )}
              <button type="submit" disabled={isSavingEntry || (entryKind === "TEXT" ? !entryText.trim() : !linkTitle.trim() || !linkUrl.trim())} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                <Send size={16} aria-hidden="true" />
                {isSavingEntry ? "Publicando..." : "Publicar no caderno"}
              </button>
              <p className="mt-2 text-xs text-muted">A data de hoje será criada automaticamente quando este for o primeiro conteúdo do dia.</p>
            </form>
          )}

          {mode === "teacher" && (
            <form onSubmit={(event) => void handleAddAttachment(event)} className="mt-4 rounded-2xl border border-border bg-surface p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <Paperclip size={18} className="text-primary" aria-hidden="true" />
                <h3 className="font-semibold text-dark">Anexar material</h3>
              </div>
              <p className="mt-1 text-xs text-muted">Imagens, PDF, Word, Excel, CSV e vídeos. Imagens até 5 MB; documentos até 20 MB; vídeos até 50 MB.</p>
              <label htmlFor="notebook-attachment" className="mt-3 block text-sm font-medium text-dark">Selecionar arquivo</label>
              <input
                id="notebook-attachment"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx,.csv,.mp4,.webm,.mov"
                onChange={(event) => setSelectedFile(event.currentTarget.files?.[0] ?? null)}
                className="mt-2 block min-h-11 w-full rounded-xl border border-border bg-white p-2 text-sm text-dark file:mr-3 file:rounded-lg file:border-0 file:bg-background file:px-3 file:py-2 file:text-sm file:font-semibold file:text-dark"
              />
              {selectedFile && <p className="mt-2 truncate text-xs text-muted">Selecionado: {selectedFile.name}</p>}
              <button type="submit" disabled={!selectedFile || isUploadingAttachment} className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                <Paperclip size={15} aria-hidden="true" />
                {isUploadingAttachment ? "Enviando arquivo..." : "Adicionar anexo"}
              </button>
            </form>
          )}
        </section>

        {showNotes && (
          <aside className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <MessageCircle size={19} className="text-primary" aria-hidden="true" />
              <h3 className="font-semibold text-dark">Bloco de notas compartilhado</h3>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted">Anotações e dúvidas ficam visíveis para o aluno e o professor.</p>
            <div className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto">
              {notes.length === 0 ? (
                <p className="rounded-xl bg-background p-3 text-sm text-muted">Nenhuma observação por enquanto.</p>
              ) : notes.map((note) => (
                <article key={note.id} className="rounded-xl bg-background p-3">
                  <p className="whitespace-pre-wrap text-sm text-dark">{note.message}</p>
                  <p className="mt-2 text-[11px] text-muted">{note.authorId === user?.id ? "Você" : mode === "teacher" ? "Aluno" : "Professor"} · {new Date(note.createdAt).toLocaleString("pt-BR")}</p>
                  <button type="button" onClick={() => setReplyTo(note.id)} className="mt-2 text-xs font-semibold text-primary underline">Responder</button>
                </article>
              ))}
            </div>
            {replyTo && <p className="mt-3 text-xs text-primary">Respondendo a uma mensagem. <button type="button" onClick={() => setReplyTo(null)} className="underline">Cancelar</button></p>}
            <form onSubmit={(event) => void handleAddNote(event)} className="mt-4 space-y-2">
              <label htmlFor="notebook-note" className="text-sm font-medium text-dark">Sua mensagem</label>
              <textarea id="notebook-note" required value={noteText} onChange={(event) => setNoteText(event.target.value)} rows={3} maxLength={5000} className="w-full rounded-xl border border-border bg-white p-3 text-sm text-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Escreva uma dúvida ou observação..." />
              <button type="submit" disabled={isSavingNote || !noteText.trim()} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-white disabled:opacity-50">
                <Send size={15} aria-hidden="true" />
                {isSavingNote ? "Enviando..." : "Enviar mensagem"}
              </button>
            </form>
          </aside>
        )}
      </div>
    </div>
  );
}
