-- Materiais: o acervo de texturas e acabamentos usado nas campanhas.
-- Rodar no SQL Editor do Supabase (Dashboard > SQL Editor > New query).

create table if not exists public.materiais (
  id uuid primary key,
  nome text not null,
  descricao text,                              -- resumo curto escrito pela IA
  imagens jsonb not null default '[]'::jsonb,  -- URLs públicas do bucket "materiais"
  tags jsonb not null default '[]'::jsonb,     -- [{ id, campo, valor, hex, imagemIndex }]
  criado_em timestamptz not null default now(),
  excluida_em timestamptz
);

create index if not exists materiais_criado_em_idx on public.materiais (criado_em desc);

alter table public.materiais enable row level security;

-- O bucket "materiais" é criado pela própria rota, como público.
