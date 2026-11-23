-- ============================================================================
-- RECYCLEFLOW | Migracao 005 - Autor dos conteudos educativos
-- Pode ser executada mais de uma vez.
--
-- Autor opcional, em texto livre: normalmente vem da fonte principal usada na
-- verificacao do conteudo (pessoa, orgao publico, instituicao etc.).
-- ============================================================================
\set ON_ERROR_STOP on
BEGIN;

ALTER TABLE conteudo_educativo ADD COLUMN IF NOT EXISTS autor VARCHAR(150);

COMMIT;
