// src/pages/PesquisaMnt.jsx — Pesquisa Mnt
// ----------------------------------------------------------------------------
// Aba de CONSULTA (somente leitura) das manutenções do SisDeLu. O gerente
// digita o numeral de uma aeronave e a tela se divide em dois: à esquerda,
// todas as manutenções Horárias em ordem crescente; à direita, todas as
// Calendáricas (incluindo as Grandes Inspeções) em ordem crescente. Nenhum
// dado é alterado aqui — é uma releitura organizada do que já existe no SisDeLu.
// ----------------------------------------------------------------------------
import { useState } from "react";
import { useFleet } from "../contexts/FleetContext";
import { pesquisaManutencoes, fmtData, nivel } from "../lib/domain";
import { SeloSituacao } from "../components/SeloSituacao";

// Chip de potencial (horas/dias) com a mesma cor de criticidade do resto do app
function ChipPot({ pot, unidade, tipoNivel }) {
  const u = unidade === "h" ? "h" : "d";
  const cls = nivel(pot, u, tipoNivel);
  const txt =
    pot === null || pot === undefined || isNaN(pot)
      ? "—"
      : pot < 0
      ? "VENCIDO"
      : `${pot} ${u === "h" ? "h" : "dias"}`;
  return <span className={"chip " + cls}>{txt}</span>;
}

// Uma coluna (Horárias ou Calendáricas)
function ListaMnt({ titulo, itens, unidade, vazioMsg }) {
  return (
    <section className="cartao pmnt-coluna">
      <div className="pmnt-coluna-cab">
        <h3 className="secao-titulo" style={{ margin: 0 }}>{titulo}</h3>
        <span className="pmnt-contador">{itens.length}</span>
      </div>
      <div className="rolagem">
        <table className="tabela pmnt-tabela">
          <thead>
            <tr className="grupo-cab pmnt-grupo">
              <th colSpan="3"></th>
              <th colSpan="2" className="pmnt-grp-pot divisor-dir">Potencial (atual)</th>
              <th className="pmnt-grp-proj">Projeção</th>
            </tr>
            <tr>
              <th className="pmnt-col-secao">Seção</th>
              <th>Item</th>
              <th className="pmnt-col-lim divisor-dir">Limite</th>
              <th className="centro pmnt-col-pot">Pot. s/ext</th>
              <th className="centro pmnt-col-pot divisor-dir">Pot. c/ext</th>
              <th className="centro pmnt-col-delta pmnt-th-delta" title="Disponibilidade adicional ganha após executar o item anterior (com ext.)">Folga adic.</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((it) => {
              const limTxt =
                unidade === "h"
                  ? (it.limiteCom || it.limiteSem)
                    ? `${it.limiteCom || it.limiteSem} h`
                    : "—"
                  : fmtData(it.limiteCom || it.limiteSem);
              return (
                <tr key={it.id}>
                  <td><span className="pmnt-tag">{it.secaoLabel}</span></td>
                  <td>
                    <div className="pmnt-item-desc">
                      {it.descricao || "—"}
                      {it.aplicacao ? <span className="pmnt-item-apl"> · {it.aplicacao}</span> : null}
                    </div>
                  </td>
                  <td className="mono pmnt-lim divisor-dir">{limTxt}</td>
                  <td className="centro"><ChipPot pot={it.potSem} unidade={unidade} tipoNivel={it.tipoNivel} /></td>
                  <td className="centro divisor-dir"><ChipPot pot={it.potCom} unidade={unidade} tipoNivel={it.tipoNivel} /></td>
                  <td className="centro pmnt-cell-delta">
                    {it.delta === null || it.delta === undefined || isNaN(it.delta) ? (
                      <span className="pmnt-delta base">—</span>
                    ) : (
                      <span className={"pmnt-delta" + (it.deltaBase ? " base" : "")}>
                        {it.deltaBase ? "" : "+"}{it.delta} {unidade === "h" ? "h" : "dias"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {itens.length === 0 && (
              <tr><td colSpan="6" className="vazio">{vazioMsg}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function PesquisaMnt() {
  const { fleet } = useFleet();
  const [busca, setBusca] = useState("");

  const numeral = busca.trim();
  const anv = numeral ? fleet.aeronaves[numeral] : null;
  const { horarias, calendaricas } = pesquisaManutencoes(anv);

  return (
    <div className="pmnt-wrapper">
      <div className="pmnt-busca-barra">
        <label className="pmnt-busca-rotulo" htmlFor="pmnt-input">Numeral da aeronave</label>
        <input
          id="pmnt-input"
          className="pmnt-busca-input mono"
          list="pmnt-numerais"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Ex.: 2006"
          autoFocus
        />
        <datalist id="pmnt-numerais">
          {fleet.ordem.map((n) => <option key={n} value={n} />)}
        </datalist>
      </div>

      {!numeral && (
        <div className="pmnt-vazio-inicial">
          <div className="pmnt-vazio-icone">🔎</div>
          <p>Digite o numeral de uma aeronave para consultar todas as manutenções em ordem cronológica.</p>
        </div>
      )}

      {numeral && !anv && (
        <div className="pmnt-vazio-inicial">
          <div className="pmnt-vazio-icone">⚠️</div>
          <p>Nenhuma aeronave encontrada com o numeral <strong className="mono">{numeral}</strong>.</p>
        </div>
      )}

      {anv && (
        <>
          <div className="pmnt-cab-anv">
            <div>
              <div className="bloco-rotulo">{anv.modelo}</div>
              <h2 className="bloco-titulo" style={{ margin: 0 }}>
                Aeronave <span className="mono">{anv.numeral}</span>
              </h2>
            </div>
            <SeloSituacao s={anv.situacao} />
          </div>

          <div className="pmnt-split">
            <ListaMnt
              titulo="Horárias"
              itens={horarias}
              unidade="h"
              vazioMsg="Nenhuma manutenção horária cadastrada."
            />
            <ListaMnt
              titulo="Calendáricas"
              itens={calendaricas}
              unidade="d"
              vazioMsg="Nenhuma manutenção calendárica cadastrada."
            />
          </div>

          <div className="legenda">
            <span><i className="led vencido" /> Vencido</span>
            <span><i className="led critico" /> Crítico</span>
            <span><i className="led alerta" /> Alerta</span>
            <span><i className="led normal" /> Normal</span>
            <span><strong>Folga adic.</strong> = disponibilidade extra ganha após executar o item anterior (com ext.).</span>
            <span>Ordenado do mais próximo de vencer para o mais distante · somente consulta.</span>
          </div>
        </>
      )}
    </div>
  );
}
