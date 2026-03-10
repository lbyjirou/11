from sqlalchemy import Column, Integer, String, DECIMAL, DateTime, JSON
from sqlalchemy.sql import func
from database import Base


class AluminumPrice(Base):
    """铝价表"""
    __tablename__ = "aluminum_price"

    id = Column(Integer, primary_key=True, autoincrement=True)
    price = Column(DECIMAL(10, 2), nullable=False, comment="铝锭价(元/KG)")
    diff_ratio = Column(DECIMAL(5, 3), default=1.0, comment="理论实际差异比")
    loss_ratio = Column(DECIMAL(5, 3), default=1.02, comment="损耗比")
    created_at = Column(DateTime, default=func.now(), comment="创建时间")


class CollectorSpec(Base):
    """集流管规格表"""
    __tablename__ = "collector_spec"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False, comment="规格名称")
    material = Column(String(100), nullable=True, comment="材料")
    area = Column(DECIMAL(10, 4), nullable=True, comment="截面积(mm²)")
    length = Column(DECIMAL(10, 2), default=0, comment="默认长度(mm)")
    fee = Column(DECIMAL(10, 2), default=16.5, comment="原料加工费(元)")


class FinSpec(Base):
    """翅片规格表"""
    __tablename__ = "fin_spec"

    id = Column(Integer, primary_key=True, autoincrement=True)
    material = Column(String(100), nullable=True, comment="材料")
    width = Column(DECIMAL(10, 2), nullable=False, comment="宽度(mm)")
    wave_height = Column(DECIMAL(10, 2), nullable=True, comment="波高(mm)")
    pitch = Column(DECIMAL(10, 2), nullable=True, comment="波距(mm)")
    wave_len = Column(DECIMAL(10, 2), nullable=False, comment="单波长(mm)")
    center = Column(DECIMAL(10, 2), nullable=True, comment="默认中心距(mm)")
    wave_count = Column(Integer, nullable=True, comment="默认波数")
    fee = Column(DECIMAL(10, 2), default=7.0, comment="原料加工费(元)")
    part_fee = Column(DECIMAL(10, 4), default=0.001, comment="部件加工费(元)")


class TubeSpec(Base):
    """扁管规格表"""
    __tablename__ = "tube_spec"

    id = Column(Integer, primary_key=True, autoincrement=True)
    material = Column(String(100), nullable=True, comment="材料")
    width = Column(DECIMAL(10, 2), nullable=True, comment="宽度(mm)")
    thickness = Column(DECIMAL(10, 2), nullable=True, comment="厚度(mm)")
    length = Column(DECIMAL(10, 2), default=0, comment="默认长度(mm)")
    meter_weight = Column(DECIMAL(10, 4), nullable=False, comment="米重(kg/m)")
    fee = Column(DECIMAL(10, 3), default=7.436, comment="普通加工费(元)")
    zinc_fee = Column(DECIMAL(10, 2), default=11.9, comment="喷锌加工费(元)")


class QuoteRecord(Base):
    """报价记录表"""
    __tablename__ = "quote_record"

    id = Column(Integer, primary_key=True, autoincrement=True)
    al_price = Column(DECIMAL(10, 2), comment="当时铝价")
    collector_data = Column(JSON, comment="集流管数据")
    fin_data = Column(JSON, comment="翅片数据")
    tube_data = Column(JSON, comment="扁管数据")
    material_cost = Column(DECIMAL(10, 2), comment="材料成本")
    mfg_cost = Column(DECIMAL(10, 2), comment="制造费用")
    profit = Column(DECIMAL(10, 2), comment="利润")
    freight = Column(DECIMAL(10, 2), comment="运费")
    final_price = Column(DECIMAL(10, 2), comment="最终报价")
    created_at = Column(DateTime, default=func.now(), comment="创建时间")


class ComponentSpec(Base):
    """通用部件规格表"""
    __tablename__ = "component_spec"

    id = Column(Integer, primary_key=True, autoincrement=True)
    type = Column(String(50), nullable=False, comment="部件类型")
    name = Column(String(100), nullable=False, comment="部件名称")
    material = Column(String(100), nullable=True, comment="材料")
    spec = Column(String(100), nullable=True, comment="规格")
    unit_price = Column(DECIMAL(10, 4), default=0, comment="单价(元)")
    unit = Column(String(20), default="PCS", comment="单位")
    remark = Column(String(200), nullable=True, comment="备注")
