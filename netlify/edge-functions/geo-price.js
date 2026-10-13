// Netlify Edge Function: mostra o preço na moeda local do visitante e escolhe o checkout.
// País vem do IP (context.geo). Fora da lista, a página segue em US$ (Stripe).
// MX, AR, CO, CL e PE vão para a Hotmart (OXXO, Mercado Pago, PSE, MACH, Yape...): oferta em MX$ 109,
// que a Hotmart converte para a moeda local — por isso fora do México o preço aparece como aproximado (≈).
const HOTMART = "https://pay.hotmart.com/U107968832D?off=scodujd8";
// Desligado até o saque da Hotmart estar resolvido. Com true, os países com "hm" vão para a Hotmart
// e usam o preço convertido dela (os campos de "hm" substituem os do Stripe).
const HOTMART_ON = false;
const EUR = { price: "9,90 €", old: "27 €", off: "−63%", unit200: "5 céntimos", unit50: "20 céntimos" };
const LOCAL = {
  MX: { price: "MX$ 109", old: "MX$ 489", off: "−78%", unit200: "60 centavos", unit50: "3 pesos", hm: {} },
  CO: { price: "COP$ 18.900", old: "COP$ 87.900", off: "−78%", unit200: "100 pesos", unit50: "400 pesos", hm: { price: "≈ COP$ 19.200" } },
  CL: { price: "CLP$ 5.790", old: "CLP$ 25.990", off: "−78%", unit200: "30 pesos", unit50: "120 pesos", hm: { price: "≈ CLP$ 5.800" } },
  PE: { price: "S/ 19,90", old: "S/ 92,90", off: "−79%", unit200: "10 céntimos", unit50: "40 céntimos", hm: { price: "≈ S/ 20,50", off: "−78%", unit200: "15 céntimos", unit50: "45 céntimos" } },
  UY: { price: "$U 239", old: "$U 1.090", off: "−78%", unit200: "2 pesos", unit50: "5 pesos" },
  GT: { price: "Q 45", old: "Q 205", off: "−78%", unit200: "25 centavos", unit50: "1 quetzal" },
  AR: { price: "ARS$ 8.900", old: "ARS$ 39.900", off: "−78%", unit200: "45 pesos", unit50: "180 pesos", hm: { price: "≈ ARS$ 9.000", off: "−77%", unit200: "50 pesos", unit50: "200 pesos" } },
  DO: { price: "RD$ 359", old: "RD$ 1.590", off: "−77%", unit200: "2 pesos", unit50: "8 pesos" },
  CR: { price: "₡ 2.690", old: "₡ 11.990", off: "−78%", unit200: "15 colones", unit50: "55 colones" },
  PY: { price: "₲ 34.900", old: "₲ 159.900", off: "−78%", unit200: "175 guaraníes", unit50: "700 guaraníes" },
  BO: { price: "Bs 69", old: "Bs 319", off: "−78%", unit200: "35 centavos", unit50: "1,50 bolivianos" },
  HN: { price: "L 159", old: "L 719", off: "−78%", unit200: "80 centavos", unit50: "4 lempiras" },
};
// zona do euro (o Stripe cobra em EUR nesses países)
for (const cc of ["ES", "PT", "FR", "DE", "IT", "NL", "BE", "AT", "IE", "FI", "GR", "LU", "SK", "SI", "EE", "LV", "LT", "MT", "CY", "HR"]) LOCAL[cc] = EUR;

export function localize(html, p) {
  if (HOTMART_ON && p.hm) {
    p = { ...p, ...p.hm };
    html = html.replace(/https:\/\/buy\.stripe\.com\/[A-Za-z0-9]+(\?locale=[A-Za-z-]+)?/g, HOTMART);
  }
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
