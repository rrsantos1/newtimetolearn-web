export type ActivityStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type ActivityVersionStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "PUBLISHED"
  | "REJECTED"
  | "CHANGES_REQUESTED";

export type ActivityVisibility = "AUTHENTICATED" | "PUBLIC";

export type ActivityType =
  | "quiz"
  | "word_search"
  | "crossword"
  | "cloze"
  | "multiple_choice"
  | "fill_in_the_blank"
  | "drag_drop"
  | "sentence_order"
  | "board_game"
  | "roulette"
  | "hangman"
  | "memory"
  | "fill_in_blanks"
  | "mole_hit";

export type ActivityDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface ListedActivityVersion {
  versionNumber: number;
  name: string;
  description: string | null;
  difficulty: ActivityDifficulty;
  timeLimitSeconds: number | null;
  status: ActivityVersionStatus;
  revision: number;
}

export interface ListedActivity {
  slug: string;
  type: ActivityType;
  status: ActivityStatus;
  visibility: ActivityVisibility;
  executionCount: number;
  createdAt: string;
  requiresApproval: boolean;
  latestVersion: ListedActivityVersion | null;
  publishedVersion: {
    versionNumber: number;
    name: string;
  } | null;
}

export interface ActivityListData {
  items: ListedActivity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ActivityListResponse {
  success: true;
  data: ActivityListData;
}