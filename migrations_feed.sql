-- Persistência do feed: publicações, imagens e legendas.
-- Execute no Supabase Dashboard > SQL Editor.

-- Publicações do feed (uma por quadradinho do grid)
create table if not exists feed_posts (
  id          text primary key,                 -- id gerado no navegador
  empresa_id  uuid references empresas(id) on delete cascade,
  tipo        text not null default 'single',   -- single | carousel | reels
  legenda     text,
  posicao     int  not null default 0,          -- ordem no grid (0 = mais recente)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Imagens de cada publicação (carrossel tem várias)
create table if not exists feed_imagens (
  id         text primary key,
  post_id    text not null references feed_posts(id) on delete cascade,
  url        text not null,                     -- arquivo no bucket "feed"
  posicao    int  not null default 0,           -- ordem dentro do carrossel
  created_at timestamptz not null default now()
);

create index if not exists feed_posts_posicao_idx   on feed_posts (posicao);
create index if not exists feed_posts_empresa_idx   on feed_posts (empresa_id);
create index if not exists feed_imagens_post_idx    on feed_imagens (post_id, posicao);
