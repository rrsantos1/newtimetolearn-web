import api from "@/lib/api";
import type {
  NotebookDay,
  NotebookEntryKind,
  NotebookEntryResponse,
  NotebookListResponse,
  NotebookNote,
  NotebookNoteResponse,
  NotebookNotesResponse,
} from "../types/notebook.types";

export async function getNotebook(relationshipId: string): Promise<NotebookDay[]> {
  const response = await api.get<NotebookListResponse>(`/notebooks/${relationshipId}`);
  return response.data.data;
}

export async function createNotebookEntry(
  relationshipId: string,
  kind: NotebookEntryKind,
  content: Record<string, unknown>,
): Promise<void> {
  await api.post<NotebookEntryResponse>(`/notebooks/${relationshipId}/entries`, { kind, content });
}

export async function updateNotebookEntry(
  relationshipId: string,
  entryId: string,
  kind: NotebookEntryKind,
  content?: Record<string, unknown>,
  dayDate?: string,
): Promise<void> {
  await api.patch(`/notebooks/${relationshipId}/entries/${entryId}`, {
    kind,
    ...(content ? { content } : {}),
    ...(dayDate ? { dayDate } : {}),
  });
}

export async function deleteNotebookEntry(relationshipId: string, entryId: string): Promise<void> {
  await api.delete(`/notebooks/${relationshipId}/entries/${entryId}`);
}

export async function reorderNotebookEntries(
  relationshipId: string,
  dayId: string,
  entryIds: string[],
): Promise<void> {
  await api.patch(`/notebooks/${relationshipId}/entries/reorder`, { dayId, entryIds });
}

export async function createNotebookAttachment(relationshipId: string, file: File): Promise<void> {
  await api.post(`/notebooks/${relationshipId}/attachments`, file, {
    headers: {
      "Content-Type": file.type,
      "x-file-name": encodeURIComponent(file.name),
    },
    // Vídeos podem levar mais de 30 segundos para serem recebidos e enviados ao Backblaze.
    timeout: file.type.startsWith("video/") ? 360_000 : 60_000,
  });
}

export async function downloadNotebookAttachment(relationshipId: string, entryId: string): Promise<Blob> {
  const response = await api.get<Blob>(
    `/notebooks/${relationshipId}/entries/${entryId}/file`,
    { responseType: "blob" },
  );
  return response.data;
}

export async function listNotebookNotes(relationshipId: string): Promise<NotebookNote[]> {
  const response = await api.get<NotebookNotesResponse>(`/notebooks/${relationshipId}/notes`);
  return response.data.data;
}

export async function createNotebookNote(
  relationshipId: string,
  message: string,
  parentId: string | null,
): Promise<NotebookNote> {
  const response = await api.post<NotebookNoteResponse>(
    `/notebooks/${relationshipId}/notes`,
    { message, parentId },
  );
  return response.data.data;
}
