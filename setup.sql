-- Script de Setup para Supabase
-- Execute isso no SQL Editor do Supabase Dashboard

-- 1. Adicionar coluna avatar_url se não existir
ALTER TABLE empresas
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Pronto! A coluna foi adicionada.
-- Agora você precisa criar o bucket no Supabase Storage:
-- 1. Vá em Storage (no menu lateral)
-- 2. Clique em "Create new bucket"
-- 3. Nome: avatares
-- 4. Marque "Public bucket"
-- 5. Criar!
