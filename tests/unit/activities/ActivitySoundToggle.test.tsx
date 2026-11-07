import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ActivitySoundToggle } from "@/modules/activities/components/ActivitySoundToggle";

describe("ActivitySoundToggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts enabled when no preference has been saved", async () => {
    render(<ActivitySoundToggle />);

    const button = screen.getByRole("button", { name: "Desativar efeitos sonoros" });
    await waitFor(() => expect(button).toHaveAttribute("aria-pressed", "true"));
    expect(screen.getByText("Som ligado")).toBeInTheDocument();
  });

  it("restores the disabled preference from local storage", async () => {
    window.localStorage.setItem("timetolearn:activity-sounds-enabled", "false");

    render(<ActivitySoundToggle />);

    const button = screen.getByRole("button", { name: "Ativar efeitos sonoros" });
    await waitFor(() => expect(button).toHaveAttribute("aria-pressed", "false"));
    expect(screen.getByText("Som desligado")).toBeInTheDocument();
  });

  it("persists the new preference when toggled off", async () => {
    render(<ActivitySoundToggle />);

    const button = screen.getByRole("button", { name: "Desativar efeitos sonoros" });
    await waitFor(() => expect(button).toHaveAttribute("aria-pressed", "true"));

    fireEvent.click(button);

    expect(screen.getByRole("button", { name: "Ativar efeitos sonoros" })).toHaveAttribute("aria-pressed", "false");
    expect(window.localStorage.getItem("timetolearn:activity-sounds-enabled")).toBe("false");
  });

  it("persists the new preference when toggled on", async () => {
    window.localStorage.setItem("timetolearn:activity-sounds-enabled", "false");

    render(<ActivitySoundToggle />);

    const button = screen.getByRole("button", { name: "Ativar efeitos sonoros" });
    await waitFor(() => expect(button).toHaveAttribute("aria-pressed", "false"));

    fireEvent.click(button);

    expect(screen.getByRole("button", { name: "Desativar efeitos sonoros" })).toHaveAttribute("aria-pressed", "true");
    expect(window.localStorage.getItem("timetolearn:activity-sounds-enabled")).toBe("true");
  });
});
