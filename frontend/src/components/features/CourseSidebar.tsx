// import { useState, useEffect } from "react";
import { Accordion, AccordionItem, Card, Progress, ScrollShadow, Button, Tooltip } from "@heroui/react";
import { BookOpen, PlayCircle, CheckCircle2, Circle, Plus, GraduationCap, Trash2 } from "lucide-react";
import type { OutlineTrack } from "../../types";

interface CourseSidebarProps {
  data: OutlineTrack[];
  activeLessonId: string;
  onSelectLesson: (id: string) => void;
  onDeleteCourse?: (id: string) => void;
  onClose?: () => void;
  onOpenGenerator?: () => void;
}

export default function CourseSidebar({ 
  data, 
  activeLessonId, 
  onSelectLesson,
  onDeleteCourse,
  onClose,
  onOpenGenerator
}: CourseSidebarProps) {
  // Calculate progress | 计算进度
  const totalUnits = data.reduce((acc, track) => acc + track.units.length, 0);
  const completedUnits = data.reduce((acc, track) => 
    acc + track.units.filter(u => u.status === 'done').length, 0
  );
  const progress = totalUnits > 0 ? (completedUnits / totalUnits) * 100 : 0;

  // Default expanded keys | 默认展开的键
  const defaultExpandedKeys = data.map(track => track.id);

  // Get display title (truncate long titles) | 获取显示标题（截断长标题）
  const getDisplayTitle = (title: string, maxLen: number = 30) => {
    // Split bilingual title and show only the first part if too long
    // 分割双语标题，如果太长只显示第一部分
    const parts = title.split(' | ');
    const mainTitle = parts[0].replace(/^(Lesson \d+: |Course: )/, '');
    return mainTitle.length > maxLen ? mainTitle.slice(0, maxLen) + '...' : mainTitle;
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Sidebar Header | 侧边栏头部 */}
      <div className="h-14 flex items-center px-4 border-b border-divider justify-between flex-shrink-0">
        <div className="font-bold text-lg flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white shadow-sm">
            <GraduationCap size={18} />
          </div>
          <span className="text-foreground">英语课堂</span>
        </div>
        <Tooltip content="新建课程" placement="bottom">
          <Button 
            size="sm" 
            isIconOnly 
            variant="flat" 
            color="primary"
            onPress={onOpenGenerator} 
            aria-label="New Course"
          >
            <Plus size={18} />
          </Button>
        </Tooltip>
      </div>

      {/* Course List | 课程列表 */}
      <ScrollShadow className="flex-1 overflow-y-auto">
        <div className="p-3">
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-default-100 rounded-full flex items-center justify-center mb-4">
                <BookOpen size={24} className="text-default-400" />
              </div>
              <p className="text-default-500 text-sm mb-4">还没有课程</p>
              <Button 
                size="sm" 
                color="primary" 
                variant="flat"
                onPress={onOpenGenerator}
                startContent={<Plus size={16} />}
              >
                创建第一个课程
              </Button>
            </div>
          ) : (
            <Accordion 
              selectionMode="multiple" 
              defaultExpandedKeys={defaultExpandedKeys}
              className="px-0"
              itemClasses={{
                base: "py-0 w-full",
                title: "font-medium text-sm text-foreground",
                // trigger class moved to item prop for group hover support
                indicator: "text-default-400",
                content: "pb-2 pt-1",
              }}
            >
              {data.map((track) => (
                <AccordionItem 
                  key={track.id} 
                  aria-label={track.label}
                  title={
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="truncate flex-1">{getDisplayTitle(track.label, 20)}</span>
                      <span className="text-[10px] text-default-400 bg-default-100 px-1.5 py-0.5 rounded flex-shrink-0">
                        {track.units.length}课
                      </span>
                      {onDeleteCourse && (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto h-6 w-6 min-w-6"
                          onPress={(e) => {
                            // Prevent accordion expansion
                            // @ts-ignore - Event type mismatch in HeroUI
                            if (e.continuePropagation) {
                              e.continuePropagation();
                            }
                            onDeleteCourse(track.id.replace('course-', ''));
                          }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  }
                  classNames={{
                    trigger: "px-3 py-2.5 data-[hover=true]:bg-default-100 rounded-lg flex items-center gap-2 group",
                  }}
                >
                  <div className="space-y-1 pl-1">
                    {track.units.map((unit) => {
                      const isActive = activeLessonId === unit.id;
                      return (
                        <button
                          key={unit.id}
                          onClick={() => {
                            onSelectLesson(unit.id);
                            if (window.innerWidth < 1024) {
                              onClose?.();
                            }
                          }}
                          className={`
                            w-full text-left px-2.5 py-2 rounded-lg transition-all duration-200
                            flex items-center gap-2 group
                            ${isActive 
                              ? 'bg-primary/10 border border-primary/20' 
                              : 'hover:bg-default-100 border border-transparent'
                            }
                          `}
                        >
                          {/* Status Icon | 状态图标 */}
                          <div className="flex-shrink-0 mt-0.5">
                            {unit.status === 'done' ? (
                              <CheckCircle2 size={16} className="text-success" />
                            ) : unit.status === 'inProgress' ? (
                              <PlayCircle size={16} className="text-primary" />
                            ) : (
                              <Circle size={16} className="text-default-300 group-hover:text-default-400" />
                            )}
                          </div>
                          
                          {/* Content | 内容 */}
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <p className={`text-sm truncate ${isActive ? 'text-primary font-medium' : 'text-foreground'}`}>
                              {getDisplayTitle(unit.title, 30)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </ScrollShadow>
      
      {/* Progress Footer | 进度底部 */}
      <div className="p-3 border-t border-divider bg-default-50/50 flex-shrink-0">
        <Card className="p-3 shadow-none border border-default-100 bg-background">
          <div className="text-xs text-default-500 mb-2 flex justify-between">
            <span>学习进度</span>
            <span className="font-medium">{completedUnits}/{totalUnits} 课时</span>
          </div>
          <Progress 
            size="sm" 
            value={progress} 
            color="primary" 
            aria-label="Course progress"
            classNames={{
              track: "bg-default-100",
              indicator: "bg-gradient-to-r from-primary to-secondary",
            }}
          />
        </Card>
      </div>
    </div>
  );
}
