-- Campanhas e ações do Marketing.
-- Rodar no SQL Editor do Supabase (Dashboard > SQL Editor > New query).

-- As colunas soltas servem para listar, ordenar e filtrar.
-- A coluna "dados" guarda o objeto inteiro que a tela usa, para o app
-- continuar evoluindo sem precisar de migração a cada campo novo.

create table if not exists public.campanhas (
  id text primary key,
  nome text not null,
  objetivo text,
  inicio date,
  fim date,
  dados jsonb not null default '{}'::jsonb,
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);

create index if not exists campanhas_criada_em_idx
  on public.campanhas (criada_em desc);

create table if not exists public.acoes (
  id text primary key,
  campanha_id text references public.campanhas (id) on delete set null,
  nome text not null,
  direcao_nome text,          -- nome da direção criativa escolhida
  dados jsonb not null default '{}'::jsonb,   -- inclui direção e moodboard
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);

create index if not exists acoes_campanha_idx on public.acoes (campanha_id);
create index if not exists acoes_criada_em_idx on public.acoes (criada_em desc);

-- As rotas do servidor usam a service_role, que ignora RLS. A RLS fica
-- ligada para o anon não ler nem escrever direto do navegador.
alter table public.campanhas enable row level security;
alter table public.acoes enable row level security;
