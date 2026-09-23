import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getLocale } from "@/lib/locale-server";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const meta = {
    fr: { title: "ProofQuest — Transformez votre code en preuves", description: "Transformer les preuves d'un dépôt en graphe de compétences vivant." },
    en: { title: "ProofQuest — Turn your code into proof", description: "Map repository evidence into a living developer skill graph." },
    de: { title: "ProofQuest — Code in Nachweise verwandeln", description: "Repository-Nachweise in einen lebendigen Skill-Graphen verwandeln." },
    es: { title: "ProofQuest — Convierte tu código en pruebas", description: "Transforma evidencias del repositorio en un grafo vivo de habilidades." },
  }[locale];
  return meta;
}

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const locale = await getLocale();
  return <html lang={locale} suppressHydrationWarning><body>{children}</body></html>;
}
