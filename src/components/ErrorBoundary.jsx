// src/components/ErrorBoundary.jsx — falhas de rede/render não derrubam o app inteiro
import { Component } from "react";

export class ErrorBoundary extends Component {
  state = { erro: null };
  static getDerivedStateFromError(erro) { return { erro }; }
  componentDidCatch(erro, info) { console.error("[ErrorBoundary]", erro, info); }
  render() {
    if (this.state.erro) {
      return (
        <div style={{ height: "100vh", display: "grid", placeItems: "center", background: "#0a1118", color: "#dbe6f1", fontFamily: "'Segoe UI',sans-serif", textAlign: "center", padding: 20 }}>
          <div>
            <h2>Algo deu errado.</h2>
            <p style={{ color: "#8fa6bd" }}>{String(this.state.erro?.message || this.state.erro)}</p>
            <button className="btn primario" onClick={() => location.reload()}>Recarregar</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
