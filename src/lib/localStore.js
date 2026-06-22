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

/**
 * Indica se a frota tem algum conteúdo real (aeronaves ou itens cadastrados).
 * Usado como trava de segurança: nunca gravamos/aceitamos uma frota "vazia"
 * por cima de uma que tem dados — foi exatamente esse tipo de sobrescrita que
 * apagou o planejamento. Um objeto vazio só é legítimo num projeto recém-criado.
 */
export function frotaTemConteudo(frota) {
  if (!frota || typeof frota !== "object") return false;
  const aeronaves = Object.keys(frota.aeronaves || {}).length;
  const ordem = (frota.ordem || []).length;
  const planj = Object.values(frota.planejamento || {}).some(
    (p) => (p?.manutencoes || []).length > 0
  );
  const tasa = frota.tasa || {};
  const tasaItens =
    (tasa.missoes || []).length +
    (tasa.material || []).length +
    (tasa.pessoal?.especialistas || []).length +
    (tasa.pessoal?.auxiliares || []).length +
    (tasa.pessoal?.motoristas || []).length;
  return aeronaves > 0 || ordem > 0 || planj || tasaItens > 0;
}

/**
 * Carrega a frota do Supabase.
 * IMPORTANTE: se a leitura FALHAR (rede, permissão, etc.), lançamos o erro em
 * vez de devolver uma frota vazia. Assim o app sabe que NÃO carregou de verdade
 * e mantém as gravações bloqueadas — evitando salvar "vazio" por cima da nuvem.
 */
export async function carregarFrota() {
  const { data, error } = await supabase
    .from("frota")
    .select("dados")
    .eq("id", 1)
    .single();
  if (error) throw error;
  return data?.dados ?? structuredClone(FROTA_VAZIA);
}

/**
 * Salva a frota inteira no Supabase (sobrescreve a versão anterior).
 * Trava de segurança: recusa gravar uma frota vazia/sem conteúdo, que só
 * poderia vir de um bug ou de uma carga que falhou — nunca de uso normal.
 */
export async function salvarFrota(frota) {
  if (!frotaTemConteudo(frota)) {
    console.warn("[SisPug] Gravação bloqueada: frota vazia/sem conteúdo. Nada foi sobrescrito.");
    return;
  }
  try {
    await supabase
      .from("frota")
      .update({ dados: frota, atualizado_em: new Date().toISOString() })
      .eq("id", 1);
  } catch (e) {
    console.error("[SisPug] Erro ao salvar:", e);
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
