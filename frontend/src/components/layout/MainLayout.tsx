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

        {/* Right Sidebar (AI Chat) | 右侧边栏（AI对话） */}
        <aside 
          className={`
            fixed inset-y-0 right-0 z-40 bg-background border-l border-divider transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none
            ${showRightSidebar ? 'translate-x-0' : 'translate-x-full'}
            lg:relative lg:translate-x-0 flex-shrink-0 w-full sm:w-[450px] lg:w-[450px]
          `}
        >
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
