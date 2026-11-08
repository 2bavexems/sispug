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
│   │   ├── localStore.js             # Cliente Supabase: carregar, enviarOps (RPC), lerVersao, subscribe
│   │   ├── sync.js                   # calcularOps (diferença) e aplicarOps — espelho da função SQL
│   │   ├── motorSync.js              # Motor de sincronização (base × tela, rebase, versões, reenvio)
│   │   └── conteudo.js               # Trava anti-apagamento (frotaTemConteudo)
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
├── sql/01_sincronizacao_segura.sql   # Função de gravação, histórico, bloqueio do UPDATE direto
└── scripts/
    ├── teste-sync.mjs                # node scripts/teste-sync.mjs — simula vários gerentes simultâneos
    └── teste-sql.mjs                 # testa a função SQL num Postgres embutido (ver cabeçalho)
```

---

## Banco de dados — Supabase

- **Projeto:** `sispug` | ID: `dqkyjcfxdvsfqtfnxbzl` | Região: South America (São Paulo)
- **URL:** `https://dqkyjcfxdvsfqtfnxbzl.supabase.co`
- **Tabela:** `frota` — uma única linha (id=1), coluna `dados` JSONB com toda a frota e coluna `versao` (sobe a cada gravação)
- **Gravação:** SOMENTE pela função `frota_aplicar_ops(p_ops, p_cliente)` — recebe só os campos alterados. O `UPDATE` direto na tabela está **revogado** para o app (ver `sql/01_sincronizacao_segura.sql`)
- **Histórico:** `frota_alteracoes` (cada campo alterado: quando, valor anterior, valor novo, navegador) e `frota_historico` (backup antigo: cópia completa da frota a cada gravação, últimas 2000, via gatilho `trg_snapshot_frota`). Consultas prontas no fim do arquivo SQL
- **Real-time:** ativado via `ALTER PUBLICATION supabase_realtime ADD TABLE frota`
- **RLS:** habilitado com políticas abertas (controle de acesso feito via PIN no app)

### `.env.local` (não commitado — está no .gitignore)
```
VITE_SUPABASE_URL=https://dqkyjcfxdvsfqtfnxbzl.supabase.co
VITE_SUPABASE_KEY=sb_publishable_zh2bGLRWt7mbLu_rZ8hRCw_oV5tfBJC
```

As mesmas variáveis estão configuradas no painel do Vercel como variáveis de ambiente.

---

## Fluxo de trabalho diário (Cowork) — editar e publicar

O usuário pede alterações no dia a dia e espera: **arquivos editados + publicado no GitHub** (a Vercel publica sozinha a cada push na `main`). Preferência do usuário: **editar → validar com build → publicar**.

Passo a passo para CADA alteração:

1. **Editar** os arquivos em `sispug/src/...` conforme o pedido.
2. **Validar** com um build de teste (NÃO use `npm run build` direto: o mount não deixa apagar `dist/.DS_Store` e o build falha na limpeza). Rode para uma pasta temporária:
   ```bash
   cd <sandbox>/SisPug/sispug
   npx vite build --outDir /tmp/sispug-build-check --emptyOutDir
   ```
   Se aparecer `✓ built`, o código está válido.
3. **Publicar** com o script pronto (lida sozinho com os locks do git):
   ```bash
   cd <sandbox>/SisPug
   ./publicar.sh "mensagem do commit em português (prefixo: feat/fix/refactor/style/docs)"
   ```

### ⚠️ Limitação do ambiente: locks do git
Este mount **não permite apagar** arquivos (`rm` dá "Operation not permitted"), mas **permite renomear/mover**. O git cria `.git/*.lock` a cada operação e não consegue removê-los, deixando locks órfãos que travam a próxima operação. Solução (já embutida no `publicar.sh`): mover os locks para fora antes de cada comando git —
```bash
find .git -name '*.lock' | while read -r f; do mv "$f" ../_arquivo-antigo/gitlock-$(date +%s%N); done
```

### Credencial do GitHub
O remote usa HTTPS com token. Se um push falhar por autenticação, o token precisa ser reconfigurado:
```bash
git remote set-url origin https://<TOKEN>@github.com/2bavexems/sispug.git
```
Nunca commitar o token. O `.git/config` é local (não vai para o GitHub).

> **Path do sandbox:** a pasta `/Users/rafaelpugliesi/Claude/Projects/SisPug/` é montada no sandbox Linux em `/sessions/<id-da-sessão>/mnt/SisPug/`. Use o path do sandbox nos comandos bash.

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

### Dados compartilhados — sincronização segura (nov/2026)
- **NUNCA gravar a frota inteira.** Era isso que fazia o TSN "voltar sozinho": a aba de um gerente com dados antigos regravava tudo por cima do lançamento de outro.
- Toda mutação passa por `setFleet` do `FleetContext`, que chama `motor.mutar()` (`src/lib/motorSync.js`).
- O motor guarda a **base** (versão do servidor) e a **tela**. 400 ms após editar, envia só a diferença (`calcularOps`) para `frota_aplicar_ops`.
- Linhas de tabela (itens com `id`) são endereçadas pelo id (`{ id: "..." }` no caminho), não pela posição.
- Evento do tempo real → edições locais pendentes são reaplicadas por cima; nada recebido é regravado.
- Versões antigas/repetidas são ignoradas. Recarga do servidor: ao reconectar, ao voltar para a aba, ao focar a janela, ao voltar a internet e quando a conferência de 20 s detecta versão perdida.
- Falha de gravação: aviso vermelho no rodapé + toast, reenvio automático. Fechar a aba com pendências pede confirmação.
- **Se mudar `aplicarOps` (sync.js), mude igual a função SQL** — e rode os dois testes em `scripts/`.

### Campo TSN (CampoTSN em PainelAeronave.jsx)
- Valor fica só na tela enquanto digita; grava ao sair do campo/Enter, com timestamp (mesmo valor = "atualizado hoje").
- TSN menor que o anterior ou apagado → Modal de confirmação; cancelar mantém o anterior.
- TSN vazio nunca vira 0: `potencial()` devolve null e as telas mostram "sem TSN" (`tsnFaltando` em domain.js).
- Resumos (Cmdo Btl / Cmt EMS) usam `limiteEfetivo` (com extensão; se vazio, sem extensão).

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
