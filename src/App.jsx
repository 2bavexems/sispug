// src/App.jsx — ponto de entrada visual: tema, notificações e a tela principal
import { Toaster } from "react-hot-toast";
import { FleetProvider, useFleet } from "./contexts/FleetContext";
import { Shell } from "./pages/Shell";
import { Carregando } from "./components/Carregando";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { CSS } from "./styles/styles";

export default function App() {
  return (
    <ErrorBoundary>
      <style>{CSS}</style>
      <Toaster position="bottom-right" toastOptions={{
        style: { background: "#12294c", color: "#dbe6f1", border: "1px solid #395d8c" },
      }} />
      <FleetProvider>
        <Conteudo />
      </FleetProvider>
    </ErrorBoundary>
  );
}

function Conteudo() {
  const { fleet } = useFleet();
  if (!fleet) return <Carregando texto="Carregando SisDeLu…" />;
  return <Shell />;
}
