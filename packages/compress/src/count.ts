/**
 * Cheap, stable token estimator. Not a replacement for a real tokenizer,
 * but consistent enough to compare compressed vs expanded output.
 * Approximates the ~4-chars-per-token rule while counting whitespace-separated
 * words with a floor of 1 token per word.
 */
export function countTokens(text: string): number {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const chars = text.length;
  return Math.max(words, Math.round(chars / 4));
}
