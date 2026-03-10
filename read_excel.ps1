[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$file = 'C:\Users\86152\Desktop\2025年终板物流报价.xlsx'
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$workbook = $excel.Workbooks.Open($file)

Write-Host "=== All Sheets ==="
foreach($s in $workbook.Sheets) {
    Write-Host "Sheet: $($s.Name)"
}
Write-Host ""

foreach($sheet in $workbook.Sheets) {
    Write-Host "=== Sheet: $($sheet.Name) ==="
    for($row=1; $row -le 20; $row++) {
        $line = ""
        for($col=1; $col -le 15; $col++) {
            $val = $sheet.Cells.Item($row, $col).Text
            if($val -ne "") {
                $line += "[$col]$val | "
            }
        }
        if($line -ne "") {
            Write-Host "R$row : $line"
        }
    }
    Write-Host ""
}

$workbook.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
