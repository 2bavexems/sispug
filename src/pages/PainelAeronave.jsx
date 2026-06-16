// src/pages/PainelAeronave.jsx — Painel da Aeronave (edição) — mutações vão direto ao FleetContext
import { useState } from "react";
import { useFleet } from "../contexts/FleetContext";
import {
  SITUACOES, MODELOS, APLICACOES,
  fmtData, diasAte, potencial, nivel, tsnAtrasado, tsnCampoAtrasado, TSN_CAMPOS, deveConfirmarMnt,
} from "../lib/domain";
import { Campo } from "../components/Campo";
import { Modal } from "../components/Modal";
import { Selo } from "../components/Selo";

export function PainelAeronave({ numeral, remover }) {
  const { fleet, updateAeronave, updateInspecoes, toggleTravado, confirmarMnt, modoEdicao } = useFleet();
  const anv = fleet.aeronaves[numeral];

  const campo = (k) => ({
    value: anv[k] ?? "",
    onChange: (e) => {
      const patch = { [k]: e.target.value };
      // Se está atualizando TSN Célula, GTM I ou GTM II, registra o timestamp
      // específico daquele campo (cada um dos 3 tem seu próprio "atualizado em")
      if (TSN_CAMPOS[k]) {
        patch[TSN_CAMPOS[k]] = new Date().toISOString();
      }
      updateAeronave(numeral, patch);
    }
  });
  const insp = (k) => ({ value: anv.inspecoes[k] ?? "", onChange: (e) => updateInspecoes(numeral, { [k]: e.target.value }) });

  // Função para verificar se um valor está vazio
  const estaVazio = (valor) => !valor && valor !== 0;

  // Função para verificar se um campo está travado
  const estaTravado = (campo) => anv.travados?.[campo] ?? false;

  // Detecta se é Pantera K2
  const isPanteraK2 = anv.modelo === "Pantera K2";

  // Cor do seletor de Situação — mesma paleta das abas Cmdo Btl e Cmt EMS
  const corSituacao = (s) =>
    s === "Disponível" ? "sel-sit-ok"
      : s && s.startsWith("Restr.") ? "sel-sit-alerta"
        : s === "Indisponível" ? "sel-sit-critico" : "";

  return (
    <>
      <div className="ems-cab">
        <div>
          <div className="bloco-rotulo">{anv.modelo}</div>
          <h2 className="bloco-titulo">Aeronave <span className="mono">{anv.numeral}</span></h2>
        </div>
        {(tsnAtrasado(anv) || deveConfirmarMnt(anv)) && (
          <div className="painel-lembretes">
            {tsnAtrasado(anv) && (
              <button className="btn-lembrete piscante" title="Atualizar TSN">
                <i className="led atrasado"></i> Atualizar TSN
              </button>
            )}
            {deveConfirmarMnt(anv) && (
              <button className="btn-lembrete piscante" onClick={() => confirmarMnt(numeral)} title="Marcar como conferido">
                <i className="led atrasado"></i> Conferir Mnt 100h/100d
              </button>
            )}
          </div>
        )}
      </div>

      <section className="cartao">
        <h3 className="secao-titulo">Dados Gerais</h3>
        <div className="grade-form" {...(!modoEdicao ? { inert: "" } : {})}>
          <Campo rotulo="Modelo" vazio={estaVazio(anv.modelo)}><select {...campo("modelo")}>{MODELOS.map((m) => <option key={m}>{m}</option>)}</select></Campo>
          <Campo rotulo="Situação" vazio={estaVazio(anv.situacao)}><select className={corSituacao(anv.situacao)} {...campo("situacao")}>{SITUACOES.map((s) => <option key={s}>{s}</option>)}</select></Campo>
          <Campo rotulo="Local" vazio={estaVazio(anv.local)}><input {...campo("local")} /></Campo>
          <Campo rotulo="TSN Célula (h)" vazio={estaVazio(anv.tsnCelula)} atrasado={tsnCampoAtrasado(anv, "tsnCelula")}><input type="number" step="0.1" className="mono" {...campo("tsnCelula")} /></Campo>
          <Campo rotulo="TSN GTM I (h)" vazio={estaVazio(anv.tsnGtm1)} atrasado={tsnCampoAtrasado(anv, "tsnGtm1")}><input type="number" step="0.1" className="mono" {...campo("tsnGtm1")} /></Campo>
          <Campo rotulo="TSN GTM II (h)" vazio={estaVazio(anv.tsnGtm2)} atrasado={tsnCampoAtrasado(anv, "tsnGtm2")}><input type="number" step="0.1" className="mono" {...campo("tsnGtm2")} /></Campo>
          <Campo rotulo="Pousos" vazio={!isPanteraK2 && estaVazio(anv.pousos)}>{isPanteraK2 ? (
            <input type="text" className="mono" value="não é o caso" disabled />
          ) : (
            <input type="number" className="mono" {...campo("pousos")} />
          )}</Campo>
          <Campo rotulo="Status / Motivo (Obs. Comando)" larga vazio={estaVazio(anv.motivo)}><input {...campo("motivo")} placeholder="Ex.: Falha no retorno do RadMet" /></Campo>
        </div>
      </section>

      <section className="cartao">
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <h3 className="secao-titulo" style={{ margin: 0 }}>Grandes Inspeções</h3>
          <button
            type="button"
            title={estaTravado("inspecoes") ? "Destravado para edição" : "Travar seção"}
            className={"btn-cadeado-secao " + (estaTravado("inspecoes") ? "travado" : "")}
            onClick={() => toggleTravado(numeral, "inspecoes")}
          >
            {estaTravado("inspecoes") ? "🔒" : "🔓"}
          </button>
        </div>
        <div className="grade-form" {...(!modoEdicao ? { inert: "" } : {})}>
          <Campo rotulo="A/T sem extensão" vazio={estaVazio(anv.inspecoes.atSem)}><input type="date" disabled={estaTravado("inspecoes")} {...insp("atSem")} /><Selo valor={diasAte(anv.inspecoes.atSem)} u="d" tipo="at" /></Campo>
          <Campo rotulo="A/T com extensão" vazio={estaVazio(anv.inspecoes.atCom)}><input type="date" disabled={estaTravado("inspecoes")} {...insp("atCom")} /><Selo valor={diasAte(anv.inspecoes.atCom)} u="d" tipo="at" /></Campo>
          <Campo rotulo="Inspeção C" vazio={estaVazio(anv.inspecoes.inspC)}><input type="date" disabled={estaTravado("inspecoes")} {...insp("inspC")} /><Selo valor={diasAte(anv.inspecoes.inspC)} u="d" tipo="inspC" /></Campo>
        </div>
      </section>

      <TabelaManutencao titulo="Limites de Vida" secao="limitesVida" numeral={numeral} />
      <TabelaManutencao titulo="Célula" secao="celula" numeral={numeral} />
      <TabelaManutencao titulo="Motores" secao="motores" numeral={numeral} comAplicacao />
      <TabelaManutencao titulo="Recheques / Diretivas / Outros" secao="recheques" numeral={numeral} />

      <TabelaAnotacoes numeral={numeral} />

      {/* Seção de Risco — no final, para evitar cliques acidentais */}
      <section className="cartao cartao-risco">
        <h3 className="secao-titulo">Zona de Perigo</h3>
        <div style={{ padding: "12px 0" }}>
          <button className="btn perigo" onClick={remover}>🗑️ Remover aeronave</button>
          <p style={{ fontSize: "12px", color: "#8fa6bd", marginTop: "10px", marginBottom: "0" }}>
            Esta ação é irreversível. Todos os registros da aeronave serão deletados.
          </p>
        </div>
      </section>
    </>
  );
}

