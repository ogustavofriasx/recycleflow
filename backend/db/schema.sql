-- ============================================================================
-- RECYCLEFLOW | Schema inicial do PostgreSQL
-- Versao: 1.0 | 2026-10-13
-- Banco: PostgreSQL + PostGIS (local ou Neon)
-- Escopo: 13 tabelas; cadastro opcional; pontos, materiais e conteudos publicos.
-- Execute em um banco vazio, com permissao para CREATE EXTENSION postgis.
-- Nao execute automaticamente em bancos com dados existentes.
-- ============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS postgis;

-- Datas de atualizacao: DEFAULT NOW() sozinho nao atualiza em UPDATE.
CREATE OR REPLACE FUNCTION recycleflow_atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. USUARIOS E PREFERENCIAS
-- ============================================================================

CREATE TABLE usuario (
    id_usuario BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    senha TEXT NOT NULL,
    papel VARCHAR(20) NOT NULL DEFAULT 'usuario',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_usuario_nome CHECK (length(btrim(nome)) > 0),
    CONSTRAINT ck_usuario_email CHECK (length(btrim(email)) > 0 AND email = btrim(email)),
    CONSTRAINT ck_usuario_senha_hash CHECK (length(senha) > 0),
    CONSTRAINT ck_usuario_papel CHECK (papel IN ('usuario', 'admin'))
);

CREATE UNIQUE INDEX uq_usuario_email_normalizado ON usuario (lower(email));
CREATE TRIGGER trg_usuario_atualizado
BEFORE UPDATE ON usuario FOR EACH ROW EXECUTE FUNCTION recycleflow_atualizar_timestamp();

CREATE TABLE endereco_usuario (
    id_endereco BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario BIGINT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    apelido VARCHAR(60),
    logradouro VARCHAR(200),
    numero VARCHAR(20),
    complemento VARCHAR(120),
    bairro VARCHAR(100),
    cidade VARCHAR(100) NOT NULL,
    estado CHAR(2),
    cep CHAR(8),
    localizacao GEOGRAPHY(Point,4326),
    principal BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_endereco_cidade CHECK (length(btrim(cidade)) > 0),
    CONSTRAINT ck_endereco_estado CHECK (estado IS NULL OR estado ~ '^[A-Z]{2}$'),
    CONSTRAINT ck_endereco_cep CHECK (cep IS NULL OR cep ~ '^[0-9]{8}$')
);
CREATE INDEX idx_endereco_usuario_usuario ON endereco_usuario(id_usuario);
CREATE UNIQUE INDEX uq_endereco_principal_usuario
    ON endereco_usuario(id_usuario) WHERE principal = TRUE;

CREATE TABLE categoria_material (
    id_categoria BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    cor_hex CHAR(7),
    icone VARCHAR(80),
    CONSTRAINT ck_categoria_nome CHECK (length(btrim(nome)) > 0),
    CONSTRAINT ck_categoria_cor CHECK (cor_hex IS NULL OR cor_hex ~ '^#[0-9A-Fa-f]{6}$')
);
CREATE UNIQUE INDEX uq_categoria_material_nome ON categoria_material(lower(nome));

CREATE TABLE material (
    id_material BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_categoria BIGINT NOT NULL REFERENCES categoria_material(id_categoria) ON DELETE RESTRICT,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    reciclavel BOOLEAN,
    -- Tipo PRINCIPAL de descarte; multiplos tipos exigirao tabela associativa futura.
    tipo_descarte VARCHAR(40) NOT NULL,
    instrucoes_preparo TEXT,
    cuidados TEXT,
    fonte_url TEXT,
    verificado_em TIMESTAMPTZ,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_material_nome CHECK (length(btrim(nome)) > 0),
    CONSTRAINT ck_material_descarte CHECK (length(btrim(tipo_descarte)) > 0)
);
CREATE UNIQUE INDEX uq_material_nome ON material(lower(nome));
CREATE INDEX idx_material_categoria ON material(id_categoria);
CREATE TRIGGER trg_material_atualizado
BEFORE UPDATE ON material FOR EACH ROW EXECUTE FUNCTION recycleflow_atualizar_timestamp();

