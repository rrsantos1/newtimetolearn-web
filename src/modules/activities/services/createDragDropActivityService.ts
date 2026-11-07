import api from "@/lib/api";
import type {
  CreateSentenceCompletionFormValues,
  CreateWordMatchingFormValues,
} from "@/modules/activities/schemas/createDragDropSchemas";
import type { MemoryItemValue } from "@/modules/activities/schemas/createMemorySchema";

interface DragDropMutationResponse {
  success: true;
  data: {
    activity: { id: string; slug: string; type: string; status: string };
    version: { id: string; versionNumber: number; status: string };
  };
}


function normalizeMatchingItem(item: MemoryItemValue): MemoryItemValue {
  return item.type === "text"
    ? { type: "text", value: item.value.trim() }
    : { type: "image", storageKey: item.storageKey.trim(), altText: item.altText.trim() };
}

function normalizeBase(input: CreateWordMatchingFormValues | CreateSentenceCompletionFormValues) {
  return {
    name: input.name.trim(),
    description: input.description.trim() || null,
    difficulty: input.difficulty,
  };
}

export const createDragDropActivityService = {
  async createWordMatching(input: CreateWordMatchingFormValues): Promise<DragDropMutationResponse["data"]> {
    const response = await api.post<DragDropMutationResponse>("/activities/word-matching", {
      ...normalizeBase(input),
      content: {
        pairs: input.content.pairs.map((pair) => ({
          id: pair.id,
          source: normalizeMatchingItem(pair.source),
          target: normalizeMatchingItem(pair.target),
        })),
      },
    });
    return response.data.data;
  },


  async createMultipleChoice(input: CreateWordMatchingFormValues): Promise<DragDropMutationResponse["data"]> {
    const response = await api.post<DragDropMutationResponse>("/activities/multiple-choice", {
      ...normalizeBase(input),
      content: { pairs: input.content.pairs.map((pair) => ({
        id: pair.id,
        source: normalizeMatchingItem(pair.source),
        target: normalizeMatchingItem(pair.target),
      })) },
    });
    return response.data.data;
  },

  async updateMultipleChoice(slug: string, input: CreateWordMatchingFormValues): Promise<DragDropMutationResponse["data"]> {
    const response = await api.patch<DragDropMutationResponse>(`/activities/${encodeURIComponent(slug)}/multiple-choice`, {
      ...normalizeBase(input),
      content: { pairs: input.content.pairs.map((pair) => ({
        id: pair.id,
        source: normalizeMatchingItem(pair.source),
        target: normalizeMatchingItem(pair.target),
      })) },
    });
    return response.data.data;
  },

  async createSentenceCompletion(input: CreateSentenceCompletionFormValues): Promise<DragDropMutationResponse["data"]> {
    const words = input.content.words.map((word) => ({ id: word.id, text: word.text.trim() }));
    const sentences = input.content.sentences.map((sentence) => {
      const blanks = sentence.parts.filter((part) => part.type === "blank").map((part) => ({
        id: part.id,
        expectedWordId: part.expectedWordId,
      }));
      const text = sentence.parts.map((part) => part.type === "text" ? part.value : `{{${part.id}}}`).join("");
      return { id: sentence.id, text, blanks };
    });
    const response = await api.post<DragDropMutationResponse>("/activities/sentence-completion", {
      ...normalizeBase(input),
      content: { words, sentences },
    });
    return response.data.data;
  },

  async updateWordMatching(slug: string, input: CreateWordMatchingFormValues): Promise<DragDropMutationResponse["data"]> {
    const response = await api.patch<DragDropMutationResponse>(`/activities/${encodeURIComponent(slug)}/word-matching`, {
      ...normalizeBase(input),
      content: {
        pairs: input.content.pairs.map((pair) => ({
          id: pair.id,
          source: normalizeMatchingItem(pair.source),
          target: normalizeMatchingItem(pair.target),
        })),
      },
    });
    return response.data.data;
  },

  async updateSentenceCompletion(slug: string, input: CreateSentenceCompletionFormValues): Promise<DragDropMutationResponse["data"]> {
    const words = input.content.words.map((word) => ({ id: word.id, text: word.text.trim() }));
    const sentences = input.content.sentences.map((sentence) => {
      const blanks = sentence.parts.filter((part) => part.type === "blank").map((part) => ({
        id: part.id,
        expectedWordId: part.expectedWordId,
      }));
      const text = sentence.parts.map((part) => part.type === "text" ? part.value : `{{${part.id}}}`).join("");
      return { id: sentence.id, text, blanks };
    });
    const response = await api.patch<DragDropMutationResponse>(`/activities/${encodeURIComponent(slug)}/sentence-completion`, {
      ...normalizeBase(input),
      content: { words, sentences },
    });
    return response.data.data;
  },
};
