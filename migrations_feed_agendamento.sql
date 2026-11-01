-- Passo 2: agendamento das publicações do feed.
-- Execute no Supabase Dashboard > SQL Editor.

alter table feed_posts
  add column if not exists agendado_em timestamptz,
  add column if not exists status text not null default 'rascunho';
  -- status: rascunho | agendado | publicado

create index if not exists feed_posts_agenda_idx on feed_posts (agendado_em);
create index if not exists feed_posts_status_idx on feed_posts (status);
