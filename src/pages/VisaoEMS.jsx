// src/pages/VisaoEMS.jsx — Leitura Técnica (visão da EMS)
import { useState } from "react";
import { MODELOS, MODELO_DESIG, limitesOrdenados, classSituacao, diasAte, fmtData } from "../lib/domain";
import { SeloSituacao } from "../components/SeloSituacao";
import { ChipValor } from "../components/ChipValor";

// Ordem das semanas para ordenar o resumo do planejamento
const ORDEM_SEMANA = { "S": 0, "S+1": 1, "S+2": 2, "Outros": 3 };

export function VisaoEMS({ fleet, abrir }) {
  const [filtro, setFiltro] = useState("Todos");
  const filtros = ["Todos", ...MODELOS];
  const passa = (a) => {
    if (filtro === "Todos") return true;
    if (MODELOS.includes(filtro)) return a.modelo === filtro;
    return false;
  };

  // Resumo do planejamento (aba Plnj Mnt) — somente leitura, ordenado por semana
  const planej = fleet.planejamento || {};
  const modelosPlan = MODELOS.filter((m) => filtro === "Todos" || m === filtro);
  const itensPlan = modelosPlan
    .flatMap((m) => (planej[m]?.manutencoes ?? []).map((mn) => ({ ...mn, modelo: m })))
    .sort((a, b) => {
      const sa = ORDEM_SEMANA[a.semana] ?? 9, sb = ORDEM_SEMANA[b.semana] ?? 9;
      if (sa !== sb) return sa - sb;
      return (a.prazo || "").localeCompare(b.prazo || "");
    });

  return (
    <>
      <div className="ems-cab">
        <div>
          <h2 className="gestao-titulo">Visão Geral</h2>
        </div>
        <div className="pilula-grupo">
          {filtros.map((f) => (
            <button key={f} className={f === filtro ? "ativa" : ""} onClick={() => setFiltro(f)}>{f}</button>
          ))}
        </div>
      </div>

      <div className="cartao card-azul">
        <div className="rolagem">
          <table className="tabela tecnica">
            <thead>
              <tr className="grupo-cab">
                <th colSpan="4" className="divisor-dir">Identificação</th>
                <th colSpan="4" className="divisor-dir">1º Limite</th>
                <th colSpan="4" className="divisor-dir">2º Limite</th>
                <th colSpan="2">Grandes Inspeções</th>
              </tr>
              <tr>
                <th className="col-anv">ANV</th><th className="col-sit">Situação</th><th className="col-local">Local</th>
                <th className="col-status divisor-dir">Status / Motivo</th>
                <th className="col-val">Horas Disp.</th><th className="col-nome">Mnt.</th>
                <th className="col-val">Dias Disp.</th><th className="col-nome divisor-dir">Mnt.</th>
                <th className="col-val">Horas Disp.</th><th className="col-nome">Mnt.</th>
                <th className="col-val">Dias Disp.</th><th className="col-nome divisor-dir">Mnt.</th>
                <th className="col-val">Venc. A/T</th><th className="col-val">Venc. C</th>
              </tr>
            </thead>
            <tbody>
              {fleet.ordem.map((n) => {
                const a = fleet.aeronaves[n];
                if (!passa(a)) return null;
                const { horas, dias } = limitesOrdenados(a);
                const vencAt = diasAte(a.inspecoes.atSem);
                const vencC = diasAte(a.inspecoes.inspC);
                return (
                  <tr key={n} className={"linha-sit " + classSituacao(a.situacao)} onClick={() => abrir(n)}>
                    <td className="mono anv">{n}</td>
                    <td><SeloSituacao s={a.situacao} /></td>
                    <td className="mono">{a.local || "—"}</td>
                    <td className="obs divisor-dir">{a.motivo || "Disponível"}</td>
                    <td><ChipValor item={horas[0]} unidade="h" /></td>
                    <td className="nome-manut">{horas[0]?.nome || "—"}</td>
                    <td><ChipValor item={dias[0]} unidade="d" /></td>
                    <td className="nome-manut divisor-dir">{dias[0]?.nome || "—"}</td>
                    <td><ChipValor item={horas[1]} unidade="h" /></td>
                    <td className="nome-manut">{horas[1]?.nome || "—"}</td>
                    <td><ChipValor item={dias[1]} unidade="d" /></td>
                    <td className="nome-manut divisor-dir">{dias[1]?.nome || "—"}</td>
                    <td><ChipValor item={{ valor: vencAt, tipo: "at" }} unidade="d" /></td>
                    <td><ChipValor item={{ valor: vencC, tipo: "inspC" }} unidade="d" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="legenda">
          <span><i className="led vencido" /> Vencido</span>
          <span><i className="led critico" /> Crítico (limites ≤ 10 h/dias · A/T &lt; 30 d · Insp C &lt; 100 d)</span>
          <span><i className="led alerta" /> Alerta (limites ≤ 20 h/dias · A/T ≤ 90 d · Insp C ≤ 365 d)</span>
          <span><i className="led normal" /> Normal</span>
          <span>Clique na linha para abrir a aeronave</span>
        </div>
      </div>

      {/* Resumo do Planejamento de Manutenções (próximas 3 semanas) */}
      <div className="cartao card-azul ems-plnj">
        <div className="ems-plnj-cab">
          <h3 className="ems-plnj-titulo">Planejamento de Manutenções · Próximas 3 Semanas</h3>
          <span className="ems-plnj-contagem">{itensPlan.length} {itensPlan.length === 1 ? "manutenção" : "manutenções"}</span>
        </div>
        <div className="rolagem">
          <table className="tabela ems-plnj-tabela">
            <thead>
              <tr>
                <th className="col-sem">Semana</th>
                <th className="col-anv">Anv</th>
                <th>Modelo</th>
                <th>Manutenção</th>
                <th className="col-prazo">Prazo</th>
                <th className="col-st">Sup.</th>
                <th className="col-st">Ferr.</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              {itensPlan.map((m) => {
                const d = m.prazo ? diasAte(m.prazo) : null;
                const clsPrazo = d === null ? "" : d < 0 ? " venc" : d <= 7 ? " crit" : d <= 21 ? " alerta" : "";
                return (
                  <tr key={m.modelo + m.id}>
                    <td><span className={"ems-plnj-sem s-" + (m.semana || "").replace("+", "")}>{m.semana || "—"}</span></td>
                    <td className="mono anv">{m.anv || "—"}</td>
                    <td className="mono">{MODELO_DESIG[m.modelo] || m.modelo}</td>
                    <td>{m.manutencao || "—"}</td>
                    <td className={"mono ems-plnj-prazo" + clsPrazo}>{m.prazo ? fmtData(m.prazo) : "—"}</td>
                    <td><i className={"led " + (m.suprimento === "OK" ? "ok" : "vencido")} title={m.suprimento} /></td>
                    <td><i className={"led " + (m.ferramental === "OK" ? "ok" : "vencido")} title={m.ferramental} /></td>
                    <td className="obs">{m.obs || "—"}</td>
                  </tr>
                );
              })}
              {itensPlan.length === 0 && (
                <tr><td colSpan="8" className="vazio">Nenhuma manutenção planejada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
