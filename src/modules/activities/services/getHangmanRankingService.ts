import api from "@/lib/api";
export interface HangmanRankingEntry { position: number; studentName: string; score: number; createdAt: string; }
interface Response { success: true; data: { ranking: HangmanRankingEntry[] }; }
export const getHangmanRankingService = { async execute(slug: string): Promise<HangmanRankingEntry[]> { const response = await api.get<Response>(`/activities/${encodeURIComponent(slug)}/hangman/ranking`); return response.data.data.ranking; } };
