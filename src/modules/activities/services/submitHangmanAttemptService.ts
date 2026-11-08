import api from "@/lib/api";
export interface HangmanAttemptResult { attempt: { id: string; score: number; accuracyPoints: number; solvedWords: number; totalWords: number; mistakes: number; createdAt: string }; ranking: Array<{ position: number; studentName: string; score: number; createdAt: string }>; isInRanking: boolean; }
interface Response { success: true; data: HangmanAttemptResult; }
export const submitHangmanAttemptService = { async execute(slug: string, attemptToken: string, solvedWordIds: string[], mistakes: number): Promise<HangmanAttemptResult> { const response = await api.post<Response>(`/activities/${encodeURIComponent(slug)}/hangman/attempts`, { attemptToken, solvedWordIds, mistakes }); return response.data.data; } };
