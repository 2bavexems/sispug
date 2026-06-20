-- ============================================================================
-- SisPug — Supabase Edition
-- migrations.sql — rodar no SQL Editor do Supabase (uma única vez)
-- ============================================================================
-- Ordem: extensões → enums → tabelas → funções auxiliares → RLS → triggers
-- → realtime. Tudo idempotente onde possível.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('admin', 'gestor', 'tecnico');
exception when duplicate_object then null; end $$;

do $$ begin
  create type situacao_anv as enum ('Disponível', 'Restrita', 'Indisponível');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_manutencao as enum ('limitesVida', 'celula', 'motores', 'recheques');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_limite as enum ('Calendárica', 'Horária');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- TABELAS
-- ----------------------------------------------------------------------------

-- Esquadrilhas (tenant raiz). owner_id referencia auth.users para evitar
-- dependência circular com public.users.
create table if not exists public.esquadrilhas (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  owner_id    uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- Perfil de usuário (estende auth.users)
create table if not exists public.users (
  id             uuid primary key references auth.users (id) on delete cascade,
  email          text not null,
  name           text,
  role           user_role not null default 'admin',
  esquadrilha_id uuid not null references public.esquadrilhas (id) on delete cascade,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.aeronaves (
  id             uuid primary key default gen_random_uuid(),
  esquadrilha_id uuid not null references public.esquadrilhas (id) on delete cascade,
  numeral        text not null,
  modelo         text not null default 'Pantera K2' check (modelo in ('Pantera K2','Cougar')),
  situacao       situacao_anv not null default 'Disponível',
  local          text default 'SBTA',
  motivo         text default '',
  tsn_celula     numeric,
  tsn_gtm1       numeric,
  tsn_gtm2       numeric,
  pousos         integer,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (esquadrilha_id, numeral)            -- numeral único por esquadrilha
);

-- Uma linha de inspeções por aeronave (1:1)
create table if not exists public.inspecoes (
  id           uuid primary key default gen_random_uuid(),
  aeronave_id  uuid not null unique references public.aeronaves (id) on delete cascade,
  at_sem       date,
  at_com       date,
  potencial_at numeric,
  insp_c       date,
  updated_at   timestamptz not null default now()
);

-- Itens de manutenção (4 seções via tipo_manutencao).
-- limite_sem/limite_com são text para suportar tanto data ISO (Calendárica)
-- quanto número de horas (Horária) — o front interpreta conforme tipo_limite.
create table if not exists public.manutencoes (
  id              uuid primary key default gen_random_uuid(),
  aeronave_id     uuid not null references public.aeronaves (id) on delete cascade,
  tipo_manutencao tipo_manutencao not null,
  os              text default '',
  descricao       text default '',
  tipo_limite     tipo_limite not null default 'Calendárica',
  limite_sem      text default '',
  limite_com      text default '',
  aplicacao       text check (aplicacao in ('GTM I','GTM II','Ambos') or aplicacao is null),
  observacoes     text default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_aeronaves_esq   on public.aeronaves (esquadrilha_id);
create index if not exists idx_manut_aeronave  on public.manutencoes (aeronave_id);

-- Convites (BÔNUS): admin gera token; novo usuário entra na mesma esquadrilha
create table if not exists public.convites (
  token          uuid primary key default gen_random_uuid(),
  esquadrilha_id uuid not null references public.esquadrilhas (id) on delete cascade,
  role           user_role not null default 'gestor',
  created_by     uuid not null references auth.users (id) on delete cascade,
  expires_at     timestamptz not null default now() + interval '7 days',
  used_by        uuid references auth.users (id),
  created_at     timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- FUNÇÕES AUXILIARES (security definer evita recursão de RLS)
-- ----------------------------------------------------------------------------

-- Esquadrilha do usuário autenticado
create or replace function public.auth_esquadrilha_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select esquadrilha_id from public.users where id = auth.uid();
$$;

-- O usuário autenticado é admin?
create or replace function public.auth_is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select role = 'admin' from public.users where id = auth.uid()), false);
$$;

-- ----------------------------------------------------------------------------
-- TRIGGER: onboarding automático no signup
-- Fluxo 1 (sem convite): cria esquadrilha nova + perfil admin
-- Fluxo 2 (com convite): raw_user_meta_data.invite_token → entra na
--   esquadrilha do convite com o role do convite e marca o convite como usado
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_token  uuid;
  v_inv    public.convites%rowtype;
  v_esq_id uuid;
  v_role   user_role := 'admin';
begin
  -- tenta ler token de convite dos metadados do signup
  begin
    v_token := nullif(new.raw_user_meta_data->>'invite_token', '')::uuid;
  exception when others then
    v_token := null;
  end;

  if v_token is not null then
    select * into v_inv from public.convites
      where token = v_token and used_by is null and expires_at > now();
    if found then
      v_esq_id := v_inv.esquadrilha_id;
      v_role   := v_inv.role;
      update public.convites set used_by = new.id where token = v_token;
    end if;
  end if;

  if v_esq_id is null then
    insert into public.esquadrilhas (nome, owner_id)
      values ('Esquadrilha de ' || coalesce(new.raw_user_meta_data->>'name', new.email), new.id)
      returning id into v_esq_id;
  end if;

  insert into public.users (id, email, name, role, esquadrilha_id)
    values (new.id, new.email, new.raw_user_meta_data->>'name', v_role, v_esq_id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- TRIGGER: updated_at automático (resolução last-write-wins usa este campo)
-- ----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end; $$;

drop trigger if exists t_touch_users        on public.users;
drop trigger if exists t_touch_aeronaves    on public.aeronaves;
drop trigger if exists t_touch_inspecoes    on public.inspecoes;
drop trigger if exists t_touch_manutencoes  on public.manutencoes;
create trigger t_touch_users       before update on public.users       for each row execute function public.touch_updated_at();
create trigger t_touch_aeronaves   before update on public.aeronaves   for each row execute function public.touch_updated_at();
create trigger t_touch_inspecoes   before update on public.inspecoes   for each row execute function public.touch_updated_at();
create trigger t_touch_manutencoes before update on public.manutencoes for each row execute function public.touch_updated_at();

-- Cria automaticamente a linha de inspeções junto da aeronave
create or replace function public.create_inspecao_for_aeronave()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.inspecoes (aeronave_id) values (new.id)
  on conflict (aeronave_id) do nothing;
  return new;
end; $$;

drop trigger if exists t_auto_inspecao on public.aeronaves;
create trigger t_auto_inspecao
  after insert on public.aeronaves
  for each row execute function public.create_inspecao_for_aeronave();

-- ----------------------------------------------------------------------------
-- RLS — habilitado em TODAS as tabelas
-- Princípio: cada usuário só enxerga/edita dados da própria esquadrilha.
-- ----------------------------------------------------------------------------
alter table public.esquadrilhas enable row level security;
alter table public.users        enable row level security;
alter table public.aeronaves    enable row level security;
alter table public.inspecoes    enable row level security;
alter table public.manutencoes  enable row level security;
alter table public.convites     enable row level security;

-- esquadrilhas: membro vê; só admin altera/remove. INSERT só via trigger
-- (security definer), por isso não há policy de insert para clientes.
drop policy if exists esq_select on public.esquadrilhas;
create policy esq_select on public.esquadrilhas
  for select using (id = public.auth_esquadrilha_id());
drop policy if exists esq_update on public.esquadrilhas;
create policy esq_update on public.esquadrilhas
  for update using (id = public.auth_esquadrilha_id() and public.auth_is_admin());
drop policy if exists esq_delete on public.esquadrilhas;
create policy esq_delete on public.esquadrilhas
  for delete using (id = public.auth_esquadrilha_id() and public.auth_is_admin());

-- users: vê colegas da mesma esquadrilha; edita apenas o próprio perfil
drop policy if exists users_select on public.users;
create policy users_select on public.users
  for select using (esquadrilha_id = public.auth_esquadrilha_id());
drop policy if exists users_update on public.users;
create policy users_update on public.users
  for update using (id = auth.uid());

-- aeronaves: CRUD restrito à própria esquadrilha
drop policy if exists anv_select on public.aeronaves;
create policy anv_select on public.aeronaves
  for select using (esquadrilha_id = public.auth_esquadrilha_id());
drop policy if exists anv_insert on public.aeronaves;
create policy anv_insert on public.aeronaves
  for insert with check (esquadrilha_id = public.auth_esquadrilha_id());
drop policy if exists anv_update on public.aeronaves;
create policy anv_update on public.aeronaves
  for update using (esquadrilha_id = public.auth_esquadrilha_id());
drop policy if exists anv_delete on public.aeronaves;
create policy anv_delete on public.aeronaves
  for delete using (esquadrilha_id = public.auth_esquadrilha_id());

-- inspecoes / manutencoes: acesso herdado via aeronave → esquadrilha
drop policy if exists insp_all on public.inspecoes;
create policy insp_all on public.inspecoes
  for all using (
    exists (select 1 from public.aeronaves a
            where a.id = aeronave_id
              and a.esquadrilha_id = public.auth_esquadrilha_id())
  ) with check (
    exists (select 1 from public.aeronaves a
            where a.id = aeronave_id
              and a.esquadrilha_id = public.auth_esquadrilha_id())
  );

drop policy if exists manut_all on public.manutencoes;
create policy manut_all on public.manutencoes
  for all using (
    exists (select 1 from public.aeronaves a
            where a.id = aeronave_id
              and a.esquadrilha_id = public.auth_esquadrilha_id())
  ) with check (
    exists (select 1 from public.aeronaves a
            where a.id = aeronave_id
              and a.esquadrilha_id = public.auth_esquadrilha_id())
  );

-- convites: apenas admin da esquadrilha cria/vê
drop policy if exists conv_select on public.convites;
create policy conv_select on public.convites
  for select using (esquadrilha_id = public.auth_esquadrilha_id() and public.auth_is_admin());
drop policy if exists conv_insert on public.convites;
create policy conv_insert on public.convites
  for insert with check (esquadrilha_id = public.auth_esquadrilha_id() and public.auth_is_admin());

-- ----------------------------------------------------------------------------
-- REALTIME: publica mudanças das tabelas operacionais
-- (no painel: Database → Replication → confirme que a publicação está ativa)
-- ----------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.aeronaves;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.inspecoes;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.manutencoes;
exception when duplicate_object then null; end $$;

-- ============================================================================
-- TESTE RÁPIDO DE RLS (rodar como dois usuários distintos no SQL editor
-- usando "Run as role" ou via app em 2 contas):
--   select * from aeronaves;  -- cada conta só vê a própria esquadrilha
-- ============================================================================
