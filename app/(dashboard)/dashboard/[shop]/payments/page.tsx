import { db } from "@/lib/db";
import { shopConfig } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import { DEFAULT_CHECKOUT } from "@/lib/shop";
import type { CheckoutConfig } from "@/types/shop";
import { loadTpayRow, type TpaySettings } from "@/lib/tpay";
import { secretBoxConfigured } from "@/lib/secret-box";
import PaymentsForm from "./PaymentsForm";
import type { TpayState } from "./TpayCard";

export default async function PaymentsPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: shopSlug } = await params;
  let initialConfig: CheckoutConfig = DEFAULT_CHECKOUT;
  let tpay: TpayState = {
    connected: false,
    enabled: false,
    clientId: null,
    secretHint: null,
    sandbox: false,
    connectedAt: null,
    lastNotificationAt: null,
    encryptionReady: secretBoxConfigured(),
  };

  const access = await getShopAccess(shopSlug);
  if (access) {
    const row = await db.query.shopConfig.findFirst({
      where: and(eq(shopConfig.shopId, access.shopId), eq(shopConfig.key, "checkout")),
    });
    if (row?.value) {
      initialConfig = { ...DEFAULT_CHECKOUT, ...(row.value as Partial<CheckoutConfig>) };
    }
    const tpayRow = await loadTpayRow(access.shopId);
    const s = (tpayRow?.settings ?? {}) as TpaySettings;
    tpay = {
      ...tpay,
      connected: Boolean(s.clientId && s.secretEnc),
      enabled: tpayRow?.enabled ?? false,
      clientId: s.clientId ?? null,
      secretHint: tpayRow?.tokenHint ?? null,
      sandbox: Boolean(s.sandbox),
      connectedAt: tpayRow?.tokenCreatedAt?.toISOString() ?? null,
      lastNotificationAt: tpayRow?.lastPushAt?.toISOString() ?? null,
    };
  }

  return <PaymentsForm shopSlug={shopSlug} initialConfig={initialConfig} initialTpay={tpay} />;
}
