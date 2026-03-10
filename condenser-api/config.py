# 数据库配置
DB_CONFIG = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "Lby15224516691",
    "database": "condenser_db",
    "charset": "utf8mb4"
}

# SQLAlchemy 连接字符串
DATABASE_URL = (
    f"mysql+pymysql://{DB_CONFIG['user']}:{DB_CONFIG['password']}"
    f"@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"
    f"?charset={DB_CONFIG['charset']}"
)

# 全局常量（来自 Excel）
AL_DENSITY = 2.75  # 铝密度 g/cm³
DIFF_RATIO = 1.0   # 理论实际差异比
LOSS_RATIO = 1.02  # 损耗比
PROFIT_RATE = 0.1  # 利润率 10%
