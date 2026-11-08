// src/contexts/FleetContext.jsx
// ----------------------------------------------------------------------------
// Estado da frota, compartilhado entre todos os usuários via Supabase.
//
// COMO A SINCRONIZAÇÃO FUNCIONA (versão segura — nov/2026)
//  • "base"  = última versão conhecida do servidor (+ o que nós já enviamos).
//  • "fleet" = o que está na tela (base + edições locais ainda não enviadas).
//  • Ao editar, depois de 400 ms o app calcula a DIFERENÇA entre fleet e base e
//    envia só os campos alterados (função SQL frota_aplicar_ops). O servidor
//    aplica de forma atômica — um gerente NUNCA sobrescreve o lançamento de
//    outro (antes a frota inteira era regravada e isso fazia o TSN "voltar").
//  • Quando chega uma gravação de outra pessoa (tempo real), as edições locais
//    pendentes são reaplicadas por cima dela (nada digitado se perde) e o app
//    NÃO regrava o que recebeu.
//  • Cada gravação tem um número de versão. A cada 20 s, ao voltar para a aba,
//    ao reconectar ou ao voltar a internet, o app confere se perdeu alguma
//    versão e, se perdeu, recarrega tudo do servidor (fim da "aba parada").
//  • Gravação que falha é avisada em vermelho e repetida automaticamente.
// ----------------------------------------------------------------------------
import { createContext, useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  carregarFrota, enviarOps, lerVersao, subscribeToFrota, supabase,
} from "../lib/localStore";
import { criarMotor } from "../lib/motorSync";

const FleetCtx = createContext(null);
export const useFleet = () => useContext(FleetCtx);

const uid = () => crypto.randomUUID();
const PIN_EDICAO = "5215";
const CONFERENCIA_MS = 20000;

// Identificador deste navegador (aparece no histórico do banco).
function idCliente() {
  try {
    let id = localStorage.getItem("sispug-cliente");
    if (!id) {
      id = "nav-" + crypto.randomUUID().slice(0, 8);
      localStorage.setItem("sispug-cliente", id);
    }
    return id;
  } catch {
    return "nav-" + crypto.randomUUID().slice(0, 8);
  }
}

// Migração de dados antigos — garante propriedades obrigatórias nas aeronaves.
function migrar(f) {
  const aeronavesMigradas = {};
  Object.entries(f.aeronaves || {}).forEach(([numeral, anv]) => {
    aeronavesMigradas[numeral] = {
      tsnCelulaAtualizadoEm: undefined,
      tsnGtm1AtualizadoEm: undefined,
      tsnGtm2AtualizadoEm: undefined,
      confirmacaoMntEm: undefined,
      travados: {},
      ...anv,
    };
    // Formato antigo (1 timestamp "tsnAtualizadoEm" para os 3 campos TSN)
    const m = aeronavesMigradas[numeral];
    if (anv.tsnAtualizadoEm && !m.tsnCelulaAtualizadoEm && !m.tsnGtm1AtualizadoEm && !m.tsnGtm2AtualizadoEm) {
      m.tsnCelulaAtualizadoEm = anv.tsnAtualizadoEm;
      m.tsnGtm1AtualizadoEm = anv.tsnAtualizadoEm;
      m.tsnGtm2AtualizadoEm = anv.tsnAtualizadoEm;
    }
  });
  return { ...f, aeronaves: aeronavesMigradas };
}

