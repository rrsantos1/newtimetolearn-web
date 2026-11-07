import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import { createMemoryService } from "@/modules/activities/services/createMemoryService";
import type { CreateMemoryFormValues } from "@/modules/activities/schemas/createMemorySchema";

vi.mock("@/lib/api", () => ({
  default: {
    post: vi.fn(),
  },
}));

const input: CreateMemoryFormValues = {
  name: "  Animais  ",
  description: "  Encontre os pares  ",
  difficulty: "MEDIUM",
  content: {
    pairs: [
      {
        id: "pair-1",
        first: { type: "text", value: "  Gato  " },
        second: { type: "image", storageKey: "memory/cat.jpg", altText: "  Gato  " },
      },
      {
        id: "pair-2",
        first: { type: "text", value: "Cachorro" },
        second: { type: "text", value: "Canino" },
      },
      {
        id: "pair-3",
        first: { type: "text", value: "Pássaro" },
        second: { type: "text", value: "Ave" },
      },
    ],
  },
};

describe("createMemoryService", () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
  });

  it("normalizes text and image pairs before sending the request", async () => {
    const created = {
      activity: { id: "activity-1", slug: "animais", type: "memory" as const, status: "DRAFT" },
      version: { id: "version-1", versionNumber: 1, status: "DRAFT" },
    };
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: created } } as never);

    await expect(createMemoryService.execute(input)).resolves.toEqual(created);

    expect(api.post).toHaveBeenCalledWith("/activities/memory", {
      ...input,
      name: "Animais",
      description: "Encontre os pares",
      content: {
        pairs: [
          {
            id: "pair-1",
            first: { type: "text", value: "Gato" },
            second: { type: "image", storageKey: "memory/cat.jpg", altText: "Gato" },
          },
          {
            id: "pair-2",
            first: { type: "text", value: "Cachorro" },
            second: { type: "text", value: "Canino" },
          },
          {
            id: "pair-3",
            first: { type: "text", value: "Pássaro" },
            second: { type: "text", value: "Ave" },
          },
        ],
      },
    });
  });

  it("propagates API errors to the caller", async () => {
    vi.mocked(api.post).mockRejectedValue(new Error("Request failed"));

    await expect(createMemoryService.execute(input)).rejects.toThrow("Request failed");
  });
});
