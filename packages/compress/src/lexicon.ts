import lex from './lexicon.json' with { type: 'json' };
import type { Intensity } from './types.js';

type LexiconJSON = typeof lex;

export const lexicon = lex as LexiconJSON;

export function fillersFor(i: Intensity): string[] {
  return lexicon.fillers[i];
}
export function articlesFor(i: Intensity): string[] {
  return lexicon.articles[i];
}
export function hedgesFor(i: Intensity): string[] {
  return lexicon.hedges[i];
}
export function pleasantriesFor(i: Intensity): string[] {
  return lexicon.pleasantries[i];
}
export function abbreviationsFor(i: Intensity): Record<string, string> {
  return lexicon.abbreviations[i] as Record<string, string>;
}
export function expansions(): Record<string, string> {
  return lexicon.expansions as Record<string, string>;
}
