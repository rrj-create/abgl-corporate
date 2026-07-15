// Resend transactional email helper.
// Cloudflare Workers send via the Resend HTTP API (https://resend.com), which
// needs an API key (set as the RESEND_API_KEY secret) and a verified sending
// domain — add the SPF/DKIM/DMARC records Resend shows you for
// agri-biofuels.global in DNS.
//
// We use this for several send paths:
//   - Investor NCNDA magic link (must succeed — failure is surfaced to the user)
//   - Internal notifications to the relevant @agri-biofuels.global inbox
//   - Contact / newsletter confirmations
//
// Callers get a {ok,status,body} result back; failures are NEVER swallowed here.
import { env } from './env';

export interface MailMessage {
  to: string;
  toName?: string;
  from: string;
  fromName?: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

export async function sendMail(msg: MailMessage): Promise<{ ok: boolean; status: number; body?: string }> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, status: 0, body: 'RESEND_API_KEY is not set' };
  }

  // Resend's `from` takes a "Name <email>" string. Fall back to a bare address.
  const fromName = msg.fromName ?? 'Agri-Biofuels Global';
  const from = fromName ? `${fromName} <${msg.from}>` : msg.from;
  const to = msg.toName ? `${msg.toName} <${msg.to}>` : msg.to;

  const payload: Record<string, unknown> = {
    from,
    to: [to],
    subject: msg.subject,
    text: msg.text,
    ...(msg.html ? { html: msg.html } : {}),
    ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
  };

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) return { ok: true, status: res.status };
    const body = await res.text();
    return { ok: false, status: res.status, body };
  } catch (err) {
    return { ok: false, status: 0, body: String(err) };
  }
}

/** Escape user content before injecting into HTML emails */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
