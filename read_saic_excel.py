# -*- coding: utf-8 -*-
"""
上汽报价单 Excel 解析器
基于锚点定位策略，处理复杂的多 Sheet、合并单元格结构
"""

import pandas as pd
import json
from pathlib import Path


def find_anchor_row(df, keywords):
    """
    在 DataFrame 中搜索包含关键词的行，返回行索引
    :param df: DataFrame
    :param keywords: 关键词列表
    :return: 行索引，未找到返回 -1
    """
    for idx, row in df.iterrows():
        row_text = ' '.join([str(v) for v in row.values if pd.notna(v)])
        for kw in keywords:
            if kw in row_text:
                return idx
    return -1


def find_anchor_cell(df, keyword):
    """
    在 DataFrame 中搜索包含关键词的单元格，返回 (行索引, 列索引)
    """
    for idx, row in df.iterrows():
        for col_idx, val in enumerate(row.values):
            if pd.notna(val) and keyword in str(val):
                return idx, col_idx
    return -1, -1


def clean_dataframe(df):
    """清理 DataFrame：删除全空行和全空列"""
    df = df.dropna(how='all', axis=0)
    df = df.dropna(how='all', axis=1)
    df = df.reset_index(drop=True)
    return df


def parse_bom_sheet(df, sheet_name):
    """
    解析 BOM 表 (Part 3/4)
    锚点关键词：父物料编码、层次、Level
    """
    print(f"\n{'='*60}")
    print(f"解析 BOM 表: {sheet_name}")
    print('='*60)

    anchor_row = find_anchor_row(df, ['父物料编码', '层次', 'Level', '物料编码'])

    if anchor_row == -1:
        print(f"  [警告] 未找到 BOM 表头锚点")
        return None

    # 表头行
    header_row = df.iloc[anchor_row]
    # 数据从锚点下一行开始
    data_df = df.iloc[anchor_row + 1:].copy()
    data_df.columns = header_row.values
    data_df = clean_dataframe(data_df)

    # 过滤掉表头重复行
    if '层次' in data_df.columns:
        data_df = data_df[data_df['层次'] != '层次']

    print(f"  找到表头行: {anchor_row}")
    print(f"  数据行数: {len(data_df)}")
    print(f"  列名: {list(data_df.columns)}")

    if len(data_df) > 0:
        print(f"\n  前5行数据预览:")
        print(data_df.head().to_string())

    return data_df


def parse_cost_sheet(df, sheet_name):
    """
    解析成本分解表 (Part 5)
    分为上半部分(材料成本)和下半部分(制造费用/工序)
    """
    print(f"\n{'='*60}")
    print(f"解析成本分解表: {sheet_name}")
    print('='*60)

    result = {'materials': None, 'processes': None}

    # 1. 解析材料成本部分
    material_anchor = find_anchor_row(df, ['原材料名称', '材料名称', '单件用量'])
    if material_anchor >= 0:
        header_row = df.iloc[material_anchor]

        # 找材料部分的结束位置（通常是"材料总成本"或"直接人工"之前）
        end_row = find_anchor_row(df.iloc[material_anchor+1:], ['材料总成本', '直接人工', '制造费用'])
        if end_row >= 0:
            end_row = material_anchor + 1 + end_row
        else:
            end_row = len(df)

        material_df = df.iloc[material_anchor + 1:end_row].copy()
        material_df.columns = header_row.values
        material_df = clean_dataframe(material_df)

        # 过滤空行和汇总行
        if len(material_df) > 0:
            result['materials'] = material_df
            print(f"\n  [材料成本] 表头行: {material_anchor}, 数据行数: {len(material_df)}")
            print(f"  列名: {list(material_df.columns)}")
            print(f"\n  材料数据预览:")
            print(material_df.head().to_string())

    # 2. 解析制造费用/工序部分
    process_anchor = find_anchor_row(df, ['直接人工', '工序名称', '制造费用', '工步'])
    if process_anchor >= 0 and process_anchor < len(df):
        # 工序表头可能在锚点行或下一行
        header_row = df.iloc[process_anchor]

        # 检查是否需要往下找真正的表头
        if '工序' not in str(header_row.values) and '工步' not in str(header_row.values):
            remaining_df = df.iloc[process_anchor:]
            if len(remaining_df) > 0:
                sub_anchor = find_anchor_row(remaining_df, ['工序', '工步', '节拍'])
                if sub_anchor >= 0:
                    new_anchor = process_anchor + sub_anchor
                    if new_anchor < len(df):
                        process_anchor = new_anchor
                        header_row = df.iloc[process_anchor]

        # 边界检查
        if process_anchor >= len(df):
            return result

        # 找工序部分的结束位置
        if process_anchor + 1 < len(df):
            end_row = find_anchor_row(df.iloc[process_anchor+1:], ['制造费用合计', '小计', '合计'])
            if end_row >= 0:
                end_row = process_anchor + 1 + end_row
            else:
                end_row = len(df)
        else:
            end_row = len(df)

        process_df = df.iloc[process_anchor + 1:end_row].copy()
        if len(process_df) == 0 or len(header_row) != len(process_df.columns):
            return result
        process_df.columns = header_row.values
        process_df = clean_dataframe(process_df)

        if len(process_df) > 0:
            result['processes'] = process_df
            print(f"\n  [制造费用] 表头行: {process_anchor}, 数据行数: {len(process_df)}")
            print(f"  列名: {list(process_df.columns)}")
            print(f"\n  工序数据预览:")
            print(process_df.head().to_string())

    return result


