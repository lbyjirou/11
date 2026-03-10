"""冷凝器报价系统 - FastAPI 后端入口"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import price, spec, quote, export

app = FastAPI(
    title="冷凝器报价系统 API",
    description="提供铝价管理、规格查询、报价保存等功能",
    version="1.0.0"
)

# 允许跨域（小程序需要）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(price.router)
app.include_router(spec.router)
app.include_router(quote.router)
app.include_router(export.router)


@app.get("/", tags=["首页"])
def root():
    """API 首页"""
    return {
        "message": "冷凝器报价系统 API",
        "docs": "访问 /docs 查看接口文档"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
