import { useEffect, useRef, useState } from "react";
import { Button, ScrollShadow, Textarea } from "@heroui/react";
import { Sparkles, Send, ThumbsUp, ThumbsDown, RotateCcw, Copy, X, Mic } from "lucide-react";
import type { QaMessage } from "../../types";

interface AIChatPanelProps {
  messages: QaMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onClose?: () => void;
  pendingInput?: string;  // 待填充的输入内容 | Pending input to fill
  onPendingInputConsumed?: () => void;  // 消费后回调 | Callback after consuming
}

export default function AIChatPanel({ 
  messages, 
  isLoading, 
  onSendMessage,
  onClose,
  pendingInput,
  onPendingInputConsumed
}: AIChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom | 自动滚动到底部
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Fill input from pending | 从 pending 填充输入框
  useEffect(() => {
    if (pendingInput) {
      setInput(pendingInput);
      onPendingInputConsumed?.();
    }
  }, [pendingInput, onPendingInputConsumed]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Copy message to clipboard | 复制消息到剪贴板  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-900">
      {/* Header - minimal | 极简头部 */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-default-100">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-blue-500" />
          <span className="font-medium text-sm text-foreground">AI 助教</span>
        </div>
        {onClose && (
          <Button isIconOnly variant="light" size="sm" onPress={onClose} className="lg:hidden text-default-400">
            <X size={18} />
          </Button>
        )}
      </div>

      {/* Messages Area | 消息区域 */}
      <ScrollShadow className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {msg.role === 'user' ? (
                // User message - right aligned bubble | 用户消息 - 右对齐气泡
                <div className="flex justify-end">
                  <div className="max-w-[80%] bg-default-100 dark:bg-zinc-800 text-foreground px-4 py-2.5 rounded-2xl text-sm leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              ) : (
                // AI message - left aligned with icon | AI 消息 - 左对齐带图标
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    {/* AI Icon | AI 图标 */}
                    <div className="flex-shrink-0 mt-0.5">
                      <Sparkles size={20} className="text-blue-500" />
                    </div>
                    
                    {/* Message content | 消息内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                        {msg.content}
                      </div>
                      
                      {/* Action buttons | 操作按钮 */}
                      {msg.status === 'done' && (
                        <div className="flex items-center gap-1 mt-3">
                          <Button 
                            isIconOnly 
                            size="sm" 
                            variant="light" 
                            className="w-7 h-7 min-w-7 text-default-400 hover:text-foreground"
                          >
                            <ThumbsUp size={14} />
                          </Button>
                          <Button 
                            isIconOnly 
                            size="sm" 
                            variant="light" 
                            className="w-7 h-7 min-w-7 text-default-400 hover:text-foreground"
                          >
                            <ThumbsDown size={14} />
                          </Button>
                          <Button 
                            isIconOnly 
                            size="sm" 
                            variant="light" 
                            className="w-7 h-7 min-w-7 text-default-400 hover:text-foreground"
                          >
                            <RotateCcw size={14} />
                          </Button>
                          <Button 
                            isIconOnly 
                            size="sm" 
                            variant="light" 
                            className="w-7 h-7 min-w-7 text-default-400 hover:text-foreground"
                            onPress={() => handleCopy(msg.content)}
                          >
                            <Copy size={14} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Loading indicator | 加载指示器 */}
          {isLoading && (
            <div className="flex items-start gap-3 animate-in fade-in duration-300">
              <div className="flex-shrink-0 mt-0.5">
                <Sparkles size={20} className="text-blue-500 animate-pulse" />
              </div>
              <div className="flex gap-1 items-center py-2">
                <div className="w-1.5 h-1.5 bg-default-300 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-default-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1.5 h-1.5 bg-default-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}
          
          <div ref={scrollRef} />
        </div>
      </ScrollShadow>

      {/* Input Area - Gemini style | 输入区域 - Gemini 风格 */}
      <div className="p-4 pt-2">
        <div className="max-w-2xl mx-auto">
          <div className="relative bg-default-100 dark:bg-zinc-800 rounded-3xl border border-default-200 dark:border-zinc-700 overflow-hidden">
            <Textarea
              value={input}
              onValueChange={setInput}
              onKeyDown={handleKeyDown}
              placeholder="问问 AI 助教..."
              minRows={1}
              maxRows={4}
              classNames={{
                input: "text-sm py-3 px-1",
                inputWrapper: "bg-transparent shadow-none border-none data-[hover=true]:bg-transparent group-data-[focus=true]:bg-transparent min-h-0 !ring-0 !ring-offset-0",
                innerWrapper: "!ring-0",
                base: "!ring-0"
              }}
            />
            
            {/* Bottom toolbar | 底部工具栏 */}
            <div className="flex items-center justify-between px-3 pb-2">
              <div className="flex items-center gap-1">
                {/* Placeholder for future tools | 未来工具占位 */}
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  isIconOnly 
                  size="sm" 
                  variant="light" 
                  className="w-8 h-8 text-default-400"
                >
                  <Mic size={18} />
                </Button>
                <Button 
                  isIconOnly
                  size="sm"
                  variant="light"
                  isDisabled={!input.trim() || isLoading}
                  onPress={handleSend}
                  className={`w-8 h-8 ${input.trim() ? 'text-primary' : 'text-default-400'}`}
                >
                  <Send size={16} />
                </Button>
              </div>
            </div>
          </div>
          
          <p className="text-center text-[10px] text-default-400 mt-2">
            AI 可能会产生错误，请仔细甄别
          </p>
        </div>
      </div>
    </div>
  );
}
