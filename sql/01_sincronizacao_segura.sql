-- ============================================================================
-- SisPug — Etapa 1: sincronização segura (aplicar UMA vez no SQL Editor do Supabase)
-- ----------------------------------------------------------------------------
-- O que muda:
--  1. Coluna "versao" na tabela frota (contador que sobe a cada gravação).
--  2. Função frota_aplicar_ops: o app passa a gravar SÓ os campos alterados,
--     de forma atômica no servidor. Um gerente nunca mais sobrescreve o
--     lançamento de outro (fim do "TSN que volta sozinho").
--  3. Histórico campo a campo (frota_alteracoes): cada alteração fica registrada
--     com data/hora, valor anterior e valor novo — permite auditar e desfazer.
--     (O backup antigo "frota_historico" — cópia completa da frota a cada
--     gravação, últimas 2000, via gatilho trg_snapshot_frota — continua igual.)
--  4. Bloqueia a gravação "frota inteira" usada pela versão antiga do app:
--     abas antigas abertas não conseguem mais sobrescrever os dados.
-- O script pode ser executado mais de uma vez sem causar problema.
-- ============================================================================

-- 1) Versão ------------------------------------------------------------------
alter table public.frota add column if not exists versao bigint not null default 0;

-- 2) Histórico campo a campo ---------------------------------------------------
create table if not exists public.frota_alteracoes (
  id             bigserial primary key,
  versao         bigint      not null,
  alterado_em    timestamptz not null default now(),
  cliente        text,
  tipo           text        not null,          -- 'set' (gravou) ou 'del' (apagou)
  caminho        jsonb       not null,          -- ex.: ["aeronaves","2001","tsnCelula"]
  valor_anterior jsonb,
  valor_novo     jsonb
);
create index if not exists idx_frota_alt_data on public.frota_alteracoes (alterado_em desc);

alter table public.frota_alteracoes enable row level security;
-- Sem políticas = ninguém acessa pelo app; só o painel do Supabase e a função abaixo.
revoke all on public.frota_alteracoes from anon, authenticated;

-- 3) Função de gravação por campo --------------------------------------------
-- p_ops: lista de operações [{ "tipo": "set"|"del", "path": [...], "valor": ... }]
-- Cada item de "path" é um nome de campo (texto) ou {"id": "..."} para localizar
-- uma linha de tabela (manutenção, anotação, missão...) pelo seu id — assim duas
-- pessoas mexendo em linhas diferentes da mesma tabela não se atrapalham.
-- Retorna a nova versão da frota.
create or replace function public.frota_aplicar_ops(p_ops jsonb, p_cliente text default null)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dados      jsonb;
  v_antes      jsonb;
  v_versao     bigint;
  v_nova       bigint;
  v_op         jsonb;
  v_seg        jsonb;
  v_path       text[];
  v_cur        jsonb;
  v_idx        int;
  v_n          int;
  v_tipo       text;
  v_valor      jsonb;
  v_anv_antes  int;
  v_anv_depois int;
  i            int;
