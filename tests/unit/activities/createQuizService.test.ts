import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import { createQuizService } from "@/modules/activities/services/createQuizService";
import type { CreateQuizFormValues } from "@/modules/activities/schemas/createQuizSchema";

vi.mock("@/lib/api", () => ({
  default: {
    post: vi.fn(),
  },
}));

const input: CreateQuizFormValues = {
  name: "  Ciências  ",
  description: "  Revisão da matéria  ",
  difficulty: "EASY",
  content: {
    questions: [
      {
        id: "question-1",
        statement: "  Qual é o planeta em que vivemos?  ",
        images: [],
        options: [
          { id: "a", text: "  Terra  " },
          { id: "b", text: "Marte" },
          { id: "c", text: "Vênus" },
        ],
        correctOptionId: "a",
        explanation: "  Nosso planeta é a Terra.  ",
      },
    ],
  },
};

describe("createQuizService", () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
  });

  it("sends normalized quiz data and returns the created activity", async () => {
    const created = {
      activity: { slug: "ciencias", type: "quiz" as const },
      version: { versionNumber: 1, status: "DRAFT" },
    };
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: created } } as never);

    await expect(createQuizService.execute(input)).resolves.toEqual(created);

    expect(api.post).toHaveBeenCalledWith("/activities/quiz", {
      name: "Ciências",
      description: "Revisão da matéria",
      difficulty: "EASY",
      content: {
        questions: [{
          id: "question-1",
          statement: "Qual é o planeta em que vivemos?",
          images: [],
          options: [
            { id: "a", text: "Terra" },
            { id: "b", text: "Marte" },
            { id: "c", text: "Vênus" },
          ],
          correctOptionId: "a",
          explanation: "Nosso planeta é a Terra.",
        }],
      },
    });
  });

  it("propagates API errors to the caller", async () => {
    vi.mocked(api.post).mockRejectedValue(new Error("Network error"));

    await expect(createQuizService.execute(input)).rejects.toThrow("Network error");
  });
});
