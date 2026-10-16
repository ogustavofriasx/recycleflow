-- ============================================================================
-- RECYCLEFLOW | Seed FICTICIO para desenvolvimento (PostgreSQL + PostGIS)
-- Compatibilidade: schema.sql versao 1.0 (13 tabelas)
-- Executar no banco recycleflow_db APOS schema.sql.
-- Executavel novamente: nao duplica os registros DEMO identificados abaixo.
-- ATENCAO: dados de demonstracao; nao representam locais, servicos ou horarios reais.
-- ============================================================================
\set ON_ERROR_STOP on
BEGIN;

-- 1) Categorias (5)
INSERT INTO categoria_material (nome, descricao, cor_hex, icone) VALUES
('[DEMO] Papel', 'Categoria ficticia para testes.', '#2563EB', 'file-text'),
('[DEMO] Plastico', 'Categoria ficticia para testes.', '#DC2626', 'package'),
('[DEMO] Vidro', 'Categoria ficticia para testes.', '#16A34A', 'wine'),
('[DEMO] Metal', 'Categoria ficticia para testes.', '#EAB308', 'wrench'),
('[DEMO] Eletronicos', 'Categoria ficticia para testes.', '#7C3AED', 'cpu')
ON CONFLICT DO NOTHING;

-- 2) Tipos de ponto (5)
INSERT INTO tipo_ponto_coleta (nome, descricao) VALUES
('[DEMO] Ecoponto', 'Tipo ficticio para testes.'),
('[DEMO] Cooperativa', 'Tipo ficticio para testes.'),
('[DEMO] Comercio parceiro', 'Tipo ficticio para testes.'),
('[DEMO] Ponto de logistica reversa', 'Tipo ficticio para testes.'),
('[DEMO] Centro de recebimento', 'Tipo ficticio para testes.')
ON CONFLICT DO NOTHING;

-- 3) Instituicoes (5): sem CNPJ real
INSERT INTO instituicao (nome, tipo, descricao, email, ativo)
SELECT v.nome, v.tipo, 'INSTITUICAO FICTICIA - somente para testes', v.email, TRUE
FROM (VALUES
 ('[DEMO] Instituto Verde Azul', 'ONG', 'verde-azul@example.invalid'),
 ('[DEMO] Cooperativa Circular', 'Cooperativa', 'circular@example.invalid'),
 ('[DEMO] Rede EcoComercio', 'Empresa', 'ecocomercio@example.invalid'),
 ('[DEMO] Associacao Novo Ciclo', 'Associacao', 'novo-ciclo@example.invalid'),
 ('[DEMO] Central Reuso', 'Empresa', 'reuso@example.invalid')
) v(nome, tipo, email)
WHERE NOT EXISTS (SELECT 1 FROM instituicao i WHERE i.nome = v.nome);

-- 4) Usuarios (5): contas DESATIVADAS; hash nao e uma credencial valida.
-- Para testar login, crie usuarios proprios via API, com senha e Argon2id reais.
INSERT INTO usuario (nome, email, senha, papel, ativo) VALUES
('[DEMO] Ana', 'ana.recycleflow@example.invalid', 'DEMO_LOGIN_DESABILITADO', 'usuario', FALSE),
('[DEMO] Bruno', 'bruno.recycleflow@example.invalid', 'DEMO_LOGIN_DESABILITADO', 'usuario', FALSE),
('[DEMO] Carla', 'carla.recycleflow@example.invalid', 'DEMO_LOGIN_DESABILITADO', 'usuario', FALSE),
('[DEMO] Diego', 'diego.recycleflow@example.invalid', 'DEMO_LOGIN_DESABILITADO', 'usuario', FALSE),
('[DEMO] Elisa', 'elisa.recycleflow@example.invalid', 'DEMO_LOGIN_DESABILITADO', 'usuario', FALSE)
ON CONFLICT DO NOTHING;

-- 5) Materiais (5): orientacoes ilustrativas, NAO validadas para uso publico
INSERT INTO material
(id_categoria, nome, descricao, reciclavel, tipo_descarte, instrucoes_preparo, cuidados, ativo)
SELECT c.id_categoria, v.nome, 'MATERIAL FICTICIO DE TESTE', v.reciclavel,
       v.tipo_descarte, 'Orientacao ilustrativa; validar antes de publicar.',
       'Nao utilizar como instrucao real de descarte.', TRUE
FROM (VALUES
 ('[DEMO] Papel', '[DEMO] Caixa de papelao', TRUE, 'coleta_seletiva'),
 ('[DEMO] Plastico', '[DEMO] Garrafa PET', TRUE, 'coleta_seletiva'),
 ('[DEMO] Vidro', '[DEMO] Pote de vidro', TRUE, 'coleta_seletiva'),
 ('[DEMO] Metal', '[DEMO] Lata de aluminio', TRUE, 'coleta_seletiva'),
 ('[DEMO] Eletronicos', '[DEMO] Celular usado', NULL::boolean, 'logistica_reversa')
) v(categoria, nome, reciclavel, tipo_descarte)
JOIN categoria_material c ON c.nome = v.categoria
ON CONFLICT DO NOTHING;

