export type NotebookEntryKind = "TEXT" | "IMAGE" | "ACTIVITY_LINK" | "FILE";

export interface NotebookEntry {
  id: string;
  dayId: string;
  createdBy: string;
  kind: NotebookEntryKind;
  content: Record<string, unknown>;
  position: number;
  createdAt: string;
}

export interface NotebookDay {
  id: string;
  relationshipId: string;
  dayDate: string;
  entries: NotebookEntry[];
}

export interface NotebookNote {
  id: string;
  relationshipId: string;
  authorId: string;
  parentId: string | null;
  message: string;
  createdAt: string;
}

export interface NotebookListResponse {
  success: boolean;
  data: NotebookDay[];
}

export interface NotebookNotesResponse {
  success: boolean;
  data: NotebookNote[];
}

export interface NotebookEntryResponse {
  success: boolean;
  data: {
    entry: NotebookEntry;
    day: NotebookDay;
    isFirstEntry: boolean;
  };
}

export interface NotebookNoteResponse {
  success: boolean;
  data: NotebookNote;
}
