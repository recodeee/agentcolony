export type SegmentKind =
  | 'fence'
  | 'inline-code'
  | 'url'
  | 'path'
  | 'command'
  | 'version'
  | 'date'
  | 'number'
  | 'identifier'
  | 'heading'
  | 'prose'
  | 'newline';

export interface Segment {
  kind: SegmentKind;
  text: string;
  preserved: boolean;
}

const FENCE_RE = /```[\s\S]*?```|~~~[\s\S]*?~~~/g;
const INLINE_CODE_RE = /`[^`\n]+`/g;
const URL_RE = /\bhttps?:\/\/[^\s)\]]+/g;
const PATH_RE = /(?:(?:\.{1,2})?\/[\w.\-_/]+|~\/[\w.\-_/]+|[A-Z]:\\[\w.\-\\]+)/g;
const VERSION_RE = /\bv?\d+\.\d+(?:\.\d+)?(?:[-+][\w.]+)?\b/g;
const ISO_DATE_RE = /\b\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}(?::\d{2})?)?\b/g;
const NUMBER_RE = /\b\d+(?:\.\d+)?\b/g;
// identifier heuristic: snake_case, kebab-case, camelCase, PascalCase with at least one boundary char
const IDENT_RE = /\b[A-Za-z_][A-Za-z0-9_]*[-_][A-Za-z0-9_\-]+\b|\b[a-z]+[A-Z][A-Za-z0-9]*\b/g;
const HEADING_RE = /^(#{1,6})\s.*$/gm;

/**
 * Split text into segments. Preserved segments pass through untouched.
 * Prose segments are the only candidates for compression.
 */
export function tokenize(input: string): Segment[] {
  const holders: Array<{ kind: SegmentKind; text: string }> = [];
  let working = input;

  const protect = (re: RegExp, kind: SegmentKind) => {
    working = working.replace(re, (m) => {
      const token = `\u0000${holders.length}\u0000`;
      holders.push({ kind, text: m });
      return token;
    });
  };

  protect(FENCE_RE, 'fence');
  protect(INLINE_CODE_RE, 'inline-code');
  protect(URL_RE, 'url');
  protect(HEADING_RE, 'heading');
  protect(PATH_RE, 'path');
  protect(ISO_DATE_RE, 'date');
  protect(VERSION_RE, 'version');
  protect(IDENT_RE, 'identifier');
  protect(NUMBER_RE, 'number');

  const parts = working.split(/(\u0000\d+\u0000)/g);
  const out: Segment[] = [];
  for (const part of parts) {
    if (!part) continue;
    const m = /^\u0000(\d+)\u0000$/.exec(part);
    if (m && m[1] !== undefined) {
      const idx = Number(m[1]);
      const h = holders[idx];
      if (h) {
        out.push({ kind: h.kind, text: h.text, preserved: true });
        continue;
      }
    }
    if (part.length) out.push({ kind: 'prose', text: part, preserved: false });
  }
  return out;
}

export function detokenize(segments: Segment[]): string {
  return segments.map((s) => s.text).join('');
}
