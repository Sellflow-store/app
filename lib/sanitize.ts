// Minimal HTML sanitizer for merchant-authored rich text (product descriptions,
// later blog content). The content comes from the shop owner editing their own
// shop, so the threat model is limited — but we still strip anything that could
// execute script or break out of the intended formatting before rendering it
// with dangerouslySetInnerHTML on the public storefront.
//
// Allowlist approach: keep a small set of formatting tags + safe <a> links,
// drop every other tag (keeping its text), and remove all event-handler and
// style attributes.

const ALLOWED_TAGS = new Set([
  "p", "br", "b", "strong", "i", "em", "u", "s", "strike",
  "ul", "ol", "li", "a", "h3", "h4", "blockquote", "span", "div",
]);

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

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";

  let out = html;

  // Drop dangerous element blocks entirely (including their content).
  out = out.replace(/<(script|style|iframe|object|embed|form|input|textarea|svg)[\s\S]*?<\/\1\s*>/gi, "");
  out = out.replace(/<(script|style|iframe|object|embed|form|input|textarea|svg)\b[^>]*\/?>/gi, "");

  // Walk every remaining tag; keep allowed ones with a scrubbed attribute set.
  out = out.replace(/<(\/?)([a-zA-Z0-9]+)((?:[^>"']|"[^"]*"|'[^']*')*)>/g, (match, slash, rawName, rawAttrs) => {
    const name = rawName.toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return ""; // strip disallowed tag, keep inner text

    if (slash) return `</${name}>`;

    if (name === "a") {
      const hrefMatch = /\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(rawAttrs);
      const href = (hrefMatch?.[2] ?? hrefMatch?.[3] ?? hrefMatch?.[4] ?? "").trim();
      const safe = /^(https?:|mailto:|tel:|\/)/i.test(href) && !/^javascript:/i.test(href);
      if (!safe) return "<a>";
      const esc = href.replace(/"/g, "&quot;");
      return `<a href="${esc}" target="_blank" rel="noopener noreferrer nofollow">`;
    }

    // Any other allowed tag: emit it with no attributes at all (drops on*, style, class…).
    return `<${name}>`;
  });

  return out;
}
