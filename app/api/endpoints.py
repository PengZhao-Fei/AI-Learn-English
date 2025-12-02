from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.services.llm_service import llm_service
from app.services.tts_service import tts_service
from app.models.database import get_db_connection
import sqlite3

router = APIRouter()

# --- Pydantic 模型 ---
class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None

class ChatResponse(BaseModel):
    response: str

class TTSRequest(BaseModel):
    text: str

class TTSResponse(BaseModel):
    audio_url: str

class CourseCreate(BaseModel):
    title: str
    description: str
    content: str # 要被拆分为课时/句子的原始内容

class LessonResponse(BaseModel):
    id: int
    title: str
    content: str

# --- 路由 ---

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    system_prompt = "You are a helpful English language tutor."
    if request.context:
        system_prompt += f" Context: {request.context}"
    
    response = llm_service.chat(request.message, system_prompt)
    return {"response": response}

@router.post("/tts", response_model=TTSResponse)
async def generate_speech(request: TTSRequest):
    audio_url = tts_service.generate_audio(request.text)
    if not audio_url:
        raise HTTPException(status_code=500, detail="Audio generation failed")
    return {"audio_url": audio_url}

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
