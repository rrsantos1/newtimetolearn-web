export type ActivityDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface CreateWordSearchInput {
  name: string;
  description?: string | null;
  difficulty: ActivityDifficulty;
  timeLimitSeconds?: number | null;
  words: string[];
}

export interface WordSearchPreview {
  grid: string[][];
  words: string[];
}

export interface CreatedActivity {
  id: string;
  name: string;
  type: string;
  status: string;
}

export interface CreateWordSearchResponse {
  success: true;
  data: {
    activity: CreatedActivity;
    version: unknown;
    preview: WordSearchPreview;
  };
}

export interface EditableWordSearchActivity {
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
    content: Record<string, unknown>;
    generatedData: Record<string, unknown> | null;
    submittedAt: string | null;
    publishedAt: string | null;
  };
}

export interface GetWordSearchActivityResponse {
  success: true;
  data: EditableWordSearchActivity;
}