// src/lib/domain.js
// ----------------------------------------------------------------------------
// Lógica de domínio do SisDeLu — potencial, criticidade, ordenação de limites.
// ----------------------------------------------------------------------------

export const SITUACOES = ["Disponível", "Restr. IFR", "Restr. OVN", "Restr. Op", "Indisponível"];
export const MODELOS = ["Pantera K2", "Black Hawk", "Cougar"];
export const MODELO_DESIG = { "Pantera K2": "HM-1A", "Black Hawk": "HM-2A", "Cougar": "HM-3" };
export const APLICACOES = ["GTM I", "GTM II", "Ambos"];

// Mapeia situação para classe CSS correspondente
export function classSituacao(s) {
  if (s === "Disponível") return "disponível";
  if (s && s.startsWith("Restr.")) return "restrita";
  if (s === "Indisponível") return "indisponível";
  return "";
}

export const hoje = () => new Date(new Date().toDateString());

// ----------------------------------------------------------------------------
// SISTEMA DE NOTIFICAÇÕES (3 níveis)
// ----------------------------------------------------------------------------
// Notif 1 — TSN desatualizado: qualquer aeronave com TSN preenchido há mais de
//           24 horas ÚTEIS (sábado/domingo não contam). Vale todos os dias.
// Notif 2 — Conferir Mnt 100h/100d: lembrete só às segundas; cada aeronave tem
//           seu botão "Conferido", que encerra o alerta naquela semana.
// Notif 3 — Planejamento semanal: só às sextas a partir das 08:00; cada frota
//           pode encerrar com o botão "Planejado".
// ----------------------------------------------------------------------------

// Verifica se é segunda-feira
export function ehSegunda() {
  return new Date().getDay() === 1; // 1 = segunda-feira
}

// Conta quantas HORAS ÚTEIS (apenas seg–sex) já se passaram desde um timestamp.
// Para no máximo em 24 (só nos interessa saber se passou de 24h úteis).
export function horasUteisDesde(timestamp) {
  if (!timestamp) return Infinity;
  const inicio = new Date(timestamp);
  const fim = new Date();
  if (fim <= inicio) return 0;

  let horas = 0;
  let cur = new Date(inicio);
  while (cur < fim) {
    const dia = cur.getDay(); // 0=dom, 6=sab
    const prox = new Date(cur.getTime() + 3600000); // +1h
    const limite = prox < fim ? prox : fim;
    if (dia >= 1 && dia <= 5) horas += (limite - cur) / 3600000;
    if (horas >= 24) return 24;
    cur = prox;
  }
  return horas;
}

// Cada um dos 3 campos TSN (Célula, GTM I, GTM II) tem seu próprio timestamp
// de última atualização — ver PainelAeronave.jsx / FleetContext.jsx.
export const TSN_CAMPOS = {
  tsnCelula: "tsnCelulaAtualizadoEm",
  tsnGtm1: "tsnGtm1AtualizadoEm",
  tsnGtm2: "tsnGtm2AtualizadoEm",
};

// Um campo TSN específico está desatualizado (mais de 24h úteis desde seu
// próprio preenchimento). Campo vazio → sem notificação.
export function tsnCampoAtrasado(anv, campo) {
  const valor = anv[campo]; // ex.: anv.tsnCelula
  if (!valor && valor !== 0) return false; // campo vazio — sem notificação
  const ts = anv[TSN_CAMPOS[campo]];
  if (!ts) return true; // valor preenchido mas sem timestamp (dado importado) — atrasado
  return horasUteisDesde(ts) >= 24;
}

// Notif 1 — TSN desatualizado: fica ativo enquanto QUALQUER um dos 3 campos
// (TSN Célula, TSN GTM I, TSN GTM II) estiver com mais de 24h úteis desde a
// sua própria última atualização. Só some quando os 3 estiverem em dia.
export function tsnAtrasado(anv) {
  return Object.keys(TSN_CAMPOS).some((campo) => tsnCampoAtrasado(anv, campo));
}

// Início (00:00) da segunda-feira da semana atual
function inicioSemana() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // recua até segunda
  return d;
}

// Notif 2 — lembrete de conferir Mnt 100h/100d (apenas segunda, por aeronave)
export function deveConfirmarMnt(anv) {
  // 1º) Se já conferiu nesta semana, não mostra
  if (anv.confirmacaoMntEm && new Date(anv.confirmacaoMntEm) >= inicioSemana()) {
    return false;
  }
  // 2º) Regra real: só às segundas
  return ehSegunda();
}

// Notif 3 — planejamento semanal (sexta a partir das 08:00)
export function ehJanelaPlnj() {
  const d = new Date();
  return d.getDay() === 5 && d.getHours() >= 8; // 5 = sexta
}

