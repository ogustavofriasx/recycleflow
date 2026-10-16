from fastapi import FastAPI 
from routes.material_route import router as material_router
from routes.instituicao_route import router as instituicao_router
from routes.user_route import router as user_router
from routes.projetos_route import router as projetos_router
from routes.ponto_coleta_route import router as ponto_coleta_router
from routes.cont_educ_route import router as cont_educ_router

app = FastAPI(title="RecycleFlow API", version="1.0.0")

@app.get("/")
def home():
    return {"RecycleFlow API!"}

app.include_router(material_router)
app.include_router(instituicao_router)
app.include_router(projetos_router)
app.include_router(user_router)
app.include_router(ponto_coleta_router)
app.include_router(cont_educ_router)