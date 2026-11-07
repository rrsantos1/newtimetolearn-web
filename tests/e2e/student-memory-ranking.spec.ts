import { expect, test, type Page } from "@playwright/test";

const student = {
  id: "e2e-student-id",
  name: "Aluno de Teste",
  email: "aluno.e2e@example.com",
  roles: ["STUDENT"],
};

const activity = {
  slug: "memory-student-e2e",
  type: "memory",
  version: {
    name: "Memória do Aluno E2E",
    description: "Atividade usada para validar pontuação e ranking.",
    content: {
      pairs: [
        {
          id: "pair-one",
          first: { type: "text", value: "Hello" },
          second: { type: "text", value: "Hello" },
        },
      ],
    },
  },
};

const ranking = [
  {
    position: 1,
    studentName: "Aluno de Teste",
    score: 100,
    createdAt: "2026-11-07T12:00:00.000Z",
  },
];

async function signInAsStudent(page: Page): Promise<void> {
  await page.route("**/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          accessToken: "e2e-student-access-token",
          tokenType: "Bearer",
          expiresIn: 3600,
          user: student,
        },
      }),
    });
  });

  await page.route("**/users/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          ...student,
          status: "ACTIVE",
          emailVerifiedAt: "2026-01-01T10:00:00.000Z",
          createdAt: "2026-01-01T09:00:00.000Z",
        },
      }),
    });
  });

  await page.goto("/login");
  await page.getByLabel("E-mail").fill(student.email);
  await page.getByRole("textbox", { name: "Senha" }).fill("SenhaSegura123!");
  await page.getByRole("button", { name: /^Entrar$/ }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("student completes a memory activity and receives the saved score and ranking", async ({
  page,
}) => {
  const submittedAttempts: Array<Record<string, unknown>> = [];

  await signInAsStudent(page);

  await page.route("**/activities/memory-student-e2e", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: activity }),
    });
  });

  await page.route("**/activities/memory-student-e2e/ranking", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { ranking: [] } }),
    });
  });

  await page.route(
    "**/activities/memory-student-e2e/memory/attempts",
    async (route) => {
      submittedAttempts.push(route.request().postDataJSON() as Record<string, unknown>);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            attempt: {
              id: "e2e-memory-attempt",
              score: 100,
              accuracyPoints: 100,
              totalPairs: 1,
              matchedPairs: 1,
              wrongAttempts: 0,
              penaltyPoints: 0,
              createdAt: "2026-11-07T12:00:00.000Z",
            },
            ranking,
            isInRanking: true,
          },
        }),
      });
    },
  );

  await page.goto("/activities/memory/memory-student-e2e/play");
  await expect(
    page.getByRole("heading", { name: "Ranking atual — Top 5" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Iniciar jogo da memória" }).click();
  const cards = page.getByRole("button", { name: "Revelar carta" });
  await expect(cards).toHaveCount(2);
  await cards.nth(0).click();
  await page.getByRole("button", { name: "Revelar carta" }).click();

  await expect(page.getByRole("heading", { name: "Resultado final" })).toBeVisible();
  await expect(page.getByText("100/100 pontos")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ranking atualizado" })).toBeVisible();
  await expect(page.getByRole("listitem").getByText("Aluno de Teste", { exact: true })).toBeVisible();
  await expect(page.getByText("Parabéns! Seu resultado entrou no Top 5!")).toBeVisible();

  expect(submittedAttempts).toHaveLength(1);
  const submittedAttempt = submittedAttempts[0];
  expect(submittedAttempt?.["matchedPairIds"]).toEqual(["pair-one"]);
  expect(submittedAttempt?.["wrongAttempts"]).toBe(0);
});
