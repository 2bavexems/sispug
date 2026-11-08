// src/lib/conteudo.js — trava anti-apagamento (sem dependências, usada no app e nos testes)

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