def parse_logistics_sheet(df, sheet_name):
    """
    解析物流包装表 (Part 7)
    这是 Key-Value 表单格式，需要搜索特定字段
    """
    print(f"\n{'='*60}")
    print(f"解析物流包装表: {sheet_name}")
    print('='*60)

    result = {}

    # 定义要提取的字段及其关键词
    fields = [
        ('包装箱尺寸', ['包装箱（或料架）外形尺寸', '包装箱外形尺寸', '外形尺寸']),
        ('单箱零件数', ['单箱（或料架）零件数', '单箱零件数', 'SNP']),
        ('包装箱单价', ['包装箱（或料架）单价', '包装箱单价']),
        ('包装箱寿命', ['包装箱（或料架）寿命', '包装箱寿命', '使用寿命']),
        ('车辆长度', ['车辆长度', '车型']),
        ('单车装箱数', ['单车装箱数', '装箱数']),
        ('单程运费', ['单程运费', '运费']),
        ('单件运费', ['单件运费']),
        ('单件包装费', ['单件包装费', '包装费']),
    ]

    for field_name, keywords in fields:
        for kw in keywords:
            row_idx, col_idx = find_anchor_cell(df, kw)
            if row_idx >= 0:
                # 读取右侧单元格的值
                if col_idx + 1 < len(df.columns):
                    value = df.iloc[row_idx, col_idx + 1]
                    if pd.notna(value):
                        result[field_name] = str(value)
                        print(f"  {field_name}: {value}")
                        break

    return result


def parse_summary_sheet(df, sheet_name):
    """
    解析汇总表 (Part 8)
    提取最终报价汇总信息
    """
    print(f"\n{'='*60}")
    print(f"解析汇总表: {sheet_name}")
    print('='*60)

    result = {}

    fields = [
        ('材料成本', ['材料成本', '原材料成本']),
        ('制造费用', ['制造费用', '加工费用']),
        ('管理费用', ['管理费用', 'SG&A']),
        ('利润', ['利润', '目标利润']),
        ('含税单价', ['含税单价', '含税价格', '销售单价']),
        ('模具费', ['模具费', '工装费']),
    ]

    for field_name, keywords in fields:
        for kw in keywords:
            row_idx, col_idx = find_anchor_cell(df, kw)
            if row_idx >= 0:
                # 尝试读取右侧或下方的值
                if col_idx + 1 < len(df.columns):
                    value = df.iloc[row_idx, col_idx + 1]
                    if pd.notna(value):
                        result[field_name] = str(value)
                        print(f"  {field_name}: {value}")
                        break

    return result


