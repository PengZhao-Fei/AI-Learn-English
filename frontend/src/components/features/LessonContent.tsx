import React, { useRef, useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader, Divider, Button } from "@heroui/react";
import { ChevronRight, Volume2, MessageCircle, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import type { LessonContent } from "../../types";
import InteractiveText from "./InteractiveText";

interface LessonContentProps {
  content: LessonContent | null;
  isLoading: boolean;
  highlightedText: string | null;
  onWordClick: (word: string) => void;
  onWordDoubleClick: (word: string, sentence: string) => void;
  onSentenceSpeak: (text: string) => void;
  onSentenceAsk: (text: string) => void;
  onGenerate?: () => void;
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
  onSentenceAsk,
  onGenerate
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
  const handleWordClick = (word: string) => {
     onWordClick(word);
  };

  // Helper to clean text for TTS (remove speaker labels) | TTS文本清理（移除角色标签）
  const cleanTextForTTS = (text: string) => {
    // Matches: "A:", "**A**:", "Person A:", "**Bob**:", etc.
    // ^(\*\*?)? -> Optional bold start
    // (Person\s+[A-Z]|[A-Z][a-z]*|[A-Z]) -> Name (Person A, Name, or Single Letter)
    // (\*\*?)?: -> Optional bold end + Colon
    // \s* -> Trailing whitespace
    return text.replace(/^(\*\*?)?(Person\s+[A-Z]|[A-Z][a-z]*|[A-Z])(\*\*?)?:\s*/, '');
  };

  const handleSentenceClick = (sentence: string) => {
    onSentenceSpeak(cleanTextForTTS(sentence));
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
    onSentenceSpeak(cleanTextForTTS(contextMenu.selectedText));
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

  // Helper to render interactive text
  const renderInteractive = (text: string) => (
    <InteractiveText 
      text={text} 
      onWordClick={handleWordClick} 
      onSentenceClick={handleSentenceClick} 
    />
  );

  return (
    <>
      <div 
        ref={contentRef}
        className="w-full px-8 py-8 lg:px-12 lg:py-10"
        onContextMenu={handleContextMenu}
      >
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
         
          
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
            {content.title}
          </h1>
          
          <p className="text-default-500 text-lg mb-8 leading-relaxed">
            {content.description}
          </p>

          <Divider className="my-8" />

          <div className="space-y-8">
            {content.sections.length === 0 && onGenerate ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 p-4 bg-primary/10 rounded-full text-primary">
                  <Sparkles size={32} />
                </div>
                <h3 className="text-xl font-semibold mb-2">准备好开始学习了吗？</h3>
                <p className="text-default-500 mb-6 max-w-md">
                  AI 将为您生成本课的详细内容，包括对话、词汇和语法讲解。
                </p>
                <Button 
                  color="primary" 
                  size="lg" 
                  onPress={onGenerate}
                  startContent={<Sparkles size={20} />}
                >
                  生成课程内容
                </Button>
              </div>
            ) : (
              content.sections.map((section) => (
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
                    <div className="bg-content2/50 rounded-2xl p-6 border border-default-100 prose prose-lg dark:prose-invert max-w-none">
                      {section.sentences.map((sentence) => (
                        <div key={sentence.id} className="mb-4">
                            <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={{
                              h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-4 text-foreground" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-5 mb-3 text-foreground" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-4 mb-2 text-foreground" {...props} />,
                              p: ({node, children, ...props}) => {
                                // If children is just a string, it might be legacy content or content without tags
                                // But if we use rehype-raw, <en>...</en> inside <p> will be parsed as <en> element.
                                // So children will be an array containing the <en> element.
                                // We just render children.
                                return <p className="text-default-700 leading-relaxed mb-3" {...props}>{children}</p>;
                              },
                              ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 text-default-700" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 text-default-700" {...props} />,
                              li: ({node, children, ...props}) => {
                                return <li className="mb-1" {...props}>{children}</li>;
                              },
                              strong: ({node, ...props}) => <strong className="font-bold text-primary" {...props} />,
                              em: ({node, ...props}) => <em className="italic text-default-600" {...props} />,
                              code: ({node, ...props}) => <code className="bg-default-100 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />,
                              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary pl-4 italic text-default-600 my-4" {...props} />,
                              // Table styling
                              table: ({node, ...props}) => <div className="overflow-x-auto my-4 rounded-lg border border-default-200"><table className="w-full text-left text-sm" {...props} /></div>,
                              thead: ({node, ...props}) => <thead className="bg-default-100 text-default-700 font-semibold" {...props} />,
                              tbody: ({node, ...props}) => <tbody className="divide-y divide-default-100" {...props} />,
                              tr: ({node, ...props}) => <tr className="hover:bg-default-50/50 transition-colors" {...props} />,
                              th: ({node, ...props}) => <th className="px-4 py-3" {...props} />,
                              td: ({node, children, ...props}) => {
                                return <td className="px-4 py-3" {...props}>{children}</td>;
                              },
                              // @ts-ignore - ReactMarkdown types might not know about custom tags
                              en: ({node, children, ...props}) => {
                                // Helper to extract text from React children for TTS
                                // 从 React children 中提取文本用于 TTS
                                const extractText = (nodes: React.ReactNode): string => {
                                  if (typeof nodes === 'string') return nodes;
                                  if (typeof nodes === 'number') return String(nodes);
                                  if (Array.isArray(nodes)) return nodes.map(extractText).join('');
                                  if (React.isValidElement(nodes)) {
                                    return extractText((nodes as React.ReactElement<{ children: React.ReactNode }>).props.children);
                                  }
                                  return '';
                                };

                                // Always extract text and use InteractiveText for word-level granularity
                                // 始终提取文本并使用 InteractiveText 实现单词级交互
                                const textContent = extractText(children);
                                return renderInteractive(textContent);
                              },
                              // @ts-ignore
                              cn: ({node, children, ...props}) => {
                                return <div className="block mt-1 text-sm text-default-500 font-normal leading-relaxed px-2" {...props}>{children}</div>;
                              }
                            }}
                          >
                            {sentence.text}
                          </ReactMarkdown>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              ))
            )}
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
