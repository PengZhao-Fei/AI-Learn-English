import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AudioOutlined,
  BookOutlined,
  CustomerServiceOutlined,
  LoadingOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  SendOutlined,
  SoundOutlined,
} from '@ant-design/icons'
import {
  Badge,
  Button,
  Card,
  Divider,
  Form,
  Input,
  Layout,
  List,
  message,
  Progress,
  Slider,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import api, { resolveAssetUrl } from './api'
import './App.css'

const { Header, Content, Sider } = Layout
const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

type OutlineUnit = {
  id: string
  title: string
  duration: string
  status: 'notStarted' | 'inProgress' | 'done'
  focus: string
}

type OutlineTrack = {
  id: string
  label: string
  level: string
  units: OutlineUnit[]
}

type LessonSentence = {
  id: string
  text: string
  tip?: string
}

type LessonSection = {
  id: string
  title: string
  objective: string
  sentences: LessonSentence[]
}

type LessonContent = {
  id: string
  title: string
  description: string
  sections: LessonSection[]
}

type QaMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  context?: string
  status?: 'streaming' | 'done'
}

const outline: OutlineTrack[] = [
  {
    id: 'presentation',
    label: '商务表达力',
    level: 'B2',
    units: [
      {
        id: 'clarity',
        title: 'Pitch：清晰呈现问题与方案',
        duration: '12 分钟',
        status: 'inProgress',
        focus: 'Hook + Value',
      },
      {
        id: 'storyline',
        title: 'Story：用数据讲故事',
        duration: '18 分钟',
        status: 'notStarted',
        focus: '结构化表达',
      },
    ],
  },
  {
    id: 'conversation',
    label: '情景对话',
    level: 'B1',
    units: [
      {
        id: 'escalation',
        title: 'Stakeholder 更新',
        duration: '10 分钟',
        status: 'done',
        focus: '语气控制',
      },
      {
        id: 'negotiation',
        title: '谈判：让步与共识',
        duration: '15 分钟',
        status: 'notStarted',
        focus: '观点表达',
      },
    ],
  },
]

const lessonLibrary: Record<string, LessonContent> = {
  clarity: {
    id: 'clarity',
    title: 'Pitch：清晰呈现问题与方案',
    description:
      '练习如何在 60 秒内说明背景、问题与解决方案，帮助学习者掌控首轮问答的节奏。',
    sections: [
      {
        id: 'hook',
        title: 'Hook：引入背景',
        objective: '建立共识、用数据吸引注意力',
        sentences: [
          {
            id: 'hook-1',
            text: 'Over the last quarter, onboarding completion dropped by 18%, costing us thousands of potential conversions.',
            tip: '说明数据与影响力，让听众进入情境。',
          },
          {
            id: 'hook-2',
            text: 'Users mentioned that the flow feels lengthy and transactional instead of guided.',
          },
        ],
      },
      {
        id: 'solution',
        title: 'Solution：提出方案',
        objective: '突出价值、解释关键动作',
        sentences: [
          {
            id: 'solution-1',
            text: 'We rebuilt the onboarding into three conversational checkpoints that adapt to each persona.',
          },
          {
            id: 'solution-2',
            text: 'Each checkpoint surfaces only the decision that matters, so learners never second guess what comes next.',
            tip: '强调用户体验的收益。',
          },
        ],
      },
      {
        id: 'impact',
        title: 'Impact：强化亮点',
        objective: '用证据证明方案有效',
        sentences: [
          {
            id: 'impact-1',
            text: 'In our pilot run, completion bounced back to 93% and generated 1.6x more qualified leads.',
          },
          {
            id: 'impact-2',
            text: 'The next sprint focuses on localization, so today I’d love your input on prioritizing regions.',
          },
        ],
      },
    ],
  },
  storyline: {
    id: 'storyline',
    title: 'Story：用数据讲故事',
    description: '练习从使用者视角拆解痛点、铺垫冲突并提出证据。',
    sections: [
      {
        id: 'story-1',
        title: '场景设定',
        objective: '让听众“看到”真实的使用场景',
        sentences: [
          {
            id: 'story-1-1',
            text: 'Imagine a parent who only has ten minutes between meetings to adjust their child’s study plan.',
          },
          {
            id: 'story-1-2',
            text: 'They open the dashboard and see a dense spreadsheet.',
          },
        ],
      },
    ],
  },
}

const quickPrompts = [
  '请给出更有力量的词汇替换建议',
  '帮我用更自然的语气改写这句话',
  '这句的语法风险是什么？',
]

