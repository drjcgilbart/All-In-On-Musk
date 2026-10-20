export const ADMIN_EMAIL = "admin@allinonmusk.com";
const TO = ADMIN_EMAIL;

export type MembershipMail = {
  name: string;
  email: string;
  phone: string;
  area: string;
};

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

async function sendViaResend(input: MembershipMail) {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  const { subject, text, html } = letter(input);
  const from = process.env.MEMBERSHIP_FROM?.trim() || "All In On Musk <onboarding@resend.dev>";
  const response = await fetch("https://api.resend.com/emails", {
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
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Mail provider ${response.status}: ${body.slice(0, 180)}`);
  }
  return "Sent with the mail provider.";
}

async function sendViaForm(input: MembershipMail, origin: string) {
  const { subject, text } = letter(input);
  const response = await fetch(`https://formsubmit.co/ajax/${TO}`, {
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
  const data = (await response.json().catch(() => ({}))) as { success?: boolean | string; message?: string };
  const ok = response.ok && (data.success === true || data.success === "true");
  if (!ok) throw new Error(data.message || `Form mail ${response.status}`);
  return data.message || "Sent to the admin inbox.";
}

export async function sendMembershipMail(input: MembershipMail, origin = "https://allinonmusk.com"): Promise<{ ok: boolean; detail: string }> {
  try {
    const viaProvider = await sendViaResend(input);
    if (viaProvider) return { ok: true, detail: viaProvider };
    const detail = await sendViaForm(input, origin);
    return { ok: true, detail };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : "Email did not send." };
  }
}
