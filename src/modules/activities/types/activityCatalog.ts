import type { ActivityType } from "@/modules/activities/types/activityList.types";

export interface ActivityCatalogItem {
  type: ActivityType;
  label: string;
  description: string;
  createHref?: string;
  available: boolean;
}

export const activityCatalog: readonly ActivityCatalogItem[] = [
  {
    type: "word_search",
    label: "Caça-palavras",
    description: "Encontre palavras escondidas em uma grade de letras.",
    createHref: "/teacher/activities/word-search/new",
    available: true,
  },
  {
    type: "crossword",
    label: "Palavras cruzadas",
    description: "Crie uma grade de palavras com pistas horizontais e verticais.",
    createHref: "/teacher/activities/crossword/new",
    available: true,
  },
  {
    type: "quiz",
    label: "Quiz",
    description: "Crie questões de múltipla escolha com correção automática.",
    createHref: "/teacher/activities/quiz/new",
    available: true,
  },
  { type: "memory", label: "Jogo da memória", description: "Combine pares para praticar conteúdos.", available: false },
  { type: "cloze", label: "Texto lacunado", description: "Complete um texto com termos que faltam.", available: false },
  { type: "multiple_choice", label: "Múltipla escolha", description: "Escolha a resposta correta entre alternativas.", available: false },
  { type: "fill_in_the_blank", label: "Complete a lacuna", description: "Digite a resposta que completa uma frase.", available: false },
  { type: "drag_drop", label: "Arrastar e soltar", description: "Associe elementos arrastando-os para os lugares corretos.", available: false },
  { type: "sentence_order", label: "Ordenar frases", description: "Organize palavras ou trechos na sequência correta.", available: false },
  { type: "board_game", label: "Jogo de tabuleiro", description: "Avance pelo tabuleiro resolvendo desafios.", available: false },
  { type: "roulette", label: "Roleta", description: "Sorteie temas, perguntas ou desafios.", available: false },
  { type: "hangman", label: "Forca", description: "Descubra a palavra usando as pistas.", available: false },
  { type: "fill_in_blanks", label: "Preencher lacunas", description: "Complete vários campos dentro de uma atividade.", available: false },
  { type: "mole_hit", label: "Acertar a toupeira", description: "Responda rapidamente aos itens apresentados.", available: false },
];

export const activityTypeLabels: Record<ActivityType, string> = Object.fromEntries(
  activityCatalog.map(({ type, label }) => [type, label]),
) as Record<ActivityType, string>;
