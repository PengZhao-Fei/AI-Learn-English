import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "English Learning Assistant"
    API_V1_STR: str = "/api/v1"
    
    # 路径配置
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    DATA_DIR: str = os.path.join(BASE_DIR, "data")
    # 模型路径
    MODEL_DIR: str = os.path.join(DATA_DIR, "models")
    TTS_MODEL_PATH: str = os.path.join(MODEL_DIR, "tts")
    DB_PATH: str = os.path.join(DATA_DIR, "learning.db")
    
    @property
    def LLM_MODEL_PATH(self) -> str:
        llm_dir = os.path.join(self.MODEL_DIR, "llm")
        info_path = os.path.join(llm_dir, "model_info.txt")
        if os.path.exists(info_path):
            with open(info_path, "r") as f:
                filename = f.read().strip()
                return os.path.join(llm_dir, filename)
        
        # 回退方案: 查找任何 .gguf 文件
        if os.path.exists(llm_dir):
            files = [f for f in os.listdir(llm_dir) if f.endswith(".gguf")]
            if files:
                # 优先选择看起来像主文件的(例如不是 part 2)
                # 但如果我们有 model_info.txt 就没问题
                # 如果没有,只返回第一个
                return os.path.join(llm_dir, files[0])
        
        return os.path.join(llm_dir, "model.gguf")
    
    class Config:
        case_sensitive = True

settings = Settings()
