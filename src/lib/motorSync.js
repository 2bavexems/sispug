// src/lib/motorSync.js — motor de sincronização da frota (independente do React)
// ----------------------------------------------------------------------------
//  • base   = modelo do servidor (última versão recebida + o que já enviamos)
//  • tela   = o que o usuário vê (base + edições locais ainda não enviadas)
//  • Envio: calcula a diferença tela × base e manda só os campos alterados.
//  • Recebimento: as edições locais pendentes são reaplicadas por cima da
//    versão que chegou (nada digitado se perde) e nada recebido é regravado.
//  • Versões: cada gravação no servidor gera um número. Versões antigas ou
//    repetidas são ignoradas; "sincronizar()" recarrega tudo quando há dúvida.
// Testado em scripts/teste-sync.mjs (simulação de vários usuários simultâneos).
// ----------------------------------------------------------------------------
import { calcularOps, aplicarOps } from "./sync.js";
import { frotaTemConteudo } from "./conteudo.js";

/**
 * @param {object} cfg
 * @param {{ carregar: () => Promise<{dados, versao}>, enviarOps: (ops, cliente) => Promise<number> }} cfg.api
 * @param {(tela) => void} cfg.aoMudarTela   chamado sempre que a tela muda
 * @param {(s: {gravacao: "ok"|"salvando"|"erro", falhas: number, salvoEm?: Date}) => void} [cfg.aoStatus]
 * @param {string} [cfg.cliente]            identificador gravado no histórico
 * @param {number} [cfg.debounceMs]
 */
export function criarMotor({ api, aoMudarTela, aoStatus = () => {}, cliente = null, debounceMs = 400 }) {
  let tela = null;
  let base = null;
  let versao = 0;
  let enviadas = [];        // [{ versao, ops }] nossas gravações ainda não vistas pelo tempo real
  let carregado = false;
  let enviando = false;
  let timer = null;
  let retry = null;
  let falhas = 0;
  let eventoAntesDaCarga = null;
  let encerrado = false;

  const definirTela = (nova) => { tela = nova; aoMudarTela(nova); };
  const pendentes = () => (carregado && base ? calcularOps(base, tela) : []);

  function agendar(ms = debounceMs) {
    if (encerrado) return;
    clearTimeout(timer);
    timer = setTimeout(enviar, ms);
  }

  /** Primeira carga. "local" é a versão migrada (pode diferir de dados). */
  function iniciar({ dados, versao: v }, local = dados) {
    base = dados;
    versao = v;
    carregado = true;
    definirTela(local);
    const ev = eventoAntesDaCarga;
    eventoAntesDaCarga = null;
    if (ev) receber(ev);
    if (pendentes().length) agendar();
  }

  /** Edição do usuário (fn recebe a tela atual e devolve a nova). */
  function mutar(fn) {
    const nova = typeof fn === "function" ? fn(tela) : fn;
    definirTela(nova);
    if (carregado) agendar();
  }

  /** Versão vinda do servidor (tempo real ou recarga). */
  function receber({ dados, versao: v }) {
    if (!carregado) {
      if (!eventoAntesDaCarga || v > eventoAntesDaCarga.versao) eventoAntesDaCarga = { dados, versao: v };
      return false;
    }
    if (!dados || !(v > versao)) return false; // antiga ou repetida
    if (!frotaTemConteudo(dados) && frotaTemConteudo(base)) {
      console.warn("[SisPug] Versão vazia do servidor ignorada — estado local preservado.");
      return false;
    }
    const pend = calcularOps(base, tela);
    versao = v;
    enviadas = enviadas.filter((e) => e.versao > v);
    let novaBase = dados;
    for (const e of enviadas) novaBase = aplicarOps(novaBase, e.ops);
    base = novaBase;
    definirTela(pend.length ? aplicarOps(novaBase, pend) : novaBase);
    if (pend.length && !enviando) agendar();
    return true;
  }

  /** Recarrega do servidor (ao reconectar, voltar à aba, versão perdida...). */
  async function sincronizar() {
    if (!carregado || encerrado) return;
    try {
      receber(await api.carregar());
    } catch (e) {
      console.warn("[SisPug] Falha ao conferir o servidor:", e);
    }
  }

  /** Envia já o que estiver pendente. */
  async function enviar() {
    clearTimeout(timer);
    if (!carregado || enviando || encerrado) return;
    if (!frotaTemConteudo(tela)) {
      console.warn("[SisPug] Gravação bloqueada: frota vazia/sem conteúdo.");
      return;
    }
    const ops = calcularOps(base, tela);
    if (ops.length === 0) { aoStatus({ gravacao: "ok", falhas }); return; }

    enviando = true;
    aoStatus({ gravacao: "salvando", falhas });
    let ok = false;
    try {
      const nova = await api.enviarOps(ops, cliente);
      base = aplicarOps(base, ops); // o servidor já contém estas operações
      if (nova > versao) {
        if (nova === versao + 1 && enviadas.length === 0) versao = nova;
        else enviadas.push({ versao: nova, ops });
      }
      ok = true;
      const falhasAntes = falhas;
      falhas = 0;
      aoStatus({ gravacao: "ok", falhas: 0, salvoEm: new Date(), recuperado: falhasAntes > 0 });
    } catch (e) {
      falhas += 1;
      console.error("[SisPug] Erro ao salvar:", e);
      aoStatus({ gravacao: "erro", falhas, erro: e });
      clearTimeout(retry);
      if (!encerrado) retry = setTimeout(enviar, Math.min(30000, 2000 * falhas));
    } finally {
      enviando = false;
    }
    if (ok && pendentes().length) agendar();
  }

  function encerrar() {
    encerrado = true;
    clearTimeout(timer);
    clearTimeout(retry);
  }

  return {
    iniciar, mutar, receber, sincronizar, enviar, encerrar,
    temPendencias: () => enviando || pendentes().length > 0,
    get tela() { return tela; },
    get base() { return base; },
    get versao() { return versao; },
    get carregado() { return carregado; },
    get falhas() { return falhas; },
  };
}