function TabelaManutencao({ titulo, secao, numeral, comAplicacao }) {
  const { fleet, addManutencao, updateManutencao, duplicateManutencao, deleteManutencao, toggleTravado, modoEdicao } = useFleet();
  const anv = fleet.aeronaves[numeral];
  const [busca, setBusca] = useState("");
  const [modalExcluir, setModalExcluir] = useState({ aberto: false, row: null });
  const rows = anv[secao];

  const setRow = (id, patch) => updateManutencao(numeral, secao, id, patch);
  const trocarTipo = (r, tipo) => {
    if (estaTravado(r.id)) return;
    setRow(r.id, { tipo, limiteSem: "", limiteCom: "" });
  };
  const delRow = (r) => setModalExcluir({ aberto: true, row: r });
  const confirmarExcluir = () => {
    deleteManutencao(numeral, secao, modalExcluir.row.id);
    setModalExcluir({ aberto: false, row: null });
  };

  // Gera chave única para a linha travada
  const chaveTravado = (id) => `${secao}-${id}`;
  const estaTravado = (id) => anv.travados?.[chaveTravado(id)] ?? false;

  // Valor de vencimento usado para ordenar (prefere o limite com extensão;
  // se ausente, usa o sem extensão). Itens sem valor vão para o fim.
  const potOrdenacao = (r) => {
    const pc = potencial(r, r.limiteCom, anv, secao);
    if (pc !== null && !isNaN(pc)) return pc;
    const ps = potencial(r, r.limiteSem, anv, secao);
    return ps !== null && !isNaN(ps) ? ps : Infinity;
  };

  // Ordena automaticamente: primeiro as Horárias, depois as Calendáricas;
  // dentro de cada grupo, em ordem crescente de vencimento.
  const visiveis = rows
    .filter((r) => {
      const q = busca.toLowerCase();
      return !q || (r.os || "").toLowerCase().includes(q) || (r.descricao || "").toLowerCase().includes(q) || (r.tipo || "").toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const grupo = (t) => (t === "Horária" ? 0 : 1);
      const ga = grupo(a.tipo), gb = grupo(b.tipo);
      if (ga !== gb) return ga - gb;
      return potOrdenacao(a) - potOrdenacao(b);
    });

  return (
    <section className="cartao">
      <div className="cartao-cab">
        <h3 className="secao-titulo">{titulo}</h3>
        <div className="acoes">
          <input className="busca" placeholder="Buscar OS, descrição ou tipo…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <button className="btn primario" onClick={() => addManutencao(numeral, secao)}>+ Item</button>
        </div>
      </div>
      <div className="rolagem">
        <table className="tabela edicao">
          <thead>
            <tr>
              <th className="col-os">OS</th>
              <th className="col-desc">Descrição</th>
              {comAplicacao && <th className="col-apl">Aplicação</th>}
              <th className="col-tipo">Tipo</th>
              <th className="col-lim">Limite s/ ext.</th>
              <th className="col-lim">Limite c/ ext.</th>
              <th className="col-pot">Pot. s/ ext.</th>
              <th className="col-pot">Pot. c/ ext.</th>
              <th className="col-obs">Observações</th>
              <th className="col-acao"></th>
            </tr>
          </thead>
          <tbody {...(!modoEdicao ? { inert: "" } : {})}>
            {visiveis.map((r) => {
              const u = r.tipo === "Horária" ? "h" : "d";
              const pS = potencial(r, r.limiteSem, anv, secao);
              const pC = potencial(r, r.limiteCom, anv, secao);
              // Função local para checar vazio
              const estaVazio = (valor) => !valor && valor !== 0;
              return (
                <tr key={r.id}>
                  <td><span className={"cel-wrapper" + (estaVazio(r.os) ? " vazio" : "")}><input className="cel mono" disabled={estaTravado(r.id)} value={r.os} onChange={(e) => setRow(r.id, { os: e.target.value })} placeholder="OS-0000" /></span></td>
                  <td><span className={"cel-wrapper" + (estaVazio(r.descricao) ? " vazio" : "")}><input className="cel" disabled={estaTravado(r.id)} value={r.descricao} onChange={(e) => setRow(r.id, { descricao: e.target.value })} placeholder="Descrição do serviço" /></span></td>
                  {comAplicacao && (
                    <td><span className={"cel-wrapper" + (estaVazio(r.aplicacao) ? " vazio" : "")}><select className="cel" disabled={estaTravado(r.id)} value={r.aplicacao} onChange={(e) => setRow(r.id, { aplicacao: e.target.value })}>{APLICACOES.map((a) => <option key={a}>{a}</option>)}</select></span></td>
                  )}
                  <td><select className="cel" disabled={estaTravado(r.id)} value={r.tipo} onChange={(e) => trocarTipo(r, e.target.value)}><option>Calendárica</option><option>Horária</option></select></td>
                  <td><span className={"cel-wrapper" + (estaVazio(r.limiteSem) ? " vazio" : "")}>{r.tipo === "Horária"
                    ? <input type="number" step="0.1" className="cel mono" disabled={estaTravado(r.id)} value={r.limiteSem} onChange={(e) => setRow(r.id, { limiteSem: e.target.value })} placeholder="horas" />
                    : <input type="date" className="cel mono" disabled={estaTravado(r.id)} value={r.limiteSem} onChange={(e) => setRow(r.id, { limiteSem: e.target.value })} />}</span></td>
                  <td><span className={"cel-wrapper" + (estaVazio(r.limiteCom) ? " vazio" : "")}>{r.tipo === "Horária"
                    ? <input type="number" step="0.1" className="cel mono" disabled={estaTravado(r.id)} value={r.limiteCom} onChange={(e) => setRow(r.id, { limiteCom: e.target.value })} placeholder="horas" />
                    : <input type="date" className="cel mono" disabled={estaTravado(r.id)} value={r.limiteCom} onChange={(e) => setRow(r.id, { limiteCom: e.target.value })} />}</span></td>
                  <td className="centro" title={r.tipo === "Calendárica" ? `Vence em ${fmtData(r.limiteSem)}` : "Limite − TSN aplicável"}>
                    <span className={"chip " + nivel(pS, u)}>{pS === null ? "—" : pS < 0 ? "VENCIDO" : `${pS} ${u === "h" ? "h" : "dias"}`}</span>
                  </td>
                  <td className="centro" title={r.tipo === "Calendárica" ? `Vence em ${fmtData(r.limiteCom)}` : "Limite − TSN aplicável"}>
                    <span className={"chip " + nivel(pC, u)}>{pC === null ? "—" : pC < 0 ? "VENCIDO" : `${pC} ${u === "h" ? "h" : "dias"}`}</span>
                  </td>
                  <td><span className={"cel-wrapper" + (secao === "recheques" && estaVazio(r.obs) ? " vazio" : "")}><input className="cel" disabled={estaTravado(r.id)} value={r.obs} onChange={(e) => setRow(r.id, { obs: e.target.value })} placeholder="—" /></span></td>
                  <td className="acoes-linha">
                    <button
                      type="button"
                      title={estaTravado(r.id) ? "Destravado para edição" : "Travar linha"}
                      className={"btn-cadeado-linha " + (estaTravado(r.id) ? "travado" : "")}
                      onClick={() => toggleTravado(numeral, chaveTravado(r.id))}
                    >
                      {estaTravado(r.id) ? "🔒" : "🔓"}
                    </button>
                    <button title="Duplicar" onClick={() => duplicateManutencao(numeral, secao, r)}>⧉</button>
                    <button title="Excluir" className="del" onClick={() => delRow(r)}>✕</button>
                  </td>
                </tr>
              );
            })}
            {visiveis.length === 0 && (
              <tr><td colSpan={comAplicacao ? 10 : 9} className="vazio">
                {rows.length === 0 ? 'Nenhum item cadastrado. Use "+ Item" para registrar a primeira manutenção.' : "Nenhum item corresponde à busca."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        aberto={modalExcluir.aberto}
        titulo="Excluir Item"
        mensagem={`Excluir "${modalExcluir.row?.descricao || modalExcluir.row?.os || "item sem descrição"}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        perigo
        onConfirmar={confirmarExcluir}
        onCancelar={() => setModalExcluir({ aberto: false, row: null })}
      />
    </section>
  );
}

function TabelaAnotacoes({ numeral }) {
  const { fleet, addAnotacao, updateAnotacao, deleteAnotacao, modoEdicao } = useFleet();
  const anv = fleet.aeronaves[numeral];
  const anotacoes = anv.anotacoes || [];
  const [modalExcluir, setModalExcluir] = useState({ aberto: false, id: null });

  const setAnotacao = (id, patch) => updateAnotacao(numeral, id, patch);
  const delAnotacao = (id) => setModalExcluir({ aberto: true, id });
  const confirmarExcluir = () => {
    deleteAnotacao(numeral, modalExcluir.id);
    setModalExcluir({ aberto: false, id: null });
  };

  return (
    <section className="cartao">
      <div className="cartao-cab">
        <h3 className="secao-titulo">Anotações Diversas</h3>
        <div className="acoes">
          <button className="btn primario" onClick={() => addAnotacao(numeral)}>+ Anotação</button>
        </div>
      </div>
      <div className="rolagem">
        <table className="tabela edicao">
          <thead>
            <tr>
              <th style={{ width: "25%" }}>Assunto</th>
              <th style={{ width: "75%" }}>Descrição</th>
              <th style={{ width: "40px" }}></th>
            </tr>
          </thead>
          <tbody {...(!modoEdicao ? { inert: "" } : {})}>
            {anotacoes.map((n) => {
              const estaVazio = (valor) => !valor && valor !== 0;
              return (
                <tr key={n.id}>
                  <td><span className={"cel-wrapper" + (estaVazio(n.assunto) ? " vazio" : "")}><input className="cel" value={n.assunto} onChange={(e) => setAnotacao(n.id, { assunto: e.target.value })} placeholder="Ex.: Painel de instrumentos" /></span></td>
                  <td><span className={"cel-wrapper" + (estaVazio(n.descricao) ? " vazio" : "")}><input className="cel" value={n.descricao} onChange={(e) => setAnotacao(n.id, { descricao: e.target.value })} placeholder="Detalhes da anotação..." /></span></td>
                  <td className="acoes-linha">
                    <button title="Excluir" className="del" onClick={() => delAnotacao(n.id)}>✕</button>
                  </td>
                </tr>
              );
            })}
            {anotacoes.length === 0 && (
              <tr><td colSpan="3" className="vazio">Nenhuma anotação cadastrada. Use "+ Anotação" para adicionar.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        aberto={modalExcluir.aberto}
        titulo="Remover Anotação"
        mensagem="Remover esta anotação? Esta ação não pode ser desfeita."
        confirmLabel="Remover"
        perigo
        onConfirmar={confirmarExcluir}
        onCancelar={() => setModalExcluir({ aberto: false, id: null })}
      />
    </section>
  );
}
