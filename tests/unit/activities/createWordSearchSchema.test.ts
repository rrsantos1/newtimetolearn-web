import { describe, expect, it } from "vitest";
import { createWordSearchSchema } from "@/modules/activities/schemas/createWordSearchSchema";

const validValues = {
  name: "Animais",
  difficulty: "EASY",
  words: ["Gato", "Cachorro", "Pássaro"],
};

describe("createWordSearchSchema", () => {
  it("accepts a valid activity", async () => {
    await expect(createWordSearchSchema.validate(validValues)).resolves.toMatchObject(validValues);
  });

  it("requires at least three words", async () => {
    await expect(
      createWordSearchSchema.validate({ ...validValues, words: ["Gato", "Cão"] }),
    ).rejects.toThrow("pelo menos 3 palavras.");
  });

  it("rejects words duplicated after accent and case normalization", async () => {
    await expect(
      createWordSearchSchema.validate({
        ...validValues,
        words: ["Pássaro", "PASSARO", "Cachorro"],
      }),
    ).rejects.toThrow("palavras duplicadas na atividade.");
  });

  it("rejects words containing unsupported punctuation", async () => {
    await expect(
      createWordSearchSchema.validate({
        ...validValues,
        words: ["Gato!", "Cachorro", "Pássaro"],
      }),
    ).rejects.toThrow("Use apenas letras, espaços e hífens.");
  });

  it("accepts an empty optional time limit", async () => {
    await expect(
      createWordSearchSchema.validate({ ...validValues, timeLimitSeconds: "" }),
    ).resolves.toMatchObject({ timeLimitSeconds: null });
  });

  it("rejects a word longer than twenty normalized characters", async () => {
    await expect(
      createWordSearchSchema.validate({
        ...validValues,
        words: ["A".repeat(21), "Cachorro", "Pássaro"],
      }),
    ).rejects.toThrow("entre 2 e 20 letras");
  });
});
