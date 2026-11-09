import { expect, test } from "@playwright/test";

const activity = {
  slug: "memory-e2e",
  type: "memory",
  version: {
    name: "Memória E2E",
    description: "Atividade usada nos testes automatizados.",
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

test.describe("public memory activity", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/activities/public/memory-e2e", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: activity,
        }),
      });
    });
  });

  test("loads the ready screen with activity details", async ({ page }) => {
    await page.goto("/pt-BR/activities/memory/memory-e2e/play");

    await expect(
      page.getByRole("heading", { name: "Memória E2E" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Preparado para o desafio?" }),
    ).toBeVisible();
    await expect(page.getByText("Quantidade de pares")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Testar atividade" }),
    ).toBeVisible();
  });

  test("completes an anonymous preview without registering a ranked attempt", async ({
    page,
  }) => {
    let attemptRequests = 0;

    await page.route("**/activities/*/memory/attempts", async (route) => {
      attemptRequests += 1;
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: { message: "Anonymous attempts must not be submitted." },
        }),
      });
    });

    await page.goto("/pt-BR/activities/memory/memory-e2e/play");
    await page.getByRole("button", { name: "Testar atividade" }).click();

    const hiddenCards = page.getByRole("button", { name: "Revelar carta" });
    await expect(hiddenCards).toHaveCount(2);

    await hiddenCards.nth(0).click();
    await page.getByRole("button", { name: "Revelar carta" }).click();

    await expect(
      page.getByRole("heading", { name: "Prévia concluída" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Prévia concluída. O resultado não foi registrado no ranking dos alunos.",
        { exact: true },
      ).first(),
    ).toBeVisible();
    expect(attemptRequests).toBe(0);
  });
});
