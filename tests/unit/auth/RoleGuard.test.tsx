import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/router";
import { RoleGuard } from "@/modules/auth/components/RoleGuard";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import type { AuthUser } from "@/modules/auth/types/auth.types";

vi.mock("next/router", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/modules/auth/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const teacher: AuthUser = {
  id: "teacher-1",
  name: "Professora Ana",
  email: "ana@example.com",
  roles: ["TEACHER"],
};

const replace = vi.fn();

function configureAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}): void {
  vi.mocked(useAuth).mockReturnValue({
    user: teacher,
    isAuthenticated: true,
    isLoading: false,
    sessionError: false,
    setSession: vi.fn(),
    logout: vi.fn(),
    refreshProfile: vi.fn().mockResolvedValue(undefined),
    retrySession: vi.fn(),
    ...overrides,
  });
}

describe("RoleGuard", () => {
  beforeEach(() => {
    replace.mockReset();
    vi.mocked(useRouter).mockReturnValue({
      pathname: "/teacher",
      locale: "pt-BR",
      replace,
    } as never);
    configureAuth();
  });

  it("renders protected content for an authorized role", () => {
    render(
      <RoleGuard allowedRoles={["TEACHER", "ADMIN"]}>
        <p>Área do professor</p>
      </RoleGuard>,
    );

    expect(screen.getByText("Área do professor")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("shows a loading state while the session is being checked", () => {
    configureAuth({ isLoading: true, isAuthenticated: false, user: null });

    render(
      <RoleGuard allowedRoles={["TEACHER"]}>
        <p>Área protegida</p>
      </RoleGuard>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Verificando sua sessão...");
    expect(screen.queryByText("Área protegida")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated users to login", async () => {
    configureAuth({ isAuthenticated: false, user: null });

    render(
      <RoleGuard allowedRoles={["TEACHER"]}>
        <p>Área protegida</p>
      </RoleGuard>,
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("Área protegida")).not.toBeInTheDocument();
  });

  it("redirects authenticated users without the required role to dashboard", async () => {
    configureAuth({
      user: { ...teacher, roles: ["STUDENT"] },
    });

    render(
      <RoleGuard allowedRoles={["TEACHER"]}>
        <p>Área protegida</p>
      </RoleGuard>,
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
    expect(screen.queryByText("Área protegida")).not.toBeInTheDocument();
  });

  it("shows a recoverable message when session verification fails", () => {
    configureAuth({ sessionError: true });

    render(
      <RoleGuard allowedRoles={["TEACHER"]}>
        <p>Área protegida</p>
      </RoleGuard>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Não foi possível verificar sua sessão.",
    );
    expect(replace).not.toHaveBeenCalled();
  });
});
