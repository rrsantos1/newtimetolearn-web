import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import {
  createNotebookEntry,
  createNotebookNote,
  deleteNotebookEntry,
  getNotebook,
  listNotebookNotes,
  reorderNotebookEntries,
  updateNotebookEntry,
} from "@/modules/notebooks/services/notebookService";

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("notebookService", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
    vi.mocked(api.patch).mockReset();
    vi.mocked(api.delete).mockReset();
  });

  it("loads the notebook for a teacher-student relationship", async () => {
    const days = [{
      id: "day-1",
      relationshipId: "relationship-1",
      dayDate: "2026-11-07",
      entries: [],
    }];
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: days } } as never);

    await expect(getNotebook("relationship-1")).resolves.toEqual(days);
    expect(api.get).toHaveBeenCalledWith("/notebooks/relationship-1");
  });

  it("creates a notebook entry with its kind and content", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } } as never);

    await createNotebookEntry("relationship-1", "TEXT", { text: "Conteúdo" });

    expect(api.post).toHaveBeenCalledWith("/notebooks/relationship-1/entries", {
      kind: "TEXT",
      content: { text: "Conteúdo" },
    });
  });

  it("updates only the supplied entry fields", async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { success: true } } as never);

    await updateNotebookEntry("relationship-1", "entry-1", "TEXT", { text: "Atualizado" });

    expect(api.patch).toHaveBeenCalledWith(
      "/notebooks/relationship-1/entries/entry-1",
      { kind: "TEXT", content: { text: "Atualizado" } },
    );
  });

  it("deletes a notebook entry", async () => {
    vi.mocked(api.delete).mockResolvedValue({} as never);

    await deleteNotebookEntry("relationship-1", "entry-1");

    expect(api.delete).toHaveBeenCalledWith("/notebooks/relationship-1/entries/entry-1");
  });

  it("sends the requested order for notebook entries", async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { success: true } } as never);

    await reorderNotebookEntries("relationship-1", "day-1", ["entry-2", "entry-1"]);

    expect(api.patch).toHaveBeenCalledWith("/notebooks/relationship-1/entries/reorder", {
      dayId: "day-1",
      entryIds: ["entry-2", "entry-1"],
    });
  });

  it("lists notes in a notebook", async () => {
    const notes = [{
      id: "note-1",
      relationshipId: "relationship-1",
      authorId: "teacher-1",
      parentId: null,
      message: "Bom trabalho!",
      createdAt: "2026-11-07T12:00:00.000Z",
    }];
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: notes } } as never);

    await expect(listNotebookNotes("relationship-1")).resolves.toEqual(notes);
    expect(api.get).toHaveBeenCalledWith("/notebooks/relationship-1/notes");
  });

  it("creates a note with an optional parent", async () => {
    const note = {
      id: "note-2",
      relationshipId: "relationship-1",
      authorId: "teacher-1",
      parentId: "note-1",
      message: "Obrigado!",
      createdAt: "2026-11-07T12:05:00.000Z",
    };
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: note } } as never);

    await expect(createNotebookNote("relationship-1", "Obrigado!", "note-1")).resolves.toEqual(note);
    expect(api.post).toHaveBeenCalledWith("/notebooks/relationship-1/notes", {
      message: "Obrigado!",
      parentId: "note-1",
    });
  });
});
