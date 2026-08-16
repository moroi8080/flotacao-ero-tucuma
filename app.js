// ============================================================
// FlotaçãoInspect ERO — v2.0 (formato CycloneInspect)
// Páginas: Dashboard · Planejamento · Inspeções · Status · Relatórios
// Dados: localStorage (chave v2), com migração automática da v1.
// ============================================================

const CHAVE_V1 = 'flotacao_dados_v1';
const CHAVE_V2 = 'flotacao_dados_v2';

const DADOS_PADRAO = {
  topo: {rotulo1:"ERO TUCUMÃ", rotulo2:"SALA DE CONTROLE · FLOTAÇÃO", data:"16/08/2026", semana:"SEMANA 33"},
  titulo: "RELATÓRIO FUNCIONAMENTO FLOTAÇÃO",
  subtitulo: "ROUGHER · CLEANER · SCAVENGER",
  slogan: "Trabalhamos com o comprometimento de todos para uma operação segura, produtiva e dentro do prazo.",
  circuitos: [
    {nome:"CIRCUITO ROUGHER", badge:"5/6 DISPONÍVEIS", itens:[
      {tag:"FC-001",status:"ATENÇÃO",cor:"amarelo",nota:"Suspeita de obstrução na linha de ar — inversão do soprador p/ comprovação"},
      {tag:"FC-002",status:"DISPONÍVEL",cor:"verde",nota:"—"},
      {tag:"FC-003",status:"RESTRIÇÃO",cor:"amarelo",nota:"4230-LCV-0271A fora de serviço — dardos sem controle de nível"},
      {tag:"FC-004",status:"DISPONÍVEL",cor:"verde",nota:"—"},
      {tag:"FC-005",status:"DISPONÍVEL",cor:"verde",nota:"—"},
      {tag:"FC-006",status:"DISPONÍVEL",cor:"verde",nota:"—"}]},
    {nome:"JAMESON 01", badge:"OPERANDO", itens:[
      {tag:"FC-010",status:"CORRIGIDO",cor:"verde",nota:"01 linha de ar e 01 downcomer obstruídos — inspeção da operação"},
      {tag:"VÁCUO",status:"MANUAL 30%",cor:"amarelo",nota:"Controlador de ar em manual → vácuo em -10,00"},
      {tag:"PENDÊNCIAS",status:"ABERTO",cor:"amarelo",nota:"Distribuidores de água danificados (compra) · 03 downcomers sem conexão"}]},
    {nome:"CIRCUITO CLEANER", badge:"3/3 C/ RESTRIÇÕES", itens:[
      {tag:"FC-011",status:"ATENÇÃO",cor:"amarelo",nota:"Linha de água de calha obstruída"},
      {tag:"FC-012",status:"ATENÇÃO",cor:"amarelo",nota:"Ruído anormal no acoplamento do rotor — preventiva agendada"},
      {tag:"FC-013",status:"ATENÇÃO",cor:"amarelo",nota:"Tubulação de ar obstruída"}]},
    {nome:"CIRCUITO SCAVENGER", badge:"2/3 DISPONÍVEIS", itens:[
      {tag:"FC-018",status:"DISPONÍVEL",cor:"verde",nota:"—"},
      {tag:"FC-019",status:"DISPONÍVEL",cor:"verde",nota:"—"},
      {tag:"FC-020",status:"ATENÇÃO",cor:"amarelo",nota:"Controlador de ar c/ erro de balanceamento — LCV-0041 Dardo A desvio elevado"}]},
    {nome:"JAMESON 02", badge:"OPERANDO", itens:[
      {tag:"FC-025",status:"ATENÇÃO",cor:"amarelo",nota:"4230-FIC-0017 em manual (32%) — em automático cicla e zera o vácuo"},
      {tag:"PENDÊNCIAS",status:"ABERTO",cor:"amarelo",nota:"Distribuidores de água danificados (compra) · 01 downcomer sem conexão"}]},
    {nome:"FLOTAÇÃO PIRITA", badge:"5/6 DISPONÍVEIS", itens:[
      {tag:"FC-026",status:"FORA DE SERVIÇO",cor:"vermelho",nota:"4230-LCV-0072 Dardo B"},
      {tag:"FC-027",status:"DISPONÍVEL",cor:"verde",nota:"—"},
      {tag:"FC-028",status:"BYPASS",cor:"amarelo",nota:"4230-LCV-002 Dardo B travada aberta 100% — Dardo A insuficiente"},
      {tag:"FC-029 · FC-030 · FC-031",status:"DISPONÍVEIS",cor:"verde",nota:"—"}]},
    {nome:"BOMBEAMENTO PIRITA", badge:"1/2 OPERANDO", itens:[
      {tag:"PU-020",status:"MANUAL 85%",cor:"amarelo",nota:"Em automático (nível HP-009) força a bomba e quebra correias"},
      {tag:"PU-020R",status:"INDISPONÍVEL",cor:"vermelho",nota:"Sucção travada — mecânica corretiva ciente"}]}
  ],
  pendencias: [
    "Distribuidores de água danificados (Jameson 01 e 02) — aquisição de sobressalentes",
    "Downcomers sem conexão — 03 no Jameson 01 e 01 no Jameson 02",
    "FC-012 — preventiva do acoplamento do rotor (aguardando programação)",
    "FC-026 — 4230-LCV-0072 Dardo B fora de serviço",
    "PU-020R — sucção travada (mecânica corretiva)"
  ],
  pills: [
    {rotulo:"ROUGHER",valor:"5/6",cor:"verde"},
    {rotulo:"CLEANER",valor:"3/3",cor:"amarelo"},
    {rotulo:"SCAVENGER",valor:"2/3",cor:"amarelo"},
    {rotulo:"PIRITA",valor:"5/6",cor:"verde"},
    {rotulo:"BOMBAS",valor:"1/2",cor:"vermelho"}
  ],
  rodape1: "SEGURANÇA  ·  QUALIDADE  ·  PRODUÇÃO",
  rodape2: "O VERDE NOS PERTENCE"
};

