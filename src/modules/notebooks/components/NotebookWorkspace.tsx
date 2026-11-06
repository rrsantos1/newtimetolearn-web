import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { JSONContent } from "@tiptap/core";
import { NotebookRichTextEditor } from "./NotebookRichTextEditor";
import { ArrowDown, ArrowUp, BookOpen, CalendarDays, ChevronLeft, ChevronRight, ChevronsRight, Download, ExternalLink, Eye, FileText, Link2, ListOrdered, LoaderCircle, MessageCircle, Paperclip, Pencil, Save, Search, Send, SlidersHorizontal, Trash2, X } from "lucide-react";
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
import { NotebookAttachmentVideo } from "./NotebookAttachmentVideo";

interface NotebookWorkspaceProps {
  relationshipId: string;
  mode: "teacher" | "student";
}

function getLocalDateValue(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
}: NotebookWorkspaceProps) {
  const { user } = useAuth();
  const [days, setDays] = useState<NotebookDay[]>([]);
  const [notes, setNotes] = useState<NotebookNote[]>([]);
  const [currentNotesPage, setCurrentNotesPage] = useState(0);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingDocument, setEditingDocument] = useState<JSONContent | null>(null);
  const [newDocument, setNewDocument] = useState<JSONContent | null>(null);
  const [isCreatingText, setIsCreatingText] = useState(false);
  const [isCreatingNewDay, setIsCreatingNewDay] = useState(false);
  const [creatingTextPageIndex, setCreatingTextPageIndex] = useState<number | null>(null);
  const [editingLink, setEditingLink] = useState<{ id: string | null; title: string; url: string } | null>(null);
  const [dateEntry, setDateEntry] = useState<{ entryId: string; date: string } | null>(null);
  const [resizingImageEntryId, setResizingImageEntryId] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const [noteText, setNoteText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(true);
  const [twoPages, setTwoPages] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(true);
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
  const [dateLookup, setDateLookup] = useState("");
  const [pageLookup, setPageLookup] = useState("1");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [focusedEntryId, setFocusedEntryId] = useState<string | null>(null);
  const [activeAttachmentAction, setActiveAttachmentAction] = useState<{ entryId: string; action: "download" | "open" } | null>(null);
  const [error, setError] = useState("");

  const entriesPerPage = 4;

  const loadContent = useCallback(async (): Promise<NotebookDay[]> => {
    setError("");
    try {
      const [notebookDays, notebookNotes] = await Promise.all([
        getNotebook(relationshipId),
        listNotebookNotes(relationshipId),
      ]);
      setDays(notebookDays);
      setNotes(notebookNotes);
      return notebookDays;
    } catch {
      setError("Não foi possível carregar o caderno. Atualize a página para tentar novamente.");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [relationshipId]);

  useEffect(() => {
    if (!focusedEntryId) return;
    const entryElement = document.getElementById(`notebook-entry-${focusedEntryId}`);
    if (!entryElement) return;
    entryElement.scrollIntoView({ behavior: "smooth", block: "center" });
    const timeoutId = window.setTimeout(() => setFocusedEntryId(null), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [focusedEntryId, currentSpreadIndex, days]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateScreenMode = (event: MediaQueryList | MediaQueryListEvent) => {
      const isSmall = event.matches;
      setIsSmallScreen(isSmall);
      setTwoPages(!isSmall);
      setCurrentSpreadIndex(0);
    };

    updateScreenMode(mediaQuery);
    mediaQuery.addEventListener("change", updateScreenMode);
    return () => mediaQuery.removeEventListener("change", updateScreenMode);
  }, []);

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

  async function handleAttachmentDownload(
    entryId: string,
    fileName: string,
    timeoutMs = 60_000,
  ): Promise<void> {
    if (activeAttachmentAction) return;
    setError("");
    setActiveAttachmentAction({ entryId, action: "download" });
    try {
      const blob = await downloadNotebookAttachment(relationshipId, entryId, timeoutMs);
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch {
      setError("Não foi possível baixar este anexo. Tente novamente.");
    } finally {
      setActiveAttachmentAction(null);
    }
  }

  async function handleOpenAttachment(entryId: string, timeoutMs = 60_000): Promise<void> {
    if (activeAttachmentAction) return;
    const previewWindow = window.open("about:blank", "_blank");
    if (!previewWindow) {
      setError("Permita a abertura de novas janelas para visualizar o documento.");
      return;
    }
    setError("");
    setActiveAttachmentAction({ entryId, action: "open" });
    try {
      previewWindow.document.title = "Carregando documento...";
      const blob = await downloadNotebookAttachment(relationshipId, entryId, timeoutMs);
      const objectUrl = URL.createObjectURL(blob);
      previewWindow.location.href = objectUrl;
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch {
      previewWindow.close();
      setError("Não foi possível abrir este documento no navegador. Tente baixá-lo.");
    } finally {
      setActiveAttachmentAction(null);
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
      const created = await createNotebookAttachment(relationshipId, selectedFile);
      setSelectedFile(null);
      form.reset();
      setShowAttachmentModal(false);
      const updatedDays = await loadContent();
      const orderedUpdatedDays = [...updatedDays].reverse();
      let targetPageIndex = -1;
      let pageOffset = 0;
      for (const day of orderedUpdatedDays) {
        const entryIndex = day.entries.findIndex((entry) => entry.id === created.entry.id);
        if (entryIndex >= 0) {
          targetPageIndex = pageOffset + Math.floor(entryIndex / entriesPerPage);
          break;
        }
        pageOffset += Math.max(1, Math.ceil(day.entries.length / entriesPerPage));
      }
      if (targetPageIndex >= 0) {
        setCurrentSpreadIndex(Math.floor(targetPageIndex / (twoPages && !isSmallScreen ? 2 : 1)));
        setFocusedEntryId(created.entry.id);
      }
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
      setIsCreatingNewDay(false);
      setCreatingTextPageIndex(null);
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
      setCurrentNotesPage(Math.max(0, Math.ceil(updatedNotes.length / notesPerPage) - 1));
    } catch {
      setError("Não foi possível enviar sua mensagem.");
    } finally {
      setIsSavingNote(false);
    }
  }

  const notesPerPage = 4;
  const totalNotesPages = Math.max(1, Math.ceil(notes.length / notesPerPage));
  const safeNotesPage = Math.min(currentNotesPage, totalNotesPages - 1);
  const visibleNotes = notes.slice(safeNotesPage * notesPerPage, (safeNotesPage + 1) * notesPerPage);

  const orderedDays = [...days].reverse();
  const today = getLocalDateValue();
  const hasTodayPage = orderedDays.some((day) => day.dayDate.slice(0, 10) === today);
  const draftDay: NotebookDay = {
    id: "__new-notebook-day__",
    relationshipId,
    dayDate: today,
    entries: [],
  };
  const allPageItems = [
    ...(isCreatingText && isCreatingNewDay && !hasTodayPage
      ? [{ day: draftDay, entries: [] as NotebookDay["entries"], entryOffset: 0 }]
      : []),
    ...orderedDays.flatMap((day) => {
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
    }),
  ];
  const pagesPerSpread = twoPages && !isSmallScreen ? 2 : 1;
  const totalSpreads = Math.max(1, Math.ceil(allPageItems.length / pagesPerSpread));
  const safeSpreadIndex = Math.min(currentSpreadIndex, totalSpreads - 1);
  const pageItems = allPageItems.slice(
    safeSpreadIndex * pagesPerSpread,
    safeSpreadIndex * pagesPerSpread + pagesPerSpread,
  );

  return (
    <div className="space-y-5">
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <div className={showNotes ? "grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]" : "grid"}>
        <section className="min-w-0">
          <div className="flex items-start gap-3"><div className="relative min-w-0 flex-1 rounded-2xl border border-[#d5c7a8] bg-[#e8dfcb] p-3 shadow-inner sm:p-5">
            <div className={pagesPerSpread === 2 ? "grid grid-cols-1 items-stretch gap-3 md:grid-cols-[minmax(0,1fr)_22px_minmax(0,1fr)]" : "mx-auto grid max-w-3xl"}>
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
                        <button type="button" onClick={() => { setIsCreatingText(false); setIsCreatingNewDay(false); setCreatingTextPageIndex(null); setNewDocument(null); }} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#c8b994] bg-white px-3 text-xs font-semibold text-[#51452f]"><X size={14} aria-hidden="true" /> Cancelar</button>
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
                  <article key={`${day.id}-${index}`} className={"h-170 min-h-120 max-h-[75vh] overflow-y-auto rounded-lg border border-[#d8c9a9] bg-[repeating-linear-gradient(to_bottom,#fffdf5_0px,#fffdf5_27px,#dce5ef_28px)] p-5 shadow-sm sm:p-7 md:row-start-1 " + (pagesPerSpread === 2 && pageItems.length > 1 ? (index === 0 ? "md:col-start-1" : "md:col-start-3") : "md:col-start-1")}>
                    <div className="mb-5 flex items-center justify-between border-b border-[#d8c9a9] pb-2">
                      <h3 className="text-sm font-bold capitalize text-[#66583e]">{formatDay(day.dayDate)}</h3>
                      <span className="text-xs text-[#998b70]">TimeToLearn</span>
                    </div>
                    <div className="space-y-4">
                      {entries.map((entry, entryIndex) => {
                        const absoluteIndex = entryIndex + entryOffset;
                        const isEditingText = editingEntryId === entry.id && entry.kind === "TEXT";
                        return (
                          <div id={`notebook-entry-${entry.id}`} key={entry.id} className={(mode === "teacher" ? "rounded-lg border border-[#d8c9a9]/80 bg-white/35 p-2" : "py-2") + (focusedEntryId === entry.id ? " rounded-xl ring-2 ring-[#d4a72c] ring-offset-2 transition-shadow" : "")}>
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
                                {entry.kind === "FILE" && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => void handleAttachmentDownload(entry.id, contentText(entry.content.fileName) || "anexo", contentText(entry.content.contentType).startsWith("video/") ? 360_000 : 60_000)}
                                      disabled={activeAttachmentAction !== null}
                                      aria-label={`Baixar ${contentText(entry.content.fileName) || "arquivo"}`}
                                      title={activeAttachmentAction?.entryId === entry.id && activeAttachmentAction.action === "download" ? "Baixando..." : "Baixar arquivo"}
                                      className="inline-flex size-8 items-center justify-center rounded-lg border border-[#c8b994] bg-white text-[#51452f] hover:bg-[#f5efdf] disabled:cursor-wait disabled:opacity-50"
                                    >
                                      {activeAttachmentAction?.entryId === entry.id && activeAttachmentAction.action === "download" ? <LoaderCircle size={15} className="animate-spin" aria-hidden="true" /> : <Download size={15} aria-hidden="true" />}
                                    </button>
                                    {!contentText(entry.content.contentType).startsWith("video/") && (
                                      <button
                                        type="button"
                                        onClick={() => void handleOpenAttachment(entry.id)}
                                        disabled={activeAttachmentAction !== null}
                                        aria-label={`Abrir ${contentText(entry.content.fileName) || "documento"} no navegador`}
                                        title={activeAttachmentAction?.entryId === entry.id && activeAttachmentAction.action === "open" ? "Abrindo..." : "Abrir no navegador"}
                                        className="inline-flex size-8 items-center justify-center rounded-lg border border-[#c8b994] bg-white text-[#51452f] hover:bg-[#f5efdf] disabled:cursor-wait disabled:opacity-50"
                                      >
                                        {activeAttachmentAction?.entryId === entry.id && activeAttachmentAction.action === "open" ? <LoaderCircle size={15} className="animate-spin" aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
                                      </button>
                                    )}
                                  </>
                                )}
                                {entry.kind === "IMAGE" && (
                                  <button
                                    type="button"
                                    onClick={() => setResizingImageEntryId((current) => current === entry.id ? null : entry.id)}
                                    aria-label={resizingImageEntryId === entry.id ? "Fechar redimensionamento" : "Redimensionar imagem"}
                                    aria-expanded={resizingImageEntryId === entry.id}
                                    title="Redimensionar imagem"
                                    className={resizingImageEntryId === entry.id ? "inline-flex size-8 items-center justify-center rounded-lg border border-[#8b6b2e] bg-[#f5efdf] text-[#51452f]" : "inline-flex size-8 items-center justify-center rounded-lg border border-[#c8b994] bg-white text-[#51452f] hover:bg-[#f5efdf]"}
                                  >
                                    <SlidersHorizontal size={15} aria-hidden="true" />
                                  </button>
                                )}
                                <button type="button" onClick={() => void handleDeleteEntry(entry.id)} disabled={isSavingEdit} aria-label="Remover conteúdo" title="Remover conteúdo" className="inline-flex size-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-700 hover:bg-red-50 disabled:opacity-40">
                                  <Trash2 size={15} aria-hidden="true" />
                                </button>
                              </div>
                            )}
                            {mode === "student" && entry.kind === "FILE" && (
                              <div className="mb-2 flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => void handleAttachmentDownload(entry.id, contentText(entry.content.fileName) || "anexo", contentText(entry.content.contentType).startsWith("video/") ? 360_000 : 60_000)}
                                  disabled={activeAttachmentAction !== null}
                                  aria-label={`Baixar ${contentText(entry.content.fileName) || "arquivo"}`}
                                  title={activeAttachmentAction?.entryId === entry.id && activeAttachmentAction.action === "download" ? "Baixando..." : "Baixar arquivo"}
                                  className="inline-flex size-8 items-center justify-center rounded-lg border border-[#c8b994] bg-white text-[#51452f] disabled:cursor-wait disabled:opacity-50"
                                >
                                  {activeAttachmentAction?.entryId === entry.id && activeAttachmentAction.action === "download" ? <LoaderCircle size={15} className="animate-spin" aria-hidden="true" /> : <Download size={15} aria-hidden="true" />}
                                </button>
                                {!contentText(entry.content.contentType).startsWith("video/") && (
                                  <button
                                    type="button"
                                    onClick={() => void handleOpenAttachment(entry.id)}
                                    disabled={activeAttachmentAction !== null}
                                    aria-label={`Abrir ${contentText(entry.content.fileName) || "documento"} no navegador`}
                                    title={activeAttachmentAction?.entryId === entry.id && activeAttachmentAction.action === "open" ? "Abrindo..." : "Abrir no navegador"}
                                    className="inline-flex size-8 items-center justify-center rounded-lg border border-[#c8b994] bg-white text-[#51452f] disabled:cursor-wait disabled:opacity-50"
                                  >
                                    {activeAttachmentAction?.entryId === entry.id && activeAttachmentAction.action === "open" ? <LoaderCircle size={15} className="animate-spin" aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
                                  </button>
                                )}
                              </div>
                            )}
                            {entry.kind === "IMAGE" ? (
                              <div className="p-2">
                                <NotebookAttachmentImage
                                  key={entry.id}
                                  relationshipId={relationshipId}
                                  entryId={entry.id}
                                  fileName={contentText(entry.content.fileName) || "Imagem do caderno"}
                                  initialWidth={typeof entry.content.displayWidth === "number" ? entry.content.displayWidth : 100}
                                  canResize={mode === "teacher"}
                                  resizeOpen={resizingImageEntryId === entry.id}
                                  onCancelResize={() => setResizingImageEntryId(null)}
                                  onSaveWidth={async (width) => {
                                    await updateNotebookEntry(relationshipId, entry.id, "IMAGE", { displayWidth: width });
                                    setResizingImageEntryId(null);
                                    await loadContent();
                                  }}
                                />
                                <p className="mt-2 text-center text-xs text-[#76694f]">{contentText(entry.content.fileName) || "Imagem anexada"}</p>
                              </div>
                            ) : entry.kind === "FILE" && contentText(entry.content.contentType).startsWith("video/") ? (
                              <div className="space-y-2 p-2">
                                <NotebookAttachmentVideo
                                  relationshipId={relationshipId}
                                  entryId={entry.id}
                                  fileName={contentText(entry.content.fileName) || "Vídeo do caderno"}
                                />
                                <p className="break-all text-center text-xs text-[#76694f]">{contentText(entry.content.fileName) || "Vídeo anexado"}</p>
                              </div>
                            ) : entry.kind === "FILE" ? (
                              <div className="flex items-center gap-3 p-2">
                                <FileText size={22} className="shrink-0 text-[#8b7b60]" aria-hidden="true" />
                                <div className="min-w-0 flex-1">
                                  <p className="break-all text-sm font-semibold text-[#51452f]">{contentText(entry.content.fileName) || "Anexo"}</p>
                                  <p className="text-xs text-[#76694f]">Arquivo anexado</p>
                                </div>
                                {activeAttachmentAction?.entryId === entry.id && (
                                  <span className="inline-flex items-center gap-1 text-xs text-[#76694f]" role="status" aria-live="polite">
                                    <LoaderCircle size={13} className="animate-spin" aria-hidden="true" />
                                    {activeAttachmentAction.action === "download" ? "Baixando..." : "Abrindo..."}
                                  </span>
                                )}
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
                      {mode === "teacher" && isCreatingText && safeSpreadIndex * pagesPerSpread + index === creatingTextPageIndex && (
                        <div className="mt-4 space-y-3 border-t border-[#d8c9a9] pt-4">
                          <NotebookRichTextEditor initialContent={newDocument ?? undefined} onChange={setNewDocument} />
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => void handleSaveText(null)} disabled={isSavingEdit || !hasDocumentText(newDocument)} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-white disabled:opacity-50"><Save size={14} aria-hidden="true" /> Salvar na folha</button>
                            <button type="button" onClick={() => { setIsCreatingText(false); setIsCreatingNewDay(false); setCreatingTextPageIndex(null); setNewDocument(null); }} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#c8b994] bg-white px-3 text-xs font-semibold text-[#51452f]"><X size={14} aria-hidden="true" /> Cancelar</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                ))
              )}
              {pagesPerSpread === 2 && pageItems.length < 2 && (
                <article
                  aria-hidden="true"
                  className="hidden h-170 min-h-120 max-h-[75vh] rounded-lg border border-[#d8c9a9] bg-[repeating-linear-gradient(to_bottom,#fffdf5_0px,#fffdf5_27px,#dce5ef_28px)] shadow-sm md:col-start-3 md:row-start-1 md:block"
                />
              )}
              {pagesPerSpread === 2 && (
                <div className="hidden items-center justify-center md:col-start-2 md:row-start-1 md:flex" aria-hidden="true">
                  <div className="flex h-170 min-h-120 flex-col justify-around border-x-2 border-[#9b8b6d] px-1">
                    {Array.from({ length: 13 }, (_, index) => (
                      <span key={index} className="size-3 rounded-full border-2 border-[#8b7b60] bg-[#d5c7a8] shadow-sm" />
                    ))}
                  </div>
                </div>
              )}
            </div>
            
          </div>
          <div className="sticky top-4 flex shrink-0 flex-col gap-2 pt-2" aria-label="Ferramentas do caderno">
            {mode === "teacher" && (
              <>
                <button type="button" onClick={() => {
                  const todayDate = getLocalDateValue();
                  const todayPageIndexes = allPageItems
                    .map((item, index) => item.day.dayDate.slice(0, 10) === todayDate ? index : -1)
                    .filter((index) => index >= 0);
                  const targetPageIndex = todayPageIndexes.length > 0 ? todayPageIndexes[todayPageIndexes.length - 1] : 0;
                  setIsCreatingNewDay(todayPageIndexes.length === 0);
                  setCreatingTextPageIndex(targetPageIndex);
                  setCurrentSpreadIndex(Math.floor(targetPageIndex / pagesPerSpread));
                  setPageLookup(String(targetPageIndex + 1));
                  setEditingEntryId(null);
                  setEditingDocument(null);
                  setEditingLink(null);
                  setIsCreatingText(true);
                  setNewDocument({ type: "doc", content: [{ type: "paragraph" }] });
                }} aria-label="Escrever na folha" title="Escrever na folha" className="inline-flex size-10 items-center justify-center rounded-xl border border-[#c8b994] bg-[#fffdf5] text-[#51452f] shadow-sm hover:bg-[#f5efdf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8b6b2e]">
                  <Pencil size={18} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => setShowAttachmentModal(true)} aria-label="Anexar material" title="Anexar material" className="inline-flex size-10 items-center justify-center rounded-xl border border-[#c8b994] bg-[#fffdf5] text-[#51452f] shadow-sm hover:bg-[#f5efdf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8b6b2e]">
                  <Paperclip size={18} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => setEditingLink({ id: null, title: "", url: "" })} aria-label="Adicionar link" title="Adicionar link" className="inline-flex size-10 items-center justify-center rounded-xl border border-[#c8b994] bg-[#fffdf5] text-[#51452f] shadow-sm hover:bg-[#f5efdf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8b6b2e]">
                  <Link2 size={18} aria-hidden="true" />
                </button>
                <span className="my-1 h-px w-8 bg-[#c8b994]" aria-hidden="true" />
              </>
            )}
            {mode === "teacher" && (
              <button
                type="button"
                onClick={() => setIsReordering((value) => !value)}
                aria-pressed={isReordering}
                aria-label={isReordering ? "Concluir organização" : "Organizar itens"}
                title={isReordering ? "Concluir organização" : "Organizar itens"}
                className={isReordering ? "inline-flex size-10 items-center justify-center rounded-xl border border-[#8b6b2e] bg-[#8b6b2e] text-white shadow-sm" : "inline-flex size-10 items-center justify-center rounded-xl border border-[#c8b994] bg-[#fffdf5] text-[#51452f] shadow-sm hover:bg-[#f5efdf]"}
              >
                <ListOrdered size={18} aria-hidden="true" />
              </button>
            )}
{!isSmallScreen && (
            <button
              type="button"
              onClick={() => { setCurrentSpreadIndex(0); setTwoPages((value) => !value); setPageLookup("1"); }}
              aria-pressed={twoPages}
              aria-label={twoPages ? "Mudar para uma página" : "Mudar para duas páginas"}
              title={twoPages ? "Mudar para uma página" : "Mudar para duas páginas"}
              className="inline-flex size-10 items-center justify-center rounded-xl border border-[#c8b994] bg-[#fffdf5] text-[#51452f] shadow-sm hover:bg-[#f5efdf]"
            >
              <BookOpen size={18} aria-hidden="true" />
            </button>
            )}
            <button
              type="button"
              onClick={() => setShowNotes((value) => !value)}
              aria-expanded={showNotes}
              aria-label={showNotes ? "Ocultar bloco de notas" : "Exibir bloco de notas"}
              title={showNotes ? "Ocultar bloco de notas" : "Exibir bloco de notas"}
              className={showNotes ? "inline-flex size-10 items-center justify-center rounded-xl border border-[#8b6b2e] bg-[#f5efdf] text-[#51452f] shadow-sm" : "inline-flex size-10 items-center justify-center rounded-xl border border-[#c8b994] bg-[#fffdf5] text-[#51452f] shadow-sm hover:bg-[#f5efdf]"}
            >
              <MessageCircle size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

          {allPageItems.length > 0 && (
            <nav
              aria-label="Paginação do caderno"
              className="mt-4 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-[#e2d6bf] bg-[#faf7ef] p-2"
            >
              <button
                type="button"
                onClick={() => {
                  const nextIndex = Math.max(0, safeSpreadIndex - 1);
                  setCurrentSpreadIndex(nextIndex);
                  setPageLookup(String(nextIndex * pagesPerSpread + 1));
                }}
                disabled={safeSpreadIndex === 0}
                aria-label="Página anterior"
                title="Página anterior"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#c8b994] bg-[#fffdf5] text-[#51452f] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={18} aria-hidden="true" />
              </button>

              <form
                className="flex min-w-0 items-center gap-1"
                onSubmit={(event) => {
                  event.preventDefault();
                  const pageIndex = allPageItems.findIndex((item) => item.day.dayDate.slice(0, 10) === dateLookup);
                  if (pageIndex < 0) {
                    setError("Não há conteúdo cadastrado para essa data.");
                    return;
                  }
                  setError("");
                  setCurrentSpreadIndex(Math.floor(pageIndex / pagesPerSpread));
                  setPageLookup(String(pageIndex + 1));
                }}
              >
                <label className="sr-only" htmlFor="notebook-date-lookup">Localizar data no caderno</label>
                <input
                  id="notebook-date-lookup"
                  type="date"
                  required
                  value={dateLookup}
                  onChange={(event) => setDateLookup(event.target.value)}
                  className="h-10 min-w-0 w-36 rounded-lg border border-[#c8b994] bg-[#fffdf5] px-2 text-sm text-[#51452f] sm:w-40"
                />
                <button
                  type="submit"
                  className="inline-flex h-10 shrink-0 items-center gap-1 rounded-lg border border-[#c8b994] bg-[#fffdf5] px-2.5 text-sm font-semibold text-[#51452f] hover:bg-[#f5efdf]"
                >
                  <CalendarDays size={15} aria-hidden="true" />
                  <span className="hidden sm:inline">Buscar</span>
                </button>
              </form>

              <button
                type="button"
                onClick={() => {
                  const nextIndex = Math.min(totalSpreads - 1, safeSpreadIndex + 1);
                  setCurrentSpreadIndex(nextIndex);
                  setPageLookup(String(nextIndex * pagesPerSpread + 1));
                }}
                disabled={safeSpreadIndex >= totalSpreads - 1}
                aria-label="Próxima página"
                title="Próxima página"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#c8b994] bg-[#fffdf5] text-[#51452f] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={18} aria-hidden="true" />
              </button>

              <span className="min-w-24 text-center text-xs font-semibold text-[#66583e] sm:min-w-32 sm:text-sm" aria-live="polite">
                {pagesPerSpread === 2
                  ? `Páginas ${safeSpreadIndex * 2 + 1}–${Math.min(safeSpreadIndex * 2 + 2, allPageItems.length)} de ${allPageItems.length}`
                  : `Página ${safeSpreadIndex + 1} de ${allPageItems.length}`}
              </span>

              <button
                type="button"
                onClick={() => {
                  const lastIndex = totalSpreads - 1;
                  setCurrentSpreadIndex(lastIndex);
                  setPageLookup(String(lastIndex * pagesPerSpread + 1));
                }}
                disabled={safeSpreadIndex >= totalSpreads - 1}
                aria-label="Ir para a última página"
                title="Ir para a última página"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#c8b994] bg-[#fffdf5] text-[#51452f] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronsRight size={18} aria-hidden="true" />
              </button>

              <form
                className="flex items-center gap-1"
                onSubmit={(event) => {
                  event.preventDefault();
                  const requestedPage = Number(pageLookup);
                  if (!Number.isInteger(requestedPage) || requestedPage < 1 || requestedPage > allPageItems.length) {
                    setError(`Informe uma página entre 1 e ${allPageItems.length}.`);
                    return;
                  }
                  setError("");
                  setCurrentSpreadIndex(Math.floor((requestedPage - 1) / pagesPerSpread));
                }}
              >
                <label className="sr-only" htmlFor="notebook-page-lookup">Ir para página</label>
                <input
                  id="notebook-page-lookup"
                  type="number"
                  min={1}
                  max={allPageItems.length}
                  required
                  value={pageLookup}
                  onChange={(event) => setPageLookup(event.target.value)}
                  className="h-10 w-14 rounded-lg border border-[#c8b994] bg-[#fffdf5] px-2 text-center text-sm text-[#51452f]"
                />
                <button
                  type="submit"
                  aria-label="Ir para a página informada"
                  title="Ir para a página informada"
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#c8b994] bg-[#fffdf5] text-[#51452f] hover:bg-[#f5efdf]"
                >
                  <Search size={15} aria-hidden="true" />
                </button>
              </form>
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
            <div className="mt-4 space-y-3">
              {notes.length === 0 ? (
                <p className="rounded-xl bg-background p-3 text-sm text-muted">Nenhuma observação por enquanto.</p>
              ) : visibleNotes.map((note) => (
                <article key={note.id} className="rounded-xl bg-background p-3">
                  <p className="whitespace-pre-wrap text-sm text-dark">{note.message}</p>
                  <p className="mt-2 text-[11px] text-muted">{note.authorId === user?.id ? "Você" : mode === "teacher" ? "Aluno" : "Professor"} · {new Date(note.createdAt).toLocaleString("pt-BR")}</p>
                  <button type="button" onClick={() => setReplyTo(note.id)} className="mt-2 text-xs font-semibold text-primary underline">Responder</button>
                </article>
              ))}
            </div>
            {totalNotesPages > 1 && (
              <nav aria-label="Paginação do bloco de notas" className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => setCurrentNotesPage((page) => Math.max(0, page - 1))}
                  disabled={safeNotesPage === 0}
                  className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-border bg-white px-2.5 text-xs font-semibold text-dark disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={14} aria-hidden="true" /> Anterior
                </button>
                <span className="text-xs font-medium text-muted" aria-live="polite">
                  {safeNotesPage + 1} de {totalNotesPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentNotesPage((page) => Math.min(totalNotesPages - 1, page + 1))}
                  disabled={safeNotesPage >= totalNotesPages - 1}
                  className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-border bg-white px-2.5 text-xs font-semibold text-dark disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Próxima <ChevronRight size={14} aria-hidden="true" />
                </button>
              </nav>
            )}
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
