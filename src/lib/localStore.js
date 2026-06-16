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
};

/** Carrega a frota do Supabase. */
export async function carregarFrota() {
  try {
    const { data, error } = await supabase
      .from("frota")
      .select("dados")
      .eq("id", 1)
      .single();
    if (error || !data) return structuredClone(FROTA_VAZIA);
    return data.dados;
  } catch {
    return structuredClone(FROTA_VAZIA);
  }
}

/** Salva a frota inteira no Supabase (sobrescreve a versão anterior). */
export async function salvarFrota(frota) {
  try {
    await supabase
      .from("frota")
      .update({ dados: frota, atualizado_em: new Date().toISOString() })
      .eq("id", 1);
  } catch (e) {
    console.error("[SisDeLu] Erro ao salvar:", e);
  }
}

/**
 * Assina atualizações em tempo real da tabela frota.
 * Chama callback(novaFrota) sempre que outro usuário salvar uma alteração.
 * Retorna o canal — use supabase.removeChannel(canal) para cancelar.
 */
export function subscribeToFrota(callback) {
  return supabase
    .channel("frota-realtime")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "frota", filter: "id=eq.1" },
      (payload) => callback(payload.new.dados)
    )
    .subscribe();
}

/** Compatibilidade — sempre disponível com Supabase. */
export function storageDisponivel() { return true; }
