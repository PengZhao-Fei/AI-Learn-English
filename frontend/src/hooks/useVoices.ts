/**
 * Custom hook for fetching and managing TTS voices
 * 获取和管理 TTS 语音的自定义 Hook
 */
import { useCallback, useEffect, useState } from 'react'
import api from '../api'
import type { TTSVoice } from '../types'

export function useVoices() {
  const [voices, setVoices] = useState<TTSVoice[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Selected voice key, stored in localStorage
  // 选中的语音键，存储在 localStorage 中
  const [selectedVoiceKey, setSelectedVoiceKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ela-tts-voice') ?? 'auto'
    }
    return 'auto'
  })

  // Fetch voices from API | 从 API 获取语音列表
  const fetchVoices = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await api.get<TTSVoice[]>('/tts/voices')
      setVoices(Array.isArray(data) ? data : [])
    } catch (err) {
      setError('无法获取语音列表')
      console.error('Failed to fetch voices:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch voices on mount | 组件挂载时获取语音
  useEffect(() => {
    fetchVoices()
    
    // Also trigger browser voice loading (sometimes needs a moment)
    if (typeof window !== 'undefined') {
      window.speechSynthesis.getVoices()
    }
  }, [fetchVoices])

  // Handle voice selection change | 处理语音选择变更
  const handleVoiceChange = useCallback((value: string) => {
    setSelectedVoiceKey(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem('ela-tts-voice', value)
    }
  }, [])

  // Get currently selected voice object | 获取当前选中的语音对象
  const selectedVoice = voices.find((v) => v.key === selectedVoiceKey) ?? null

  // Get browser voices
  const getBrowserVoices = () => {
    if (typeof window === 'undefined') return []
    return window.speechSynthesis.getVoices()
      .filter(v => v.lang.startsWith('en'))
      .map(v => ({
        value: `browser:${v.name}`,
        label: `[Browser] ${v.name}`,
        description: '浏览器本地语音',
        isBrowser: true,
        voiceObject: v
      }))
  }

  // Build voice options for select component | 构建语音选项用于下拉选择
  const voiceOptions = [
    { value: 'auto', label: '自动检测（根据文本自动匹配语音）' },
    // Server voices
    ...[...voices]
      .sort((a, b) => {
        if (a.language === b.language) {
          return a.name.localeCompare(b.name)
        }
        return a.language.localeCompare(b.language)
      })
      .map((voice) => ({
        value: voice.key,
        label: `${voice.name} · ${voice.language.toUpperCase()} · ${voice.quality}`,
        description: voice.description
      })),
    // Browser voices
    ...getBrowserVoices()
  ]

  return {
    voices,
    isLoading,
    error,
    selectedVoiceKey,
    selectedVoice,
    voiceOptions,
    handleVoiceChange,
    refetch: fetchVoices,
  }
}
