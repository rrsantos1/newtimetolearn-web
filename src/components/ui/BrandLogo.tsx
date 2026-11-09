import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";

interface BrandLogoProps {
  href?: string;
  compact?: boolean;
}

export function BrandLogo({ href = "/", compact = false }: BrandLogoProps) {
  const { t } = useTranslation();
  return (
    <Link
      href={href}
      aria-label={t("common.homePageLabel")}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-white p-1 shadow-sm ${compact ? "size-12" : "size-16"}`}
    >
      <Image
        src="/images/logo.jpg"
        alt="TimeToLearn"
        width={compact ? 88 : 120}
        height={compact ? 88 : 120}
        priority
        sizes={compact ? "48px" : "64px"}
        className="size-full rounded-full object-contain"
      />
    </Link>
  );
}
