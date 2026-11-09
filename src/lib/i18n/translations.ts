export const supportedLocales = ["en", "pt-BR"] as const;

export type AppLocale = (typeof supportedLocales)[number];
export type TranslationKey = keyof typeof translations.en;

const translations = {
  en: {
    "language.label": "Language",
    "language.english": "English",
    "language.portuguese": "Português",
    "navigation.main": "Main navigation",
    "navigation.about": "About",
    "navigation.admin": "Administration",
    "navigation.checkingSession": "Checking session...",
    "navigation.login": "Log in",
    "navigation.dashboard": "Dashboard",
    "navigation.studies": "My studies",
    "navigation.account": "My account",
    "navigation.comingSoon": "Coming soon",
    "navigation.teacherArea": "Teacher area",
    "navigation.myTeachers": "My teachers",
    "navigation.openMenu": "Open menu",
    "navigation.closeMenu": "Close menu",
    "navigation.authenticatedArea": "Authenticated area",
    "footer.tagline": "Learn. Teach. Evolve.",
    "auth.logout": "Log out",
  },
  "pt-BR": {
    "language.label": "Idioma",
    "language.english": "English",
    "language.portuguese": "Português",
    "navigation.main": "Navegação principal",
    "navigation.about": "Sobre",
    "navigation.admin": "Administração",
    "navigation.checkingSession": "Verificando sessão...",
    "navigation.login": "Entrar",
    "navigation.dashboard": "Painel inicial",
    "navigation.studies": "Meus estudos",
    "navigation.account": "Minha conta",
    "navigation.comingSoon": "Em breve",
    "navigation.teacherArea": "Área do professor",
    "navigation.myTeachers": "Meus professores",
    "navigation.openMenu": "Abrir menu",
    "navigation.closeMenu": "Fechar menu",
    "navigation.authenticatedArea": "Área autenticada",
    "footer.tagline": "Aprender. Ensinar. Evoluir.",
    "auth.logout": "Sair",
  },
} as const satisfies Record<AppLocale, Record<string, string>>;

export function translate(locale: string | undefined, key: TranslationKey): string {
  const normalizedLocale: AppLocale = locale === "pt-BR" ? "pt-BR" : "en";
  return translations[normalizedLocale][key];
}
