import api from "@/lib/api";

export type ListeningVoice =
  | "alloy" | "ash" | "ballad" | "coral" | "echo" | "fable"
  | "nova" | "onyx" | "sage" | "shimmer" | "verse" | "marin" | "cedar";

export interface ListeningBlankInput {
  id: string;
  startOffset: number;
  endOffset: number;
  expectedAnswer: string;
  alternatives: string[];
  grammarCategory: string | null;
}

export interface ListeningPassageInput {
  id: string;
  title: string;
  text: string;
  blanks: ListeningBlankInput[];
  audio?: {
    storageKey: string | null;
    publicUrl: string | null;
    disclosure: string | null;
    status: "PENDING" | "READY" | "STALE" | "FAILED";
    model: string | null;
    voice: string | null;
    textHash: string | null;
    durationSeconds: number | null;
  };
}

export interface CreateListeningInput {
  name: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  timeLimitSeconds: number | null;
  content: {
    language: string;
    instructions: string;
    passages: ListeningPassageInput[];
  };
}

export interface ListeningActivityResponse {
  success: true;
  data: {
    activity: { id: string; slug: string; type: string; status: string };
    version: { id: string; versionNumber: number; status: string; revision: number };
  };
}

export interface ListeningActivityDetailsResponse {
  success: true;
  data: {
    slug: string;
    type: string;
    status: string;
    version: {
      name: string;
      description: string | null;
      difficulty: "EASY" | "MEDIUM" | "HARD";
      timeLimitSeconds: number | null;
      status: string;
      content: {
        language: string;
        instructions: string;
        passages: ListeningPassageInput[];
      };
    };
  };
}

export interface GenerateListeningAudioResponse {
  success: true;
  data: {
    passageId: string;
    audio: {
      storageKey: string;
      publicUrl: string | null;
      disclosure: string;
      status: "READY";
      model: string;
      voice: string;
      textHash: string;
      durationSeconds: number | null;
    };
  };
}

export const listeningService = {
  async create(input: CreateListeningInput): Promise<ListeningActivityResponse["data"]> {
    const response = await api.post<ListeningActivityResponse>("/activities/listening", input);
    return response.data.data;
  },

  async get(slug: string): Promise<ListeningActivityDetailsResponse["data"]> {
    const response = await api.get<ListeningActivityDetailsResponse>(`/activities/${encodeURIComponent(slug)}`);
    return response.data.data;
  },

  async edit(slug: string, input: CreateListeningInput): Promise<ListeningActivityResponse["data"]> {
    const response = await api.patch<ListeningActivityResponse>(`/activities/${encodeURIComponent(slug)}/listening`, input);
    return response.data.data;
  },

  async generateAudio(slug: string, passageId: string, voice: ListeningVoice): Promise<GenerateListeningAudioResponse["data"]> {
    const response = await api.post<GenerateListeningAudioResponse>(
      `/activities/${encodeURIComponent(slug)}/listening/passages/${encodeURIComponent(passageId)}/audio`,
      { voice },
    );
    return response.data.data;
  },
};
