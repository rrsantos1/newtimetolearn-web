import { describe, expect, it } from "vitest";
import { createCrosswordSchema } from "@/modules/activities/schemas/createCrosswordSchema";

const validValues = {
  name: "Animais",
  difficulty: "MEDIUM",
  words: [
    { word: "Gato", clue: "Animal doméstico que mia." },
    { word: "Cachorro", clue: "Animal doméstico que late." },
    { word: "Pássaro", clue: "Animal que geralmente voa." },
  ],
};

describe("createCrosswordSchema", () => {
  it("accepts valid answers and clues", async () => {
    await expect(createCrosswordSchema.validate(validValues)).resolves.toMatchObject(validValues);
  });

  it("requires at least three answers", async () => {
    await expect(
      createCrosswordSchema.validate({ ...validValues, words: validValues.words.slice(0, 2) }),
    ).rejects.toThrow("pelo menos 3 respostas.");
  });

  it("rejects duplicate answers after normalization", async () => {
    await expect(
      createCrosswordSchema.validate({
        ...validValues,
        words: [
          { word: "Pássaro", clue: "Pista um." },
          { word: "PASSARO", clue: "Pista dois." },
          validValues.words[1],
        ],
      }),
    ).rejects.toThrow("respostas duplicadas na atividade.");
  });

  it("requires a clue for every answer", async () => {
    await expect(
      createCrosswordSchema.validate({
        ...validValues,
        words: [{ ...validValues.words[0], clue: " " }, ...validValues.words.slice(1)],
      }),
    ).rejects.toThrow("Informe a pista.");
  });

  it("rejects answers longer than twenty-five normalized characters", async () => {
    await expect(
      createCrosswordSchema.validate({
        ...validValues,
        words: [
          { word: "A".repeat(26), clue: "Pista." },
          ...validValues.words.slice(1),
        ],
      }),
    ).rejects.toThrow("entre 2 e 25 letras");
  });
});
