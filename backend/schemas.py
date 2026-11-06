"""Formatos das respostas da API.

Servem para documentar o /docs (aba "Schemas") e garantir que cada rota
devolva só os campos listados aqui.
"""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field, model_validator


class Erro(BaseModel):
    detail: str = Field(examples=["Material não encontrado"])


# ---------------------------------------------------------------- Materiais
class Material(BaseModel):
    id_material: int
    nome: str = Field(examples=["Pilhas e baterias"])
    descricao: Optional[str] = Field(None, description="Por que descartar corretamente")
    reciclavel: Optional[bool] = None
    tipo_descarte: str = Field(examples=["especial", "coleta_seletiva"])
    instrucoes_preparo: Optional[str] = None
    cuidados: Optional[str] = Field(None, description="Onde/como descartar")
    palavras_chave: list[str] = Field(default_factory=list, examples=[["pilha", "bateria"]])
    id_categoria: int
    categoria: str = Field(examples=["Resíduos eletroeletrônicos"])
    categoria_icone: Optional[str] = None
    categoria_cor: Optional[str] = Field(None, examples=["#7C3AED"])


class PontoResumo(BaseModel):
    id_ponto: int
    nome: str
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    bairro: Optional[str] = None
    cidade: str
    tipo: str
    horario_descricao: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class MaterialDetalhe(Material):
    pontos: list[PontoResumo] = Field(description="Pontos de coleta ativos que aceitam o material")


# -------------------------------------------------------- Pontos de coleta
class Horario(BaseModel):
    dia_semana: int = Field(ge=0, le=6, description="0 = domingo ... 6 = sábado")
    abertura: str = Field(examples=["07:00"])
    fechamento: str = Field(examples=["18:00"])


class MaterialAceito(BaseModel):
    id_material: int
    nome: str


class PontoColeta(BaseModel):
    id_ponto: int
    nome: str = Field(examples=["Ecoponto Cervezão"])
    tipo: str = Field(examples=["Ecoponto"])
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    cidade: str
    estado: Optional[str] = None
    cep: Optional[str] = None
    latitude: Optional[float] = Field(None, examples=[-22.3860822])
    longitude: Optional[float] = Field(None, examples=[-47.5731666])
    telefone: Optional[str] = None
    site_url: Optional[str] = None
    horario_descricao: Optional[str] = None
    observacoes: Optional[str] = None
    fonte_url: Optional[str] = None
    verificado_em: Optional[datetime] = None
    distancia_m: Optional[float] = Field(
        None, examples=[850.4], description="Distância até lat/lng informados (só na listagem com localização)"
    )
    horarios: list[Horario] = Field(default_factory=list)
    materiais: list[MaterialAceito] = Field(default_factory=list)


# ------------------------------------------------------------ Instituições
class Instituicao(BaseModel):
    id_instituicao: int
    nome: str = Field(examples=["Prefeitura Municipal de Rio Claro"])
    tipo: Optional[str] = Field(None, examples=["Poder público", "Cooperativa", "ONG"])
    descricao: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    site_url: Optional[str] = None


# ------------------------------------------------------- Projetos/iniciativas
class Projeto(BaseModel):
    id_projeto: int
    titulo: str
    descricao: str
    tipo: Optional[str] = Field(None, examples=["campanha", "programa"])
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None
    fonte_url: Optional[str] = None
    id_instituicao: Optional[int] = None
    instituicao: Optional[str] = Field(None, description="Nome da instituição responsável")
    instituicao_tipo: Optional[str] = Field(None, examples=["Poder público", "Cooperativa", "ONG"])


# ------------------------------------------------------ Conteúdo educativo
class ConteudoResumo(BaseModel):
    id_conteudo: int
    titulo: str
    slug: str = Field(examples=["como-descartar-pilhas"])
    resumo: Optional[str] = None
    tipo: Optional[str] = None
    imagem_url: Optional[str] = None
    publicado_em: Optional[datetime] = None


class Conteudo(ConteudoResumo):
    corpo: str = Field(description="Texto completo (Markdown)")
    fonte_url: Optional[str] = None
    materiais: list[MaterialAceito] = Field(default_factory=list, description="Materiais relacionados")


# ---------------------------------------------------------- Área administrativa
class AdminLogin(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    senha: str = Field(min_length=1, max_length=200)


class AdminToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    usuario: dict


class AdminInstituicaoInput(BaseModel):
    nome: str = Field(min_length=1, max_length=200)
    tipo: Optional[str] = Field(None, max_length=60)
    cnpj: Optional[str] = Field(None, min_length=14, max_length=14)
    descricao: Optional[str] = None
    telefone: Optional[str] = Field(None, max_length=30)
    email: Optional[str] = Field(None, max_length=255)
    site_url: Optional[str] = None
    ativo: bool = True


class AdminMaterialInput(BaseModel):
    id_categoria: int = Field(gt=0)
    nome: str = Field(min_length=1, max_length=150)
    descricao: Optional[str] = None
    reciclavel: Optional[bool] = None
    tipo_descarte: str = Field(min_length=1, max_length=40)
    instrucoes_preparo: Optional[str] = None
    cuidados: Optional[str] = None
    fonte_url: Optional[str] = None
    verificado_em: Optional[datetime] = None
    palavras_chave: list[str] = Field(default_factory=list)
    ativo: bool = True


class AdminPontoInput(BaseModel):
    id_tipo: int = Field(gt=0)
    id_instituicao: Optional[int] = Field(None, gt=0)
    nome: str = Field(min_length=1, max_length=200)
    descricao: Optional[str] = None
    logradouro: Optional[str] = Field(None, max_length=200)
    numero: Optional[str] = Field(None, max_length=20)
    complemento: Optional[str] = Field(None, max_length=120)
    bairro: Optional[str] = Field(None, max_length=100)
    cidade: str = Field(min_length=1, max_length=100)
    estado: Optional[str] = Field(None, min_length=2, max_length=2)
    cep: Optional[str] = Field(None, min_length=8, max_length=8)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    telefone: Optional[str] = Field(None, max_length=30)
    email_contato: Optional[str] = Field(None, max_length=255)
    site_url: Optional[str] = None
    horario_descricao: Optional[str] = None
    observacoes: Optional[str] = None
    fonte_url: Optional[str] = None
    verificado_em: Optional[datetime] = None
    ativo: bool = True
    horarios: list[Horario] = Field(default_factory=list)
    materiais: list[int] = Field(default_factory=list)

    @model_validator(mode="after")
    def validar_coordenadas(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("latitude e longitude devem ser informadas juntas")
        return self


class AdminProjetoInput(BaseModel):
    titulo: str = Field(min_length=1, max_length=200)
    descricao: str = Field(min_length=1)
    tipo: Optional[str] = Field(None, max_length=50)
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None
    fonte_url: Optional[str] = None
    verificado_em: Optional[datetime] = None
    id_instituicao: Optional[int] = Field(None, gt=0)
    publicado: bool = False


class AdminConteudoInput(BaseModel):
    titulo: str = Field(min_length=1, max_length=200)
    slug: str = Field(min_length=1, max_length=220, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    resumo: Optional[str] = None
    corpo: str = Field(min_length=1)
    tipo: Optional[str] = Field(None, max_length=40)
    imagem_url: Optional[str] = None
    fonte_url: Optional[str] = None
    publicado: bool = False
    publicado_em: Optional[datetime] = None
    verificado_em: Optional[datetime] = None
    materiais: list[int] = Field(default_factory=list)