-- 6) Pontos de coleta (5), com COORDENADAS ILUSTRATIVAS na regiao de Rio Claro
-- Os nomes, enderecos e localizacoes NAO indicam locais reais.
INSERT INTO ponto_coleta
(id_tipo, id_instituicao, nome, descricao, logradouro, bairro, cidade, estado,
 localizacao, horario_descricao, observacoes, ativo)
SELECT t.id_tipo, i.id_instituicao, v.nome,
       'PONTO FICTICIO: proibido apresentar como local de coleta verdadeiro.',
       'Endereco ficticio - nao visitar', 'Bairro ficticio', 'Rio Claro', 'SP',
       ST_SetSRID(ST_MakePoint(v.lon, v.lat), 4326)::geography,
       'Horarios de teste cadastrados em horario_ponto',
       'Coordenadas apenas para desenvolvimento de mapas e filtros.', TRUE
FROM (VALUES
 ('[DEMO] Ponto Azul', '[DEMO] Ecoponto', '[DEMO] Instituto Verde Azul', -47.560, -22.410),
 ('[DEMO] Ponto Circular', '[DEMO] Cooperativa', '[DEMO] Cooperativa Circular', -47.570, -22.420),
 ('[DEMO] Ponto Comercio', '[DEMO] Comercio parceiro', '[DEMO] Rede EcoComercio', -47.550, -22.415),
 ('[DEMO] Ponto Reverso', '[DEMO] Ponto de logistica reversa', '[DEMO] Associacao Novo Ciclo', -47.565, -22.430),
 ('[DEMO] Ponto Reuso', '[DEMO] Centro de recebimento', '[DEMO] Central Reuso', -47.545, -22.405)
) v(nome, tipo, instituicao, lon, lat)
JOIN tipo_ponto_coleta t ON t.nome = v.tipo
JOIN instituicao i ON i.nome = v.instituicao
WHERE NOT EXISTS (SELECT 1 FROM ponto_coleta p WHERE p.nome = v.nome);

-- 7) Enderecos de usuario (5), dados ficticios / nao precisos
INSERT INTO endereco_usuario
(id_usuario, apelido, logradouro, bairro, cidade, estado, localizacao, principal)
SELECT u.id_usuario, 'Endereco DEMO', 'Rua ficticia - nao visitar',
       'Bairro ficticio', 'Rio Claro', 'SP',
       ST_SetSRID(ST_MakePoint(v.lon, v.lat), 4326)::geography, TRUE
FROM (VALUES
 ('ana.recycleflow@example.invalid', -47.561, -22.411),
 ('bruno.recycleflow@example.invalid', -47.571, -22.421),
 ('carla.recycleflow@example.invalid', -47.551, -22.416),
 ('diego.recycleflow@example.invalid', -47.566, -22.431),
 ('elisa.recycleflow@example.invalid', -47.546, -22.406)
) v(email, lon, lat)
JOIN usuario u ON u.email = v.email
WHERE NOT EXISTS (SELECT 1 FROM endereco_usuario e
                  WHERE e.id_usuario = u.id_usuario AND e.apelido = 'Endereco DEMO');

-- 8) Associacao ponto-material (5)
INSERT INTO ponto_material (id_ponto, id_material, observacoes)
SELECT p.id_ponto, m.id_material, 'Associacao ficticia para testes.'
FROM (VALUES
 ('[DEMO] Ponto Azul', '[DEMO] Caixa de papelao'),
 ('[DEMO] Ponto Circular', '[DEMO] Garrafa PET'),
 ('[DEMO] Ponto Comercio', '[DEMO] Pote de vidro'),
 ('[DEMO] Ponto Reverso', '[DEMO] Celular usado'),
 ('[DEMO] Ponto Reuso', '[DEMO] Lata de aluminio')
) v(ponto, material)
JOIN ponto_coleta p ON p.nome = v.ponto
JOIN material m ON m.nome = v.material
ON CONFLICT DO NOTHING;

-- 9) Horarios (5), apenas demonstracao; segunda-feira = 1
INSERT INTO horario_ponto (id_ponto, dia_semana, hora_abertura, hora_fechamento)
SELECT p.id_ponto, 1, v.abre::time, v.fecha::time
FROM (VALUES
 ('[DEMO] Ponto Azul', '08:00', '12:00'),
 ('[DEMO] Ponto Circular', '09:00', '17:00'),
 ('[DEMO] Ponto Comercio', '10:00', '18:00'),
 ('[DEMO] Ponto Reverso', '08:30', '16:30'),
 ('[DEMO] Ponto Reuso', '13:00', '17:00')
) v(ponto, abre, fecha)
JOIN ponto_coleta p ON p.nome = v.ponto
ON CONFLICT DO NOTHING;

