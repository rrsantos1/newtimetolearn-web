import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { JSONContent } from "@tiptap/core";
import { NotebookRichTextEditor } from "./NotebookRichTextEditor";
import { ArrowDown, ArrowUp, CalendarDays, Download, ExternalLink, FileText, Link2, ListOrdered, MessageCircle, Paperclip, Pencil, Save, Send, SplitSquareHorizontal, Trash2, X } from "lucide-react";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import {
  createNotebookAttachment,
  createNotebookEntry,
  updateNotebookEntry,
  deleteNotebookEntry,
  downloadNotebookAttachment,
  createNotebookNote,
  getNotebook,
  listNotebookNotes,
  reorderNotebookEntries,
} from "../services/notebookService";
import type { NotebookDay, NotebookNote } from "../types/notebook.types";


import { NotebookAttachmentImage } from "./NotebookAttachmentImage";

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
    const position = match.index ?? 0;
    if (position > cursor) nodes.push(value.slice(cursor, position));
    if (token.startsWith("**")) nodes.push(<strong key={index}>{token.slice(2, -2)}</strong>);
    else if (token.startsWith("__")) nodes.push(<u key={index}>{token.slice(2, -2)}</u>);
    else if (token.startsWith("//")) nodes.push(<em key={index}>{token.slice(2, -2)}</em>);
    else {
      const size = token.match(/^\[size=(12|14|16|18|20|24)\]/)?.[1] ?? "16";
      nodes.push(<span key={index} style={{ fontSize: Number(size) }}>{token.replace(/^\[size=\d+\]/, "").replace(/\[\/size\]$/, "")}</span>);
    }
    cursor = position + token.length;
    index += 1;
  }
  if (cursor < value.length) nodes.push(value.slice(cursor));
  return nodes;
}

function isJsonContent(value: unknown): value is JSONContent {
  return typeof value === "object" && value !== null && !Array.isArray(value) &&
    "type" in value && (value as { type?: unknown }).type === "doc";
}

function parseLegacyLine(line: string): JSONContent[] {
  const pattern = /\*\*[\s\S]+?\*\*|__[\s\S]+?__|\/\/[\s\S]+?\/\/|\[size=(12|14|16|18|20|24)\][\s\S]+?\[\/size\]/g;
  const nodes: JSONContent[] = [];
  let cursor = 0;

  for (const match of line.matchAll(pattern)) {
    const token = match[0];
    const position = match.index ?? 0;
    const plainText = line.slice(cursor, position);
    if (plainText) nodes.push({ type: "text", text: plainText });

    let text = token;
    let marks: NonNullable<JSONContent["marks"]> = [];
    if (token.startsWith("**")) {
      text = token.slice(2, -2);
      marks = [{ type: "bold" }];
    } else if (token.startsWith("__")) {
      text = token.slice(2, -2);
      marks = [{ type: "underline" }];
    } else if (token.startsWith("//")) {
      text = token.slice(2, -2);
      marks = [{ type: "italic" }];
    } else {
      const size = token.match(/^\[size=(12|14|16|18|20|24)\]/)?.[1] ?? "16";
      text = token.replace(/^\[size=\d+\]/, "").replace(/\[\/size\]$/, "");
      marks = [{ type: "textStyle", attrs: { fontSize: `${size}px` } }];
    }
    if (text) nodes.push({ type: "text", text, marks });
    cursor = position + token.length;
  }

  const remainingText = line.slice(cursor);
  if (remainingText) nodes.push({ type: "text", text: remainingText });
  return nodes;
}

function notebookDocument(content: Record<string, unknown>): JSONContent {
  if (isJsonContent(content.document)) return content.document;
  const text = contentText(content.text);
  return {
    type: "doc",
    content: text.split("\n").map((line) => ({
      type: "paragraph",
      content: parseLegacyLine(line),
    })),
  };
}

