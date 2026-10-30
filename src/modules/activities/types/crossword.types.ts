import type { ActivityDifficulty } from "@/modules/activities/types/activities.types";

export interface CrosswordWordInput {
  word: string;
  clue: string;
}

export interface CreateCrosswordInput {
  name: string;
  description?: string | null;
  difficulty: ActivityDifficulty;
  timeLimitSeconds?: number | null;
  words: CrosswordWordInput[];
}

export interface CrosswordPreview {
  grid: string[][];
  clues: Array<{
    number: number;
    direction: "across" | "down";
    word: string;
    clue: string;
    row?: number;
    col?: number;
  }>;
}

export interface CrosswordActivity {
  id: string;
  name: string;
  type: string;
  status: string;
}

export interface CrosswordVersion {
  id: string;
  versionNumber: number;
  status: string;
  revision: number;
}

export interface CreateCrosswordResponse {
  success: true;
  data: {
    activity: CrosswordActivity;
    version: CrosswordVersion;
    preview: CrosswordPreview;
  };
}

export interface UpdateCrosswordResponse extends CreateCrosswordResponse {}

export interface EditableCrosswordActivity {
  slug: string;
  type: string;
  status: string;
  visibility: string;
  executionCount: number;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
  version: {
    versionNumber: number;
    name: string;
    description: string | null;
    difficulty: ActivityDifficulty;
    timeLimitSeconds: number | null;
    status: string;
    revision: number;
    content: {
      words?: unknown;
      [key: string]: unknown;
    };
    generatedData: Record<string, unknown> | null;
    submittedAt: string | null;
    publishedAt: string | null;
    reviewFeedback: string | null;
  };
}

export interface GetCrosswordResponse {
  success: true;
  data: EditableCrosswordActivity;
}
