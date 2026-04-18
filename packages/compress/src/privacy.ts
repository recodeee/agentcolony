const PRIVATE_RE = /<private>[\s\S]*?<\/private>/gi;

/**
 * Strip anything wrapped in <private>…</private>. Applied before compression
 * and before any I/O to storage or logs. Unmatched opening tags are dropped
 * to the end of input to be safe.
 */
export function redactPrivate(input: string): string {
  const closed = input.replace(PRIVATE_RE, '');
  // Safety: if an unclosed <private> remains, redact from it to end-of-input.
  const idx = closed.search(/<private>/i);
  if (idx >= 0) return closed.slice(0, idx);
  return closed;
}
