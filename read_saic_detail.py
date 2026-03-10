# -*- coding: utf-8 -*-
"""
上汽报价单 Excel 详细解析器
输出每个Sheet的完整结构到文本文件
"""

import pandas as pd
from pathlib import Path

def analyze_excel_detail(file_path, output_path):
    """详细分析Excel结构并输出到文件"""

    all_sheets = pd.read_excel(file_path, sheet_name=None, header=None)

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(f"文件: {Path(file_path).name}\n")
        f.write(f"工作表数量: {len(all_sheets)}\n")
        f.write("=" * 80 + "\n\n")

        for sheet_name, df in all_sheets.items():
            f.write(f"\n{'#' * 80}\n")
            f.write(f"# 工作表: {sheet_name}\n")
            f.write(f"{'#' * 80}\n\n")

            # 清理空行空列
            df_clean = df.dropna(how='all', axis=0).dropna(how='all', axis=1)
            df_clean = df_clean.reset_index(drop=True)

            f.write(f"原始尺寸: {df.shape[0]}行 x {df.shape[1]}列\n")
            f.write(f"清理后尺寸: {df_clean.shape[0]}行 x {df_clean.shape[1]}列\n\n")

            # 输出前50行数据
            max_rows = min(50, len(df_clean))
            f.write(f"前{max_rows}行数据:\n")
            f.write("-" * 80 + "\n")

            for idx in range(max_rows):
                row = df_clean.iloc[idx]
                row_data = []
                for col_idx, val in enumerate(row.values):
                    if pd.notna(val):
                        val_str = str(val).replace('\n', ' ').strip()
                        if len(val_str) > 30:
                            val_str = val_str[:27] + "..."
                        row_data.append(f"[{col_idx}]{val_str}")

                if row_data:
                    f.write(f"行{idx}: {' | '.join(row_data)}\n")

            f.write("\n")

    print(f"详细分析已保存到: {output_path}")

if __name__ == '__main__':
    file_path = r"C:\Users\86152\Desktop\量产零件询价单-上汽（11784737_NE22_04_7534）2025-10-11(华为项目）（成本）.xls"
    output_path = r"C:\Users\86152\Desktop\易德\saic_excel_analysis.txt"
    analyze_excel_detail(file_path, output_path)
