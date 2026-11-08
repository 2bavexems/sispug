// scripts/teste-sync.mjs — testes do motor de sincronização (rodar: node scripts/teste-sync.mjs)
// ----------------------------------------------------------------------------
// 1) calcularOps/aplicarOps: a diferença reconstrói exatamente a frota editada.
// 2) Simulação: vários gerentes editando ao mesmo tempo, com atrasos de rede,
//    eventos de tempo real fora de hora, quedas de conexão e falhas de gravação.
//    Verifica que (a) ninguém perde lançamento e (b) todos terminam iguais ao servidor.
// 3) Reproduz o método ANTIGO (gravar a frota inteira) para mostrar o bug.
// ----------------------------------------------------------------------------
import { calcularOps, aplicarOps, iguais } from "../src/lib/sync.js";
import { criarMotor } from "../src/lib/motorSync.js";

let falhou = 0;
const ok = (cond, msg) => { if (!cond) { falhou++; console.error("  ✗ " + msg); } };

// RNG determinístico
let semente = 12345;
const rnd = () => ((semente = (semente * 1103515245 + 12345) % 2147483648) / 2147483648);
const int = (n) => Math.floor(rnd() * n);
const pick = (a) => a[int(a.length)];
let contId = 0;
const novoId = () => "id" + (++contId);
const clone = (x) => JSON.parse(JSON.stringify(x));

function frotaInicial() {
  const f = { ordem: [], aeronaves: {}, planejamento: { "Black Hawk": { manutencoes: [] } }, plnjConfirmado: {},
    tasa: { missoes: [], pessoal: { especialistas: [], auxiliares: [], motoristas: [] }, material: [] } };
  for (const [n, modelo] of [["1001", "Pantera K2"], ["1002", "Pantera K2"], ["2001", "Black Hawk"], ["2002", "Black Hawk"], ["4001", "Cougar"], ["4002", "Cougar"]]) {
    f.ordem.push(n);
    f.aeronaves[n] = { numeral: n, modelo, situacao: "Disponível", tsnCelula: "100", tsnGtm1: "50", tsnGtm2: "60",
      tsnCelulaAtualizadoEm: null, inspecoes: { atSem: "", atCom: "" }, limitesVida: [], celula: [], motores: [], recheques: [], anotacoes: [], travados: {} };
  }
  return f;
}

// Edição aleatória realista (como as funções do FleetContext fazem)
function editar(f, numerais, tag) {
  const n = pick(numerais);
  const a = f.aeronaves[n];
  const r = int(10);
  if (!a) return { f, campo: null };
  if (r < 4) {
    const campo = pick(["tsnCelula", "tsnGtm1", "tsnGtm2"]);
    const valor = tag + "-" + int(100000);
    return { f: { ...f, aeronaves: { ...f.aeronaves, [n]: { ...a, [campo]: valor, [campo + "AtualizadoEm"]: valor } } }, campo: [n, campo], valor };
  }
  if (r < 5) return { f: { ...f, aeronaves: { ...f.aeronaves, [n]: { ...a, situacao: pick(["Disponível", "Indisponível", "Restr. Op"]) } } }, campo: null };
  if (r < 7) {
    const sec = pick(["limitesVida", "celula", "anotacoes"]);
    return { f: { ...f, aeronaves: { ...f.aeronaves, [n]: { ...a, [sec]: [...a[sec], { id: novoId(), os: tag, obs: "" }] } } }, campo: null };
  }
  if (r < 8) {
    const sec = pick(["limitesVida", "celula", "anotacoes"]);
    if (!a[sec].length) return { f, campo: null };
    const alvo = pick(a[sec]);
    return { f: { ...f, aeronaves: { ...f.aeronaves, [n]: { ...a, [sec]: a[sec].map((x) => (x.id === alvo.id ? { ...x, obs: tag + int(999) } : x)) } } }, campo: null };
  }
  if (r < 9) {
    const sec = pick(["limitesVida", "celula", "anotacoes"]);
    if (!a[sec].length) return { f, campo: null };
    const alvo = pick(a[sec]);
    return { f: { ...f, aeronaves: { ...f.aeronaves, [n]: { ...a, [sec]: a[sec].filter((x) => x.id !== alvo.id) } } }, campo: null };
  }
  // TASA — área compartilhada por todos
  return { f: { ...f, tasa: { ...f.tasa, missoes: [...f.tasa.missoes, { id: novoId(), missao: tag }] } }, campo: null };
}

