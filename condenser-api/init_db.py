"""
初始化数据库脚本
- 创建数据库（如果不存在）
- 创建所有表
- 从 Excel 导入预设数据
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import xlrd
from database import create_database_if_not_exists, engine, SessionLocal, Base
from models import AluminumPrice, CollectorSpec, FinSpec, TubeSpec
from crud import create_price, create_collector, create_fin, create_tube

EXCEL_PATH = r"C:\Users\86152\Desktop\新版冷凝器报价计算公式(lip)2025-11-2(2).xls"


def init_tables():
    """创建所有表"""
    print("正在创建数据库表...")
    Base.metadata.create_all(bind=engine)
    print("表创建完成！")


def import_from_excel():
    """从 Excel 导入数据"""
    print(f"正在读取 Excel: {EXCEL_PATH}")
    wb = xlrd.open_workbook(EXCEL_PATH, encoding_override='gbk')
    sheet = wb.sheet_by_name('报价计算公式')

    db = SessionLocal()

    try:
        # 导入铝价（行1-3）
        print("\n导入铝价...")
        price = float(sheet.cell(1, 1).value)  # 20.2
        diff_ratio = float(sheet.cell(2, 1).value)  # 1.0
        loss_ratio = float(sheet.cell(3, 1).value)  # 1.02
        create_price(db, price, diff_ratio, loss_ratio)
        print(f"  铝价: {price}, 差异比: {diff_ratio}, 损耗比: {loss_ratio}")

        # 导入集流管（行6-13）
        print("\n导入集流管规格...")
        for row in range(6, 14):
            name = sheet.cell(row, 1).value
            if not name:
                continue
            area = sheet.cell(row, 2).value or None
            length = sheet.cell(row, 3).value or 0
            fee = sheet.cell(row, 5).value or 16.5
            create_collector(db, str(name), area, length, fee)
            print(f"  {name}: 截面积={area}, 长度={length}, 加工费={fee}")

        # 导入翅片（行15-19）
        print("\n导入翅片规格...")
        for row in range(15, 20):
            width = sheet.cell(row, 1).value
            if not width:
                continue
            wave_height = sheet.cell(row, 2).value or None
            pitch = sheet.cell(row, 3).value or None
            wave_len = sheet.cell(row, 4).value
            center = sheet.cell(row, 5).value or None
            wave_count = int(sheet.cell(row, 6).value) if sheet.cell(row, 6).value else None
            fee = sheet.cell(row, 9).value or 7.0
            part_fee = sheet.cell(row, 10).value or 0.001
            create_fin(db, width, wave_height, pitch, wave_len, center, wave_count, fee, part_fee)
            print(f"  宽度={width}: 波高={wave_height}, 波距={pitch}, 单波长={wave_len}")

        # 导入扁管（行22-27）
        print("\n导入扁管规格...")
        for row in range(22, 28):
            width = sheet.cell(row, 1).value
            if not width:
                continue
            thickness = sheet.cell(row, 2).value or None
            length = sheet.cell(row, 3).value or 0
            meter_weight = sheet.cell(row, 4).value
            fee = sheet.cell(row, 6).value or 7.436
            zinc_fee = sheet.cell(row, 8).value or 11.9
            create_tube(db, width, thickness, length, meter_weight, fee, zinc_fee)
            print(f"  {width}x{thickness}: 米重={meter_weight}, 长度={length}")

        print("\n数据导入完成！")

    finally:
        db.close()


def main():
    print("=" * 50)
    print("冷凝器报价系统 - 数据库初始化")
    print("=" * 50)

    # 1. 创建数据库
    print("\n[1/3] 创建数据库...")
    create_database_if_not_exists()
    print("数据库 condenser_quote 已就绪")

    # 2. 创建表
    print("\n[2/3] 创建数据表...")
    init_tables()

    # 3. 导入数据
    print("\n[3/3] 导入 Excel 数据...")
    import_from_excel()

    print("\n" + "=" * 50)
    print("初始化完成！")
    print("=" * 50)


if __name__ == "__main__":
    main()
