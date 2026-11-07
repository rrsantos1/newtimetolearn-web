import { expect, test, type Page } from "@playwright/test";

const student = {
  id: "e2e-student-id",
  name: "Aluno de Teste",
  email: "aluno.e2e@example.com",
  roles: ["STUDENT"],
};

async function mockSuccessfulLogin(page: Page): Promise<void> {
  await page.route("**/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          accessToken: "e2e-test-access-token",
          tokenType: "Bearer",
          expiresIn: 3600,
          user: student,
        },
      }),
    });
  });
}

test("successful login opens the student dashboard", async ({ page }) => {
  await mockSuccessfulLogin(page);
  await page.goto("/login");

  await page.getByLabel("E-mail").fill(student.email);
  await page.getByRole("textbox", { name: "Senha" }).fill("SenhaSegura123!");
  await page.getByRole("button", { name: /^Entrar$/ }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: `Olá, ${student.name}!` }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Atividades" }),
  ).toBeVisible();
});

test("invalid credentials show an accessible error and keep the user on login", async ({
  page,
}) => {
  await page.route("**/auth/login", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Credenciais inválidas.",
        },
      }),
    });
  });

  await page.goto("/login");
  await page.getByLabel("E-mail").fill(student.email);
  await page.getByRole("textbox", { name: "Senha" }).fill("senha-incorreta");
  await page.getByRole("button", { name: /^Entrar$/ }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByText("E-mail ou senha inválidos.", { exact: true }),
  ).toBeVisible();
});

test("student cannot access the teacher area", async ({ page }) => {
  await mockSuccessfulLogin(page);
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
  await page.goto("/teacher");

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: `Olá, ${student.name}!` }),
  ).toBeVisible();
});

test("session is restored after reload and logout removes the token", async ({
  page,
}) => {
  await mockSuccessfulLogin(page);
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

  await page.reload();
  await expect(
    page.getByRole("heading", { name: `Olá, ${student.name}!` }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect
    .poll(() =>
      page.evaluate(() => window.sessionStorage.getItem("timetolearn_access_token")),
    )
    .toBeNull();
});
