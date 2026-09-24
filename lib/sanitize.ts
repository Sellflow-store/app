// Minimal HTML sanitizer for merchant-authored rich text (product descriptions,
// later blog content). The content comes from the shop owner editing their own
// shop, but a merchant is still an untrusted party for everyone else who views
// the page (shoppers, other merchants, platform admins), so nothing that could
// execute script may survive rendering with dangerouslySetInnerHTML.
//
// Allowlist approach: keep a small set of formatting tags + safe <a> links,
// drop every other tag (keeping its text), and remove all event-handler and
// style attributes.

const ALLOWED_TAGS = new Set([
  "p", "br", "b", "strong", "i", "em", "u", "s", "strike",
  "ul", "ol", "li", "a", "h3", "h4", "blockquote", "span", "div",
]);

/**
 * Goły tekst z HTML-a — do meta description i danych strukturalnych, gdzie
 * znaczniki są śmieciem. Encje zamieniane na znaki, białe znaki zwijane.
 */
export function stripHtml(html: string | null | undefined, maxLen = 300): string | undefined {
  if (!html) return undefined;
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return undefined;
  return text.length > maxLen ? `${text.slice(0, maxLen - 1).trimEnd()}…` : text;
}

/** True when the HTML carries no visible text (empty editor state). */
export function htmlIsEmpty(html: string | null | undefined): boolean {
  if (!html) return true;
  const text = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length === 0;
}

const HTML_TAG_RE = /<\/?(p|br|ul|ol|li|b|strong|i|em|u|s|a|h3|h4|blockquote|div|span)\b/i;

function escapeText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Render merchant text safely as HTML. New content from the rich-text editor is
 * already HTML and gets sanitized; legacy plain-text descriptions (no tags) are
 * escaped and their line breaks preserved, so nothing that predates the editor
 * loses its formatting.
 */
export function toSafeHtml(raw: string | null | undefined): string {
  if (htmlIsEmpty(raw)) return "";
  if (HTML_TAG_RE.test(raw as string)) return sanitizeHtml(raw);
  return escapeText(raw as string).replace(/\r?\n/g, "<br>");
}

// A complete, well-formed tag starting at the current position (sticky).
const TAG_AT_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/y;
const COMMENT_AT_RE = /<!--[\s\S]*?(?:-->|$)/y;
const ENTITY_AT_RE = /&(?:#\d{1,7}|#x[0-9a-fA-F]{1,6}|[a-zA-Z][a-zA-Z0-9]{1,31});/y;

/**
 * Safe by construction: the output is rebuilt token by token, and the only "<"
 * characters in it come from tags this function emits itself (allowlisted
 * name, no attributes except a vetted href). Anything the tokenizer does not
 * recognise as a complete tag (unbalanced quotes, stray "<", malformed markup)
 * is emitted as escaped text, so a parser quirk can only ever make content
 * look wrong, never make it executable.
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";

  // Drop dangerous element blocks entirely, including their content (their
  // bare tags are dropped by the allowlist below anyway; this removes the
  // script/style text that would otherwise show up as visible text).
  const input = html.replace(
    /<(script|style|iframe|object|embed|form|textarea|svg|math|template|noscript|title)\b[\s\S]*?<\/\1\s*>/gi,
    "",
  );

  let out = "";
  let i = 0;
  while (i < input.length) {
    const ch = input[i];

    if (ch === "<") {
      COMMENT_AT_RE.lastIndex = i;
      const comment = COMMENT_AT_RE.exec(input);
      if (comment) {
        i += comment[0].length;
        continue;
      }
      TAG_AT_RE.lastIndex = i;
      const tag = TAG_AT_RE.exec(input);
      if (tag) {
        out += renderTag(tag[1] === "/", tag[2].toLowerCase(), tag[3]);
        i += tag[0].length;
        continue;
      }
      out += "&lt;";
      i++;
      continue;
    }

    if (ch === ">") {
      out += "&gt;";
      i++;
      continue;
    }

    if (ch === "&") {
      // Keep real entity references (the editor emits &nbsp; etc.), escape
      // every other ampersand.
      ENTITY_AT_RE.lastIndex = i;
      const entity = ENTITY_AT_RE.exec(input);
      if (entity) {
        out += entity[0];
        i += entity[0].length;
      } else {
        out += "&amp;";
        i++;
      }
      continue;
    }

    out += ch;
    i++;
  }

  return out;
}

function renderTag(closing: boolean, name: string, rawAttrs: string): string {
  if (!ALLOWED_TAGS.has(name)) return ""; // strip disallowed tag, keep inner text
  if (closing) return `</${name}>`;

  if (name === "a") {
    const hrefMatch = /(?:^|\s)href\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/i.exec(rawAttrs);
    const href = (hrefMatch?.[2] ?? hrefMatch?.[3] ?? hrefMatch?.[4] ?? "").trim();
    // Allowlist of schemes; an entity-encoded "javascript:" starts with "&"
    // and fails this test, so it can't sneak through.
    if (!/^(https?:\/\/|mailto:|tel:|\/)/i.test(href)) return "<a>";
    const esc = href
      .replace(/&(?!(?:#\d{1,7}|#x[0-9a-fA-F]{1,6}|[a-zA-Z][a-zA-Z0-9]{1,31});)/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `<a href="${esc}" target="_blank" rel="noopener noreferrer nofollow">`;
  }

  // Any other allowed tag: emit it with no attributes at all (drops on*, style, class…).
  return name === "br" ? "<br>" : `<${name}>`;
}
