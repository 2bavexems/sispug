// src/pages/Shell.jsx — topo, abas, rodapé (status de gravação local) e roteamento entre telas
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { useFleet } from "../contexts/FleetContext";
import { hoje, notificacoes, MODELOS } from "../lib/domain";
import { LogoEMS } from "../components/LogoEMS";
import { Modal } from "../components/Modal";
import { Campo } from "../components/Campo";
import { VisaoComando } from "./VisaoComando";
import { VisaoEMS } from "./VisaoEMS";
import { Gestao } from "./Gestao";
import { PainelAeronave } from "./PainelAeronave";

export function Shell() {
  const { fleet, salvoEm, exportar, importar, addAeronave, removeAeronave } = useFleet();
  const [visao, setVisao] = useState("comando");
  const fileRef = useRef(null);

  // ---- Estados dos modais (substituem prompt/confirm/alert) ----
  const [modalAdd, setModalAdd] = useState({ aberto: false, numeral: "", modelo: "Pantera K2" });
  const [modalRemover, setModalRemover] = useState({ aberto: false, numeral: null });
  const [importPendente, setImportPendente] = useState(null);

  // ---- Detecta modelo pelo prefixo do numeral (apenas sugestão inicial) ----
  const detectarModelo = (numeral) => {
    const p = (numeral || "").trim()[0];
    if (p === "2") return "Pantera K2";
    if (p === "3") return "Black Hawk";
    if (p === "4") return "Cougar";
    return "Pantera K2";
  };

  // ---- Adicionar aeronave ----
  const adicionarAeronave = () => {
    setModalAdd({ aberto: true, numeral: "", modelo: "Pantera K2" });
  };

  const confirmarAdd = async () => {
    const n = modalAdd.numeral.trim();
    if (!n) return;
    if (fleet.aeronaves[n]) {
      toast.error(`Já existe aeronave com o numeral ${n}.`);
      return;
    }
    setModalAdd({ aberto: false, numeral: "", modelo: "Pantera K2" });
    if (await addAeronave(n, modalAdd.modelo)) setVisao(n);
  };

  // ---- Remover aeronave ----
  const removerAeronave = (n) => {
    setModalRemover({ aberto: true, numeral: n });
  };

  const confirmarRemover = async () => {
    const n = modalRemover.numeral;
    setModalRemover({ aberto: false, numeral: null });
    if (await removeAeronave(n)) setVisao("gestao");
  };

  // ---- Importar backup ----
  const onImportFile = (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data.ordem || !data.aeronaves) throw new Error("Formato inválido");
        setImportPendente(data);
      } catch {
        toast.error("Arquivo inválido. Verifique se é um backup do SisDeLu.");
      }
    };
    reader.readAsText(file);
    ev.target.value = "";
  };

  const confirmarImport = () => {
    importar(importPendente);
    setImportPendente(null);
  };

  const ehDetalhe = !["comando", "ems", "gestao"].includes(visao);
  const notif = notificacoes(fleet);

  return (
    <div className="app">
      <div className="faixa-ouro" />

      <header className="topo">
        <LogoEMS tamanho={52} />
        <div className="topo-titulos">
          <div className="topo-nome">ESQUADRILHA DE MANUTENÇÃO E SUPRIMENTO - 2º BAVEX</div>
          <div className="topo-sub">SisPug - Idealizado por Maj Pugliesi</div>
        </div>
        <div className="topo-dir">
          <span className="chip-data">📅 {hoje().toLocaleDateString("pt-BR")}</span>
          <span className="chip-versao">V3</span>
          <button className="btn fantasma" onClick={exportar}>⬇ Backup</button>
          <button className="btn fantasma" onClick={() => fileRef.current.click()}>⬆ Importar</button>
          <input ref={fileRef} type="file" accept=".json" hidden onChange={onImportFile} />
        </div>
      </header>

      <main className="conteudo">
        <div className="painel-cab">
          <h1>Situação da Frota</h1>
          {ehDetalhe && <button className="btn contorno" onClick={() => setVisao("gestao")}>← Retornar à gestão</button>}
        </div>

        <div className="visao-abas">
          <button className={visao === "comando" ? "ativa" : ""} onClick={() => setVisao("comando")}>Cmdo Btl</button>
          <button className={visao === "ems" ? "ativa" : ""} onClick={() => setVisao("ems")}>Cmt EMS</button>
          <button className={visao === "gestao" || ehDetalhe ? "ativa" : ""} onClick={() => setVisao("gestao")}>Gerentes de Frota{notif.qualquer && <i className="led-notif" title="Há pendências" />}</button>
        </div>
        <div className="atualizado">Atualizado em: {hoje().toLocaleDateString("pt-BR")}, {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>

        {visao === "comando" && <VisaoComando fleet={fleet} abrir={(n) => setVisao(n)} />}
        {visao === "ems" && <VisaoEMS fleet={fleet} abrir={(n) => setVisao(n)} />}
        {visao === "gestao" && <Gestao fleet={fleet} abrir={(n) => setVisao(n)} adicionar={adicionarAeronave} />}
        {ehDetalhe && fleet.aeronaves[visao] && (
          <PainelAeronave numeral={visao} remover={() => removerAeronave(visao)} />
        )}
      </main>

      <footer className="rodape">
        <div className="rodape-esq">
          {salvoEm && <span>💾 Dados salvos neste navegador às {salvoEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>}
        </div>
        <div className="rodape-dir">Sistema offline • IndexedDB • v3.0</div>
      </footer>

      {/* ---- Modais ---- */}

      {/* Modal: adicionar aeronave */}
      <Modal
        aberto={modalAdd.aberto}
        titulo="Nova Aeronave"
        confirmLabel="Adicionar"
        onConfirmar={confirmarAdd}
        onCancelar={() => setModalAdd({ aberto: false, numeral: "", modelo: "Pantera K2" })}
      >
        <div className="grade-form" style={{ marginBottom: 4 }}>
          <Campo rotulo="Numeral" vazio={!modalAdd.numeral.trim()}>
            <input
              autoFocus
              value={modalAdd.numeral}
              placeholder="Ex.: 2006"
              onChange={(e) => {
                const numeral = e.target.value;
                setModalAdd((m) => ({ ...m, numeral, modelo: detectarModelo(numeral) }));
              }}
              onKeyDown={(e) => e.key === "Enter" && confirmarAdd()}
            />
          </Campo>
          <Campo rotulo="Modelo">
            <select
              value={modalAdd.modelo}
              onChange={(e) => setModalAdd((m) => ({ ...m, modelo: e.target.value }))}
            >
              {MODELOS.map((mod) => <option key={mod}>{mod}</option>)}
            </select>
          </Campo>
        </div>
      </Modal>

      {/* Modal: remover aeronave */}
      <Modal
        aberto={modalRemover.aberto}
        titulo="Remover Aeronave"
        mensagem={`Remover a aeronave ${modalRemover.numeral} e todos os seus registros? Esta ação não pode ser desfeita.`}
        confirmLabel="Remover"
        perigo
        onConfirmar={confirmarRemover}
        onCancelar={() => setModalRemover({ aberto: false, numeral: null })}
      />

      {/* Modal: confirmar importação de backup */}
      <Modal
        aberto={!!importPendente}
        titulo="Importar Backup"
        mensagem="Importar substituirá todos os dados salvos neste navegador. Esta ação não pode ser desfeita. Continuar?"
        confirmLabel="Importar"
        perigo
        onConfirmar={confirmarImport}
        onCancelar={() => setImportPendente(null)}
      />
    </div>
  );
}
