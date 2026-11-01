-- Layouts de feed usados pela IA para montar o guia das ações.
-- Rodar no SQL Editor do Supabase (Dashboard > SQL Editor > New query).

create table if not exists public.layouts_feed (
  id text primary key,
  codigo text not null,
  nome text not null,
  perfil text not null,                -- Humano, Equilibrado, Produto, Promocional
  colunas int not null default 3,
  linhas int not null,
  ordem_visual jsonb not null,         -- ["M","P","P", ...] da esquerda para a direita
  ordem_publicacao jsonb not null,     -- a mesma lista invertida
  requisitos jsonb not null,           -- { "M": 6, "P": 6, "A": 0 }
  criado_em timestamptz not null default now()
);

create index if not exists layouts_feed_codigo_idx on public.layouts_feed (codigo);

alter table public.layouts_feed enable row level security;
