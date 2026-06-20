# SisPug — Sistema de Gerenciamento de Frota (EMS / 2º BAVEX)

> Desenvolvido por Maj Pugliesi · Esquadrilha de Manutenção e Suprimento — 2º BAVEX

## O que é

SisPug é uma aplicação web para controle de prontidão, manutenção e planejamento da frota de aeronaves do 2º BAVEX. Os dados ficam em uma base **Supabase** na nuvem (compartilhada entre os usuários) e sincronizam em **tempo real** — quando um usuário edita, os demais veem a atualização automaticamente. O controle de edição é feito por um PIN dentro do próprio app.

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| UI | React 18 + Vite 5 |
| Estilos | CSS-in-JS (`src/styles/styles.js`) — string de template injetada via `<style>` |
| Persistência | Supabase (Postgres + Realtime) — `src/lib/localStore.js` |
| Notificações | `react-hot-toast` |
| Estado global | React Context (`FleetContext`) com auto-save debounced (400 ms) |
| Deploy | Vercel (deploy automático a cada `git push` na branch `main`) |

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
- **Sincronização em tempo real** — alterações de um usuário aparecem nos demais automaticamente (Supabase Realtime)

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
sispug/
├── index.html
├── vite.config.js
├── package.json
├── src/
│   ├── main.jsx                  # Ponto de entrada; injeta CSS global
│   ├── styles/
│   │   └── styles.js             # Todo o CSS como template literal
│   ├── lib/
│   │   ├── domain.js             # Regras de negócio, cálculos, notificações
│   │   └── localStore.js         # Cliente Supabase (carregarFrota / salvarFrota / subscribeToFrota)
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

O build gera uma pasta `dist/` com arquivos estáticos, publicada automaticamente pela **Vercel** a cada `git push` na branch `main`. O backend de dados é o **Supabase** (configurado via variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_KEY`).

## Armazenamento dos dados

- Os dados ficam em uma base **Supabase** na nuvem, numa única linha da tabela `frota` (coluna `dados` em JSONB), compartilhada por todos os usuários.
- Cada edição é salva automaticamente ~400 ms após a última alteração e propagada em tempo real aos demais usuários.
- O rodapé exibe o horário da última gravação.
- **Backup regular é recomendado**: use **⬇ Backup** para gerar um `.json` e **⬆ Importar** para restaurar.
- As credenciais de acesso ao Supabase ficam em variáveis de ambiente (`.env.local` localmente e no painel da Vercel) — nunca versionadas.

## Contribuição

Projeto de uso interno. Para dúvidas ou melhorias, contate o Maj Pugliesi (EMS / 2º BAVEX).
