// src/contexts/FleetContext.jsx
// ----------------------------------------------------------------------------
// Estado da frota — 100% local e offline.
//
//  • Ao abrir o app, carrega a frota salva no navegador (IndexedDB).
//  • Toda alteração atualiza a tela imediatamente e é salva automaticamente
//    no navegador pouco tempo depois (debounce de 400 ms).
//  • Não depende de internet, servidor ou login.
// ----------------------------------------------------------------------------
import { createContext, useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { carregarFrota, salvarFrota, storageDisponivel, FROTA_VAZIA } from "../lib/localStore";

const FleetCtx = createContext(null);
export const useFleet = () => useContext(FleetCtx);

const uid = () => crypto.randomUUID();
const PIN_EDICAO = "5215";

export function FleetProvider({ children }) {
  const [fleet, setFleet] = useState(null);
  const [salvoEm, setSalvoEm] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const desbloquear = (pin) => { if (pin === PIN_EDICAO) { setModoEdicao(true); return true; } return false; };
  const bloquear = () => setModoEdicao(false);

  const saveTimer = useRef(null);
  const carregado = useRef(false);

  // --------------------------------------------------------------------------
  // CARGA inicial — lê a frota salva no navegador (ou começa vazia)
  // Com migração de dados para garantir propriedades obrigatórias
  //
  // IMPORTANTE: em React.StrictMode (modo dev), o React monta os efeitos duas
  // vezes (mount → unmount → mount) só para detectar side-effects mal limpos.
  // Sem proteção, este efeito roda 2x: a 2ª chamada de carregarFrota() lê o
  // IndexedDB de novo e, ao terminar, faz setFleet(frotaMigrada) — sobrescrevendo
  // qualquer edição já feita em memória (ex.: tsnAtualizadoEm recém-gravado)
  // com o snapshot ANTIGO lido do banco antes da edição. Isso fazia o aviso
  // "Atualizar TSN" reaparecer/desaparecer de forma aparentemente aleatória,
  // dependendo de qual campo o usuário editava primeiro após o carregamento.
  //
  // A guarda abaixo é SÍNCRONA (setada antes do await), então a 2ª execução
  // do efeito nem chega a chamar setFleet.
  // --------------------------------------------------------------------------
  const cargaIniciada = useRef(false);
  useEffect(() => {
    if (cargaIniciada.current) return; // ignora a 2ª montagem do StrictMode
    cargaIniciada.current = true;

    carregarFrota().then((f) => {
      // Aviso se o armazenamento local estiver bloqueado (ex.: modo incógnito)
      if (!storageDisponivel()) {
        toast("⚠️ Armazenamento local indisponível. Os dados não serão salvos nesta sessão.", {
          duration: 10000,
          style: { background: "#3a2a0a", color: "#e7bd58", border: "1px solid #7c6224" },
        });
      }

      // Migração: garante que todas as aeronaves têm propriedades obrigatórias
      try {
        const aeronavesMigradas = {};
        Object.entries(f.aeronaves || {}).forEach(([numeral, anv]) => {
          aeronavesMigradas[numeral] = {
            tsnCelulaAtualizadoEm: undefined, // Mantém o valor existente, nunca reseta
            tsnGtm1AtualizadoEm: undefined,
            tsnGtm2AtualizadoEm: undefined,
            confirmacaoMntEm: undefined,
            travados: {},
            ...anv, // Spread das propriedades salvas (sobrescreve os undefined)
          };

          // Migração do formato antigo (1 timestamp único "tsnAtualizadoEm"
          // para os 3 campos TSN) — usa o valor antigo como ponto de partida
          // para os 3 campos novos, se ainda não tiverem sido definidos.
          const m = aeronavesMigradas[numeral];
          if (anv.tsnAtualizadoEm && !m.tsnCelulaAtualizadoEm && !m.tsnGtm1AtualizadoEm && !m.tsnGtm2AtualizadoEm) {
            m.tsnCelulaAtualizadoEm = anv.tsnAtualizadoEm;
            m.tsnGtm1AtualizadoEm = anv.tsnAtualizadoEm;
            m.tsnGtm2AtualizadoEm = anv.tsnAtualizadoEm;
          }
        });
        const frotaMigrada = { ...f, aeronaves: aeronavesMigradas };
        setFleet(frotaMigrada);
      } catch (e) {
        console.error("[SisDeLu] Erro na migração dos dados — iniciando com frota vazia:", e);
        toast.error("Erro ao carregar dados salvos. Iniciando com frota vazia.");
        setFleet(structuredClone(FROTA_VAZIA));
      }
      carregado.current = true;
    });
  }, []);

  // --------------------------------------------------------------------------
  // SALVAR — toda vez que a frota muda, salva no navegador (debounced)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!fleet || !carregado.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await salvarFrota(fleet);
      setSalvoEm(new Date());
    }, 400);
    return () => clearTimeout(saveTimer.current);
  }, [fleet]);

  // --------------------------------------------------------------------------
  // MUTAÇÕES — sempre atualização local imediata (sem rede)
  // --------------------------------------------------------------------------
  // Proteção central: TODA mutação de uma aeronave passa por aqui. Se a função
  // de atualização (fn) devolver um objeto que não preserve os timestamps de
  // TSN (tsnCelulaAtualizadoEm, tsnGtm1AtualizadoEm, tsnGtm2AtualizadoEm) /
  // confirmacaoMntEm (ex.: por causa de um spread parcial), restauramos o valor
  // anterior. Isso garante, à prova de falhas, que esses timestamps só mudam
  // quando alguém os define explicitamente em "patch".
  const TS_PROTEGIDOS = ["tsnCelulaAtualizadoEm", "tsnGtm1AtualizadoEm", "tsnGtm2AtualizadoEm", "confirmacaoMntEm"];
  const patchAnvLocal = (numeral, fn) =>
    setFleet((f) => {
      const antes = f.aeronaves[numeral];
      const depois = fn(antes);
      TS_PROTEGIDOS.forEach((campo) => {
        if (depois[campo] === undefined && antes?.[campo] !== undefined) {
          depois[campo] = antes[campo];
        }
      });
      return { ...f, aeronaves: { ...f.aeronaves, [numeral]: depois } };
    });

  // updateAeronave: usado pelos campos da seção "Dados Gerais", incluindo os
  // 3 campos TSN (tsnCelula, tsnGtm1, tsnGtm2). Apenas o campo TSN editado,
  // ao mudar, deve enviar seu respectivo timestamp (tsnXAtualizadoEm) no
  // patch (ver PainelAeronave.jsx). Qualquer outro campo (situação, local,
  // motivo, pousos, etc.) passa por patchAnvLocal normalmente e os timestamps
  // são preservados pela proteção central acima.
  const updateAeronave = (numeral, patch) =>
    patchAnvLocal(numeral, (a) => ({ ...a, ...patch }));

  const updateInspecoes = (numeral, patch) =>
    patchAnvLocal(numeral, (a) => ({ ...a, inspecoes: { ...a.inspecoes, ...patch } }));

  const toggleTravado = (numeral, campo) =>
    patchAnvLocal(numeral, (a) => ({
      ...a,
      travados: { ...a.travados, [campo]: !a.travados?.[campo] },
    }));

  const confirmarMnt = (numeral) =>
    patchAnvLocal(numeral, (a) => ({
      ...a,
      confirmacaoMntEm: new Date().toISOString(),
    }));

  // Notif 3 — marca o planejamento de uma frota como feito nesta semana
  const confirmarPlnj = (modelo) =>
    setFleet((f) => ({
      ...f,
      plnjConfirmado: { ...(f.plnjConfirmado || {}), [modelo]: new Date().toISOString() },
    }));

  // --------------------------------------------------------------------------
  // PLANEJAMENTO (aba Plnj Mnt) — agora salvo no navegador junto da frota
  // --------------------------------------------------------------------------
  const patchPlnj = (modelo, fn) =>
    setFleet((f) => {
      const plnj = f.planejamento || {};
      const frota = plnj[modelo] || { manutencoes: [] };
      return { ...f, planejamento: { ...plnj, [modelo]: fn(frota) } };
    });

  const addManutencaoPlnj = (modelo) =>
    patchPlnj(modelo, (frota) => ({
      ...frota,
      manutencoes: [
        ...frota.manutencoes,
        { id: uid(), semana: "S", anv: "", manutencao: "", prazo: "", suprimento: "OK", ferramental: "OK", obs: "" },
      ],
    }));

  const updateManutencaoPlnj = (modelo, id, field, value) =>
    patchPlnj(modelo, (frota) => ({
      ...frota,
      manutencoes: frota.manutencoes.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    }));

  const deleteManutencaoPlnj = (modelo, id) =>
    patchPlnj(modelo, (frota) => ({
      ...frota,
      manutencoes: frota.manutencoes.filter((m) => m.id !== id),
    }));

  const addManutencao = (numeral, secao) => {
    const row = {
      id: uid(), os: "", descricao: "", tipo: "Calendárica",
      limiteSem: "", limiteCom: "", obs: "",
      ...(secao === "motores" ? { aplicacao: "Ambos" } : {}),
    };
    patchAnvLocal(numeral, (a) => ({ ...a, [secao]: [...a[secao], row] }));
  };

  const updateManutencao = (numeral, secao, id, patch) =>
    patchAnvLocal(numeral, (a) => ({
      ...a, [secao]: a[secao].map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));

  const duplicateManutencao = (numeral, secao, row) => {
    const copy = { ...row, id: uid(), os: row.os ? row.os + " (cópia)" : "" };
    patchAnvLocal(numeral, (a) => ({ ...a, [secao]: [...a[secao], copy] }));
  };

  const deleteManutencao = (numeral, secao, id) =>
    patchAnvLocal(numeral, (a) => ({ ...a, [secao]: a[secao].filter((r) => r.id !== id) }));

  // --------------------------------------------------------------------------
  // ANOTAÇÕES — adicionar/editar/deletar notas diversas
  // --------------------------------------------------------------------------
  const addAnotacao = (numeral) => {
    const anotacao = {
      id: uid(), assunto: "", descricao: "",
    };
    patchAnvLocal(numeral, (a) => ({ ...a, anotacoes: [...(a.anotacoes || []), anotacao] }));
  };

  const updateAnotacao = (numeral, id, patch) =>
    patchAnvLocal(numeral, (a) => ({
      ...a, anotacoes: (a.anotacoes || []).map((n) => (n.id === id ? { ...n, ...patch } : n)),
    }));

  const deleteAnotacao = (numeral, id) =>
    patchAnvLocal(numeral, (a) => ({
      ...a, anotacoes: (a.anotacoes || []).filter((n) => n.id !== id),
    }));

  // --------------------------------------------------------------------------
  // AERONAVES — criar/remover (apenas em memória + salvo local)
  // --------------------------------------------------------------------------
  const aeronaveNova = (numeral, modelo) => ({
    dbId: uid(), inspecaoId: null,
    numeral, modelo, situacao: "Disponível", local: "", motivo: "",
    tsnCelula: "", tsnGtm1: "", tsnGtm2: "",
    tsnCelulaAtualizadoEm: null, // timestamps da última atualização de cada TSN
    tsnGtm1AtualizadoEm: null,
    tsnGtm2AtualizadoEm: null,
    confirmacaoMntEm: null, // timestamp da última confirmação de Mnt 100h/100d
    pousos: modelo === "Pantera K2" ? "não é o caso" : "",
    inspecoes: { atSem: "", atCom: "", potencialAt: "", inspC: "" },
    limitesVida: [], celula: [], motores: [], recheques: [],
    anotacoes: [],
    travados: {}, // { "atSem": true, "atCom": true, ... }
  });

  const addAeronave = async (numeral, modelo) => {
    if (fleet.aeronaves[numeral]) {
      toast.error("Já existe aeronave com esse numeral.");
      return false;
    }
    setFleet((f) => ({
      ordem: [...f.ordem, numeral].sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true })),
      aeronaves: { ...f.aeronaves, [numeral]: aeronaveNova(numeral, modelo) },
    }));
    toast.success(`Aeronave ${numeral} criada`);
    return true;
  };

  const removeAeronave = async (numeral) => {
    setFleet((f) => {
      const aeronaves = { ...f.aeronaves };
      delete aeronaves[numeral];
      return { ordem: f.ordem.filter((n) => n !== numeral), aeronaves };
    });
    toast.success(`Aeronave ${numeral} removida`);
    return true;
  };

  // --------------------------------------------------------------------------
  // BACKUP — exporta a frota para um arquivo .json; importar substitui tudo
  // --------------------------------------------------------------------------
  const exportar = () => {
    const blob = new Blob([JSON.stringify(fleet, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sisdelu-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importar = (data) => {
    if (!data.ordem || !data.aeronaves) throw new Error("formato inválido");
    setFleet(data);
    toast.success("Backup importado");
  };

  return (
    <FleetCtx.Provider value={{
      fleet, salvoEm, modoEdicao, desbloquear, bloquear,
      updateAeronave, updateInspecoes, toggleTravado, confirmarMnt,
      addManutencao, updateManutencao, duplicateManutencao, deleteManutencao,
      addAnotacao, updateAnotacao, deleteAnotacao,
      addAeronave, removeAeronave, exportar, importar, confirmarPlnj,
      addManutencaoPlnj, updateManutencaoPlnj, deleteManutencaoPlnj,
    }}>
      {children}
    </FleetCtx.Provider>
  );
}
