from fastapi import FastAPI
from routes.material_route import router as material_router
from routes.instituicao_route import router as instituicao_router
from routes.user_route import router as user_router
from routes.projetos_route import router as projetos_router
from routes.ponto_coleta_route import router as ponto_coleta_router
from routes.cont_educ_route import router as cont_educ_router
from routes.admin_route import router as admin_router

DESCRICAO = """
API do **RecycleFlow**, plataforma de apoio à reciclagem urbana em Rio Claro (SP).

As rotas públicas são de consulta (GET) e devolvem JSON. A área administrativa oferece
operações de escrita protegidas por autenticação e pelo papel `admin`.

* **Materiais**: busca de materiais e orientações de descarte.
* **Pontos de Coleta**: ecopontos e cooperativas, com coordenadas, horários e filtros.
* **Projetos e Iniciativas**: programas, campanhas e ações locais publicadas.
* **Instituições**: responsáveis pelos pontos e projetos.
* **Conteúdos Educacionais**: guias e textos publicados.
* **Administração**: gerenciamento autenticado de instituições, pontos, materiais,
  projetos e conteúdos educacionais.

Registros de teste do seed (nome começando com `[DEMO]`) ficam ocultos;
algumas rotas aceitam `incluir_demo=true` para exibi-los.
"""

TAGS = [
    {"name": "Materiais", "description": "Busca por nome/palavra-chave (sem acento) e detalhe com os pontos que aceitam o material."},
    {"name": "Pontos de Coleta", "description": "Ecopontos e cooperativas. Filtros por material, bairro e tipo."},
    {"name": "Projetos e Iniciativas", "description": "Somente projetos publicados."},
    {"name": "Instituições", "description": "Prefeitura, cooperativas, ONGs e empresas."},
    {"name": "Conteúdos Educacionais", "description": "Somente conteúdos publicados."},
    {"name": "Usuários", "description": "Listagem de usuários disponível apenas para administradores."},
    {"name": "Status", "description": "Informações da API."},
    {"name": "Administração", "description": "Gerenciamento autenticado da plataforma."},
]

app = FastAPI(
    title="RecycleFlow API",
    version="1.0.0",
    description=DESCRICAO,
    openapi_tags=TAGS,
)


@app.get("/", tags=["Status"], summary="Informações da API")
def home():
    return {"api": "RecycleFlow API", "versao": app.version, "documentacao": "/docs"}


app.include_router(material_router)
app.include_router(ponto_coleta_router)
app.include_router(projetos_router)
app.include_router(instituicao_router)
app.include_router(cont_educ_router)
app.include_router(user_router)
app.include_router(admin_router)
