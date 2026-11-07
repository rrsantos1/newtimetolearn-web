import { expect, test } from "@playwright/test";

const student = {
  id: "e2e-student-id",
  name: "Aluno de Teste",
  email: "aluno.e2e@example.com",
  roles: ["STUDENT"],
};

async function mockSuccessfulLogin(page: Parameters<typeof test>[0] extends never ? never : import("@playwright/test").Page) {
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
  await page.getByLabel("Senha").fill("SenhaSegura123!");
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
  await page.getByLabel("Senha").fill("senha-incorreta");
  await page.getByRole("button", { name: /^Entrar$/ }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("alert")).toContainText(
    "E-mail ou senha inválidos.",
  );
});

test("student cannot access the teacher area", async ({ page }) => {
  await mockSuccessfulLogin(page);
  await page.goto("/login");

  await page.getByLabel("E-mail").fill(student.email);
  await page.getByLabel("Senha").fill("SenhaSegura123!");
  await page.getByRole("button", { name: /^Entrar$/ }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/teacher");

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: `Olá, ${student.name}!` }),
  ).toBeVisible();
});