-- ============================================================================
-- 2. INSTITUICOES E TIPOS DE PONTO (antes de ponto_coleta: FKs)
-- ============================================================================

CREATE TABLE instituicao (
    id_instituicao BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    tipo VARCHAR(60),
    cnpj CHAR(14) UNIQUE,
    descricao TEXT,
    telefone VARCHAR(30),
    email VARCHAR(255),
    site_url TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_instituicao_nome CHECK (length(btrim(nome)) > 0),
    CONSTRAINT ck_instituicao_cnpj CHECK (cnpj IS NULL OR cnpj ~ '^[0-9]{14}$')
);
CREATE TRIGGER trg_instituicao_atualizado
BEFORE UPDATE ON instituicao FOR EACH ROW EXECUTE FUNCTION recycleflow_atualizar_timestamp();

CREATE TABLE tipo_ponto_coleta (
    id_tipo BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    CONSTRAINT ck_tipo_ponto_nome CHECK (length(btrim(nome)) > 0)
);
CREATE UNIQUE INDEX uq_tipo_ponto_nome ON tipo_ponto_coleta(lower(nome));

-- ============================================================================
-- 3. PONTOS, MATERIAIS ACEITOS, HORARIOS E FAVORITOS
-- ============================================================================

CREATE TABLE ponto_coleta (
    id_ponto BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_tipo BIGINT NOT NULL REFERENCES tipo_ponto_coleta(id_tipo) ON DELETE RESTRICT,
    -- Uma instituicao RESPONSAVEL principal (pode ser desconhecida).
    id_instituicao BIGINT REFERENCES instituicao(id_instituicao) ON DELETE SET NULL,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    logradouro VARCHAR(200),
    numero VARCHAR(20),
    complemento VARCHAR(120),
    bairro VARCHAR(100),
    cidade VARCHAR(100) NOT NULL,
    estado CHAR(2),
    cep CHAR(8),
    localizacao GEOGRAPHY(Point,4326),
    telefone VARCHAR(30),
    email_contato VARCHAR(255),
    site_url TEXT,
    -- Apenas observacoes livres; horarios regulares ficam em horario_ponto.
    horario_descricao TEXT,
    observacoes TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    fonte_url TEXT,
    verificado_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_ponto_nome CHECK (length(btrim(nome)) > 0),
    CONSTRAINT ck_ponto_cidade CHECK (length(btrim(cidade)) > 0),
    CONSTRAINT ck_ponto_estado CHECK (estado IS NULL OR estado ~ '^[A-Z]{2}$'),
    CONSTRAINT ck_ponto_cep CHECK (cep IS NULL OR cep ~ '^[0-9]{8}$')
);
CREATE INDEX idx_ponto_tipo ON ponto_coleta(id_tipo);
CREATE INDEX idx_ponto_instituicao ON ponto_coleta(id_instituicao);
CREATE INDEX idx_ponto_localizacao ON ponto_coleta USING GIST(localizacao);
CREATE TRIGGER trg_ponto_atualizado
BEFORE UPDATE ON ponto_coleta FOR EACH ROW EXECUTE FUNCTION recycleflow_atualizar_timestamp();

CREATE TABLE ponto_material (
    id_ponto BIGINT NOT NULL REFERENCES ponto_coleta(id_ponto) ON DELETE CASCADE,
    id_material BIGINT NOT NULL REFERENCES material(id_material) ON DELETE RESTRICT,
    observacoes TEXT,
    verificado_em TIMESTAMPTZ,
    PRIMARY KEY (id_ponto, id_material)
);
CREATE INDEX idx_ponto_material_material ON ponto_material(id_material);