function renderDocumentNode(node: JSONContent, key: string): ReactNode {
  if (node.type === "text") {
    let rendered: ReactNode = node.text ?? "";
    for (const mark of node.marks ?? []) {
      if (mark.type === "bold") rendered = <strong key={key}>{rendered}</strong>;
      else if (mark.type === "italic") rendered = <em key={key}>{rendered}</em>;
      else if (mark.type === "underline") rendered = <u key={key}>{rendered}</u>;
      else if (mark.type === "strike") rendered = <s key={key}>{rendered}</s>;
      else if (mark.type === "link") {
        const href = mark.attrs?.href;
        if (typeof href === "string" && /^https?:\/\//i.test(href)) {
          rendered = <a key={key} href={href} target="_blank" rel="noreferrer" className="text-blue-700 underline">{rendered}</a>;
        }
      } else if (mark.type === "textStyle") {
        const fontSize = mark.attrs?.fontSize;
        if (typeof fontSize === "string" && /^(12|14|16|18|20|24)px$/.test(fontSize)) {
          rendered = <span key={key} style={{ fontSize }}>{rendered}</span>;
        }
      }
    }
    return rendered;
  }

  const children = (node.content ?? []).map((child, index) =>
    renderDocumentNode(child, `${key}-${index}`)
  );
  switch (node.type) {
    case "doc": return <>{children}</>;
    case "paragraph": return <p key={key} className="whitespace-pre-wrap">{children}</p>;
    case "heading": return <h4 key={key} className="font-bold">{children}</h4>;
    case "bulletList": return <ul key={key} className="list-disc pl-6">{children}</ul>;
    case "orderedList": return <ol key={key} className="list-decimal pl-6">{children}</ol>;
    case "listItem": return <li key={key}>{children}</li>;
    case "blockquote": return <blockquote key={key} className="border-l-2 border-[#c8b994] pl-3 italic">{children}</blockquote>;
    case "hardBreak": return <br key={key} />;
    default: return <>{children}</>;
  }
}

function hasDocumentText(document: JSONContent | null): boolean {
  if (!document) return false;
  if (typeof document.text === "string" && document.text.trim().length > 0) return true;
  return (document.content ?? []).some((node) => hasDocumentText(node));
}

function renderNotebookText(content: Record<string, unknown>): ReactNode {
  return isJsonContent(content.document)
    ? renderDocumentNode(content.document, "document")
    : renderFormattedText(contentText(content.text));
}

