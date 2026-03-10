from sqlalchemy.orm import Session
from sqlalchemy import desc
from models import AluminumPrice, CollectorSpec, FinSpec, TubeSpec, QuoteRecord, ComponentSpec


# ========== 铝价操作 ==========
def get_current_price(db: Session) -> AluminumPrice | None:
    """获取最新铝价"""
    return db.query(AluminumPrice).order_by(desc(AluminumPrice.id)).first()

def create_price(db: Session, price: float, diff_ratio: float = 1.0, loss_ratio: float = 1.02):
    """创建新铝价记录"""
    record = AluminumPrice(price=price, diff_ratio=diff_ratio, loss_ratio=loss_ratio)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# ========== 集流管操作 ==========
def get_all_collectors(db: Session) -> list[CollectorSpec]:
    """获取所有集流管规格"""
    return db.query(CollectorSpec).all()

def create_collector(db: Session, name: str, area: float = None, length: float = 0, fee: float = 16.5):
    """创建集流管规格"""
    record = CollectorSpec(name=name, area=area, length=length, fee=fee)
    db.add(record)
    db.commit()
    return record


# ========== 翅片操作 ==========
def get_all_fins(db: Session) -> list[FinSpec]:
    """获取所有翅片规格"""
    return db.query(FinSpec).all()

def create_fin(db: Session, width: float, wave_height: float, pitch: float, wave_len: float,
               center: float = None, wave_count: int = None, fee: float = 7.0, part_fee: float = 0.001):
    """创建翅片规格"""
    record = FinSpec(width=width, wave_height=wave_height, pitch=pitch, wave_len=wave_len,
                     center=center, wave_count=wave_count, fee=fee, part_fee=part_fee)
    db.add(record)
    db.commit()
    return record


# ========== 扁管操作 ==========
def get_all_tubes(db: Session) -> list[TubeSpec]:
    """获取所有扁管规格"""
    return db.query(TubeSpec).all()

def create_tube(db: Session, width: float, thickness: float, length: float, meter_weight: float,
                fee: float = 7.436, zinc_fee: float = 11.9):
    """创建扁管规格"""
    record = TubeSpec(width=width, thickness=thickness, length=length, meter_weight=meter_weight,
                      fee=fee, zinc_fee=zinc_fee)
    db.add(record)
    db.commit()
    return record


# ========== 报价记录操作 ==========
def get_all_quotes(db: Session) -> list[QuoteRecord]:
    """获取所有报价记录"""
    return db.query(QuoteRecord).order_by(desc(QuoteRecord.id)).all()

def create_quote(db: Session, al_price: float, collector_data: dict, fin_data: dict, tube_data: dict,
                 material_cost: float, mfg_cost: float, profit: float, freight: float, final_price: float):
    """创建报价记录"""
    record = QuoteRecord(
        al_price=al_price, collector_data=collector_data, fin_data=fin_data, tube_data=tube_data,
        material_cost=material_cost, mfg_cost=mfg_cost, profit=profit, freight=freight, final_price=final_price
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# ========== 通用部件操作 ==========
def get_all_components(db: Session) -> list[ComponentSpec]:
    """获取所有通用部件"""
    return db.query(ComponentSpec).all()

def get_components_by_type(db: Session, comp_type: str) -> list[ComponentSpec]:
    """按类型获取通用部件"""
    return db.query(ComponentSpec).filter(ComponentSpec.type == comp_type).all()
