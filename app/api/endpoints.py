import io
import sqlite3
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.models.database import get_db_connection
from app.services.llm_service import llm_service
from app.services.llm_provider import llm_provider, PROVIDER_CONFIGS
from app.services.tts_service import tts_service
from app.services.course_expert import course_expert

router = APIRouter()

# --- Pydantic 模型 ---
class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None

class ChatResponse(BaseModel):
    response: str

class TTSRequest(BaseModel):
    text: str
    language: Optional[str] = None
    voice: Optional[str] = None
    speed: Optional[float] = None

class TTSVoice(BaseModel):
    key: str
    language: str
    name: str
    quality: str
    description: str

class CourseCreate(BaseModel):
    title: str
    description: str
    content: str # 要被拆分为课时/句子的原始内容

class LessonResponse(BaseModel):
    id: int
    title: str
    content: str

class GenerateCourseRequest(BaseModel):
    topic: str


# --- AI Provider 配置模型 | AI Provider Config Models ---
class AIProviderConfig(BaseModel):
    """AI 提供商配置 | AI Provider Configuration"""
    provider: str
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    model_name: Optional[str] = None


class AIProviderTestRequest(BaseModel):
    """测试连接请求 | Test Connection Request"""
    provider: Optional[str] = None  # If None, test current config | 如果为空，测试当前配置


# --- 路由 ---

# ============================================================
# AI Provider API | AI 提供商 API
# ============================================================

@router.get("/ai-provider/config")
async def get_ai_provider_config():
    """
    Get current AI provider configuration
    获取当前 AI 提供商配置
    """
    config = llm_provider.get_config()
    # Add available providers info | 添加可用提供商信息
    config["available_providers"] = [
        {
            "key": key,
            "name": info["name"],
            "description": info["description"],
            "requires_key": info["requires_key"],
            "default_model": info["default_model"],
        }
        for key, info in PROVIDER_CONFIGS.items()
    ]
    return config


