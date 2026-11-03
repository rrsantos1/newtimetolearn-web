import type { ActivityType } from "@/modules/activities/types/activityList.types";

const defaultCovers: Partial<Record<ActivityType, string>> = {
  word_search: "/images/activities/word-search.png",
  crossword: "/images/activities/crossword.png",
  quiz: "/images/activities/quiz.png",
  memory: "/images/activities/memory.png",
  listening: "/images/activities/listening.png",
  word_matching: "/images/activities/word-matching.png",
  sentence_completion: "/images/activities/sentence-completion.png",
};

export function getActivityCoverImage(
  type: ActivityType,
  coverImageUrl?: string | null,
): string {
  return coverImageUrl ?? defaultCovers[type] ?? "/images/activities/default-cover.jpg";
}
