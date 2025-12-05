/**
 * Custom hook for AI Chat functionality
 * AI 对话功能的自定义 Hook
 */
import { useCallback, useRef, useState } from 'react'
import api from '../api'
import type { QaMessage } from '../types'

// Generate unique message ID | 生成唯一消息 ID
const createMessageId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`

interface UseAIChatOptions {
  onError?: (message: string) => void
}

export function useAIChat(options: UseAIChatOptions = {}) {
  const { onError } = options

  const [messages, setMessages] = useState<QaMessage[]>([
    {
      id: createMessageId(),
      role: 'assistant',
      content: '你好！我是你的课程 AI 助教。点击任意单词或整句即可触发语音朗读，并把问题发送给我。我会实时解析语法、语气与表达亮点。',
      status: 'done',
    },
  ])
  const [isLoading, setIsLoading] = useState(false)

  // Streaming animation timers | 流式动画定时器
  const streamingTimers = useRef<number[]>([])

  // Simulate streaming text effect | 模拟流式文本效果
  const simulateStreaming = useCallback((text: string, messageId: string) => {
    if (!text) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, content: '（空响应）', status: 'done' } : msg,
        ),
      )
      return
    }

    let currentIndex = 0
    const chunkSize = Math.max(1, Math.round(text.length / 80))

    const timer = window.setInterval(() => {
      currentIndex = Math.min(text.length, currentIndex + chunkSize)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, content: text.slice(0, currentIndex), status: 'streaming' }
            : msg,
        ),
      )

      if (currentIndex >= text.length) {
        window.clearInterval(timer)
        streamingTimers.current = streamingTimers.current.filter((item) => item !== timer)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, status: 'done', content: text } : msg,
          ),
        )
      }
    }, 35)

    streamingTimers.current.push(timer)
  }, [])

  // Send message to AI | 发送消息给 AI
  const sendMessage = useCallback(
    async (question: string, context?: string) => {
      if (!question.trim()) {
        onError?.('请输入要提问的内容。')
        return
      }

      const userMessage: QaMessage = {
        id: createMessageId(),
        role: 'user',
        content: question.trim(),
        context,
        status: 'done',
      }
      const assistantMessageId = createMessageId()

      setMessages((prev) => [
        ...prev,
        userMessage,
        { id: assistantMessageId, role: 'assistant', content: '', status: 'streaming', context },
      ])

      setIsLoading(true)
      try {
        const { data } = await api.post('/chat', {
          message: question.trim(),
          context,
        })
        simulateStreaming(data.response ?? '暂时无法回答，请稍后重试。', assistantMessageId)
      } catch (error) {
        console.error('AI chat error:', error)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: '请求失败，请检查后端服务或稍后再试。',
                  status: 'done',
                }
              : msg,
          ),
        )
      } finally {
        setIsLoading(false)
      }
    },
    [onError, simulateStreaming],
  )

  // Clear all messages | 清空所有消息
  const clearMessages = useCallback(() => {
    // Cancel all streaming timers | 取消所有流式动画定时器
    streamingTimers.current.forEach((timer) => window.clearInterval(timer))
    streamingTimers.current = []
    
    setMessages([
      {
        id: createMessageId(),
        role: 'assistant',
        content: '已清空对话历史。有什么我可以帮助你的吗？',
        status: 'done',
      },
    ])
  }, [])

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    createMessageId,
  }
}