CREATE TABLE horario_ponto (
    id_horario BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_ponto BIGINT NOT NULL REFERENCES ponto_coleta(id_ponto) ON DELETE CASCADE,
    -- PostgreSQL EXTRACT(DOW): 0 domingo ... 6 sabado.
    dia_semana SMALLINT NOT NULL,
    hora_abertura TIME NOT NULL,
    hora_fechamento TIME NOT NULL,
    CONSTRAINT ck_horario_dia CHECK (dia_semana BETWEEN 0 AND 6),
    CONSTRAINT ck_horario_intervalo CHECK (hora_abertura < hora_fechamento),
    CONSTRAINT uq_horario_intervalo UNIQUE
      (id_ponto, dia_semana, hora_abertura, hora_fechamento)
);
CREATE INDEX idx_horario_ponto_dia ON horario_ponto(id_ponto, dia_semana);
-- NOTA: intervalos sobrepostos ainda exigem validacao adicional.
-- Horarios que atravessam a meia-noite devem ser divididos em dois dias.

CREATE TABLE ponto_favorito (
    id_usuario BIGINT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_ponto BIGINT NOT NULL REFERENCES ponto_coleta(id_ponto) ON DELETE CASCADE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id_usuario, id_ponto)
);
CREATE INDEX idx_ponto_favorito_ponto ON ponto_favorito(id_ponto);

-- ============================================================================
-- 4. PROJETOS E CONTEUDO EDUCATIVO
-- ============================================================================

CREATE TABLE projeto_iniciativa (
    id_projeto BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_instituicao BIGINT REFERENCES instituicao(id_instituicao) ON DELETE SET NULL,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT NOT NULL,
    tipo VARCHAR(50),
    data_inicio DATE,
    data_fim DATE,
    fonte_url TEXT,
    verificado_em TIMESTAMPTZ,
    publicado BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_projeto_titulo CHECK (length(btrim(titulo)) > 0),
    CONSTRAINT ck_projeto_datas CHECK
      (data_inicio IS NULL OR data_fim IS NULL OR data_fim >= data_inicio)
);
CREATE INDEX idx_projeto_instituicao ON projeto_iniciativa(id_instituicao);
CREATE TRIGGER trg_projeto_atualizado
BEFORE UPDATE ON projeto_iniciativa FOR EACH ROW EXECUTE FUNCTION recycleflow_atualizar_timestamp();

CREATE TABLE conteudo_educativo (
    id_conteudo BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL,
    resumo TEXT,
    corpo TEXT NOT NULL,
    tipo VARCHAR(40),
    imagem_url TEXT,
    fonte_url TEXT,
    publicado BOOLEAN NOT NULL DEFAULT FALSE,
    publicado_em TIMESTAMPTZ,
    verificado_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_conteudo_titulo CHECK (length(btrim(titulo)) > 0),
    CONSTRAINT ck_conteudo_slug CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    CONSTRAINT ck_conteudo_corpo CHECK (length(btrim(corpo)) > 0)
);
CREATE UNIQUE INDEX uq_conteudo_slug ON conteudo_educativo(slug);
CREATE TRIGGER trg_conteudo_atualizado
BEFORE UPDATE ON conteudo_educativo FOR EACH ROW EXECUTE FUNCTION recycleflow_atualizar_timestamp();

CREATE TABLE material_conteudo (
    id_material BIGINT NOT NULL REFERENCES material(id_material) ON DELETE CASCADE,
    id_conteudo BIGINT NOT NULL REFERENCES conteudo_educativo(id_conteudo) ON DELETE CASCADE,
    PRIMARY KEY (id_material, id_conteudo)
);
CREATE INDEX idx_material_conteudo_conteudo ON material_conteudo(id_conteudo);

COMMIT;

-- Notas operacionais:
-- 1. Nunca exponha a string de conexao PostgreSQL no frontend React.
-- 2. Apenas FastAPI deve acessar tabelas privadas (usuario, endereco_usuario etc.).
-- 3. Autorizacao por papel ('admin') deve ser validada no backend.
-- 4. O banco nao valida CNPJ/CEP reais nem URLs validas: validar na API.
-- 5. PostgreSQL/Neon requerem extensao PostGIS disponivel e habilitada.
-- 6. Gerencie alteracoes subsequentes com migracoes Alembic.
