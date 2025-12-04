import { useState, useCallback, useRef, useEffect } from "react";
import type { ReactNode } from "react";

interface MainLayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  content: ReactNode;
  chat: ReactNode;
  showLeftSidebar: boolean;
  showRightSidebar: boolean;
  onCloseLeftSidebar: () => void;
  onCloseRightSidebar: () => void;
}

export default function MainLayout({
  header,
  sidebar,
  content,
  chat,
  showLeftSidebar,
  showRightSidebar,
  onCloseLeftSidebar,
  onCloseRightSidebar
}: MainLayoutProps) {
  // Resizable chat panel width | 可调节的聊天面板宽度
  const [chatWidth, setChatWidth] = useState(360);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  // Handle mouse down on resize handle | 处理鼠标按下调节手柄
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = chatWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [chatWidth]);

  // Handle mouse move for resizing | 处理鼠标移动调节宽度
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      
      const diff = startX.current - e.clientX;
      const newWidth = Math.min(Math.max(startWidth.current + diff, 280), 600);
      setChatWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className="h-screen w-full bg-background flex flex-col font-sans text-foreground overflow-hidden">
      {/* Top Header | 顶部导航 */}
      {header}

      {/* Main Body | 主体内容 */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Sidebar (Course Outline) | 左侧边栏（课程大纲） */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-72 bg-background border-r border-divider transform transition-transform duration-300 ease-in-out flex flex-col
          ${showLeftSidebar ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:w-72 flex-shrink-0
        `}>
          {sidebar}
        </aside>

        {/* Mobile Overlay for Left Sidebar | 左侧边栏移动端遮罩 */}
        {showLeftSidebar && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
            onClick={onCloseLeftSidebar}
          />
        )}

        {/* Center Content (Lesson) | 中间内容（课程） */}
        <main className="flex-1 overflow-y-auto bg-background relative w-full scroll-smooth">
          {content}
        </main>

        {/* Right Sidebar (AI Chat) with Resizable Width | 右侧边栏（AI对话）可调节宽度 */}
        <aside 
          className={`
            fixed inset-y-0 right-0 z-40 bg-background border-l border-divider transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none
            ${showRightSidebar ? 'translate-x-0' : 'translate-x-full'}
            lg:relative lg:translate-x-0 flex-shrink-0
          `}
          style={{ width: window.innerWidth >= 1024 ? chatWidth : '100%' }}
        >
          {/* Resize Handle | 调节宽度手柄 */}
          <div 
            className="resize-handle hidden lg:block"
            onMouseDown={handleMouseDown}
          />
          {chat}
        </aside>

        {/* Mobile Overlay for Right Sidebar | 右侧边栏移动端遮罩 */}
        {showRightSidebar && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
            onClick={onCloseRightSidebar}
          />
        )}

      </div>
    </div>
  );
}
