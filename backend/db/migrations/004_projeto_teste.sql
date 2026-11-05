-- ============================================================================
-- RECYCLEFLOW | Migracao 004 - Projeto de TESTE
-- Pode ser executada mais de uma vez.
--
-- Projeto ficticio e PUBLICADO, so para ver a pagina /projetos funcionando com
-- dados da API. Instituicao "Teste" com tipo "ONG" (aparece no filtro ONGs).
--
-- REMOVER antes de publicar o site:
--   DELETE FROM projeto_iniciativa WHERE titulo = 'Teste';
--   DELETE FROM instituicao WHERE nome = 'Teste';
-- ============================================================================
\set ON_ERROR_STOP on
BEGIN;

INSERT INTO instituicao (nome, tipo, descricao, email, ativo)
SELECT 'Teste', 'ONG', 'Teste', 'teste@example.invalid', TRUE
WHERE NOT EXISTS (SELECT 1 FROM instituicao WHERE nome = 'Teste');

INSERT INTO projeto_iniciativa
(id_instituicao, titulo, descricao, tipo, data_inicio, data_fim, publicado)
SELECT i.id_instituicao, 'Teste',
       'Teste — descrição de exemplo para visualizar o card na página de projetos.',
       'teste', DATE '2026-11-01', NULL, TRUE
FROM instituicao i
WHERE i.nome = 'Teste'
  AND NOT EXISTS (SELECT 1 FROM projeto_iniciativa WHERE titulo = 'Teste');

COMMIT;

SELECT pr.id_projeto, pr.titulo, pr.publicado, i.nome AS instituicao, i.tipo
FROM projeto_iniciativa pr LEFT JOIN instituicao i USING (id_instituicao)
WHERE pr.titulo = 'Teste';
