import api from "@/lib/api";

export interface DragDropRankingEntry {
  position: number;
  studentName: string;
  score: number;
  createdAt: string;
}

interface RankingResponse {
  success: true;
  data: { ranking: DragDropRankingEntry[] };
}

export interface DragDropAttemptResult {
  attempt: {
    id: string;
    score: number;
    accuracyPoints: number;
    totalItems: number;
    correctCount: number;
    corrections: Array<{ itemId: string; selectedId: string | null; expectedId: string; isCorrect: boolean }>;
    createdAt: string;
  };
  ranking: DragDropRankingEntry[];
  isInRanking: boolean;
}

interface AttemptResponse {
  success: true;
  data: DragDropAttemptResult;
}

export interface DragDropAnswer {
  itemId: string;
  selectedId: string;
}

export const dragDropActivityService = {
  async getRanking(slug: string, kind: "word-matching" | "sentence-completion" | "multiple-choice"): Promise<DragDropRankingEntry[]> {
    const response = await api.get<RankingResponse>(`/activities/${encodeURIComponent(slug)}/${kind}/ranking`);
    return response.data.data.ranking;
  },

  async submit(slug: string, kind: "word-matching" | "sentence-completion" | "multiple-choice", answers: DragDropAnswer[], attemptToken: string: Promise<DragDropAttemptResult> {
    const response = await api.post<AttemptResponse>(`/activities/${encodeURIComponent(slug)}/${kind}/attempts`, {
      answers,
      elapsedSeconds,
      attemptToken,
    });
    return response.data.data;
  },
};
