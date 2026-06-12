interface OrderItem {
  name: string;
  price: string;
  qty: number;
}

interface OrderSummary {
  orderNumber: string;
  items: OrderItem[];
  subtotal: string;
  shippingCost: string;
  codFee: string | null;
  discountAmount?: string | null;
  discountCode?: string | null;
  total: string;
}

interface TransferDetails {
  bankAccount: string;
  accountOwner: string;
  title: string;
}

const pln = (v: string | number) =>
  `${(typeof v === "string" ? parseFloat(v) : v).toFixed(2).replace(".", ",")} zł`;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* Shared shell — table layout + inline styles for email-client compatibility */
function shell(shopName: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="pl">
<body style="margin:0;padding:0;background:#f5f5f4;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="background:#16161d;padding:20px 32px;">
            <span style="color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:0.02em;">${esc(shopName)}</span>
          </td>
        </tr>
        <tr><td style="padding:32px;">${body}</td></tr>
        <tr>
          <td style="padding:16px 32px 28px;border-top:1px solid #eeeeee;">
            <p style="margin:0;font-size:11px;color:#999999;">Wiadomość wysłana automatycznie — prosimy na nią nie odpowiadać.<br>Sklep działa na platformie Sellflow.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function itemsTable(order: OrderSummary): string {
  const rows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;font-size:13px;color:#444444;border-bottom:1px solid #f0f0f0;">${esc(i.name)} <span style="color:#999999;">×${i.qty}</span></td>
        <td align="right" style="padding:8px 0;font-size:13px;color:#222222;border-bottom:1px solid #f0f0f0;white-space:nowrap;">${pln(parseFloat(i.price) * i.qty)}</td>
      </tr>`
    )
    .join("");

  const codRow = order.codFee
    ? `<tr><td style="padding:6px 0;font-size:13px;color:#666666;">Pobranie</td><td align="right" style="padding:6px 0;font-size:13px;color:#222222;">${pln(order.codFee)}</td></tr>`
    : "";

  const discountRow = order.discountAmount
    ? `<tr><td style="padding:6px 0;font-size:13px;color:#666666;">Rabat${order.discountCode ? ` (${esc(order.discountCode)})` : ""}</td><td align="right" style="padding:6px 0;font-size:13px;color:#0d7a4f;">−${pln(order.discountAmount)}</td></tr>`
    : "";

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
    ${rows}
    <tr><td style="padding:10px 0 6px;font-size:13px;color:#666666;">Produkty</td><td align="right" style="padding:10px 0 6px;font-size:13px;color:#222222;">${pln(order.subtotal)}</td></tr>
    ${discountRow}
    <tr><td style="padding:6px 0;font-size:13px;color:#666666;">Dostawa</td><td align="right" style="padding:6px 0;font-size:13px;color:#222222;">${pln(order.shippingCost)}</td></tr>
    ${codRow}
    <tr><td style="padding:12px 0 0;font-size:15px;font-weight:bold;color:#111111;border-top:2px solid #16161d;">Razem</td><td align="right" style="padding:12px 0 0;font-size:15px;font-weight:bold;color:#111111;border-top:2px solid #16161d;">${pln(order.total)}</td></tr>
  </table>`;
}

export function orderConfirmationEmail(params: {
  shopName: string;
  customerName: string;
  order: OrderSummary;
  paymentMethod: "transfer" | "cod";
  transfer: TransferDetails | null;
}): { subject: string; html: string } {
  const { shopName, customerName, order, paymentMethod, transfer } = params;

  const paymentBlock =
    paymentMethod === "transfer" && transfer
      ? `<div style="background:#f8f8f7;border-radius:12px;padding:20px;margin:20px 0;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:bold;color:#111111;">Dane do przelewu</p>
          <p style="margin:0 0 4px;font-size:13px;color:#444444;">Odbiorca: <strong>${esc(transfer.accountOwner || shopName)}</strong></p>
          <p style="margin:0 0 4px;font-size:13px;color:#444444;">Nr konta: <strong>${esc(transfer.bankAccount || "—")}</strong></p>
          <p style="margin:0 0 4px;font-size:13px;color:#444444;">Tytuł: <strong>${esc(transfer.title)}</strong></p>
          <p style="margin:0;font-size:13px;color:#444444;">Kwota: <strong>${pln(order.total)}</strong></p>
          <p style="margin:12px 0 0;font-size:12px;color:#888888;">Zamówienie zrealizujemy po zaksięgowaniu wpłaty.</p>
        </div>`
      : `<div style="background:#f8f8f7;border-radius:12px;padding:20px;margin:20px 0;">
          <p style="margin:0;font-size:13px;color:#444444;">Płatność przy odbiorze: <strong>${pln(order.total)}</strong> — przygotuj gotówkę lub kartę dla kuriera.</p>
        </div>`;

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;color:#111111;">Dziękujemy za zamówienie!</h1>
    <p style="margin:0 0 4px;font-size:14px;color:#444444;">Cześć ${esc(customerName)},</p>
    <p style="margin:0 0 16px;font-size:14px;color:#444444;">przyjęliśmy Twoje zamówienie <strong>${esc(order.orderNumber)}</strong>. Poniżej podsumowanie:</p>
    ${itemsTable(order)}
    ${paymentBlock}
    <p style="margin:16px 0 0;font-size:13px;color:#666666;">Damy Ci znać, gdy paczka będzie w drodze.</p>`;

  return {
    subject: `Potwierdzenie zamówienia ${order.orderNumber} — ${shopName}`,
    html: shell(shopName, body),
  };
}

export function merchantNewOrderEmail(params: {
  shopName: string;
  order: OrderSummary;
  customerName: string;
  customerEmail: string;
  paymentMethod: "transfer" | "cod";
  orderUrl: string;
}): { subject: string; html: string } {
  const { shopName, order, customerName, customerEmail, paymentMethod, orderUrl } = params;
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;color:#111111;">Nowe zamówienie ${esc(order.orderNumber)} 🎉</h1>
    <p style="margin:0 0 16px;font-size:14px;color:#444444;">
      ${esc(customerName)} (${esc(customerEmail)}) złożył(a) zamówienie na
      <strong>${pln(order.total)}</strong> — płatność: ${paymentMethod === "transfer" ? "przelew" : "za pobraniem"}.
    </p>
    ${itemsTable(order)}
    <p style="margin:20px 0 0;">
      <a href="${orderUrl}" style="display:inline-block;background:#d6009f;color:#ffffff;font-size:13px;font-weight:bold;padding:12px 24px;border-radius:99px;text-decoration:none;">Zobacz zamówienie w panelu</a>
    </p>`;

  return {
    subject: `Nowe zamówienie ${order.orderNumber} (${pln(order.total)}) — ${shopName}`,
    html: shell(shopName, body),
  };
}

export function orderShippedEmail(params: {
  shopName: string;
  customerName: string;
  orderNumber: string;
}): { subject: string; html: string } {
  const { shopName, customerName, orderNumber } = params;
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;color:#111111;">Twoja paczka jest w drodze 📦</h1>
    <p style="margin:0 0 8px;font-size:14px;color:#444444;">Cześć ${esc(customerName)},</p>
    <p style="margin:0;font-size:14px;color:#444444;">zamówienie <strong>${esc(orderNumber)}</strong> zostało wysłane. Spodziewaj się dostawy w najbliższych dniach.</p>`;

  return {
    subject: `Zamówienie ${orderNumber} wysłane — ${shopName}`,
    html: shell(shopName, body),
  };
}
