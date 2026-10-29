import Link from "next/link";
import { BookOpen } from "lucide-react";

interface BrandLogoProps {
  href?: string;
  compact?: boolean;
}

export function BrandLogo({
  href = "/",
  compact = false,
}: BrandLogoProps) {
  return (
    <Link href={href} className="inline-flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-dark text-primary">
        <BookOpen size={22} aria-hidden="true" />
      </span>

      {!compact && (
        <span className="text-lg font-bold tracking-tight text-dark">
            TimeTo<span className="text-accent">Learn</span>
        </span>
      )}
    </Link>
  );
}