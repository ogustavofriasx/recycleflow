<div align="center">
  <img src="assets/recycleflow-logo.png" alt="Logo do RecycleFlow" width="280" />

  **Sistema de apoio à Reciclagem Urbana**

  Rio Claro (SP) e região

  **[Acessar a plataforma](https://recycleflow-rc.vercel.app)** · [Documentação da API](https://recycleflow-api.onrender.com/docs)
</div>

> A API roda no plano gratuito do Render e "dorme" depois de alguns minutos sem uso: o primeiro
> acesso pode levar até um minuto para carregar os dados.

O **RecycleFlow** é uma plataforma web que reúne, em um só lugar, as informações de que uma
pessoa precisa para descartar um resíduo do jeito certo: se o material é reciclável, como
prepará-lo antes do descarte e onde entregá-lo em Rio Claro e região.

## Por que o projeto existe

A ideia surgiu de uma dificuldade real do grupo ao tentar descartar um material que não podia ir
para o lixo comum. As orientações sobre reciclagem, os endereços e horários dos ecopontos e o que
cada local aceita estavam espalhados entre páginas da prefeitura, notícias e documentos. Rio Claro
já tem coleta seletiva, ecopontos, cooperativas e pontos de logística reversa, mas encontrar a
informação certa na hora de descartar ainda dá trabalho.

O RecycleFlow não substitui esses serviços: ele organiza as informações e aproxima os serviços da
população.

## O que a plataforma oferece

- **Busca de materiais:** o usuário pesquisa um resíduo (pilha, óleo de cozinha, vidro,
  medicamento...) e vê se ele é reciclável, como prepará-lo, por que descartá-lo corretamente e
  quais pontos de coleta o recebem. A busca ignora acentos e entende sinônimos, como "bateria"
  para "Pilhas e baterias".
- **Mapa de pontos de coleta:** ecopontos, cooperativas e pontos de logística reversa em um mapa
  interativo, com filtros por material, bairro e tipo de ponto. Com a localização do usuário, ou
  com um local escolhido no mapa, os pontos aparecem do mais próximo ao mais distante. Cada ponto
  mostra endereço, horários, materiais aceitos, telefone e um atalho para traçar a rota.
- **Projetos e iniciativas:** campanhas, programas públicos e ações de cooperativas, ONGs e
  empresas da região, cada um com o responsável, o período e o link para a fonte oficial.
- **Conteúdos educativos:** artigos, dicas e curiosidades sobre reciclagem e descarte correto.
- **Jogo da separação:** um jogo em que o jogador arrasta cada material até a lixeira certa, nas
  cores da coleta seletiva, ou até o ecoponto, recebendo uma dica de descarte a cada jogada.
- **Painel administrativo:** área restrita em que a equipe mantém atualizados os pontos de coleta,
  materiais, projetos e conteúdos, sem precisar mexer no código.

Sempre que possível, as informações exibidas trazem a fonte e a data da última verificação.

## Objetivos de Desenvolvimento Sustentável

O projeto se relaciona a três Objetivos de Desenvolvimento Sustentável da ONU:

- **ODS 9 – Indústria, inovação e infraestrutura:** usa a tecnologia para integrar informações
  sobre pontos de coleta, cooperativas e estabelecimentos que recebem materiais recicláveis.
- **ODS 11 – Cidades e comunidades sustentáveis:** torna a gestão de resíduos mais acessível e
  organizada no espaço urbano.
- **ODS 12 – Consumo e produção responsáveis:** incentiva a reciclagem, o descarte adequado e a
  conscientização sobre o consumo.

## Tecnologias

| Camada | Tecnologias |
|---|---|
| Frontend | React, Vite, React Router, Leaflet com mapas do OpenStreetMap |
| Backend | Python, FastAPI, Pydantic, SQLAlchemy |
| Banco de dados | PostgreSQL com PostGIS (consultas de distância), hospedado no Neon |
| Publicação | Vercel (frontend) e Render (API) |

## Contexto acadêmico

Projeto desenvolvido nas disciplinas Projetos em Computação I e II do curso de Bacharelado em
Ciências da Computação da **Unesp – Câmpus de Rio Claro** (Instituto de Geociências e Ciências
Exatas, Departamento de Estatística, Matemática Aplicada e Computação), em 2026.

**Equipe:** Arnaldo Martins de Godoy, Gustavo Gomes da Cruz, Gustavo Varjão de Frias e
Marcus Vinicius de Oliveira Silva.

**Orientador:** Prof. Leonardo Tortoro Pereira.

## Licença

O código do RecycleFlow está sob a [licença MIT](LICENSE).

A fonte [Poppins](https://github.com/itfoundry/Poppins), incluída em
`frontend/public/assets/fonts/`, é distribuída sob a SIL Open Font License 1.1; o texto
da licença acompanha os arquivos da fonte em
[`frontend/public/assets/fonts/OFL.txt`](frontend/public/assets/fonts/OFL.txt).
