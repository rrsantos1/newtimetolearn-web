import Image from "next/image";
import type { ActivityType } from "@/modules/activities/types/activityList.types";
import { getActivityCoverImage } from "@/modules/users/utils/activityCover";

interface Props {
  type: ActivityType;
  coverImageUrl?: string | null;
  altText?: string | null;
  className?: string;
  loading?: "eager" | "lazy";
}

export function ActivityCoverImage({
  type,
  coverImageUrl,
  altText,
  className = "",
  loading = "lazy",
}: Readonly<Props>) {
  return (
    <div className={`relative aspect-video w-full overflow-hidden rounded-xl bg-background ${className}`}>
      <Image
        src={getActivityCoverImage(type, coverImageUrl)}
        alt={altText?.trim() ?? ""}
        fill
        loading={loading}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
        className="object-contain"
      />
    </div>
  );
}
