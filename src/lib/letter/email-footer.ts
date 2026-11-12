import { LETTER_CONTACT_EMAIL, LETTER_NAME, LETTER_SUBSCRIBE_PATH } from "@/content/letter";
import { site } from "@/content/site";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * HTML footer for a future email edition. Not imported by any page.
 * `unsubscribeUrl` is filled in when a letter is sent.
 */
export function letterEmailFooter(input: { issueUrl: string; unsubscribeUrl: string }) {
  const forward = `${site.url}${LETTER_SUBSCRIBE_PATH}`;
  const issueUrl = escapeHtml(input.issueUrl);
  const unsubscribeUrl = escapeHtml(input.unsubscribeUrl);
  return [
    `<p style="margin:24px 0 8px;font-size:13px;line-height:1.5;color:#a8b3bd">`,
    `<a href="${issueUrl}" style="color:#2ee6d6">Read in your browser</a>`,
    ` · <a href="${escapeHtml(forward)}" style="color:#2ee6d6">Forward to a friend</a>`,
    ` · <a href="${unsubscribeUrl}" style="color:#2ee6d6">Unsubscribe</a>`,
    `</p>`,
    `<p style="margin:0;font-size:12px;line-height:1.5;color:#a8b3bd">${escapeHtml(LETTER_NAME)}. Free. Unsubscribe anytime. Questions: <a href="mailto:${LETTER_CONTACT_EMAIL}" style="color:#2ee6d6">${LETTER_CONTACT_EMAIL}</a>.</p>`,
  ].join("");
}
