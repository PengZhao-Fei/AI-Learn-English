import sqlite3
from app.core.config import settings

def get_db_connection():
    conn = sqlite3.connect(settings.DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 课程表
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        source_url TEXT,
        level TEXT,
        focus TEXT,
        audience TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # 课时表
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS lessons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        audio_path TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses (id)
    )
    ''')
    
    # 词汇表(已保存的单词)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS vocabulary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL,
        context_sentence TEXT,
        definition TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    conn.commit()
    
    # Simple migration for new columns
    try:
        cursor.execute("ALTER TABLE courses ADD COLUMN level TEXT")
    except sqlite3.OperationalError:
        pass # Column likely exists
        
    try:
        cursor.execute("ALTER TABLE courses ADD COLUMN focus TEXT")
    except sqlite3.OperationalError:
        pass
        
    try:
        cursor.execute("ALTER TABLE courses ADD COLUMN audience TEXT")
    except sqlite3.OperationalError:
        pass

    # New columns for Redesign
    try:
        cursor.execute("ALTER TABLE courses ADD COLUMN target_skills TEXT")
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute("ALTER TABLE courses ADD COLUMN learning_style TEXT")
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute("ALTER TABLE courses ADD COLUMN duration TEXT")
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute("ALTER TABLE courses ADD COLUMN tone TEXT")
    except sqlite3.OperationalError:
        pass
    
    # AI Provider 配置表 | AI Provider Config Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS ai_config (
        id INTEGER PRIMARY KEY,
        provider TEXT NOT NULL DEFAULT 'local',
        api_key TEXT,
        base_url TEXT,
        model_name TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # 插入默认 Kimi K2 配置（如果不存在）
    # Insert default Kimi K2 config if not exists
    existing = cursor.execute("SELECT id FROM ai_config WHERE id = 1").fetchone()
    if not existing:
        cursor.execute("""
            INSERT INTO ai_config (id, provider, api_key, base_url, model_name)
            VALUES (1, 'kimi', 'sk-iYgh8ZHe3Wm4JAZCJnqGWtiRqtdflgDt7kbgcDyG4uxPJVvK', 
                    'https://api.moonshot.cn/v1', 'moonshot-v1-8k')
        """)
        
    conn.commit()
    conn.close()

