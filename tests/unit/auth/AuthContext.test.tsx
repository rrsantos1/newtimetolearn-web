import { AxiosError, AxiosHeaders } from "axios";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRouter } from "next/router";
import api, { AUTH_TOKEN_KEY } from "@/lib/api";
import type {
  AuthUser,
  UserProfileResponse,
} from "@/modules/auth/types/auth.types";
import { AuthProvider, useAuth } from "@/modules/auth/contexts/AuthContext";

vi.mock("next/router", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
  },
  AUTH_TOKEN_KEY: "timetolearn_access_token",
}));

const user: AuthUser = {
  id: "user-1",
  name: "Ana Silva",
  email: "ana@example.com",
  roles: ["TEACHER"],
};

const profileResponse: UserProfileResponse = {
  success: true,
  data: {
    ...user,
    status: "ACTIVE",
    emailVerifiedAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2025-01-01T00:00:00.000Z",
  },
};

const replaceMock = vi.fn();

function AuthConsumer() {
  const auth = useAuth();

  return (
    <section>
      <output data-testid="auth-state">
        {auth.isLoading
          ? "Carregando"
          : auth.sessionError
            ? "Erro de sessão"
            : auth.isAuthenticated
              ? auth.user?.name
              : "Não autenticado"}
      </output>
      <button onClick={() => auth.setSession("token-123", user)}>
        Definir sessão
      </button>
      <button onClick={auth.logout}>Sair</button>
      <button onClick={() => void auth.refreshProfile()}>
        Atualizar perfil
      </button>
      <button onClick={auth.retrySession}>Tentar novamente</button>
    </section>
  );
}

function renderAuthProvider() {
  return render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>,
  );
}

function resolvedProfile() {
  return Promise.resolve({ data: profileResponse });
}

describe("AuthContext", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.mocked(useRouter).mockReturnValue({
      pathname: "/dashboard",
      replace: replaceMock,
    } as never);
    vi.mocked(api.get).mockReset();
    replaceMock.mockReset();
  });

  it("finishes loading as unauthenticated when no token exists", async () => {
    renderAuthProvider();

    expect(await screen.findByText("Não autenticado")).toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalled();
  });

  it("restores the user profile when a valid session token exists", async () => {
    window.sessionStorage.setItem(AUTH_TOKEN_KEY, "stored-token");
    vi.mocked(api.get).mockResolvedValue(resolvedProfile() as never);

    renderAuthProvider();

    expect(await screen.findByText("Ana Silva")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/users/me");
  });

  it("removes the token when the restored session returns HTTP 401", async () => {
    window.sessionStorage.setItem(AUTH_TOKEN_KEY, "expired-token");
    const unauthorized = new AxiosError(
      "Unauthorized",
      "ERR_BAD_REQUEST",
      undefined,
      undefined,
      {
        status: 401,
        statusText: "Unauthorized",
        headers: {},
        config: { headers: new AxiosHeaders() },
      },
    );
    vi.mocked(api.get).mockRejectedValue(unauthorized);

    renderAuthProvider();

    expect(await screen.findByText("Não autenticado")).toBeInTheDocument();
    expect(window.sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
  });

  it("exposes a session error when profile restoration fails unexpectedly", async () => {
    window.sessionStorage.setItem(AUTH_TOKEN_KEY, "stored-token");
    vi.mocked(api.get).mockRejectedValue(new Error("Network error"));

    renderAuthProvider();

    expect(await screen.findByText("Erro de sessão")).toBeInTheDocument();
    expect(window.sessionStorage.getItem(AUTH_TOKEN_KEY)).toBe("stored-token");
  });

  it("stores the token and authenticates the user when setSession is called", async () => {
    renderAuthProvider();

    await screen.findByText("Não autenticado");
    fireEvent.click(screen.getByRole("button", { name: "Definir sessão" }));

    expect(screen.getByText("Ana Silva")).toBeInTheDocument();
    expect(window.sessionStorage.getItem(AUTH_TOKEN_KEY)).toBe("token-123");
  });

  it("clears the session and redirects to login when logout is called", async () => {
    window.sessionStorage.setItem(AUTH_TOKEN_KEY, "stored-token");
    vi.mocked(api.get).mockResolvedValue(resolvedProfile() as never);

    renderAuthProvider();

    await screen.findByText("Ana Silva");
    fireEvent.click(screen.getByRole("button", { name: "Sair" }));

    expect(await screen.findByText("Não autenticado")).toBeInTheDocument();
    expect(window.sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    expect(replaceMock).toHaveBeenCalledWith("/login");
  });

  it("refreshes the authenticated user's profile", async () => {
    window.sessionStorage.setItem(AUTH_TOKEN_KEY, "stored-token");
    vi.mocked(api.get)
      .mockResolvedValueOnce(resolvedProfile() as never)
      .mockResolvedValueOnce({
        data: {
          data: {
            ...profileResponse.data,
            name: "Ana Silva Atualizada",
          },
        },
      } as never);

    renderAuthProvider();

    await screen.findByText("Ana Silva");
    fireEvent.click(screen.getByRole("button", { name: "Atualizar perfil" }));

    expect(
      await screen.findByText("Ana Silva Atualizada"),
    ).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it("retries session restoration after a temporary failure", async () => {
    window.sessionStorage.setItem(AUTH_TOKEN_KEY, "stored-token");
    vi.mocked(api.get)
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(resolvedProfile() as never);

    renderAuthProvider();

    expect(await screen.findByText("Erro de sessão")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByText("Ana Silva")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it("does not redirect when logout is called on the login page", async () => {
    vi.mocked(useRouter).mockReturnValue({
      pathname: "/login",
      replace: replaceMock,
    } as never);

    renderAuthProvider();
    await screen.findByText("Não autenticado");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Sair" }));
    });

    await waitFor(() => expect(replaceMock).not.toHaveBeenCalled());
  });
});
