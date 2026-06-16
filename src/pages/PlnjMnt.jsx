// src/pages/PlnjMnt.jsx — Planejamento de Manutenções (salvo no navegador)
import { MODELO_DESIG, devePlanejar } from "../lib/domain";
import { useFleet } from "../contexts/FleetContext";

export function PlnjMnt() {
  const {
    fleet, confirmarPlnj,
    addManutencaoPlnj, updateManutencaoPlnj, deleteManutencaoPlnj,
  } = useFleet();

  // Planejamento agora vem da frota (IndexedDB); usa vazio como padrão
  const planejamento = fleet.planejamento || {};
  const manutencoesDe = (modelo) => planejamento[modelo]?.manutencoes ?? [];

  // Reordena os modelos: Pantera K2, Cougar, Black Hawk
  const modelosOrdenados = ["Pantera K2", "Cougar", "Black Hawk"];

  const addManutencao = (modelo) => addManutencaoPlnj(modelo);
  const deleteManutencao = (modelo, id) => deleteManutencaoPlnj(modelo, id);
  const updateManutencao = (modelo, id, field, value) => updateManutencaoPlnj(modelo, id, field, value);

  return (
    <div className="plnj-wrapper">

      {modelosOrdenados.map((modelo, idx) => {
        const pendente = devePlanejar(fleet, modelo);
        return (
        <div key={modelo}>
          {idx > 0 && <div className="plnj-hr" />}

          <h2 className="plnj-frota-nome">{MODELO_DESIG[modelo]} — {modelo}</h2>

          {pendente && (
            <div className="plnj-notif-banner">
              <div className="plnj-notif-conteudo">
                <i className="led atrasado" />
                <span className="plnj-notif-texto">
                  <strong>Planejamento pendente.</strong> Atualize planejamento das próximas 3 semanas (S, S+1, S+2).
                </span>
              </div>
              <button className="btn primario" onClick={() => confirmarPlnj(modelo)}>Planejado</button>
            </div>
          )}

          {/* MANUTENÇÕES */}
          <div className={`plnj-secao-card ${pendente ? "plnj-frota-alerta" : ""}`}>
            <div className="plnj-secao-header">
              <h3 className="plnj-secao-titulo">Planejamento das Manutenções</h3>
              <button className="btn primario" onClick={() => addManutencao(modelo)}>
                + Adicionar
              </button>
            </div>

            {manutencoesDe(modelo).length === 0 ? (
              <div className="plnj-vazio-msg">Nenhuma manutenção cadastrada</div>
            ) : (
              <div className="plnj-tabela-container">
                <table className="plnj-tabela-elegante">
                  <thead>
                    <tr>
                      <th>Semana</th>
                      <th>Anv</th>
                      <th>Manutenção</th>
                      <th>Prazo</th>
                      <th>Sup.</th>
                      <th>Ferram.</th>
                      <th>Observações</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {manutencoesDe(modelo).map((m) => (
                      <tr key={m.id}>
                        <td><select className="plnj-input-select" value={m.semana} onChange={(e) => updateManutencao(modelo, m.id, "semana", e.target.value)}><option>S</option><option>S+1</option><option>S+2</option><option>Outros</option></select></td>
                        <td><input type="text" className="plnj-input" value={m.anv} onChange={(e) => updateManutencao(modelo, m.id, "anv", e.target.value)} placeholder="2026" /></td>
                        <td><input type="text" className="plnj-input" value={m.manutencao} onChange={(e) => updateManutencao(modelo, m.id, "manutencao", e.target.value)} placeholder="Descrição" /></td>
                        <td><input type="date" className="plnj-input" value={m.prazo} onChange={(e) => updateManutencao(modelo, m.id, "prazo", e.target.value)} /></td>
                        <td><select className={`plnj-input-select ${m.suprimento === "OK" ? "ok" : "nok"}`} value={m.suprimento} onChange={(e) => updateManutencao(modelo, m.id, "suprimento", e.target.value)}><option>OK</option><option>Não OK</option></select></td>
                        <td><select className={`plnj-input-select ${m.ferramental === "OK" ? "ok" : "nok"}`} value={m.ferramental} onChange={(e) => updateManutencao(modelo, m.id, "ferramental", e.target.value)}><option>OK</option><option>Não OK</option></select></td>
                        <td><input type="text" className="plnj-input" value={m.obs} onChange={(e) => updateManutencao(modelo, m.id, "obs", e.target.value)} placeholder="—" /></td>
                        <td><button className="plnj-btn-del" onClick={() => deleteManutencao(modelo, m.id)}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        );
      })}
    </div>
  );
}
