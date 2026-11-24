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
pip install -r assets/requirements.txt
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