// Planejamento pendente para uma frota específica
export function devePlanejar(fleet, modelo) {
  // Se já planejou nesta semana, não mostra; senão usa a regra real (sexta >= 08:00)
  const conf = fleet?.plnjConfirmado?.[modelo];
  if (conf && new Date(conf) >= inicioSemana()) return false;
  return ehJanelaPlnj();
}

// Há pelo menos uma frota com planejamento pendente?
export function plnjPendente(fleet) {
  if (!ehJanelaPlnj()) return false;
  return MODELOS.some((m) => devePlanejar(fleet, m));
}

// Agregador — resume o estado de todas as notificações da frota.
// Usado pelos LEDs do menu.
export function notificacoes(fleet) {
  const ordem = fleet?.ordem ?? [];
  const tsn = ordem.some((n) => tsnAtrasado(fleet.aeronaves[n]));
  const mnt = ordem.some((n) => deveConfirmarMnt(fleet.aeronaves[n]));
  const plnj = plnjPendente(fleet);
  return {
    tsn,
    mnt,
    plnj,
    sisdelu: tsn || mnt,          // LED ao lado de "SisDeLu"
    plnjmnt: plnj,                // LED ao lado de "Plnj Mnt"
    qualquer: tsn || mnt || plnj, // LED no botão "Gerentes de Frota"
  };
}
export const fmtData = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export function diasAte(iso) {
  if (!iso) return null;
  return Math.round((new Date(iso + "T00:00:00") - hoje()) / 86400000);
}

export function tsnReferencia(anv, secao, row) {
  if (secao === "motores") {
    const t1 = parseFloat(anv.tsnGtm1) || 0;
    const t2 = parseFloat(anv.tsnGtm2) || 0;
    if (row.aplicacao === "GTM I") return t1;
    if (row.aplicacao === "GTM II") return t2;
    return Math.max(t1, t2);
  }
  return parseFloat(anv.tsnCelula) || 0;
}

export function potencial(row, limite, anv, secao) {
  if (!limite && limite !== 0) return null;
  if (row.tipo === "Horária") {
    const lim = parseFloat(limite);
    if (isNaN(lim)) return null;
    return Math.round((lim - tsnReferencia(anv, secao, row)) * 10) / 10;
  }
  return diasAte(limite);
}

// Calcula o nível de criticidade (cor) de uma contagem regressiva.
// O parâmetro `tipo` define os limiares:
//   - "at"    → Grandes Inspeções A/T:  < 30 vermelho, 30–90 amarelo, > 90 verde
//   - "inspC" → Inspeção C:             < 100 vermelho, 100–365 amarelo, > 365 verde
//   - padrão  → Limite de Vida, Célula, Motor, Recheque (horas ou dias):
//               0–10 vermelho, 10–20 amarelo, > 20 verde
// Em qualquer tipo, valor < 0 = vencido (vermelho forte).
export function nivel(valor, unidade, tipo) {
  if (valor === null || valor === undefined || isNaN(valor)) return "na";
  if (valor < 0) return "vencido";
  if (tipo === "at") return valor < 30 ? "critico" : valor <= 90 ? "alerta" : "normal";
  if (tipo === "inspC") return valor < 100 ? "critico" : valor <= 365 ? "alerta" : "normal";
  return valor <= 10 ? "critico" : valor <= 20 ? "alerta" : "normal";
}

export function limitesOrdenados(anv) {
  const horas = [];
  const dias = [];
  const varrer = (secao, rows) =>
    rows.forEach((r) => {
      // Sempre considera limiteCom (com extensão)
      const p = potencial(r, r.limiteCom, anv, secao);
      if (p === null) return;
      const nome = r.descricao || r.os || "—";
      if (r.tipo === "Horária") horas.push({ valor: p, nome, tipo: "padrao" });
      else dias.push({ valor: p, nome, tipo: "padrao" });
    });
  varrer("limitesVida", anv.limitesVida);
  varrer("celula", anv.celula);
  varrer("motores", anv.motores);
  varrer("recheques", anv.recheques);
  const dAT = diasAte(anv.inspecoes.atSem);
  if (dAT !== null) dias.push({ valor: dAT, nome: "Insp A/T", tipo: "at" });
  const dC = diasAte(anv.inspecoes.inspC);
  if (dC !== null) dias.push({ valor: dC, nome: "Inspeção C", tipo: "inspC" });
  // Potencial A/T (horas) não entra no ranking: o vencimento calendárico da A/T
  // sempre ocorre primeiro, então a contagem por horas não é utilizada.

  // Agrupa inspeções com "Insp" no nome e pega apenas a que vence primeiro
  const agruparInspeções = (limites) => {
    const inspecoes = {};
    const outros = [];

    limites.forEach((l) => {
      if (l.nome.includes("Insp")) {
        // Extrai tipo da inspeção (tudo antes do primeiro número ou até o fim)
        const tipo = l.nome.split(/\d/)[0].trim();
        if (!inspecoes[tipo] || l.valor < inspecoes[tipo].valor) {
          inspecoes[tipo] = l;
        }
      } else {
        outros.push(l);
      }
    });

    return [...Object.values(inspecoes), ...outros];
  };

  const horasAgrupadas = agruparInspeções(horas);
  const diasAgrupadas = agruparInspeções(dias);

  horasAgrupadas.sort((a, b) => a.valor - b.valor);
  diasAgrupadas.sort((a, b) => a.valor - b.valor);
  return { horas: horasAgrupadas, dias: diasAgrupadas };
}

