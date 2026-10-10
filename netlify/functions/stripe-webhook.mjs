// Netlify Function: recebe o webhook do Stripe depois da compra e envia
// um e-mail com o link da página de download do ebook.
//
// Endereço do webhook (cadastre no Stripe):
//   https://SEU-SITE.netlify.app/.netlify/functions/stripe-webhook
// Evento: checkout.session.completed
//
// Variáveis de ambiente (Netlify → Site configuration → Environment variables):
//   STRIPE_WEBHOOK_SECRET  (obrigatória) "Signing secret" do webhook, começa com whsec_
//   BREVO_API_KEY          chave da Brevo (brevo.com) — ou RESEND_API_KEY (resend.com)
//   EMAIL_FROM             e-mail remetente verificado na Brevo/Resend
//   EMAIL_FROM_NAME        nome do remetente (opcional)
//   EMAIL_REPLY_TO         e-mail para respostas/suporte (opcional)
//   SITE_URL               (opcional) domínio do site, ex.: https://meusite.com
//   PAYMENT_LINK_ID        (opcional) plink_... para aceitar só esse link (senão: paymentLinks do copy)
//
// Gerado por sites/_build/build.py — as constantes abaixo vêm de copy/<idioma>.json.

import { createHmac, timingSafeEqual } from "node:crypto";

const CFG = {
  "book": "Kit 50 Recetas Naturales + 150 Soluciones Naturales",
  "currency": "usd",
  "accessPath": "/acceso-lpyenwv0kv/",
  "email": {
    "subject": "Tus 2 libros llegaron: 50 Recetas Naturales + 150 Soluciones Naturales",
    "hello": "Hola",
    "body": "¡Gracias por tu compra! Tus 2 libros ya están disponibles: 50 Recetas Naturales que Sí Funcionan y el bono 150 Soluciones Naturales que Realmente Funcionan. Toca el botón de abajo para abrir la página de descarga.",
    "button": "Descargar mis 2 libros",
    "fallback": "Si el botón no funciona, copia y pega este enlace en tu navegador:",
    "footer": "Guarda este correo: el enlace funciona siempre que quieras descargarlos de nuevo. Si tienes dudas, solo responde este mensaje.",
    "legal": "Recibiste este correo porque compraste los libros. Contenido educativo; no sustituye el consejo médico."
  },
  "paymentLinks": [
    "plink_1UM26SHqUD5XCcEnMOgIeDiE"
  ]
};

const env = (k) => (typeof Netlify !== "undefined" ? Netlify.env.get(k) : process.env[k]) || "";

function verifyStripe(raw, header, secret) {
  const parts = Object.fromEntries(
    header.split(",").map((kv) => kv.split("=")).filter((p) => p.length === 2).map(([k, v]) => [k.trim(), v])
  );
  const sigs = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!parts.t || !sigs.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > 600) return false;
  const expected = createHmac("sha256", secret).update(`${parts.t}.${raw}`).digest("hex");
  return sigs.some((s) => s.length === expected.length && timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function emailHtml(name, link) {
  const t = CFG.email;
  return `<!doctype html><html><body style="margin:0;background:#FAF7F2;font-family:Helvetica,Arial,sans-serif;color:#3C3F38">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #E3D9C7;border-radius:4px">
<tr><td style="background:#2F4A3A;padding:28px 32px;text-align:center">
<div style="font-family:Georgia,serif;font-size:40px;color:#E9D3A6;line-height:1">50</div>
<div style="font-family:Georgia,serif;font-size:20px;color:#FBF6EC;margin-top:6px">${esc(CFG.book)}</div>
</td></tr>
<tr><td style="padding:32px">
<p style="font-family:Georgia,serif;font-size:22px;color:#2F4A3A;margin:0 0 14px">${esc(t.hello)}${name ? ", " + esc(name) : ""}!</p>
<p style="font-size:15px;line-height:1.6;margin:0 0 24px">${esc(t.body)}</p>
<p style="text-align:center;margin:0 0 24px"><a href="${link}" style="display:inline-block;background:#2F4A3A;color:#ffffff;text-decoration:none;font-size:15px;padding:16px 26px;border-radius:4px">${esc(t.button)}</a></p>
<p style="font-size:13px;line-height:1.6;color:#6D6A60;margin:0 0 6px">${esc(t.fallback)}</p>
<p style="font-size:13px;word-break:break-all;margin:0 0 24px"><a href="${link}" style="color:#B8643C">${link}</a></p>
<p style="font-size:13px;line-height:1.6;color:#6D6A60;margin:0">${esc(t.footer)}</p>
</td></tr></table>
<p style="font-size:11px;color:#A39C8C;margin-top:16px">${esc(t.legal)}</p>
</td></tr></table></body></html>`;
}

async function sendEmail(to, name, link) {
  const subject = CFG.email.subject;
  const html = emailHtml(name, link);
  const from = env("EMAIL_FROM");
  const fromName = env("EMAIL_FROM_NAME") || CFG.book;
  const replyTo = env("EMAIL_REPLY_TO");
  if (!from) throw new Error("EMAIL_FROM não configurado");

  if (env("BREVO_API_KEY")) {
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": env("BREVO_API_KEY"), "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { email: from, name: fromName }, to: [{ email: to, name: name || undefined }],
        subject, htmlContent: html, ...(replyTo ? { replyTo: { email: replyTo } } : {}),
      }),
    });
    if (!r.ok) throw new Error(`Brevo ${r.status}: ${await r.text()}`);
    return;
  }
  if (env("RESEND_API_KEY")) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env("RESEND_API_KEY")}`, "content-type": "application/json" },
      body: JSON.stringify({ from: `${fromName} <${from}>`, to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
    return;
  }
  throw new Error("Nenhum provedor de e-mail configurado (BREVO_API_KEY ou RESEND_API_KEY)");
}

export default async (req) => {
  if (req.method !== "POST") return new Response("ok", { status: 200 });
  const secret = env("STRIPE_WEBHOOK_SECRET");
  const raw = await req.text();
  if (!secret || !verifyStripe(raw, req.headers.get("stripe-signature") || "", secret)) {
    return new Response("assinatura inválida", { status: 400 });
  }

  const event = JSON.parse(raw);
  if (!["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
    return new Response("ignorado: evento", { status: 200 });
  }
  const s = event.data.object;
  // A mesma conta Stripe vende os dois livros: cada site só responde pela sua venda.
  // Filtro pelo link de pagamento (não pela moeda: o mesmo link cobra em várias moedas locais).
  const links = env("PAYMENT_LINK_ID") ? [env("PAYMENT_LINK_ID")] : CFG.paymentLinks || [];
  if (links.length ? !links.includes(s.payment_link) : (s.currency || "").toLowerCase() !== CFG.currency) {
    return new Response("ignorado: outro produto", { status: 200 });
  }
  if (s.payment_status !== "paid") return new Response("ignorado: não pago", { status: 200 });

  const email = s.customer_details?.email || s.customer_email;
  if (!email) return new Response("sem e-mail", { status: 200 });
  const name = (s.customer_details?.name || "").trim().split(/\s+/)[0] || "";
  const base = (env("SITE_URL") || new URL(req.url).origin).replace(/\/$/, "");
  const link = base + CFG.accessPath;

  try {
    await sendEmail(email, name, link);
  } catch (e) {
    console.error(e);
    return new Response("falha ao enviar e-mail", { status: 500 }); // o Stripe tenta de novo
  }
  return new Response("e-mail enviado", { status: 200 });
};
