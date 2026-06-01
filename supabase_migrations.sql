-- Tabela de Scripts/Roteiros
CREATE TABLE scripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  script_body TEXT,
  context TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('hard', 'medium', 'easy')),
  column_id TEXT NOT NULL DEFAULT 'roteiro' CHECK (column_id IN ('roteiro', 'gravando', 'editando', 'publicado')),
  day TEXT CHECK (day IN ('segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo')),
  agent_status TEXT NOT NULL DEFAULT 'idle' CHECK (agent_status IN ('idle', 'running', 'done', 'error')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Keywords
CREATE TABLE script_keywords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Search Terms (para B-roll)
CREATE TABLE script_search_terms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  search_term TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_scripts_column_id ON scripts(column_id);
CREATE INDEX idx_scripts_tier ON scripts(tier);
CREATE INDEX idx_scripts_day ON scripts(day);
CREATE INDEX idx_script_keywords_script_id ON script_keywords(script_id);
CREATE INDEX idx_script_search_terms_script_id ON script_search_terms(script_id);
