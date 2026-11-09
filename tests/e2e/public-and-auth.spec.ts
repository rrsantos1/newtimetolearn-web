import { expect, test } from "@playwright/test";

test("home page renders the main call to action", async ({ page }) => {
  await page.route("**/activities/public**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { items: [] } }),
    });
  });

  await page.route("**/marketplace**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { items: [] } }),
    });
  });

  await page.goto("/pt-BR/");

  await expect(
    page.getByRole("heading", { level: 1, name: /Aprenda, pratique/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Começar agora/i }),
  ).toHaveAttribute("href", "/pt-BR/register");
});

test("login page validates required fields without calling the API", async ({
  page,
}) => {
  await page.goto("/pt-BR/login");

  await expect(
    page.getByRole("heading", { name: "Bem-vindo de volta" }),
  ).toBeVisible();

  await page.getByRole("button", { name: /^Entrar$/ }).click();

  await expect(page.getByText("Informe seu e-mail.")).toBeVisible();
  await expect(page.getByText("Informe sua senha.")).toBeVisible();
});

test("dashboard redirects visitors without a session to login", async ({
  page,
}) => {
  await page.goto("/pt-BR/dashboard");

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Bem-vindo de volta" }),
  ).toBeVisible();
});
