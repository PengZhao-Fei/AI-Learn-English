# -*- coding: utf-8 -*-
"""
Course Expert Service - Professional Multi-Agent System
课程专家服务 - 专业多智能体系统

Uses a chain of specialized agents to generate high-quality bilingual courses:
1. Curriculum Designer (大纲设计师) - Plans course structure
2. Content Writer (内容撰写师) - Creates lesson content
3. Quality Reviewer (质量审核师) - Reviews and improves content

采用专业智能体链生成高质量双语课程。
"""
import json
import re
from typing import List, Optional
from pydantic import BaseModel, Field

from app.services.llm_service import llm_service


# --- Pydantic Models for Structured Output ---
# --- 结构化输出的 Pydantic 模型 ---

class LessonSchema(BaseModel):
    """Schema for a single lesson | 单个课时的模式"""
    title: str = Field(description="Lesson title in bilingual format: 'English Title | 中文标题'")
    content: str = Field(description="Full lesson content in Markdown format with bilingual content")


class CourseSchema(BaseModel):
    """Schema for a complete course | 完整课程的模式"""
    title: str = Field(description="Course title")
    description: str = Field(description="Course description explaining what students will learn")
    lessons: List[LessonSchema] = Field(description="List of lessons in the course")


# ============================================================
# AGENT PROMPTS - 智能体提示词
# ============================================================

# Agent 1: Curriculum Designer (Senior Editor & Professor)
# 智能体1：课程设计师（资深编辑与语言学教授）
CURRICULUM_DESIGNER_SYSTEM = """# Role: Senior English Textbook Editor & Professor of Linguistics
# 角色：资深英语教材编辑与语言学教授

## Profile | 简介
You are a distinguished Professor of Applied Linguistics and a Senior Editor for a top-tier 
educational publisher (Oxford/Cambridge/Pearson). You have deep expertise in TESOL, 
Second Language Acquisition (SLA), and curriculum design.

你是一位杰出的应用语言学教授，同时是顶级教育出版社的资深编辑。
你在英语教学、二语习得和课程设计方面拥有深厚专业知识。

## Constraints | 约束条件
1. **CEFR Alignment | CEFR对标**: Strictly match vocabulary/grammar to target CEFR level
2. **Scaffolding | 支架式教学**: Concepts must build logically from simple to complex
3. **Bilingual Output | 双语输出**: All titles must be in format "English | 中文"
4. **Cultural Sensitivity | 文化敏感性**: Content must be inclusive and globally appropriate

## Output Format | 输出格式
Return ONLY a JSON array of lesson titles. Each title must be bilingual.
只返回JSON数组格式的课时标题列表，每个标题必须是双语的。
"""