// ---------- checklist de inspeção de célula ----------
const CHECKLIST = [
  {k:'espuma',      l:'Camada de espuma',          ops:['OK','Irregular','Sem espuma','Não avaliado']},
  {k:'rotor',       l:'Rotor e estator (desgaste)',ops:['Sem desgaste aparente','Desgaste mínimo','Desgaste acentuado (programar troca)','Desgaste crítico (não liberar)']},
  {k:'revestimento',l:'Revestimentos da célula',   ops:['OK','Atenção','Danificado','Não avaliado']},
  {k:'calhas',      l:'Calhas de transbordo',      ops:['OK','Parcialmente obstruída','Obstruída','Não avaliado']},
  {k:'dardo',       l:'Válvulas dart (LCV)',       ops:['OK','Desvio','Fora de serviço','Não avaliado']},
  {k:'ar',          l:'Linha de ar / controlador', ops:['OK','Manual','Obstruída','Erro','Não avaliado']},
  {k:'vazamento',   l:'Vazamentos',                ops:['Nenhum','Pequeno','Grande']},
  {k:'fixacoes',    l:'Fixações / parafusos',      ops:['OK','Não conformidade']}
];
function corDeStatus(st){
  const s = String(st||'').toUpperCase();
  if (s.startsWith('FORA') || s.startsWith('INDISPON')) return 'vermelho';
  if (s.startsWith('ATEN') || s.startsWith('RESTRI') || s.startsWith('BYPASS') || s.startsWith('MANUAL')) return 'amarelo';
  if (s.startsWith('ABERTO')) return 'amarelo';
  return 'verde';
}

// ---------- estado ----------
let S = carregar();
let pagina = 'dashboard';
let tSalvar = null;
let icone;

function carregar(){
  let s = null;
  try{
    const v2 = localStorage.getItem(CHAVE_V2);
    if (v2) s = JSON.parse(v2);
  }catch(e){}
  if (s) return s;
  let base = null;
  try{
    const v1 = localStorage.getItem(CHAVE_V1);
    if (v1) base = JSON.parse(v1);
  }catch(e){}
  if (!base) base = JSON.parse(JSON.stringify(DADOS_PADRAO));
  return migrar(base);
}

// adiciona inspecoes (a partir do relatório v1) e planejamento vazio
function migrar(base){
  if (!base.inspecoes){
    base.inspecoes = [];
    for (const c of (base.circuitos||[]))
      for (const it of (c.itens||[])){
        if (it.tag === 'PENDÊNCIAS' || it.tag === 'VÁCUO') continue;
        base.inspecoes.push({
          tag: it.tag, data: (base.topo&&base.topo.data)||'16/08/2026', inspetor:'',
          status: it.status, cor: it.cor||corDeStatus(it.status), nota: it.nota,
          check:{}, obs: it.nota
        });
      }
  }
  if (!base.planejamento) base.planejamento = [];
  if (!base.inspecoes) base.inspecoes = [];
  return base;
}

function salvarLocal(){
  S.ultimo_em = new Date().toLocaleString('pt-BR');
  localStorage.setItem(CHAVE_V2, JSON.stringify(S));
  const el = document.getElementById('ult');
  if (el) el.textContent = 'Salvo em ' + new Date().toLocaleTimeString('pt-BR');
}
function agendarSalvar(){
  clearTimeout(tSalvar);
  tSalvar = setTimeout(salvarLocal, 400);
}

