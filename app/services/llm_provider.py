# -*- coding: utf-8 -*-
"""
LLM Provider Service - Multi-Provider AI Support
LLM 提供商服务 - 多提供商 AI 支持

Supports multiple LLM providers:
- local: Local llama.cpp model
- deepseek: DeepSeek API
- qwen: Alibaba Qwen/Tongyi API
- kimi: Moonshot Kimi K2 API
- custom: Any OpenAI-compatible endpoint

支持多种LLM提供商：本地模型、DeepSeek、千问、Kimi、自定义端点。
"""
import os
import json
import sqlite3
from typing import Optional, Generator, Dict, Any

import requests

from app.core.config import settings
from app.models.database import get_db_connection


# --- Supported Providers | 支持的提供商 ---
PROVIDER_CONFIGS = {
    "local": {
        "name": "本地模型 (Local)",
        "description": "使用本地 llama.cpp 模型 | Uses local llama.cpp model",
        "requires_key": False,
        "base_url": None,
        "default_model": None,
    },
    "deepseek": {
        "name": "DeepSeek",
        "description": "DeepSeek AI API (推荐性价比) | DeepSeek AI API (cost-effective)",
        "requires_key": True,
        "base_url": "https://api.deepseek.com/v1",
        "default_model": "deepseek-chat",
    },
    "qwen": {
        "name": "通义千问 (Qwen)",
        "description": "阿里云通义千问 | Alibaba Qwen/Tongyi",
        "requires_key": True,
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "default_model": "qwen-turbo",
    },
    "kimi": {
        "name": "Kimi K2 (Moonshot)",
        "description": "Moonshot Kimi K2 长上下文模型 | Moonshot Kimi K2 long-context",
        "requires_key": True,
        "base_url": "https://api.moonshot.cn/v1",
        "default_model": "moonshot-v1-8k",
    },
    "custom": {
        "name": "自定义 (Custom)",
        "description": "任意 OpenAI 兼容接口 | Any OpenAI-compatible endpoint",
        "requires_key": True,
        "base_url": None,  # User must provide
        "default_model": "gpt-3.5-turbo",
    },
}