@router.put("/ai-provider/config")
async def update_ai_provider_config(config: AIProviderConfig):
    """
    Update AI provider configuration
    更新 AI 提供商配置
    """
    success = llm_provider.update_config(
        provider=config.provider,
        api_key=config.api_key,
        base_url=config.base_url,
        model_name=config.model_name
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update configuration")
    
    return {"message": "Configuration updated successfully", "provider": config.provider}


@router.post("/ai-provider/test")
async def test_ai_provider_connection(request: AIProviderTestRequest = None):
    """
    Test AI provider connection
    测试 AI 提供商连接
    """
    result = llm_provider.test_connection()
    if result["success"]:
        return result
    else:
        raise HTTPException(status_code=400, detail=result["message"])


# ============================================================
# Original Routes | 原有路由
# ============================================================

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    system_prompt = "You are a helpful English language tutor."
    if request.context:
        system_prompt += f" Context: {request.context}"
    
    response = llm_service.chat(request.message, system_prompt)
    return {"response": response}

@router.get("/tts/voices", response_model=List[TTSVoice])
async def list_tts_voices():
    """列出已下载并可用的语音模型，便于前端按语言选择。"""
    return tts_service.list_voices()

@router.post("/tts")
async def generate_speech(request: TTSRequest):
    audio_bytes, voice = await tts_service.generate_audio(
        request.text, 
        language=request.language, 
        voice_key=request.voice,
        speed=request.speed
    )
    if not audio_bytes or not voice:
        raise HTTPException(status_code=500, detail="Audio generation failed")
    def _ascii(value: str) -> str:
        return value.encode("ascii", "ignore").decode("ascii")

    headers = {
        "X-Voice-Key": voice.key,
        "X-Voice-Language": voice.language,
        "X-Voice-Name": _ascii(voice.name),
        "X-Voice-Quality": voice.quality,
    }
    return StreamingResponse(
        io.BytesIO(audio_bytes),
        media_type="audio/wav",
        headers=headers,
        status_code=200,
    )

@router.get("/courses")
async def get_courses():
    conn = get_db_connection()
    courses = conn.execute("SELECT * FROM courses").fetchall()
    conn.close()
    return {"courses": [dict(c) for c in courses]}

@router.get("/courses/{course_id}/lessons")
async def get_lessons(course_id: int):
    conn = get_db_connection()
    lessons = conn.execute("SELECT * FROM lessons WHERE course_id = ?", (course_id,)).fetchall()
    conn.close()
    return {"lessons": [dict(l) for l in lessons]}

@router.delete("/courses/{course_id}")
async def delete_course(course_id: int):
    """Delete a course and all its lessons"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if course exists
        course = cursor.execute("SELECT id FROM courses WHERE id = ?", (course_id,)).fetchone()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
            
        # Delete lessons first (foreign key constraint usually handles this if ON DELETE CASCADE is set, 
        # but let's be explicit to be safe with SQLite default settings)
        cursor.execute("DELETE FROM lessons WHERE course_id = ?", (course_id,))
        
        # Delete course
        cursor.execute("DELETE FROM courses WHERE id = ?", (course_id,))
        
        conn.commit()
        return {"message": "Course deleted successfully", "id": course_id}
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete course: {str(e)}")
    finally:
        conn.close()

@router.post("/courses/init_demo")
async def init_demo_course():
    """初始化演示课程(如果为空)"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 检查是否存在
    existing = cursor.execute("SELECT * FROM courses WHERE title = 'Demo Course'").fetchone()
    if existing:
        conn.close()
        return {"message": "演示课程已存在"}
    
    cursor.execute("INSERT INTO courses (title, description) VALUES (?, ?)", 
                   ("Demo Course", "A sample course to demonstrate features."))
    course_id = cursor.lastrowid
    
    demo_text = "Hello! Welcome to your English learning assistant. Click any word to hear it. Ask the AI questions about grammar."
    cursor.execute("INSERT INTO lessons (course_id, title, content) VALUES (?, ?, ?)",
                   (course_id, "Introduction", demo_text))
    
    conn.commit()
    conn.close()
    return {"message": "演示课程已创建"}

class ImportRequest(BaseModel):
    url: str

@router.post("/courses/import")
async def import_course(request: ImportRequest):
    from app.services.content_service import content_service
    
    data = content_service.fetch_url(request.url)
    if not data:
        raise HTTPException(status_code=400, detail="Failed to fetch content from URL")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("INSERT INTO courses (title, description, source_url) VALUES (?, ?, ?)", 
                   (data["title"], f"Imported from {request.url}", request.url))
    course_id = cursor.lastrowid
    
    cursor.execute("INSERT INTO lessons (course_id, title, content) VALUES (?, ?, ?)",
                   (course_id, "Main Article", data["content"]))
    
    conn.commit()
    conn.close()
    return {"message": "Course imported successfully", "course_id": course_id}

@router.post("/courses/generate")
async def generate_course(request: GenerateCourseRequest):
    """根据主题生成课程大纲"""
    # 1. 生成大纲
    outline = llm_service.generate_course_outline(request.topic)
    if not outline:
        raise HTTPException(status_code=500, detail="Failed to generate course outline")
        
    # 2. 创建课程
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("INSERT INTO courses (title, description) VALUES (?, ?)", 
                   (f"Course: {request.topic}", f"AI generated course about {request.topic}"))
    course_id = cursor.lastrowid
    
    # 3. 创建空课时
    for title in outline:
        cursor.execute("INSERT INTO lessons (course_id, title, content) VALUES (?, ?, ?)",
                       (course_id, title, "")) # 内容暂时为空，按需生成
                       
    conn.commit()
    conn.close()
    
    return {"message": "Course generated successfully", "course_id": course_id, "lessons_count": len(outline)}

class FullCourseRequest(BaseModel):
    topic: str
    level: str = "Intermediate"
    focus: str = "General"
    audience: str = "General"
    target_skills: str = "General"
    learning_style: str = "Text-based"
    duration: str = "Medium"
    tone: str = "Standard"
    num_lessons: int = 5

@router.post("/courses/generate/full")
async def generate_full_course(request: FullCourseRequest):
    """
    Generate a complete course with all lessons using CourseExpert.
    使用课程专家一次性生成包含所有课时的完整课程。
    """
    # 1. Generate complete course with CourseExpert
    # 使用 CourseExpert 生成完整课程
    course = course_expert.generate_full_course(
        topic=request.topic,
        level=request.level,
        focus=request.focus,
        audience=request.audience,
        target_skills=request.target_skills,
        learning_style=request.learning_style,
        duration=request.duration,
        tone=request.tone,
        num_lessons=request.num_lessons
    )
    
    if not course:
        raise HTTPException(status_code=500, detail="Failed to generate course. Please try again.")
    
    # 2. Save to database in one transaction
    # 在一个事务中保存到数据库
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Insert course | 插入课程
        cursor.execute(
            "INSERT INTO courses (title, description, level, focus, audience, target_skills, learning_style, duration, tone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", 
            (course.title, course.description, request.level, request.focus, request.audience, request.target_skills, request.learning_style, request.duration, request.tone)
        )
        course_id = cursor.lastrowid
        
        # Insert all lessons | 插入所有课时
        for lesson in course.lessons:
            cursor.execute(
                "INSERT INTO lessons (course_id, title, content) VALUES (?, ?, ?)",
                (course_id, lesson.title, lesson.content)
            )
        
        conn.commit()
        
        return {
            "message": "Course generated successfully",
            "course_id": course_id,
            "lessons_count": len(course.lessons),
            "title": course.title
        }
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()

@router.get("/courses/generate/stream")
async def generate_course_stream(
    topic: str, 
    level: str = "Intermediate", 
    focus: str = "General", 
    audience: str = "General"
):
    """流式生成课程大纲 (SSE)"""
    async def event_generator():
        yield f"event: status\ndata: 正在构思课程结构 ({level}, {focus})...\n\n"
        
        # 1. 生成大纲
        try:
            yield f"event: status\ndata: 正在生成大纲内容...\n\n"
            outline = llm_service.generate_course_outline(topic, level, focus, audience)
            
            if not outline:
                yield f"event: error\ndata: 生成失败\n\n"
                return

            yield f"event: status\ndata: 正在保存课程数据...\n\n"
            
            # 2. 创建课程
            conn = get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute(
                "INSERT INTO courses (title, description, level, focus, audience) VALUES (?, ?, ?, ?, ?)", 
                (f"Course: {topic}", f"AI generated course about {topic}", level, focus, audience)
            )
            course_id = cursor.lastrowid
            
            # 3. 创建空课时
            for title in outline:
                cursor.execute("INSERT INTO lessons (course_id, title, content) VALUES (?, ?, ?)",
                            (course_id, title, ""))
                            
            conn.commit()
            conn.close()
            
            yield f"event: result\ndata: {course_id}\n\n"
            
        except Exception as e:
            yield f"event: error\ndata: {str(e)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/courses/{course_id}/lessons/{lesson_id}/generate")
