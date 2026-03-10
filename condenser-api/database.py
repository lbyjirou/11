from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import DATABASE_URL, DB_CONFIG
import pymysql

Base = declarative_base()

def create_database_if_not_exists():
    """如果数据库不存在则创建"""
    conn = pymysql.connect(
        host=DB_CONFIG["host"],
        port=DB_CONFIG["port"],
        user=DB_CONFIG["user"],
        password=DB_CONFIG["password"],
        charset=DB_CONFIG["charset"]
    )
    cursor = conn.cursor()
    try:
        cursor.execute(
            f"CREATE DATABASE IF NOT EXISTS {DB_CONFIG['database']} "
            f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        )
    except Exception as e:
        if "already exists" in str(e):
            print(f"数据库 {DB_CONFIG['database']} 已存在，跳过创建")
        else:
            raise e
    finally:
        conn.close()

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine)

def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
