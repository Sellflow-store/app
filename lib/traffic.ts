// Traffic classification for storefront visits.
//
// We classify each pageview by its referrer into a coarse `source`
// (direct | ai | search | social | referral) and, when it comes from an AI
// assistant, a finer `aiSource` (chatgpt | claude | perplexity | gemini |
// copilot | other). AI-assistant crawlers that fetch the page server-side are
// also recognised from the User-Agent so bot traffic still shows up.

export type TrafficSource = "direct" | "ai" | "search" | "social" | "referral";
export type AiSource =
  | "chatgpt"
  | "claude"
  | "perplexity"
  | "gemini"
  | "copilot"
  | "other";

export interface Classification {
  source: TrafficSource;
  aiSource: AiSource | null;
  referrerHost: string | null;
}

// host substring → aiSource. Matched against the referrer hostname.
const AI_HOSTS: [string, AiSource][] = [
  ["chatgpt.com", "chatgpt"],
  ["chat.openai.com", "chatgpt"],
  ["openai.com", "chatgpt"],
  ["oai.", "chatgpt"],
  ["claude.ai", "claude"],
  ["anthropic.com", "claude"],
  ["perplexity.ai", "perplexity"],
  ["pplx.ai", "perplexity"],
  ["gemini.google.com", "gemini"],
  ["bard.google.com", "gemini"],
  ["copilot.microsoft.com", "copilot"],
  ["m365.cloud.microsoft", "copilot"],
];

// AI crawler/user-agent fragments → aiSource (case-insensitive).
const AI_USER_AGENTS: [string, AiSource][] = [
  ["gptbot", "chatgpt"],
  ["oai-searchbot", "chatgpt"],
  ["chatgpt-user", "chatgpt"],
  ["claudebot", "claude"],
  ["claude-web", "claude"],
  ["anthropic-ai", "claude"],
  ["perplexitybot", "perplexity"],
  ["perplexity-user", "perplexity"],
  ["google-extended", "gemini"],
  ["gemini", "gemini"],
  ["bingbot", "copilot"],
];

const SEARCH_HOSTS = [
  "google.",
  "bing.com",
  "duckduckgo.com",
  "yahoo.",
  "yandex.",
  "ecosia.org",
  "baidu.com",
  "search.brave.com",
];

const SOCIAL_HOSTS = [
  "facebook.com",
  "fb.com",
  "instagram.com",
  "l.instagram.com",
  "tiktok.com",
  "t.co",
  "twitter.com",
  "x.com",
  "youtube.com",
  "youtu.be",
  "linkedin.com",
  "lnkd.in",
  "pinterest.com",
  "reddit.com",
  "t.me",
  "wa.me",
  "snapchat.com",
];

/** Extract a bare hostname from a raw referrer string. Returns null if empty/invalid. */
export function referrerHost(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    return host.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

/** Detect an AI assistant from a User-Agent header (server-side crawlers). */
export function aiFromUserAgent(userAgent: string | null | undefined): AiSource | null {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();
  for (const [needle, ai] of AI_USER_AGENTS) {
    if (ua.includes(needle)) return ai;
  }
  return null;
}

/**
 * Classify a visit from its referrer and (optionally) the request User-Agent.
 * The referrer wins for human click-throughs; the UA catches AI crawlers that
 * arrive with no referrer.
 */
export function classifyVisit(
  referrer: string | null | undefined,
  ownHost: string | null | undefined,
  userAgent?: string | null
): Classification {
  const host = referrerHost(referrer);

  // Same-site navigation counts as direct (don't pollute referral with self).
  const isSelf =
    host && ownHost ? host === ownHost.replace(/^www\./, "").toLowerCase() : false;

  if (host && !isSelf) {
    for (const [needle, ai] of AI_HOSTS) {
      if (host.includes(needle)) return { source: "ai", aiSource: ai, referrerHost: host };
    }
    if (SEARCH_HOSTS.some((h) => host.includes(h)))
      return { source: "search", aiSource: null, referrerHost: host };
    if (SOCIAL_HOSTS.some((h) => host.includes(h)))
      return { source: "social", aiSource: null, referrerHost: host };
    return { source: "referral", aiSource: null, referrerHost: host };
  }

  // No usable referrer — last chance: an AI crawler identified by UA.
  const uaAi = aiFromUserAgent(userAgent);
  if (uaAi) return { source: "ai", aiSource: uaAi, referrerHost: host };

  return { source: "direct", aiSource: null, referrerHost: host };
}

/** Human-readable label for a source (Polish, for the dashboard). */
export const SOURCE_LABELS: Record<TrafficSource, string> = {
  direct: "Bezpośrednie",
  ai: "Asystenci AI",
  search: "Wyszukiwarki",
  social: "Social media",
  referral: "Odesłania",
};

export const AI_LABELS: Record<AiSource, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  perplexity: "Perplexity",
  gemini: "Gemini",
  copilot: "Copilot",
  other: "Inne AI",
};
