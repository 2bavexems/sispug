// src/lib/sync.js — cálculo de diferenças e aplicação de operações por campo
// ----------------------------------------------------------------------------
// Em vez de gravar a frota inteira (o que fazia um gerente apagar sem querer o
// lançamento de outro), o app compara o estado local com a última versão
// conhecida do servidor e envia SÓ o que mudou, como uma lista de operações:
//
//   { tipo: "set", path: ["aeronaves", "2001", "tsnCelula"], valor: "1234.5" }
//   { tipo: "del", path: ["aeronaves", "2001", "anotacoes", { id: "abc" }] }
//
// Linhas de tabela (itens com "id") são localizadas pelo id, não pela posição,
// para que duas pessoas mexendo em linhas diferentes não se atrapalhem.
//
// aplicarOps() reproduz EXATAMENTE a regra da função SQL frota_aplicar_ops
// (sql/01_sincronizacao_segura.sql). Se mudar uma, mude a outra.
// ----------------------------------------------------------------------------

const ehObjeto = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

/** Lista em que todos os itens são objetos com "id" texto, sem repetição. */
function ehListaComId(v) {
  if (!Array.isArray(v)) return false;
  const vistos = new Set();
  for (const el of v) {
    if (!ehObjeto(el) || typeof el.id !== "string" || vistos.has(el.id)) return false;
    vistos.add(el.id);
  }
  return true;
}

/** Comparação profunda no padrão JSON (campos undefined contam como ausentes). */
export function iguais(a, b) {
  if (a === b) return true;
  if (a === undefined || b === undefined) return false;
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      const x = a[i] === undefined ? null : a[i];
      const y = b[i] === undefined ? null : b[i];
      if (!iguais(x, y)) return false;
    }
    return true;
  }
  if (ehObjeto(a)) {
    if (!ehObjeto(b)) return false;
    const ka = Object.keys(a).filter((k) => a[k] !== undefined);
    const kb = Object.keys(b).filter((k) => b[k] !== undefined);
    if (ka.length !== kb.length) return false;
    for (const k of ka) if (!(k in b) || !iguais(a[k], b[k])) return false;
    return true;
  }
  return false; // tipos primitivos diferentes (a === b já foi testado)
}

// Remove "undefined" (igual ao JSON) para o valor enviado ser o mesmo aplicado.
const limpar = (v) => (v === undefined ? null : JSON.parse(JSON.stringify(v)));

/** Gera a lista de operações que transforma "base" em "atual". */
export function calcularOps(base, atual, path = [], ops = []) {
  if (iguais(base, atual)) return ops;
  if (ehObjeto(base) && ehObjeto(atual)) {
    for (const k of Object.keys(atual)) {
      if (atual[k] === undefined) continue;
      if (base[k] === undefined) ops.push({ tipo: "set", path: [...path, k], valor: limpar(atual[k]) });
      else calcularOps(base[k], atual[k], [...path, k], ops);
    }
    for (const k of Object.keys(base)) {
      if (base[k] !== undefined && atual[k] === undefined) ops.push({ tipo: "del", path: [...path, k] });
    }
    return ops;
  }
  if (path.length > 0 && ehListaComId(base) && ehListaComId(atual)) {
    const mapaBase = new Map(base.map((el) => [el.id, el]));
    const idsAtual = new Set();
    for (const el of atual) {
      idsAtual.add(el.id);
      const seg = { id: el.id };
      if (!mapaBase.has(el.id)) ops.push({ tipo: "set", path: [...path, seg], valor: limpar(el) });
      else calcularOps(mapaBase.get(el.id), el, [...path, seg], ops);
    }
    for (const el of base) {
      if (!idsAtual.has(el.id)) ops.push({ tipo: "del", path: [...path, { id: el.id }] });
    }
    return ops;
  }
  if (path.length === 0) throw new Error("calcularOps: a raiz da frota precisa ser um objeto");
  ops.push({ tipo: "set", path, valor: limpar(atual) });
  return ops;
}

// Aplica uma operação sem modificar o objeto original (cópia só no caminho).
function aplicarUma(no, path, i, op) {
  const seg = path[i];
  const ultimo = i === path.length - 1;

  if (ehObjeto(seg)) {
    if (!Array.isArray(no)) return no; // pai não é lista: ignora
    const idx = no.findIndex((el) => ehObjeto(el) && el.id === seg.id);
    if (idx < 0) {
      // linha não existe: acrescenta se for gravação da linha inteira
      return ultimo && op.tipo === "set" ? [...no, op.valor] : no;
    }
    const copia = no.slice();
    if (ultimo) {
      if (op.tipo === "del") copia.splice(idx, 1);
      else copia[idx] = op.valor;
      return copia;
    }
    copia[idx] = aplicarUma(no[idx], path, i + 1, op);
    return copia;
  }

  if (!ehObjeto(no)) return no; // pai sumiu ou não é objeto: ignora
  if (ultimo) {
    if (op.tipo === "del") {
      if (!(seg in no)) return no;
      const copia = { ...no };
      delete copia[seg];
      return copia;
    }
    return { ...no, [seg]: op.valor };
  }
  if (no[seg] === undefined) return no; // caminho intermediário inexistente: ignora
  return { ...no, [seg]: aplicarUma(no[seg], path, i + 1, op) };
}

/** Aplica uma lista de operações e devolve um novo objeto. */
export function aplicarOps(dados, ops) {
  let r = dados;
  for (const op of ops) {
    if (!op || !Array.isArray(op.path) || op.path.length === 0) continue;
    if (op.tipo !== "set" && op.tipo !== "del") continue;
    const opNorm = op.tipo === "set" ? { ...op, valor: op.valor === undefined ? null : op.valor } : op;
    r = aplicarUma(r, op.path, 0, opNorm);
  }
  return r;
}
