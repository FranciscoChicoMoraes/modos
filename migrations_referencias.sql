-- Biblioteca de referências visuais do Marketing.
-- Rodar no SQL Editor do Supabase (Dashboard > SQL Editor > New query).

create table if not exists public.referencias (
  id uuid primary key,
  nome text not null,
  imagens jsonb not null default '[]'::jsonb,   -- URLs públicas do bucket "referencias"
  tags jsonb not null default '[]'::jsonb,      -- [{ id, categoria, valor }]
  criado_em timestamptz not null default now()
);

create index if not exists referencias_criado_em_idx
  on public.referencias (criado_em desc);

-- As rotas do servidor usam a service_role, que ignora RLS. Deixamos a RLS
-- ligada para o anon não ler nem escrever direto do navegador.
alter table public.referencias enable row level security;

-- O bucket "referencias" é criado pela própria rota, como público.
-- Se preferir criar na mão: Storage > New bucket > nome "referencias" > Public.

-- Objetivo da campanha escolhido no cadastro da referência.
alter table public.referencias
  add column if not exists objetivo text;

-- Lixeira das referências: quando preenchido, o item está excluído.
alter table public.referencias
  add column if not exists excluida_em timestamptz;

-- Nota de curadoria escrita pela IA, exibida no cartão da referência.
alter table public.referencias
  add column if not exists resumo text;