// ---------- utilidades ----------
function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function isoHoje(){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function isoToBR(iso){ if(!iso) return ''; const [a,m,d]=iso.split('-'); return d+'/'+m+'/'+a; }
function brToIso(br){ if(!br) return ''; const [d,m,a]=br.split('/'); return a+'-'+m+'-'+d; }
function chaveData(br){ return br.split('/').reverse().join('-'); }
function hojeBR(){ return isoToBR(isoHoje()); }

function tagsCelulas(){
  const t = new Set();
  for (const c of (S.circuitos||[]))
    for (const it of (c.itens||[]))
      if (it.tag && it.tag !== 'PENDÊNCIAS' && it.tag !== 'VÁCUO') t.add(it.tag);
  for (const ins of (S.inspecoes||[])) if (ins.tag) t.add(ins.tag);
  return [...t].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
}
function inspecoesDe(tag){
  return (S.inspecoes||[]).filter(i=>i.tag===tag).sort((a,b)=>chaveData(b.data).localeCompare(chaveData(a.data)));
}
function ultimaInspecao(tag){ return inspecoesDe(tag)[0]||null; }

function badge(cor, txt){
  const mapa = {verde:'verde',amarelo:'amarelo',vermelho:'vermelho'};
  return `<span class="bdg ${mapa[cor]||'neutro'}"><span class="dot"></span>${esc(txt)}</span>`;
}

// ---------- navegação ----------
function navegar(pg){
  pagina = pg;
  document.querySelectorAll('.page').forEach(p=>p.style.display='none');
  document.getElementById('page-'+pg).style.display='';
  document.querySelectorAll('.navbtn').forEach(b=>b.classList.toggle('ativo', b.dataset.page===pg));
  renderPagina();
  window.scrollTo(0,0);
}
function renderPagina(){
  if (pagina==='dashboard') renderDashboard();
  else if (pagina==='planejamento') renderPlanejamento();
  else if (pagina==='inspecoes') renderInspecoes();
  else if (pagina==='status') renderStatus();
  else if (pagina==='relatorios') renderRelatorios();
}

document.addEventListener('click', e=>{
  const nav = e.target.closest('.navbtn');
  if (nav){ navegar(nav.dataset.page); return; }
});

// ---------- modal ----------
function abrirModal(html){
  document.getElementById('modal-corpo').innerHTML = html;
  document.getElementById('modal').classList.add('aberto');
}
function fecharModal(){ document.getElementById('modal').classList.remove('aberto'); }
document.getElementById('modal').addEventListener('click', e=>{
  if (e.target === document.getElementById('modal')) fecharModal();
});

// ---------- DASHBOARD ----------
function renderDashboard(){
  const ins = S.inspecoes||[];
  const porCor = {verde:0, amarelo:0, vermelho:0};
  for (const tag of tagsCelulas()){
    const u = ultimaInspecao(tag);
    if (u) porCor[u.cor||corDeStatus(u.status)]++;
  }
  const ultimas = [...ins].sort((a,b)=>chaveData(b.data).localeCompare(chaveData(a.data))).slice(0,5);
  let h = `
  <div class="grid g4" style="margin-bottom:16px">
    <div class="stat"><span class="lbl">Disponíveis</span><span class="num verde">${porCor.verde}</span></div>
    <div class="stat"><span class="lbl">Em atenção</span><span class="num amarelo">${porCor.amarelo}</span></div>
    <div class="stat"><span class="lbl">Fora de serviço</span><span class="num vermelho">${porCor.vermelho}</span></div>
    <div class="stat"><span class="lbl">Pendências abertas</span><span class="num">${(S.pendencias||[]).length}</span></div>
  </div>`;

  if ((S.pills||[]).length){
    h += `<div class="card"><h2>Disponibilidade geral</h2><div class="pills">`;
    for (const pl of S.pills) h += `<div class="pill ${pl.cor}"><span class="r">${esc(pl.rotulo)}</span><span class="v">${esc(pl.valor)} DISPONÍVEIS</span></div>`;
    h += `</div></div>`;
  }

  h += `<div class="card"><h2>Últimas inspeções</h2><div class="twrap"><table>
    <tr><th>Data</th><th>Célula</th><th>Inspetor</th><th>Status</th><th>Observações</th></tr>`;
  if (!ultimas.length) h += `<tr><td colspan=5 style="color:hsl(var(--muted-foreground))">Nenhuma inspeção registrada.</td></tr>`;
  for (const u of ultimas){
    h += `<tr><td><b>${esc(u.data)}</b></td><td><b>${esc(u.tag)}</b></td><td>${esc(u.inspetor||'—')}</td><td>${badge(u.cor||corDeStatus(u.status), u.status)}</td><td>${esc(u.obs||u.nota||'—')}</td></tr>`;
  }
  h += `</table></div></div>`;

  if ((S.pendencias||[]).length){
    h += `<div class="card"><h2>Pendências em aberto</h2>`;
    S.pendencias.forEach((p,i)=>{ h += `<div class="pend"><span class="n">${i+1}</span><span>${esc(p)}</span></div>`; });
    h += `</div>`;
  }
  document.getElementById('dash').innerHTML = h;
}

// ---------- PLANEJAMENTO ----------
function statusProgramacao(p){
  if (p.efetiva) return chaveData(p.efetiva) <= chaveData(p.programada) ? 'Conforme Programada' : 'Fora do Prazo';
  if (chaveData(p.programada) < chaveData(hojeBR())) return 'Pendente';
  return 'Aguardando Execução';
}
function corProgramacao(st){
  if (st==='Conforme Programada') return 'verde';
  if (st==='Fora do Prazo') return 'vermelho';
  if (st==='Pendente') return 'amarelo';
  return 'neutro';
}
function renderPlanejamento(){
  const pl = S.planejamento||[];
  const realizadas = pl.filter(p=>p.efetiva);
  const conformes = realizadas.filter(p=>statusProgramacao(p)==='Conforme Programada');
  const ader = realizadas.length ? Math.round(100*conformes.length/realizadas.length) : null;

  let h = `<div class="card"><h2>Aderência à programação</h2>
    <div class="grid g3">
      <div class="stat"><span class="lbl">Programadas</span><span class="num">${pl.length}</span></div>
      <div class="stat"><span class="lbl">Realizadas</span><span class="num">${realizadas.length}</span></div>
      <div class="stat"><span class="lbl">Conformes</span><span class="num verde">${conformes.length}</span></div>
    </div>`;
  if (ader !== null){
    h += `<div style="margin-top:12px"><b style="font-size:15px">${ader}%</b> <span style="color:hsl(var(--muted-foreground))">de aderência</span>
      <div class="barra"><div style="width:${ader}%"></div></div></div>`;
  } else {
    h += `<div style="margin-top:12px;color:hsl(var(--muted-foreground))">Nenhuma semana programada.</div>`;
  }
  h += `</div>`;

  h += `<div class="card"><h2>Programação</h2>
    <div class="btnrow" style="margin-bottom:14px">
      <button class="btn prim" data-act="prog-semana">📅 Programar semana (todas as células +7 dias)</button>
      <button class="btn outline" data-act="prog-add">+ Programar célula</button>
    </div>
    <div class="twrap"><table>
    <tr><th>Célula</th><th>Data programada</th><th>Data efetiva</th><th>Status</th><th></th></tr>`;
  if (!pl.length) h += `<tr><td colspan=5 style="color:hsl(var(--muted-foreground))">Nenhuma semana programada.</td></tr>`;
  pl.forEach((p,pi)=>{
    h += `<tr>
      <td><b>${esc(p.tag)}</b></td>
      <td><input type="date" data-act="prog-editar" data-i="${pi}" data-k="programada" value="${brToIso(p.programada)}" style="max-width:150px"></td>
      <td><input type="date" data-act="prog-editar" data-i="${pi}" data-k="efetiva" value="${brToIso(p.efetiva)}" style="max-width:150px"></td>
      <td>${badge(corProgramacao(statusProgramacao(p)), statusProgramacao(p))}</td>
      <td><button class="btn ghost mini" data-act="prog-del" data-i="${pi}" title="Remover">✕</button></td>
    </tr>`;
  });
  h += `</table></div></div>`;
  document.getElementById('plan').innerHTML = h;
}

function programarSemana(){
  const tags = tagsCelulas();
  const futura = isoToBR(isoHoje()); // base de referência
  const alvo = new Date(); alvo.setDate(alvo.getDate()+7);
  const alvoBR = isoToBR(alvo.toISOString().slice(0,10));
  for (const tag of tags){
    if (!(S.planejamento||[]).some(p=>p.tag===tag))
      S.planejamento.push({tag, programada: alvoBR, efetiva:''});
  }
  agendarSalvar(); renderPlanejamento();
  mostrar('Programação da semana criada ✓');
}

// ---------- INSPEÇÕES ----------
function renderInspecoes(){
  const t = S.topo||{};
  let h = `<div class="card" style="border-left:4px solid hsl(var(--primary))">
    <h2>Registro por célula — ${esc(t.data||'')}</h2>
    <p style="font-size:12.5px;color:hsl(var(--muted-foreground))">Clique em <b>DISPONÍVEL</b>, <b>ATENÇÃO</b> ou <b>INDISPONÍVEL</b> para registrar a célula. O relatório de turno e o histórico da célula são atualizados na hora.</p>
  </div>`;
  (S.circuitos||[]).forEach((c,ci)=>{
    h += `<div class="circ"><div class="circ-head">
      <input type="text" data-path="circuitos.${ci}.nome" value="${esc(c.nome)}" placeholder="Nome do circuito" style="max-width:260px">
      <input type="text" data-path="circuitos.${ci}.badge" value="${esc(c.badge)}" placeholder="Badge (ex.: 5/6 DISPONÍVEIS)" style="max-width:200px">
      <button class="btn danger mini" data-act="ins-del-circ" data-i="${ci}" title="Remover circuito">✕</button>
      </div><div class="circ-itens">`;
    (c.itens||[]).forEach((it,ii)=>{
      if (it.tag === 'PENDÊNCIAS' || it.tag === 'VÁCUO'){
        // linhas que não são células: mantém o formato antigo (status livre + cor + observação)
        h += `<div class="item">
          <input type="text" data-path="circuitos.${ci}.itens.${ii}.tag" value="${esc(it.tag)}" style="max-width:110px">
          <input type="text" data-path="circuitos.${ci}.itens.${ii}.status" value="${esc(it.status)}" placeholder="STATUS" style="max-width:120px">
          ${corSel('circuitos.'+ci+'.itens.'+ii+'.cor', it.cor)}
          <input type="text" data-path="circuitos.${ci}.itens.${ii}.nota" value="${esc(it.nota)}" placeholder="Observação">
        </div>`;
      } else {
        const cor = it.cor || corDeStatus(it.status);
        h += `<div class="item">
          <input type="text" data-path="circuitos.${ci}.itens.${ii}.tag" value="${esc(it.tag)}" style="max-width:110px">
          <div class="seg">
            ${segBtn(ci,ii,'DISPONÍVEL',cor)}
            ${segBtn(ci,ii,'ATENÇÃO',cor)}
            ${segBtn(ci,ii,'INDISPONÍVEL',cor)}
          </div>
          <input type="text" data-act="fc-obs" data-ci="${ci}" data-ii="${ii}" value="${esc(it.nota==='—'?'':it.nota)}" placeholder="Observação">
          <button class="btn danger mini" data-act="ins-del-item" data-i="${ci}" data-j="${ii}" title="Remover item">✕</button>
        </div>`;
      }
    });
    h += `</div><button class="btn outline mini" style="margin-top:8px" data-act="ins-add-item" data-i="${ci}">+ adicionar item</button></div>`;
  });
  h += `<button class="btn outline mini" data-act="ins-add-circ">+ adicionar circuito</button>`;
  document.getElementById('insp').innerHTML = h;
}

function segBtn(ci, ii, status, cor){
  const mapa = {DISPONÍVEL:'verde', ATENÇÃO:'amarelo', INDISPONÍVEL:'vermelho'};
  const on = (cor === mapa[status]) ? ' on' : '';
  return `<button class="segbtn ${mapa[status]}${on}" data-act="fc-status" data-ci="${ci}" data-ii="${ii}" data-status="${status}">${status}</button>`;
}

// registra/atualiza a inspeção do dia no histórico da célula
function registrarCelula(it){
  const data = (S.topo && S.topo.data) || hojeBR();
  if (!it.nota || it.nota === '—') it.nota = '—';
  let reg = (S.inspecoes||[]).find(i=>i.tag===it.tag && i.data===data);
  if (!reg){ reg = {tag:it.tag, data, inspetor:'', check:{}, obs:''}; S.inspecoes.push(reg); }
  reg.status = it.status; reg.cor = it.cor; reg.nota = it.nota; reg.obs = (it.nota==='—'?'':it.nota);
  const prog = (S.planejamento||[]).find(p=>p.tag===it.tag && !p.efetiva);
  if (prog) prog.efetiva = data;
}


function resumoChecklist(check){
  const partes = [];
  for (const c of CHECKLIST){
    const v = (check||{})[c.k];
    if (!v || v==='OK' || v==='Nenhum' || v==='Sem desgaste aparente' || v==='Não avaliado') continue;
    partes.push(`${c.l}: ${v}`);
  }
  return partes.join(' · ');
}


// ---------- STATUS ----------
function renderStatus(){
  const tags = tagsCelulas();
  let h = `<div class="card"><h2>Infográfico — clique em uma célula para ver detalhes</h2>
    <div class="celulas">`;
  for (const tag of tags){
    const u = ultimaInspecao(tag);
    const cor = u ? (u.cor||corDeStatus(u.status)) : 'neutro';
    h += `<div class="cel ${cor}" data-act="cel-detalhe" data-tag="${esc(tag)}">
      <div class="tag">${esc(tag)}</div>
      <div class="st">${u ? esc(u.status) : 'SEM INSPEÇÃO'}</div>
      ${u?`<div class="st" style="font-weight:400">${esc(u.data)}${u.inspetor?' · '+esc(u.inspetor):''}</div>`:''}
    </div>`;
  }
  h += `</div></div>`;
  document.getElementById('stts').innerHTML = h;
}

function abrirDetalheCelula(tag){
  const hist = inspecoesDe(tag);
  const u = hist[0];
  let h = `<h3>${esc(tag)}</h3><div class="sub">Condições por inspeção — última inspeção e linha do tempo.</div>`;
  if (!u){
    h += `<p style="color:hsl(var(--muted-foreground))">Nenhum status registrado para esta célula.</p>`;
    abrirModal(h); return;
  }
  h += `<div class="btnrow" style="margin-bottom:14px">
    ${badge(u.cor||corDeStatus(u.status), u.status)}
    <span style="color:hsl(var(--muted-foreground))">Última inspeção: <b>${esc(u.data)}</b>${u.inspetor?' · '+esc(u.inspetor):''}</span>
  </div>`;

  const check = u.check||{};
  if (Object.keys(check).length){
    h += `<h3 style="margin:14px 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:hsl(var(--muted-foreground))">Checklist da última inspeção</h3>
      <div class="twrap"><table>`;
    for (const c of CHECKLIST){
      const v = check[c.k];
      if (!v) continue;
      const problema = v && v!=='OK' && v!=='Nenhum' && v!=='Sem desgaste aparente' && v!=='Não avaliado';
      h += `<tr><td style="color:hsl(var(--muted-foreground))">${esc(c.l)}</td><td><b style="${problema?'color:var(--warn)':''}">${esc(v)}</b></td></tr>`;
    }
    h += `</table></div>`;
  }
  if (u.obs){
    h += `<h3 style="margin:14px 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:hsl(var(--muted-foreground))">Observações</h3>
      <p>${esc(u.obs)}</p>`;
  }

  if (hist.length > 1){
    h += `<h3 style="margin:18px 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:hsl(var(--muted-foreground))">Linha do tempo — ${esc(tag)}</h3>
      <div class="tl">`;
    for (const i of hist){
      h += `<div class="tl-item ${i.cor||corDeStatus(i.status)}">
        <div class="t-data">${esc(i.data)} — ${esc(i.status)}${i.inspetor?' · '+esc(i.inspetor):''}</div>
        <div class="t-det">${esc(i.obs||i.nota||'—')}</div>
      </div>`;
    }
    h += `</div>`;
  } else {
    h += `<h3 style="margin:18px 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:hsl(var(--muted-foreground))">Linha do tempo — ${esc(tag)}</h3>
      <p style="color:hsl(var(--muted-foreground))">Nenhum histórico anterior registrado para esta célula.</p>`;
  }
  abrirModal(h);
}

// ---------- RELATÓRIOS ----------
function renderRelatorios(){
  const t = S.topo||{};
  let h = `
  <div class="card"><h2>Cabeçalho do relatório de turno</h2>
    <div class="grid g2">
      <div class="campo"><label>Linha 1 (empresa)</label><input type="text" data-path="topo.rotulo1" value="${esc(t.rotulo1)}"></div>
      <div class="campo"><label>Linha 2 (setor)</label><input type="text" data-path="topo.rotulo2" value="${esc(t.rotulo2)}"></div>
      <div class="campo"><label>Data</label><input type="text" data-path="topo.data" value="${esc(t.data)}"></div>
      <div class="campo"><label>Semana</label><input type="text" data-path="topo.semana" value="${esc(t.semana)}"></div>
    </div>
    <div class="campo"><label>Título</label><input type="text" data-path="titulo" value="${esc(S.titulo)}"></div>
    <div class="campo"><label>Subtítulo</label><input type="text" data-path="subtitulo" value="${esc(S.subtitulo)}"></div>
    <div class="campo"><label>Slogan</label><input type="text" data-path="slogan" value="${esc(S.slogan)}"></div>
    <div class="grid g2">
      <div class="campo"><label>Rodapé linha 1</label><input type="text" data-path="rodape1" value="${esc(S.rodape1)}"></div>
      <div class="campo"><label>Rodapé linha 2</label><input type="text" data-path="rodape2" value="${esc(S.rodape2)}"></div>
    </div>
  </div>

  <div class="card"><h2>Relatório de turno</h2>
    <div class="btnrow">
      <button class="btn outline" data-act="preview">🔄 Preview</button>
      <button class="btn prim" data-act="baixar-png">🖼️ Baixar PNG</button>
      <button class="btn prim" data-act="baixar-doc">📄 Baixar DOC</button>
      <button class="btn prim" data-act="baixar-pdf">📕 Baixar PDF</button>
    </div>
    <img id="pv" alt="preview do relatório">
  </div>

  <div class="card"><h2>Relatório de inspeções</h2>
    <p style="color:hsl(var(--muted-foreground));margin-bottom:12px">Relatório de inspeção e status operacional — todas as células, última inspeção de cada uma.</p>
    <div class="btnrow">
      <button class="btn prim" data-act="baixar-pdf-inspecoes">📋 Baixar PDF de inspeções</button>
    </div>
  </div>

  <div class="card"><h2>Dados</h2>
    <div class="btnrow">
      <button class="btn outline" data-act="exportar">⬇ Exportar JSON</button>
      <button class="btn outline" data-act="importar">⬆ Importar JSON</button>
      <button class="btn danger" data-act="padrao">⟲ Restaurar padrão</button>
    </div>
    <div class="btnrow" style="margin-top:10px"><span id="msg"></span><span id="ult" style="color:hsl(var(--muted-foreground));font-size:12px"></span></div>
  </div>

  <div class="card"><h2 style="cursor:pointer" id="av-titulo" data-act="toggle-av">▸ Edição avançada (circuitos, pendências e disponibilidade)</h2>
    <div id="av-corpo" style="display:none">
      <div id="av-circuitos"></div>
      <div id="av-pendencias"></div>
      <div id="av-pills"></div>
    </div>
  </div>`;
  document.getElementById('rel').innerHTML = h;
  renderEdicaoAvancada();
}

// --- edição avançada (port do editor antigo) ---
function renderEdicaoAvancada(){
  renderAvCircuitos(); renderAvPendencias(); renderAvPills();
}
function corSel(path, cur){
  let o = `<select data-path="${path}" class="csel c-${esc(cur)}">`;
  for (const [v,l] of [["verde","Verde"],["amarelo","Amarelo"],["vermelho","Vermelho"]])
    o += `<option value="${v}"${v===cur?' selected':''}>${l}</option>`;
  return o+'</select>';
}
function renderAvCircuitos(){
  let h = `<h2 style="margin-top:6px">Circuitos</h2>`;
  (S.circuitos||[]).forEach((c,ci)=>{
    h += `<div class="circ"><div class="circ-head">
      <input type="text" data-path="circuitos.${ci}.nome" value="${esc(c.nome)}" placeholder="Nome do circuito">
      <input type="text" data-path="circuitos.${ci}.badge" value="${esc(c.badge)}" placeholder="Badge (ex.: 5/6 DISPONÍVEIS)" style="max-width:220px">
      <button class="btn danger mini" data-act="del-circ" data-i="${ci}" title="Remover circuito">✕</button>
      </div><div class="circ-itens">`;
    (c.itens||[]).forEach((it,ii)=>{
      h += `<div class="item">
        <input type="text" data-path="circuitos.${ci}.itens.${ii}.tag" value="${esc(it.tag)}" placeholder="TAG">
        <input type="text" data-path="circuitos.${ci}.itens.${ii}.status" value="${esc(it.status)}" placeholder="STATUS">
        ${corSel('circuitos.'+ci+'.itens.'+ii+'.cor', it.cor)}
        <input type="text" data-path="circuitos.${ci}.itens.${ii}.nota" value="${esc(it.nota)}" placeholder="Observação">
        <button class="btn danger mini" data-act="del-item" data-i="${ci}" data-j="${ii}" title="Remover item">✕</button>
      </div>`;
    });
    h += `</div><button class="btn outline mini" style="margin-top:8px" data-act="add-item" data-i="${ci}">+ adicionar item</button></div>`;
  });
  h += `<button class="btn outline mini" data-act="add-circ">+ adicionar circuito</button>`;
  document.getElementById('av-circuitos').innerHTML = h;
}
function renderAvPendencias(){
  let h = `<h2 style="margin-top:14px">Pendências em aberto</h2>`;
  (S.pendencias||[]).forEach((p,pi)=>{
    h += `<div class="pend-item">
      <input type="text" data-path="pendencias.${pi}" value="${esc(p)}" placeholder="Pendência">
      <button class="btn danger mini" data-act="del-pend" data-i="${pi}">✕</button></div>`;
  });
  h += `<button class="btn outline mini" data-act="add-pend">+ adicionar pendência</button>`;
  document.getElementById('av-pendencias').innerHTML = h;
}
function renderAvPills(){
  let h = `<h2 style="margin-top:14px">Disponibilidade geral (pílulas)</h2>`;
  (S.pills||[]).forEach((pl,pi)=>{
    h += `<div class="pill-item">
      <input type="text" data-path="pills.${pi}.rotulo" value="${esc(pl.rotulo)}" placeholder="Rótulo">
      <input type="text" data-path="pills.${pi}.valor" value="${esc(pl.valor)}" placeholder="x/y" style="max-width:90px">
      ${corSel('pills.'+pi+'.cor', pl.cor)}
      <button class="btn danger mini" data-act="del-pill" data-i="${pi}">✕</button></div>`;
  });
  h += `<button class="btn outline mini" data-act="add-pill">+ adicionar pílula</button>`;
  document.getElementById('av-pills').innerHTML = h;
}

function setPath(o, path, v){
  const ks = path.split('.');
  let t = o;
  for (let k = 0; k < ks.length-1; k++) t = t[ks[k]];
  t[ks[ks.length-1]] = v;
}

// ---------- eventos globais ----------
document.addEventListener('input', e=>{
  if (e.target.dataset.act === 'fc-obs'){
    const c = S.circuitos[+e.target.dataset.ci];
    const it = c && c.itens[+e.target.dataset.ii];
    if (!it) return;
    it.nota = e.target.value.trim() || '—';
    registrarCelula(it);
    agendarSalvar();
    return;
  }
  const p = e.target.dataset.path;
  if (!p) return;
  setPath(S, p, e.target.value);
  if (p.endsWith('.cor')) e.target.className = 'csel c-'+e.target.value;
  agendarSalvar();
});

document.addEventListener('click', e=>{
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const a = el.dataset.act, i = +el.dataset.i, j = +el.dataset.j;

  if (a==='prog-semana') programarSemana();
  else if (a==='prog-add'){
    const tags = tagsCelulas();
    const semProg = tags.find(t=>!(S.planejamento||[]).some(p=>p.tag===t));
    if (semProg !== undefined){
      S.planejamento.push({tag: semProg, programada: hojeBR(), efetiva:''});
      agendarSalvar(); renderPlanejamento();
    }
    else mostrar('Todas as células já estão programadas');
  }
  else if (a==='prog-del'){ S.planejamento.splice(i,1); agendarSalvar(); renderPlanejamento(); }
  else if (a==='fc-status'){
    const c = S.circuitos[+el.dataset.ci];
    const it = c && c.itens[+el.dataset.ii];
    if (!it) return;
    const mapa = {DISPONÍVEL:'verde', ATENÇÃO:'amarelo', INDISPONÍVEL:'vermelho'};
    it.status = el.dataset.status;
    it.cor = mapa[el.dataset.status];
    registrarCelula(it);
    salvarLocal();
    renderInspecoes();
    mostrar(it.tag + ' → ' + it.status + ' ✓');
  }
  else if (a==='ins-add-circ'){ S.circuitos.push({nome:'NOVO CIRCUITO', badge:'', itens:[{tag:'TAG-000',status:'DISPONÍVEL',cor:'verde',nota:'—'}]}); salvarLocal(); renderInspecoes(); }
  else if (a==='ins-del-circ'){ S.circuitos.splice(i,1); salvarLocal(); renderInspecoes(); }
  else if (a==='ins-add-item'){ S.circuitos[i].itens.push({tag:'TAG-000',status:'DISPONÍVEL',cor:'verde',nota:'—'}); salvarLocal(); renderInspecoes(); }
  else if (a==='ins-del-item'){ S.circuitos[i].itens.splice(j,1); salvarLocal(); renderInspecoes(); }
  else if (a==='cel-detalhe') abrirDetalheCelula(el.dataset.tag);

  else if (a==='preview') preview();
  else if (a==='baixar-png') baixarPNG();
  else if (a==='baixar-doc') baixarDOC();
  else if (a==='baixar-pdf') baixarPDF();
  else if (a==='baixar-pdf-inspecoes') baixarPDFInspecoes();
  else if (a==='exportar') exportarJSON();
  else if (a==='importar') document.getElementById('imp').click();
  else if (a==='padrao') restaurarPadrao();
  else if (a==='toggle-av'){
    const corpo = document.getElementById('av-corpo');
    const tit = document.getElementById('av-titulo');
    const aberto = corpo.style.display !== 'none';
    corpo.style.display = aberto ? 'none' : '';
    tit.textContent = (aberto ? '▸' : '▾') + ' Edição avançada (circuitos, pendências e disponibilidade)';
  }

  else if (a==='add-circ'){ S.circuitos.push({nome:'NOVO CIRCUITO', badge:'', itens:[{tag:'TAG-000',status:'DISPONÍVEL',cor:'verde',nota:''}]}); agendarSalvar(); renderAvCircuitos(); }
  else if (a==='del-circ'){ S.circuitos.splice(i,1); agendarSalvar(); renderAvCircuitos(); }
  else if (a==='add-item'){ S.circuitos[i].itens.push({tag:'TAG-000',status:'DISPONÍVEL',cor:'verde',nota:''}); agendarSalvar(); renderAvCircuitos(); }
  else if (a==='del-item'){ S.circuitos[i].itens.splice(j,1); agendarSalvar(); renderAvCircuitos(); }
  else if (a==='add-pend'){ S.pendencias.push(''); agendarSalvar(); renderAvPendencias(); }
  else if (a==='del-pend'){ S.pendencias.splice(i,1); agendarSalvar(); renderAvPendencias(); }
  else if (a==='add-pill'){ S.pills.push({rotulo:'NOVO',valor:'0/0',cor:'verde'}); agendarSalvar(); renderAvPills(); }
  else if (a==='del-pill'){ S.pills.splice(i,1); agendarSalvar(); renderAvPills(); }
});

// edição de datas da programação (input com data-act, sem data-path)
document.addEventListener('change', e=>{
  const el = e.target;
  if (el.dataset.act === 'prog-editar'){
    const p = (S.planejamento||[])[+el.dataset.i];
    if (p){
      const v = isoToBR(el.value);
      if (el.dataset.k === 'programada') p.programada = v; else p.efetiva = v;
      agendarSalvar(); renderPlanejamento();
    }
  }
});

// ---------- mensagens ----------
let timerMsg = null;
function mostrar(msg){
  const el = document.getElementById('msg');
  if (!el) return;
  el.textContent = msg;
  clearTimeout(timerMsg);
  timerMsg = setTimeout(()=>el.textContent='', 3000);
}

// ---------- downloads ----------
function baixarBlob(blob, nome){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 5000);
}

