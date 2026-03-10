"""报价记录 API"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from schemas import QuoteCreate, QuoteResponse
import crud

router = APIRouter(prefix="/api/quote", tags=["报价管理"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("", response_model=list[QuoteResponse], summary="获取报价记录")
def get_quotes(db: Session = Depends(get_db)):
    """获取所有报价记录"""
    return crud.get_all_quotes(db)


@router.post("/save", response_model=QuoteResponse, summary="保存报价")
def save_quote(data: QuoteCreate, db: Session = Depends(get_db)):
    """保存报价记录"""
    return crud.create_quote(
        db,
        al_price=data.al_price,
        collector_data=data.collector_data,
        fin_data=data.fin_data,
        tube_data=data.tube_data,
        material_cost=data.material_cost,
        mfg_cost=data.mfg_cost,
        profit=data.profit,
        freight=data.freight,
        final_price=data.final_price
    )
