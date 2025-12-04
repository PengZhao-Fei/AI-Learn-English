// import { useState, useEffect } from "react";
import { Accordion, AccordionItem, Listbox, ListboxItem, Card, Progress, ScrollShadow } from "@heroui/react";
import { BookOpen, PlayCircle, CheckCircle2, Circle, Clock } from "lucide-react";
import type { OutlineTrack } from "../../types";

interface CourseSidebarProps {
  data: OutlineTrack[];
  activeLessonId: string;
  onSelectLesson: (id: string) => void;
  onClose?: () => void;
}

export default function CourseSidebar({ 
  data, 
  activeLessonId, 
  onSelectLesson,
  onClose 
}: CourseSidebarProps) {
  // Calculate progress
  const totalUnits = data.reduce((acc, track) => acc + track.units.length, 0);
  const completedUnits = data.reduce((acc, track) => 
    acc + track.units.filter(u => u.status === 'done').length, 0
  );
  const progress = totalUnits > 0 ? (completedUnits / totalUnits) * 100 : 0;

  // Default expanded keys
  const defaultExpandedKeys = data.map(track => track.id);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Sidebar Header */}
      <div className="h-16 flex items-center px-6 border-b border-divider justify-between flex-shrink-0">
        <div className="font-bold text-xl flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <BookOpen size={18} />
          </div>
          <span>DevCourse</span>
        </div>
      </div>

      {/* Course List */}
      <ScrollShadow className="flex-1 p-4">
        <Accordion 
          selectionMode="multiple" 
          defaultExpandedKeys={defaultExpandedKeys}
          itemClasses={{
            title: "font-semibold text-sm",
            trigger: "px-2 py-0 data-[hover=true]:bg-default-100 rounded-lg h-10 flex items-center",
            indicator: "text-medium",
            content: "text-small px-2",
          }}
        >
          {data.map((track) => (
            <AccordionItem 
              key={track.id} 
              aria-label={track.label} 
              title={track.label}
              subtitle={
                <span className="text-xs text-default-400 font-normal ml-2 bg-default-100 px-1.5 py-0.5 rounded">
                  {track.level}
                </span>
              }
            >
              <Listbox 
                aria-label="Lessons"
                variant="flat"
                disallowEmptySelection
                selectionMode="single"
                selectedKeys={new Set([activeLessonId])}
                onSelectionChange={(keys) => {
                  const selectedId = Array.from(keys)[0] as string;
                  if (selectedId) {
                    onSelectLesson(selectedId);
                    // Close sidebar on mobile after selection
                    if (window.innerWidth < 1024) {
                      onClose?.();
                    }
                  }
                }}
                itemClasses={{
                  base: "gap-3 px-3 py-2 data-[hover=true]:bg-default-100/50",
                  title: "text-sm font-medium",
                  description: "text-xs text-default-400"
                }}
              >
                {track.units.map((unit) => (
                  <ListboxItem
                    key={unit.id}
                    textValue={unit.title}
                    startContent={
                      unit.status === 'done' ? (
                        <CheckCircle2 size={16} className="text-success" />
                      ) : unit.status === 'inProgress' ? (
                        <PlayCircle size={16} className="text-primary" />
                      ) : (
                        <Circle size={16} className="text-default-300" />
                      )
                    }
                    description={
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock size={10} /> {unit.duration}
                        </span>
                        <span className="w-1 h-1 bg-default-300 rounded-full"></span>
                        <span>{unit.focus}</span>
                      </div>
                    }
                    className={activeLessonId === unit.id ? "bg-primary/10 text-primary" : ""}
                  >
                    {unit.title}
                  </ListboxItem>
                ))}
              </Listbox>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollShadow>
      
      {/* Progress Footer */}
      <div className="p-4 border-t border-divider bg-default-50/50">
        <Card className="p-3 shadow-none border border-default-200 bg-background">
          <div className="text-xs text-default-500 mb-2 flex justify-between">
            <span>学习进度</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress 
            size="sm" 
            value={progress} 
            color="primary" 
            aria-label="Course progress"
            classNames={{
              track: "drop-shadow-md border border-default",
              indicator: "bg-gradient-to-r from-primary to-secondary",
            }}
          />
        </Card>
      </div>
    </div>
  );
}
