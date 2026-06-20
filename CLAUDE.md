# CLAUDE.md — Contexto do Projeto SisPug

Leia este arquivo inteiro antes de qualquer alteração no projeto.

---

## O que é este projeto

**SisPug** é um sistema web de gestão de frota de aeronaves militares da Esquadrilha de Manutenção e Suprimento (EMS). Desenvolvido pelo Maj Rafael Pugliesi.

- URL de produção: https://sispug.vercel.app
- Repositório: https://github.com/2bavexems/sispug.git (branch `main`)
- Deploy automático via Vercel — qualquer `git push` na branch `main` dispara o deploy

---

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | React 18 + Vite 5 |
| Linguagem | JSX (sem TypeScript) |
| Banco de dados | Supabase (JSONB compartilhado, real-time) |
| Deploy | Vercel (auto-deploy no push) |
| Estilo | CSS-in-JS via `src/styles/styles.js` (string literal injetada via `<style>`) |

---

## Estrutura de arquivos relevantes

```
sispug/
├── index.html                        # Ponto de entrada HTML (favicon aqui)
├── .env.local                        # Variáveis de ambiente (NÃO commitado)
├── public/
│   └── favicon.ico
├── src/
│   ├── main.jsx                      # Monta React + injeta CSS
│   ├── styles/styles.js              # TODO o CSS do projeto (string exportada)
│   ├── lib/
│   │   ├── domain.js                 # Lógica de negócio (potencial, notificações, TSN)
│   │   └── localStore.js             # Cliente Supabase + funções de carga/save/subscribe
│   ├── contexts/
│   │   └── FleetContext.jsx          # Estado global da frota (Provider + useFleet hook)
│   ├── components/
│   │   ├── Campo.jsx                 # Input wrapper com rótulo e highlight de vazio/atrasado
│   │   ├── ChipValor.jsx             # Badge colorido de potencial/vencimento
│   │   ├── Gauge.jsx                 # Gráfico circular de disponibilidade (SVG)
│   │   ├── LogoEMS.jsx               # SVG do logo
│   │   ├── Modal.jsx                 # Modal reutilizável (substitui alert/confirm/prompt)
│   │   ├── Selo.jsx                  # Selo de potencial inline
│   │   └── SeloSituacao.jsx          # Badge de situação da aeronave
│   └── pages/
│       ├── Shell.jsx                 # Layout raiz: header, abas, footer, modais globais
│       ├── VisaoComando.jsx          # Aba "Cmdo Btl" — KPIs, gauge, prontidão por modelo
│       ├── VisaoEMS.jsx              # Aba "Cmt EMS" — tabela detalhada
│       ├── Gestao.jsx                # Aba "Gerentes de Frota" — lista de aeronaves
│       └── PainelAeronave.jsx        # Painel individual de cada aeronave (dados, manutenção, anotações)
```

---

## Banco de dados — Supabase

- **Projeto:** `sispug` | ID: `dqkyjcfxdvsfqtfnxbzl` | Região: South America (São Paulo)
- **URL:** `https://dqkyjcfxdvsfqtfnxbzl.supabase.co`
- **Tabela:** `frota` — uma única linha (id=1), coluna `dados` JSONB com toda a frota
- **Real-time:** ativado via `ALTER PUBLICATION supabase_realtime ADD TABLE frota`
- **RLS:** habilitado com políticas abertas (controle de acesso feito via PIN no app)

### `.env.local` (não commitado — está no .gitignore)
```
VITE_SUPABASE_URL=https://dqkyjcfxdvsfqtfnxbzl.supabase.co
VITE_SUPABASE_KEY=sb_publishable_zh2bGLRWt7mbLu_rZ8hRCw_oV5tfBJC
```

As mesmas variáveis estão configuradas no painel do Vercel como variáveis de ambiente.

---

## Como fazer push para o GitHub

O git já está configurado com o token no remote. Basta:

