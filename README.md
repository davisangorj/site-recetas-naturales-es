# Site — 50 Recetas Naturales que Sí Funcionan (ES)

Landing page estática (HTML + CSS + JS, sem build). O que está aqui é o que vai pro ar.

```
index.html        → todo o texto da página (em espanhol)
assets/style.css  → cores, fontes e layout
assets/app.js     → filtro de receitas, galeria, CTA fixo no celular
img/              → capa, fotos das receitas (img/r/) e páginas do livro (img/pages/)
netlify.toml      → configuração do Netlify (publica a raiz)
```

## Edições comuns (em `index.html`)

- **Link do checkout:** troque `href="#oferta"` pelo link do checkout nos 5 botões com `data-cta` (busque por `data-cta`).
- **Preço:** busque `US$ 9.90` (preço atual, 4 lugares), `US$ 27` (preço antigo) e `−63%` (selo).
- **Textos:** é só procurar a frase e editar.
- **Cores:** variáveis no topo de `assets/style.css` (`--green`, `--terra`, `--canvas`…).
- **Pixel do Meta / Google Tag:** cole no `<head>` do `index.html`. Os botões de compra já disparam `InitiateCheckout` / `begin_checkout`.

## Publicar no Netlify

Netlify → *Add new site* → *Import an existing project* → GitHub → escolha este repositório.
Deixe *Build command* vazio e *Publish directory* `.`. Cada commit no `main` atualiza o site sozinho.