# Agent 2: Content Writer (ESL/EFL Textbook Writer)  
# 智能体2：内容撰写师（ESL/EFL教材作者）
CONTENT_WRITER_SYSTEM = """# Role: Professional ESL/EFL Textbook Writer
# 角色：专业ESL/EFL教材撰写师

## Profile | 简介
You are a creative and experienced content writer for English Language Teaching (ELT) materials.
You specialize in creating engaging, authentic, and level-appropriate bilingual content.

你是一位富有创意且经验丰富的英语教学内容撰写师。
你擅长创作引人入胜、真实自然且符合学习者水平的双语教材内容。

## Skills | 核心技能
- **Controlled Writing | 控制性写作**: Write compelling content using level-appropriate vocabulary
- **Graded Language | 分级语言**: Adjust complexity to match learner's CEFR level
- **Bilingual Explanation | 双语解释**: Provide natural Chinese translations for all English content
- **Engagement | 趣味性**: Make topics interesting and relevant to modern learners

## Output Structure | 输出结构
For each lesson, include:
1. **Learning Objectives | 学习目标** - What students will master (bilingual)
2. **Warm-up | 热身活动** - Engaging opener with cultural context
3. **Main Content | 主要内容**:
   - **STRICTLY INTERLEAVED DIALOGUE/PASSAGE**:
   - You MUST alternate English and Chinese for EVERY paragraph or line.
   - **REQUIRED FORMAT**:
     **Person A**: <en>English sentence.</en>
     <cn>中文翻译。</cn>
     
     **Person B**: <en>English response.</en>
     <cn>中文回答。</cn>
   - **FORBIDDEN**: Do NOT separate English and Chinese into different sections. Do NOT use headers like "Dialogue in English" or "Translation".
   
4. **Key Vocabulary | 核心词汇**:
   - English word + Pronunciation + English definition + 中文释义 + Example sentence (双语)
5. **Grammar Focus | 语法聚焦**:
   - Grammar point explained in English AND Chinese with clear examples

## Critical Rules | 关键规则
- **TAGGING REQUIREMENT | 标签要求**:
  - You MUST wrap ALL Chinese text with `<cn>` and `</cn>` tags.
  - You MUST wrap ALL English text with `<en>` and `</en>` tags.
  - For mixed content, split them strictly. Example: `<en>Hello</en><cn>你好</cn><en>World</en>`
  - Do NOT mix languages inside a single tag.
  - **FORBIDDEN FORMATS**:
    - DO NOT use `**<en>...**` or `**en**: ...`.
    - DO NOT put tags inside Markdown bold/italic markers if possible.
    - ABSOLUTELY NO `**en**: ` or `**cn**: ` prefixes.
    - **NO BLOCK TRANSLATION**: Do NOT write all English paragraphs first and then all Chinese paragraphs. You MUST interleave them.
  - **CORRECT EXAMPLE**:
    - `<en>This is a sentence.</en>`
    - `<cn>这是一个句子。</cn>`
  - **INCORRECT EXAMPLE**:
    - `**en**: This is a sentence.` (WRONG!)
    - `<en>**This is a sentence.**</en>` (Avoid if possible)

- All Chinese translations must be NATURAL and CONTEXTUAL, not word-for-word mechanical translations
- 所有中文翻译必须自然流畅、符合语境，严禁逐字机械翻译
- Use Markdown formatting for clear structure
- Ensure content is culturally appropriate for Chinese learners

## NEGATIVE CONSTRAINTS | 负面约束
- **NO CHATTER**: Do NOT output "Sure", "Here is the lesson", "Certainly".
- **START DIRECTLY**: Start the output with the Lesson Title (e.g., `# Lesson 1...`).
- **NO EXTRA TEXT**: Do not add any concluding remarks or "Hope this helps".
- **NO BLOCK TRANSLATION**: Strictly follow the "English Paragraph -> Chinese Translation" pattern.
"""

# Agent 3: Quality Reviewer (QC Specialist)
# 智能体3：质量审核师（质控专家）
QUALITY_REVIEWER_SYSTEM = """# Role: Quality Control Reviewer for ESL Textbooks
# 角色：ESL教材质量控制审核师

## Task | 任务
Review the provided English teaching content against these criteria:
审核以下英语教学内容是否符合标准：

1. **Interleaved Translation (CRITICAL)**: 
   - Check if the content uses "Block Translation" (All English then All Chinese).
   - If YES, you MUST REWRITE it to be Interleaved (English -> Chinese -> English -> Chinese).
2. **Vocabulary Check**: Verify all words match the target CEFR level.
3. **Grammar Accuracy**: Ensure all structures are correct.
4. **Translation Quality**: Check Chinese translations are natural.
5. **Tag Compliance**: Ensure all Chinese is in <cn> and English is in <en>.
6. **Vocabulary Tagging**: Ensure Key Vocabulary words are wrapped in <en>.

If issues found, REVISE the content directly. Output the improved version.
如发现问题，直接修订内容，输出改进后的版本。
"""


