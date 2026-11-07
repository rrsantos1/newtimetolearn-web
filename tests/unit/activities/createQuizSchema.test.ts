import { describe, expect, it } from "vitest";
import { createQuizSchema } from "@/modules/activities/schemas/createQuizSchema";

const validValues = {
  name: "Ciências",
  difficulty: "EASY",
  content: {
    questions: [
      {
        id: "question-1",
        statement: "Qual é o planeta em que vivemos?",
        options: [
          { id: "a", text: "Terra" },
          { id: "b", text: "Marte" },
          { id: "c", text: "Vênus" },
        ],
        correctOptionId: "a",
      },
    ],
  },
};

describe("createQuizSchema", () => {
  it("accepts a valid quiz", async () => {
    await expect(createQuizSchema.validate(validValues)).resolves.toMatchObject(validValues);
  });

  it("requires at least one question", async () => {
    await expect(
      createQuizSchema.validate({
        ...validValues,
        content: { questions: [] },
      }),
    ).rejects.toThrow("pelo menos uma questão.");
  });

  it("requires at least three alternatives per question", async () => {
    await expect(
      createQuizSchema.validate({
        ...validValues,
        content: {
          questions: [{
            ...validValues.content.questions[0],
            options: validValues.content.questions[0].options.slice(0, 2),
          }],
        },
      }),
    ).rejects.toThrow("pelo menos 3 alternativas.");
  });

  it("rejects a correct alternative id that does not exist", async () => {
    await expect(
      createQuizSchema.validate({
        ...validValues,
        content: {
          questions: [{
            ...validValues.content.questions[0],
            correctOptionId: "missing",
          }],
        },
      }),
    ).rejects.toThrow("Marque uma alternativa correta válida.");
  });

  it("accepts an image-only alternative", async () => {
    const imageOnlyValues = {
      ...validValues,
      content: {
        questions: [{
          ...validValues.content.questions[0],
          options: [
            {
              id: "a",
              text: "",
              images: [{ storageKey: "quiz/option-a.jpg", altText: "Imagem de uma árvore" }],
            },
            validValues.content.questions[0].options[1],
            validValues.content.questions[0].options[2],
          ],
        }],
      },
    };

    await expect(createQuizSchema.validate(imageOnlyValues)).resolves.toBeDefined();
  });

  it("rejects an alternative without text or image", async () => {
    await expect(
      createQuizSchema.validate({
        ...validValues,
        content: {
          questions: [{
            ...validValues.content.questions[0],
            options: [
              { id: "a", text: " " },
              ...validValues.content.questions[0].options.slice(1),
            ],
          }],
        },
      }),
    ).rejects.toThrow("Preencha o texto da alternativa ou adicione uma imagem.");
  });
});
