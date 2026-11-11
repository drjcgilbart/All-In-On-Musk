export const ADMIN_EMAIL = "admin@allinonmusk.com";
export const CONTACT_EMAIL = "jonvale@allinonmusk.com";
const TO = ADMIN_EMAIL;
const DEFAULT_FROM = "All In On Musk <onboarding@resend.dev>";

export type MembershipMail = {
  name: string;
  email: string;
  phone: string;
  area: string;
};

export type MembershipAck = {
  status: number;
  body: {
    ok?: boolean;
    error?: string;
    mailed: boolean;
    stored: boolean;
    mailDetail: string;
    message?: string;
  };
};

export function membershipFromAddress(env?: { MEMBERSHIP_FROM?: string; ORDER_MAIL_FROM?: string }) {
  const source = env ?? { MEMBERSHIP_FROM: process.env.MEMBERSHIP_FROM, ORDER_MAIL_FROM: process.env.ORDER_MAIL_FROM };
  return source.MEMBERSHIP_FROM?.trim() || source.ORDER_MAIL_FROM?.trim() || DEFAULT_FROM;
}

function esc(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    if (char === "&") return "&amp;";
    if (char === "<") return "&lt;";
    if (char === ">") return "&gt;";
    if (char === '"') return "&quot;";
    return "&#39;";
  });
}

function letter(input: MembershipMail) {
  const lines = [
    "Free membership request for All In On Musk.",
    "",
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone || "(none)"}`,
    `City / area: ${input.area || "(none)"}`,
    "A password was set with this request and is not included in this email.",
    "",
    "Review it on the admin desk after you sign in.",
  ];
  const text = lines.join("\n");
  const html = `<p>Free membership request for All In On Musk.</p><ul><li>Name: ${esc(input.name)}</li><li>Email: ${esc(input.email)}</li><li>Phone: ${esc(input.phone || "(none)")}</li><li>City / area: ${esc(input.area || "(none)")}</li></ul><p>A password was set with this request and is not included in this email.</p>`;
  return { subject: `Free membership request from ${input.name}`, text, html };
}

function clientMailDetail(detail: string, ok: boolean) {
  if (ok) return detail.slice(0, 180);
  if (/activat/i.test(detail)) return detail.slice(0, 180);
  return "Email did not send.";
}

export function membershipAck(input: { mailOk: boolean; stored: boolean; mailDetail: string }): MembershipAck {
  const mailDetail = clientMailDetail(input.mailDetail, input.mailOk);
  if (!input.mailOk && !input.stored) {
    return {
      status: 503,
      body: {
        error: "The request could not be sent. Try again in a minute.",
        mailed: false,
        stored: false,
        mailDetail,
      },
    };
  }
  const needsActivation = /activat/i.test(input.mailDetail);
  return {
    status: 200,
    body: {
      ok: true,
      mailed: input.mailOk,
      stored: input.stored,
      mailDetail,
      message: input.mailOk
        ? "Request sent. The admin will review your free membership."
        : needsActivation
          ? "Request saved. The admin will review your free membership."
          : "Your request is saved on this desk. The email to the admin did not send, so try again later if you do not hear back.",
    },
  };
}

async function sendViaResend(input: MembershipMail, fetchImpl: typeof fetch) {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  const { subject, text, html } = letter(input);
  const from = membershipFromAddress();
  let response: Response;
  try {
    response = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [TO],
        reply_to: input.email,
        subject,
        text,
        html,
      }),
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    throw new Error("Mail provider did not respond");
  }
  if (!response.ok) throw new Error(`Mail provider ${response.status}`);
  return "Sent with the mail provider.";
}

async function sendViaForm(input: MembershipMail, origin: string, fetchImpl: typeof fetch) {
  const { subject, text } = letter(input);
  let response: Response;
  try {
    response = await fetchImpl(`https://formsubmit.co/ajax/${TO}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: origin,
        Referer: `${origin}/login`,
      },
      body: JSON.stringify({
        name: input.name,
        email: input.email,
        phone: input.phone,
        area: input.area,
        message: text,
        _subject: subject,
        _replyto: input.email,
        _template: "table",
        _captcha: "false",
      }),
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    throw new Error("Form mail did not respond");
  }
  const data = (await response.json().catch(() => ({}))) as { success?: boolean | string; message?: string };
  const ok = response.ok && (data.success === true || data.success === "true");
  if (!ok) throw new Error((data.message || `Form mail ${response.status}`).slice(0, 180));
  return (data.message || "Sent to the admin inbox.").slice(0, 180);
}

export async function sendMembershipMail(
  input: MembershipMail,
  origin = "https://allinonmusk.com",
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; detail: string }> {
  let providerNote = "";
  try {
    const viaProvider = await sendViaResend(input, fetchImpl);
    if (viaProvider) return { ok: true, detail: viaProvider };
  } catch (err) {
    providerNote = err instanceof Error ? err.message : "Mail provider did not send.";
  }
  try {
    const detail = await sendViaForm(input, origin, fetchImpl);
    return { ok: true, detail };
  } catch (err) {
    const formNote = err instanceof Error ? err.message : "Email did not send.";
    return { ok: false, detail: [providerNote, formNote].filter(Boolean).join(" ") };
  }
}
