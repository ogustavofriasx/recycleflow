from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from db.database import get_db
from schemas import (
    AdminConteudoInput,
    AdminInstituicaoInput,
    AdminLogin,
    AdminMaterialInput,
    AdminPontoInput,
    AdminProjetoInput,
    AdminToken,
    TIPOS_DESCARTE,
)
from security import TOKEN_LIFETIME_SECONDS, create_access_token, require_admin, verify_password

router = APIRouter(prefix="/admin", tags=["Administração"])


def erro_banco(erro: SQLAlchemyError):
    print(f"Erro na operação administrativa: {type(erro).__name__}")
    raise HTTPException(status_code=500, detail="Não foi possível concluir a operação")


def erro_integridade(erro: IntegrityError):
    print(f"Conflito de integridade na operação administrativa: {type(erro).__name__}")
    raise HTTPException(
        status_code=409,
        detail="O registro conflita com dados existentes ou ainda está sendo utilizado",
    )


@router.post("/login", response_model=AdminToken, summary="Iniciar sessão administrativa")
def login_admin(payload: AdminLogin, db: Session = Depends(get_db)):
    try:
        user = db.execute(
            text("""
                SELECT id_usuario, nome, email, senha, papel
                FROM usuario
                WHERE lower(email) = lower(:email) AND ativo = TRUE
            """),
            {"email": payload.email.strip()},
        ).mappings().first()
    except SQLAlchemyError as erro:
        erro_banco(erro)

    if user is None or user["papel"] != "admin" or not verify_password(payload.senha, user["senha"]):
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos")

    token = create_access_token(user["id_usuario"])
    return {
        "access_token": token,
        "expires_in": TOKEN_LIFETIME_SECONDS,
        "usuario": {"id_usuario": user["id_usuario"], "nome": user["nome"], "email": user["email"]},
    }


@router.get("/sessao", summary="Validar sessão administrativa")
def sessao_admin(admin: dict = Depends(require_admin)):
    return admin


@router.get("/opcoes", summary="Listar categorias e tipos para os formulários")
def opcoes_admin(_: dict = Depends(require_admin), db: Session = Depends(get_db)):
    try:
        categorias = db.execute(
            text("SELECT id_categoria, nome FROM categoria_material ORDER BY nome")
        ).mappings().all()
        tipos = db.execute(text("SELECT id_tipo, nome FROM tipo_ponto_coleta ORDER BY nome")).mappings().all()
        return {
            "categorias": [dict(row) for row in categorias],
            "tipos_ponto": [dict(row) for row in tipos],
            "tipos_descarte": TIPOS_DESCARTE,
        }
    except SQLAlchemyError as erro:
        erro_banco(erro)


# ---------------------------------------------------------------- Instituições
@router.get("/instituicoes", summary="Listar instituições para administração")
def admin_listar_instituicoes(_: dict = Depends(require_admin), db: Session = Depends(get_db)):
    try:
        return [
            dict(row)
            for row in db.execute(
                text("""
                    SELECT id_instituicao, nome, tipo, cnpj, descricao, telefone, email, site_url, ativo
                    FROM instituicao ORDER BY nome
                """)
            ).mappings()
        ]
    except SQLAlchemyError as erro:
        erro_banco(erro)


@router.post("/instituicoes", status_code=status.HTTP_201_CREATED)
def admin_criar_instituicao(
    payload: AdminInstituicaoInput, _: dict = Depends(require_admin), db: Session = Depends(get_db)
):
    try:
        row = db.execute(
            text("""
                INSERT INTO instituicao (nome, tipo, cnpj, descricao, telefone, email, site_url, ativo)
                VALUES (:nome, :tipo, :cnpj, :descricao, :telefone, :email, :site_url, :ativo)
                RETURNING id_instituicao
            """),
            payload.model_dump(),
        ).mappings().one()
        db.commit()
        return {"id_instituicao": row["id_instituicao"]}
    except IntegrityError as erro:
        db.rollback()
        erro_integridade(erro)
    except SQLAlchemyError as erro:
        db.rollback()
        erro_banco(erro)


