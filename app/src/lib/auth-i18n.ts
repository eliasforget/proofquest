import type { Locale } from "@/lib/i18n";

const copy = {
  fr: {
    signIn: "Continuer avec GitHub",
    signOut: "Se déconnecter",
    myRepos: "Mes dépôts",
    myProgress: "Ma progression",
    loginTitle: "Connectez votre identité GitHub.",
    loginBody: "ProofQuest utilisera votre compte pour retrouver vos dépôts publics et construire votre profil de progression.",
    authErrorTitle: "Connexion GitHub interrompue",
    authErrorBody: "La session n'a pas pu être créée. Vérifiez la configuration OAuth puis réessayez.",
    onboardingTitle: "Choisissez votre prochain terrain de jeu.",
    onboardingIntro: "Vos dépôts publics GitHub sont prêts à être analysés. Rien n'est modifié sur GitHub.",
    search: "Rechercher un dépôt…",
    analyze: "Analyser",
    empty: "Aucun dépôt public ne correspond à cette recherche.",
    publicProfile: "Profil public",
    privateProfile: "Profil privé",
    publish: "Rendre public",
    hide: "Rendre privé",
    recentQuests: "Quêtes vérifiées",
    noHistory: "Aucune quête cloud vérifiée pour le moment.",
    backHome: "Accueil",
  },
  en: {
    signIn: "Continue with GitHub", signOut: "Sign out", myRepos: "My repositories", myProgress: "My progress",
    loginTitle: "Connect your GitHub identity.", loginBody: "ProofQuest uses your account to find your public repositories and build your progression profile.",
    authErrorTitle: "GitHub sign-in interrupted", authErrorBody: "The session could not be created. Check OAuth configuration and try again.",
    onboardingTitle: "Choose your next playground.", onboardingIntro: "Your public GitHub repositories are ready to analyze. ProofQuest never modifies them.",
    search: "Search repositories…", analyze: "Analyze", empty: "No public repository matches this search.",
    publicProfile: "Public profile", privateProfile: "Private profile", publish: "Make public", hide: "Make private",
    recentQuests: "Verified quests", noHistory: "No verified cloud quest yet.", backHome: "Home",
  },
  de: {
    signIn: "Mit GitHub fortfahren", signOut: "Abmelden", myRepos: "Meine Repositories", myProgress: "Mein Fortschritt",
    loginTitle: "GitHub-Identität verbinden.", loginBody: "ProofQuest nutzt Ihr Konto, um öffentliche Repositories zu finden und Ihr Fortschrittsprofil aufzubauen.",
    authErrorTitle: "GitHub-Anmeldung unterbrochen", authErrorBody: "Die Sitzung konnte nicht erstellt werden. OAuth-Konfiguration prüfen und erneut versuchen.",
    onboardingTitle: "Wählen Sie Ihr nächstes Spielfeld.", onboardingIntro: "Ihre öffentlichen GitHub-Repositories können analysiert werden. ProofQuest verändert sie nicht.",
    search: "Repository suchen…", analyze: "Analysieren", empty: "Kein öffentliches Repository passt zur Suche.",
    publicProfile: "Öffentliches Profil", privateProfile: "Privates Profil", publish: "Veröffentlichen", hide: "Privat machen",
    recentQuests: "Verifizierte Quests", noHistory: "Noch keine verifizierte Cloud-Quest.", backHome: "Startseite",
  },
  es: {
    signIn: "Continuar con GitHub", signOut: "Cerrar sesión", myRepos: "Mis repositorios", myProgress: "Mi progreso",
    loginTitle: "Conecte su identidad de GitHub.", loginBody: "ProofQuest usa su cuenta para encontrar repositorios públicos y construir su perfil de progreso.",
    authErrorTitle: "Inicio de sesión de GitHub interrumpido", authErrorBody: "No se pudo crear la sesión. Revise OAuth y vuelva a intentarlo.",
    onboardingTitle: "Elija su próximo terreno de juego.", onboardingIntro: "Sus repositorios públicos de GitHub están listos para analizar. ProofQuest no los modifica.",
    search: "Buscar repositorios…", analyze: "Analizar", empty: "Ningún repositorio público coincide con la búsqueda.",
    publicProfile: "Perfil público", privateProfile: "Perfil privado", publish: "Hacer público", hide: "Hacer privado",
    recentQuests: "Misiones verificadas", noHistory: "Todavía no hay misiones verificadas en la nube.", backHome: "Inicio",
  },
} as const;

export function getAuthCopy(locale: Locale) {
  return copy[locale];
}
