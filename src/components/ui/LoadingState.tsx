import { LoaderCircle } from "lucide-react";

interface LoadingStateProps {
  label?: string;
  fullScreen?: boolean;
}

export function LoadingState({
  label = "Carregando...",
  fullScreen = false,
}: LoadingStateProps) {
  return (
    <div
      className={`flex items-center justify-center gap-3 text-sm text-muted ${
        fullScreen ? "min-h-screen px-5" : "min-h-40"
      }`}
      role="status"
      aria-live="polite"
    >
      <LoaderCircle
        size={20}
        className="animate-spin text-primary"
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  );
}