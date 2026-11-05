import Image from "next/image";
import Link from "next/link";

interface BrandLogoProps {
  href?: string;
  compact?: boolean;
}

export function BrandLogo({
  href = "/",
  compact = false,
}: BrandLogoProps) {
  return (
    <Link
      href={href}
      aria-label="TimeToLearn - página inicial"
      className="inline-flex min-w-0 items-center"
    >
      <Image
        src="/images/logo.jpg"
        alt="TimeToLearn"
        width={compact ? 132 : 172}
        height={58}
        priority
        sizes={compact ? "132px" : "(max-width: 640px) 142px, 172px"}
        className={compact ? "h-auto w-[132px] object-contain" : "h-auto w-[142px] object-contain sm:w-[172px]"}
      />
    </Link>
  );
}
