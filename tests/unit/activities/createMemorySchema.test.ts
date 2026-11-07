import { describe, expect, it } from "vitest";
import { createMemorySchema } from "@/modules/activities/schemas/createMemorySchema";

const validValues = {
  name: "Memória de animais",
  description: "Encontre os pares.",
  difficulty: "EASY",
  timeLimitSeconds: null,
  content: {
    pairs: [
      { id: "pair-1", first: { type: "text", value: "Gato" }, second: { type: "text", value: "Felino" } },
      { id: "pair-2", first: { type: "text", value: "Cachorro" }, second: { type: "text", value: "Canino" } },
      { id: "pair-3", first: { type: "text", value: "Pássaro" }, second: { type: "text", value: "Ave" } },
    ],
  },
};

describe("createMemorySchema", () => {
  it("accepts valid text pairs", async () => {
    await expect(createMemorySchema.validate(validValues)).resolves.toMatchObject(validValues);
  });

  it("accepts a valid image item", async () => {
    const imageValues = {
      ...validValues,
      content: {
        pairs: [
          {
            ...validValues.content.pairs[0],
            second: {
              type: "image",
              storageKey: "memory/cat.jpg",
              altText: "Gato",
            },
          },
          ...validValues.content.pairs.slice(1),
        ],
      },
    };

    await expect(createMemorySchema.validate(imageValues)).resolves.toBeDefined();
  });

  it("requires at least three pairs", async () => {
    await expect(
      createMemorySchema.validate({
        ...validValues,
        content: { pairs: validValues.content.pairs.slice(0, 2) },
      }),
    ).rejects.toThrow("pelo menos 3 pares.");
  });

  it("rejects duplicated pair identifiers", async () => {
    await expect(
      createMemorySchema.validate({
        ...validValues,
        content: {
          pairs: [
            ...validValues.content.pairs.slice(0, 2),
            { ...validValues.content.pairs[2], id: "pair-1" },
          ],
        },
      }),
    ).rejects.toThrow("identificador único.");
  });

  it("rejects empty text cards", async () => {
    await expect(
      createMemorySchema.validate({
        ...validValues,
        content: {
          pairs: [
            { ...validValues.content.pairs[0], first: { type: "text", value: " " } },
            ...validValues.content.pairs.slice(1),
          ],
        },
      }),
    ).rejects.toThrow("Preencha o texto ou selecione uma imagem aprovada.");
  });

  it("rejects text cards longer than 300 characters", async () => {
    await expect(
      createMemorySchema.validate({
        ...validValues,
        content: {
          pairs: [
            { ...validValues.content.pairs[0], first: { type: "text", value: "A".repeat(301) } },
            ...validValues.content.pairs.slice(1),
          ],
        },
      }),
    ).rejects.toThrow("Preencha o texto ou selecione uma imagem aprovada.");
  });
});
