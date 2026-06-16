// src/components/Selo.jsx — chip de valor (horas/dias) com cor de criticidade
import { nivel } from "../lib/domain";

export function Selo({ valor, u, tipo }) {
  const nv = nivel(valor, u, tipo);
  return <span className={"chip " + nv}>{valor === null || isNaN(valor) ? "—" : valor < 0 ? `VENCIDO (${valor})` : `${valor} ${u === "h" ? "h" : "dias"}`}</span>;
}