class CourseExpert:
    """
    Multi-Agent Course Expert System
    多智能体课程专家系统
    
    Workflow | 工作流程:
    1. Curriculum Designer creates lesson outline | 课程设计师创建课时大纲
    2. Content Writer generates each lesson | 内容撰写师撰写每个课时
    3. (Optional) Quality Reviewer polishes content | （可选）质量审核师润色内容
    """
    
    def __init__(self):
        self.llm = llm_service
    
    def _map_level_to_cefr(self, level: str) -> str:
        """Map user-friendly level names to CEFR | 将用户友好的级别名称映射到CEFR"""
        level_map = {
            "Beginner": "A1-A2",
            "Elementary": "A2",
            "Intermediate": "B1",
            "Upper-Intermediate": "B2",
            "Advanced": "C1",
            "Proficiency": "C2"
        }
        return level_map.get(level, "B1")
    
    def generate_full_course(
        self, 
        topic: str, 
        level: str = "Intermediate", 
        focus: str = "General", 
        audience: str = "General",
        target_skills: str = "General",
        learning_style: str = "Text-based",
        duration: str = "Medium",
        tone: str = "Standard",
        num_lessons: int = 5
    ) -> Optional[CourseSchema]:
        """
        Generate a complete course using multi-agent workflow.
        使用多智能体工作流生成完整课程。
        """
        if not self.llm.model:
            print("[CourseExpert] Error: LLM model not loaded")
            return None
        
        cefr_level = self._map_level_to_cefr(level)
        print(f"[CourseExpert] Starting generation for: {topic} (CEFR: {cefr_level})")
        
        # Phase 1: Curriculum Designer creates outline
        # 阶段1：课程设计师创建大纲
        print("[CourseExpert] 🎯 Phase 1: Curriculum Designer creating outline...")
        outline = self._agent_curriculum_designer(
            topic, cefr_level, focus, audience, num_lessons, 
            target_skills, learning_style, duration, tone
        )
        if not outline:
            print("[CourseExpert] Failed to generate outline")
            return None
        
        print(f"[CourseExpert] ✅ Generated {len(outline)} lesson titles")
        
        # Phase 2: Content Writer creates each lesson
        # 阶段2：内容撰写师撰写每个课时
        print("[CourseExpert] ✍️ Phase 2: Content Writer creating lessons...")
        lessons = []
        for i, title in enumerate(outline):
            print(f"[CourseExpert] Writing lesson {i+1}/{len(outline)}: {title[:40]}...")
            content = self._agent_content_writer(
                topic, title, cefr_level, focus, audience,
                target_skills, learning_style, duration, tone
            )
            
            # Phase 3: Quality Reviewer polishes content
            # 阶段3：质量审核师润色内容
            print(f"[CourseExpert] 🔍 Phase 3: Quality Reviewer checking lesson {i+1}...")
            reviewed_content = self._agent_quality_reviewer(content, cefr_level)
            if reviewed_content:
                 content = reviewed_content
                 print(f"[CourseExpert] ✅ Lesson {i+1} optimized by Quality Reviewer")
            else:
                 print(f"[CourseExpert] ⚠️ Quality Reviewer failed, using original content")

            lessons.append(LessonSchema(title=title, content=content))
        
        # Build course
        course_title = f"{topic} | {topic}课程"
        course_desc = f"""A comprehensive {cefr_level} level English course on "{topic}".
Designed for {audience.lower()} with focus on {focus.lower()} skills.
All content includes bilingual explanations for better understanding.

这是一门针对「{topic}」主题的{cefr_level}级别英语课程。
专为{audience}设计，重点培养{focus}技能。
所有内容均配有中英双语解释，便于理解。"""
        
        print(f"[CourseExpert] 🎉 Course generation complete!")
        return CourseSchema(
            title=course_title,
            description=course_desc,
            lessons=lessons
        )
    
    def _agent_curriculum_designer(
        self, topic: str, cefr_level: str, focus: str, audience: str, num_lessons: int,
        target_skills: str, learning_style: str, duration: str, tone: str
    ) -> Optional[list]:
        """
        Agent 1: Curriculum Designer - Creates course outline
        智能体1：课程设计师 - 创建课程大纲
        """
        prompt = f"""## Current Task | 当前任务

Create a {num_lessons}-lesson curriculum outline for an English course.
为一门英语课程创建{num_lessons}个课时的课程大纲。

**Course Details | 课程详情:**
- Topic | 主题: {topic}
- Target CEFR Level | 目标CEFR级别: {cefr_level}
- Learning Focus | 学习重点: {focus}
- Target Audience | 目标学员: {audience}
- Target Skills | 目标技能: {target_skills}
- Learning Style | 学习风格: {learning_style}
- Duration | 时长: {duration}
- Tone | 语气: {tone}

**Requirements | 要求:**
1. Each lesson title MUST be bilingual: "English Title | 中文标题"
2. Lessons should progress from foundational to more complex concepts (scaffolding)
3. Titles should clearly indicate what the learner will achieve
4. Vocabulary and topics must be appropriate for {cefr_level} level

**Output Format | 输出格式:**
Return ONLY a valid JSON array of strings. Example:
["Lesson 1: Basic Greetings | 基本问候", "Lesson 2: Introducing Yourself | 自我介绍"]"""

        try:
            messages = [
                {"role": "system", "content": CURRICULUM_DESIGNER_SYSTEM},
                {"role": "user", "content": prompt}
            ]
            
            response = self.llm.model.create_chat_completion(
                messages=messages,
                max_tokens=1024,
                temperature=0.7,
            )
            
            raw = response["choices"][0]["message"]["content"]
            
            # Parse JSON array
            match = re.search(r'\[[\s\S]*\]', raw)
            if match:
                return json.loads(match.group(0))
            return None
            
        except Exception as e:
            print(f"[CourseExpert] Curriculum Designer error: {e}")
            return None
    
    def _validate_tags(self, content: str) -> tuple[bool, str]:
        """
        Validate if the content strictly follows <cn> and <en> tag rules.
        Returns (is_valid, error_message).
        """
        # 1. Check for balanced tags
        if content.count('<cn>') != content.count('</cn>'):
            return False, "Unbalanced <cn> tags"
        if content.count('<en>') != content.count('</en>'):
            return False, "Unbalanced <en> tags"
            
        # 2. Check for nested tags (simple check)
        if re.search(r'<cn>[^<]*<en>', content) or re.search(r'<en>[^<]*<cn>', content):
             # This simple regex might catch valid cases if not careful, but we want strict separation
             # Actually, <cn>...<en>...</en>...</cn> is what we want to avoid.
             # Let's just check if we find a start tag inside another tag content.
             pass

        # 3. Content Validation
        # Extract all cn content
        cn_contents = re.findall(r'<cn>(.*?)</cn>', content, re.DOTALL)
        for text in cn_contents:
            # Should contain Chinese or be punctuation/numbers. 
            # If it contains significant English words, it's suspicious.
            # But sometimes we use English words in Chinese sentences (e.g. "这个App很好").
            # User said: "If mixed, split by tags". So "这个"<en>App</en>"很好" is expected.
            # So <cn> should NOT contain English words if possible.
            if re.search(r'[a-zA-Z]{2,}', text): # More than 1 letter might be an English word
                return False, f"Found English text inside <cn> tag: {text[:20]}..."

        # Extract all en content
        en_contents = re.findall(r'<en>(.*?)</en>', content, re.DOTALL)
        for text in en_contents:
            # Should NOT contain Chinese characters
            if re.search(r'[\u4e00-\u9fff]', text):
                return False, f"Found Chinese text inside <en> tag: {text[:20]}..."
                
        return True, ""

    def _agent_content_writer(
        self, topic: str, lesson_title: str, cefr_level: str, focus: str, audience: str,
        target_skills: str, learning_style: str, duration: str, tone: str
    ) -> str:
        """
        Agent 2: Content Writer - Creates lesson content
        智能体2：内容撰写师 - 撰写课时内容
        """
        prompt = f"""## Current Task | 当前任务

Write a comprehensive bilingual English lesson for Chinese learners.
为中国学习者撰写一份全面的中英双语英语课时。

**Lesson Details | 课时详情:**
- Course Topic | 课程主题: {topic}
- Lesson Title | 课时标题: {lesson_title}
- Target CEFR Level | 目标CEFR级别: {cefr_level}
- Learning Focus | 学习重点: {focus}
- Target Audience | 目标学员: {audience}
- Target Skills | 目标技能: {target_skills}
- Learning Style | 学习风格: {learning_style}
- Duration | 时长: {duration}
- Tone | 语气: {tone}

**Required Sections | 必需章节:**

### 1. Learning Objectives | 学习目标
- List 3-4 specific, measurable objectives in bilingual format
- 列出3-4个具体可衡量的学习目标（双语）

### 2. Warm-up Discussion | 热身讨论
- 2-3 engaging questions related to the topic (bilingual)
- 2-3个与主题相关的引导性问题（双语）

### 3. Main Content | 主要内容
- **STRICTLY INTERLEAVED DIALOGUE/PASSAGE**:
- You MUST alternate English and Chinese for EVERY paragraph or line.
- **REQUIRED FORMAT**:
  **Person A**: <en>English sentence.</en>
  <cn>中文翻译。</cn>
  
  **Person B**: <en>English response.</en>
  <cn>中文回答。</cn>
- **FORBIDDEN**: Do NOT separate English and Chinese into different sections. Do NOT use headers like "Dialogue in English" or "Translation".

### 4. Key Vocabulary | 核心词汇
Format each word as a LIST (do NOT use tables):
- **Word**: Definition | 中文释义
  Example: **<en>Reschedule</en>**: To change the time of a planned event | 重新安排
  Example sentence: <en>We need to reschedule the meeting.</en><cn>我们需要重新安排会议。</cn>
Present 6-8 key vocabulary items appropriate for {cefr_level} level.
**IMPORTANT**: Wrap the English word in `<en>` tags. Do NOT put the tags inside the bold markers if possible (e.g. `**<en>Word</en>**` is better than `<en>**Word**</en>`), but the system will handle both.

### 5. Grammar Focus | 语法聚焦
- Present ONE grammar point relevant to the lesson
- Explain in BOTH English and Chinese
- Provide 3 example sentences with translations
- 用中英双语讲解一个与课时相关的语法点

**Translation & Tagging Guidelines | 翻译与标签指南:**
- **STRICTLY** use `<cn>` for Chinese and `<en>` for English.
- **严禁**混淆标签。
- Translations must be natural and idiomatic Chinese.
- Format using Markdown with clear headers.
- **Avoid** putting Markdown formatting (bold/italic) *inside* `<en>` tags if possible. Put tags *inside* formatting.
  - GOOD: `**<en>Word</en>**`
  - ACCEPTABLE: `<en>**Word**</en>` (System will handle it, but less optimal)
"""

        max_retries = 3
        for attempt in range(max_retries):
            try:
                messages = [
                    {"role": "system", "content": CONTENT_WRITER_SYSTEM},
                    {"role": "user", "content": prompt}
                ]
                
                if attempt > 0:
                    messages.append({"role": "user", "content": f"Previous attempt failed validation. Please ensure STRICT adherence to <cn> and <en> tags. Error: {error_msg}"})

                response = self.llm.model.create_chat_completion(
                    messages=messages,
                    max_tokens=3000,
                    temperature=0.7,
                )
                
                content = response["choices"][0]["message"]["content"]
                
                # Post-processing: Remove chatter
                # If content starts with conversational filler, remove it.
                if not content.strip().startswith('#'):
                    match = re.search(r'(#.*)', content, re.DOTALL)
                    if match:
                        content = match.group(1)
                
                # Post-processing: Fix common tag errors and typos
                # Fix "**en**: ..." -> "<en>...</en>"
                content = re.sub(r'\*\*en\*\*:\s*(.*?)(?=\n|$)', r'<en>\1</en>', content, flags=re.IGNORECASE)
                content = re.sub(r'\*\*cn\*\*:\s*(.*?)(?=\n|$)', r'<cn>\1</cn>', content, flags=re.IGNORECASE)
                
                # Fix "Person B**:" -> "**Person B**:"
                content = re.sub(r'(?m)^([A-Za-z0-9 ]+)\*\*:', r'**\1**:', content)
                
                # Fix malformed tags (spaces)
                content = re.sub(r'<\s*en\s*>', '<en>', content, flags=re.IGNORECASE)
                content = re.sub(r'<\s*/\s*en\s*>', '</en>', content, flags=re.IGNORECASE)
                content = re.sub(r'<\s*cn\s*>', '<cn>', content, flags=re.IGNORECASE)
                content = re.sub(r'<\s*/\s*cn\s*>', '</cn>', content, flags=re.IGNORECASE)

                # Validate tags
                is_valid, error_msg = self._validate_tags(content)
                if is_valid:
                    return content
                else:
                    print(f"[CourseExpert] Validation failed (Attempt {attempt+1}): {error_msg}")
                    if attempt == max_retries - 1:
                        return content + f"\n\n<!-- Validation Warning: {error_msg} -->"
            
            except Exception as e:
                print(f"[CourseExpert] Content Writer error: {e}")
                if attempt == max_retries - 1:
                    return f"# {lesson_title}\n\n内容生成失败，请重试。\nContent generation failed. Please try again."
        
        return f"# {lesson_title}\n\nGeneration failed after retries."

    def _agent_quality_reviewer(self, content: str, cefr_level: str) -> Optional[str]:
        """
        Agent 3: Quality Reviewer - Reviews and improves content
        智能体3：质量审核师 - 审核并改进内容
        """
        prompt = f"""## Current Task | 当前任务
        
Review and improve the following English lesson content.
审核并改进以下英语课时内容。

**Target CEFR Level | 目标CEFR级别**: {cefr_level}

**Content to Review | 待审核内容**:
{content}

**Checklist | 检查清单**:
1. **Interleaved Translation (CRITICAL)**: 
   - Check if the content uses "Block Translation" (All English then All Chinese).
   - If YES, you MUST REWRITE it to be Interleaved (English -> Chinese -> English -> Chinese).
2. **Tagging**: Ensure ALL English is in `<en>` and ALL Chinese is in `<cn>`.
3. **Vocabulary**: Ensure "Key Vocabulary" words are wrapped in `<en>` tags (e.g., `**<en>Word</en>**`).
4. **Naturalness**: Ensure Chinese translations are natural.

**Output**:
Return the FULL, IMPROVED content in Markdown format.
If the content is already perfect, return it as is.
DO NOT add any conversational text like "Here is the improved version". Start with the content directly.
"""
        try:
            messages = [
                {"role": "system", "content": QUALITY_REVIEWER_SYSTEM},
                {"role": "user", "content": prompt}
            ]
            
            response = self.llm.model.create_chat_completion(
                messages=messages,
                max_tokens=3000,
                temperature=0.3, # Lower temperature for QC
            )
            
            reviewed_content = response["choices"][0]["message"]["content"]
            
            # Post-processing: Remove chatter
            if not reviewed_content.strip().startswith('#'):
                match = re.search(r'(#.*)', reviewed_content, re.DOTALL)
                if match:
                    reviewed_content = match.group(1)
            
            return reviewed_content
            
        except Exception as e:
            print(f"[CourseExpert] Quality Reviewer error: {e}")
            return None

# Singleton instance | 单例实例
course_expert = CourseExpert()