class LLMProvider:
    """
    Unified LLM Provider Interface
    统一的 LLM 提供商接口
    
    Manages switching between local and cloud LLM providers.
    管理本地和云端 LLM 提供商之间的切换。
    """
    
    _instance = None
    
    @classmethod
    def get_instance(cls):
        """Singleton pattern | 单例模式"""
        if cls._instance is None:
            cls._instance = LLMProvider()
        return cls._instance
    
    def __init__(self):
        self._local_llm = None
        self._config = self._load_config()
        
        # Initialize local LLM if available | 如果可用则初始化本地 LLM
        if self._config.get("provider") == "local":
            self._init_local_llm()
    
    def _init_local_llm(self):
        """Initialize local llama.cpp model | 初始化本地 llama.cpp 模型"""
        try:
            from llama_cpp import Llama
            
            if not os.path.exists(settings.LLM_MODEL_PATH):
                print(f"[LLMProvider] Warning: Local model not found at {settings.LLM_MODEL_PATH}")
                # 警告：本地模型未在指定路径找到
                return
            
            print(f"[LLMProvider] Loading local LLM from {settings.LLM_MODEL_PATH}...")
            # 正在加载本地 LLM...
            self._local_llm = Llama(
                model_path=settings.LLM_MODEL_PATH,
                n_ctx=4096,
                n_gpu_layers=-1,  # Use GPU if available | 如果可用使用 GPU
                verbose=False
            )
            print("[LLMProvider] Local LLM loaded successfully.")
            # 本地 LLM 加载成功
        except ImportError:
            print("[LLMProvider] llama_cpp not installed. Local LLM unavailable.")
            # llama_cpp 未安装，本地 LLM 不可用
        except Exception as e:
            print(f"[LLMProvider] Failed to load local LLM: {e}")
            # 加载本地 LLM 失败
    
    def _load_config(self) -> Dict[str, Any]:
        """Load config from database | 从数据库加载配置"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            row = cursor.execute("SELECT * FROM ai_config WHERE id = 1").fetchone()
            conn.close()
            
            if row:
                return {
                    "provider": row["provider"],
                    "api_key": row["api_key"],
                    "base_url": row["base_url"],
                    "model_name": row["model_name"],
                }
        except sqlite3.OperationalError:
            # Table doesn't exist yet | 表尚不存在
            pass
        
        # Default config | 默认配置
        return {
            "provider": "local",
            "api_key": None,
            "base_url": None,
            "model_name": None,
        }
    
    def get_config(self) -> Dict[str, Any]:
        """
        Get current config (with masked API key)
        获取当前配置（API Key 部分隐藏）
        """
        # Reload config to get latest settings | 重新加载配置以获取最新设置
        self._config = self._load_config()
        
        config = self._config.copy()
        if config.get("api_key"):
            key = config["api_key"]
            # Mask middle part | 隐藏中间部分
            if len(key) > 12:
                config["api_key_masked"] = key[:6] + "****" + key[-4:]
            else:
                config["api_key_masked"] = "****"
            del config["api_key"]
        else:
            config["api_key_masked"] = None
        
        # Add provider info | 添加提供商信息
        provider_info = PROVIDER_CONFIGS.get(config["provider"], {})
        config["provider_name"] = provider_info.get("name", config["provider"])
        config["providers"] = list(PROVIDER_CONFIGS.keys())
        
        return config
    
    def update_config(self, provider: str, api_key: Optional[str] = None, 
                      base_url: Optional[str] = None, model_name: Optional[str] = None) -> bool:
        """
        Update provider configuration
        更新提供商配置
        """
        if provider not in PROVIDER_CONFIGS:
            return False
        
        # Use defaults if not provided | 如果未提供则使用默认值
        provider_defaults = PROVIDER_CONFIGS[provider]
        if not base_url and provider_defaults["base_url"]:
            base_url = provider_defaults["base_url"]
        if not model_name and provider_defaults["default_model"]:
            model_name = provider_defaults["default_model"]
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Upsert config | 插入或更新配置
            cursor.execute("""
                INSERT OR REPLACE INTO ai_config (id, provider, api_key, base_url, model_name, updated_at)
                VALUES (1, ?, ?, ?, ?, datetime('now'))
            """, (provider, api_key, base_url, model_name))
            
            conn.commit()
            conn.close()
            
            # Reload config | 重新加载配置
            self._config = self._load_config()
            
            # Reinitialize local LLM if switching to local | 切换到本地时重新初始化
            if provider == "local" and not self._local_llm:
                self._init_local_llm()
            
            return True
        except Exception as e:
            print(f"[LLMProvider] Failed to update config: {e}")
            # 更新配置失败
            return False
    
    def chat(self, message: str, system_prompt: str = "You are a helpful English tutor.") -> str:
        """
        Send a chat message and get response
        发送对话消息并获取回复
        """
        # Reload config to get latest settings | 重新加载配置以获取最新设置
        self._config = self._load_config()
        
        provider = self._config.get("provider", "local")
        
        if provider == "local":
            return self._local_chat(message, system_prompt)
        else:
            return self._cloud_chat(message, system_prompt)
    
    def _local_chat(self, message: str, system_prompt: str) -> str:
        """Chat using local llama.cpp model | 使用本地 llama.cpp 模型对话"""
        if not self._local_llm:
            return "Error: Local model not loaded. Please download a model first. | 错误：本地模型未加载，请先下载模型。"
        
        try:
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ]
            
            response = self._local_llm.create_chat_completion(
                messages=messages,
                max_tokens=1024,
                temperature=0.7,
            )
            
            return response["choices"][0]["message"]["content"]
        except Exception as e:
            return f"Error: {str(e)} | 错误：{str(e)}"
    
    def _cloud_chat(self, message: str, system_prompt: str) -> str:
        """Chat using cloud API | 使用云端 API 对话"""
        api_key = self._config.get("api_key")
        base_url = self._config.get("base_url")
        model_name = self._config.get("model_name")
        
        if not api_key:
            return "Error: API key not configured. | 错误：未配置 API Key。"
        if not base_url:
            return "Error: API URL not configured. | 错误：未配置 API URL。"
        
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            }
            
            payload = {
                "model": model_name or "gpt-3.5-turbo",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                "max_tokens": 1024,
                "temperature": 0.7,
            }
            
            url = f"{base_url.rstrip('/')}/chat/completions"
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            response.raise_for_status()
            
            data = response.json()
            return data["choices"][0]["message"]["content"]
        except requests.exceptions.Timeout:
            return "Error: Request timed out. | 错误：请求超时。"
        except requests.exceptions.HTTPError as e:
            return f"Error: API returned {e.response.status_code}. | 错误：API 返回 {e.response.status_code}。"
        except Exception as e:
            return f"Error: {str(e)} | 错误：{str(e)}"
    
    def stream_chat(self, message: str, system_prompt: str = "You are a helpful English tutor.") -> Generator[str, None, None]:
        """
        Stream chat response (for SSE)
        流式对话响应（用于 SSE）
        """
        provider = self._config.get("provider", "local")
        
        if provider == "local":
            yield from self._local_stream_chat(message, system_prompt)
        else:
            yield from self._cloud_stream_chat(message, system_prompt)
    
    def _local_stream_chat(self, message: str, system_prompt: str) -> Generator[str, None, None]:
        """Stream chat using local model | 使用本地模型流式对话"""
        if not self._local_llm:
            yield "Error: Local model not loaded. | 错误：本地模型未加载。"
            return
        
        try:
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ]
            
            response = self._local_llm.create_chat_completion(
                messages=messages,
                max_tokens=1024,
                temperature=0.7,
                stream=True
            )
            
            for chunk in response:
                delta = chunk.get("choices", [{}])[0].get("delta", {})
                content = delta.get("content", "")
                if content:
                    yield content
        except Exception as e:
            yield f"Error: {str(e)}"
    
    def _cloud_stream_chat(self, message: str, system_prompt: str) -> Generator[str, None, None]:
        """Stream chat using cloud API | 使用云端 API 流式对话"""
        api_key = self._config.get("api_key")
        base_url = self._config.get("base_url")
        model_name = self._config.get("model_name")
        
        if not api_key or not base_url:
            yield "Error: API not configured. | 错误：API 未配置。"
            return
        
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            }
            
            payload = {
                "model": model_name or "gpt-3.5-turbo",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                "max_tokens": 1024,
                "temperature": 0.7,
                "stream": True,
            }
            
            url = f"{base_url.rstrip('/')}/chat/completions"
            
            with requests.post(url, headers=headers, json=payload, stream=True, timeout=60) as response:
                response.raise_for_status()
                
                for line in response.iter_lines():
                    if line:
                        line = line.decode('utf-8')
                        if line.startswith('data: '):
                            data = line[6:]
                            if data == '[DONE]':
                                break
                            try:
                                chunk = json.loads(data)
                                content = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                                if content:
                                    yield content
                            except json.JSONDecodeError:
                                continue
        except Exception as e:
            yield f"Error: {str(e)}"
    
    def test_connection(self) -> Dict[str, Any]:
        """
        Test current provider connection
        测试当前提供商连接
        """
        # Reload config to get latest settings | 重新加载配置以获取最新设置
        self._config = self._load_config()
        
        provider = self._config.get("provider", "local")
        
        if provider == "local":
            if self._local_llm:
                return {"success": True, "message": "Local model loaded. | 本地模型已加载。"}
            else:
                return {"success": False, "message": "Local model not loaded. | 本地模型未加载。"}
        
        # Test cloud API | 测试云端 API
        try:
            response = self.chat("Hello, respond with just 'OK'.", "Respond with just 'OK'.")
            if "Error" in response:
                return {"success": False, "message": response}
            return {"success": True, "message": f"Connected! Response: {response[:50]}... | 连接成功！"}
        except Exception as e:
            return {"success": False, "message": f"Connection failed: {str(e)} | 连接失败：{str(e)}"}
    
    @property
    def model(self):
        """
        Compatibility property for CourseExpert
        为 CourseExpert 提供的兼容属性
        
        Returns an object with create_chat_completion method.
        返回具有 create_chat_completion 方法的对象。
        """
        if self._config.get("provider") == "local":
            return self._local_llm
        else:
            # Return a wrapper for cloud API | 返回云端 API 包装器
            return CloudModelWrapper(self)


class CloudModelWrapper:
    """
    Wrapper to provide llama.cpp-compatible interface for cloud APIs
    为云端 API 提供 llama.cpp 兼容接口的包装器
    """
    
    def __init__(self, provider: LLMProvider):
        self._provider = provider
    
    def create_chat_completion(self, messages: list, max_tokens: int = 1024, 
                               temperature: float = 0.7, **kwargs) -> Dict[str, Any]:
        """
        Create chat completion using cloud API
        使用云端 API 创建对话完成
        """
        # Extract last user message and system prompt | 提取最后的用户消息和系统提示
        system_prompt = ""
        user_message = ""
        
        for msg in messages:
            if msg["role"] == "system":
                system_prompt = msg["content"]
            elif msg["role"] == "user":
                user_message = msg["content"]
        
        # Call cloud API | 调用云端 API
        config = self._provider._config
        api_key = config.get("api_key")
        base_url = config.get("base_url")
        model_name = config.get("model_name")
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        
        payload = {
            "model": model_name or "gpt-3.5-turbo",
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        
        url = f"{base_url.rstrip('/')}/chat/completions"
        response = requests.post(url, headers=headers, json=payload, timeout=120)
        response.raise_for_status()
        
        return response.json()


# Singleton instance | 单例实例
llm_provider = LLMProvider.get_instance()
