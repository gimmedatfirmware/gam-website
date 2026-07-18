// Vercel serverless function: receives the enquiry form and emails Conor via Resend.
// Requires the RESEND_API_KEY environment variable (set in the Vercel project settings).

const NOTIFY_TO = "conordonelan@gmail.com";
// Until a custom domain is verified in Resend, the from-address must be onboarding@resend.dev
const FROM = "GAM Website <onboarding@resend.dev>";

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, phone, organisation, projectType, deliveryDate, details, website } = req.body ?? {};

  // honeypot filled → silently accept and drop (it's a bot)
  if (website) return res.status(200).json({ ok: true });

  if (!name || !email || !details) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const html = `
    <h2>New enquiry from the GAM website</h2>
    <table cellpadding="6" style="border-collapse:collapse">
      <tr><td><b>Name</b></td><td>${esc(name)}</td></tr>
      <tr><td><b>Email</b></td><td>${esc(email)}</td></tr>
      <tr><td><b>Phone</b></td><td>${esc(phone) || "—"}</td></tr>
      <tr><td><b>Organisation</b></td><td>${esc(organisation) || "—"}</td></tr>
      <tr><td><b>Project type</b></td><td>${esc(projectType) || "—"}</td></tr>
      <tr><td><b>Ideal delivery</b></td><td>${esc(deliveryDate) || "—"}</td></tr>
    </table>
    <h3>Details</h3>
    <p>${esc(details).replace(/\n/g, "<br>")}</p>
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
      reply_to: email,
      subject: `GAM enquiry: ${name}${projectType ? " — " + projectType : ""}`,
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
