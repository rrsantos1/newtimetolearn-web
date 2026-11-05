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
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-white p-1 shadow-sm ${compact ? "size-12" : "size-14"}`}
    >
      <Image
        src="/images/logo.jpg"
        alt="TimeToLearn"
        width={compact ? 88 : 104}
        height={compact ? 88 : 104}
        priority
        sizes={compact ? "48px" : "56px"}
        className="size-full rounded-full object-contain"
      />
    </Link>
  );
}
