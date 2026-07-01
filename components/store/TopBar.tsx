"use client";

import type { HomeConfig } from "@/types/shop";
import { toSafeHtml } from "@/lib/sanitize";

interface Props {
  config: HomeConfig;
}

const escText = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default function TopBar({ config }: Props) {
  if (!config.topBar.visible) return null;

  const { discounts, topBar } = config;
  const topBarCode = discounts?.codes?.[discounts?.topBarCodeIndex ?? 0];
  // Merchant-authored: sanitize the banner text and escape the code (both reach
  // dangerouslySetInnerHTML). Discount % is coerced to a number.
  const codeText = topBarCode
    ? ` · Użyj kodu <strong>${escText(String(topBarCode.code ?? ""))}</strong> i zyskaj ${Number(topBarCode.discount) || 0}% rabatu`
    : "";
  const html = toSafeHtml(topBar.text) + codeText;

  return (
    <div className="bg-ink text-on-ink text-center py-2.5 px-4">
      <p
        className="text-xs tracking-[0.2em] uppercase font-light"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
