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
    type: "listening",
    label: "Listening",
    description: "Crie textos com lacunas e narração para treinar compreensão auditiva.",
    createHref: "/teacher/activities/listening/new",
    available: true,
  },
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
  { type: "memory", label: "Jogo da memória", description: "Combine pares de texto e imagens para praticar conteúdos.", createHref: "/teacher/activities/memory/new", available: true },
  { type: "word_matching", label: "Associação de palavras", description: "Arraste cada palavra até sua correspondência correta.", createHref: "/teacher/activities/word-matching/new", available: true },
  { type: "sentence_completion", label: "Complete as frases", description: "Preencha lacunas arrastando palavras do banco.", createHref: "/teacher/activities/sentence-completion/new", available: true },
  { type: "cloze", label: "Texto lacunado", description: "Complete um texto com termos que faltam.", available: false },
  { type: "multiple_choice", label: "Múltipla escolha", description: "Veja um item por vez e escolha sua correspondência entre todas as opções.", createHref: "/teacher/activities/multiple-choice/new", available: true },
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
