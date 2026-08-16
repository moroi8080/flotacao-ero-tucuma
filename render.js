// ============================================================
// Renderizador PNG do Relatório Funcionamento Flotação
// Porta fiel do gerar_relatorio.py (Pillow) para Canvas API.
// ============================================================

const W = 1080, MX = 48;
const INK = '#1F2937', MUT = '#4B5563', WHITE = '#FFFFFF';
const TEAL = '#00727A', TEAL_D = '#00545B', TEAL_SOFT = '#BFF6F0';
const TEAL_BG = '#EBF4F4', BOX_BG = '#F2F7F7', FOOT_SUB = 'rgb(158,198,196)';
const CORES = { verde: '#1E9E4F', amarelo: '#E8A33D', vermelho: '#D64545' };
const FAM = '"Segoe UI", Arial, sans-serif';

function corDe(chave) { return CORES[chave] || CORES.verde; }

function hexRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function tint(c, f = 0.16) {
  const [r, g, b] = hexRgb(c);
  return `rgb(${Math.round(r * f + 255 * (1 - f))},${Math.round(g * f + 255 * (1 - f))},${Math.round(b * f + 255 * (1 - f))})`;
}

function fonte(size, peso = '400', estilo = 'normal') {
  return `${peso} ${estilo} ${size}px ${FAM}`;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrap(ctx, texto, fnt, maxW) {
  const words = String(texto || '').split(' ');
  const linhas = [];
  let cur = '';
  for (const w of words) {
    const t = (cur + ' ' + w).trim();
    if (ctx.measureText(t).width <= maxW) cur = t;
    else { if (cur) linhas.push(cur); cur = w; }
  }
  if (cur) linhas.push(cur);
  return linhas;
}

// registra as fontes: usa a Segoe UI local se existir (Windows),
// senão carrega as Liberation Sans bundled (celular/Android).
async function carregarFontes() {
  const defs = [
    ['400', 'normal', 'segoeui.woff2'],
    ['700', 'normal', 'segoeuib.woff2'],
    ['400', 'italic', 'segoeuii.woff2'],
  ];
  for (const [peso, estilo, url] of defs) {
    try {
      const f = new FontFace('Segoe UI', `local("Segoe UI"), url(${url})`, { weight: peso, style: estilo });
      await f.load();
      document.fonts.add(f);
    } catch (e) { /* sem rede? segue com sans-serif */ }
  }
  await document.fonts.ready;
}

function medirAltura(ctx, dados) {
  let y = 0;
  y += 84;                        // topo
  y += 158;                       // faixa de título
  if (dados.slogan) y += 76;      // slogan
  y += 52;                        // título da seção

  for (const c of (dados.circuitos || [])) {
    y += 46 + 10;                 // banda do circuito
    const itens = c.itens || [];
    for (let i = 0; i < itens.length; i += 2) {
      let maxH = 0;
      for (let j = 0; j < 2 && i + j < itens.length; j++) {
        const it = itens[i + j];
        let linhas = wrap(ctx, it.nota, fonte(18), 472 - 24 - 10);
        if (linhas.length > 2) {
          linhas = linhas.slice(0, 2);
          linhas[1] = linhas[1].replace(/\s+$/, '') + '…';
        }
        maxH = Math.max(maxH, 32 + linhas.length * 23 + 8);
      }
      y += maxH;
    }
    y += 14;
  }

  const pend = dados.pendencias || [];
  if (pend.length) {
    let total = 0;
    for (const p of pend) total += wrap(ctx, p, fonte(19), W - 2 * MX - 96).length * 24 + 14;
    y += 20 + 40 + total + 16 + 24;
  }

  const pills = dados.pills || [];
  if (pills.length) y += 32 + 56 + 24;   // rótulo + pílulas + respiro

  y += 116;                        // rodapé
  return y;
}

async function renderPNG(dados, iconeImg) {
  await carregarFontes();
  const cv = document.createElement('canvas');
  const ctx = cv.getContext('2d');
  const H = medirAltura(ctx, dados);
  cv.width = W;
  cv.height = H;

  // fundo branco explícito (senão o PNG sai transparente e vira preto nos visualizadores)
  ctx.fillStyle = WHITE;
  ctx.fillRect(0, 0, W, H);

  ctx.textBaseline = 'top';
  let y = 0;
  const topo = dados.topo || {};

  // ---------- topo (faixa branca) ----------
  const TOP = 84;
  let tx = MX;
  if (iconeImg && iconeImg.complete && iconeImg.naturalWidth) {
    ctx.drawImage(iconeImg, MX, (TOP - 60) / 2, 60, 60);
    tx = MX + 60 + 16;
  }
  ctx.fillStyle = INK;
  ctx.font = fonte(24, '700');
  ctx.fillText(topo.rotulo1 || '', tx, 14);
  ctx.fillStyle = MUT;
  ctx.font = fonte(15);
  ctx.fillText(topo.rotulo2 || '', tx, 48);

  const chip = `${topo.data || ''}  ·  ${topo.semana || ''}`;
  ctx.font = fonte(18, '700');
  const cw = ctx.measureText(chip).width;
  const ch = 18 * 1.35;
  const px = W - MX - cw - 36, py = (TOP - (ch + 22)) / 2;
  ctx.fillStyle = TEAL;
  rr(ctx, px, py, cw + 36, ch + 22, 18);
  ctx.fill();
  ctx.fillStyle = WHITE;
  ctx.fillText(chip, px + 18, py + 11);
  y += TOP;

  // ---------- faixa de título (gradiente teal) ----------
  const TH = 158;
  const grad = ctx.createLinearGradient(0, y, 0, y + TH);
  grad.addColorStop(0, TEAL);
  grad.addColorStop(1, TEAL_D);
  ctx.fillStyle = grad;
  ctx.fillRect(0, y, W, TH);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = WHITE;
  ctx.font = fonte(44, '700');
  ctx.fillText(dados.titulo || '', W / 2, y + 46);
  ctx.fillStyle = TEAL_SOFT;
  ctx.font = fonte(24);
  ctx.fillText(dados.subtitulo || '', W / 2, y + 104);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  y += TH;

  // ---------- slogan ----------
  if (dados.slogan) {
    ctx.fillStyle = TEAL_BG;
    rr(ctx, MX, y + 12, W - 2 * MX, 44, 10);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = TEAL_D;
    ctx.font = fonte(19, '400', 'italic');
    ctx.fillText(dados.slogan, W / 2, y + 34);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    y += 76;
  }

  // ---------- título da seção ----------
  ctx.fillStyle = TEAL;
  rr(ctx, MX, y + 2, 8, 30, 4);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.font = fonte(26, '700');
  ctx.fillText('STATUS POR CIRCUITO', MX + 22, y);
  y += 52;

  // ---------- blocos por circuito ----------
  const COL2 = 560;
  for (const c of (dados.circuitos || [])) {
    const bh = 46;
    ctx.fillStyle = TEAL;
    rr(ctx, MX, y, W - 2 * MX, bh, 10);
    ctx.fill();
    ctx.textBaseline = 'middle';
    ctx.fillStyle = WHITE;
    ctx.font = fonte(24, '700');
    ctx.fillText(c.nome || '', MX + 20, y + bh / 2);
    if (c.badge) {
      ctx.font = fonte(17, '700');
      const bw = ctx.measureText(c.badge).width;
      const bhh = 17 * 1.35;
      const bx = W - MX - 24 - bw - 24;
      ctx.fillStyle = WHITE;
      rr(ctx, bx, y + (bh - (bhh + 16)) / 2, bw + 24, bhh + 16, 14);
      ctx.fill();
      ctx.fillStyle = TEAL_D;
      ctx.fillText(c.badge, bx + 12, y + bh / 2);
    }
    ctx.textBaseline = 'top';
    y += bh + 10;

    const itens = c.itens || [];
    for (let i = 0; i < itens.length; i += 2) {
      let maxH = 0;
      const par = itens.slice(i, i + 2);
      const linhasPar = [];
      for (let j = 0; j < par.length; j++) {
        const it = par[j];
        const x0 = j === 0 ? MX : COL2;
        const cor = corDe(it.cor);
        ctx.fillStyle = cor;
        ctx.beginPath();
        ctx.arc(x0 + 9, y + 16, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = INK;
        ctx.font = fonte(21, '700');
        const tag = it.tag || '';
        ctx.fillText(tag, x0 + 24, y);
        const tw = ctx.measureText(tag + ' ').width;
        ctx.fillStyle = cor;
        ctx.font = fonte(19, '700');
        ctx.fillText(it.status || '', x0 + 24 + tw, y + 2);
        ctx.fillStyle = MUT;
        ctx.font = fonte(18);
        let linhas = wrap(ctx, it.nota, fonte(18), 472 - 24 - 10);
        if (linhas.length > 2) {
          linhas = linhas.slice(0, 2);
          linhas[1] = linhas[1].replace(/\s+$/, '') + '…';
        }
        linhas.forEach((ln, k) => ctx.fillText(ln, x0 + 24, y + 32 + k * 23));
        linhasPar.push(linhas);
        maxH = Math.max(maxH, 32 + linhas.length * 23 + 8);
      }
      y += maxH;
    }
    y += 14;
  }

  // ---------- pendências em aberto ----------
  const pend = dados.pendencias || [];
  if (pend.length) {
    ctx.font = fonte(19);
    const linhasP = pend.map(p => wrap(ctx, p, fonte(19), W - 2 * MX - 96));
    let total = 0;
    for (const l of linhasP) total += l.length * 24 + 14;
    const boxH = 20 + 40 + total + 16;
    ctx.fillStyle = BOX_BG;
    rr(ctx, MX, y, W - 2 * MX, boxH, 12);
    ctx.fill();
    ctx.fillStyle = TEAL;
    ctx.fillRect(MX, y + 12, 6, boxH - 24);
    ctx.fillStyle = TEAL_D;
    ctx.font = fonte(24, '700');
    ctx.fillText('PENDÊNCIAS EM ABERTO', MX + 24, y + 14);
    let yy = y + 14 + 46;
    ctx.font = fonte(19);
    linhasP.forEach((linhas, n) => {
      ctx.fillStyle = TEAL;
      ctx.beginPath();
      ctx.arc(MX + 39, yy + 13, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = WHITE;
      ctx.font = fonte(19, '700');
      ctx.fillText(String(n + 1), MX + 39, yy + 13);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = INK;
      ctx.font = fonte(19);
      for (const ln of linhas) {
        ctx.fillText(ln, MX + 64, yy);
        yy += 24;
      }
      yy += 14;
    });
    y += boxH + 24;
  }

  // ---------- disponibilidade ----------
  const pills = dados.pills || [];
  if (pills.length) {
    ctx.fillStyle = MUT;
    ctx.font = fonte(20, '700');
    ctx.fillText('DISPONIBILIDADE GERAL', MX, y);
    y += 32;
    const gap = 14;
    const pw = (W - 2 * MX - gap * (pills.length - 1)) / pills.length;
    pills.forEach((pl, i) => {
      const x0 = MX + i * (pw + gap);
      const cor = corDe(pl.cor);
      ctx.fillStyle = tint(cor);
      rr(ctx, x0, y, pw, 56, 12);
      ctx.fill();
      ctx.fillStyle = MUT;
      ctx.font = fonte(15, '700');
      ctx.fillText(pl.rotulo || '', x0 + 14, y + 9);
      ctx.fillStyle = cor;
      ctx.font = fonte(20, '700');
      ctx.fillText((pl.valor || '') + ' DISPONÍVEIS', x0 + 14, y + 27);
    });
    y += 56 + 24;
  }

  // ---------- rodapé ----------
  const FH = 116;
  ctx.fillStyle = TEAL_D;
  ctx.fillRect(0, y, W, FH);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = FOOT_SUB;
  ctx.font = fonte(16);
  ctx.fillText(dados.rodape1 || '', W / 2, y + 36);
  ctx.fillStyle = WHITE;
  ctx.font = fonte(30, '700');
  ctx.fillText(dados.rodape2 || '', W / 2, y + 78);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  return cv;
}
