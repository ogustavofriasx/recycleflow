-- ============================================================================
-- RECYCLEFLOW | Migracao 003 - Cooperativa de TESTE
-- Executar APOS 002_ecopontos_rio_claro.sql. Pode ser executada mais de uma vez.
--
-- Cadastro ficticio so para testar o filtro "Cooperativas" no mapa enquanto
-- nenhuma cooperativa real foi cadastrada. Todos os campos estao como "Teste"
-- e a localizacao e o centro de Rio Claro (nao e um endereco real).
--
-- REMOVER antes de publicar o site:
--   DELETE FROM ponto_coleta WHERE nome = 'Teste';
--   (horario_ponto e ponto_material saem junto, por ON DELETE CASCADE)
-- ============================================================================
\set ON_ERROR_STOP on
BEGIN;

INSERT INTO tipo_ponto_coleta (nome, descricao) VALUES
('Cooperativa', 'Cooperativa ou associação de catadores de materiais recicláveis.')
ON CONFLICT DO NOTHING;

INSERT INTO ponto_coleta
(id_tipo, nome, descricao, logradouro, numero, complemento, bairro, cidade, estado,
 localizacao, telefone, email_contato, horario_descricao, observacoes, ativo)
SELECT t.id_tipo, 'Teste', 'Teste', 'Teste', 'Teste', 'Teste', 'Teste', 'Rio Claro', 'SP',
       ST_SetSRID(ST_MakePoint(-47.5614, -22.4114), 4326)::geography,
       'Teste', 'teste@example.invalid', 'Teste', 'Teste', TRUE
FROM tipo_ponto_coleta t
WHERE t.nome = 'Cooperativa'
  AND NOT EXISTS (SELECT 1 FROM ponto_coleta WHERE nome = 'Teste');

-- Horario de teste: segunda a sexta, 8h-17h
INSERT INTO horario_ponto (id_ponto, dia_semana, hora_abertura, hora_fechamento)
SELECT p.id_ponto, d.dia, '08:00', '17:00'
FROM ponto_coleta p
CROSS JOIN (VALUES (1), (2), (3), (4), (5)) d(dia)
WHERE p.nome = 'Teste'
ON CONFLICT DO NOTHING;

-- Materiais de teste: papel e vidro (permite testar o filtro por material)
INSERT INTO ponto_material (id_ponto, id_material, observacoes)
SELECT p.id_ponto, m.id_material, 'Teste'
FROM ponto_coleta p
JOIN material m ON m.nome IN ('Papel e papelão', 'Vidro')
WHERE p.nome = 'Teste'
ON CONFLICT DO NOTHING;

COMMIT;

SELECT p.id_ponto, p.nome, t.nome AS tipo, p.bairro,
       (SELECT string_agg(m.nome, ', ') FROM ponto_material pm
          JOIN material m USING (id_material) WHERE pm.id_ponto = p.id_ponto) AS materiais
FROM ponto_coleta p JOIN tipo_ponto_coleta t USING (id_tipo)
WHERE p.nome = 'Teste';
