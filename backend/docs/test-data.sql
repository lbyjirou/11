-- 测试数据初始化脚本
-- 数据库：condenser_db
-- 执行前请确保已创建数据库并运行 init.sql

USE condenser_db;

-- ==================== 1. 系统配置 ====================
-- 清空后重新插入
DELETE FROM sys_config WHERE config_key IN ('ALUMINUM_PRICE', 'LOSS_RATIO', 'PROFIT_RATE');

INSERT INTO sys_config (config_key, config_value, description) VALUES
('ALUMINUM_PRICE', '20200', '铝锭价格（元/吨，存储时乘1000）'),
('LOSS_RATIO', '1.02', '损耗比'),
('PROFIT_RATE', '0.1', '利润率（10%）');

-- ==================== 2. 工序字典 ====================
-- 清空后重新插入
DELETE FROM process_dict;

INSERT INTO process_dict (process_name, unit_type, unit_price, is_active, sort_order, create_time, update_time) VALUES
('焊接', '次', 5.00, 1, 1, NOW(), NOW()),
('打磨', '次', 3.00, 1, 2, NOW(), NOW()),
('喷漆', '平方米', 8.00, 1, 3, NOW(), NOW()),
('抛光', '次', 4.00, 1, 4, NOW(), NOW()),
('组装', '台', 15.00, 1, 5, NOW(), NOW()),
('检测', '次', 2.00, 1, 6, NOW(), NOW()),
('包装', '件', 3.50, 1, 7, NOW(), NOW());

-- ==================== 3. 规格库 - 集流管 ====================
DELETE FROM base_spec WHERE type = 'COLLECTOR';

INSERT INTO base_spec (type, name, material, params, unit_price, status, create_time, update_time) VALUES
('COLLECTOR', '16x1.1', '铝合金', '{"area": 47.1239, "length": 326, "fee": 16.5}', 0, 1, NOW(), NOW()),
('COLLECTOR', '20x1.15', '铝合金', '{"area": 68.1019, "length": 364, "fee": 16.5}', 0, 1, NOW(), NOW()),
('COLLECTOR', '22x1.27', '铝合金', '{"area": 82.709, "length": 400, "fee": 16.5}', 0, 1, NOW(), NOW()),
('COLLECTOR', '25x1.5', '铝合金', '{"area": 110.684, "length": 325, "fee": 16.5}', 0, 1, NOW(), NOW()),
('COLLECTOR', '30x1.5', '铝合金', '{"area": 150, "length": 467, "fee": 16.5}', 0, 1, NOW(), NOW());

-- ==================== 4. 规格库 - 翅片 ====================
DELETE FROM base_spec WHERE type = 'FIN';

INSERT INTO base_spec (type, name, material, params, unit_price, status, create_time, update_time) VALUES
('FIN', '12mm宽', '铝箔', '{"width": 12, "waveLen": 12, "waveCount": 240, "thickness": 0.1, "fee": 7, "partFee": 0.001}', 0, 1, NOW(), NOW()),
('FIN', '16mm宽', '铝箔', '{"width": 16, "waveLen": 10, "waveCount": 209, "thickness": 0.08, "fee": 7, "partFee": 0.001}', 0, 1, NOW(), NOW()),
('FIN', '18mm宽', '铝箔', '{"width": 18, "waveLen": 16, "waveCount": 62, "thickness": 0.1, "fee": 7, "partFee": 0.001}', 0, 1, NOW(), NOW()),
('FIN', '20mm宽', '铝箔', '{"width": 20, "waveLen": 16, "waveCount": 152, "thickness": 0.1, "fee": 7, "partFee": 0.001}', 0, 1, NOW(), NOW());

-- ==================== 5. 规格库 - 扁管 ====================
DELETE FROM base_spec WHERE type = 'TUBE';

INSERT INTO base_spec (type, name, material, params, unit_price, status, create_time, update_time) VALUES
('TUBE', '12x1.4', '铝合金', '{"meterWeight": 0.027, "length": 735, "fee": 7.436, "zincFee": 11.9}', 0, 1, NOW(), NOW()),
('TUBE', '16x2', '铝合金', '{"meterWeight": 0.04, "length": 500, "fee": 7.436, "zincFee": 11.9}', 0, 1, NOW(), NOW()),
('TUBE', '18x2', '铝合金', '{"meterWeight": 0.0508, "length": 600, "fee": 7.436, "zincFee": 11.9}', 0, 1, NOW(), NOW()),
('TUBE', '20x2', '铝合金', '{"meterWeight": 0.052, "length": 488, "fee": 7.436, "zincFee": 11.9}', 0, 1, NOW(), NOW());

-- ==================== 6. 规格库 - 通用部件 ====================
DELETE FROM base_spec WHERE type = 'COMPONENT';

