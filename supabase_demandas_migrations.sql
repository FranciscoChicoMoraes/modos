-- Empresas table (task containers)
CREATE TABLE empresas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cor TEXT NOT NULL CHECK (cor IN ('red', 'gray', 'green')),
  avatar BYTEA,
  instagram TEXT,
  agendamentos TEXT,
  pagina TEXT,
  tiktok TEXT,
  google TEXT,
  loginssenhas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'
);

-- Tarefas table (tasks within empresas)
CREATE TABLE tarefas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  data TEXT NOT NULL,
  periodo TEXT NOT NULL CHECK (periodo IN ('manha', 'tarde')),
  concluida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_empresas_user_id ON empresas(user_id);
CREATE INDEX idx_tarefas_empresa_id ON tarefas(empresa_id);
CREATE INDEX idx_tarefas_data ON tarefas(data);
CREATE INDEX idx_tarefas_concluida ON tarefas(concluida);

-- Row Level Security (enable later after policy implementation)
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;
