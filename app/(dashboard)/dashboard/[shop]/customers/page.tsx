import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import CustomersTable, { type CustomerRow } from "./CustomersTable";

export default async function CustomersPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: shopSlug } = await params;
  let rows: CustomerRow[] = [];

  try {
    const access = await getShopAccess(shopSlug);
    if (access) {
      const dbCustomers = await db
        .select()
        .from(customers)
        .where(eq(customers.shopId, access.shopId))
        .orderBy(desc(customers.createdAt));

      rows = dbCustomers.map((c) => ({
        id: c.id,
        name: c.name ?? "—",
        email: c.email,
        phone: c.phone,
        totalOrders: c.totalOrders,
        totalSpent: c.totalSpent ?? "0",
        createdAt: c.createdAt.toLocaleDateString("pl-PL", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
      }));
    }
  } catch {
    // DB not configured yet — render empty state
  }

  return <CustomersTable customers={rows} />;
}
