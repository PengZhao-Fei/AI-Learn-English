import { useRef, useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader, Chip, Divider, Button } from "@heroui/react";
import { PlayCircle, ChevronRight, Volume2, MessageCircle } from "lucide-react";
import type { LessonContent, LessonSentence } from "../../types";

interface LessonContentProps {
  content: LessonContent | null;
  isLoading: boolean;
  highlightedText: string | null;
  onWordClick: (word: string) => void;
  onWordDoubleClick: (word: string, sentence: string) => void;
  onSentenceSpeak: (text: string) => void;
  onSentenceAsk: (text: string) => void;
}

// Context menu position and state | 右键菜单位置和状态
interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  selectedText: string;
}

export default function LessonContent({
  content,
  isLoading,
  highlightedText,
  onWordClick,
  onWordDoubleClick,
  onSentenceSpeak,
  onSentenceAsk
}: LessonContentProps) {
  const wordClickTimer = useRef<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Context menu state | 右键菜单状态
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    selectedText: ''
  });

  // Handle single/double click logic for words | 处理单词的单击/双击逻辑
  const handleWordClick = (word: string, sentence: string) => {
    if (wordClickTimer.current) {
      window.clearTimeout(wordClickTimer.current);
      wordClickTimer.current = null;
      onWordDoubleClick(word, sentence); // Double click | 双击
    } else {
      wordClickTimer.current = window.setTimeout(() => {
        onWordClick(word); // Single click | 单击
        wordClickTimer.current = null;
      }, 200);
    }
  };

  // Handle right click context menu | 处理右键菜单
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (selectedText && selectedText.length > 0) {
      e.preventDefault();
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        selectedText
      });
    }
  }, []);

  // Close context menu | 关闭右键菜单
  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  // Handle menu actions | 处理菜单操作
  const handleSpeak = useCallback(() => {
    onSentenceSpeak(contextMenu.selectedText);
    closeContextMenu();
  }, [contextMenu.selectedText, onSentenceSpeak, closeContextMenu]);

  const handleAskAI = useCallback(() => {
    onSentenceAsk(contextMenu.selectedText);
    closeContextMenu();
  }, [contextMenu.selectedText, onSentenceAsk, closeContextMenu]);

  // Close menu on click outside or scroll | 点击外部或滚动时关闭菜单
  useEffect(() => {
    const handleClickOutside = () => closeContextMenu();
    const handleScroll = () => closeContextMenu();
    
    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('scroll', handleScroll, true);
      return () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [contextMenu.visible, closeContextMenu]);

  if (isLoading || !content) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-default-400">
        <div className="animate-spin mb-4">
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p>内容加载中...</p>
      </div>
    );
  }

  // Render a sentence with clickable words | 渲染带有可点击单词的句子
  const renderSentence = (sentence: LessonSentence) => {
    const tokens = sentence.text.split(/(\s+)/);
    
    return (
      <div key={sentence.id} className="mb-4">
        <div className="text-lg leading-relaxed text-default-800">
          {tokens.map((token, index) => {
            if (!token.trim()) return <span key={`${sentence.id}-${index}`}>{token}</span>;
            
            const cleanToken = token.replace(/[^a-zA-Z'-]/g, '');
            const isActive = highlightedText?.toLowerCase() === cleanToken.toLowerCase();
            
            return (
              <span
                key={`${sentence.id}-${index}`}
                className={`
                  cursor-pointer rounded px-0.5 transition-colors duration-200
                  hover:bg-primary/10 hover:text-primary
                  ${isActive ? 'bg-primary/20 text-primary font-medium' : ''}
                `}
                onClick={() => handleWordClick(token, sentence.text)}
              >
                {token}
              </span>
            );
          })}
        </div>
        
        {sentence.tip && (
          <p className="text-xs text-default-400 italic mt-1">{sentence.tip}</p>
        )}
      </div>
    );
  };

  return (
    <>
      <div 
        ref={contentRef}
        className="w-full px-8 py-8 lg:px-12 lg:py-10"
        onContextMenu={handleContextMenu}
      >
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 mb-6">
            <Chip color="primary" variant="flat" size="sm" startContent={<PlayCircle size={14} />}>
              正在学习
            </Chip>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
            {content.title}
          </h1>
          
          <p className="text-default-500 text-lg mb-8 leading-relaxed">
            {content.description}
          </p>

          <Divider className="my-8" />

          <div className="space-y-8">
            {content.sections.map((section) => (
              <Card key={section.id} className="border-none shadow-none bg-transparent" radius="none">
                <CardHeader className="px-0 pt-0 pb-4 flex-col items-start">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                    {section.title}
                  </h2>
                  <p className="text-small text-default-400 mt-1 ml-3.5">
                    目标：{section.objective}
                  </p>
                </CardHeader>
                <CardBody className="px-0 py-2 overflow-visible">
                  <div className="bg-content2/50 rounded-2xl p-6 border border-default-100">
                    {section.sentences.map(renderSentence)}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Bottom Navigation | 底部导航 */}
          <div className="mt-16 pt-8 border-t border-divider flex justify-between">
            <Button variant="ghost" color="default">
              上一节
            </Button>
            <Button color="primary" endContent={<ChevronRight size={16} />}>
              下一节
            </Button>
          </div>
        </div>
      </div>

      {/* Custom Context Menu | 自定义右键菜单 */}
      {contextMenu.visible && (
        <div
          className="fixed z-50 bg-background border border-default-200 rounded-xl shadow-xl py-1 min-w-[140px] animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-default-100 transition-colors"
            onClick={handleSpeak}
          >
            <Volume2 size={16} className="text-primary" />
            <span>朗读</span>
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-default-100 transition-colors"
            onClick={handleAskAI}
          >
            <MessageCircle size={16} className="text-secondary" />
            <span>询问 AI</span>
          </button>
        </div>
      )}
    </>
  );
}
