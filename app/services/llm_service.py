# -*- coding: utf-8 -*-
"""
LLM Service - Unified LLM Interface
LLM 服务 - 统一 LLM 接口

This module acts as a facade for llm_provider, providing backward compatibility.
此模块作为 llm_provider 的门面，提供向后兼容性。
"""
from typing import Generator, Optional

from app.services.llm_provider import llm_provider, PROVIDER_CONFIGS


class LLMService:
    """
    LLM Service Facade
    LLM 服务门面
    
    Delegates all calls to llm_provider for backward compatibility.
    将所有调用委托给 llm_provider 以保持向后兼容性。
    """
    
    _instance = None
    
    @classmethod
    def get_instance(cls):
        """Singleton pattern | 单例模式"""
        if cls._instance is None:
            cls._instance = LLMService()
        return cls._instance
    
    def __init__(self):
        self._provider = llm_provider
    
    @property
    def model(self):
        """
        Get the underlying model (for CourseExpert compatibility)
        获取底层模型（为 CourseExpert 兼容）
        """
        return self._provider.model
    
    def chat(self, prompt: str, system_prompt: str = "You are a helpful English tutor.") -> str:
        """
        Send a chat message and get response
        发送对话消息并获取回复
        """
        return self._provider.chat(prompt, system_prompt)
    
    def stream_chat(self, prompt: str, system_prompt: str = "You are a helpful English tutor.") -> Generator[str, None, None]:
        """
        Stream chat response
        流式对话响应
        """
        yield from self._provider.stream_chat(prompt, system_prompt)
    
    def generate_course_outline(self, topic: str, level: str = "Intermediate", 
                                focus: str = "General", audience: str = "General") -> Optional[list]:
        """
        Generate course outline (legacy method)
        生成课程大纲（旧版方法）
        """
        import json
        import re
        
        prompt = f"""Create a 5-lesson curriculum outline for an English course about "{topic}".
Target Level: {level}
Learning Focus: {focus}
Target Audience: {audience}

Return ONLY a JSON array of lesson titles. Each title should be bilingual (English | 中文).
Example: ["Lesson 1: Basic Greetings | 基本问候", "Lesson 2: Introducing Yourself | 自我介绍"]"""

        system_prompt = "You are a curriculum designer. Return ONLY a valid JSON array, no other text."
        
        response = self.chat(prompt, system_prompt)
        
        # Parse JSON array | 解析 JSON 数组
        try:
            match = re.search(r'\[[\s\S]*\]', response)
            if match:
                return json.loads(match.group(0))
        except (json.JSONDecodeError, AttributeError):
            pass
        
        return None
    
    def generate_lesson_content(self, topic: str, lesson_title: str) -> str:
        """
        Generate lesson content (legacy method)
        生成课时内容（旧版方法）
        """
        prompt = f"""Write a comprehensive bilingual English lesson.
Topic: {topic}
Lesson Title: {lesson_title}

Include:
1. Learning Objectives (双语)
2. Main Content with dialogue/passage (<en> and <cn> tags)
3. Key Vocabulary (6-8 words)
4. Grammar Focus

Use Markdown formatting."""

        system_prompt = "You are an expert ESL textbook writer. Create engaging bilingual content."
        
        return self.chat(prompt, system_prompt)


# Singleton instance | 单例实例
llm_service = LLMService.get_instance()
