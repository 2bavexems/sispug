// scripts/teste-sql.mjs — testa sql/01_sincronizacao_segura.sql num Postgres embutido (PGlite)
// Rodar: npm i --no-save @electric-sql/pglite@0.2 && node scripts/teste-sql.mjs sql/01_sincronizacao_segura.sql
// Confere que a função do banco produz EXATAMENTE o mesmo resultado que src/lib/sync.js.
import { PGlite } from "@electric-sql/pglite";
import fs from "fs";
import { calcularOps, aplicarOps, iguais } from "../src/lib/sync.js";
const sql = fs.readFileSync(process.argv[2], "utf8");
const db = new PGlite();
let falhas = 0; const ok = (c, m) => { if (!c) { falhas++; console.log("  ✗ " + m); } };
await db.exec(`create role anon; create role authenticated;
  create table public.frota (id int primary key, dados jsonb, atualizado_em timestamptz);
  alter table public.frota enable row level security;
  create policy leitura_livre on public.frota for select using (true);
  create policy escrita_livre on public.frota for update using (true) with check (true);
  grant all on public.frota to anon, authenticated;
  -- backup antigo existente em produção (cópia completa a cada gravação)
  create table public.frota_historico (id bigserial primary key, frota_id int, dados jsonb, criado_em timestamptz default now());
  grant all on public.frota_historico to anon, authenticated;
  create or replace function public.snapshot_frota() returns trigger language plpgsql security definer set search_path to 'public' as $f$
  begin if OLD.dados is distinct from NEW.dados then
    insert into public.frota_historico(frota_id, dados, criado_em) values (OLD.id, OLD.dados, now());
    delete from public.frota_historico where id < (select max(id) - 2000 from public.frota_historico);
  end if; return NEW; end; $f$;
  create trigger trg_snapshot_frota after update on public.frota for each row execute function public.snapshot_frota();
  insert into public.frota_historico(frota_id, dados) values (1, '{"antigo": true}');`);
let semente = 7; const rnd = () => ((semente = (semente * 1103515245 + 12345) % 2147483648) / 2147483648);
const int = (n) => Math.floor(rnd() * n); const pick = (a) => a[int(a.length)];
let c = 0; const id = () => "r" + (++c);
const anv = (n, m) => ({ numeral: n, modelo: m, tsnCelula: "1", situacao: "Disponível", inspecoes: { atSem: "" }, limitesVida: [], anotacoes: [], travados: {} });
const ini = { ordem: ["2001", "4001"], aeronaves: { "2001": anv("2001", "Black Hawk"), "4001": anv("4001", "Cougar") },
  tasa: { missoes: [], pessoal: { especialistas: [] }, material: [] }, planejamento: {} };
await db.query("insert into frota values (1, $1, now())", [ini]);
await db.exec(sql); await db.exec(sql); // duas vezes: precisa ser seguro repetir
console.log("  ✓ script executado 2x sem erro");
const ler = async () => (await db.query("select dados, versao from frota where id=1")).rows[0];
const aplicarSQL = async (ops) => (await db.query("select public.frota_aplicar_ops($1::jsonb, 'teste') as v", [JSON.stringify(ops)])).rows[0].v;

function editar(f) {
  const g = JSON.parse(JSON.stringify(f)); const ns = Object.keys(g.aeronaves); const r = int(12);
  if (!ns.length) { g.aeronaves["2001"] = anv("2001", "Black Hawk"); g.ordem = ["2001"]; return g; }
  const a = g.aeronaves[pick(ns)];
  if (r < 3) a.tsnCelula = String(int(9999));
  else if (r < 4) a.inspecoes.atSem = "2026-1" + int(9);
  else if (r < 6) a.limitesVida.push({ id: id(), os: "x" + int(99), obs: "" });
  else if (r < 7 && a.limitesVida.length) pick(a.limitesVida).obs = "o" + int(99);
  else if (r < 8 && a.limitesVida.length) a.limitesVida.splice(int(a.limitesVida.length), 1);
  else if (r < 9) g.tasa.missoes.push({ id: id(), missao: "m" });
  else if (r < 10) { const n = "9" + int(99); g.aeronaves[n] = anv(n, "Pantera K2"); g.ordem.push(n); }
  else if (r < 11 && ns.length > 2) { const n = pick(ns); delete g.aeronaves[n]; g.ordem = g.ordem.filter((x) => x !== n); }
  else if (r < 12) a.travados = { inspecoes: !a.travados.inspecoes };
  return g;
}
// Clientes "atrasados": calculam ops a partir de uma base antiga (como uma aba parada)
let bases = [ini, ini, ini];
let iguaisCont = 0;
for (let i = 0; i < 1500; i++) {
  const k = int(3);
  const atual = (await ler()).dados;
  const tela = editar(bases[k]);
  const ops = calcularOps(bases[k], tela);
  const esperado = aplicarOps(atual, ops);
  const antes = await ler();
  await aplicarSQL(ops);
  const depois = await ler();
  if (iguais(depois.dados, esperado)) iguaisCont++;
  else { ok(false, "SQL ≠ app na iteração " + i + " ops=" + JSON.stringify(ops).slice(0, 300)); break; }
  const mudou = !iguais(antes.dados, depois.dados);
  ok(Number(depois.versao) === Number(antes.versao) + (mudou ? 1 : 0), "versão não avançou corretamente em " + i);
  bases[k] = rnd() < 0.3 ? depois.dados : aplicarOps(bases[k], ops); // às vezes sincroniza
}
console.log(`  ✓ ${iguaisCont} rodadas: servidor (SQL) e app chegaram exatamente ao mesmo resultado`);