@router.put("/instituicoes/{id_instituicao}")
def admin_atualizar_instituicao(
    id_instituicao: int,
    payload: AdminInstituicaoInput,
    _: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    try:
        result = db.execute(
            text("""
                UPDATE instituicao SET nome=:nome, tipo=:tipo, cnpj=:cnpj, descricao=:descricao,
                    telefone=:telefone, email=:email, site_url=:site_url, ativo=:ativo
                WHERE id_instituicao=:id RETURNING id_instituicao
            """),
            {**payload.model_dump(), "id": id_instituicao},
        ).mappings().first()
        if result is None:
            raise HTTPException(status_code=404, detail="Instituição não encontrada")
        db.commit()
        return {"id_instituicao": result["id_instituicao"]}
    except IntegrityError as erro:
        db.rollback()
        erro_integridade(erro)
    except SQLAlchemyError as erro:
        db.rollback()
        erro_banco(erro)


@router.delete("/instituicoes/{id_instituicao}", status_code=status.HTTP_204_NO_CONTENT)
def admin_desativar_instituicao(
    id_instituicao: int,
    permanente: bool = Query(False, description="Exclui de vez; pontos e projetos ficam sem instituição"),
    _: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    # ponto_coleta e projeto_iniciativa usam ON DELETE SET NULL: continuam existindo, sem instituição.
    sql = (
        "DELETE FROM instituicao WHERE id_instituicao=:id RETURNING id_instituicao"
        if permanente
        else "UPDATE instituicao SET ativo=FALSE WHERE id_instituicao=:id RETURNING id_instituicao"
    )
    try:
        result = db.execute(text(sql), {"id": id_instituicao}).first()
        if result is None:
            db.rollback()
            raise HTTPException(status_code=404, detail="Instituição não encontrada")
        db.commit()
    except IntegrityError as erro:
        db.rollback()
        erro_integridade(erro)
    except SQLAlchemyError as erro:
        db.rollback()
        erro_banco(erro)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --------------------------------------------------------------------- Materiais
MATERIAL_SELECT = """
    SELECT m.id_material, m.id_categoria, m.nome, m.descricao, m.reciclavel, m.tipo_descarte,
           m.instrucoes_preparo, m.cuidados, m.fonte_url, m.verificado_em, m.ativo,
           m.palavras_chave, m.destaque, c.nome AS categoria
    FROM material m JOIN categoria_material c ON c.id_categoria=m.id_categoria
"""


@router.get("/materiais", summary="Listar materiais para administração")
def admin_listar_materiais(_: dict = Depends(require_admin), db: Session = Depends(get_db)):
    try:
        return [dict(row) for row in db.execute(text(MATERIAL_SELECT + " ORDER BY m.nome")).mappings()]
    except SQLAlchemyError as erro:
        erro_banco(erro)


@router.post("/materiais", status_code=status.HTTP_201_CREATED)
def admin_criar_material(
    payload: AdminMaterialInput, _: dict = Depends(require_admin), db: Session = Depends(get_db)
):
    try:
        row = db.execute(
            text("""
                INSERT INTO material
                    (id_categoria, nome, descricao, reciclavel, tipo_descarte, instrucoes_preparo,
                     cuidados, fonte_url, verificado_em, palavras_chave, destaque, ativo)
                VALUES
                    (:id_categoria, :nome, :descricao, :reciclavel, :tipo_descarte, :instrucoes_preparo,
                     :cuidados, :fonte_url, :verificado_em, :palavras_chave, :destaque, :ativo)
                RETURNING id_material
            """),
            payload.model_dump(),
        ).mappings().one()
        db.commit()
        return {"id_material": row["id_material"]}
    except IntegrityError as erro:
        db.rollback()
        erro_integridade(erro)
    except SQLAlchemyError as erro:
        db.rollback()
        erro_banco(erro)


@router.put("/materiais/{id_material}")
def admin_atualizar_material(
    id_material: int, payload: AdminMaterialInput, _: dict = Depends(require_admin), db: Session = Depends(get_db)
):
    try:
        row = db.execute(
            text("""
                UPDATE material SET id_categoria=:id_categoria, nome=:nome, descricao=:descricao,
                    reciclavel=:reciclavel, tipo_descarte=:tipo_descarte,
                    instrucoes_preparo=:instrucoes_preparo, cuidados=:cuidados, fonte_url=:fonte_url,
                    verificado_em=:verificado_em, palavras_chave=:palavras_chave, destaque=:destaque,
                    ativo=:ativo
                WHERE id_material=:id RETURNING id_material
            """),
            {**payload.model_dump(), "id": id_material},
        ).mappings().first()
        if row is None:
            raise HTTPException(status_code=404, detail="Material não encontrado")
        db.commit()
        return {"id_material": row["id_material"]}
    except IntegrityError as erro:
        db.rollback()
        erro_integridade(erro)
    except SQLAlchemyError as erro:
        db.rollback()
        erro_banco(erro)


@router.delete("/materiais/{id_material}", status_code=status.HTTP_204_NO_CONTENT)
def admin_desativar_material(
    id_material: int,
    permanente: bool = Query(False, description="Exclui de vez, removendo também os vínculos com pontos e conteúdos"),
    _: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    try:
        if permanente:
            # ponto_material usa ON DELETE RESTRICT: remove os vínculos antes, na mesma transação.
            # material_conteudo usa ON DELETE CASCADE e é limpo automaticamente.
            db.execute(text("DELETE FROM ponto_material WHERE id_material=:id"), {"id": id_material})
            row = db.execute(
                text("DELETE FROM material WHERE id_material=:id RETURNING id_material"),
                {"id": id_material},
            ).first()
        else:
            row = db.execute(
                text("UPDATE material SET ativo=FALSE WHERE id_material=:id RETURNING id_material"),
                {"id": id_material},
            ).first()
        if row is None:
            db.rollback()
            raise HTTPException(status_code=404, detail="Material não encontrado")
        db.commit()
    except IntegrityError as erro:
        db.rollback()
        erro_integridade(erro)
    except SQLAlchemyError as erro:
        db.rollback()
        erro_banco(erro)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --------------------------------------------------------------- Pontos de coleta
PONTO_ADMIN_SELECT = """
    SELECT p.id_ponto, p.id_tipo, p.id_instituicao, p.nome, p.descricao,
           p.logradouro, p.numero, p.complemento, p.bairro, p.cidade, p.estado, p.cep,
           ST_Y(p.localizacao::geometry) AS latitude, ST_X(p.localizacao::geometry) AS longitude,
           p.telefone, p.email_contato, p.site_url, p.horario_descricao, p.observacoes,
           p.fonte_url, p.verificado_em, p.ativo, t.nome AS tipo,
           COALESCE((
               SELECT json_agg(json_build_object(
                   'dia_semana', h.dia_semana,
                   'abertura', to_char(h.hora_abertura, 'HH24:MI'),
                   'fechamento', to_char(h.hora_fechamento, 'HH24:MI')
               ) ORDER BY h.dia_semana, h.hora_abertura)
               FROM horario_ponto h WHERE h.id_ponto=p.id_ponto
           ), '[]'::json) AS horarios,
           COALESCE((
               SELECT json_agg(pm.id_material ORDER BY pm.id_material)
               FROM ponto_material pm WHERE pm.id_ponto=p.id_ponto
           ), '[]'::json) AS materiais
    FROM ponto_coleta p JOIN tipo_ponto_coleta t ON t.id_tipo=p.id_tipo
"""


def salvar_ponto(db: Session, payload: AdminPontoInput, id_ponto: int | None = None):
    dados = payload.model_dump(exclude={"horarios", "materiais"})
    dados["latitude"] = payload.latitude
    dados["longitude"] = payload.longitude

    if id_ponto is None:
        row = db.execute(
            text("""
                    INSERT INTO ponto_coleta (
                        id_tipo, id_instituicao, nome, descricao, logradouro, numero, complemento,
                        bairro, cidade, estado, cep, localizacao, telefone, email_contato, site_url,
                        horario_descricao, observacoes, fonte_url, verificado_em, ativo
                    ) VALUES (
                        :id_tipo, :id_instituicao, :nome, :descricao, :logradouro, :numero, :complemento,
                        :bairro, :cidade, :estado, :cep,
                        CASE WHEN :latitude IS NULL THEN NULL ELSE
                            ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography END,
                        :telefone, :email_contato, :site_url, :horario_descricao, :observacoes,
                        :fonte_url, :verificado_em, :ativo
                    ) RETURNING id_ponto
                """),
            dados,
        ).mappings().one()
        id_ponto = row["id_ponto"]
    else:
        row = db.execute(
            text("""
                    UPDATE ponto_coleta SET id_tipo=:id_tipo, id_instituicao=:id_instituicao,
                        nome=:nome, descricao=:descricao, logradouro=:logradouro, numero=:numero,
                        complemento=:complemento, bairro=:bairro, cidade=:cidade, estado=:estado,
                        cep=:cep,
                        localizacao=CASE WHEN :latitude IS NULL THEN NULL ELSE
                            ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography END,
                        telefone=:telefone, email_contato=:email_contato, site_url=:site_url,
                        horario_descricao=:horario_descricao, observacoes=:observacoes,
                        fonte_url=:fonte_url, verificado_em=:verificado_em, ativo=:ativo
                    WHERE id_ponto=:id RETURNING id_ponto
                """),
            {**dados, "id": id_ponto},
        ).mappings().first()
        if row is None:
            raise HTTPException(status_code=404, detail="Ponto de coleta não encontrado")

    db.execute(text("DELETE FROM horario_ponto WHERE id_ponto=:id"), {"id": id_ponto})
    for horario in payload.horarios:
        db.execute(
            text("""
                    INSERT INTO horario_ponto (id_ponto, dia_semana, hora_abertura, hora_fechamento)
                    VALUES (:id, :dia_semana, :abertura, :fechamento)
                """),
            {"id": id_ponto, **horario.model_dump()},
        )
    db.execute(text("DELETE FROM ponto_material WHERE id_ponto=:id"), {"id": id_ponto})
    for id_material in set(payload.materiais):
        db.execute(
            text("INSERT INTO ponto_material (id_ponto, id_material) VALUES (:id, :material)"),
            {"id": id_ponto, "material": id_material},
        )
    result = db.execute(
        text(PONTO_ADMIN_SELECT + " WHERE p.id_ponto=:id"), {"id": id_ponto}
    ).mappings().one()
    db.commit()
    return dict(result)


@router.get("/pontos-coleta", summary="Listar pontos para administração")
def admin_listar_pontos(_: dict = Depends(require_admin), db: Session = Depends(get_db)):
    try:
        return [dict(row) for row in db.execute(text(PONTO_ADMIN_SELECT + " ORDER BY p.nome")).mappings()]
    except SQLAlchemyError as erro:
        erro_banco(erro)


@router.post("/pontos-coleta", status_code=status.HTTP_201_CREATED)
def admin_criar_ponto(
    payload: AdminPontoInput, _: dict = Depends(require_admin), db: Session = Depends(get_db)
):
    try:
        return salvar_ponto(db, payload)
    except IntegrityError as erro:
        db.rollback()
        erro_integridade(erro)
    except SQLAlchemyError as erro:
        db.rollback()
        erro_banco(erro)


@router.put("/pontos-coleta/{id_ponto}")
def admin_atualizar_ponto(
    id_ponto: int, payload: AdminPontoInput, _: dict = Depends(require_admin), db: Session = Depends(get_db)
):
    try:
        return salvar_ponto(db, payload, id_ponto)
    except IntegrityError as erro:
        db.rollback()
        erro_integridade(erro)
    except SQLAlchemyError as erro:
        db.rollback()
        erro_banco(erro)


@router.delete("/pontos-coleta/{id_ponto}", status_code=status.HTTP_204_NO_CONTENT)
def admin_desativar_ponto(
    id_ponto: int,
    permanente: bool = Query(False, description="Exclui de vez, junto com horários, materiais aceitos e favoritos"),
    _: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    # horario_ponto, ponto_material e ponto_favorito usam ON DELETE CASCADE.
    sql = (
        "DELETE FROM ponto_coleta WHERE id_ponto=:id RETURNING id_ponto"
        if permanente
        else "UPDATE ponto_coleta SET ativo=FALSE WHERE id_ponto=:id RETURNING id_ponto"
    )
    try:
        row = db.execute(text(sql), {"id": id_ponto}).first()
        if row is None:
            db.rollback()
            raise HTTPException(status_code=404, detail="Ponto de coleta não encontrado")
        db.commit()
    except IntegrityError as erro:
        db.rollback()
        erro_integridade(erro)
    except SQLAlchemyError as erro:
        db.rollback()
        erro_banco(erro)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ------------------------------------------------------- Projetos e conteúdos
@router.get("/projetos", summary="Listar projetos para administração")
def admin_listar_projetos(_: dict = Depends(require_admin), db: Session = Depends(get_db)):
    try:
        return [
            dict(row)
            for row in db.execute(
                text("""
                    SELECT pr.id_projeto, pr.titulo, pr.descricao, pr.tipo, pr.data_inicio,
                           pr.data_fim, pr.fonte_url, pr.verificado_em, pr.id_instituicao,
                           pr.publicado, i.nome AS instituicao
                    FROM projeto_iniciativa pr LEFT JOIN instituicao i USING (id_instituicao)
                    ORDER BY pr.atualizado_em DESC, pr.titulo
                """)
            ).mappings()
        ]
    except SQLAlchemyError as erro:
        erro_banco(erro)


@router.post("/projetos", status_code=status.HTTP_201_CREATED)
def admin_criar_projeto(
    payload: AdminProjetoInput, _: dict = Depends(require_admin), db: Session = Depends(get_db)
):
    try:
        row = db.execute(
            text("""
                INSERT INTO projeto_iniciativa
                    (titulo, descricao, tipo, data_inicio, data_fim, fonte_url,
                     verificado_em, id_instituicao, publicado)
                VALUES
                    (:titulo, :descricao, :tipo, :data_inicio, :data_fim, :fonte_url,
                     :verificado_em, :id_instituicao, :publicado)
                RETURNING id_projeto
            """),
            payload.model_dump(),
        ).mappings().one()
        db.commit()
        return {"id_projeto": row["id_projeto"]}
    except IntegrityError as erro:
        db.rollback()
        erro_integridade(erro)
    except SQLAlchemyError as erro:
        db.rollback()
        erro_banco(erro)


@router.put("/projetos/{id_projeto}")
def admin_atualizar_projeto(
    id_projeto: int, payload: AdminProjetoInput, _: dict = Depends(require_admin), db: Session = Depends(get_db)
):
    try:
        row = db.execute(
            text("""
                UPDATE projeto_iniciativa SET titulo=:titulo, descricao=:descricao, tipo=:tipo,
                    data_inicio=:data_inicio, data_fim=:data_fim, fonte_url=:fonte_url,
                    verificado_em=:verificado_em, id_instituicao=:id_instituicao, publicado=:publicado
                WHERE id_projeto=:id RETURNING id_projeto
            """),
            {**payload.model_dump(), "id": id_projeto},
        ).mappings().first()
        if row is None:
            raise HTTPException(status_code=404, detail="Projeto não encontrado")
        db.commit()
        return {"id_projeto": row["id_projeto"]}
    except IntegrityError as erro:
        db.rollback()
        erro_integridade(erro)
    except SQLAlchemyError as erro:
        db.rollback()
        erro_banco(erro)


@router.delete("/projetos/{id_projeto}", status_code=status.HTTP_204_NO_CONTENT)
def admin_excluir_projeto(id_projeto: int, _: dict = Depends(require_admin), db: Session = Depends(get_db)):
    try:
        row = db.execute(
            text("DELETE FROM projeto_iniciativa WHERE id_projeto=:id RETURNING id_projeto"),
            {"id": id_projeto},
        ).first()
        if row is None:
            raise HTTPException(status_code=404, detail="Projeto não encontrado")
        db.commit()
    except SQLAlchemyError as erro:
        db.rollback()
        erro_banco(erro)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/conteudos", summary="Listar conteúdos para administração")
def admin_listar_conteudos(_: dict = Depends(require_admin), db: Session = Depends(get_db)):
    try:
        rows = db.execute(
            text("""
                SELECT c.id_conteudo, c.titulo, c.slug, c.resumo, c.corpo, c.tipo, c.imagem_url,
                       c.fonte_url, c.autor, c.publicado, c.publicado_em, c.verificado_em,
                       COALESCE((
                           SELECT json_agg(mc.id_material ORDER BY mc.id_material)
                           FROM material_conteudo mc WHERE mc.id_conteudo=c.id_conteudo
                       ), '[]'::json) AS materiais
                FROM conteudo_educativo c
                ORDER BY c.atualizado_em DESC, c.titulo
            """)
        ).mappings()
        return [dict(row) for row in rows]
    except SQLAlchemyError as erro:
        erro_banco(erro)


def salvar_conteudo(db: Session, payload: AdminConteudoInput, id_conteudo: int | None = None):
    dados = payload.model_dump(exclude={"materiais"})
    if id_conteudo is None:
        result = db.execute(
            text("""
                    INSERT INTO conteudo_educativo
                        (titulo, slug, resumo, corpo, tipo, imagem_url, fonte_url, autor, publicado,
                         publicado_em, verificado_em)
                    VALUES
                        (:titulo, :slug, :resumo, :corpo, :tipo, :imagem_url, :fonte_url, :autor, :publicado,
                         CASE WHEN :publicado THEN COALESCE(:publicado_em, NOW()) ELSE NULL END,
                         :verificado_em)
                    RETURNING id_conteudo
                """),
            dados,
        ).mappings().one()
        id_conteudo = result["id_conteudo"]
    else:
        result = db.execute(
            text("""
                    UPDATE conteudo_educativo SET titulo=:titulo, slug=:slug, resumo=:resumo, corpo=:corpo,
                        tipo=:tipo, imagem_url=:imagem_url, fonte_url=:fonte_url, autor=:autor, publicado=:publicado,
                        publicado_em=CASE WHEN :publicado
                            THEN COALESCE(:publicado_em, publicado_em, NOW()) ELSE NULL END,
                        verificado_em=:verificado_em
                    WHERE id_conteudo=:id RETURNING id_conteudo
                """),
            {**dados, "id": id_conteudo},
        ).mappings().first()
        if result is None:
            raise HTTPException(status_code=404, detail="Conteúdo não encontrado")

    db.execute(text("DELETE FROM material_conteudo WHERE id_conteudo=:id"), {"id": id_conteudo})
    for id_material in set(payload.materiais):
        db.execute(
            text("INSERT INTO material_conteudo (id_conteudo, id_material) VALUES (:id, :material)"),
            {"id": id_conteudo, "material": id_material},
        )
    db.commit()
    return {"id_conteudo": id_conteudo}


@router.post("/conteudos", status_code=status.HTTP_201_CREATED)
def admin_criar_conteudo(
    payload: AdminConteudoInput, _: dict = Depends(require_admin), db: Session = Depends(get_db)
):
    try:
        return salvar_conteudo(db, payload)
    except IntegrityError as erro:
        db.rollback()
        erro_integridade(erro)
    except SQLAlchemyError as erro:
        db.rollback()
        erro_banco(erro)


@router.put("/conteudos/{id_conteudo}")
def admin_atualizar_conteudo(
    id_conteudo: int, payload: AdminConteudoInput, _: dict = Depends(require_admin), db: Session = Depends(get_db)
):
    try:
        return salvar_conteudo(db, payload, id_conteudo)
    except IntegrityError as erro:
        db.rollback()
        erro_integridade(erro)
    except SQLAlchemyError as erro:
        db.rollback()
        erro_banco(erro)


@router.delete("/conteudos/{id_conteudo}", status_code=status.HTTP_204_NO_CONTENT)
def admin_excluir_conteudo(id_conteudo: int, _: dict = Depends(require_admin), db: Session = Depends(get_db)):
    try:
        row = db.execute(
            text("DELETE FROM conteudo_educativo WHERE id_conteudo=:id RETURNING id_conteudo"),
            {"id": id_conteudo},
        ).first()
        if row is None:
            raise HTTPException(status_code=404, detail="Conteúdo não encontrado")
        db.commit()
    except SQLAlchemyError as erro:
        db.rollback()
        erro_banco(erro)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
