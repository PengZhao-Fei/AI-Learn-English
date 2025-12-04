/**
 * Custom hook for Text-to-Speech functionality
 * 文字转语音功能的自定义 Hook
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import api from '../api'
import type { TTSVoice } from '../types'

// Language fallback mapping for browser TTS
// 浏览器 TTS 的语言回退映射
const speechLangFallback: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  zh: 'zh-CN',
}

// Detect if text is primarily Chinese | 检测文本是否主要是中文
const isChinese = (text: string): boolean => {
  // Match Chinese characters (CJK Unified Ideographs) | 匹配中文字符
  const chineseChars = text.match(/[\u4e00-\u9fff]/g) || []
  const totalChars = text.replace(/\s/g, '').length
  // If more than 30% of characters are Chinese, treat as Chinese | 如果超过30%是中文字符，视为中文
  return totalChars > 0 && chineseChars.length / totalChars > 0.3
}

// Extract only English text from mixed content | 从混合内容中提取英文文本
const extractEnglish = (text: string): string => {
  // Keep only ASCII letters, numbers, spaces, and basic punctuation
  // 只保留 ASCII 字母、数字、空格和基本标点
  return text.replace(/[\u4e00-\u9fff]/g, ' ').replace(/\s+/g, ' ').trim()
}

interface UseTTSOptions {
  selectedVoice: TTSVoice | null
  selectedVoiceKey: string
  rate?: number
  onError?: (message: string) => void
  onWarning?: (message: string) => void
}

export function useTTS(options: UseTTSOptions) {
  const { selectedVoice, selectedVoiceKey, rate = 1, onError, onWarning } = options
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [highlightedText, setHighlightedText] = useState<string | null>(null)
  
  // Audio references | 音频引用
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Cleanup audio resources | 清理音频资源
  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    speechRef.current = null
    setHighlightedText(null)
  }, [])

  // Cleanup on unmount | 卸载时清理
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  // Speak text using browser TTS with language detection
  // 使用浏览器 TTS 朗读文本，带语言检测
  const speakWithBrowserTTS = useCallback(
    (text: string, lang: string) => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = lang
        utterance.rate = rate
        speechRef.current = utterance
        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(utterance)
      }
    },
    [rate]
  )

  // Speak text using TTS API or browser fallback
  // 使用 TTS API 或浏览器回退方案朗读文本
  const speak = useCallback(
    async (text: string) => {
      if (!text.trim()) return

      const textIsChinese = isChinese(text)

      try {
        setIsGenerating(true)
        cleanup()

        // If text is Chinese, use browser TTS with Chinese voice (lowest priority)
        // 如果文本是中文，使用浏览器 TTS 中文语音（优先级最低）
        if (textIsChinese) {
          speakWithBrowserTTS(text, 'zh-CN')
          setIsGenerating(false)
          return
        }

        // For English text, try API first with user's selected voice
        // 对于英文文本，优先使用用户选择的语音调用 API
        const payload: { text: string; language?: string; voice?: string } = { text }
        if (selectedVoiceKey !== 'auto' && selectedVoice) {
          payload.language = selectedVoice.language
          payload.voice = selectedVoice.key
        }

        // Call TTS API | 调用 TTS API
        const response = await api.post<ArrayBuffer>('/tts', payload, {
          responseType: 'arraybuffer',
        })

        if (!response.data || !(response.data instanceof ArrayBuffer)) {
          throw new Error('missing audio payload')
        }

        // Play audio | 播放音频
        const audioBlob = new Blob([response.data], { type: 'audio/wav' })
        const objectUrl = URL.createObjectURL(audioBlob)
        audioUrlRef.current = objectUrl

        const audio = new Audio(objectUrl)
        audio.playbackRate = rate
        audioRef.current = audio

        await audio.play()

        audio.onended = () => {
          cleanup()
        }
      } catch (error) {
        console.error('TTS API failed, falling back to browser TTS:', error)

        // Fallback to browser TTS | 回退到浏览器 TTS
        const fallbackLang = textIsChinese
          ? 'zh-CN'
          : selectedVoice
            ? speechLangFallback[selectedVoice.language] ?? 'en-US'
            : 'en-US'
        
        speakWithBrowserTTS(text, fallbackLang)
        if (!textIsChinese) {
          onWarning?.('云端 TTS 不可用，已切换浏览器语音。')
        }
      } finally {
        setIsGenerating(false)
      }
    },
    [cleanup, onWarning, rate, selectedVoice, selectedVoiceKey, speakWithBrowserTTS],
  )

  // Speak a single word (English only) | 朗读单个单词（仅英文）
  const speakWord = useCallback(
    (word: string) => {
      // Only speak English words | 只朗读英文单词
      const cleanWord = word.replace(/[^a-zA-Z'-]/g, '')
      if (!cleanWord) return
      setHighlightedText(cleanWord)
      speak(cleanWord)
    },
    [speak],
  )

  // Speak a sentence | 朗读句子
  const speakSentence = useCallback(
    (sentence: string) => {
      speak(sentence)
    },
    [speak],
  )

  // Stop speaking | 停止朗读
  const stop = useCallback(() => {
    cleanup()
  }, [cleanup])

  return {
    isGenerating,
    highlightedText,
    setHighlightedText,
    speak,
    speakWord,
    speakSentence,
    stop,
    cleanup,
  }
}

