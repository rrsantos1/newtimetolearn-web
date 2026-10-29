import { LogOut } from "lucide-react";
import { useAuth } from "@/modules/auth/contexts/AuthContext";

export function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button
      type="button"
      onClick={logout}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
    >
      <LogOut size={17} aria-hidden="true" />
      Sair
    </button>
  );
}