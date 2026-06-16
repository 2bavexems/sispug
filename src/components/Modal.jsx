// src/components/Modal.jsx — diálogos de confirmação e entrada de dados
// Substitui prompt(), confirm() e alert() nativos do browser.
import { useEffect } from "react";

export function Modal({
  aberto,
  titulo,
  mensagem,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  perigo = false,
  onConfirmar,
  onCancelar,
  children,
}) {
  // Fecha com Escape
  useEffect(() => {
    if (!aberto) return;
    const handler = (e) => { if (e.key === "Escape") onCancelar(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [aberto, onCancelar]);

  if (!aberto) return null;

  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal-caixa" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-titulo">{titulo}</h3>
        {mensagem && <p className="modal-msg">{mensagem}</p>}
        {children}
        <div className="modal-acoes">
          <button className="btn contorno" onClick={onCancelar}>{cancelLabel}</button>
          <button className={`btn ${perigo ? "perigo" : "primario"}`} onClick={onConfirmar}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