// ---------------------------------------------------------------------------
console.log("1) Diferença e aplicação de operações");
{
  let f = frotaInicial();
  for (let i = 0; i < 3000; i++) {
    const { f: g } = editar(f, Object.keys(f.aeronaves), "u");
    let h = g;
    if (i % 97 === 0) { h = clone(g); delete h.plnjConfirmado; h.extra = { x: [1, 2] }; }
    if (i % 131 === 0) { h = clone(g); const n = "9" + i; h.ordem = [...h.ordem, n]; h.aeronaves[n] = frotaInicial().aeronaves["2001"]; }
    const ops = calcularOps(f, h);
    const r = aplicarOps(f, ops);
    ok(iguais(r, h), "reconstrução falhou na iteração " + i);
    f = h;
  }
  // undefined conta como ausente
  ok(calcularOps({ a: 1, b: undefined }, { a: 1 }).length === 0, "undefined deveria ser ignorado");
  // aplicarOps não altera o original
  const orig = frotaInicial(); const copia = clone(orig);
  aplicarOps(orig, [{ tipo: "set", path: ["aeronaves", "2001", "tsnCelula"], valor: "9" }]);
  ok(iguais(orig, copia), "aplicarOps modificou o objeto original");
  // operação em aeronave removida é ignorada
  ok(iguais(aplicarOps(orig, [{ tipo: "set", path: ["aeronaves", "9999", "tsnCelula"], valor: "9" }]), orig), "op em aeronave inexistente deveria ser ignorada");
  console.log(falhou ? "  falhas!" : "  ✓ ok");
}

// ---------------------------------------------------------------------------
// Servidor simulado (mesma regra da função SQL — conferida no teste SQL)
function criarServidor(inicial) {
  const s = { dados: clone(inicial), versao: 1, assinantes: new Set(), falhaChance: 0 };
  const atraso = () => new Promise((r) => setTimeout(r, int(25)));
  s.api = (cli) => ({
    carregar: async () => { await atraso(); const r = { dados: clone(s.dados), versao: s.versao }; await atraso(); return r; },
    enviarOps: async (ops) => {
      await atraso();
      if (rnd() < s.falhaChance) throw new Error("rede caiu (simulado)");
      const antes = s.dados;
      s.dados = aplicarOps(s.dados, clone(ops));
      if (!iguais(antes, s.dados)) {
        s.versao++;
        const ev = { dados: clone(s.dados), versao: s.versao };
        for (const a of s.assinantes) a(ev);
      }
      const v = s.versao;
      await atraso();
      if (rnd() < s.falhaChance / 2) throw new Error("resposta perdida (gravou, mas cliente não soube)");
      return v;
    },
  });
  return s;
}

// Canal de tempo real por cliente: entrega em ordem, com atraso, e pode "cair".
function conectar(servidor, motor) {
  const fila = [];
  let caido = false, entregando = false;
  const entregar = async () => {
    if (entregando) return; entregando = true;
    while (fila.length) { const ev = fila.shift(); await new Promise((r) => setTimeout(r, int(40))); motor.receber(ev); }
    entregando = false;
  };
  const ouvinte = (ev) => { if (!caido) { fila.push(ev); entregar(); } };
  servidor.assinantes.add(ouvinte);
  return {
    cair() { caido = true; },
    voltar() { caido = false; motor.sincronizar(); }, // como o app faz ao reconectar
    desligar() { servidor.assinantes.delete(ouvinte); },
  };
}