```bash
cd <pasta-do-projeto>/sispug
git add <arquivos>
git commit -m "descrição"
git push
```

> **Atenção ao path do sandbox:** a pasta do usuário em `/Users/rafaelpugliesi/Claude/Projects/SisPug/` é montada no sandbox Linux em `/sessions/<id-da-sessão>/mnt/SisPug/`. Use o path do sandbox nos comandos bash.

---

## Arquitetura de dados

```
fleet = {
  ordem: ["2001", "2002", ...],       // numerais ordenados
  aeronaves: {
    "2001": {
      dbId, numeral, modelo, situacao, local, motivo,
      tsnCelula, tsnGtm1, tsnGtm2,
      tsnCelulaAtualizadoEm,          // timestamp ISO — usado pela notificação de TSN
      tsnGtm1AtualizadoEm,
      tsnGtm2AtualizadoEm,
      confirmacaoMntEm,               // timestamp da última confirmação Mnt 100h/100d
      pousos,
      inspecoes: { atSem, atCom, potencialAt, inspC },
      limitesVida: [...],             // array de rows de manutenção
      celula: [...],
      motores: [...],
      recheques: [...],
      anotacoes: [...],
      travados: { "inspecoes": true, ... }
    }
  },
  planejamento: { "Pantera K2": { manutencoes: [...] }, ... },
  plnjConfirmado: { "Pantera K2": "2024-01-12T..." }
}
```

---

## Funcionalidades principais implementadas

### Modo visualização / edição (PIN)
- PIN: `5215`
- Por padrão o app abre em **modo visualização** (somente leitura)
- O botão "🔒 Visualização" / "🔓 Editando" fica no header
- Implementado via `modoEdicao` state no `FleetContext`
- Campos bloqueados com atributo HTML `inert` (bloqueia mouse E teclado)
  - `<div className="grade-form" {...(!modoEdicao ? { inert: "" } : {})}>`
  - `<tbody {...(!modoEdicao ? { inert: "" } : {})}>`
- CSS `pointer-events: none` **não** é suficiente (só bloqueia mouse)
- Botão "Importar" e ações destrutivas só aparecem em modo edição

### Dados compartilhados (Supabase real-time)
- Toda alteração é salva no Supabase após debounce de 400ms
- Subscription via `postgres_changes` sincroniza entre os 6 usuários em tempo real
- `ultimaSalvaRef` evita echo loop: snapshot é gravado **antes** do `await salvarFrota()` para que o evento real-time chegue já com o ref preenchido

### Notificações TSN
- Aparece quando TSN foi preenchido há mais de 24 horas **úteis** (seg–sex)
- Campos vazios **não** disparam notificação
- Cada campo (Célula, GTM I, GTM II) tem seu próprio timestamp

### Prontidão (VisaoComando)
- "Disponibilidade" no gauge e "Prontidão por Modelo" consideram **Disponível + Restrita** como "prontas"
- Barra de cada modelo exibe rótulos numéricos acima de cada segmento colorido

---

## Padrões de código

- CSS: **tudo** em `src/styles/styles.js` como string. Nunca criar arquivos `.css` separados.
- Modais: sempre usar o componente `<Modal>` — nunca `alert()`, `confirm()` ou `prompt()`
- Mutações de estado: sempre via funções do `FleetContext` (nunca `setFleet` direto fora do contexto)
- Git commits em português, prefixo semântico: `feat:`, `fix:`, `refactor:`, `style:`

---

## Modelos de aeronave

| Modelo | Designação |
|---|---|
| Pantera K2 | HM-1A |
| Black Hawk | HM-2A |
| Cougar | HM-3 |

Pantera K2 não tem campo "Pousos" (exibe "não é o caso").

---

## Vercel

- URL: https://sispug.vercel.app
- Deploy automático a cada `git push` na branch `main`
- Variáveis de ambiente configuradas no painel do Vercel (mesmas do `.env.local`)
- Build command: `npm run build` | Output: `dist`
