// Netlify Edge Function: mostra o preço na moeda local do visitante (mesmos valores do checkout do Stripe).
// País vem do IP (context.geo). Fora da lista, a página segue em US$.
const EUR = { price: "9,90 €", old: "27 €", off: "−63%", unit200: "5 céntimos", unit50: "20 céntimos" };
const LOCAL = {
  MX: { price: "MX$ 179", old: "MX$ 489", off: "−63%", unit200: "1 peso", unit50: "4 pesos" },
  CO: { price: "COP$ 29.900", old: "COP$ 79.900", off: "−63%", unit200: "150 pesos", unit50: "600 pesos" },
  CL: { price: "CLP$ 9.490", old: "CLP$ 25.990", off: "−63%", unit200: "50 pesos", unit50: "200 pesos" },
  PE: { price: "S/ 36,90", old: "S/ 99,90", off: "−63%", unit200: "20 céntimos", unit50: "75 céntimos" },
  UY: { price: "$U 390", old: "$U 1.090", off: "−64%", unit200: "2 pesos", unit50: "8 pesos" },
  GT: { price: "Q 75", old: "Q 199", off: "−62%", unit200: "40 centavos", unit50: "2 quetzales" },
  AR: { price: "ARS$ 14.900", old: "ARS$ 39.900", off: "−63%", unit200: "75 pesos", unit50: "300 pesos" },
  DO: { price: "RD$ 429", old: "RD$ 1.190", off: "−64%", unit200: "3 pesos", unit50: "9 pesos" },
  CR: { price: "₡ 4.490", old: "₡ 11.990", off: "−63%", unit200: "25 colones", unit50: "90 colones" },
  PY: { price: "₲ 39.900", old: "₲ 109.900", off: "−64%", unit200: "200 guaraníes", unit50: "800 guaraníes" },
  BO: { price: "Bs 82", old: "Bs 219", off: "−63%", unit200: "50 centavos", unit50: "2 bolivianos" },
  HN: { price: "L 185", old: "L 499", off: "−63%", unit200: "1 lempira", unit50: "4 lempiras" },
};
// zona do euro (o Stripe cobra em EUR nesses países)
for (const cc of ["ES", "PT", "FR", "DE", "IT", "NL", "BE", "AT", "IE", "FI", "GR", "LU", "SK", "SI", "EE", "LV", "LT", "MT", "CY", "HR"]) LOCAL[cc] = EUR;

export function localize(html, p) {
  return html
    .replaceAll("US$ 9.90", p.price)
    .replaceAll("US$ 27", p.old)
    .replaceAll('class="badge">−63%', 'class="badge">' + p.off)
    .replace(/([Mm])enos de 5 centavos/g, `$1enos de ${p.unit200}`)
    .replace(/([Mm])enos de 20 centavos/g, `$1enos de ${p.unit50}`);
}

export default async (req, context) => {
  const res = await context.next();
  const p = LOCAL[context.geo?.country?.code || ""];
  if (!p || !(res.headers.get("content-type") || "").includes("text/html")) return res;
  const headers = new Headers(res.headers);
  headers.delete("content-length");
  headers.set("cache-control", "public, max-age=0, must-revalidate");
  return new Response(localize(await res.text(), p), { status: res.status, headers });
};

export const config = { path: ["/", "/livro/", "/livro"] };
