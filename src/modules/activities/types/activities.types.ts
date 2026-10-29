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