// ----------------------------------------------------------------------------
// PESQUISA MNT — consulta cronológica (somente leitura) de TODAS as manutenções
// de uma aeronave. Reúne os 4 grupos do SisDeLu (Limites de Vida, Célula,
// Motores, Recheques) e as Grandes Inspeções, e separa em duas listas:
//   • horarias    → itens medidos em horas (tipo "Horária")
//   • calendaricas→ itens medidos em data  (tipo "Calendárica") + inspeções A/T e C
// Cada lista é ordenada de forma CRESCENTE pelo que vence primeiro (usa o
// potencial com extensão; quando ausente, cai para o sem extensão). Nada aqui
// altera dados — é apenas uma releitura organizada do que já existe no SisDeLu.
// ----------------------------------------------------------------------------
export const SECAO_LABEL = {
  limitesVida: "Limites de Vida",
  celula: "Célula",
  motores: "Motores",
  recheques: "Recheques",
};

export function pesquisaManutencoes(anv) {
  const horarias = [];
  const calendaricas = [];
  if (!anv) return { horarias, calendaricas };

  const addRow = (secao, r) => {
    const potSem = potencial(r, r.limiteSem, anv, secao);
    const potCom = potencial(r, r.limiteCom, anv, secao);
    // ordem de vencimento: prefere c/ ext; se ausente, usa s/ ext; senão, fim
    const ordem = potCom ?? potSem ?? Infinity;
    const item = {
      id: `${secao}-${r.id}`,
      secao,
      secaoLabel: SECAO_LABEL[secao],
      os: r.os,
      descricao: r.descricao,
      aplicacao: r.aplicacao,
      tipo: r.tipo,
      tipoNivel: "padrao",
      limiteSem: r.limiteSem,
      limiteCom: r.limiteCom,
      potSem,
      potCom,
      ordem,
    };
    if (r.tipo === "Horária") horarias.push(item);
    else calendaricas.push(item);
  };

  ["limitesVida", "celula", "motores", "recheques"].forEach((secao) =>
    (anv[secao] || []).forEach((r) => addRow(secao, r))
  );

  // Grandes Inspeções — sempre calendáricas (datas)
  const insp = anv.inspecoes || {};
  const addInsp = (label, data, tipoNivel) => {
    if (!data) return;
    const dias = diasAte(data);
    calendaricas.push({
      id: `insp-${label}`,
      secao: "inspecoes",
      secaoLabel: "Grandes Insp.",
      os: "",
      descricao: label,
      aplicacao: undefined,
      tipo: "Calendárica",
      tipoNivel,
      limiteSem: "",
      limiteCom: data,
      potSem: null,
      potCom: dias,
      ordem: dias ?? Infinity,
    });
  };
  addInsp("Insp A/T s/ext", insp.atSem, "at");
  addInsp("Insp A/T c/ext", insp.atCom, "at");
  addInsp("Inspeção C", insp.inspC, "inspC");

  const porOrdem = (a, b) => a.ordem - b.ordem;
  horarias.sort(porOrdem);
  calendaricas.sort(porOrdem);

  // Folga incremental ("delta"): em cada lista já ordenada, calcula quanto de
  // disponibilidade ADICIONAL cada item oferece em relação ao anterior — isto é,
  // a janela que ainda resta até este vencimento DEPOIS de executar o item
  // anterior. Usa o potencial com extensão (cai para o sem extensão quando
  // ausente). O 1º item recebe a folga atual (deltaBase); os demais, o ganho
  // sobre o anterior. Itens sem valor (potencial indefinido) ficam sem delta.
  const calcularDeltas = (lista) => {
    let anterior = null;
    lista.forEach((it) => {
      const ref = it.potCom ?? it.potSem;
      if (ref === null || ref === undefined || isNaN(ref)) {
        it.delta = null;
        it.deltaBase = false;
        return;
      }
      if (anterior === null) {
        it.delta = ref;            // 1º item: folga atual
        it.deltaBase = true;
      } else {
        it.delta = Math.round((ref - anterior) * 10) / 10; // ganho sobre o anterior
        it.deltaBase = false;
      }
      anterior = ref;
    });
  };
  calcularDeltas(horarias);
  calcularDeltas(calendaricas);

  return { horarias, calendaricas };
}
