// Netlify Edge Function: mostra o preço na moeda local do visitante (mesmos valores do checkout do Stripe).
// País vem do IP (context.geo). Fora da lista, a página segue em US$.
const EUR = { price: "9,90 €", old: "27 €", unit200: "5 céntimos", unit50: "20 céntimos" };
const LOCAL = {
  MX: { price: "MX$ 179", old: "MX$ 489", unit200: "1 peso", unit50: "4 pesos" },
  CO: { price: "COP$ 39.900", old: "COP$ 107.900", unit200: "200 pesos", unit50: "800 pesos" },
  CL: { price: "CLP$ 9.490", old: "CLP$ 25.990", unit200: "50 pesos", unit50: "200 pesos" },
  PE: { price: "S/ 36,90", old: "S/ 99,90", unit200: "20 céntimos", unit50: "75 céntimos" },
};
// zona do euro (o Stripe cobra em EUR nesses países)
for (const cc of ["ES", "PT", "FR", "DE", "IT", "NL", "BE", "AT", "IE", "FI", "GR", "LU", "SK", "SI", "EE", "LV", "LT", "MT", "CY", "HR"]) LOCAL[cc] = EUR;

export function localize(html, p) {
  return html
    .replaceAll("US$ 9.90", p.price)
    .replaceAll("US$ 27", p.old)
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
