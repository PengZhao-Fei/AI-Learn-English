import os
from llama_cpp import Llama
from app.core.config import settings

class LLMService:
    _instance = None
    _model = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = LLMService()
        return cls._instance

    def __init__(self):
        if not os.path.exists(settings.LLM_MODEL_PATH):
            print(f"警告: LLM 模型未在 {settings.LLM_MODEL_PATH} 找到")
            self.model = None
        else:
            print(f"正在从 {settings.LLM_MODEL_PATH} 加载 LLM...")
            # n_ctx=4096 提供合适的上下文窗口
            self.model = Llama(
                model_path=settings.LLM_MODEL_PATH,
                n_ctx=4096,
                n_gpu_layers=-1, # 如果可用,将所有层卸载到 GPU(Mac 上使用 Metal)
                verbose=True
            )
            print("LLM 已加载。")

    def chat(self, prompt: str, system_prompt: str = "你是一位乐于助人的英语导师。请简洁地回答问题。") -> str:
        if not self.model:
            return "错误: 模型未加载。请先下载模型。"

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
        
        response = self.model.create_chat_completion(
            messages=messages,
            max_tokens=512,
            temperature=0.7,
        )
        
        return response["choices"][0]["message"]["content"]

llm_service = LLMService.get_instance()