def analyze_excel(file_path):
    """
    主函数：分析上汽报价单 Excel
    """
    print(f"\n{'#'*60}")
    print(f"开始解析文件: {Path(file_path).name}")
    print('#'*60)

    # 读取所有 Sheet，不预设表头
    all_sheets = pd.read_excel(file_path, sheet_name=None, header=None)

    print(f"\n发现 {len(all_sheets)} 个工作表:")
    for name in all_sheets.keys():
        print(f"  - {name}")

    result = {
        'file_name': Path(file_path).name,
        'sheets': list(all_sheets.keys()),
        'bom': None,
        'cost': None,
        'logistics': None,
        'summary': None
    }

    # 遍历每个 Sheet 进行解析
    for sheet_name, df in all_sheets.items():
        df = clean_dataframe(df)
        sheet_lower = sheet_name.lower()

        # 根据 Sheet 名称或内容判断类型
        if 'bom' in sheet_lower or 'part 3' in sheet_lower or 'part 4' in sheet_lower:
            bom_data = parse_bom_sheet(df, sheet_name)
            if bom_data is not None:
                result['bom'] = bom_data.to_dict('records') if len(bom_data) > 0 else None

        elif 'part 5' in sheet_lower or '成本' in sheet_name or 'cost' in sheet_lower:
            cost_data = parse_cost_sheet(df, sheet_name)
            result['cost'] = {
                'materials': cost_data['materials'].to_dict('records') if cost_data['materials'] is not None else None,
                'processes': cost_data['processes'].to_dict('records') if cost_data['processes'] is not None else None
            }

        elif 'part 7' in sheet_lower or '物流' in sheet_name or '包装' in sheet_name:
            result['logistics'] = parse_logistics_sheet(df, sheet_name)

        elif 'part 8' in sheet_lower or '汇总' in sheet_name or 'summary' in sheet_lower:
            result['summary'] = parse_summary_sheet(df, sheet_name)

        else:
            # 尝试自动识别内容
            content_text = df.to_string()
            if '父物料编码' in content_text or '层次' in content_text:
                bom_data = parse_bom_sheet(df, sheet_name)
                if bom_data is not None and result['bom'] is None:
                    result['bom'] = bom_data.to_dict('records')
            elif '原材料名称' in content_text or '直接人工' in content_text:
                cost_data = parse_cost_sheet(df, sheet_name)
                if result['cost'] is None:
                    result['cost'] = {
                        'materials': cost_data['materials'].to_dict('records') if cost_data['materials'] is not None else None,
                        'processes': cost_data['processes'].to_dict('records') if cost_data['processes'] is not None else None
                    }

    return result


def main():
    # 文件路径
    file_path = r"C:\Users\86152\Desktop\量产零件询价单-上汽（11784737_NE22_04_7534）2025-10-11(华为项目）（成本）.xls"

    # 检查文件是否存在
    if not Path(file_path).exists():
        print(f"错误: 文件不存在 - {file_path}")
        return

    # 解析 Excel
    result = analyze_excel(file_path)

    # 输出 JSON 格式结果
    print(f"\n{'#'*60}")
    print("解析完成，JSON 格式输出:")
    print('#'*60)

    # 转换为可序列化的格式
    output = {
        'file_name': result['file_name'],
        'sheets': result['sheets'],
        'bom_count': len(result['bom']) if result['bom'] else 0,
        'material_count': len(result['cost']['materials']) if result['cost'] and result['cost']['materials'] else 0,
        'process_count': len(result['cost']['processes']) if result['cost'] and result['cost']['processes'] else 0,
        'logistics': result['logistics'],
        'summary': result['summary']
    }

    print(json.dumps(output, ensure_ascii=False, indent=2))

    # 保存完整结果到文件
    output_path = Path(file_path).parent / f"{Path(file_path).stem}_parsed.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"\n结果已保存到: {output_path}")


if __name__ == '__main__':
    main()
