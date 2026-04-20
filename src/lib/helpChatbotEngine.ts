/**
 * Compatibility shim — l'ancien moteur de chatbot a été remplacé par le flow
 * décisionnel statique (`src/lib/help/helpFlow.ts`).
 *
 * Ce fichier expose `STATIC_KNOWLEDGE` à partir du nouveau flow pour que la
 * page `HelpCenter` (FAQ navigable) continue à fonctionner sans modification.
 */
import { HELP_FLOW } from './help/helpFlow';
import type { HelpNode } from './help/helpFlow.types';

export interface StaticKnowledgeEntry {
  id: string;
  category: string;
  question: string;
  answer: string;
  link?: string;
}

/** Extrait le premier lien interne `[LINK:/chemin]` d'une réponse markdown. */
const extractLink = (text: string): string | undefined => {
  const match = text.match(/\[LINK:([^\]]+)\]/);
  return match ? match[1].trim() : undefined;
};

/** Nettoie le marqueur LINK du corps de la réponse. */
const stripLink = (text: string): string =>
  text.replace(/\[LINK:[^\]]+\]/g, '').trim();

/**
 * Aplatit le flow en une liste de "questions / réponses" indexables par
 * catégorie pour alimenter la FAQ.
 */
const flatten = (
  node: HelpNode,
  category: string | null = null,
): StaticKnowledgeEntry[] => {
  const entries: StaticKnowledgeEntry[] = [];
  const currentCategory = category ?? node.label;

  if (node.answer && node.id !== 'root') {
    entries.push({
      id: node.id,
      category: currentCategory,
      question: node.label,
      answer: stripLink(node.answer),
      link: extractLink(node.answer),
    });
  }

  if (node.children) {
    for (const child of node.children) {
      // Les enfants directs de la racine définissent une nouvelle catégorie
      const nextCategory = node.id === 'root' ? child.label : currentCategory;
      entries.push(...flatten(child, nextCategory));
    }
  }

  return entries;
};

export const STATIC_KNOWLEDGE: StaticKnowledgeEntry[] = flatten(HELP_FLOW);
