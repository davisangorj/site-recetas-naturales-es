# Site — 50 Recetas Naturales que Sí Funcionan (ES)

Landing page estática (HTML + CSS + JS, sem build). O que está aqui é o que vai pro ar.

```
index.html        → todo o texto da página (em espanhol)
assets/style.css  → cores, fontes e layout
assets/app.js     → filtro de receitas, galeria, CTA fixo no celular
img/              → capa, fotos das receitas (img/r/) e páginas do livro (img/pages/)
netlify.toml      → configuração do Netlify
acceso-lpyenwv0kv/  → página de download pós-compra + PDF do livro (link secreto, sem Google)
netlify/functions/stripe-webhook.mjs → envia o e-mail com o link de download após a compra
```

## Edições comuns (em `index.html`)

- **Link do checkout:** os 5 botões com `data-cta` apontam para o link do Stripe (busque por `buy.stripe.com`).
- **Preço:** busque `US$ 9.90` (preço atual, 4 lugares), `US$ 27` (preço antigo) e `−63%` (selo).
- **Textos:** é só procurar a frase e editar.
- **Cores:** variáveis no topo de `assets/style.css` (`--green`, `--terra`, `--canvas`…).
- **Pixel do Meta / Google Tag:** cole no `<head>` do `index.html`. Os botões de compra já disparam `InitiateCheckout` / `begin_checkout`.

## Publicar no Netlify

Netlify → *Add new site* → *Import an existing project* → GitHub → escolha este repositório.
Deixe *Build command* vazio e *Publish directory* `.`. Cada commit no `main` atualiza o site sozinho.

## Depois da compra: página de download + e-mail

**Página de download:** `https://SEU-SITE.netlify.app/acceso-lpyenwv0kv/`
(o endereço é secreto e não aparece no Google; o PDF do livro fica na mesma pasta).

1. **Redirecionar após o pagamento** — Stripe → *Payment Links* → abra o link → *Editar* →
   aba *After payment* → *Don't show confirmation page* → *Redirect customers to your website* →
   cole o endereço da página de download acima.
2. **E-mail com o link** — a função `netlify/functions/stripe-webhook.mjs` manda o e-mail sozinha:
   - Crie uma conta grátis na **Brevo** (brevo.com), verifique o seu e-mail remetente
     (*Senders, Domains & Dedicated IPs* → *Senders*) e gere uma chave em *SMTP & API* → *API Keys*.
   - Stripe → *Developers* → *Webhooks* → *Add endpoint*:
     URL `https://SEU-SITE.netlify.app/.netlify/functions/stripe-webhook`, evento `checkout.session.completed`.
     Copie o *Signing secret* (`whsec_...`).
   - Netlify → *Site configuration* → *Environment variables*, adicione:
     `STRIPE_WEBHOOK_SECRET`, `BREVO_API_KEY`, `EMAIL_FROM` (o remetente verificado),
     `EMAIL_FROM_NAME` (opcional) e `EMAIL_REPLY_TO` (opcional, e-mail de suporte). Depois faça *Trigger deploy*.
   - A mesma conta Stripe vende os dois livros: esta função só responde às vendas em
     **dólar (USD)**. Se quiser filtrar pelo link exato, adicione `PAYMENT_LINK_ID` (plink_...).
   - Para testar, o melhor é fazer
     uma compra real com cupom de 100% (ou no modo de teste do Stripe).

**Trocar o PDF:** substitua o arquivo dentro de `acceso-lpyenwv0kv/` mantendo o mesmo nome.
