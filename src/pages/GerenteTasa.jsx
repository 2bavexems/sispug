// src/pages/GerenteTasa.jsx — Gerente TASA (Plnj Missões + Pessoal e Material)
import { useState } from "react";
import { useFleet } from "../contexts/FleetContext";

const PESSOAL_VAZIO = { especialistas: [], auxiliares: [], motoristas: [] };

export function GerenteTasa() {
  const [abaAtiva, setAbaAtiva] = useState("missoes");
  const {
    fleet,
    addMissaoTasa, updateMissaoTasa, deleteMissaoTasa,
    addPessoalTasa, updatePessoalTasa, deletePessoalTasa,
    addMaterialTasa, updateMaterialTasa, deleteMaterialTasa,
  } = useFleet();

  const tasa = fleet.tasa || {};
  const missoes = tasa.missoes || [];
  const pessoal = { ...PESSOAL_VAZIO, ...(tasa.pessoal || {}) };
  const material = tasa.material || [];

  return (
    <>
      <div className="gestao-abas-header">
        <button
          className={`aba-gestao ${abaAtiva === "missoes" ? "ativa" : ""}`}
          onClick={() => setAbaAtiva("missoes")}
        >
          Plnj Missões
        </button>
        <button
          className={`aba-gestao ${abaAtiva === "pessoalmaterial" ? "ativa" : ""}`}
          onClick={() => setAbaAtiva("pessoalmaterial")}
        >
          Pessoal e Material
        </button>
      </div>

      {abaAtiva === "missoes" && (
        <div className="plnj-wrapper">
          <h2 className="plnj-frota-nome">TASA — Planejamento de Missões</h2>

          <div className="plnj-secao-card">
            <div className="plnj-secao-header">
              <h3 className="plnj-secao-titulo">Planejamento das Missões</h3>
              <button className="btn primario" onClick={addMissaoTasa}>+ Adicionar</button>
            </div>

            {missoes.length === 0 ? (
              <div className="plnj-vazio-msg">Nenhuma missão cadastrada</div>
            ) : (
              <div className="plnj-tabela-container">
                <table className="plnj-tabela-elegante">
                  <thead>
                    <tr>
                      <th>Semana</th>
                      <th>Missão</th>
                      <th>Data Inicial</th>
                      <th>Data Final</th>
                      <th>Pessoal</th>
                      <th>Pessoal ✓</th>
                      <th>Observações</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {missoes.map((m) => (
                      <tr key={m.id}>
                        <td><select className="plnj-input-select" value={m.semana} onChange={(e) => updateMissaoTasa(m.id, "semana", e.target.value)}><option>S</option><option>S+1</option><option>S+2</option></select></td>
                        <td><input type="text" className="plnj-input" value={m.missao} onChange={(e) => updateMissaoTasa(m.id, "missao", e.target.value)} placeholder="Descrição da missão" /></td>
                        <td><input type="date" className="plnj-input" value={m.dataInicial} onChange={(e) => updateMissaoTasa(m.id, "dataInicial", e.target.value)} /></td>
                        <td><input type="date" className="plnj-input" value={m.dataFinal} onChange={(e) => updateMissaoTasa(m.id, "dataFinal", e.target.value)} /></td>
                        <td><input type="text" className="plnj-input" value={m.pessoal} onChange={(e) => updateMissaoTasa(m.id, "pessoal", e.target.value)} placeholder="Equipe / efetivo" /></td>
                        <td><select className={`plnj-input-select ${m.pessoalOk === "OK" ? "ok" : "nok"}`} value={m.pessoalOk} onChange={(e) => updateMissaoTasa(m.id, "pessoalOk", e.target.value)}><option>OK</option><option>Não OK</option></select></td>
                        <td><input type="text" className="plnj-input" value={m.obs} onChange={(e) => updateMissaoTasa(m.id, "obs", e.target.value)} placeholder="—" /></td>
                        <td><button className="plnj-btn-del" onClick={() => deleteMissaoTasa(m.id)}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {abaAtiva === "pessoalmaterial" && (
        <div className="tasa-split">
          {/* PESSOAL TASA */}
          <div className="plnj-secao-card">
            <div className="plnj-secao-header">
              <h3 className="plnj-secao-titulo">Pessoal TASA</h3>
            </div>
            <div className="tasa-pessoal-cols">
              {[
                { key: "especialistas", titulo: "Especialistas" },
                { key: "auxiliares", titulo: "Auxiliares" },
                { key: "motoristas", titulo: "Mot MOPP" },
              ].map((col) => (
                <div key={col.key} className="tasa-pessoal-col">
                  <div className="plnj-tabela-container">
                    <table className="plnj-tabela-elegante tasa-pessoal-tabela">
                      <thead>
                        <tr>
                          <th>{col.titulo}</th>
                          <th>Situação</th>
                          <th>Obs</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {pessoal[col.key].length === 0 && (
                          <tr><td colSpan={4} className="tasa-vazio-mini-cell">—</td></tr>
                        )}
                        {pessoal[col.key].map((p) => (
                          <tr key={p.id}>
                            <td>
                              <input
                                type="text"
                                className="plnj-input"
                                value={p.nome}
                                onChange={(e) => updatePessoalTasa(col.key, p.id, "nome", e.target.value)}
                                placeholder="Nome"
                              />
                            </td>
                            <td>
                              <select
                                className={`plnj-input-select ${(p.situacao || "Disponível") === "Disponível" ? "ok" : "nok"}`}
                                value={p.situacao || "Disponível"}
                                onChange={(e) => updatePessoalTasa(col.key, p.id, "situacao", e.target.value)}
                              >
                                <option>Disponível</option>
                                <option>Indisponível</option>
                              </select>
                            </td>
                            <td>
                              <input
                                type="text"
                                className="plnj-input"
                                value={p.obs || ""}
                                onChange={(e) => updatePessoalTasa(col.key, p.id, "obs", e.target.value)}
                                placeholder="—"
                              />
                            </td>
                            <td><button className="plnj-btn-del" onClick={() => deletePessoalTasa(col.key, p.id)}>✕</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button className="btn fantasma tasa-add-col" onClick={() => addPessoalTasa(col.key)}>+ Adicionar</button>
                </div>
              ))}
            </div>
          </div>

          {/* MATERIAL TASA */}
          <div className="plnj-secao-card">
            <div className="plnj-secao-header">
              <h3 className="plnj-secao-titulo">Material TASA</h3>
              <button className="btn primario" onClick={addMaterialTasa}>+ Adicionar</button>
            </div>
            {material.length === 0 ? (
              <div className="plnj-vazio-msg">Nenhum material cadastrado</div>
            ) : (
              <div className="plnj-tabela-container">
                <table className="plnj-tabela-elegante tasa-material-tabela">
                  <thead>
                    <tr>
                      <th className="tasa-col-material">Material</th>
                      <th className="tasa-col-num">Total</th>
                      <th className="tasa-col-num">Disponível</th>
                      <th className="tasa-col-num">Indisponível</th>
                      <th className="tasa-col-obs">Observações</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {material.map((m) => (
                      <tr key={m.id}>
                        <td><input type="text" className="plnj-input" value={m.material} onChange={(e) => updateMaterialTasa(m.id, "material", e.target.value)} placeholder="Item" /></td>
                        <td><input type="text" inputMode="numeric" className="plnj-input tasa-num" value={m.total} onChange={(e) => updateMaterialTasa(m.id, "total", e.target.value)} placeholder="0" /></td>
                        <td><input type="text" inputMode="numeric" className="plnj-input tasa-num" value={m.disponivel} onChange={(e) => updateMaterialTasa(m.id, "disponivel", e.target.value)} placeholder="0" /></td>
                        <td><input type="text" inputMode="numeric" className="plnj-input tasa-num" value={m.indisponivel} onChange={(e) => updateMaterialTasa(m.id, "indisponivel", e.target.value)} placeholder="0" /></td>
                        <td><input type="text" className="plnj-input" value={m.obs} onChange={(e) => updateMaterialTasa(m.id, "obs", e.target.value)} placeholder="—" /></td>
                        <td><button className="plnj-btn-del" onClick={() => deleteMaterialTasa(m.id)}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
