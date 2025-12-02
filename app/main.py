from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.models.database import init_db
from app.api.endpoints import router as api_router
import os

app = FastAPI(title=settings.PROJECT_NAME)

app.include_router(api_router, prefix="/api")

# 挂载静态文件
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.on_event("startup")
async def startup_event():
    # 确保数据目录存在
    if not os.path.exists(settings.DATA_DIR):
        os.makedirs(settings.DATA_DIR)
    init_db()

@app.get("/")
async def root():
    return {"message": "Welcome to English Learning Assistant API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
