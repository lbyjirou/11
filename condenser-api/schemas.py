"""Pydantic 数据模型 - 用于 API 请求和响应验证"""
from pydantic import BaseModel
from datetime import datetime


# ========== 铝价相关 ==========
class PriceCreate(BaseModel):
    """创建铝价请求"""
    price: float
    diff_ratio: float = 1.0
    loss_ratio: float = 1.02


class PriceResponse(BaseModel):
    """铝价响应"""
    id: int
    price: float
    diff_ratio: float
    loss_ratio: float
    created_at: datetime

    class Config:
        from_attributes = True


# ========== 集流管相关 ==========
class CollectorResponse(BaseModel):
    """集流管规格响应"""
    id: int
    name: str
    material: str | None
    area: float | None
    length: float
    fee: float

    class Config:
        from_attributes = True


# ========== 翅片相关 ==========
class FinResponse(BaseModel):
    """翅片规格响应"""
    id: int
    material: str | None
    width: float
    wave_height: float | None
    pitch: float | None
    wave_len: float
    center: float | None
    wave_count: int | None
    fee: float
    part_fee: float

    class Config:
        from_attributes = True


# ========== 扁管相关 ==========
class TubeResponse(BaseModel):
    """扁管规格响应"""
    id: int
    material: str | None
    width: float | None
    thickness: float | None
    length: float
    meter_weight: float
    fee: float
    zinc_fee: float

    class Config:
        from_attributes = True


# ========== 报价记录相关 ==========
class QuoteCreate(BaseModel):
    """创建报价记录请求"""
    al_price: float
    collector_data: dict
    fin_data: dict
    tube_data: dict
    material_cost: float
    mfg_cost: float
    profit: float
    freight: float
    final_price: float


class QuoteResponse(BaseModel):
    """报价记录响应"""
    id: int
    al_price: float
    collector_data: dict
    fin_data: dict
    tube_data: dict
    material_cost: float
    mfg_cost: float
    profit: float
    freight: float
    final_price: float
    created_at: datetime

    class Config:
        from_attributes = True


# ========== 通用部件相关 ==========
class ComponentResponse(BaseModel):
    """通用部件规格响应"""
    id: int
    type: str
    name: str
    material: str | None
    spec: str | None
    unit_price: float
    unit: str
    remark: str | None

    class Config:
        from_attributes = True
