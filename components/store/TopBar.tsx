"use client";

import type { HomeConfig } from "@/types/shop";

interface Props {
  config: HomeConfig;
}

export default function TopBar({ config }: Props) {
  if (!config.topBar.visible) return null;

  const { discounts, topBar } = config;
  const topBarCode = discounts?.codes?.[discounts?.topBarCodeIndex ?? 0];
  const codeText = topBarCode
    ? ` · Użyj kodu <strong>${topBarCode.code}</strong> i zyskaj ${topBarCode.discount}% rabatu`
    : "";

  return (
    <div className="bg-ink text-on-ink text-center py-2.5 px-4">
      <p
        className="text-xs tracking-[0.2em] uppercase font-light"
        dangerouslySetInnerHTML={{ __html: topBar.text + codeText }}
      />
    </div>
  );
}
