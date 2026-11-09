import { LogOut } from "lucide-react";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";

export function LogoutButton() {
  const { logout } = useAuth();
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={logout}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold !text-red-600 transition-colors hover:bg-red-600 hover:!text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      <LogOut size={17} aria-hidden="true" />
      {t("auth.logout")}
    </button>
  );
}
