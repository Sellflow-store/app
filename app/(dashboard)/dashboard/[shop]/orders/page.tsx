import OrdersTable, { type Order } from "./OrdersTable";

// Static mock — replace with DB query once DATABASE_URL is set
const MOCK_ORDERS: Order[] = [
  { id: "ORD-0042", customer: "Marta Kowalska",    email: "marta@example.com",       total: "189,00 zł", status: "new",       date: "21.05.2026" },
  { id: "ORD-0041", customer: "Tomasz Wiśniewski", email: "t.wisniewski@gmail.com",   total: "349,50 zł", status: "paid",      date: "20.05.2026" },
  { id: "ORD-0040", customer: "Anna Nowak",         email: "anna.nowak@wp.pl",         total: "98,00 zł",  status: "shipped",   date: "19.05.2026" },
  { id: "ORD-0039", customer: "Piotr Zając",        email: "pzajac@outlook.com",       total: "559,00 zł", status: "delivered", date: "17.05.2026" },
  { id: "ORD-0038", customer: "Karolina Dąbrowska", email: "karo@example.pl",          total: "210,00 zł", status: "cancelled", date: "15.05.2026" },
];

export default function OrdersPage() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
          >
            Zamówienia
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0 0)" }}>
            {MOCK_ORDERS.length} zamówień łącznie
          </p>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "oklch(92% 0 0)" }}>
          {["Wszystkie", "Nowe", "Opłacone", "Wysłane"].map((label, i) => (
            <button
              key={label}
              className="px-3 py-1.5 rounded-md text-xs font-medium"
              style={
                i === 0
                  ? { background: "#fff", color: "oklch(11% 0.10 275)", boxShadow: "0 1px 3px oklch(0% 0 0 / 0.08)" }
                  : { color: "oklch(45% 0 0)" }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid oklch(90% 0 0)", background: "#fff" }}
      >
        <OrdersTable orders={MOCK_ORDERS} />
      </div>
    </div>
  );
}
