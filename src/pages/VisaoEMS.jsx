// src/pages/VisaoEMS.jsx — Leitura Técnica (visão da EMS)
import { useState } from "react";
import { MODELOS, limitesOrdenados, classSituacao, diasAte } from "../lib/domain";
import { SeloSituacao } from "../components/SeloSituacao";
import { ChipValor } from "../components/ChipValor";

export function VisaoEMS({ fleet, abrir }) {
  const [filtro, setFiltro] = useState("Todos");
  const filtros = ["Todos", ...MODELOS];
  const passa = (a) => {
    if (filtro === "Todos") return true;
    if (MODELOS.includes(filtro)) return a.modelo === filtro;
    return false;
  };

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
    </>
  );
}
