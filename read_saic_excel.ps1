# 上汽报价单 Excel 解析器 (PowerShell 版本)
# 使用 COM 对象读取 .xls 文件

$filePath = "C:\Users\86152\Desktop\量产零件询价单-上汽（11784737_NE22_04_7534）2025-10-11(华为项目）（成本）.xls"

# 创建 Excel COM 对象
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "开始解析上汽报价单 Excel" -ForegroundColor Cyan
    Write-Host "========================================`n"

    # 打开工作簿
    $workbook = $excel.Workbooks.Open($filePath)

    Write-Host "文件名: $($workbook.Name)" -ForegroundColor Green
    Write-Host "工作表数量: $($workbook.Sheets.Count)`n"

    # 遍历所有工作表
    foreach ($sheet in $workbook.Sheets) {
        Write-Host "`n----------------------------------------" -ForegroundColor Yellow
        Write-Host "工作表: $($sheet.Name)" -ForegroundColor Yellow
        Write-Host "----------------------------------------"

        # 获取已使用区域
        $usedRange = $sheet.UsedRange
        $rowCount = $usedRange.Rows.Count
        $colCount = $usedRange.Columns.Count

        Write-Host "行数: $rowCount, 列数: $colCount"

        # 读取前20行数据预览
        $maxRows = [Math]::Min($rowCount, 25)
        $maxCols = [Math]::Min($colCount, 10)

        Write-Host "`n数据预览 (前 $maxRows 行, 前 $maxCols 列):" -ForegroundColor Cyan

        for ($row = 1; $row -le $maxRows; $row++) {
            $rowData = @()
            for ($col = 1; $col -le $maxCols; $col++) {
                $cellValue = $sheet.Cells.Item($row, $col).Text
                if ($cellValue) {
                    # 截断过长的内容
                    if ($cellValue.Length -gt 15) {
                        $cellValue = $cellValue.Substring(0, 12) + "..."
                    }
                    $rowData += $cellValue
                } else {
                    $rowData += ""
                }
            }
            $rowStr = $rowData -join " | "
            if ($rowStr.Trim() -ne "") {
                Write-Host "  [$row] $rowStr"
            }
        }
    }

    # 关闭工作簿
    $workbook.Close($false)

    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "解析完成!" -ForegroundColor Green
    Write-Host "========================================`n"

} catch {
    Write-Host "错误: $_" -ForegroundColor Red
} finally {
    # 退出 Excel
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
