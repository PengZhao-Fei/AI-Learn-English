/**
 * TypeScript type definitions for English Learning Assistant
 * 英语学习助手的 TypeScript 类型定义
 */

// Course outline unit type | 课程大纲单元类型
export type OutlineUnit = {
  id: string
  title: string
  duration: string
  status: 'notStarted' | 'inProgress' | 'done'
  focus: string
}

// Course outline track type | 课程大纲轨道类型
export type OutlineTrack = {
  id: string
  label: string
  level: string
  units: OutlineUnit[]
}

// Lesson sentence type | 课程句子类型
export type LessonSentence = {
  id: string
  text: string
  tip?: string
}

// Lesson section type | 课程章节类型
export type LessonSection = {
  id: string
  title: string
  objective: string
  sentences: LessonSentence[]
}

// Lesson content type | 课程内容类型
export type LessonContent = {
  id: string
  title: string
  description: string
  sections: LessonSection[]
}

// QA message type for AI chat | AI 对话消息类型
export type QaMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  context?: string
  status?: 'streaming' | 'done'
}

// TTS voice type | TTS 语音类型
export type TTSVoice = {
  key: string
  language: string
  name: string
  quality: string
  description: string
}