async function preview(){
  const cv = await renderPNG(S, icone);
  const img = document.getElementById('pv');
  img.src = cv.toDataURL('image/png');
  img.classList.add('show');
}
async function baixarPNG(){
  mostrar('Gerando PNG…');
  const cv = await renderPNG(S, icone);
  cv.toBlob(b => { baixarBlob(b, 'relatorio_flotacao.png'); mostrar('PNG baixado ✓'); }, 'image/png');
}
async function baixarPDF(){
  mostrar('Gerando PDF…');
  const cv = await renderPNG(S, icone);
  const { jsPDF } = window.jspdf;
  const imgData = cv.toDataURL('image/jpeg', 0.92);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const margem = 10;
  const escala = Math.min((pw - 2 * margem) / cv.width, (ph - 2 * margem) / cv.height);
  const w = cv.width * escala;
  const h = cv.height * escala;
  pdf.addImage(imgData, 'JPEG', (pw - w) / 2, (ph - h) / 2, w, h);
  pdf.save('relatorio_flotacao.pdf');
  mostrar('PDF baixado ✓');
}

function gerarDOC(){
  const t = S.topo || {};
  let h = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>Relatorio</title></head><body>';
  h += `<p align=center><b><font color="#5A6472">${esc(t.rotulo1)} — ${esc(t.rotulo2)}</font></b></p>`;
  h += `<p align=center><b><font size=5 color="#00727A">${esc(S.titulo)}</font></b></p>`;
  h += `<p align=center><font color="#00545B">${esc(S.subtitulo)}</font></p>`;
  h += `<p align=center><b><font color="#5A6472">${esc(t.data)} · ${esc(t.semana)}</font></b></p>`;
  if (S.slogan) h += `<p align=center><i><font color="#00545B">${esc(S.slogan)}</font></i></p>`;
  h += `<p><b><font color="#00727A">STATUS POR CIRCUITO</font></b></p>`;
  for (const c of S.circuitos){
    h += `<p><b><font color="#00545B">${esc(c.nome)}</font></b> <b><font size=2 color="#5A6472">${esc(c.badge||'')}</font></b></p>`;
    h += `<table border=1 cellspacing=0 cellpadding=4><tr bgcolor="#00727A">`
       + `<td><b><font color="#FFFFFF">EQUIPAMENTO</font></b></td><td><b><font color="#FFFFFF">STATUS</font></b></td><td><b><font color="#FFFFFF">OBSERVAÇÃO</font></b></td></tr>`;
    for (const it of c.itens){
      h += `<tr><td><b>${esc(it.tag)}</b></td><td><b><font color="${corDe(it.cor)}">${esc(it.status)}</font></b></td><td>${esc(it.nota)}</td></tr>`;
    }
    h += `</table>`;
  }
  if ((S.pendencias||[]).length){
    h += `<p><b><font color="#00727A">PENDÊNCIAS EM ABERTO</font></b></p><ol>`;
    for (const p of S.pendencias) h += `<li>${esc(p)}</li>`;
    h += `</ol>`;
  }
  if ((S.pills||[]).length){
    h += `<p><b><font color="#5A6472">DISPONIBILIDADE GERAL</font></b></p><p>`
       + S.pills.map((pl,i)=> (i?'&nbsp;&nbsp;·&nbsp;&nbsp;':'') + `<b><font color="${corDe(pl.cor)}">${esc(pl.rotulo)} ${esc(pl.valor)}</font></b>`).join('')
       + `</p>`;
  }
  h += `<br/><p align=center><font size=2 color="#5A6472">${esc(S.rodape1||'')}</font></p>`;
  h += `<p align=center><b><font size=4 color="#00727A">${esc(S.rodape2||'')}</font></b></p>`;
  h += `</body></html>`;
  return new Blob(['﻿', h], {type: 'application/msword'});
}
function baixarDOC(){
  baixarBlob(gerarDOC(), 'relatorio_flotacao.doc');
  mostrar('DOC baixado ✓');
}