export function NotebookWorkspace({
  relationshipId,
  mode,
  studentName,
}: NotebookWorkspaceProps) {
  const { user } = useAuth();
  const [days, setDays] = useState<NotebookDay[]>([]);
  const [notes, setNotes] = useState<NotebookNote[]>([]);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingDocument, setEditingDocument] = useState<JSONContent | null>(null);
  const [newDocument, setNewDocument] = useState<JSONContent | null>(null);
  const [isCreatingText, setIsCreatingText] = useState(false);
  const [editingLink, setEditingLink] = useState<{ id: string | null; title: string; url: string } | null>(null);
  const [dateEntry, setDateEntry] = useState<{ entryId: string; date: string } | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const [noteText, setNoteText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(true);
  const [twoPages, setTwoPages] = useState(true);
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
      setShowAttachmentModal(false);
      await loadContent();
    } catch {
      setError("Não foi possível anexar o arquivo. Verifique o formato e tente novamente.");
    } finally {
      setIsUploadingAttachment(false);
    }
  }

  function startTextEdit(entry: NotebookDay["entries"][number]): void {
    setIsCreatingText(false);
    setNewDocument(null);
    setEditingEntryId(entry.id);
    setEditingDocument(notebookDocument(entry.content));
    setEditingLink(null);
  }

  function startLinkEdit(entry: NotebookDay["entries"][number]): void {
    setIsCreatingText(false);
    setNewDocument(null);
    setEditingLink({
      id: entry.id,
      title: contentText(entry.content.title),
      url: contentText(entry.content.url),
    });
    setEditingEntryId(null);
  }

  async function handleSaveText(entryId: string | null): Promise<void> {
    const document = entryId ? editingDocument : newDocument;
    if (!document) return;
    setIsSavingEdit(true);
    setError("");
    try {
      if (entryId) {
        await updateNotebookEntry(relationshipId, entryId, "TEXT", { document });
      } else {
        await createNotebookEntry(relationshipId, "TEXT", { document });
      }
      setEditingEntryId(null);
      setEditingDocument(null);
      setNewDocument(null);
      setIsCreatingText(false);
      await loadContent();
    } catch {
      setError("Não foi possível salvar o texto no caderno.");
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleSaveLink(): Promise<void> {
    if (!editingLink || !editingLink.title.trim() || !editingLink.url.trim()) return;
    setIsSavingEdit(true);
    setError("");
    try {
      const content = { title: editingLink.title.trim(), url: editingLink.url.trim() };
      if (editingLink.id) {
        await updateNotebookEntry(relationshipId, editingLink.id, "ACTIVITY_LINK", content);
      } else {
        await createNotebookEntry(relationshipId, "ACTIVITY_LINK", content);
      }
      setEditingLink(null);
      await loadContent();
    } catch {
      setError("Não foi possível salvar o link no caderno.");
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleSaveEntryDate(entry: NotebookDay["entries"][number]): Promise<void> {
    if (!dateEntry || dateEntry.entryId !== entry.id || !dateEntry.date) return;
    setIsSavingEdit(true);
    setError("");
    try {
      await updateNotebookEntry(relationshipId, entry.id, entry.kind, undefined, dateEntry.date);
      setDateEntry(null);
      setCurrentSpreadIndex(0);
      await loadContent();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "";
      setError(message || "Não foi possível alterar a data deste conteúdo. Verifique a data e tente novamente.");
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleDeleteEntry(entryId: string): Promise<void> {
    if (!window.confirm("Deseja remover este conteúdo do caderno?")) return;
    setIsSavingEdit(true);
    setError("");
    try {
      await deleteNotebookEntry(relationshipId, entryId);
      await loadContent();
    } catch {
      setError("Não foi possível remover este conteúdo.");
    } finally {
      setIsSavingEdit(false);
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
  const entriesPerPage = 3;
  const allPageItems = orderedDays.flatMap((day) => {
    if (day.entries.length === 0) {
      return [{ day, entries: [], entryOffset: 0 }];
    }

    return Array.from(
      { length: Math.ceil(day.entries.length / entriesPerPage) },
      (_, pageIndex) => {
        const entryOffset = pageIndex * entriesPerPage;
        return {
          day,
          entries: day.entries.slice(entryOffset, entryOffset + entriesPerPage),
          entryOffset,
        };
      },
    );
  });
  const pagesPerSpread = twoPages ? 2 : 1;
  const totalSpreads = Math.max(1, Math.ceil(allPageItems.length / pagesPerSpread));
  const safeSpreadIndex = Math.min(currentSpreadIndex, totalSpreads - 1);
  const pageItems = allPageItems.slice(
    safeSpreadIndex * pagesPerSpread,
    safeSpreadIndex * pagesPerSpread + pagesPerSpread,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="ml-auto flex flex-wrap justify-end gap-2">
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
            onClick={() => { setCurrentSpreadIndex(0); setTwoPages((value) => !value); }}
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
          <div className="flex items-start gap-3"><div className="relative min-w-0 flex-1 rounded-2xl border border-[#d5c7a8] bg-[#e8dfcb] p-3 shadow-inner sm:p-5">
            <div className={twoPages ? "grid grid-cols-1 items-stretch gap-3 md:grid-cols-[minmax(0,1fr)_22px_minmax(0,1fr)]" : "mx-auto grid max-w-3xl"}>
              {pageItems.length === 0 ? (
                <article className="h-170 min-h-120 max-h-[75vh] overflow-y-auto rounded-lg border border-[#d8c9a9] bg-[repeating-linear-gradient(to_bottom,#fffdf5_0px,#fffdf5_27px,#dce5ef_28px)] p-5 shadow-sm sm:p-7 md:col-start-1 md:row-start-1">
                  <div className="mb-5 flex items-center justify-between border-b border-[#d8c9a9] pb-2">
                    <h3 className="text-sm font-bold text-[#66583e]">Nova página</h3>
                    <span className="text-xs text-[#998b70]">TimeToLearn</span>
                  </div>
                  {mode === "teacher" && isCreatingText ? (
                    <div className="space-y-3">
                      <NotebookRichTextEditor initialContent={newDocument ?? undefined} onChange={setNewDocument} />
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => void handleSaveText(null)} disabled={isSavingEdit || !hasDocumentText(newDocument)} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-white disabled:opacity-50"><Save size={14} aria-hidden="true" /> Salvar na folha</button>
                        <button type="button" onClick={() => { setIsCreatingText(false); setNewDocument(null); }} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#c8b994] bg-white px-3 text-xs font-semibold text-[#51452f]"><X size={14} aria-hidden="true" /> Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-48 items-center justify-center text-center text-sm text-[#76694f]">
                      {mode === "teacher" ? "Use o lápis ao lado do caderno para começar a escrever." : "Seu professor ainda não publicou conteúdo."}
                    </div>
                  )}
                </article>
              ) : (
                pageItems.map(({ day, entries, entryOffset }, index) => (
                  <article key={`${day.id}-${index}`} className={"h-170 min-h-120 max-h-[75vh] overflow-y-auto rounded-lg border border-[#d8c9a9] bg-[repeating-linear-gradient(to_bottom,#fffdf5_0px,#fffdf5_27px,#dce5ef_28px)] p-5 shadow-sm sm:p-7 md:row-start-1 " + (twoPages && pageItems.length > 1 ? (index === 0 ? "md:col-start-1" : "md:col-start-3") : "md:col-start-1")}>
                    <div className="mb-5 flex items-center justify-between border-b border-[#d8c9a9] pb-2">
                      <h3 className="text-sm font-bold capitalize text-[#66583e]">{formatDay(day.dayDate)}</h3>
                      <span className="text-xs text-[#998b70]">TimeToLearn</span>
                    </div>
                    <div className="space-y-4">
                      {entries.map((entry, entryIndex) => {
                        const absoluteIndex = entryIndex + entryOffset;
                        const isEditingText = editingEntryId === entry.id && entry.kind === "TEXT";
                        return (
                          <div key={entry.id} className="rounded-lg border border-[#d8c9a9]/80 bg-white/35 p-2">
                            {isReordering && renderOrderControls(day, absoluteIndex)}
                            {mode === "teacher" && (
                              <div className="mb-2 flex flex-wrap items-center justify-end gap-1">
                                {entry.kind === "TEXT" && (
                                  <button type="button" onClick={() => startTextEdit(entry)} aria-label="Editar texto" title="Editar texto" className="inline-flex size-8 items-center justify-center rounded-lg border border-[#c8b994] bg-white text-[#51452f] hover:bg-[#f5efdf]">
                                    <Pencil size={15} aria-hidden="true" />
                                  </button>
                                )}
                                {entry.kind === "ACTIVITY_LINK" && (
                                  <button type="button" onClick={() => startLinkEdit(entry)} aria-label="Editar link" title="Editar link" className="inline-flex size-8 items-center justify-center rounded-lg border border-[#c8b994] bg-white text-[#51452f] hover:bg-[#f5efdf]">
                                    <Pencil size={15} aria-hidden="true" />
                                  </button>
                                )}
                                <button type="button" onClick={() => setDateEntry({ entryId: entry.id, date: day.dayDate.slice(0, 10) })} aria-label="Alterar data" title="Alterar data" className="inline-flex size-8 items-center justify-center rounded-lg border border-[#c8b994] bg-white text-[#51452f] hover:bg-[#f5efdf]">
                                  <CalendarDays size={15} aria-hidden="true" />
                                </button>
                                <button type="button" onClick={() => void handleDeleteEntry(entry.id)} disabled={isSavingEdit} aria-label="Remover conteúdo" title="Remover conteúdo" className="inline-flex size-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-700 hover:bg-red-50 disabled:opacity-40">
                                  <Trash2 size={15} aria-hidden="true" />
                                </button>
                              </div>
                            )}
                            {entry.kind === "IMAGE" ? (
                              <div className="p-2">
                                <NotebookAttachmentImage
                                  relationshipId={relationshipId}
                                  entryId={entry.id}
                                  fileName={contentText(entry.content.fileName) || "Imagem do caderno"}
                                />
                                <p className="mt-2 text-center text-xs text-[#76694f]">{contentText(entry.content.fileName) || "Imagem anexada"}</p>
                              </div>
                            ) : entry.kind === "FILE" ? (
                              <div className="flex items-center gap-3 p-2">
                                <FileText size={22} className="shrink-0 text-[#8b7b60]" aria-hidden="true" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-[#51452f]">{contentText(entry.content.fileName) || "Anexo"}</p>
                                  <p className="text-xs text-[#76694f]">Arquivo anexado</p>
                                </div>
                                <button type="button" onClick={() => void handleAttachmentDownload(entry.id, contentText(entry.content.fileName) || "anexo")} aria-label={`Baixar ${contentText(entry.content.fileName) || "anexo"}`} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#c8b994] bg-white px-3 text-xs font-semibold text-[#51452f] hover:bg-[#f5efdf]">
                                  <Download size={15} aria-hidden="true" /> Baixar
                                </button>
                              </div>
                            ) : entry.kind === "ACTIVITY_LINK" ? (
                              <div className="p-2">
                                  <p className="font-semibold text-[#51452f]">{contentText(entry.content.title) || "Atividade"}</p>
                                  <a href={contentText(entry.content.url)} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 underline">
                                    Abrir atividade <ExternalLink size={14} aria-hidden="true" />
                                  </a>
                                </div>
                            ) : isEditingText ? (
                              <div className="space-y-2 p-2">
                                <NotebookRichTextEditor initialContent={editingDocument ?? undefined} onChange={setEditingDocument} />
                                <div className="flex flex-wrap gap-2">
                                  <button type="button" onClick={() => void handleSaveText(entry.id)} disabled={isSavingEdit || !hasDocumentText(editingDocument)} className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-white disabled:opacity-50"><Save size={14} aria-hidden="true" /> Salvar alterações</button>
                                  <button type="button" onClick={() => { setEditingEntryId(null); setEditingDocument(null); }} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-[#c8b994] px-3 text-xs font-semibold text-[#51452f]"><X size={14} aria-hidden="true" /> Cancelar</button>
                                </div>
                              </div>
                            ) : (
                              <div className="p-2 text-sm leading-7 text-[#51452f]">
                                {renderNotebookText(entry.content)}
                              </div>
                            )}

                          </div>
                        );
                      })}
                      {mode === "teacher" && isCreatingText && index === pageItems.length - 1 && (
                        <div className="mt-4 space-y-3 border-t border-[#d8c9a9] pt-4">
                          <NotebookRichTextEditor initialContent={newDocument ?? undefined} onChange={setNewDocument} />
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => void handleSaveText(null)} disabled={isSavingEdit || !hasDocumentText(newDocument)} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-white disabled:opacity-50"><Save size={14} aria-hidden="true" /> Salvar na folha</button>
                            <button type="button" onClick={() => { setIsCreatingText(false); setNewDocument(null); }} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#c8b994] bg-white px-3 text-xs font-semibold text-[#51452f]"><X size={14} aria-hidden="true" /> Cancelar</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                ))
              )}
              {twoPages && pageItems.length < 2 && (
                <article
                  aria-hidden="true"
                  className="hidden h-170 min-h-120 max-h-[75vh] rounded-lg border border-[#d8c9a9] bg-[repeating-linear-gradient(to_bottom,#fffdf5_0px,#fffdf5_27px,#dce5ef_28px)] shadow-sm md:col-start-3 md:row-start-1 md:block"
                />
              )}
              {twoPages && (
                <div className="hidden items-center justify-center md:col-start-2 md:row-start-1 md:flex" aria-hidden="true">
                  <div className="flex h-170 min-h-120 flex-col justify-around border-x-2 border-[#9b8b6d] px-1">
                    {Array.from({ length: 13 }, (_, index) => (
                      <span key={index} className="size-3 rounded-full border-2 border-[#8b7b60] bg-[#d5c7a8] shadow-sm" />
                    ))}
                  </div>
                </div>
              )}
            </div>
            {twoPages && <div className="mt-3 text-center text-xs text-[#76694f] md:hidden">A visualização em duas páginas fica disponível em telas maiores.</div>}
          </div>
          <div className="sticky top-4 flex shrink-0 flex-col gap-2 pt-2" aria-label="Ferramentas do caderno">
            {mode === "teacher" && (
              <>
                <button type="button" onClick={() => { setEditingEntryId(null); setEditingDocument(null); setEditingLink(null); setIsCreatingText(true); setNewDocument({ type: "doc", content: [{ type: "paragraph" }] }); }} aria-label="Escrever na folha" title="Escrever na folha" className="inline-flex size-10 items-center justify-center rounded-xl border border-[#c8b994] bg-[#fffdf5] text-[#51452f] shadow-sm hover:bg-[#f5efdf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8b6b2e]">
                  <Pencil size={18} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => setShowAttachmentModal(true)} aria-label="Anexar material" title="Anexar material" className="inline-flex size-10 items-center justify-center rounded-xl border border-[#c8b994] bg-[#fffdf5] text-[#51452f] shadow-sm hover:bg-[#f5efdf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8b6b2e]">
                  <Paperclip size={18} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => setEditingLink({ id: null, title: "", url: "" })} aria-label="Adicionar link" title="Adicionar link" className="inline-flex size-10 items-center justify-center rounded-xl border border-[#c8b994] bg-[#fffdf5] text-[#51452f] shadow-sm hover:bg-[#f5efdf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8b6b2e]">
                  <Link2 size={18} aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </div>

          {allPageItems.length > 0 && (
            <nav aria-label="Paginação do caderno" className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentSpreadIndex((value) => Math.max(0, value - 1))}
                disabled={safeSpreadIndex === 0}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#c8b994] bg-[#fffdf5] px-3 text-sm font-semibold text-[#51452f] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowUp size={15} aria-hidden="true" /> Anterior
              </button>
              <span className="min-w-28 text-center text-sm font-semibold text-[#66583e]" aria-live="polite">
                {twoPages
                  ? `Páginas ${safeSpreadIndex * 2 + 1}–${Math.min(safeSpreadIndex * 2 + 2, allPageItems.length)} de ${allPageItems.length}`
                  : `Página ${safeSpreadIndex + 1} de ${allPageItems.length}`}
              </span>
              <button
                type="button"
                onClick={() => setCurrentSpreadIndex((value) => Math.min(totalSpreads - 1, value + 1))}
                disabled={safeSpreadIndex >= totalSpreads - 1}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#c8b994] bg-[#fffdf5] px-3 text-sm font-semibold text-[#51452f] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Próxima <ArrowDown size={15} aria-hidden="true" />
              </button>
            </nav>
          )}

          {isLoading && <p className="mt-3 text-sm text-muted">Carregando caderno...</p>}

        </section>

        {showNotes && (
          <aside className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <MessageCircle size={19} className="text-primary" aria-hidden="true" />
              <h3 className="font-semibold text-dark">Bloco de notas compartilhado</h3>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted">Anotações e dúvidas ficam visíveis para o aluno e o professor.</p>
            <div className="mt-4 max-h-112 space-y-3 overflow-y-auto">
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
      {mode === "teacher" && dateEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="notebook-date-title"
            onSubmit={(event) => {
              event.preventDefault();
              const entry = days.flatMap((day) => day.entries).find((item) => item.id === dateEntry.entryId);
              if (entry) void handleSaveEntryDate(entry);
            }}
            className="w-full max-w-sm rounded-2xl border border-[#d8c9a9] bg-[#fffdf5] p-5 shadow-xl"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 id="notebook-date-title" className="text-lg font-semibold text-[#51452f]">Alterar data do conteúdo</h3>
              <button type="button" onClick={() => setDateEntry(null)} disabled={isSavingEdit} aria-label="Fechar janela" className="inline-flex size-9 items-center justify-center rounded-lg border border-[#c8b994] text-[#51452f] disabled:opacity-40">
                <X size={17} aria-hidden="true" />
              </button>
            </div>
            <label className="mt-4 block text-sm font-medium text-[#51452f]">
              Nova data
              <input
                type="date"
                required
                autoFocus
                value={dateEntry.date}
                onChange={(event) => setDateEntry((current) => current ? { ...current, date: event.target.value } : current)}
                className="mt-2 min-h-11 w-full rounded-xl border border-[#c8b994] bg-white px-3 text-sm"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setDateEntry(null)} disabled={isSavingEdit} className="inline-flex min-h-10 items-center rounded-lg border border-[#c8b994] px-4 text-sm font-semibold text-[#51452f] disabled:opacity-40">Cancelar</button>
              <button type="submit" disabled={isSavingEdit || !dateEntry.date} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                <Save size={15} aria-hidden="true" /> {isSavingEdit ? "Salvando..." : "Salvar data"}
              </button>
            </div>
          </form>
        </div>
      )}

      {mode === "teacher" && editingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="notebook-link-title"
            onSubmit={(event) => { event.preventDefault(); void handleSaveLink(); }}
            className="w-full max-w-md rounded-2xl border border-[#d8c9a9] bg-[#fffdf5] p-5 shadow-xl"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 id="notebook-link-title" className="text-lg font-semibold text-[#51452f]">
                {editingLink.id ? "Editar link" : "Novo link de atividade"}
              </h3>
              <button type="button" onClick={() => setEditingLink(null)} disabled={isSavingEdit} aria-label="Fechar janela" className="inline-flex size-9 items-center justify-center rounded-lg border border-[#c8b994] text-[#51452f] disabled:opacity-40">
                <X size={17} aria-hidden="true" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-[#51452f]">
                Nome da atividade
                <input
                  autoFocus
                  required
                  maxLength={160}
                  value={editingLink.title}
                  onChange={(event) => setEditingLink((current) => current ? { ...current, title: event.target.value } : current)}
                  className="mt-2 min-h-11 w-full rounded-xl border border-[#c8b994] bg-white px-3 text-sm"
                />
              </label>
              <label className="block text-sm font-medium text-[#51452f]">
                Endereço do link
                <input
                  type="url"
                  required
                  value={editingLink.url}
                  onChange={(event) => setEditingLink((current) => current ? { ...current, url: event.target.value } : current)}
                  placeholder="https://..."
                  className="mt-2 min-h-11 w-full rounded-xl border border-[#c8b994] bg-white px-3 text-sm"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEditingLink(null)} disabled={isSavingEdit} className="inline-flex min-h-10 items-center rounded-lg border border-[#c8b994] px-4 text-sm font-semibold text-[#51452f] disabled:opacity-40">Cancelar</button>
              <button type="submit" disabled={isSavingEdit || !editingLink.title.trim() || !editingLink.url.trim()} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                <Save size={15} aria-hidden="true" /> {isSavingEdit ? "Salvando..." : editingLink.id ? "Salvar alterações" : "Publicar link"}
              </button>
            </div>
          </form>
        </div>
      )}

      {mode === "teacher" && showAttachmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="notebook-attachment-title"
            onSubmit={(event) => void handleAddAttachment(event)}
            className="w-full max-w-md rounded-2xl border border-[#d8c9a9] bg-[#fffdf5] p-5 shadow-xl"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 id="notebook-attachment-title" className="text-lg font-semibold text-[#51452f]">Anexar material</h3>
              <button type="button" onClick={() => { setShowAttachmentModal(false); setSelectedFile(null); }} disabled={isUploadingAttachment} aria-label="Fechar janela" className="inline-flex size-9 items-center justify-center rounded-lg border border-[#c8b994] text-[#51452f] disabled:opacity-40">
                <X size={17} aria-hidden="true" />
              </button>
            </div>
            <p className="mt-2 text-sm text-[#76694f]">Imagens até 5 MB, documentos até 20 MB e vídeos até 50 MB.</p>
            <input
              ref={fileInputRef}
              id="notebook-attachment"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx,.csv,.mp4,.webm,.mov"
              onChange={(event) => setSelectedFile(event.currentTarget.files?.[0] ?? null)}
              className="sr-only"
            />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#b9a77f] bg-white px-3 text-sm font-semibold text-[#51452f] hover:bg-[#f5efdf]">
              <Paperclip size={17} aria-hidden="true" /> {selectedFile ? "Escolher outro arquivo" : "Selecionar arquivo"}
            </button>
            {selectedFile && <p className="mt-3 break-all text-sm text-[#66583e]">Selecionado: {selectedFile.name}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => { setShowAttachmentModal(false); setSelectedFile(null); }} disabled={isUploadingAttachment} className="inline-flex min-h-10 items-center rounded-lg border border-[#c8b994] px-4 text-sm font-semibold text-[#51452f] disabled:opacity-40">Cancelar</button>
              <button type="submit" disabled={!selectedFile || isUploadingAttachment} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                <Paperclip size={15} aria-hidden="true" /> {isUploadingAttachment ? "Enviando..." : "Anexar"}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
