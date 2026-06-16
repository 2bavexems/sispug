# SisDeLu V3 — Sistema de Gerenciamento de Frota (EMS / 2º BAVEX)

> Desenvolvido por Maj Pugliesi · Esquadrilha de Manutenção e Suprimento — 2º BAVEX

## O que é

SisDeLu V3 é uma aplicação web **100% offline** para controle de prontidão, manutenção e planejamento da frota de aeronaves do 2º BAVEX. Não requer internet, servidor, login nem conta em nuvem. Todos os dados ficam armazenados localmente no navegador (IndexedDB).

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| UI | React 18 + Vite 5 |
| Estilos | CSS-in-JS (`src/styles/styles.js`) — string de template injetada via `<style>` |
| Persistência | IndexedDB via biblioteca `idb` (`src/lib/localStore.js`) |
| Notificações | `react-hot-toast` |
| Estado global | React Context (`FleetContext`) com auto-save debounced (400 ms) |

## Funcionalidades principais

- **Visão do Comando** — prontidão da frota com indicadores, gráfico e tabela por aeronave
- **Visão EMS** — detalhes de inspeções, TSN e limites de vida por modelo
- **Gestão de Frota** — adicionar / remover aeronaves, planejamento de manutenção semanal
- **Painel da Aeronave** — dados gerais, inspeções, manutenções (célula / motores / recheques / limites de vida), anotações livres
- **Sistema de notificações em 3 níveis**:
  1. TSN desatualizado (qualquer campo sem atualização há mais de 7 dias)
  2. Manutenção 100h / 100d pendente de confirmação (às segundas-feiras)
  3. Planejamento semanal não confirmado (sextas-feiras ≥ 08:00)
- **Backup / Importação** — exporta a frota para `.json` e restaura de arquivo
- **Modo incógnito detectado** — aviso automático via toast quando o IndexedDB está bloqueado

## Criticidade de limites

| Nível | Horas | Dias |
|-------|-------|------|
| `vencido` | < 0 | < 0 |
| `critico` | ≤ 10 h | ≤ 10 d |
| `alerta` | ≤ 20 h | ≤ 20 d |
| `normal` | > 20 h | > 20 d |

> A/T e Inspeção C usam limiares próprios (ver `src/lib/domain.js`).

## Estrutura do projeto

```
sisdelu-v3/
├── index.html
├── vite.config.js
├── package.json
├── src/
│   ├── main.jsx                  # Ponto de entrada; injeta CSS global
│   ├── styles/
│   │   └── styles.js             # Todo o CSS como template literal
│   ├── lib/
│   │   ├── domain.js             # Regras de negócio, cálculos, notificações
│   │   └── localStore.js         # IndexedDB (carregarFrota / salvarFrota / storageDisponivel)
│   ├── contexts/
│   │   └── FleetContext.jsx      # Estado global + todas as mutações + auto-save
│   ├── components/
│   │   ├── Modal.jsx             # Modal reutilizável (substitui prompt/confirm/alert)
│   │   ├── Campo.jsx             # Wrapper de campo de formulário
│   │   ├── ChipValor.jsx         # Chip colorido de valor com criticidade
│   │   ├── Gauge.jsx             # Gráfico de disponibilidade (SVG)
│   │   ├── LogoEMS.jsx           # Logotipo SVG
│   │   └── SeloSituacao.jsx      # Chip de situação (Disponível / Restr. / Indisponível)
│   └── pages/
│       ├── Shell.jsx             # Layout principal, abas, rodapé, modais globais
│       ├── VisaoComando.jsx      # Visão do Comando
│       ├── VisaoEMS.jsx          # Visão EMS
│       ├── Gestao.jsx            # Gestão de frota + planejamento
│       └── PainelAeronave.jsx    # Painel individual da aeronave
└── public/
    └── favicon.svg
```

## Instalação e uso local

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Gerar build de produção
npm run build
```

O build gera uma pasta `dist/` com arquivos estáticos. Basta hospedar em qualquer servidor web estático (GitHub Pages, Nginx, etc.) — **não há backend**.

## Armazenamento dos dados

- Todos os dados ficam **exclusivamente no navegador** do usuário (IndexedDB).
- Nenhuma informação é enviada para servidores externos.
- Cada edição é salva automaticamente ~400 ms após a última alteração.
- O rodapé exibe o horário da última gravação.
- **Backup regular é essencial**: use **⬇ Backup** para gerar um `.json` e **⬆ Importar** para restaurar.
- Em modo privado/incógnito o IndexedDB pode estar bloqueado; o sistema detecta e avisa automaticamente.

## Contribuição

Projeto de uso interno. Para dúvidas ou melhorias, contate o Maj Pugliesi (EMS / 2º BAVEX).
