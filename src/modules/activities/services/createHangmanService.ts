import api from "@/lib/api";
import type { CreateHangmanFormValues } from "@/modules/activities/schemas/createHangmanSchema";
interface Response { success: true; data: { activity: { id: string; slug: string; type: "hangman"; status: string }; version: { id: string; versionNumber: number; status: string } }; }
export const createHangmanService = { async execute(values: CreateHangmanFormValues): Promise<Response["data"]> { const response = await api.post<Response>("/activities/hangman", { name: values.name.trim(), description: values.description.trim() || null, difficulty: values.difficulty, content: values.content }); return response.data.data; } };
