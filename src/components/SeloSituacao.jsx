// src/components/SeloSituacao.jsx — selo colorido de situação da aeronave
export function SeloSituacao({ s }) {
  // Verifica se é uma das restrições (começa com "Restr.")
  const isRestr = s && s.startsWith("Restr.");
  const cls = s === "Disponível" ? "ok" : isRestr ? "alerta" : "critico";
  return <span className={"selo-sit " + cls}>{s}</span>;
}