INSERT INTO base_spec (type, name, material, params, unit_price, status, create_time, update_time) VALUES
('COMPONENT', '接头', '铜', '{"spec": "DN15", "unitPrice": 5.5, "unit": "个"}', 5.5, 1, NOW(), NOW()),
('COMPONENT', '法兰', '不锈钢', '{"spec": "DN20", "unitPrice": 12, "unit": "个"}', 12, 1, NOW(), NOW()),
('COMPONENT', '密封圈', '橡胶', '{"spec": "通用", "unitPrice": 0.8, "unit": "个"}', 0.8, 1, NOW(), NOW()),
('COMPONENT', '支架', '镀锌钢', '{"spec": "标准", "unitPrice": 8, "unit": "套"}', 8, 1, NOW(), NOW()),
('COMPONENT', '螺丝包', '不锈钢', '{"spec": "M8套装", "unitPrice": 3, "unit": "包"}', 3, 1, NOW(), NOW());

-- ==================== 7. 物流价格（送货） ====================
DELETE FROM logistics_price WHERE direction = 'OUTBOUND';

INSERT INTO logistics_price (direction, destination, company_name, price_scatter, price_4_2m, price_6_8m, price_9_6m, min_charge_val, update_year, create_time, update_time) VALUES
('OUTBOUND', '南宁', '顺丰物流', 80, 800, 1200, 1800, 50, 2025, NOW(), NOW()),
('OUTBOUND', '南宁', '德邦快递', 70, 750, 1100, 1700, 40, 2025, NOW(), NOW()),
('OUTBOUND', '柳州', '顺丰物流', 100, 900, 1400, 2000, 60, 2025, NOW(), NOW()),
('OUTBOUND', '柳州', '德邦快递', 90, 850, 1300, 1900, 50, 2025, NOW(), NOW()),
('OUTBOUND', '桂林', '顺丰物流', 120, 1000, 1500, 2200, 70, 2025, NOW(), NOW()),
('OUTBOUND', '桂林', '德邦快递', 110, 950, 1400, 2100, 60, 2025, NOW(), NOW()),
('OUTBOUND', '北海', '顺丰物流', 150, 1200, 1800, 2500, 80, 2025, NOW(), NOW()),
('OUTBOUND', '北海', '德邦快递', 140, 1100, 1700, 2400, 70, 2025, NOW(), NOW()),
('OUTBOUND', '玉林', '顺丰物流', 130, 1100, 1600, 2300, 75, 2025, NOW(), NOW()),
('OUTBOUND', '玉林', '德邦快递', 120, 1000, 1500, 2200, 65, 2025, NOW(), NOW()),
('OUTBOUND', '贵港', '顺丰物流', 110, 950, 1450, 2100, 65, 2025, NOW(), NOW()),
('OUTBOUND', '贵港', '德邦快递', 100, 900, 1350, 2000, 55, 2025, NOW(), NOW()),
('OUTBOUND', '钦州', '顺丰物流', 140, 1150, 1750, 2450, 78, 2025, NOW(), NOW()),
('OUTBOUND', '钦州', '德邦快递', 130, 1050, 1650, 2350, 68, 2025, NOW(), NOW()),
('OUTBOUND', '百色', '顺丰物流', 160, 1300, 1900, 2700, 85, 2025, NOW(), NOW()),
('OUTBOUND', '百色', '德邦快递', 150, 1200, 1800, 2600, 75, 2025, NOW(), NOW());

-- ==================== 8. 物流价格（返货） ====================
DELETE FROM logistics_price WHERE direction = 'INBOUND';

INSERT INTO logistics_price (direction, origin, company_name, price_scatter, price_4_2m, price_6_8m, price_9_6m, min_charge_val, update_year, create_time, update_time) VALUES
('INBOUND', '南宁', '顺丰物流', 85, 820, 1220, 1820, 55, 2025, NOW(), NOW()),
('INBOUND', '南宁', '德邦快递', 75, 770, 1120, 1720, 45, 2025, NOW(), NOW()),
('INBOUND', '柳州', '顺丰物流', 105, 920, 1420, 2020, 65, 2025, NOW(), NOW()),
('INBOUND', '柳州', '德邦快递', 95, 870, 1320, 1920, 55, 2025, NOW(), NOW()),
('INBOUND', '桂林', '顺丰物流', 125, 1020, 1520, 2220, 75, 2025, NOW(), NOW()),
('INBOUND', '桂林', '德邦快递', 115, 970, 1420, 2120, 65, 2025, NOW(), NOW());

-- ==================== 验证数据 ====================
SELECT '系统配置' AS category, COUNT(*) AS count FROM sys_config
UNION ALL
SELECT '工序字典', COUNT(*) FROM process_dict
UNION ALL
SELECT '规格库', COUNT(*) FROM base_spec
UNION ALL
SELECT '物流价格', COUNT(*) FROM logistics_price;

-- 完成提示
SELECT '测试数据初始化完成！' AS message;