-- 10) Favoritos (5), um por usuario
INSERT INTO ponto_favorito (id_usuario, id_ponto)
SELECT u.id_usuario, p.id_ponto
FROM (VALUES
 ('ana.recycleflow@example.invalid', '[DEMO] Ponto Azul'),
 ('bruno.recycleflow@example.invalid', '[DEMO] Ponto Circular'),
 ('carla.recycleflow@example.invalid', '[DEMO] Ponto Comercio'),
 ('diego.recycleflow@example.invalid', '[DEMO] Ponto Reverso'),
 ('elisa.recycleflow@example.invalid', '[DEMO] Ponto Reuso')
) v(email, ponto)
JOIN usuario u ON u.email = v.email
JOIN ponto_coleta p ON p.nome = v.ponto
ON CONFLICT DO NOTHING;

-- 11) Projetos/iniciativas (5), nunca publicados
INSERT INTO projeto_iniciativa
(id_instituicao, titulo, descricao, tipo, data_inicio, data_fim, publicado)
SELECT i.id_instituicao, v.titulo, 'PROJETO FICTICIO para testes da plataforma.',
       'campanha_demo', DATE '2026-10-01', DATE '2026-12-31', FALSE
FROM (VALUES
 ('[DEMO] Instituto Verde Azul', '[DEMO] Semana do Papelao'),
 ('[DEMO] Cooperativa Circular', '[DEMO] Circuito do Plastico'),
 ('[DEMO] Rede EcoComercio', '[DEMO] Vidro em Foco'),
 ('[DEMO] Associacao Novo Ciclo', '[DEMO] Eletronicos Conscientes'),
 ('[DEMO] Central Reuso', '[DEMO] Metal Circular')
) v(instituicao, titulo)
JOIN instituicao i ON i.nome = v.instituicao
WHERE NOT EXISTS (SELECT 1 FROM projeto_iniciativa pr WHERE pr.titulo = v.titulo);

-- 12) Conteudos (5), nunca publicados
INSERT INTO conteudo_educativo
(titulo, slug, resumo, corpo, tipo, publicado)
VALUES
('[DEMO] Guia de papel', 'demo-guia-papel', 'Resumo de exemplo.', '# Guia demonstrativo de papel\n\nConteudo ficticio. Nao utilizar como orientacao ambiental.', 'guia', FALSE),
('[DEMO] Guia de plastico', 'demo-guia-plastico', 'Resumo de exemplo.', '# Guia demonstrativo de plastico\n\nConteudo ficticio. Nao utilizar como orientacao ambiental.', 'guia', FALSE),
('[DEMO] Guia de vidro', 'demo-guia-vidro', 'Resumo de exemplo.', '# Guia demonstrativo de vidro\n\nConteudo ficticio. Nao utilizar como orientacao ambiental.', 'guia', FALSE),
('[DEMO] Guia de metal', 'demo-guia-metal', 'Resumo de exemplo.', '# Guia demonstrativo de metal\n\nConteudo ficticio. Nao utilizar como orientacao ambiental.', 'guia', FALSE),
('[DEMO] Guia de eletronicos', 'demo-guia-eletronicos', 'Resumo de exemplo.', '# Guia demonstrativo de eletronicos\n\nConteudo ficticio. Nao utilizar como orientacao ambiental.', 'guia', FALSE)
ON CONFLICT DO NOTHING;

-- 13) Material-conteudo (5)
INSERT INTO material_conteudo (id_material, id_conteudo)
SELECT m.id_material, c.id_conteudo
FROM (VALUES
 ('[DEMO] Caixa de papelao', 'demo-guia-papel'),
 ('[DEMO] Garrafa PET', 'demo-guia-plastico'),
 ('[DEMO] Pote de vidro', 'demo-guia-vidro'),
 ('[DEMO] Lata de aluminio', 'demo-guia-metal'),
 ('[DEMO] Celular usado', 'demo-guia-eletronicos')
) v(material, slug)
JOIN material m ON m.nome = v.material
JOIN conteudo_educativo c ON c.slug = v.slug
ON CONFLICT DO NOTHING;

COMMIT;

-- Resumo: deve exibir 5 em cada uma das 13 tabelas num banco inicialmente vazio.
SELECT 'usuario' AS tabela, count(*) AS registros FROM usuario
UNION ALL SELECT 'endereco_usuario', count(*) FROM endereco_usuario
UNION ALL SELECT 'ponto_favorito', count(*) FROM ponto_favorito
UNION ALL SELECT 'categoria_material', count(*) FROM categoria_material
UNION ALL SELECT 'material', count(*) FROM material
UNION ALL SELECT 'tipo_ponto_coleta', count(*) FROM tipo_ponto_coleta
UNION ALL SELECT 'ponto_coleta', count(*) FROM ponto_coleta
UNION ALL SELECT 'ponto_material', count(*) FROM ponto_material
UNION ALL SELECT 'horario_ponto', count(*) FROM horario_ponto
UNION ALL SELECT 'instituicao', count(*) FROM instituicao
UNION ALL SELECT 'projeto_iniciativa', count(*) FROM projeto_iniciativa
UNION ALL SELECT 'conteudo_educativo', count(*) FROM conteudo_educativo
UNION ALL SELECT 'material_conteudo', count(*) FROM material_conteudo
ORDER BY tabela;
