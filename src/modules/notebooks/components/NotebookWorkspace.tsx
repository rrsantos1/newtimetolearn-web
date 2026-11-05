import { useCallback, useEffect, useState } from "react";
import { BookOpen, ExternalLink, MessageCircle, Send, SplitSquareHorizontal } from "lucide-react";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import {
  createNotebookEntry,
  createNotebookNote,
  getNotebook,
  listNotebookNotes,
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

export function NotebookWorkspace({
  relationshipId,
  mode,
  studentName,
}: NotebookWorkspaceProps) {
  const { user } = useAuth();
  const [days, setDays] = useState<NotebookDay[]>([]);
  const [notes, setNotes] = useState<NotebookNote[]>([]);
  const [entryText, setEntryText] = useState("");
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
    void loadContent();
  }, [loadContent]);

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
                      {day.entries.map((entry) => {
                        if (entry.kind === "ACTIVITY_LINK") {
                          const url = contentText(entry.content.url);
                          return (
                            <div key={entry.id} className="rounded-lg border border-[#d8c9a9] bg-white/70 p-3">
                              <p className="font-semibold text-[#51452f]">{contentText(entry.content.title) || "Atividade"}</p>
                              <a href={url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 underline">
                                Abrir atividade <ExternalLink size={14} aria-hidden="true" />
                              </a>
                            </div>
                          );
                        }
                        return (
                          <p key={entry.id} className="whitespace-pre-wrap text-sm leading-7 text-[#51452f]">
                            {contentText(entry.content.text)}
                          </p>
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
                  <textarea required value={entryText} onChange={(event) => setEntryText(event.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-border bg-white p-3 text-sm text-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Escreva o conteúdo da aula..." />
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