begin
  if p_ops is null or jsonb_typeof(p_ops) <> 'array' then
    raise exception 'p_ops deve ser uma lista';
  end if;
  if jsonb_array_length(p_ops) = 0 then
    select versao into v_versao from frota where id = 1;
    return coalesce(v_versao, 0);
  end if;

  -- Trava a linha: gravações simultâneas são aplicadas uma de cada vez.
  select dados, versao into v_dados, v_versao from frota where id = 1 for update;
  if not found then raise exception 'linha da frota (id=1) não encontrada'; end if;
  v_dados  := coalesce(v_dados, '{}'::jsonb);
  v_antes  := v_dados;
  v_versao := coalesce(v_versao, 0);
  v_nova   := v_versao + 1;

  <<ops>>
  for v_op in select value from jsonb_array_elements(p_ops) loop
    v_tipo  := coalesce(v_op->>'tipo', 'set');
    v_valor := coalesce(v_op->'valor', 'null'::jsonb);
    if v_tipo not in ('set', 'del') then continue ops; end if;
    if jsonb_typeof(v_op->'path') <> 'array' then continue ops; end if;
    v_n := jsonb_array_length(v_op->'path');
    if v_n = 0 then continue ops; end if;   -- nunca substitui a frota inteira

    v_path := '{}';
    v_cur  := v_dados;
    for i in 0 .. v_n - 1 loop
      v_seg := v_op->'path'->i;
      if jsonb_typeof(v_seg) = 'object' then
        -- localizar linha pelo id
        if v_cur is null or jsonb_typeof(v_cur) <> 'array' then continue ops; end if;
        v_idx := null;
        select (e.ord - 1)::int into v_idx
          from jsonb_array_elements(v_cur) with ordinality as e(el, ord)
         where e.el->>'id' = v_seg->>'id'
         limit 1;
        if v_idx is null then
          -- linha não existe: se for uma gravação da linha inteira, acrescenta;
          -- caso contrário (linha apagada por outra pessoa) ignora a operação.
          if i = v_n - 1 and v_tipo = 'set' then
            insert into frota_alteracoes (versao, cliente, tipo, caminho, valor_anterior, valor_novo)
            values (v_nova, p_cliente, 'set', v_op->'path', null, v_valor);
            v_dados := jsonb_set(v_dados, v_path, v_cur || jsonb_build_array(v_valor), false);
          end if;
          continue ops;
        end if;
        v_path := v_path || v_idx::text;
        v_cur  := v_cur -> v_idx;
      else
        -- campo de objeto; se o "pai" sumiu (ex.: aeronave removida), ignora
        if v_cur is null or jsonb_typeof(v_cur) <> 'object' then continue ops; end if;
        v_path := v_path || (v_seg #>> '{}');
        v_cur  := v_cur -> (v_seg #>> '{}');
      end if;
    end loop;

    if v_tipo = 'del' then
      if v_cur is null then continue ops; end if;   -- já não existe
      insert into frota_alteracoes (versao, cliente, tipo, caminho, valor_anterior, valor_novo)
      values (v_nova, p_cliente, 'del', v_op->'path', v_cur, null);
      v_dados := v_dados #- v_path;
    else
      if v_cur is not distinct from v_valor then continue ops; end if;  -- nada mudou
      insert into frota_alteracoes (versao, cliente, tipo, caminho, valor_anterior, valor_novo)
      values (v_nova, p_cliente, 'set', v_op->'path', v_cur, v_valor);
      v_dados := jsonb_set(v_dados, v_path, v_valor, true);
    end if;
  end loop;

  if v_dados is null or jsonb_typeof(v_dados) <> 'object' then
    raise exception 'resultado inválido — gravação cancelada';
  end if;

  -- Trava anti-apagamento: nunca deixa a frota ficar sem nenhuma aeronave
  -- se antes tinha aeronaves.
  select count(*) into v_anv_antes  from jsonb_object_keys(case when jsonb_typeof(v_antes->'aeronaves') = 'object' then v_antes->'aeronaves' else '{}'::jsonb end);
  select count(*) into v_anv_depois from jsonb_object_keys(case when jsonb_typeof(v_dados->'aeronaves') = 'object' then v_dados->'aeronaves' else '{}'::jsonb end);
  if v_anv_antes > 0 and v_anv_depois = 0 then
    raise exception 'gravação bloqueada: apagaria todas as aeronaves';
  end if;

  if v_dados = v_antes then
    -- nada mudou de fato: não gera versão nova (descarta histórico vazio)
    return v_versao;
  end if;

  update frota
     set dados = v_dados, versao = v_nova, atualizado_em = now()
   where id = 1;

  return v_nova;
end;
$$;

revoke all on function public.frota_aplicar_ops(jsonb, text) from public;
grant execute on function public.frota_aplicar_ops(jsonb, text) to anon, authenticated;

-- 4) Bloqueia a gravação direta da frota inteira (versão antiga do app) -------
-- Leitura continua liberada (necessária para carregar e para o tempo real).
revoke insert, update, delete on public.frota from anon, authenticated;
grant select on public.frota to anon, authenticated;

-- ============================================================================
-- CONSULTAS ÚTEIS (não precisa executar agora)
-- ----------------------------------------------------------------------------
-- Últimas alterações de TSN:
--   select alterado_em at time zone 'America/Sao_Paulo' as quando, caminho, valor_anterior, valor_novo, cliente
--     from frota_alteracoes where caminho->>2 like 'tsn%' order by id desc limit 50;
-- Tudo o que mudou numa aeronave hoje:
--   select * from frota_alteracoes where caminho->>1 = '2001' and alterado_em > current_date order by id desc;
-- Cópias completas da frota (backup antigo, uma por gravação) para recuperação:
--   select id, criado_em from frota_historico order by id desc limit 50;
-- ============================================================================
