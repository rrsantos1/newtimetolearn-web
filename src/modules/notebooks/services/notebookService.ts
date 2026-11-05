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

export async function reorderNotebookEntries(
  relationshipId: string,
  dayId: string,
  entryIds: string[],
): Promise<void> {
  await api.patch(`/notebooks/${relationshipId}/entries/reorder`, { dayId, entryIds });
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