const createMessageId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`

function App() {
  const [questionForm] = Form.useForm()
  const [activeLessonId, setActiveLessonId] = useState(outline[0].units[0].id)
  const [qaMessages, setQaMessages] = useState<QaMessage[]>([
    {
      id: createMessageId(),
      role: 'assistant',
      content: '点击任意单词或整句即可触发语音朗读，并把问题发送给我。我会实时解析语法、语气与表达亮点。',
      status: 'done',
    },
  ])
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [highlightedText, setHighlightedText] = useState<string | null>(null)
  const [ttsRate, setTtsRate] = useState(1)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamingTimers = useRef<number[]>([])
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null)
  const wordClickTimer = useRef<number | null>(null)
  const [messageApi, contextHolder] = message.useMessage()

  const activeLesson = useMemo(
    () => lessonLibrary[activeLessonId] ?? lessonLibrary.clarity,
    [activeLessonId],
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const storedRate = Number(localStorage.getItem('ela-tts-rate'))
    if (!Number.isNaN(storedRate) && storedRate >= 0.6 && storedRate <= 1.5) {
      setTtsRate(storedRate)
    }
  }, [])

  const handleRateChange = useCallback((value: number) => {
    const clamped = Math.min(1.5, Math.max(0.6, value))
    setTtsRate(clamped)
    if (typeof window !== 'undefined') {
      localStorage.setItem('ela-tts-rate', clamped.toString())
    }
  }, [])

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    speechRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      cleanupAudio()
      streamingTimers.current.forEach((timer) => window.clearInterval(timer))
      if (wordClickTimer.current) {
        window.clearTimeout(wordClickTimer.current)
        wordClickTimer.current = null
      }
    }
  }, [cleanupAudio])

  const simulateStreaming = useCallback((text: string, messageId: string) => {
    if (!text) {
      setQaMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, content: '（空响应）', status: 'done' } : msg)),
      )
      return
    }

    let currentIndex = 0
    const chunkSize = Math.max(1, Math.round(text.length / 80))

    const timer = window.setInterval(() => {
      currentIndex = Math.min(text.length, currentIndex + chunkSize)
      setQaMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, content: text.slice(0, currentIndex), status: 'streaming' } : msg,
        ),
      )

      if (currentIndex >= text.length) {
        window.clearInterval(timer)
        streamingTimers.current = streamingTimers.current.filter((item) => item !== timer)
        setQaMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? { ...msg, status: 'done', content: text } : msg)),
        )
      }
    }, 35)

    streamingTimers.current.push(timer)
  }, [])

  const speakText = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        return
      }
      try {
        setIsGeneratingAudio(true)
        cleanupAudio()
        const { data } = await api.post('/tts', { text })
        const audioUrl = data.audio_url?.startsWith('http') ? data.audio_url : data.audio_url ?? ''
        if (!audioUrl) {
          throw new Error('missing audio url')
        }
        const resolvedUrl = resolveAssetUrl(audioUrl)
        const audio = new Audio(resolvedUrl)
        audio.playbackRate = ttsRate
        audioRef.current = audio
        await audio.play()
        audio.onended = () => {
          cleanupAudio()
          setHighlightedText(null)
        }
      } catch (error) {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text)
          utterance.lang = 'en-US'
          utterance.rate = ttsRate
          speechRef.current = utterance
          window.speechSynthesis.cancel()
          window.speechSynthesis.speak(utterance)
          messageApi.warning('云端 TTS 不可用，已切换浏览器语音。')
        } else {
          messageApi.error('语音朗读失败，请稍后再试。')
        }
      } finally {
        setIsGeneratingAudio(false)
      }
    },
    [cleanupAudio, messageApi, ttsRate],
  )

  const askAssistant = useCallback(
    async (question: string, context?: string) => {
      if (!question.trim()) {
        messageApi.warning('请输入要提问的内容。')
        return
      }

      const userMessage: QaMessage = {
        id: createMessageId(),
        role: 'user',
        content: question.trim(),
        context,
      }
      const assistantMessageId = createMessageId()

      setQaMessages((prev) => [
        ...prev,
        userMessage,
        { id: assistantMessageId, role: 'assistant', content: '', status: 'streaming', context },
      ])

      setIsLoadingAnswer(true)
      try {
        const { data } = await api.post('/chat', {
          message: question.trim(),
          context,
        })
        simulateStreaming(data.response ?? '暂时无法回答，请稍后重试。', assistantMessageId)
      } catch (error) {
        setQaMessages((prev) =>
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
        setIsLoadingAnswer(false)
      }
    },
    [messageApi, simulateStreaming],
  )

  const handleWordSpeak = useCallback(
    (word: string) => {
      const cleanWord = word.replace(/[^a-zA-Z'-]/g, '')
      if (!cleanWord) {
        return
      }
      speakText(cleanWord)
    },
    [speakText],
  )

  const handleWordAsk = useCallback(
    (word: string, sentence: string) => {
      const cleanWord = word.replace(/[^a-zA-Z'-]/g, '')
      if (!cleanWord) {
        return
      }
      const autoQuestion = `请解释 "${cleanWord}" 在句子 "${sentence}" 中的含义、语气以及可替换表达。`
      setHighlightedText(cleanWord)
      questionForm.setFieldsValue({ question: autoQuestion, context: sentence })
      speakText(cleanWord)
      askAssistant(autoQuestion, sentence)
    },
    [askAssistant, questionForm, speakText],
  )

  const handleWordSingleClick = useCallback(
    (word: string) => {
      if (wordClickTimer.current) {
        window.clearTimeout(wordClickTimer.current)
      }
      wordClickTimer.current = window.setTimeout(() => {
        handleWordSpeak(word)
        wordClickTimer.current = null
      }, 180)
    },
    [handleWordSpeak],
  )

  const handleWordDoubleClick = useCallback(
    (word: string, sentence: string) => {
      if (wordClickTimer.current) {
        window.clearTimeout(wordClickTimer.current)
        wordClickTimer.current = null
      }
      handleWordAsk(word, sentence)
    },
    [handleWordAsk],
  )

  const handleSentenceAsk = useCallback(
    (sentence: string) => {
      const question = `请帮我分析这句话的语法结构和语气，并给我一个改写建议：${sentence}`
      questionForm.setFieldsValue({ question, context: sentence })
      speakText(sentence)
      askAssistant(question, sentence)
    },
    [askAssistant, questionForm, speakText],
  )

  const handleManualSubmit = useCallback(
    (values: { question?: string; context?: string }) => {
      askAssistant(values.question ?? '', values.context)
      questionForm.resetFields()
    },
    [askAssistant, questionForm],
  )

  const renderSentence = (sentence: LessonSentence) => {
    const tokens = sentence.text.split(/(\s+)/)
    return (
      <div key={sentence.id} className="lesson-sentence">
        <Paragraph className="sentence-text">
          {tokens.map((token, index) => {
            if (!token.trim()) {
              return <span key={`${sentence.id}-${index}`}>{token}</span>
            }
            const isActive = highlightedText?.toLowerCase() === token.toLowerCase().replace(/[^a-zA-Z'-]/g, '')
            return (
              <Tooltip title="单击朗读 · 双击追问 AI" key={`${sentence.id}-${index}`}>
                <button
                  type="button"
                  className={`sentence-token ${isActive ? 'active' : ''}`}
                  onClick={() => handleWordSingleClick(token)}
                  onDoubleClick={() => handleWordDoubleClick(token, sentence.text)}
                >
                  {token}
                </button>
              </Tooltip>
            )
          })}
        </Paragraph>
        <Space size="small">
          <Button
            size="small"
            type="link"
            icon={<SoundOutlined />}
            onClick={() => speakText(sentence.text)}
          >
            朗读整句
          </Button>
          <Button size="small" type="link" icon={<CustomerServiceOutlined />} onClick={() => handleSentenceAsk(sentence.text)}>
            追问 AI
          </Button>
        </Space>
        {sentence.tip && (
          <Text type="secondary" className="sentence-tip">
            {sentence.tip}
          </Text>
        )}
      </div>
    )
  }

  return (
    <Layout className="learning-layout">
      {contextHolder}
      <Header className="learning-header">
        <Space size="large">
          <BookOutlined className="header-icon" />
          <div>
            <Title level={3} style={{ marginBottom: 0 }}>
              English Learning Assistant
            </Title>
            <Text type="secondary">左侧大纲 · 中部精读 · 右侧 AI 答疑 / 语音朗读</Text>
          </div>
        </Space>
        <Space>
          <Button icon={<AudioOutlined />} disabled={isGeneratingAudio}>
            {isGeneratingAudio ? '生成语音中...' : '批量朗读'}
          </Button>
          <Button type="primary" icon={<PlayCircleOutlined />}>
            开始课程
          </Button>
        </Space>
      </Header>

      <Layout className="learning-body">
        <Sider width={300} className="learning-sider">
          <Title level={4}>课程大纲</Title>
          <List
            dataSource={outline}
            split={false}
            renderItem={(track) => (
              <List.Item key={track.id} className="outline-track">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space align="baseline" className="track-title">
                    <Text strong>{track.label}</Text>
                    <Tag color="blue">{track.level}</Tag>
                  </Space>
                  <List
                    dataSource={track.units}
                    split={false}
                    renderItem={(unit) => (
                      <List.Item
                        key={unit.id}
                        className={`outline-unit ${activeLessonId === unit.id ? 'selected' : ''}`}
                        onClick={() => setActiveLessonId(unit.id)}
                      >
                        <Space direction="vertical" size={2}>
                          <Space align="center">
                            <Text strong>{unit.title}</Text>
                            <Tag color={unit.status === 'done' ? 'success' : unit.status === 'inProgress' ? 'processing' : 'default'}>
                              {unit.status === 'done'
                                ? '已完成'
                                : unit.status === 'inProgress'
                                  ? '进行中'
                                  : '未开始'}
                            </Tag>
                          </Space>
                          <Space size="small">
                            <Text type="secondary">{unit.duration}</Text>
                            <Badge color="#2f54eb" />
                            <Text type="secondary">{unit.focus}</Text>
                          </Space>
                        </Space>
                      </List.Item>
                    )}
                  />
                </Space>
              </List.Item>
            )}
          />
        </Sider>

        <Content className="learning-content">
          <Card className="lesson-card" title={activeLesson.title} extra={<Tag color="purple">精读中</Tag>}>
            <Paragraph type="secondary" style={{ marginBottom: 24 }}>
              {activeLesson.description}
            </Paragraph>
            {activeLesson.sections.map((section) => (
              <Card
                key={section.id}
                type="inner"
                title={
                  <Space direction="vertical" size={0}>
                    <Text strong>{section.title}</Text>
                    <Text type="secondary">{section.objective}</Text>
                  </Space>
                }
                className="section-card"
              >
                {section.sentences.map((sentence) => renderSentence(sentence))}
              </Card>
            ))}
          </Card>
        </Content>

        <Sider width={360} className="learning-sider qa-panel">
          <Card
            title={
              <Space>
                <CustomerServiceOutlined />
                AI 问答
              </Space>
            }
            extra={
              <Tag color={isLoadingAnswer ? 'processing' : 'default'}>
                {isLoadingAnswer ? (
                  <Space size={4}>
                    <LoadingOutlined />
                    流式输出中
                  </Space>
                ) : (
                  '等待提问'
                )}
              </Tag>
            }
            className="qa-card"
          >
            <div className="qa-messages">
              {qaMessages.map((msg) => (
                <div key={msg.id} className={`qa-message ${msg.role}`}>
                  <Space align="start">
                    <Badge status={msg.role === 'assistant' ? 'processing' : 'default'} />
                    <div>
                      <Text strong>{msg.role === 'assistant' ? 'AI 助教' : '我'}</Text>
                      {msg.context && (
                        <Paragraph className="qa-context" type="secondary">
                          {msg.context}
                        </Paragraph>
                      )}
                      <Paragraph className="qa-content">{msg.content}</Paragraph>
                      {msg.status === 'streaming' && <Progress percent={70} showInfo={false} size="small" status="active" />}
                    </div>
                  </Space>
                </div>
              ))}
            </div>
            <Divider />
            <Form layout="vertical" form={questionForm} onFinish={handleManualSubmit} autoComplete="off">
              <Form.Item name="question" label="向 AI 提问" rules={[{ required: true, message: '请输入问题' }]}>
                <TextArea rows={3} placeholder="例如：这句话有没有更自然的说法？" allowClear />
              </Form.Item>
              <Form.Item name="context" label="上下文（可选）">
                <Input placeholder="可输入场景、情绪或你想达到的效果" allowClear />
              </Form.Item>
              <Form.Item label="语速设置">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Slider
                    min={0.6}
                    max={1.5}
                    step={0.05}
                    value={ttsRate}
                    onChange={handleRateChange}
                    tooltip={{ formatter: (value) => `${value?.toFixed(2)}x` }}
                  />
                  <Text type="secondary">当前语速：{ttsRate.toFixed(2)}x</Text>
                </Space>
              </Form.Item>
              <Space wrap>
                <Button type="primary" icon={<SendOutlined />} htmlType="submit" loading={isLoadingAnswer}>
                  发送
                </Button>
                <Button icon={<PauseCircleOutlined />} onClick={cleanupAudio}>
                  停止朗读
                </Button>
                <Tooltip title="随机挑选一个建议问题">
                  <Button
                    icon={<LoadingOutlined />}
                    onClick={() => {
                      const suggestion = quickPrompts[Math.floor(Math.random() * quickPrompts.length)]
                      questionForm.setFieldsValue({ question: suggestion, context: activeLesson.title })
                    }}
                  >
                    换一个灵感
                  </Button>
                </Tooltip>
              </Space>
            </Form>
            <Divider />
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">快捷提问：</Text>
              <Space wrap>
                {quickPrompts.map((prompt) => (
                  <Button
                    key={prompt}
                    size="small"
                    ghost
                    onClick={() => askAssistant(prompt, activeLesson.title)}
                  >
                    {prompt}
                  </Button>
                ))}
              </Space>
            </Space>
          </Card>
        </Sider>
      </Layout>
    </Layout>
  )
}

export default App
