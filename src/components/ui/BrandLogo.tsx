import Image from "next/image";
import Link from "next/link";

interface BrandLogoProps {
  href?: string;
  compact?: boolean;
}

export function BrandLogo({ href = "/", compact = false }: BrandLogoProps) {
  return (
    <Link
      href={href}
      aria-label="TimeToLearn - página inicial"
      className="inline-flex min-w-0 items-center"
    >
      <Image
        src="/images/logo.jpg"
        alt="TimeToLearn"
        width={compact ? 96 : 112}
        height={compact ? 64 : 72}
        priority
        sizes={compact ? "96px" : "(max-width: 640px) 96px, 112px"}
        className={compact
          ? "h-14 w-auto max-w-24 object-contain"
          : "h-16 w-auto max-w-28 object-contain"}
      />
    </Link>
  );
}
