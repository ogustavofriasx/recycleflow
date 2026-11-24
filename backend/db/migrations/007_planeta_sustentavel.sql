-- RecycleFlow: Planeta Sustentavel nas abas Projetos e Conteudos.
-- Executar em um banco que ja tenha o schema do RecycleFlow.
-- Compativel com o SQL Editor do Neon e com psql.
-- Reexecucoes preservam os registros existentes e as edicoes feitas no admin.
BEGIN;

-- Serializa duas execucoes simultaneas desta mesma migracao.
SELECT pg_advisory_xact_lock(20261124, 5);

INSERT INTO instituicao (nome, tipo, descricao, site_url, ativo)
SELECT 'Instituto Coelho', 'Instituto',
       'Instituição responsável pela página oficial do jogo Planeta Sustentável.',
       'https://institutocoelho.org.br/', TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM instituicao WHERE lower(btrim(nome)) = 'instituto coelho'
);

INSERT INTO projeto_iniciativa
    (id_instituicao, titulo, descricao, tipo, fonte_url, verificado_em, publicado)
SELECT i.id_instituicao, 'Planeta Sustentável',
       'Jogo educativo do Instituto Coelho que convida crianças a aprender sobre a separação de resíduos e o descarte correto, incentivando hábitos sustentáveis desde cedo.',
       'jogo', 'https://institutocoelho.org.br/planetasustentavel/', NOW(), TRUE
FROM instituicao i
WHERE lower(btrim(i.nome)) = 'instituto coelho'
  AND NOT EXISTS (
      SELECT 1 FROM projeto_iniciativa p
      WHERE rtrim(p.fonte_url, '/') = 'https://institutocoelho.org.br/planetasustentavel'
         OR (lower(btrim(p.titulo)) = lower('Planeta Sustentável')
             AND p.id_instituicao = i.id_instituicao)
  )
ORDER BY i.id_instituicao
LIMIT 1;

INSERT INTO conteudo_educativo
    (titulo, slug, resumo, corpo, tipo, fonte_url, publicado, publicado_em, verificado_em)
VALUES (
    'Planeta Sustentável',
    'planeta-sustentavel',
    'Aprender brincando: um jogo para conscientizar crianças sobre o descarte correto dos resíduos e incentivar práticas sustentáveis desde cedo. Créditos: Instituto Coelho.',
    $conteudo$## Aprender brincando

O Planeta Sustentável propõe desafios para aproximar as crianças de temas como separação de resíduos, reciclagem e cuidado com o meio ambiente. A proposta é estimular escolhas mais conscientes no dia a dia.

## Como acessar

Clique em Acessar jogo para abrir a página oficial do Instituto Coelho. Lá, escolha Jogar no Computador ou Jogar no Celular, conforme o aparelho que estiver usando.

## Uma ideia para aprender juntos

Depois de jogar, converse com as crianças sobre os resíduos produzidos em casa ou na escola e como separar cada material. Use também a busca de materiais do RecycleFlow para consultar orientações de descarte.

## Créditos

Instituto Coelho. O jogo é disponibilizado em uma página externa e integra o RecycleFlow como indicação de conteúdo educativo.$conteudo$,
    'jogo',
    'https://institutocoelho.org.br/planetasustentavel/',
    TRUE, NOW(), NOW()
)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
