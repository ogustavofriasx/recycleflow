<div align="center">
  <img src="assets/recycleflow-logo.png" alt="Logo do RecycleFlow" width="280" />

  Sistema de apoio à Reciclagem Urbana
</div>


O RecycleFlow é uma plataforma em desenvolvimento para centralizar informações sobre reciclagem e descarte correto de resíduos em Rio Claro (SP) e região. Seu objetivo é ajudar as pessoas a identificar como preparar materiais para o descarte e onde encontrar pontos de coleta adequados.

Status:
Projeto acadêmico em fase final: busca de materiais, mapa de pontos de coleta com pontos próximos,
projetos e iniciativas, conteúdos educativos, jogo de separação e painel administrativo implementados.

## Como rodar o projeto

O projeto tem duas partes que rodam ao mesmo tempo, cada uma em um terminal: o backend (FastAPI,
servido pelo uvicorn na porta 8000) e o frontend (React com Vite). Os comandos abaixo partem da
raiz do repositório e usam o PowerShell no Windows.

Pré-requisitos: Python 3 e Node.js (com npm) instalados.

### 1. Variáveis de ambiente

Crie um arquivo `.env` na raiz do repositório (ele não é versionado) com:

```env
URL=<string de conexão do banco Neon>
ADMIN_TOKEN_SECRET=<segredo com pelo menos 32 caracteres>
```

O backend carrega esse arquivo automaticamente. Veja a seção [Área administrativa](#área-administrativa)
para gerar o `ADMIN_TOKEN_SECRET`.

### 2. Backend

Na primeira vez, crie o ambiente virtual e instale as dependências:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
```

Nas próximas vezes, basta ativar o ambiente virtual e subir a API:

```powershell
.\venv\Scripts\Activate.ps1
cd backend
uvicorn main:app --reload
```

A API fica em `http://localhost:8000` e a documentação interativa em `http://localhost:8000/docs`.

> Se o PowerShell bloquear a ativação do ambiente, rode uma vez
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. No Linux/macOS, ative com
> `source venv/bin/activate`.

### 3. Frontend

Em outro terminal:

```powershell
cd frontend
npm install   # só na primeira vez ou quando as dependências mudarem
npm run dev
```

Abra o endereço mostrado pelo Vite (normalmente `http://localhost:5173`). Em desenvolvimento, as
chamadas para `/api` são redirecionadas pelo Vite para o backend em `localhost:8000`, então o
backend precisa estar rodando para as páginas carregarem os dados.

## Deploy

A publicação usa três serviços, todos com plano gratuito:

| Parte | Serviço | Configuração |
|---|---|---|
| Frontend (React) | Vercel | `frontend/vercel.json` |
| API (FastAPI) | Render | `render.yaml` |
| Banco (PostgreSQL + PostGIS) | Neon | já em uso |

O frontend continua chamando `/api/...`, como em desenvolvimento. No Vercel, a regra de
`frontend/vercel.json` repassa essas chamadas para a API no Render, então o navegador vê um
único endereço e não é preciso configurar CORS. A segunda regra devolve o `index.html` para
qualquer outra rota, para que links diretos como `/mapa` ou `/admin` funcionem.

Os dois serviços publicam sozinhos a cada push na branch `main`.

### API no Render

1. Em [render.com](https://render.com), entre com o GitHub e escolha **New → Blueprint**.
2. Selecione este repositório. O Render lê o `render.yaml` e cria o serviço `recycleflow-api`.
3. Quando pedir a variável `URL`, cole a string de conexão do Neon (use a versão *pooled*).
   O `ADMIN_TOKEN_SECRET` é gerado automaticamente.
4. Ao terminar, confira `https://<seu-servico>.onrender.com/docs`.

No plano gratuito, a API "dorme" após cerca de 15 minutos sem acesso e o primeiro acesso
seguinte demora de 30 a 50 segundos. Antes de uma apresentação, abra o site alguns minutos antes.

### Frontend no Vercel

1. Em [vercel.com](https://vercel.com), entre com o GitHub e escolha **Add New → Project**.
2. Selecione este repositório e, em **Root Directory**, escolha `frontend`.
   O restante (Vite, `npm run build`, pasta `dist`) vem do `vercel.json`.
3. Se o endereço do Render não for exatamente `https://recycleflow-api.onrender.com`, ajuste o
   destino da regra `/api/(.*)` em `frontend/vercel.json` e faça push.

O Vercel cria uma prévia para cada pull request. As prévias usam a mesma API e o mesmo banco
de produção: cuidado ao testar o painel administrativo nelas.

## Jogo de separação

O jogo fica em `/jogo` e ensina, de forma lúdica, para onde vai cada tipo de resíduo. O jogador
arrasta um material de cada vez até o destino correto:

| Destino | Material |
|---|---|
| Lixeira azul | Papel |
| Lixeira vermelha | Plástico |
| Lixeira verde | Vidro |
| Lixeira amarela | Metal |
| Lixeira marrom | Orgânico |
| Ecoponto | Resíduos que não vão para a coleta seletiva comum (ex.: bitucas de cigarro) |

Cada acerto aumenta sua sequência e, certo ou errado, o jogo mostra uma dica de descarte sobre o material.
Caso o jogador erre, a sequência vai à 0, porém o jogo continua.
Quando o destino correto é o Ecoponto, aparece um atalho para o mapa de pontos de coleta. Ao final,
o jogador vê a pontuação e pode jogar de novo ou ir direto ao mapa.

O jogo funciona só no frontend, sem chamadas à API. Os materiais, destinos e dicas ficam em
`frontend/src/data/game.js` e as imagens em `frontend/public/assets/game/`; para incluir um novo
material, basta acrescentar um item à lista `MATERIAIS` com a imagem correspondente.

O acesso é feito pelo card do jogo na Home, pelas chamadas nas páginas de Materiais e Conteúdos
(componente `GameBanner`) e pelo link "Jogo da separação" no rodapé.

## Área administrativa

O painel fica em `/admin`. As operações de criação, edição e remoção são protegidas no backend:
instituições, pontos de coleta e materiais são desativados logicamente; projetos e conteúdos
educativos podem ser excluídos. Projetos e artigos/dicas só aparecem nas rotas públicas quando
marcados como publicados.

Configure `ADMIN_TOKEN_SECRET` no ambiente do backend com pelo menos 32 caracteres aleatórios.
Por exemplo, gere um valor com `python -c "import secrets; print(secrets.token_urlsafe(48))"`.
Não reutilize nem publique esse segredo.

Não há cadastro público de administradores. Para criar a primeira conta, configure a variável
`URL` do banco Neon como já é feito para a API e execute no diretório `backend`:

```powershell
python -m scripts.create_admin
```

O comando solicita nome, e-mail e senha de forma interativa e grava apenas o hash Argon2id da senha.
Cada requisição administrativa verifica novamente se a conta continua ativa e com papel `admin`,
de modo que o acesso possa ser revogado alterando `usuario.papel` ou `usuario.ativo` no banco.

Os endpoints de administração ficam sob `/admin`. Os registros públicos existentes usam as tabelas
do schema atual; aplique `backend/db/schema.sql` e as migrações já existentes antes de ativar o
painel em um banco ainda não preparado.
