// src/styles/styles.js — tema visual V3 preservado integralmente + estilos do login
export const CSS = `
:root{
  --fundo:#0a1d39; --fundo2:#0e2443; --carta:#12294c; --carta2:#1a335a56;
  --borda:#284870; --borda-clara:#395d8c; --borda-azul:#5398da;
  --texto:#dbe6f1; --texto2:#9bb2cf; --rotulo:#809dc2;
  --ouro:#c9ad6b; --ouro-escuro:#8a6f3a;
  --verde:#2fae6e; --ambar:#dca73e; --rubi:#d4554f; --rubi-forte:#b02a24;
  --num:'Segoe UI',system-ui,-apple-system,'Helvetica Neue',Arial,sans-serif;
}
*{box-sizing:border-box}
body{margin:0;background:var(--fundo)}
.app{min-height:100vh;display:flex;flex-direction:column;background:
  radial-gradient(1200px 500px at 80% -100px,#1b3c6a55,transparent),var(--fundo);
  color:var(--texto);font-family:'Segoe UI',Roboto,'Helvetica Neue',sans-serif}
.mono{font-family:'Consolas','Roboto Mono',monospace;font-variant-numeric:tabular-nums}
.faixa-ouro{height:4px;background:linear-gradient(90deg,var(--ouro-escuro),var(--ouro),var(--ouro-escuro))}

.topo{display:flex;align-items:center;gap:14px;padding:12px 26px;background:#0c2140e6;border-bottom:1px solid var(--borda);position:sticky;top:0;z-index:30;backdrop-filter:blur(6px);max-width:1700px;width:100%;margin:0 auto}
.topo-titulos{display:flex;flex-direction:column;gap:3px}
.topo-nome{font-size:18px;font-weight:700;letter-spacing:.3px}
.topo-sub{font-size:9px;color:#809dc2;letter-spacing:0.8px;text-transform:uppercase;font-style:italic;opacity:0.75;font-weight:500}
.topo-dir{margin-left:auto;display:flex;align-items:stretch;gap:8px;flex-wrap:wrap}
.topo-dir>*{display:flex;align-items:center;height:34px;box-sizing:border-box}
.chip-data{font-size:13px;color:var(--texto2);border:1px solid var(--borda);border-radius:8px;padding:0 12px;background:var(--carta)}
.chip-versao{font-size:12px;font-weight:800;color:var(--ouro);border:1px solid var(--ouro-escuro);border-radius:8px;padding:0 12px;letter-spacing:1px}

.btn{border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid transparent;transition:filter .15s,background .15s}
.btn:hover{filter:brightness(1.15)}
.btn.primario{background:#1e4f86;color:#fff;border-color:#2c649f}
.btn.fantasma{background:transparent;color:var(--texto2);border-color:var(--borda-clara)}
.btn.contorno{background:var(--carta);color:var(--texto);border-color:var(--borda-clara)}
.btn.perigo{background:transparent;color:#e98780;border-color:#6e2e2a}
.btn.perigo:hover{background:#3a1715}
.btn:disabled{opacity:.6;cursor:wait}

.conteudo{flex:1;padding:24px 26px 48px;max-width:1700px;width:100%;margin:0 auto}
.painel-cab{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.painel-cab h1{margin:0 0 12px;font-size:22px;letter-spacing:2.5px;text-transform:uppercase;font-weight:700}
.visao-abas{display:flex;gap:10px;flex-wrap:wrap}
.visao-abas button{background:var(--carta);border:1px solid var(--borda-clara);color:var(--texto2);border-radius:8px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer}
.visao-abas button.ativa{background:#1b3b66;color:#fff;border-color:#4a72a8;box-shadow:0 0 0 1px #4a72a855}
.atualizado{font-size:12px;color:var(--rotulo);margin:10px 0 22px}

.bloco-rotulo{font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:#7db5e8;font-weight:700;margin-bottom:8px}
.bloco-titulo{margin:0 0 28px;font-size:21px}
.painel-lembretes{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.btn-lembrete{display:flex;align-items:center;gap:8px;padding:8px 14px;background:rgba(220,167,62,0.15);border:2px solid var(--ambar);color:var(--ambar);border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.2s}
.btn-lembrete:hover{background:rgba(220,167,62,0.25);border-color:#e7bd58}
.btn-lembrete.piscante{animation:piscar 1.4s infinite linear}
.btn-lembrete .led{width:10px;height:10px}
.ems-cab{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:14px}

.cartao{background:linear-gradient(180deg,#15315a,#112a4c);border:1px solid var(--borda-azul);border-radius:12px;padding:18px 20px;margin-bottom:20px;box-shadow:0 4px 18px #00000040}
.cartao-cab{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px}
.secao-titulo,.tabela-titulo{margin:0 0 16px;font-size:14px;letter-spacing:1.2px;text-transform:uppercase;color:var(--texto);font-weight:700}
.secao-titulo{border-left:3px solid var(--ouro);padding-left:10px}

/* ===== LAYOUT EXECUTIVO VISÃO COMANDO ===== */

/* ===== LAYOUT REFERÊNCIA ===== */

/* Grid principal: Esquerda (resumo) + Direita (gráfico) */
.comando-layout-ref{display:grid;grid-template-columns:1fr 1.08fr;gap:18px;margin-bottom:18px}

/* ESQUERDA: Resumo Box */
.resumo-box{padding:18px 20px !important;display:flex;flex-direction:column;gap:0 !important}

.resumo-linha{display:grid;grid-template-columns:1.05fr repeat(4,1fr);gap:10px;align-items:center;padding:12px 0;border-bottom:1px solid var(--borda);transition:background 0.2s ease}
.resumo-linha:last-child{border-bottom:none}
.resumo-linha:hover{background:rgba(57,93,140,0.15)}

.resumo-modelo{font-weight:700;font-size:13px;color:var(--texto);text-transform:uppercase;letter-spacing:0.6px}

.resumo-metrica{display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:9px 13px;background:rgba(15,34,62,0.55);border:1px solid var(--borda);border-radius:9px;min-width:0}
.resumo-metrica .label{font-size:8.5px;letter-spacing:0.8px;text-transform:uppercase;color:var(--rotulo);font-weight:700}
.resumo-metrica .valor{font-size:26px;line-height:1;font-family:var(--num);font-variant-numeric:tabular-nums;font-weight:800;color:var(--texto)}

.resumo-metrica.disp{border-color:#2fae6e;background:rgba(47,174,110,0.08)}.resumo-metrica.disp .valor{color:#5fd394}.resumo-metrica.disp .label{color:#5fd394}

.resumo-metrica.rest{border-color:#dca73e;background:rgba(220,167,62,0.08)}.resumo-metrica.rest .valor{color:#e7bd58}.resumo-metrica.rest .label{color:#e7bd58}

.resumo-metrica.indisp{border-color:#d4554f;background:rgba(212,85,79,0.08)}.resumo-metrica.indisp .valor{color:#ee837c}.resumo-metrica.indisp .label{color:#ee837c}

/* DIREITA: Gráfico Box */
.grafico-box{padding:18px 20px !important;display:flex;flex-direction:column;gap:12px !important}

.grafico-cab-ref{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}

.grafico-rotulo{font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:#7db5e8;font-weight:700}

.grafico-titulo-ref{margin:2px 0 0;font-size:18px;font-weight:700;color:var(--texto)}

.grafico-corpo-ref{display:flex;align-items:center;gap:28px;justify-content:center;margin:8px 0 4px}

.grafico-legenda-ref{display:flex;flex-direction:column;gap:10px}

.legenda-item{display:flex;align-items:center;gap:10px;font-size:13.5px;color:var(--texto);padding:9px 14px;background:rgba(18,40,70,0.35);border-radius:9px;border:1px solid var(--borda);transition:all 0.2s ease;min-width:190px}
.legenda-item:hover{background:rgba(18,40,70,0.5);border-color:var(--borda-clara)}
.legenda-item b{margin-left:auto;font-weight:800;font-family:var(--num);font-variant-numeric:tabular-nums;font-size:18px}

.pilula-grupo-ref{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.pilula-grupo-ref button{background:var(--carta);border:1px solid var(--borda-clara);color:var(--texto2);border-radius:8px;padding:6px 12px;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.2s ease}
.pilula-grupo-ref button:hover{border-color:#7db5e8;color:#7db5e8}
.pilula-grupo-ref button.ativa{background:#1b3b66;color:#fff;border-color:#4a72a8}

/* Tabela */
.tabela-exec-ref{padding:18px 20px !important}

.exec-ref{font-size:13px !important;width:100%}
.exec-ref th{text-align:left;padding:10px 12px;font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:var(--rotulo);border-bottom:1px solid var(--borda-clara);white-space:nowrap;background:#102a4c}
.exec-ref td{padding:11px 12px;border-bottom:1px solid var(--borda);vertical-align:middle}
.exec-ref tbody tr:hover{background:#19365e}
.exec-ref .anv{font-size:15px;font-weight:800;letter-spacing:0.5px;font-family:var(--num);font-variant-numeric:tabular-nums}
.exec-ref .chip{background:transparent;border:none;padding:0;font-family:var(--num);font-variant-numeric:tabular-nums;font-size:13px;font-weight:600;color:var(--texto)}
.exec-ref .chip.alerta{color:#e7bd58}.exec-ref .chip.critico{color:#f29a93}.exec-ref .chip.na{color:var(--rotulo);border:none;background:transparent;padding:0}

.kpi-card{background:linear-gradient(135deg,rgba(30,54,96,0.5),rgba(46,72,120,0.3));backdrop-filter:blur(20px);border:1px solid rgba(122,181,232,0.25);border-radius:12px;padding:14px 12px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.2);transition:all 0.3s ease}
.kpi-card:hover{transform:translateY(-2px);border-color:rgba(122,181,232,0.5);background:linear-gradient(135deg,rgba(30,54,96,0.7),rgba(46,72,120,0.5))}

.kpi-label{font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:rgba(111,141,177,0.8);font-weight:600;margin-bottom:5px}

.kpi-valor{font-size:22px;font-weight:800;font-family:'Consolas',monospace;color:rgba(219,230,241,0.95);text-shadow:0 2px 8px rgba(0,0,0,0.3)}

.kpi-card.verde{border-color:rgba(95,211,148,0.3)}.kpi-card.verde .kpi-valor{color:rgba(95,211,148,0.95)}.kpi-card.verde .kpi-label{color:rgba(95,211,148,0.85)}

.kpi-card.ambar{border-color:rgba(230,189,88,0.3)}.kpi-card.ambar .kpi-valor{color:rgba(230,189,88,0.95)}.kpi-card.ambar .kpi-label{color:rgba(230,189,88,0.85)}

.kpi-card.rubi{border-color:rgba(242,154,147,0.3)}.kpi-card.rubi .kpi-valor{color:rgba(242,154,147,0.95)}.kpi-card.rubi .kpi-label{color:rgba(242,154,147,0.85)}

/* Tabela Executiva Full Width */
.tabela-exec-full{padding:18px !important;width:100%}

.exec-full{font-size:13px !important}
.exec-full th{font-size:10px;padding:10px 12px}
.exec-full td{padding:11px 12px}
.exec-full .anv{font-size:15px;font-weight:700}
.exec-full .mono{font-family:'Consolas',monospace;font-size:12px}

/* Tabela Executiva */
.tabela-exec{padding:20px !important}

/* Resumo full-width compacto */
.grupos-resumo{background:rgba(20,42,74,0.3);backdrop-filter:blur(16px);border:1px solid rgba(57,93,140,0.4);border-radius:12px;padding:14px 18px;margin-bottom:20px;display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;box-shadow:0 8px 32px rgba(0,0,0,0.15)}

.grupo-linha-compacta{display:flex;align-items:center;gap:8px;padding:8px;background:rgba(18,40,70,0.25);border-radius:10px;border:1px solid rgba(57,93,140,0.3)}

.grupo-nome-compact{font-weight:600;font-size:11px;color:rgba(219,230,241,0.85);text-transform:uppercase;letter-spacing:0.5px;min-width:60px}

.mini-kpi-compact{display:flex;flex-direction:column;align-items:center;gap:1px;padding:6px 10px;background:rgba(18,40,70,0.4);border:1px solid rgba(122,181,232,0.2);border-radius:8px;min-width:55px}
.mini-kpi-compact span{font-size:8px;letter-spacing:1px;text-transform:uppercase;color:rgba(111,141,177,0.75);font-weight:600}
.mini-kpi-compact b{font-size:14px;font-family:'Consolas',monospace;color:rgba(219,230,241,0.9)}

.mini-kpi-compact.verde{background:rgba(47,174,110,0.1);border-color:rgba(95,211,148,0.3)}.mini-kpi-compact.verde b,.mini-kpi-compact.verde span{color:rgba(95,211,148,0.9)}
.mini-kpi-compact.ambar{background:rgba(220,167,62,0.1);border-color:rgba(230,189,88,0.3)}.mini-kpi-compact.ambar b,.mini-kpi-compact.ambar span{color:rgba(230,189,88,0.9)}
.mini-kpi-compact.rubi{background:rgba(212,85,79,0.1);border-color:rgba(242,154,147,0.3)}.mini-kpi-compact.rubi b,.mini-kpi-compact.rubi span{color:rgba(242,154,147,0.9)}

/* Grid: Tabela + Gráfico lado a lado */
.comando-grid-novo{display:grid;grid-template-columns:1.2fr 1fr;gap:18px;margin-bottom:20px}

/* Tabela container */
.tabela-container{padding:14px 16px !important}

.tabela-titulo-compact{margin:0;font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:var(--texto);font-weight:700}

.exec-compact{font-size:12px !important}
.exec-compact th{font-size:9px;padding:8px 10px}
.exec-compact td{padding:8px 10px}
.exec-compact .anv{font-size:14px}

.obs-compact{color:rgba(219,230,241,0.7);font-size:11px;min-width:100px}

/* Gráfico compacto */
.grafico-corpo-compact{display:flex;align-items:center;gap:18px;flex-direction:column;margin-top:12px}

.pilula-grupo-compacta{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.pilula-grupo-compacta button{background:rgba(18,40,70,0.35);backdrop-filter:blur(10px);border:1px solid rgba(57,93,140,0.5);color:rgba(219,230,241,0.8);border-radius:8px;padding:5px 10px;font-size:10px;font-weight:600;cursor:pointer;transition:all 0.3s ease}
.pilula-grupo-compacta button:hover{background:rgba(18,40,70,0.6);border-color:rgba(122,181,232,0.4)}
.pilula-grupo-compacta button.ativa{background:rgba(122,181,232,0.15);border-color:rgba(122,181,232,0.5);color:#fff}

.grafico-titulo-compact{margin:0;font-size:13px;font-weight:700;color:var(--texto)}

.grafico-legenda-compacta{display:flex;flex-direction:column;gap:8px;width:100%}
.grafico-legenda-compacta div{display:flex;align-items:center;gap:8px;background:rgba(18,40,70,0.35);backdrop-filter:blur(10px);border:1px solid rgba(57,93,140,0.4);border-radius:10px;padding:8px 12px;font-size:12px;color:rgba(219,230,241,0.9);transition:all 0.3s ease}
.grafico-legenda-compacta div:hover{background:rgba(18,40,70,0.55);border-color:rgba(57,93,140,0.6)}
.grafico-legenda-compacta b{margin-left:auto;font-size:14px;font-family:'Consolas',monospace;color:var(--texto)}

.comando-grade{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:20px;margin-bottom:20px}
.grupo-linha{display:grid;grid-template-columns:120px repeat(4,1fr);gap:10px;align-items:stretch;padding:12px 4px;border-bottom:1px solid rgba(57,93,140,0.3)}
.grupo-linha:last-child{border-bottom:none}
.grupo-nome{font-weight:700;font-size:14px;display:flex;align-items:center;color:var(--texto)}

/* Liquid Glass - Mini KPI */
.mini-kpi{background:rgba(18,40,70,0.4);backdrop-filter:blur(12px);border:1px solid rgba(122,181,232,0.2);border-radius:12px;padding:10px 14px;display:flex;flex-direction:column;gap:3px;transition:all 0.3s ease}
.mini-kpi:hover{background:rgba(18,40,70,0.6);border-color:rgba(122,181,232,0.4);transform:translateY(-2px)}
.mini-kpi span{font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:rgba(111,141,177,0.85);font-weight:600}
.mini-kpi b{font-size:20px;font-family:'Consolas',monospace;color:rgba(219,230,241,0.95)}

.mini-kpi.verde{background:rgba(47,174,110,0.08);border-color:rgba(95,211,148,0.25)}.mini-kpi.verde b,.mini-kpi.verde span{color:rgba(95,211,148,0.9)}
.mini-kpi.ambar{background:rgba(220,167,62,0.08);border-color:rgba(230,189,88,0.25)}.mini-kpi.ambar b,.mini-kpi.ambar span{color:rgba(230,189,88,0.9)}
.mini-kpi.rubi{background:rgba(212,85,79,0.08);border-color:rgba(242,154,147,0.25)}.mini-kpi.rubi b,.mini-kpi.rubi span{color:rgba(242,154,147,0.9)}

/* Liquid Glass - Cartões */
.cartao.grupos{background:rgba(20,42,74,0.3);border:1px solid rgba(57,93,140,0.4);backdrop-filter:blur(16px);box-shadow:0 8px 32px rgba(0,0,0,0.15)}
.cartao.grafico{background:rgba(20,42,74,0.3);border:1px solid rgba(57,93,140,0.4);backdrop-filter:blur(16px);box-shadow:0 8px 32px rgba(0,0,0,0.15)}
.cartao.glass-card{background:rgba(20,42,74,0.3);border:1px solid rgba(57,93,140,0.4);backdrop-filter:blur(16px);box-shadow:0 8px 32px rgba(0,0,0,0.15)}

.grafico-titulo{margin:2px 0 0;font-size:19px;color:var(--texto)}

/* Liquid Glass - Botões de pilha */
.pilula-grupo{display:flex;gap:8px;flex-wrap:wrap}
.pilula-grupo button{background:rgba(18,40,70,0.35);backdrop-filter:blur(10px);border:1px solid rgba(57,93,140,0.5);color:rgba(219,230,241,0.8);border-radius:10px;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.3s ease}
.pilula-grupo button:hover{background:rgba(18,40,70,0.6);border-color:rgba(122,181,232,0.4);color:var(--texto)}
.pilula-grupo button.ativa{background:rgba(122,181,232,0.15);border-color:rgba(122,181,232,0.5);color:#fff;box-shadow:0 0 16px rgba(122,181,232,0.1)}

.grafico-corpo{display:flex;align-items:center;gap:26px;flex-wrap:wrap}
.donut{width:180px;height:180px;flex:none}
.donut.compact{width:140px;height:140px}
.grafico-corpo-ref .donut{width:172px;height:172px}
.donut-rotulo{fill:rgba(111,141,177,0.85);font-size:11px;letter-spacing:3px}
.donut-total{fill:rgba(219,230,241,0.95);font-size:34px;font-weight:800;font-family:var(--num)}
.donut-grupo{fill:rgba(143,166,189,0.85);font-size:9.5px;letter-spacing:0.5px;font-weight:600}

/* Liquid Glass - Legenda */
.grafico-legenda{display:flex;flex-direction:column;gap:10px;flex:1;min-width:200px}
.grafico-legenda div{display:flex;align-items:center;gap:10px;background:rgba(18,40,70,0.35);backdrop-filter:blur(10px);border:1px solid rgba(57,93,140,0.4);border-radius:12px;padding:12px 16px;font-size:14px;transition:all 0.3s ease;color:rgba(219,230,241,0.9)}
.grafico-legenda div:hover{background:rgba(18,40,70,0.55);border-color:rgba(57,93,140,0.6)}
.grafico-legenda b{margin-left:auto;font-size:17px;font-family:'Consolas',monospace;color:var(--texto)}

.rolagem{overflow-x:auto}
.tabela{width:100%;border-collapse:collapse;font-size:13.5px}
.tabela th{text-align:left;padding:11px 12px;font-size:10.5px;letter-spacing:1.6px;text-transform:uppercase;color:rgba(111,141,177,0.9);border-bottom:1px solid rgba(57,93,140,0.4);white-space:nowrap;background:rgba(18,40,70,0.25)}
.tabela td{padding:12px;border-bottom:1px solid rgba(57,93,140,0.25);vertical-align:middle;color:rgba(219,230,241,0.9)}
.tabela tbody tr{transition:all 0.2s ease}
.tabela tbody tr:hover{background:rgba(122,181,232,0.08);border-left-color:rgba(122,181,232,0.4)}
.tabela .anv{font-size:16px;font-weight:700;letter-spacing:1px}
.linha-sit{cursor:pointer;border-left:3px solid transparent}
.linha-sit.disponível{border-left-color:#1d5237}
.linha-sit.restrita{border-left-color:#6a5320;background:#16130a40}
.linha-sit.indisponível{border-left-color:#5d2a27;background:#1c0e0d50}
.obs{color:var(--texto2);min-width:220px}
.nome-manut{color:var(--texto2);min-width:170px}
.vazio{text-align:center;color:var(--rotulo);padding:24px !important;font-style:italic}
.centro{text-align:center}

.exec th,.exec td{min-width:110px}
.exec .obs{min-width:280px}
.tecnica{min-width:1400px}
.tecnica .col-anv{min-width:70px}.tecnica .col-sit{min-width:110px}.tecnica .col-local{min-width:75px}
.tecnica .col-status{min-width:220px}.tecnica .col-val{min-width:100px}.tecnica .col-nome{min-width:160px}
.tecnica th,.tecnica td{padding-left:5px;padding-right:5px}
.tecnica .anv{font-size:13px}
.card-azul{border:1px solid var(--borda-azul) !important}
.divisor-dir{border-right:1px solid var(--borda-clara)}
.grupo-cab th{font-size:11px;color:#7db5e8;border-bottom:none;padding-bottom:2px;text-align:center}

.edicao{min-width:1280px}
.edicao .col-os{min-width:130px}.edicao .col-desc{min-width:280px}.edicao .col-apl{min-width:120px}
.edicao .col-tipo{min-width:140px}.edicao .col-lim{min-width:150px}.edicao .col-pot{min-width:120px}
.edicao .col-obs{min-width:220px}.edicao .col-acao{min-width:84px}

.chip{display:inline-block;border-radius:8px;padding:6px 12px;font-weight:700;font-size:13px;font-family:'Consolas',monospace;border:1px solid var(--borda-clara);background:#0f2444;color:var(--texto)}
.chip.normal{border-color:var(--borda-clara)}
.chip.alerta{border-color:#7c6224;background:#2a210c;color:#ecc164}
.chip.critico{border-color:#7c3531;background:#33110f;color:#f29a93}
.chip.vencido{border-color:var(--rubi-forte);background:var(--rubi-forte);color:#fff}
.chip.na{color:var(--rotulo);border-style:dashed}
.selo-sit{display:inline-block;border-radius:999px;padding:5px 12px;font-size:11px;font-weight:800;border:2px solid;letter-spacing:0.3px;text-transform:uppercase;transition:all 0.3s;box-shadow:0 0 12px rgba(0,0,0,0.3);white-space:nowrap}
.selo-sit.ok{color:#5fd394;border-color:#2fae6e;background:rgba(47,174,110,0.15);box-shadow:0 0 16px rgba(95,211,148,0.25)}
.selo-sit.ok:hover{background:rgba(47,174,110,0.3);box-shadow:0 0 24px rgba(95,211,148,0.4)}
.selo-sit.alerta{color:#e7bd58;border-color:#dca73e;background:rgba(220,167,62,0.15);box-shadow:0 0 16px rgba(230,189,88,0.25)}
.selo-sit.alerta:hover{background:rgba(220,167,62,0.3);box-shadow:0 0 24px rgba(230,189,88,0.4)}
.selo-sit.critico{color:#f29a93;border-color:#d4554f;background:rgba(212,85,79,0.15);box-shadow:0 0 16px rgba(242,154,147,0.25)}
.selo-sit.critico:hover{background:rgba(212,85,79,0.3);box-shadow:0 0 24px rgba(242,154,147,0.4)}
.tabela .selo-sit{font-size:9px;padding:4px 10px}
.led{display:inline-block;width:10px;height:10px;border-radius:50%}
.led.ok{background:var(--verde)}.led.alerta{background:var(--ambar)}.led.critico,.led.vencido{background:var(--rubi)}
.led.normal{background:#5b7799}.led.na{background:#3a4d63}
.led.atrasado{display:inline-block;width:14px;height:14px;border-radius:50%;background:var(--rubi);animation:piscar 1.4s infinite linear;animation-delay:0s;flex-shrink:0}
@keyframes piscar{0%{opacity:1}50%{opacity:0.3}100%{opacity:1}}
.legenda{display:flex;gap:18px;flex-wrap:wrap;font-size:12px;color:var(--texto2);margin-top:12px}
.legenda span{display:inline-flex;align-items:center;gap:7px}

.card-confirmacao-inspecoes-compacto{background:linear-gradient(135deg,rgba(220,167,62,0.15),rgba(200,140,50,0.1));border:2px solid var(--ambar);border-radius:12px;padding:12px 16px;margin-bottom:20px;box-shadow:0 4px 12px rgba(220,167,62,0.12)}
.confirmacao-header-compacto{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.confirmacao-icon{font-size:18px}
.confirmacao-titulo-compacto{font-size:13px;letter-spacing:1.2px;text-transform:uppercase;color:var(--ambar);font-weight:700}
.confirmacao-modelos{display:flex;flex-direction:column;gap:8px}
.confirmacao-modelo{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 10px;background:rgba(18,40,70,0.4);border-radius:8px;border-left:3px solid transparent}
.confirmacao-modelo.pendente{border-left-color:var(--ambar);background:rgba(220,167,62,0.08)}
.confirmacao-modelo.ok{border-left-color:var(--verde);background:rgba(47,174,110,0.08)}
.modelo-nome{font-size:12px;font-weight:600;color:var(--texto);min-width:100px}
.btn-check{padding:4px 10px;font-size:11px;font-weight:600;border:1px solid;border-radius:6px;cursor:pointer;transition:all 0.2s;background:transparent}
.btn-check.pendente{color:var(--ambar);border-color:var(--ambar)}
.btn-check.pendente:hover{background:rgba(220,167,62,0.15)}
.check-ok{color:var(--verde);font-weight:800;font-size:14px}

.gestao-abas-header{display:flex;gap:10px;margin-bottom:20px;border-bottom:1px solid var(--borda)}
.aba-gestao{padding:12px 20px;background:transparent;border:none;color:var(--texto2);font-size:13px;font-weight:700;cursor:pointer;border-bottom:3px solid transparent;transition:all 0.2s;text-transform:uppercase;letter-spacing:1.2px}
.aba-gestao:hover{color:var(--texto)}
.aba-gestao.ativa{color:#7db5e8;border-bottom-color:#7db5e8}

.gestao-header{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:28px}
.gestao-titulo{margin:0 0 12px;font-size:28px;font-weight:800;letter-spacing:1.5px;background:linear-gradient(135deg,#7db5e8,#5398da);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.gestao-grupo{margin-bottom:32px}
.gestao-divider{height:1px;background:linear-gradient(90deg,transparent,var(--borda-azul),transparent);margin-bottom:20px}
.gestao-grupo-titulo{font-size:13px;letter-spacing:2.2px;text-transform:uppercase;color:#7db5e8;font-weight:700;margin-bottom:16px;padding-left:4px}

.cartoes-anv{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}
.cartoes-anv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}

.cartao-anv{cursor:pointer;text-align:left;color:var(--texto);font-family:inherit;transition:transform .12s,border-color .12s}
.cartao-anv:hover{transform:translateY(-2px);border-color:var(--ouro-escuro)}

.cartao-anv-premium{cursor:pointer;text-align:left;color:var(--texto);font-family:inherit;background:linear-gradient(135deg,rgba(30,79,134,0.4),rgba(25,60,100,0.3));border:2px solid var(--borda-azul);border-radius:14px;padding:20px;transition:all 0.3s cubic-bezier(0.4,0,0.2,1);box-shadow:0 8px 24px rgba(0,0,0,0.3);position:relative;overflow:hidden}
.cartao-anv-premium::before{content:"";position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle,rgba(122,181,232,0.15),transparent);opacity:0;transition:opacity 0.3s;pointer-events:none}
.cartao-anv-premium:hover{transform:translateY(-6px);border-color:#7db5e8;box-shadow:0 16px 40px rgba(122,181,232,0.25),inset 0 0 20px rgba(122,181,232,0.1);background:linear-gradient(135deg,rgba(30,79,134,0.6),rgba(25,60,100,0.5))}
.cartao-anv-premium:hover::before{opacity:1}

/* Borda vermelha piscante para cards com pendência */
.cartao-anv-premium.cartao-alerta {
  border-color: var(--rubi) !important;
  border-width: 2px;
  animation: piscar-borda-card 1.4s infinite linear;
  box-shadow: 0 0 0 1px rgba(212, 85, 79, 0.9), 0 8px 24px rgba(0,0,0,0.3);
}

.cartao-anv-premium.cartao-alerta:hover {
  border-color: #f29a93 !important;
  box-shadow: 0 0 0 1px rgba(242, 154, 147, 0.9), 0 16px 40px rgba(242, 154, 147, 0.15);
}

@keyframes piscar-borda-card {
  0%   { box-shadow: 0 0 0 2px rgba(212, 85, 79, 0.9), 0 8px 24px rgba(0,0,0,0.3); }
  50%  { box-shadow: 0 0 0 2px rgba(212, 85, 79, 0.2), 0 8px 24px rgba(0,0,0,0.3); }
  100% { box-shadow: 0 0 0 2px rgba(212, 85, 79, 0.9), 0 8px 24px rgba(0,0,0,0.3); }
}

.cartao-anv-topo{display:flex;align-items:center;justify-content:space-between;gap:8px}
.cartao-anv-topo-centralizado{display:flex;align-items:center;justify-content:center;gap:16px}
.anv-grande{font-size:30px;font-weight:900;letter-spacing:2px;color:#7db5e8;text-shadow:0 0 20px rgba(122,181,232,0.3)}
.cartao-anv-sub{color:var(--texto2);font-size:12.5px;margin:6px 0 12px}
.cartao-anv-pior{display:flex;align-items:center;gap:10px}

.grade-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px}
.campo{display:flex;flex-direction:column;gap:6px}
.campo.larga{grid-column:1/-1}
.campo-rotulo{font-size:10.5px;letter-spacing:1.6px;text-transform:uppercase;color:var(--rotulo);font-weight:700}
.campo-controle{display:flex;flex-direction:column;gap:6px;position:relative}
.btn-cadeado{position:absolute;right:8px;top:0;background:none;border:none;font-size:16px;cursor:pointer;padding:4px 6px;border-radius:4px;transition:all 0.2s;color:var(--texto2)}
.btn-cadeado:hover{background:rgba(122,181,232,0.1);color:#7db5e8}
.btn-cadeado.travado{color:#d4554f}
.btn-cadeado.travado:hover{background:rgba(212,85,79,0.1)}
.btn-cadeado-cel{position:absolute;right:4px;top:50%;transform:translateY(-50%);background:none;border:none;font-size:13px;cursor:pointer;padding:2px 4px;border-radius:3px;transition:all 0.2s;color:var(--texto2);z-index:5}
.btn-cadeado-cel:hover{background:rgba(122,181,232,0.1);color:#7db5e8}
.btn-cadeado-cel.travado{color:#d4554f}
.btn-cadeado-cel.travado:hover{background:rgba(212,85,79,0.1)}
.btn-cadeado-linha{background:transparent;border:1px solid var(--borda-clara);border-radius:7px;width:30px;height:30px;cursor:pointer;color:var(--texto2);margin-left:5px;font-size:14px;padding:0;transition:all 0.2s}
.btn-cadeado-linha:hover{border-color:#7db5e8;color:#7db5e8}
.btn-cadeado-linha.travado{border-color:#d4554f;color:#d4554f}
.btn-cadeado-linha.travado:hover{border-color:#d4554f;color:#f29a93}
.btn-cadeado-secao{background:transparent;border:1px solid transparent;cursor:pointer;color:var(--texto2);font-size:18px;padding:4px 8px;border-radius:4px;transition:all 0.2s}
.btn-cadeado-secao:hover{background:rgba(122,181,232,0.1);color:#7db5e8;border-color:#7db5e8}
.btn-cadeado-secao.travado{color:#d4554f;border-color:#d4554f}
.btn-cadeado-secao.travado:hover{background:rgba(212,85,79,0.1);color:#f29a93;border-color:#d4554f}
.campo input,.campo select{background:#0f2444;border:1px solid var(--borda-clara);color:var(--texto);border-radius:8px;padding:10px 12px;font-size:14px;width:100%;color-scheme:dark;padding-right:40px}
.campo input:disabled,.campo select:disabled{opacity:0.6;cursor:not-allowed}
/* Seletor de Situação colorido — mesma paleta das abas Cmdo Btl e Cmt EMS */
.campo select.sel-sit-ok{border-color:#2fae6e;color:#5fd394;font-weight:700}
.campo select.sel-sit-alerta{border-color:#dca73e;color:#e7bd58;font-weight:700}
.campo select.sel-sit-critico{border-color:#d4554f;color:#ee837c;font-weight:700}
.campo input:focus,.campo select:focus,.cel:focus,.busca:focus{outline:2px solid #4a82c4;border-color:#4a82c4}
.campo-atrasado input,.campo-atrasado select{border-color:var(--ambar);border-width:2px}
.campo-vazio input,.campo-vazio select{border-color:#d4554f;border-width:2px}
.acoes{display:flex;gap:10px;flex-wrap:wrap}
.busca{background:#0f2444;border:1px solid var(--borda-clara);color:var(--texto);border-radius:8px;padding:8px 12px;font-size:13px;width:250px}

.cel{width:100%;background:transparent;border:1px solid transparent;border-radius:7px;color:var(--texto);padding:8px 9px;font-size:13.5px;font-family:inherit;color-scheme:dark}
.cel:hover{border-color:var(--borda-clara);background:#0f2444}
.cel:focus{background:#0f2444}
.cel-wrapper.vazio .cel{border-color:#d4554f;border-width:2px}
select.cel option{background:#12294c}
.acoes-linha{white-space:nowrap;text-align:right}
.acoes-linha button{background:transparent;border:1px solid var(--borda-clara);border-radius:7px;width:30px;height:30px;cursor:pointer;color:var(--texto2);margin-left:5px}
.acoes-linha button:hover{border-color:#4a82c4;color:#fff}
.acoes-linha .del:hover{border-color:var(--rubi);color:#f29a93}

.rodape{background:#0c2140;border-top:1px solid var(--borda);color:var(--texto2);font-size:12px;padding:9px 26px;display:flex;align-items:center;gap:9px}
.rodape-dir{margin-left:auto;letter-spacing:.5px}

/* ---- LOGIN (novo, mesmo tema) ---- */
.login-tela{min-height:100vh;display:grid;place-items:center;background:
  radial-gradient(1200px 500px at 80% -100px,#1b3c6a55,transparent),var(--fundo);
  color:var(--texto);font-family:'Segoe UI',Roboto,sans-serif;padding:20px}
.login-cartao{width:100%;max-width:400px;display:flex;flex-direction:column;gap:14px}
.login-topo{display:flex;align-items:center;gap:14px;margin-bottom:6px}
.login-btn{margin-top:4px;padding:11px}
.login-sep{text-align:center;color:var(--rotulo);font-size:11px;letter-spacing:2px;text-transform:uppercase}
.login-oauth{display:flex;gap:10px}
.login-oauth .btn{flex:1}
.login-trocar{background:none;border:none;color:#7db5e8;cursor:pointer;font-size:13px;padding:6px}
.login-trocar:hover{text-decoration:underline}
.login-convite{font-size:13px;color:var(--ouro);border:1px solid var(--ouro-escuro);border-radius:8px;padding:10px 12px;background:#1a160c}

/* ===== MODAL ===== */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.65);display:grid;place-items:center;z-index:200;backdrop-filter:blur(4px);padding:20px}
.modal-caixa{background:linear-gradient(180deg,#15315a,#102543);border:1px solid var(--borda-azul);border-radius:14px;padding:26px 28px;width:100%;max-width:460px;box-shadow:0 24px 64px rgba(0,0,0,0.65)}
.modal-titulo{margin:0 0 10px;font-size:16px;font-weight:700;color:var(--texto);letter-spacing:0.3px}
.modal-msg{margin:0 0 18px;font-size:13.5px;color:var(--texto2);line-height:1.55}
.modal-acoes{display:flex;justify-content:flex-end;gap:10px;margin-top:22px}

/* === Botão modo edição (header) === */
.btn-modo-edicao{border:1px solid var(--borda-azul);background:transparent;color:var(--texto2);border-radius:8px;padding:5px 13px;font-size:12px;cursor:pointer;transition:all .2s;white-space:nowrap}
.btn-modo-edicao:hover{background:rgba(255,255,255,.07)}
.btn-modo-edicao.ativo{border-color:#4caf50;color:#4caf50}

/* === Modo visualização — bloqueia edição via CSS === */
[data-modo="visualizacao"] .grade-form input,
[data-modo="visualizacao"] .grade-form select,
[data-modo="visualizacao"] .grade-form textarea,
[data-modo="visualizacao"] .tabela.edicao input.cel,
[data-modo="visualizacao"] .tabela.edicao select.cel,
[data-modo="visualizacao"] .tabela.edicao textarea.cel{pointer-events:none;cursor:default}
[data-modo="visualizacao"] .cartao-cab .acoes,
[data-modo="visualizacao"] .acoes-linha,
[data-modo="visualizacao"] .btn-cadeado-secao,
[data-modo="visualizacao"] .cartao-risco,
[data-modo="visualizacao"] .painel-lembretes{display:none!important}

@media (max-width:1100px){.comando-grade{grid-template-columns:1fr}}
@media (max-width:760px){
  .conteudo{padding:16px 12px 40px}
  .topo{padding:10px 14px;flex-wrap:wrap}
  .topo-dir{width:100%;justify-content:flex-end}
  .grupo-linha{grid-template-columns:1fr 1fr;gap:8px}
  .grupo-nome{grid-column:1/-1}
  .rodape-dir{display:none}
}

/* ============================================================
   PAINEL DE PRONTIDÃO — Visão do Comando (v4)
   ============================================================ */

/* Faixa de indicadores (KPIs) */
.pc-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px}
.pc-kpi{position:relative;display:flex;flex-direction:row;align-items:center;justify-content:space-between;gap:10px;padding:8px 18px 8px 20px;background:linear-gradient(180deg,#15315a,#102543);border:1px solid var(--borda);border-radius:14px;overflow:hidden;box-shadow:0 4px 18px #00000040;transition:transform .15s ease,border-color .15s ease}
.pc-kpi:hover{transform:translateY(-2px);border-color:var(--borda-clara)}
.pc-kpi::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--rotulo)}
.pc-kpi-txt{display:flex;flex-direction:column;gap:1px}
.pc-kpi-lab{font-size:10.5px;letter-spacing:1.6px;text-transform:uppercase;color:var(--rotulo);font-weight:700}
.pc-kpi-val{font-family:var(--num);font-variant-numeric:tabular-nums;font-weight:800;font-size:28px;line-height:1;color:var(--texto);text-align:right}
.pc-kpi-sub{font-size:11px;color:var(--texto2);font-weight:500}
.pc-kpi.total::before{background:var(--verde)}
.pc-kpi.total .pc-kpi-val{color:#5fd394}
.pc-kpi.disp::before{background:var(--verde)}.pc-kpi.disp .pc-kpi-val{color:#5fd394}
.pc-kpi.restr::before{background:var(--ambar)}.pc-kpi.restr .pc-kpi-val{color:#e7bd58}
.pc-kpi.indisp::before{background:var(--rubi)}.pc-kpi.indisp .pc-kpi-val{color:#ee837c}

/* Linha herói */
.pc-grid{display:grid;grid-template-columns:0.7fr 1.3fr;gap:16px;margin-bottom:16px}
.pc-card{background:linear-gradient(180deg,#15315a,#112a4c);border:1px solid var(--borda);border-radius:16px;padding:20px 22px;box-shadow:0 6px 22px #00000045;margin-bottom:16px}
.pc-grid .pc-card{margin-bottom:0;padding:13px 22px}
.pc-card-head{display:flex;flex-direction:column;gap:1px;margin-bottom:7px}
.pc-card-rotulo{font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:#7db5e8;font-weight:700}
.pc-card-titulo{font-size:16px;font-weight:700;color:var(--texto);margin:0}

/* Medidor radial */
.pc-gauge-card{display:flex;flex-direction:column}
.pc-gauge-wrap{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:4px 0 2px}
.pc-gauge{width:168px;height:168px}
.pc-gauge-pct{font-family:var(--num);font-variant-numeric:tabular-nums;font-weight:800;font-size:39px;fill:var(--texto)}
.pc-gauge-pct.alto{fill:#5fd394}.pc-gauge-pct.medio{fill:#e7bd58}.pc-gauge-pct.baixo{fill:#ee837c}
.pc-gauge-lab{fill:var(--rotulo);font-size:8.5px;letter-spacing:1.5px;font-weight:700}
.pc-gauge-frac{fill:var(--texto2);font-size:10px}
.pc-gauge-leg{display:flex;gap:10px;width:100%}
.pc-leg{flex:1;display:flex;align-items:center;gap:8px;padding:7px 13px;border:1px solid var(--borda);border-radius:11px;background:rgba(15,34,62,0.5)}
.pc-leg i{width:9px;height:9px;border-radius:50%;flex:none}
.pc-leg .t{font-size:11px;color:var(--texto2);font-weight:600}
.pc-leg b{margin-left:auto;font-family:var(--num);font-variant-numeric:tabular-nums;font-size:17px;font-weight:800;color:var(--texto)}
.pc-leg.disp i{background:var(--verde)}.pc-leg.disp{border-color:rgba(47,174,110,0.35)}
.pc-leg.restr i{background:var(--ambar)}.pc-leg.restr{border-color:rgba(220,167,62,0.32)}
.pc-leg.indisp i{background:var(--rubi)}.pc-leg.indisp{border-color:rgba(212,85,79,0.32)}

/* Prontidão por modelo */
.pc-modelos-card{display:flex;flex-direction:column}
.pc-modelos{display:flex;flex-direction:column;flex:1;justify-content:center;gap:2px}
.pc-modelo{display:grid;grid-template-columns:128px 1fr auto;align-items:center;gap:18px;padding:9px 2px;border-bottom:1px solid var(--borda)}
.pc-modelo:last-child{border-bottom:none}
.pc-modelo.pc-vazio{opacity:0.5}
.pc-modelo-id{display:flex;flex-direction:column;align-items:flex-start;gap:3px}
.pc-desig{align-self:flex-start;font-family:var(--num);font-size:10.5px;font-weight:800;letter-spacing:1px;color:#e1c987;background:rgba(201,173,107,0.1);border:1px solid var(--ouro-escuro);border-radius:6px;padding:2px 7px}
.pc-modelo-nome{align-self:flex-start;text-align:left;font-style:normal;font-size:13.5px;font-weight:700;color:var(--texto)}
.pc-barra{display:flex;height:15px;border-radius:8px;background:rgba(255,255,255,0.045);border:1px solid var(--borda);overflow:hidden;box-shadow:inset 0 1px 3px rgba(0,0,0,0.35)}
.pc-barra .seg{height:100%;min-width:0}
.pc-barra .seg.disp{background:linear-gradient(90deg,#2b9d63,#3fc984)}
.pc-barra .seg.restr{background:linear-gradient(90deg,#c9962f,#e7bd58)}
.pc-barra .seg.indisp{background:linear-gradient(90deg,#c2453f,#e06b65)}
.pc-modelo-num{display:flex;flex-direction:column;align-items:flex-end;gap:2px;min-width:66px}
.pc-modelo-num .big{font-family:var(--num);font-variant-numeric:tabular-nums;font-size:21px;font-weight:800;color:var(--texto);line-height:1}
.pc-modelo-num .big .tot{color:var(--texto2);font-size:14px;font-weight:600}
.pc-modelo-num .pct{font-size:10px;font-weight:700;letter-spacing:.3px}
.pc-modelo-num .pct.alto{color:#5fd394}.pc-modelo-num .pct.medio{color:#e7bd58}.pc-modelo-num .pct.baixo{color:#ee837c}

/* Detalhamento (tabela) */
.pc-tabela-card .rolagem{overflow-x:auto}
.pc-tabela-card .exec-ref th,.pc-tabela-card .exec-ref td{text-align:left;padding:7px 14px}

/* Tabela "Informações por Anv" — colunas bem distribuídas, sem rolagem horizontal.
   Ordem: 1 Anv · 2 Situação · 3 Local · 4 Disp.Horas · 5 Disp.Dias ·
          6 Observações · 7 Disp.A/T · 8 Disp.C */
.pc-tabela-anv{table-layout:fixed;width:100%}
.pc-tabela-anv th,.pc-tabela-anv td{padding:9px 14px !important;white-space:nowrap}
.pc-tabela-anv .chip{padding:5px 10px;font-size:12.5px}
/* Identificação */
.pc-tabela-anv th:nth-child(1),.pc-tabela-anv td:nth-child(1){width:7%}
.pc-tabela-anv th:nth-child(2),.pc-tabela-anv td:nth-child(2){width:12%}
.pc-tabela-anv th:nth-child(3),.pc-tabela-anv td:nth-child(3){width:8%}
/* Disp. Horas / Disp. Dias */
.pc-tabela-anv th:nth-child(4),.pc-tabela-anv td:nth-child(4),
.pc-tabela-anv th:nth-child(5),.pc-tabela-anv td:nth-child(5){width:11%;text-align:center}
/* Observações — absorve o espaço restante */
.pc-tabela-anv th:nth-child(6),.pc-tabela-anv td:nth-child(6){width:28%}
.pc-tabela-anv td:nth-child(6).obs{white-space:normal;overflow:hidden;text-overflow:ellipsis}
/* Disp. A/T / Disp. C (à direita das observações) */
.pc-tabela-anv th:nth-child(7),.pc-tabela-anv td:nth-child(7),
.pc-tabela-anv th:nth-child(8),.pc-tabela-anv td:nth-child(8){width:11.5%;text-align:center}
.exec-ref .anv{font-weight:400;letter-spacing:0}
.exec-ref .anv .anv-num{font-family:var(--num);font-variant-numeric:tabular-nums;font-size:13px;font-weight:800;letter-spacing:.5px;color:var(--texto)}
.exec-ref .anv .anv-mod{font-size:10px;color:var(--texto2);font-weight:600;margin-top:2px;letter-spacing:.3px}

@media (max-width:1100px){
  .pc-grid{grid-template-columns:1fr}
  .pc-grid .pc-card{margin-bottom:0;padding:13px 22px}
}
@media (max-width:720px){
  .pc-kpis{grid-template-columns:repeat(2,1fr)}
  .pc-modelo{grid-template-columns:96px 1fr auto;gap:10px}
}

/* Borda azul clara fininha nos quadros do painel de comando */
.pc-kpi,.pc-card{border:1px solid var(--borda-azul) !important}

/* ============================================================
   PLANEJAMENTO DE MANUTENÇÕES (PlnjMnt.jsx) — PROFISSIONAL
   ============================================================ */

.plnj-wrapper{display:flex;flex-direction:column;gap:36px;padding:4px 0}

.plnj-frota-container{display:flex;flex-direction:column;gap:14px}

.plnj-hr{border:none;height:1px;margin:10px 0 22px;background:linear-gradient(90deg,transparent,var(--borda-azul) 15%,var(--borda-azul) 85%,transparent)}

.plnj-frota-nome{margin:0 0 2px;padding-left:4px;font-size:14px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:#7db5e8;text-shadow:0 0 20px rgba(122,181,232,0.15)}

/* ---- Card de seção (igual ao .cartao da Gestão da Frota) ---- */
.plnj-secao-card{background:linear-gradient(180deg,#15315a,#102543);border:1px solid var(--borda-azul);border-radius:12px;box-shadow:0 4px 18px rgba(0,0,0,0.4);overflow:hidden}

.plnj-secao-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;background:linear-gradient(90deg,rgba(125,181,232,0.08),transparent);border-bottom:1px solid var(--borda-azul)}

.plnj-secao-titulo{margin:0;font-size:13px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#7db5e8}

.plnj-vazio-msg{padding:26px 18px;text-align:center;color:var(--rotulo);font-style:italic;font-size:13px}

/* ---- Tabela ---- */
.plnj-tabela-container{overflow-x:auto}

.plnj-tabela-elegante{width:100%;border-collapse:collapse;font-size:13px}

.plnj-tabela-elegante thead{position:sticky;top:0;z-index:5;background:linear-gradient(180deg,#1f4878,#13325a);box-shadow:0 1px 0 var(--borda-azul)}

.plnj-tabela-elegante th{padding:11px 12px;text-align:left;font-size:10.5px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#7db5e8;white-space:nowrap;border-bottom:2px solid var(--borda-azul)}

.plnj-tabela-elegante th:last-child{width:40px}

.plnj-tabela-elegante tbody tr{border-bottom:1px solid var(--borda);transition:background-color 0.15s ease}

.plnj-tabela-elegante tbody tr:nth-child(even){background:rgba(125,181,232,0.03)}

.plnj-tabela-elegante tbody tr:hover{background:rgba(125,181,232,0.08)}

.plnj-tabela-elegante tbody tr:last-child{border-bottom:none}

.plnj-tabela-elegante td{padding:8px 10px;vertical-align:middle;color:var(--texto)}

.plnj-tabela-elegante td:last-child{text-align:center}

/* ---- Inputs / selects da tabela ---- */
.plnj-input,
.plnj-input-select{
  width:100%;
  min-width:90px;
  padding:7px 9px;
  border:1px solid var(--borda);
  border-radius:6px;
  background:rgba(255,255,255,0.03);
  color:var(--texto);
  font-size:13px;
  font-family:inherit;
  color-scheme:dark;
  transition:border-color 0.15s ease,background 0.15s ease,box-shadow 0.15s ease;
}

.plnj-input::placeholder{color:var(--rotulo)}

.plnj-input:hover,
.plnj-input-select:hover{border-color:var(--borda-clara)}

.plnj-input:focus,
.plnj-input-select:focus{
  outline:none;
  border-color:#7db5e8;
  background:rgba(125,181,232,0.10);
  box-shadow:0 0 0 3px rgba(125,181,232,0.15);
}

.plnj-input[type="date"]{font-family:var(--num)}

select.plnj-input-select option{background:#12294c;color:var(--texto)}

/* Selo de status OK / Não OK */
.plnj-input-select.ok{
  border-color:rgba(95,211,148,0.45);
  background:rgba(95,211,148,0.12);
  color:#5fd394;
  font-weight:700;
}
.plnj-input-select.ok:focus{border-color:#5fd394;box-shadow:0 0 0 3px rgba(95,211,148,0.18)}

.plnj-input-select.nok{
  border-color:rgba(255,107,96,0.45);
  background:rgba(255,107,96,0.12);
  color:#ff6b60;
  font-weight:700;
}
.plnj-input-select.nok:focus{border-color:#ff6b60;box-shadow:0 0 0 3px rgba(255,107,96,0.18)}

/* ---- Botão excluir linha ---- */
.plnj-btn-del{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  width:30px;
  height:30px;
  border:1px solid var(--borda-clara);
  border-radius:7px;
  background:transparent;
  color:var(--texto2);
  font-size:14px;
  line-height:1;
  cursor:pointer;
  transition:all 0.15s ease;
}

.plnj-btn-del:hover{
  border-color:var(--rubi);
  color:#ff6b60;
  background:rgba(255,107,96,0.12);
}

/* ---- Responsivo ---- */
@media (max-width:1100px){
  .plnj-tabela-elegante{font-size:12px}
  .plnj-tabela-elegante th,
  .plnj-tabela-elegante td{padding:8px 9px}
  .plnj-input,
  .plnj-input-select{font-size:12px;padding:6px 8px}
}

@media (max-width:760px){
  .plnj-wrapper{gap:26px}
  .plnj-secao-header{flex-direction:column;align-items:stretch;gap:10px}
  .plnj-secao-header .btn{width:100%}
  .plnj-frota-nome{font-size:16px}
  .plnj-tabela-elegante{font-size:11px}
  .plnj-tabela-elegante th,
  .plnj-tabela-elegante td{padding:7px 8px}
  .plnj-input,
  .plnj-input-select{font-size:11px;padding:5px 7px;min-width:70px}
}

/* LED nas abas (Nível 2) */
.aba-led {
  width: 8px !important;
  height: 8px !important;
  margin-left: 6px;
  vertical-align: middle;
  display: inline-block;
}

/* LED de notificação genérico (botão Gerentes de Frota e sub-abas) */
.led-notif {
  display: inline-block;
  width: 9px;
  height: 9px;
  margin-left: 7px;
  border-radius: 50%;
  background: var(--rubi);
  box-shadow: 0 0 6px rgba(212, 85, 79, 0.8);
  vertical-align: middle;
  flex-shrink: 0;
  animation: piscar 1.4s infinite linear;
}

/* Borda vermelha piscante em volta do planejamento de uma frota pendente */
.plnj-frota-alerta {
  border-color: var(--rubi) !important;
  animation: piscar-borda 1.4s infinite linear;
}

@keyframes piscar-borda {
  0%   { box-shadow: 0 0 0 2px rgba(212, 85, 79, 0.9), 0 4px 18px rgba(0,0,0,0.4); }
  50%  { box-shadow: 0 0 0 2px rgba(212, 85, 79, 0.2), 0 4px 18px rgba(0,0,0,0.4); }
  100% { box-shadow: 0 0 0 2px rgba(212, 85, 79, 0.9), 0 4px 18px rgba(0,0,0,0.4); }
}

/* Banner de notificação Plnj Mnt (Nível 3) */
.plnj-notif-banner {
  background: linear-gradient(180deg, rgba(212, 85, 79, 0.15), rgba(238, 131, 124, 0.08));
  border: 1px solid rgba(212, 85, 79, 0.4);
  border-left: 4px solid #d4554f;
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(212, 85, 79, 0.2);
}

.plnj-notif-conteudo {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.plnj-notif-texto {
  color: var(--texto);
  font-size: 13px;
  line-height: 1.4;
}

.plnj-notif-texto strong {
  color: #ff6b60;
  font-weight: 700;
}

/* ============================================================
   PESQUISA MNT (PesquisaMnt.jsx) — consulta cronológica
   ============================================================ */
.pmnt-wrapper{display:flex;flex-direction:column;gap:20px;padding:4px 0}

.pmnt-busca-barra{display:flex;flex-direction:column;gap:8px;max-width:420px}
.pmnt-busca-rotulo{font-size:10.5px;letter-spacing:1.6px;text-transform:uppercase;color:var(--rotulo);font-weight:700}
.pmnt-busca-input{background:#0f2444;border:1px solid var(--borda-azul);color:var(--texto);border-radius:10px;padding:12px 14px;font-size:18px;font-weight:700;letter-spacing:1px;width:100%;color-scheme:dark}
.pmnt-busca-input:focus{outline:2px solid #4a82c4;border-color:#4a82c4}
.pmnt-busca-input::placeholder{color:var(--rotulo);font-weight:400;letter-spacing:0}

.pmnt-vazio-inicial{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;padding:60px 20px;color:var(--texto2);border:1px dashed var(--borda-clara);border-radius:14px;background:rgba(15,34,62,0.35)}
.pmnt-vazio-icone{font-size:34px;opacity:0.85}
.pmnt-vazio-inicial p{margin:0;font-size:14px;max-width:460px;line-height:1.5}

.pmnt-cab-anv{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;padding:2px 2px 0}
.pmnt-cab-anv .bloco-titulo{margin:0}

.pmnt-split{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start}

.pmnt-coluna{margin-bottom:0}
.pmnt-coluna-cab{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.pmnt-contador{font-family:var(--num);font-variant-numeric:tabular-nums;font-size:12px;font-weight:800;color:#7db5e8;background:rgba(122,181,232,0.1);border:1px solid var(--borda-azul);border-radius:999px;padding:2px 10px}

.pmnt-tabela{font-size:13px}
.pmnt-tabela th{font-size:9.5px}
.pmnt-tabela td{padding:9px 10px;vertical-align:middle}
.pmnt-tabela .chip{padding:5px 9px;font-size:12px}
.pmnt-col-secao{width:108px}
.pmnt-col-lim{width:98px}
.pmnt-col-pot{width:92px}
.pmnt-col-delta{width:104px}

/* Cabeçalho agrupado: separa "Potencial (atual)" — azul — de "Projeção" — dourado */
.pmnt-grupo th{background:transparent;border-bottom:none;padding:8px 10px 2px;font-size:9px;letter-spacing:1.4px;text-transform:uppercase;font-weight:700}
.pmnt-grp-pot{color:#7db5e8 !important;text-align:center}
.pmnt-grp-proj{color:var(--ouro) !important;text-align:center;background:rgba(201,173,107,0.06) !important}
.pmnt-th-delta{color:var(--ouro) !important;background:rgba(201,173,107,0.06) !important}
.pmnt-cell-delta{background:rgba(201,173,107,0.05)}

/* Pílula de folga (Projeção) — dourada, distinta dos chips de potencial */
.pmnt-delta{display:inline-block;font-family:var(--num);font-variant-numeric:tabular-nums;font-size:12px;font-weight:700;color:#e1c987;background:rgba(201,173,107,0.12);border:1px solid var(--ouro-escuro);border-radius:8px;padding:5px 9px;white-space:nowrap}
.pmnt-delta.base{color:var(--texto2);background:transparent;border-color:transparent;font-weight:600}

.pmnt-tag{display:inline-block;font-size:9px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:#9fc1e6;background:rgba(122,181,232,0.08);border:1px solid var(--borda);border-radius:6px;padding:3px 7px;white-space:nowrap}
.pmnt-item-desc{font-size:13px;color:var(--texto);font-weight:600}
.pmnt-item-apl{color:var(--texto2);font-weight:500}
.pmnt-item-os{font-size:11px;color:var(--texto2);margin-top:2px}
.pmnt-lim{font-size:12.5px;color:var(--texto2);white-space:nowrap}

@media (max-width:1100px){
  .pmnt-split{grid-template-columns:1fr}
}
`;