async function simular({ nome, clientes = 4, edicoes = 150, falhaChance = 0, quedas = false }) {
  const srv = criarServidor(frotaInicial());
  srv.falhaChance = falhaChance;
  const frotasPorGerente = [["1001", "1002"], ["2001", "2002"], ["4001", "4002"], ["1001", "2001", "4001"]];
  const ultimo = {}; // campo -> { valor, quem }  (último lançamento de cada TSN)
  const esperadoAnv = {};          // "numeral|gerente" -> aeronave como o gerente a deixou
  const missoesCriadas = new Set(); // missões TASA criadas (ninguém apaga missões neste teste)
  const cs = [];
  for (let i = 0; i < clientes; i++) {
    const m = criarMotor({ api: srv.api(i), aoMudarTela: () => {}, debounceMs: 5 + int(10) });
    m.iniciar(await srv.api(i).carregar());
    cs.push({ m, rt: conectar(srv, m), minhas: frotasPorGerente[i % 4] });
  }
  // O 4º "gerente" mexe em aeronaves dos outros: TSN concorrente no mesmo campo.
  for (let k = 0; k < edicoes; k++) {
    await Promise.all(cs.map(async (c, i) => {
      await new Promise((r) => setTimeout(r, int(30)));
      if (quedas && rnd() < 0.05) { c.rt.cair(); setTimeout(() => c.rt.voltar(), 50 + int(300)); }
      const { f, campo, valor } = editar(c.m.tela, c.minhas, "c" + i);
      c.m.mutar(f);
      if (campo) ultimo[campo.join(".")] = { valor, quem: i, t: performance.now() };
      for (const n of c.minhas) esperadoAnv[n + "|" + i] = clone(c.m.tela.aeronaves[n]);
      for (const ms of c.m.tela.tasa.missoes) if (ms.missao === "c" + i) missoesCriadas.add(ms.id);
    }));
  }
  // Espera tudo assentar (como o app: reenvio + conferência periódica)
  srv.falhaChance = 0;
  for (let r = 0; r < 60; r++) {
    await new Promise((x) => setTimeout(x, 60));
    for (const c of cs) { c.rt.voltar(); await c.m.enviar(); await c.m.sincronizar(); }
    if (cs.every((c) => !c.m.temPendencias() && iguais(c.m.tela, srv.dados))) break;
  }
  for (const c of cs) { c.rt.desligar(); c.m.encerrar(); }

  // (a) todos iguais ao servidor
  cs.forEach((c, i) => ok(iguais(c.m.tela, srv.dados), `${nome}: gerente ${i} terminou diferente do servidor`));
  // (b) nenhum lançamento de TSN perdido: campos editados por um só gerente
  //     precisam ter exatamente o último valor lançado.
  const quemEditou = {};
  for (const c of cs) for (const n of c.minhas) quemEditou[n] = (quemEditou[n] || 0) + 1;
  let conferidos = 0, perdidos = 0;
  for (const [chave, { valor }] of Object.entries(ultimo)) {
    const [n, campo] = chave.split(".");
    if (quemEditou[n] > 1) continue; // campo disputado: vale o último a chegar no servidor
    conferidos++;
    if (srv.dados.aeronaves[n][campo] !== valor) perdidos++;
  }
  ok(perdidos === 0, `${nome}: ${perdidos} lançamento(s) de TSN perdido(s)`);
  // (c) aeronave inteira (TSN, situação, linhas de manutenção, anotações) igual
  //     ao que o único gerente responsável por ela deixou na tela
  let anvDif = 0, anvConf = 0;
  for (const [chave, anv] of Object.entries(esperadoAnv)) {
    const [n] = chave.split("|");
    if (quemEditou[n] > 1) continue;
    anvConf++;
    if (!iguais(srv.dados.aeronaves[n], anv)) anvDif++;
  }
  ok(anvDif === 0, `${nome}: ${anvDif} aeronave(s) diferente(s) do que o gerente deixou`);
  // (d) nenhuma missão TASA perdida (área compartilhada por todos)
  const finais = new Set(srv.dados.tasa.missoes.map((m) => m.id));
  const missoesPerdidas = [...missoesCriadas].filter((id) => !finais.has(id)).length;
  ok(missoesPerdidas === 0, `${nome}: ${missoesPerdidas} missão(ões) TASA perdida(s)`);
  console.log(`  ${perdidos || anvDif || missoesPerdidas ? "✗" : "✓"} ${nome}: ${clientes} gerentes, ${edicoes * clientes} edições, ${conferidos} TSN e ${anvConf} aeronaves conferidos, ${missoesCriadas.size} missões TASA, perdas: ${perdidos + anvDif + missoesPerdidas}`);
}

console.log("2) Simulação com vários gerentes simultâneos (método NOVO)");
await simular({ nome: "rede normal" });
await simular({ nome: "com quedas do tempo real", quedas: true });
await simular({ nome: "com falhas de gravação (10%)", falhaChance: 0.1, quedas: true });
await simular({ nome: "6 usuários", clientes: 6, edicoes: 100, quedas: true, falhaChance: 0.05 });

// ---------------------------------------------------------------------------
console.log("3) Mesmo cenário com o método ANTIGO (gravar a frota inteira)");
{
  // Gerente A (Black Hawk) lança TSN; Gerente B (Cougar) está com a aba parada
  // (tempo real caiu) e, 10 min depois, altera a situação de uma aeronave Cougar.
  let servidor = frotaInicial();
  const abaB = clone(servidor);                       // B carregou de manhã
  const abaA = clone(servidor);
  abaA.aeronaves["2001"].tsnCelula = "1234.5";       // A lança o TSN
  servidor = clone(abaA);                             // método antigo: grava tudo
  abaB.aeronaves["4001"].situacao = "Indisponível";  // B edita algo da frota dele
  servidor = clone(abaB);                             // grava tudo -> apaga o TSN de A
  console.log(`  antigo: TSN da 2001 no servidor = ${servidor.aeronaves["2001"].tsnCelula} (A tinha lançado 1234.5) → ${servidor.aeronaves["2001"].tsnCelula === "1234.5" ? "ok" : "BUG REPRODUZIDO"}`);

  // Mesmo cenário com o método novo
  let srv = frotaInicial();
  const baseB = clone(srv);
  srv = aplicarOps(srv, calcularOps(srv, abaA));                      // A envia só o TSN
  const telaB = clone(baseB); telaB.aeronaves["4001"].situacao = "Indisponível";
  srv = aplicarOps(srv, calcularOps(baseB, telaB));                   // B (aba parada) envia só a situação
  const novoOk = srv.aeronaves["2001"].tsnCelula === "1234.5" && srv.aeronaves["4001"].situacao === "Indisponível";
  ok(novoOk, "método novo perdeu dado no cenário da aba parada");
  console.log(`  novo:   TSN da 2001 = ${srv.aeronaves["2001"].tsnCelula}, situação da 4001 = ${srv.aeronaves["4001"].situacao} → ${novoOk ? "✓ nada perdido" : "✗"}`);
}

console.log(falhou ? `\nRESULTADO: ${falhou} FALHA(S)` : "\nRESULTADO: TODOS OS TESTES PASSARAM");
process.exit(falhou ? 1 : 0);
