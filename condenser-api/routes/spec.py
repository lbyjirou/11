"""规格查询 API"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import SessionLocal
from schemas import CollectorResponse, FinResponse, TubeResponse, ComponentResponse
import crud

router = APIRouter(prefix="/api/spec", tags=["规格查询"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/collector", response_model=list[CollectorResponse], summary="获取集流管规格")
def get_collectors(db: Session = Depends(get_db)):
    """获取所有集流管规格列表"""
    return crud.get_all_collectors(db)


@router.get("/fin", response_model=list[FinResponse], summary="获取翅片规格")
def get_fins(db: Session = Depends(get_db)):
    """获取所有翅片规格列表"""
    return crud.get_all_fins(db)


@router.get("/tube", response_model=list[TubeResponse], summary="获取扁管规格")
def get_tubes(db: Session = Depends(get_db)):
    """获取所有扁管规格列表"""
    return crud.get_all_tubes(db)


@router.get("/component", response_model=list[ComponentResponse], summary="获取通用部件")
def get_components(type: str = Query(None, description="部件类型"), db: Session = Depends(get_db)):
    """获取通用部件列表，可按类型筛选"""
    if type:
        return crud.get_components_by_type(db, type)
    return crud.get_all_components(db)