const hist = (await db.query("select count(*)::int n from frota_alteracoes")).rows[0].n;
const snap = (await db.query("select count(*)::int n from frota_historico")).rows[0].n;
const antigo = (await db.query("select count(*)::int n from frota_historico where dados->>'antigo' = 'true'")).rows[0].n;
ok(hist > 0, "histórico campo a campo vazio"); ok(snap > 1000, "backup antigo deveria continuar gravando (há " + snap + ")");
ok(antigo === 1, "registro antigo do backup foi perdido");
console.log(`  ✓ histórico campo a campo: ${hist} registros; backup antigo continua funcionando (${snap} cópias, registro pré-existente preservado)`);
const ex = (await db.query("select tipo, caminho, valor_anterior, valor_novo from frota_alteracoes where caminho->>2='tsnCelula' order by id desc limit 1")).rows[0];
console.log("  exemplo de histórico:", JSON.stringify(ex));

// Trava: apagar todas as aeronaves
const d = (await ler()).dados;
const opsApaga = Object.keys(d.aeronaves).map((n) => ({ tipo: "del", path: ["aeronaves", n] }));
let bloqueou = false; try { await aplicarSQL(opsApaga); } catch (e) { bloqueou = /apagaria todas/.test(e.message); }
ok(bloqueou, "deveria bloquear apagar todas as aeronaves");
ok(Object.keys((await ler()).dados.aeronaves).length > 0, "aeronaves sumiram");
console.log("  " + (bloqueou ? "✓" : "✗") + " bloqueia apagar todas as aeronaves");
// Valor ausente não pode virar NULL na frota
await aplicarSQL([{ tipo: "set", path: ["aeronaves", Object.keys(d.aeronaves)[0], "local"] }]);
ok((await ler()).dados !== null, "frota virou null");
// Caminho vazio é ignorado (nunca substitui a frota inteira)
const v0 = (await ler()).versao; await aplicarSQL([{ tipo: "set", path: [], valor: {} }]);
ok(iguais((await ler()).versao, v0), "caminho vazio alterou a frota");
console.log("  ✓ operações malformadas são ignoradas");

// Versão antiga do app (grava a frota inteira) deve ser BLOQUEADA
await db.exec("set role anon");
let bloqueadoAntigo = false;
try { await db.query("update frota set dados = '{}'::jsonb where id = 1"); } catch (e) { bloqueadoAntigo = /permission denied/.test(e.message); }
let leitura = false; try { await db.query("select versao from frota"); leitura = true; } catch {}
let rpc = false; try { await aplicarSQL([{ tipo: "set", path: ["aeronaves", Object.keys(d.aeronaves)[0], "local"], valor: "Hangar" }]); rpc = true; } catch (e) { console.log(e.message); }
let histPriv = false; try { await db.query("select * from frota_alteracoes"); } catch { histPriv = true; }
await db.exec("reset role");
ok(bloqueadoAntigo, "update direto deveria ser negado"); ok(leitura, "leitura deveria funcionar"); ok(rpc, "função deveria funcionar como anon"); ok(histPriv, "histórico não deveria ser acessível pelo app");
console.log(`  ${bloqueadoAntigo && leitura && rpc && histPriv ? "✓" : "✗"} app antigo bloqueado; leitura e nova gravação liberadas; histórico protegido`);
console.log(falhas ? `RESULTADO SQL: ${falhas} FALHA(S)` : "RESULTADO SQL: TODOS OS TESTES PASSARAM");
