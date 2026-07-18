// Vercel serverless function: receives the project brief form and emails Conor via Resend.
// Requires the RESEND_API_KEY environment variable (set in the Vercel project settings).

const NOTIFY_TO = "conordonelan@gmail.com";
// Until a custom domain is verified in Resend, the from-address must be onboarding@resend.dev
const FROM = "GAM Website <onboarding@resend.dev>";

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const row = (label, value) =>
  `<tr><td style="padding:6px 12px 6px 0"><b>${label}</b></td><td style="padding:6px 0">${esc(value) || "—"}</td></tr>`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const b = req.body ?? {};

  // honeypot filled → silently accept and drop (it's a bot)
  if (b.website) return res.status(200).json({ ok: true });

  if (!b.projectName || !b.contactName || !b.email || !b.story) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const html = `
    <h2>New project brief from the GAM website</h2>
    <p><i>Received ${new Date().toLocaleString("en-IE", { timeZone: "Europe/Dublin" })}</i></p>

    <h3>About</h3>
    <table style="border-collapse:collapse">
      ${row("Project name", b.projectName)}
      ${row("Point of contact", b.contactName)}
      ${row("Email", b.email)}
      ${row("Phone", b.phone)}
    </table>

    <h3>🎥 The Core Idea &amp; Purpose</h3>
    <table style="border-collapse:collapse">
      ${row("What is the video for?", b.purpose)}
      ${row("Who will be watching?", b.audience)}
    </table>
    <p><b>Main story or message:</b><br>${esc(b.story).replace(/\n/g, "<br>")}</p>

    <h3>🎯 Deliverables &amp; Technical Details</h3>
    <table style="border-collapse:collapse">
      ${row("Final deliverables", b.deliverables)}
      ${row("Hosted/shown on", b.hosting)}
      ${row("Aspect ratio / resolution", b.aspectRatio)}
      ${row("Existing assets / branding", b.assets)}
    </table>

    <h3>⏰ Timelines &amp; Budget</h3>
    <table style="border-collapse:collapse">
      ${row("Ideal delivery date", b.deliveryDate)}
      ${row("Target budget", b.budget)}
    </table>

    <h3>📋 Production Logistics</h3>
    <p><b>Filming locations:</b><br>${esc(b.locations).replace(/\n/g, "<br>") || "—"}</p>
    <table style="border-collapse:collapse">
      ${row("People to be filmed", b.talentCount)}
      ${row("Inspiration links", b.inspiration)}
    </table>
  `;

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [NOTIFY_TO],
      reply_to: b.email,
      subject: `GAM brief: ${b.projectName} — ${b.contactName}`,
      html,
    }),
  });

  if (!resp.ok) {
    const detail = await resp.text();
    console.error("Resend error:", resp.status, detail);
    return res.status(502).json({ error: "Email delivery failed" });
  }

  return res.status(200).json({ ok: true });
}
