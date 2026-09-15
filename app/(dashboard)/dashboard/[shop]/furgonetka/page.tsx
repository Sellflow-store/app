import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { shopConfig, shopIntegrations } from "@/lib/db/schema";
import { getShopAccess } from "@/lib/api";
import { FURGONETKA_PROVIDER } from "@/lib/furgonetka-access";
import { normalizeDeliveryConfig } from "@/lib/shop";
import type { DeliveryConfig } from "@/types/shop";
import FurgonetkaForm, { type IntegrationState } from "./FurgonetkaForm";

export default async function FurgonetkaPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: shopSlug } = await params;
  const access = await getShopAccess(shopSlug);
  if (!access) notFound();

  const [row, configRow] = await Promise.all([
    db.query.shopIntegrations.findFirst({
      where: and(
        eq(shopIntegrations.shopId, access.shopId),
        eq(shopIntegrations.provider, FURGONETKA_PROVIDER),
      ),
    }),
    db.query.shopConfig.findFirst({
      where: and(eq(shopConfig.shopId, access.shopId), eq(shopConfig.key, "delivery")),
    }),
  ]);

  const delivery = normalizeDeliveryConfig(configRow?.value as Partial<DeliveryConfig> | undefined);
  const settings = (row?.settings ?? {}) as { serviceByMethod?: Record<string, string> };

  const state: IntegrationState = {
    connected: Boolean(row?.tokenHash),
    enabled: row?.enabled ?? false,
    tokenHint: row?.tokenHint ?? null,
    lastPullAt: row?.lastPullAt?.toISOString() ?? null,
    lastPullCount: row?.lastPullCount ?? null,
    lastPushAt: row?.lastPushAt?.toISOString() ?? null,
    serviceByMethod: settings.serviceByMethod ?? {},
  };

  // Adres, który merchant wkleja w Furgonetce. Celowo na domenie platformy,
  // a nie na sklepie: subdomena i własna domena klienta potrafią się zmienić,
  // a wtedy integracja przestałaby działać bez żadnego komunikatu.
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    `https://${process.env.NEXT_PUBLIC_APP_SUBDOMAIN || "app"}.${
      process.env.NEXT_PUBLIC_APP_DOMAIN ?? "sell-flow.store"
    }`;

  return (
    <FurgonetkaForm
      shopSlug={shopSlug}
      initialState={state}
      baseUrl={`${appUrl.replace(/\/$/, "")}/api/furgonetka/${shopSlug}`}
      methods={delivery.methods
        .filter((m) => m.enabled && m.kind !== "pickup")
        .map((m) => ({ id: m.id, label: m.label, kind: m.kind }))}
    />
  );
}
