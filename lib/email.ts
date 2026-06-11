import { Resend } from "resend";

let client: Resend | null = null;

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

// Without a verified domain Resend only delivers from onboarding@resend.dev
// (and only to the account owner's inbox) — set RESEND_FROM after DNS setup.
const FROM = process.env.RESEND_FROM ?? "Sellflow <onboarding@resend.dev>";

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.log(`[email pominięty — brak RESEND_API_KEY] "${params.subject}" → ${params.to}`);
    return false;
  }
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      replyTo: params.replyTo,
    });
    if (error) {
      console.error("Resend error:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Email send failed:", e);
    return false;
  }
}
