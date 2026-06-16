// src/pages/VisaoComando.jsx — Visão do Comando (Painel de Prontidão da Frota)
import { MODELOS, MODELO_DESIG, limitesOrdenados, classSituacao, diasAte } from "../lib/domain";
import { Gauge } from "../components/Gauge";
import { SeloSituacao } from "../components/SeloSituacao";
import { ChipValor } from "../components/ChipValor";

export function VisaoComando({ fleet, abrir }) {
  const lista = fleet.ordem.map((n) => fleet.aeronaves[n]);

  const contar = (arr) => ({
    total: arr.length,
    disp: arr.filter((a) => a.situacao === "Disponível").length,
    restr: arr.filter((a) => a.situacao && a.situacao.startsWith("Restr.")).length,
    indisp: arr.filter((a) => a.situacao === "Indisponível").length,
  });

  const g = contar(lista);
  const pctDe = (n) => (g.total ? Math.round((n / g.total) * 100) : 0);
  const modelos = MODELOS.map((m) => ({
    nome: m,
    desig: MODELO_DESIG[m] || "",
    c: contar(lista.filter((a) => a.modelo === m)),
  }));

  return (
    <>
      <h2 className="gestao-titulo">Visão do Comando</h2>

      {/* Faixa de indicadores */}
      <div className="pc-kpis">
        <div className="pc-kpi total">
          <div className="pc-kpi-txt">
            <span className="pc-kpi-lab">Frota Total</span>
            <span className="pc-kpi-sub">aeronaves</span>
          </div>
          <span className="pc-kpi-val">{g.total}</span>
        </div>
        <div className="pc-kpi disp">
          <div className="pc-kpi-txt">
            <span className="pc-kpi-lab">Disponíveis</span>
            <span className="pc-kpi-sub">{pctDe(g.disp)}% da frota</span>
          </div>
          <span className="pc-kpi-val">{g.disp}</span>
        </div>
        <div className="pc-kpi restr">
          <div className="pc-kpi-txt">
            <span className="pc-kpi-lab">Restritas</span>
            <span className="pc-kpi-sub">{pctDe(g.restr)}% da frota</span>
          </div>
          <span className="pc-kpi-val">{g.restr}</span>
        </div>
        <div className="pc-kpi indisp">
          <div className="pc-kpi-txt">
            <span className="pc-kpi-lab">Indisponíveis</span>
            <span className="pc-kpi-sub">{pctDe(g.indisp)}% da frota</span>
          </div>
          <span className="pc-kpi-val">{g.indisp}</span>
        </div>
      </div>

      {/* Linha herói: medidor + prontidão por modelo */}
      <div className="pc-grid">
        <div className="pc-card pc-gauge-card">
          <div className="pc-card-head">
            <h3 className="pc-card-titulo">Gráfico de Disponibilidade da Frota</h3>
          </div>
          <div className="pc-gauge-wrap">
            <Gauge disp={g.disp} restr={g.restr} indisp={g.indisp} />
            <div className="pc-gauge-leg">
              <div className="pc-leg disp"><i /><span className="t">Disponível</span><b>{g.disp}</b></div>
              <div className="pc-leg restr"><i /><span className="t">Restrita</span><b>{g.restr}</b></div>
              <div className="pc-leg indisp"><i /><span className="t">Indisponível</span><b>{g.indisp}</b></div>
            </div>
          </div>
        </div>

        <div className="pc-card pc-modelos-card">
          <div className="pc-card-head">
            <h3 className="pc-card-titulo">Prontidão por Modelo</h3>
          </div>
          <div className="pc-modelos">
            {modelos.map((m) => {
              const pct = m.c.total ? Math.round((m.c.disp / m.c.total) * 100) : 0;
              const lvl = pct >= 80 ? "alto" : pct >= 50 ? "medio" : "baixo";
              return (
                <div key={m.nome} className={"pc-modelo" + (m.c.total ? "" : " pc-vazio")}>
                  <div className="pc-modelo-id">
                    <span className="pc-desig">{m.desig}</span>
                    <span className="pc-modelo-nome">{m.nome}</span>
                  </div>
                  <div className="pc-barra">
                    <div className="seg disp" style={{ flexGrow: m.c.disp }} />
                    <div className="seg restr" style={{ flexGrow: m.c.restr }} />
                    <div className="seg indisp" style={{ flexGrow: m.c.indisp }} />
                  </div>
                  <div className="pc-modelo-num">
                    <span className="big">{m.c.disp}<span className="tot">/{m.c.total}</span></span>
                    <span className={"pct " + lvl}>{m.c.total ? pct + "% pronto" : "sem aeronaves"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detalhamento da frota */}
      <div className="pc-card pc-tabela-card">
        <div className="pc-card-head">
          <h3 className="pc-card-titulo">Informações por Anv</h3>
        </div>
        <div className="rolagem">
          <table className="tabela exec-ref pc-tabela-anv">
            <thead>
              <tr>
                <th>Anv</th>
                <th>Situação</th>
                <th>Local</th>
                <th>Disp. Horas</th>
                <th>Disp. Dias</th>
                <th>Observações</th>
                <th>Disp. A/T</th>
                <th>Disp. C</th>
              </tr>
            </thead>
            <tbody>
              {fleet.ordem.map((n) => {
                const a = fleet.aeronaves[n];
                const { horas, dias } = limitesOrdenados(a);
                const vAt = diasAte(a.inspecoes.atCom);
                const vC = diasAte(a.inspecoes.inspC);
                return (
                  <tr key={n} className={"linha-sit " + classSituacao(a.situacao)} onClick={() => abrir(n)}>
                    <td className="anv">
                      <div className="anv-num">{n}</div>
                    </td>
                    <td><SeloSituacao s={a.situacao} /></td>
                    <td className="mono">{a.local || "—"}</td>
                    <td><ChipValor item={horas[0]} unidade="h" /></td>
                    <td><ChipValor item={dias[0]} unidade="d" /></td>
                    <td className="obs">{a.motivo || "—"}</td>
                    <td><ChipValor item={vAt === null ? null : { valor: vAt, tipo: "at" }} unidade="d" /></td>
                    <td><ChipValor item={vC === null ? null : { valor: vC, tipo: "inspC" }} unidade="d" /></td>
                  </tr>
                );
              })}
              {fleet.ordem.length === 0 && (
                <tr><td colSpan="8" className="vazio">Nenhuma aeronave cadastrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
