"""铝价相关 API"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from schemas import PriceCreate, PriceResponse
import crud

router = APIRouter(prefix="/api/price", tags=["铝价管理"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("", response_model=PriceResponse, summary="获取当前铝价")
def get_price(db: Session = Depends(get_db)):
    """获取最新的铝价信息"""
    price = crud.get_current_price(db)
    if not price:
        return {"error": "暂无铝价数据"}
    return price


@router.post("", response_model=PriceResponse, summary="更新铝价")
def update_price(data: PriceCreate, db: Session = Depends(get_db)):
    """添加新的铝价记录"""
    return crud.create_price(db, data.price, data.diff_ratio, data.loss_ratio)
