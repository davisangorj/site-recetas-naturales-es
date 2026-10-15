// Netlify Edge Function: mostra o preço na moeda local do visitante e escolhe o checkout.
// País vem do IP (context.geo). Fora da lista, a página segue em US$ (Stripe).
// MX, AR, CO, CL e PE vão para a Hotmart (OXXO, Mercado Pago, PSE, MACH, Yape...): oferta em MX$ 109,
// que a Hotmart converte para a moeda local — por isso fora do México o preço aparece como aproximado (≈).
const HOTMART = "https://pay.hotmart.com/U107968832D?off=scodujd8";
// Desligado até o saque da Hotmart estar resolvido. Com true, os países com "hm" vão para a Hotmart
// e usam o preço convertido dela (os campos de "hm" substituem os do Stripe).
const HOTMART_ON = false;
const EUR = { price: "9,90 €", old: "27 €", off: "−63%", unit250: "4 céntimos", unit100: "10 céntimos" };
const LOCAL = {
  MX: { price: "MX$ 109", old: "MX$ 489", off: "−78%", unit250: "45 centavos", unit100: "1,10 pesos", hm: {} },
  CO: { price: "COP$ 18.900", old: "COP$ 87.900", off: "−78%", unit250: "80 pesos", unit100: "190 pesos", hm: { price: "≈ COP$ 19.200" } },
  CL: { price: "CLP$ 5.790", old: "CLP$ 25.990", off: "−78%", unit250: "24 pesos", unit100: "58 pesos", hm: { price: "≈ CLP$ 5.800" } },
  PE: { price: "S/ 19,90", old: "S/ 92,90", off: "−79%", unit250: "8 céntimos", unit100: "20 céntimos", hm: { price: "≈ S/ 20,50", off: "−78%", unit250: "9 céntimos", unit100: "21 céntimos" } },
  UY: { price: "$U 239", old: "$U 1.090", off: "−78%", unit250: "1 peso", unit100: "2,40 pesos" },
  GT: { price: "Q 45", old: "Q 205", off: "−78%", unit250: "18 centavos", unit100: "45 centavos" },
  AR: { price: "ARS$ 8.900", old: "ARS$ 39.900", off: "−78%", unit250: "36 pesos", unit100: "89 pesos", hm: { price: "≈ ARS$ 9.000", off: "−77%", unit250: "36 pesos", unit100: "90 pesos" } },
  DO: { price: "RD$ 359", old: "RD$ 1.590", off: "−77%", unit250: "1,50 pesos", unit100: "3,60 pesos" },
  CR: { price: "₡ 2.690", old: "₡ 11.990", off: "−78%", unit250: "11 colones", unit100: "27 colones" },
  PY: { price: "₲ 34.900", old: "₲ 159.900", off: "−78%", unit250: "140 guaraníes", unit100: "350 guaraníes" },
  BO: { price: "Bs 69", old: "Bs 319", off: "−78%", unit250: "28 centavos", unit100: "70 centavos" },
  HN: { price: "L 159", old: "L 719", off: "−78%", unit250: "64 centavos", unit100: "1,60 lempiras" },
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
    .replace(/([Mm])enos de 4 centavos/g, `$1enos de ${p.unit250}`)
    .replace(/([Mm])enos de 10 centavos/g, `$1enos de ${p.unit100}`);
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
