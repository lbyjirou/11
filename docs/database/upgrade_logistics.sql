-- 物流价格表升级脚本
-- 用于从旧版本升级到支持送货/返货和新车型的版本
-- 执行时间: 2026-01-22

USE condenser_db;

-- 1. 添加方向字段（如果不存在）
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'condenser_db'
    AND TABLE_NAME = 'logistics_price'
    AND COLUMN_NAME = 'direction'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE logistics_price ADD COLUMN direction VARCHAR(20) DEFAULT ''OUTBOUND'' COMMENT ''方向：OUTBOUND=送货, INBOUND=返货'' AFTER id',
    'SELECT ''direction column already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. 添加出发地字段（如果不存在）
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'condenser_db'
    AND TABLE_NAME = 'logistics_price'
    AND COLUMN_NAME = 'origin'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE logistics_price ADD COLUMN origin VARCHAR(100) COMMENT ''出发地'' AFTER direction',
    'SELECT ''origin column already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. 添加13.5米车价格字段（如果不存在）
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'condenser_db'
    AND TABLE_NAME = 'logistics_price'
    AND COLUMN_NAME = 'price_13_5m'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE logistics_price ADD COLUMN price_13_5m DECIMAL(10,2) COMMENT ''13.5米车价格(元)'' AFTER price_9_6m',
    'SELECT ''price_13_5m column already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. 添加17.5米车价格字段（如果不存在）
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'condenser_db'
    AND TABLE_NAME = 'logistics_price'
    AND COLUMN_NAME = 'price_17_5m'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE logistics_price ADD COLUMN price_17_5m DECIMAL(10,2) COMMENT ''17.5米车价格(元)'' AFTER price_13_5m',
    'SELECT ''price_17_5m column already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. 添加16米厢车价格字段（如果不存在）
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'condenser_db'
    AND TABLE_NAME = 'logistics_price'
    AND COLUMN_NAME = 'price_16m_box'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE logistics_price ADD COLUMN price_16m_box DECIMAL(10,2) COMMENT ''16米厢车价格(元)'' AFTER price_17_5m',
    'SELECT ''price_16m_box column already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. 添加索引（如果不存在）
SET @index_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = 'condenser_db'
    AND TABLE_NAME = 'logistics_price'
    AND INDEX_NAME = 'idx_direction'
);
SET @sql = IF(@index_exists = 0,
    'CREATE INDEX idx_direction ON logistics_price(direction)',
    'SELECT ''idx_direction index already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = 'condenser_db'
    AND TABLE_NAME = 'logistics_price'
    AND INDEX_NAME = 'idx_origin'
);
SET @sql = IF(@index_exists = 0,
    'CREATE INDEX idx_origin ON logistics_price(origin)',
    'SELECT ''idx_origin index already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 7. 添加散货备注字段（如果不存在）
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'condenser_db'
    AND TABLE_NAME = 'logistics_price'
    AND COLUMN_NAME = 'scatter_remark'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE logistics_price ADD COLUMN scatter_remark VARCHAR(500) COMMENT ''散货备注'' AFTER min_charge_val',
    'SELECT ''scatter_remark column already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 8. 清空旧数据（可选，取消注释以执行）
-- DELETE FROM logistics_price;

-- 8. 显示表结构确认
DESCRIBE logistics_price;

SELECT '物流价格表升级完成！请重新导入Excel数据。' AS message;
