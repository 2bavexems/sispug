// src/lib/localStore.js — armazenamento compartilhado via Supabase
// ----------------------------------------------------------------------------
// A frota fica salva no Supabase (nuvem), numa única linha da tabela "frota".
// Todos os usuários leem e escrevem no mesmo registro — dados sempre atualizados.
// Atualizações em tempo real via Supabase Realtime (postgres_changes).
// ----------------------------------------------------------------------------
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

export const FROTA_VAZIA = {
  ordem: [],
  aeronaves: {},
  planejamento: {},
  plnjConfirmado: {},
  tasa: {
    missoes: [],
    pessoal: { especialistas: [], auxiliares: [], motoristas: [] },
    material: [],
  },
};

export { frotaTemConteudo } from "./conteudo.js";

/**
 * Carrega a frota do Supabase. Devolve { dados, versao }.
 * IMPORTANTE: se a leitura FALHAR (rede, permissão, etc.), lançamos o erro em
 * vez de devolver uma frota vazia. Assim o app sabe que NÃO carregou de verdade
 * e mantém as gravações bloqueadas — evitando salvar "vazio" por cima da nuvem.
 */
export async function carregarFrota() {
  const { data, error } = await supabase
    .from("frota")
    .select("dados, versao")
    .eq("id", 1)
    .single();
  if (error) throw error;
  return {
    dados: data?.dados ?? structuredClone(FROTA_VAZIA),
    versao: Number(data?.versao ?? 0),
  };
}

/** Lê só o número da versão atual (consulta leve, usada para conferência). */
export async function lerVersao() {
  const { data, error } = await supabase.from("frota").select("versao").eq("id", 1).single();
  if (error) throw error;
  return Number(data?.versao ?? 0);
}

/**
 * Envia as operações (só os campos alterados) para o servidor, que as aplica
 * de forma atômica. Devolve a nova versão. LANÇA ERRO se a gravação falhar —
 * quem chama decide tentar de novo e avisa o usuário (nada de "salvo" falso).
 */
export async function enviarOps(ops, cliente) {
  const { data, error } = await supabase.rpc("frota_aplicar_ops", { p_ops: ops, p_cliente: cliente });
  if (error) throw error;
  return Number(data);
}

/**
 * Assina atualizações em tempo real da tabela frota.
 * callback({ dados, versao }) a cada gravação (de qualquer usuário, inclusive a nossa).
 * aoMudarStatus(status) informa o estado da conexão ("SUBSCRIBED", "CLOSED",
 * "CHANNEL_ERROR", "TIMED_OUT").
 */
export function subscribeToFrota(callback, aoMudarStatus) {
  return supabase
    .channel("frota-realtime")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "frota", filter: "id=eq.1" },
      (payload) => callback({ dados: payload.new?.dados, versao: Number(payload.new?.versao ?? 0) })
    )
    .subscribe((status) => aoMudarStatus?.(status));
}

/** Compatibilidade — sempre disponível com Supabase. */
export function storageDisponivel() { return true; }
