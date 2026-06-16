// src/components/ChipValor.jsx — chip com valor de horas/dias e cor de criticidade
import { nivel } from "../lib/domain";

export function ChipValor({ item, unidade }) {
  if (!item) return <span className="chip na">—</span>;
  const { valor, tipo, nome } = item;
  // Guard: valor undefined/null/NaN (ex.: campo não preenchido)
  if (valor === null || valor === undefined || isNaN(valor)) {
    return <span className="chip na">—</span>;
  }
  const nv = nivel(valor, unidade.trim() === "h" ? "h" : "d", tipo);
  return (
    <span className={"chip " + nv} title={nome}>
      {valor < 0 ? "VENCIDO" : `${valor}${unidade}`}
    </span>
  );
}
