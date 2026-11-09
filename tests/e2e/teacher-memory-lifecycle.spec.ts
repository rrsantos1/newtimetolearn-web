import { expect, test, type Page } from "@playwright/test";

const teacher = {
  id: "e2e-teacher-id",
  name: "Professor de Teste",
  email: "professor.e2e@example.com",
  roles: ["TEACHER"],
};

const createdActivity = {
  id: "e2e-memory-activity-id",
  slug: "memory-teacher-e2e",
  type: "memory",
  status: "DRAFT",
};

const entitlements = {
  planCode: "PRO",
  planName: "Plano Pro",
  storageLimitBytes: 1_000_000_000,
  studentLimit: 100,
  removesAds: true,
  subscriptionStatus: "ACTIVE",
  paymentIntegrationEnabled: false,
  reservedStudents: 0,
  studentsRemaining: 100,
};

function activityListResponse(status: "DRAFT" | "PENDING_REVIEW") {
  return {
    success: true,
    data: {
      items: [
        {
          slug: createdActivity.slug,
          type: "memory",
          status: "DRAFT",
          visibility: "AUTHENTICATED",
          executionCount: 0,
          coverImageUrl: null,
          coverAltText: null,
          createdAt: "2026-11-07T12:00:00.000Z",
          requiresApproval: true,
          latestVersion: {
            versionNumber: 1,
            name: "Jogo de memória E2E",
            description: "Atividade criada pelo teste automatizado.",
            difficulty: "EASY",
            status,
            revision: 1,
          },
          publishedVersion: null,
        },
      ],
      pagination: {
        page: 1,
        limit: 9,
        total: 1,
        totalPages: 1,
      },
    },
  };
}

async function signInAsTeacher(page: Page): Promise<void> {
  await page.route("**/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          accessToken: "e2e-teacher-access-token",
          tokenType: "Bearer",
          expiresIn: 3600,
          user: teacher,
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
          ...teacher,
          status: "ACTIVE",
          emailVerifiedAt: "2026-01-01T10:00:00.000Z",
          createdAt: "2026-01-01T09:00:00.000Z",
        },
      }),
    });
  });

  await page.route("**/subscriptions/me/entitlements", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: entitlements }),
    });
  });

  await page.goto("/pt-BR/login");
  await page.getByLabel("E-mail").fill(teacher.email);
  await page.getByRole("textbox", { name: "Senha" }).fill("SenhaSegura123!");
  await page.getByRole("button", { name: /^Entrar$/ }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("teacher creates a memory activity and submits it for approval", async ({
  page,
}) => {
  let submittedForApproval = false;
  const createdPayload: { current: Record<string, unknown> | null } = { current: null };

  await signInAsTeacher(page);

  await page.route("**/activities/memory", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }

    createdPayload.current = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          activity: createdActivity,
          version: {
            id: "e2e-memory-version-id",
            versionNumber: 1,
            status: "DRAFT",
          },
        },
      }),
    });
  });

  await page.route("**/activities/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;

    if (request.method() === "GET" && pathname.endsWith("/activities/")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          activityListResponse(submittedForApproval ? "PENDING_REVIEW" : "DRAFT"),
        ),
      });
      return;
    }

    if (
      request.method() === "PATCH" &&
      pathname.endsWith(`/activities/${createdActivity.slug}/submit`)
    ) {
      submittedForApproval = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { status: "PENDING_REVIEW" } }),
      });
      return;
    }

    await route.fallback();
  });

  await page.goto("/pt-BR/teacher/activities/memory/new");
  await page.getByLabel("Nome da atividade *").fill("Jogo de memória E2E");

  const removePairButtons = page.getByRole("button", { name: "Remover par" });
  await removePairButtons.nth(0).click();
  await removePairButtons.nth(0).click();
  await removePairButtons.nth(0).click();

  const pairFields = page.getByLabel("Texto do par");
  await expect(pairFields).toHaveCount(6);

  const pairValues = [
    "Hello",
    "Hello",
    "Good morning",
    "Good morning",
    "Goodbye",
    "Goodbye",
  ];

  for (const [index, value] of pairValues.entries()) {
    await pairFields.nth(index).fill(value);
  }

  const submitButton = page.locator('form button[type="submit"]');
  await expect(submitButton).toBeVisible();
  await submitButton.click();

  await expect(
    page.getByRole("heading", { name: "Jogo salvo com sucesso!" }),
  ).toBeVisible();

  expect(createdPayload.current).not.toBeNull();
  expect(createdPayload.current?.name).toBe("Jogo de memória E2E");
  expect(
    (createdPayload.current?.content as { pairs: unknown[] } | undefined)?.pairs,
  ).toHaveLength(3);

  await page.getByRole("link", { name: "Ver minhas atividades" }).click();
  await expect(page).toHaveURL(/\/teacher\/activities$/);
  await expect(page.getByText("Jogo de memória E2E")).toBeVisible();
  await expect(page.getByText("Rascunho")).toBeVisible();

  await page
    .getByRole("button", {
      name: "Enviar Jogo de memória E2E para aprovação",
    })
    .click();

  await expect(
    page.getByRole("status").filter({
      hasText: 'A atividade "Jogo de memória E2E" foi enviada para aprovação.',
    }),
  ).toBeVisible();
  await expect(page.getByText("Aguardando aprovação")).toBeVisible();
  expect(submittedForApproval).toBe(true);
});