export function FleetProvider({ children }) {
  const [fleet, setFleetState] = useState(null);
  const [salvoEm, setSalvoEm] = useState(null);
  const [statusGravacao, setStatusGravacao] = useState("ok"); // "ok" | "salvando" | "erro"
  const [conectado, setConectado] = useState(true);
  const [modoEdicao, setModoEdicao] = useState(false);
  const desbloquear = (pin) => { if (pin === PIN_EDICAO) { setModoEdicao(true); return true; } return false; };
  const bloquear = () => setModoEdicao(false);

  // Motor de sincronização (src/lib/motorSync.js) — criado uma única vez.
  const motorRef = useRef(null);
  if (!motorRef.current) {
    motorRef.current = criarMotor({
      api: { carregar: carregarFrota, enviarOps },
      cliente: idCliente(),
      aoMudarTela: setFleetState,
      aoStatus: (s) => {
        setStatusGravacao(s.gravacao);
        if (s.salvoEm) setSalvoEm(s.salvoEm);
        if (s.gravacao === "erro") {
          toast.error("Falha ao salvar. Tentando novamente — não feche a página.", { id: "erro-salvar", duration: 8000 });
        } else if (s.recuperado) {
          toast.success("Conexão restabelecida — alterações salvas.", { id: "erro-salvar" });
        }
      },
    });
  }
  const motor = motorRef.current;

  // Todas as mutações abaixo usam setFleet → passam pelo motor (que agenda o envio).
  const setFleet = (v) => motor.mutar(v);

  // --------------------------------------------------------------------------
  // CARGA inicial (guarda síncrona contra a 2ª montagem do StrictMode)
  // --------------------------------------------------------------------------
  const cargaIniciada = useRef(false);
  useEffect(() => {
    if (cargaIniciada.current) return;
    cargaIniciada.current = true;
    carregarFrota().then((r) => {
      let local;
      try {
        local = migrar(r.dados);
      } catch (e) {
        console.error("[SisPug] Erro na migração dos dados — usando dados crus:", e);
        toast.error("Aviso: dados carregados sem migração completa.");
        local = r.dados;
      }
      motor.iniciar(r, local);
    }).catch((e) => {
      // Falha real de carga: o motor não é iniciado, então NADA é gravado.
      console.error("[SisPug] Falha ao carregar a frota — gravações bloqueadas:", e);
      toast.error("Não foi possível carregar os dados. Recarregue a página. (Edições bloqueadas para proteger a nuvem.)");
    });
  }, []);

  // --------------------------------------------------------------------------
  // TEMPO REAL + conferências periódicas e ao voltar para a aba
  // --------------------------------------------------------------------------
  useEffect(() => {
    let jaConectou = false;
    const canal = subscribeToFrota(motor.receber, (status) => {
      if (status === "SUBSCRIBED") {
        setConectado(true);
        if (jaConectou) motor.sincronizar(); // reconectou: busca o que perdeu
        jaConectou = true;
      } else if (status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        setConectado(false);
      }
    });

    // A cada 20 s confere a versão do servidor (consulta leve). Ficou para trás? Recarrega.
    const conferir = async () => {
      if (!motor.carregado) return;
      try {
        if ((await lerVersao()) > motor.versao) await motor.sincronizar();
      } catch { /* sem rede: tenta na próxima */ }
      if (motor.temPendencias()) motor.enviar();
    };
    const intervalo = setInterval(conferir, CONFERENCIA_MS);

    const aoMudarVisibilidade = () => {
      if (document.visibilityState === "hidden") motor.enviar(); // salva já, sem esperar
      else motor.sincronizar();
    };
    const aoFocar = () => motor.sincronizar();
    const aoVoltarInternet = () => { motor.sincronizar(); motor.enviar(); };
    const antesDeSair = (e) => {
      if (motor.temPendencias()) {
        motor.enviar();
        e.preventDefault();
        e.returnValue = "";
      }
    };
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    window.addEventListener("focus", aoFocar);
    window.addEventListener("online", aoVoltarInternet);
    window.addEventListener("beforeunload", antesDeSair);

    return () => {
      supabase.removeChannel(canal);
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      window.removeEventListener("focus", aoFocar);
      window.removeEventListener("online", aoVoltarInternet);
      window.removeEventListener("beforeunload", antesDeSair);
    };
  }, []);

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

  // --------------------------------------------------------------------------
  // GERENTE TASA — Planejamento de Missões + Pessoal e Material
  // (salvo junto da frota, mesmo mecanismo do Plnj Mnt)
  // --------------------------------------------------------------------------
  const PESSOAL_VAZIO = { especialistas: [], auxiliares: [], motoristas: [] };
  const patchTasa = (fn) =>
    setFleet((f) => {
      const base = f.tasa || { missoes: [], pessoal: { ...PESSOAL_VAZIO }, material: [] };
      const tasa = {
        missoes: base.missoes || [],
        pessoal: { ...PESSOAL_VAZIO, ...(base.pessoal || {}) },
        material: base.material || [],
      };
      return { ...f, tasa: fn(tasa) };
    });

  // Missões
  const addMissaoTasa = () =>
    patchTasa((t) => ({
      ...t,
      missoes: [
        ...t.missoes,
        { id: uid(), semana: "S", missao: "", dataInicial: "", dataFinal: "", pessoal: "", pessoalOk: "OK", obs: "" },
      ],
    }));
  const updateMissaoTasa = (id, field, value) =>
    patchTasa((t) => ({ ...t, missoes: t.missoes.map((m) => (m.id === id ? { ...m, [field]: value } : m)) }));
  const deleteMissaoTasa = (id) =>
    patchTasa((t) => ({ ...t, missoes: t.missoes.filter((m) => m.id !== id) }));

  // Pessoal (colunas: especialistas, auxiliares, motoristas)
  const addPessoalTasa = (col) =>
    patchTasa((t) => ({
      ...t,
      pessoal: { ...t.pessoal, [col]: [...t.pessoal[col], { id: uid(), nome: "", situacao: "Disponível", obs: "" }] },
    }));
  const updatePessoalTasa = (col, id, field, value) =>
    patchTasa((t) => ({
      ...t,
      pessoal: { ...t.pessoal, [col]: t.pessoal[col].map((p) => (p.id === id ? { ...p, [field]: value } : p)) },
    }));
  const deletePessoalTasa = (col, id) =>
    patchTasa((t) => ({ ...t, pessoal: { ...t.pessoal, [col]: t.pessoal[col].filter((p) => p.id !== id) } }));

  // Material
  const addMaterialTasa = () =>
    patchTasa((t) => ({
      ...t,
      material: [...t.material, { id: uid(), material: "", total: "", disponivel: "", indisponivel: "", obs: "" }],
    }));
  const updateMaterialTasa = (id, field, value) =>
    patchTasa((t) => ({ ...t, material: t.material.map((m) => (m.id === id ? { ...m, [field]: value } : m)) }));
  const deleteMaterialTasa = (id) =>
    patchTasa((t) => ({ ...t, material: t.material.filter((m) => m.id !== id) }));

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
    if (motor.tela?.aeronaves?.[numeral]) {
      toast.error("Já existe aeronave com esse numeral.");
      return false;
    }
    // "...f" preserva planejamento, TASA etc. (antes eram apagados ao criar aeronave)
    setFleet((f) => ({
      ...f,
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
      // "...f" preserva planejamento, TASA etc. (antes eram apagados ao remover aeronave)
      return { ...f, ordem: f.ordem.filter((n) => n !== numeral), aeronaves };
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
    a.download = `sispug-backup-${new Date().toISOString().slice(0, 10)}.json`;
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
      fleet, salvoEm, statusGravacao, conectado, modoEdicao, desbloquear, bloquear,
      updateAeronave, updateInspecoes, toggleTravado, confirmarMnt,
      addManutencao, updateManutencao, duplicateManutencao, deleteManutencao,
      addAnotacao, updateAnotacao, deleteAnotacao,
      addAeronave, removeAeronave, exportar, importar, confirmarPlnj,
      addManutencaoPlnj, updateManutencaoPlnj, deleteManutencaoPlnj,
      addMissaoTasa, updateMissaoTasa, deleteMissaoTasa,
      addPessoalTasa, updatePessoalTasa, deletePessoalTasa,
      addMaterialTasa, updateMaterialTasa, deleteMaterialTasa,
    }}>
      {children}
    </FleetCtx.Provider>
  );
}
