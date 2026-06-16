// src/components/Campo.jsx — wrapper de rótulo + controle para formulários
export function Campo({ rotulo, larga, vazio, atrasado, children }) {
  return (
    <label className={"campo" + (larga ? " larga" : "") + (atrasado ? " campo-atrasado" : "") + (vazio ? " campo-vazio" : "")}>
      <span className="campo-rotulo">{rotulo}</span>
      <span className="campo-controle">
        {children}
      </span>
    </label>
  );
}
