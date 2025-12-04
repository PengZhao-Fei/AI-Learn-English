import { Button, Navbar, NavbarBrand, NavbarContent, NavbarItem, User } from "@heroui/react";
import { BookOpen, Settings, Volume2, Menu, MessageSquare } from "lucide-react";

interface HeaderProps {
  onOpenSidebar: () => void;
  onOpenChat: () => void;
  onOpenSettings: () => void;
  lessonTitle?: string;
}

export default function Header({ 
  onOpenSidebar, 
  onOpenChat, 
  onOpenSettings,
  lessonTitle = "加载中..." 
}: HeaderProps) {
  return (
    <Navbar 
      maxWidth="full" 
      position="sticky" 
      className="border-b border-divider bg-background/80 backdrop-blur-md z-50"
      classNames={{
        wrapper: "px-4 lg:px-6 h-14"
      }}
      height="3.5rem"
    >
      <NavbarContent justify="start" className="gap-2">
        {/* Mobile Sidebar Toggle | 移动端侧边栏切换 */}
        <NavbarItem className="lg:hidden">
          <Button 
            isIconOnly 
            variant="light" 
            size="sm"
            radius="full"
            className="text-default-500 min-w-8 w-8 h-8"
            onPress={onOpenSidebar}
          >
            <Menu size={18} />
          </Button>
        </NavbarItem>

        <NavbarBrand className="gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-white">
            <BookOpen size={14} />
          </div>
          <p className="font-bold text-inherit hidden sm:block text-sm">DevCourse</p>
        </NavbarBrand>

        {/* Breadcrumbs | 面包屑导航 */}
        <div className="hidden md:flex items-center text-xs text-default-500 gap-1.5 ml-3">
          <span className="hover:text-foreground cursor-pointer transition-colors">React 进阶</span>
          <span className="text-default-300">/</span>
          <span className="font-medium text-foreground truncate max-w-[180px] lg:max-w-[300px]">
            {lessonTitle}
          </span>
        </div>
      </NavbarContent>

      <NavbarContent justify="end" className="gap-1">
        {/* Settings Button | 设置按钮 */}
        <NavbarItem className="hidden sm:flex">
          <Button 
            isIconOnly
            variant="light" 
            size="sm"
            radius="full"
            className="text-default-500 w-8 h-8 min-w-8"
            onPress={onOpenSettings}
          >
            <Settings size={16} />
          </Button>
        </NavbarItem>
        
        {/* Read Aloud Button | 朗读按钮 */}
        <NavbarItem className="hidden sm:flex">
          <Button 
            isIconOnly
            variant="light" 
            size="sm"
            radius="full"
            className="text-default-500 w-8 h-8 min-w-8"
          >
            <Volume2 size={16} />
          </Button>
        </NavbarItem>

        <div className="h-5 w-px bg-divider hidden sm:block mx-2"></div>

        {/* Mobile Chat Toggle | 移动端对话切换 */}
        <NavbarItem className="lg:hidden">
          <Button 
            isIconOnly
            size="sm"
            radius="full"
            className="bg-primary/10 text-primary min-w-8 w-8 h-8"
            onPress={onOpenChat}
          >
            <MessageSquare size={16} />
          </Button>
        </NavbarItem>

        {/* User Avatar | 用户头像 */}
        <NavbarItem>
          <User   
            name="Alex Chen"
            description="Pro Member"
            avatarProps={{
              src: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
              size: "sm",
              className: "w-7 h-7"
            }}
            classNames={{
              base: "gap-2",
              name: "text-xs font-semibold hidden sm:block",
              description: "text-[10px] text-default-400 hidden sm:block"
            }}
          />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
