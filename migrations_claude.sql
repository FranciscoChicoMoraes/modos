-- Campo Claude (link do projeto Claude) nas empresas de Demandas.
-- Execute no Supabase Dashboard > SQL Editor.
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS claude TEXT;