async def generate_lesson_content_api(course_id: int, lesson_id: int):
    """为特定课时生成内容"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 获取课程和课时信息
    course = cursor.execute("SELECT title FROM courses WHERE id = ?", (course_id,)).fetchone()
    lesson = cursor.execute("SELECT title, content FROM lessons WHERE id = ?", (lesson_id,)).fetchone()
    
    if not course or not lesson:
        conn.close()
        raise HTTPException(status_code=404, detail="Course or Lesson not found")
        
    # 如果已有内容，直接返回（或者可以添加参数强制重新生成）
    if lesson['content'] and len(lesson['content']) > 50:
        conn.close()
        return {"message": "Content already exists", "content": lesson['content']}
        
    # 生成内容
    # 从课程标题中提取主题 (假设格式为 "Course: Topic")
    topic = course['title'].replace("Course: ", "")
    content = llm_service.generate_lesson_content(topic, lesson['title'])
    
    # 更新数据库
    cursor.execute("UPDATE lessons SET content = ? WHERE id = ?", (content, lesson_id))
    conn.commit()
    conn.close()
    
    return {"message": "Content generated successfully", "content": content}

@router.get("/courses/{course_id}/lessons/{lesson_id}/generate/stream")
async def generate_lesson_content_stream(course_id: int, lesson_id: int):
    """流式生成课时内容 (SSE)"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 获取课程和课时信息
    course = cursor.execute("SELECT title, level, focus, audience FROM courses WHERE id = ?", (course_id,)).fetchone()
    lesson = cursor.execute("SELECT title, content FROM lessons WHERE id = ?", (lesson_id,)).fetchone()
    conn.close()
    
    if not course or not lesson:
        raise HTTPException(status_code=404, detail="Course or Lesson not found")

    async def event_generator():
        topic = course['title'].replace("Course: ", "")
        lesson_title = lesson['title']
        level = course['level'] or "Intermediate"
        focus = course['focus'] or "General"
        audience = course['audience'] or "General"
        
        prompt = f"Write a comprehensive English lesson about '{lesson_title}' for the course '{topic}'.\nTarget Level: {level}\nLearning Focus: {focus}\nTarget Audience: {audience}\n\nThe lesson should include:\n1. A short dialogue or reading passage.\n2. Key vocabulary with definitions.\n3. A grammar point or usage tip.\n4. Practice sentences.\n\nFormat the output clearly with Markdown headers."
        
        full_content = ""
        
        try:
            # 流式生成
            for chunk in llm_service.stream_chat(prompt, system_prompt="You are an expert English teacher."):
                full_content += chunk
                # SSE 格式: data: <content>\n\n
                # 需要处理换行符，通常 JSON 序列化最安全
                import json
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
                
            # 生成完成，保存到数据库
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("UPDATE lessons SET content = ? WHERE id = ?", (full_content, lesson_id))
            conn.commit()
            conn.close()
            
            yield f"event: done\ndata: done\n\n"
            
        except Exception as e:
            yield f"event: error\ndata: {str(e)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
