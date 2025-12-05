import { useState, useMemo, useEffect } from "react";
import { useDisclosure } from "@heroui/react";

// Components
import Header from "./components/layout/Header";
import MainLayout from "./components/layout/MainLayout";
import CourseSidebar from "./components/features/CourseSidebar";
import LessonContent from "./components/features/LessonContent";
import AIChatPanel from "./components/features/AIChatPanel";
import SettingsModal from "./components/features/SettingsModal";
import CourseGeneratorWizard from "./components/features/CourseGeneratorWizard";
import axios from "axios";

// Hooks & Types
import { useTTS, useAIChat, useVoices } from "./hooks";
import type { OutlineTrack, LessonContent as LessonContentType } from "./types";

export default function App() {
  // --- State ---
  const [activeLessonId, setActiveLessonId] = useState('');
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [ttsRate, setTtsRate] = useState(1);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [courseData, setCourseData] = useState<OutlineTrack[]>([]);
  const [dynamicLessonLibrary, setDynamicLessonLibrary] = useState<Record<string, LessonContentType>>({});
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [pendingChatInput, setPendingChatInput] = useState<string>("");  // 待填充的输入内容
  
  // Fetch courses from API
  const fetchCourses = async () => {
    try {
      const res = await axios.get("/api/courses");
      const courses = res.data.courses;
      
      // Transform to OutlineTrack format
      // Note: This is a simplified fetch. Ideally we fetch lessons for each course.
      // For now, let's assume we load lessons when needed or fetch all.
      // Let's fetch lessons for each course to build the tree.
      
      const newTracks: OutlineTrack[] = [];
      
      for (const course of courses) {
        const lessonsRes = await axios.get(`/api/courses/${course.id}/lessons`);
        const lessons = lessonsRes.data.lessons;
        
        newTracks.push({
          id: `course-${course.id}`,
          label: course.title.replace("Course: ", ""),
          level: 'Custom',
          units: lessons.map((l: any) => ({
            id: `lesson-${l.id}`,
            title: l.title,
            duration: '10 min', // Mock
            status: l.content ? 'done' : 'notStarted',
            focus: 'AI Generated'
          }))
        });
      }
      
      // Set courseData from API only
      setCourseData(newTracks);
      
      // Auto-select first lesson if none selected
      if (newTracks.length > 0 && newTracks[0].units.length > 0) {
        setActiveLessonId(prev => prev || newTracks[0].units[0].id);
      }
      
      // Also populate dynamicLessonLibrary with existing content
      const newLibrary: Record<string, LessonContentType> = {};
      for (const course of courses) {
        const lessonsRes = await axios.get(`/api/courses/${course.id}/lessons`);
        for (const l of lessonsRes.data.lessons) {
          if (l.content) {
             // Parse content if possible, or wrap in single section
             // For now, simple wrap
             newLibrary[`lesson-${l.id}`] = {
               id: `lesson-${l.id}`,
               title: l.title,
               description: "AI Generated Lesson",
               sections: [{
                 id: `section-${l.id}`,
                 title: "Lesson Content",
                 objective: "Learn via AI generated content",
                 sentences: l.content.split('\n').filter((s: string) => s.trim().length > 0).map((s: string, idx: number) => ({
                   id: `s-${l.id}-${idx}`,
                   text: s
                 }))
               }]
             };
          } else {
             // Empty content placeholder
             newLibrary[`lesson-${l.id}`] = {
               id: `lesson-${l.id}`,
               title: l.title,
               description: "Content waiting to be generated",
               sections: []
             };
          }
        }
      }
      setDynamicLessonLibrary(prev => ({...prev, ...newLibrary}));
      
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    }
  };

  const handleGenerateContent = async () => {
    if (!activeLessonId.startsWith('lesson-')) return;
    
    setIsGeneratingContent(true);
    try {
      // Extract IDs
      // activeLessonId format: lesson-{id}
      // We need courseId too. It's not directly available in ID.
      // But we can find it from courseData.
      let courseId = -1;
      let lessonId = parseInt(activeLessonId.replace('lesson-', ''));
      
      for (const track of courseData) {
        if (track.units.find(u => u.id === activeLessonId)) {
          courseId = parseInt(track.id.replace('course-', ''));
          break;
        }
      }
      
      if (courseId === -1) throw new Error("Course not found");
      
      // Use fetch for streaming response
      const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/generate/stream`);
      if (!response.body) throw new Error("No response body");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '');
            if (dataStr === 'done') break;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.chunk) {
                fullContent += data.chunk;
                
                // Update library incrementally
                setDynamicLessonLibrary(prev => ({
                  ...prev,
                  [activeLessonId]: {
                    id: activeLessonId,
                    title: prev[activeLessonId]?.title || "Lesson",
                    description: "AI Generated Lesson",
                    sections: [{
                      id: `section-${lessonId}`,
                      title: "Lesson Content",
                      objective: "Learn via AI generated content",
                      sentences: fullContent.split('\n').filter((s: string) => s.trim().length > 0).map((s: string, idx: number) => ({
                        id: `s-${lessonId}-${idx}`,
                        text: s
                      }))
                    }]
                  }
                }));
              }
            } catch (e) {
              // Ignore parse errors for partial chunks
            }
          }
        }
      }
      
    } catch (err) {
      console.error("Failed to generate content:", err);
    } finally {
      setIsGeneratingContent(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCourseGenerated = (courseId: number) => {
    console.log("Course generated:", courseId);
    fetchCourses();
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("确定要删除这个课程吗？删除后无法恢复。")) return;
    
    try {
      await axios.delete(`/api/courses/${courseId}`);
      
      // If active lesson belongs to this course, clear it
      // Simple check: if activeLessonId starts with a lesson ID that might be in this course?
      // Better: just refresh courses. If active lesson is gone, handle it.
      
      // Refresh list
      await fetchCourses();
      
      // Check if active lesson still exists in new data (we need to wait for fetchCourses to update state? 
      // fetchCourses updates state async. We can check the response there or just clear if we know.)
      // For simplicity, let's just clear active lesson if it was part of the deleted course.
      // But we don't easily know which course the active lesson belongs to without searching.
      // Let's just reset to first available if current one is invalid?
      // Actually fetchCourses handles "Auto-select first lesson if none selected" but only if activeLessonId is empty?
      // Let's just let the user select a new one or auto-select in useEffect if current becomes invalid.
      
    } catch (err) {
      console.error("Failed to delete course:", err);
      alert("删除失败，请重试");
    }
  };
  
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
    dynamicLessonLibrary[activeLessonId] ?? {
      id: 'empty',
      title: activeLessonId ? 'Loading...' : 'Please select a lesson',
      description: 'From the left sidebar, select a lesson to start, or click + to generate a new course.',
      sections: []
    }, 
    [activeLessonId, dynamicLessonLibrary]
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
    // 填充到输入框，不直接发送 | Fill input box, don't send directly
    const question = `${sentence}，这句话是什么意思你来解释一下`;
    setPendingChatInput(question);
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
            data={courseData}
            activeLessonId={activeLessonId}
            onSelectLesson={setActiveLessonId}
            onDeleteCourse={handleDeleteCourse}
            onClose={() => setShowLeftSidebar(false)}
            onOpenGenerator={() => setIsGeneratorOpen(true)}
          />
        }
        
        content={
          <LessonContent 
            content={activeLesson}
            isLoading={isGeneratingContent}
            highlightedText={highlightedText}
            onWordClick={speakWord}
            onWordDoubleClick={handleWordDoubleClick}
            onSentenceSpeak={speakSentence}
            onSentenceAsk={handleSentenceAsk}
            onGenerate={handleGenerateContent}
          />
        }
        
        chat={
          <AIChatPanel 
            messages={messages}
            isLoading={isChatLoading}
            onSendMessage={sendMessage}
            onClose={() => setShowRightSidebar(false)}
            pendingInput={pendingChatInput}
            onPendingInputConsumed={() => setPendingChatInput("")}
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
      
      <CourseGeneratorWizard 
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onCourseGenerated={handleCourseGenerated}
      />
    </div>
  );
}
