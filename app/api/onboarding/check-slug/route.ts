import { NextRequest, NextResponse } from "next/server";
import { SLUG_RE, findFreeSlug } from "@/lib/slug";

/**
 * Public availability check for the wizard's name step. Returns the first
 * free variant as `suggestion` when the requested slug is taken — the same
 * algorithm POST /api/onboarding uses, so the hint matches what the user
 * would actually get.
 */
export async function GET(req: NextRequest) {
  const slug = (req.nextUrl.searchParams.get("slug") ?? "").trim().toLowerCase();

  if (!SLUG_RE.test(slug)) {
    return NextResponse.json({ slug, valid: false, available: false, suggestion: null });
  }

  const free = await findFreeSlug(slug);
  return NextResponse.json({
    slug,
    valid: true,
    available: free === slug,
    suggestion: free === slug ? null : free,
  });
}
