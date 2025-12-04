import { useState, useMemo, useEffect } from "react";
import { useDisclosure } from "@heroui/react";

// Components
import Header from "./components/layout/Header";
import MainLayout from "./components/layout/MainLayout";
import CourseSidebar from "./components/features/CourseSidebar";
import LessonContent from "./components/features/LessonContent";
import AIChatPanel from "./components/features/AIChatPanel";
import SettingsModal from "./components/features/SettingsModal";

// Hooks & Types
import { useTTS, useAIChat, useVoices } from "./hooks";
import type { OutlineTrack, LessonContent as LessonContentType } from "./types";

// --- Mock Data (To be replaced with API calls if needed) ---
const outlineData: OutlineTrack[] = [
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
];

const lessonLibrary: Record<string, LessonContentType> = {
  clarity: {
    id: 'clarity',
    title: 'Pitch：清晰呈现问题与方案',
    description: '练习如何在 60 秒内说明背景、问题与解决方案，帮助学习者掌控首轮问答的节奏。',
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
};

export default function App() {
  // --- State ---
  const [activeLessonId, setActiveLessonId] = useState('clarity');
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [ttsRate, setTtsRate] = useState(1);
  
  // Settings Modal
  const { isOpen: isSettingsOpen, onOpen: onOpenSettings, onClose: onCloseSettings } = useDisclosure();

  // --- Hooks ---
  const { 
    voices, 
    selectedVoiceKey, 
    selectedVoice, 
    handleVoiceChange 
  } = useVoices();

  const { 
    // isGenerating: isTTSGenerating, // Unused
    highlightedText, 
    speakWord, 
    speakSentence 
  } = useTTS({
    selectedVoice,
    selectedVoiceKey,
    rate: ttsRate,
    onWarning: (msg) => console.warn(msg),
    onError: (msg) => console.error(msg)
  });

  const { 
    messages, 
    isLoading: isChatLoading, 
    sendMessage 
  } = useAIChat();

  // --- Derived Data ---
  const activeLesson = useMemo(() => 
    lessonLibrary[activeLessonId] ?? lessonLibrary.clarity, 
    [activeLessonId]
  );

  // --- Handlers ---
  const handleWordDoubleClick = (word: string, sentence: string) => {
    const question = `请解释 "${word}" 在句子 "${sentence}" 中的含义、语气以及可替换表达。`;
    sendMessage(question, sentence);
    speakWord(word);
    if (window.innerWidth >= 1024) {
       // Only auto-open on desktop to avoid jarring mobile experience
       // 仅在桌面端自动打开，避免移动端体验突兀
       // But user requested "right side is AI chat", so maybe we should ensure it's visible?
       // 但用户要求“右侧是 AI 对话”，所以也许我们应该确保它是可见的？
       // Let's keep it manual for mobile, auto for desktop if hidden?
       // 移动端保持手动，桌面端如果隐藏则自动打开？
    }
    setShowRightSidebar(true);
  };

  const handleSentenceAsk = (sentence: string) => {
    const question = `请帮我分析这句话的语法结构和语气，并给我一个改写建议：${sentence}`;
    sendMessage(question, sentence);
    speakSentence(sentence);
    setShowRightSidebar(true);
  };

  // Load saved rate
  useEffect(() => {
    const savedRate = localStorage.getItem('ela-tts-rate');
    if (savedRate) setTtsRate(parseFloat(savedRate));
  }, []);

  const handleRateChange = (rate: number) => {
    setTtsRate(rate);
    localStorage.setItem('ela-tts-rate', rate.toString());
  };

  return (
    <div onContextMenu={(e) => e.preventDefault()}>
      <MainLayout
        showLeftSidebar={showLeftSidebar}
        showRightSidebar={showRightSidebar}
        onCloseLeftSidebar={() => setShowLeftSidebar(false)}
        onCloseRightSidebar={() => setShowRightSidebar(false)}
        
        header={
          <Header 
            onOpenSidebar={() => setShowLeftSidebar(true)}
            onOpenChat={() => setShowRightSidebar(true)}
            onOpenSettings={onOpenSettings}
            lessonTitle={activeLesson.title}
          />
        }
        
        sidebar={
          <CourseSidebar 
            data={outlineData}
            activeLessonId={activeLessonId}
            onSelectLesson={setActiveLessonId}
            onClose={() => setShowLeftSidebar(false)}
          />
        }
        
        content={
          <LessonContent 
            content={activeLesson}
            isLoading={false}
            highlightedText={highlightedText}
            onWordClick={speakWord}
            onWordDoubleClick={handleWordDoubleClick}
            onSentenceSpeak={speakSentence}
            onSentenceAsk={handleSentenceAsk}
          />
        }
        
        chat={
          <AIChatPanel 
            messages={messages}
            isLoading={isChatLoading}
            onSendMessage={sendMessage}
            onClose={() => setShowRightSidebar(false)}
          />
        }
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={onCloseSettings}
        voices={voices}
        selectedVoiceKey={selectedVoiceKey}
        onVoiceChange={handleVoiceChange}
        ttsRate={ttsRate}
        onRateChange={handleRateChange}
      />
    </div>
  );
}
