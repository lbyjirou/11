package com.gxyide.pricing.service;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.write.style.column.LongestMatchColumnWidthStyleStrategy;
import com.gxyide.pricing.vo.QuoteResultVO;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class ExportService {

    public void exportQuote(QuoteResultVO quote, HttpServletResponse response) throws IOException {
        String fileName = "报价单_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setCharacterEncoding("utf-8");
        response.setHeader("Content-disposition",
                "attachment;filename*=utf-8''" + URLEncoder.encode(fileName + ".xlsx", StandardCharsets.UTF_8));

        List<List<String>> head = buildHead();
        List<List<Object>> data = buildData(quote);

        EasyExcel.write(response.getOutputStream())
                .registerWriteHandler(new LongestMatchColumnWidthStyleStrategy())
                .head(head)
                .sheet("报价单")
                .doWrite(data);
    }

    private List<List<String>> buildHead() {
        List<List<String>> head = new ArrayList<>();
        head.add(List.of("项目"));
        head.add(List.of("名称"));
        head.add(List.of("数量"));
        head.add(List.of("单价(元)"));
        head.add(List.of("小计(元)"));
        return head;
    }

    private List<List<Object>> buildData(QuoteResultVO quote) {
        List<List<Object>> data = new ArrayList<>();

        data.add(List.of("客户", quote.getCustomerName() != null ? quote.getCustomerName() : "", "", "", ""));
        data.add(List.of("产品类型", quote.getProductType() != null ? quote.getProductType() : "", "", "", ""));
        data.add(List.of("数量", "", quote.getQuantity() != null ? quote.getQuantity() : 1, "", ""));
        data.add(List.of("铝价(元/KG)", "", "", quote.getAlPrice(), ""));
        data.add(List.of("", "", "", "", ""));

        data.add(List.of("【集流管】", "", "", "", ""));
        for (QuoteResultVO.MaterialItem item : quote.getCollectors()) {
            data.add(List.of("", item.getName(), item.getCount(), item.getUnitPrice(), item.getSubtotal()));
        }

        data.add(List.of("【翅片】", "", "", "", ""));
        for (QuoteResultVO.MaterialItem item : quote.getFins()) {
            data.add(List.of("", item.getName(), item.getCount(), item.getUnitPrice(), item.getSubtotal()));
        }

        data.add(List.of("【扁管】", "", "", "", ""));
        for (QuoteResultVO.MaterialItem item : quote.getTubes()) {
            data.add(List.of("", item.getName(), item.getCount(), item.getUnitPrice(), item.getSubtotal()));
        }

        data.add(List.of("【工序费用】", "", "", "", ""));
        for (QuoteResultVO.ProcessCostItem item : quote.getProcesses()) {
            data.add(List.of("", item.getProcessName(), item.getCount(), item.getUnitPrice(), item.getSubtotal()));
        }

        data.add(List.of("", "", "", "", ""));
        data.add(List.of("材料成本", "", "", "", quote.getMaterialCost()));
        data.add(List.of("工序成本", "", "", "", quote.getProcessCost()));
        data.add(List.of("利润", "", "", "", quote.getProfit()));
        data.add(List.of("物流费用", "", "", "", quote.getLogisticsCost()));
        data.add(List.of("总价", "", "", "", quote.getTotalPrice()));
        data.add(List.of("单价", "", "", "", quote.getUnitPrice()));

        return data;
    }
}