// PDF do relatório de inspeções (tabela + checklist)
function baixarPDFInspecoes(){
  mostrar('Gerando PDF de inspeções…');
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = pdf.internal.pageSize.getWidth();
  const m = 14;
  let y = 18;

  pdf.setFont('helvetica','bold'); pdf.setFontSize(15);
  pdf.setTextColor(0,114,122);
  pdf.text('RELATÓRIO DE INSPEÇÃO E STATUS OPERACIONAL', pw/2, y, {align:'center'});
  y += 7;
  pdf.setFont('helvetica','normal'); pdf.setFontSize(10); pdf.setTextColor(90,100,114);
  pdf.text(`Flotação ERO Tucumã · Gerado em ${S.ultimo_em||''}`, pw/2, y, {align:'center'});
  y += 10;

  const cor = {verde:[30,158,79], amarelo:[232,163,61], vermelho:[214,69,69]};
  const tags = tagsCelulas();
  // cabeçalho da tabela
  pdf.setFont('helvetica','bold'); pdf.setFontSize(9); pdf.setTextColor(255,255,255);
  pdf.setFillColor(0,114,122);
  pdf.rect(m, y-4.5, pw-2*m, 7, 'F');
  pdf.text('CÉLULA', m+2, y);
  pdf.text('ÚLTIMA INSPEÇÃO', m+34, y);
  pdf.text('INSPETOR', m+62, y);
  pdf.text('STATUS', m+92, y);
  pdf.text('CHECKLIST / OBSERVAÇÕES', m+132, y);
  y += 6;

  pdf.setFont('helvetica','normal'); pdf.setFontSize(8.5);
  for (const tag of tags){
    const u = ultimaInspecao(tag);
    if (!u) continue;
    if (y > 275){ pdf.addPage(); y = 16; }
    const c = cor[u.cor||corDeStatus(u.status)]||cor.verde;
    const txt = [resumoChecklist(u.check), u.obs||''].filter(Boolean).join(' · ');
    pdf.setTextColor(30,41,59);
    pdf.text(tag, m+2, y);
    pdf.text(u.data, m+34, y);
    pdf.text((u.inspetor||'—').slice(0,20), m+62, y);
    pdf.setTextColor(c[0],c[1],c[2]); pdf.setFont('helvetica','bold');
    pdf.text(u.status, m+92, y);
    pdf.setFont('helvetica','normal'); pdf.setTextColor(30,41,59);
    const linhas = pdf.splitTextToSize(txt||'—', 62);
    pdf.text(linhas.slice(0,3), m+132, y);
    y += 4 + Math.min(linhas.length,3)*3.6;
    pdf.setDrawColor(220,228,228);
    pdf.line(m, y-2.5, pw-m, y-2.5);
  }

  if ((S.pendencias||[]).length){
    y += 8;
    if (y > 260){ pdf.addPage(); y = 16; }
    pdf.setFont('helvetica','bold'); pdf.setFontSize(11); pdf.setTextColor(0,114,122);
    pdf.text('PENDÊNCIAS EM ABERTO', m, y);
    y += 6;
    pdf.setFont('helvetica','normal'); pdf.setFontSize(9); pdf.setTextColor(30,41,59);
    for (const p of S.pendencias){
      const linhas = pdf.splitTextToSize('• ' + p, pw-2*m);
      pdf.text(linhas, m, y);
      y += linhas.length*4.2;
      if (y > 280){ pdf.addPage(); y = 16; }
    }
  }
  pdf.save('relatorio_inspecoes.pdf');
  mostrar('PDF de inspeções baixado ✓');
}

function exportarJSON(){
  baixarBlob(new Blob([JSON.stringify(S, null, 2)], {type: 'application/json'}), 'relatorio_flotacao.json');
  mostrar('JSON exportado ✓');
}
document.getElementById('imp').addEventListener('change', e=>{
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try{
      S = migrar(JSON.parse(r.result));
      salvarLocal();
      renderPagina();
      mostrar('Importado ✓');
    }catch(err){ mostrar('Arquivo inválido'); }
  };
  r.readAsText(f);
  e.target.value = '';
});
function restaurarPadrao(){
  if (!confirm('Voltar aos dados padrão? O que está salvo será substituído.')) return;
  S = migrar(JSON.parse(JSON.stringify(DADOS_PADRAO)));
  salvarLocal();
  renderPagina();
  mostrar('Dados padrão restaurados ✓');
}

// ---------- init ----------
icone = new Image();
icone.src = 'ero_icon.png';
navegar('dashboard');
