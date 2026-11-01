-- Adicionar coluna avatar na tabela empresas
ALTER TABLE empresas ADD COLUMN avatar TEXT;

-- Se a tabela já existir e você quer ter certeza
-- ALTER TABLE empresas ADD COLUMN avatar TEXT DEFAULT NULL;
