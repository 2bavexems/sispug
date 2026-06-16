// src/pages/Gestao.jsx — Cadastro e Edição (lista de aeronaves)
import { useState } from "react";
import { tsnAtrasado, deveConfirmarMnt, notificacoes } from "../lib/domain";
import { SeloSituacao } from "../components/SeloSituacao";
import { PlnjMnt } from "./PlnjMnt";
import { PesquisaMnt } from "./PesquisaMnt";

export function Gestao({ fleet, abrir, adicionar }) {
  const [abaAtiva, setAbaAtiva] = useState("sisdelu");
  const notif = notificacoes(fleet);

  // Agrupa aeronaves por modelo
  const gruposPorModelo = {
    "HM-1A Pantera K2": fleet.ordem.filter(n => n.startsWith("2")),
    "HM-2A Black Hawk": fleet.ordem.filter(n => n.startsWith("3")),
    "HM-3 Cougar": fleet.ordem.filter(n => n.startsWith("4"))
  };

  return (
    <>
      <div className="gestao-abas-header">
        <button
          className={`aba-gestao ${abaAtiva === "sisdelu" ? "ativa" : ""}`}
          onClick={() => setAbaAtiva("sisdelu")}
        >
          SisDeLu{notif.sisdelu && <i className="led-notif" title="Pendências de TSN ou Mnt" />}
        </button>
        <button
          className={`aba-gestao ${abaAtiva === "pesquisamnt" ? "ativa" : ""}`}
          onClick={() => setAbaAtiva("pesquisamnt")}
        >
          Pesquisa Mnt
        </button>
        <button
          className={`aba-gestao ${abaAtiva === "plnjmnt" ? "ativa" : ""}`}
          onClick={() => setAbaAtiva("plnjmnt")}
        >
          Plnj Mnt{notif.plnjmnt && <i className="led-notif" title="Planejamento pendente" />}
        </button>
      </div>

      {abaAtiva === "sisdelu" && (
        <>
          <div style={{ marginBottom: "20px", textAlign: "right" }}>
            <button className="btn primario" onClick={adicionar}>+ Adicionar aeronave</button>
          </div>

          {Object.entries(gruposPorModelo).map(([modelo, numerais], idx) =>
            numerais.length > 0 && (
              <div key={modelo} className="gestao-grupo">
                {idx > 0 && <div className="gestao-divider" />}
                <div className="gestao-grupo-titulo">{modelo}</div>
                <div className="cartoes-anv-grid">
                  {numerais.map((n) => {
                    const a = fleet.aeronaves[n];
                    const temPendencia = tsnAtrasado(a) || deveConfirmarMnt(a);
                    return (
                      <button
                        key={n}
                        className={`cartao cartao-anv-premium ${temPendencia ? "cartao-alerta" : ""}`}
                        onClick={() => abrir(n)}
                        title={temPendencia ? "Pendências - clique para ver" : ""}
                      >
                        <div className="cartao-anv-topo-centralizado">
                          <span className="mono anv-grande">{n}</span>
                          <SeloSituacao s={a.situacao} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </>
      )}

      {abaAtiva === "plnjmnt" && <PlnjMnt />}

      {abaAtiva === "pesquisamnt" && <PesquisaMnt />}
    </>
  );
}
