
import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Progress, cn } from "@heroui/react";
import { BookOpen, Sparkles, Loader2, Target, Users, GraduationCap } from "lucide-react";


interface CourseGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onCourseGenerated: (courseId: number) => void;
}

const LEVELS = [
  { key: "Beginner", label: "零基础" },
  { key: "Elementary", label: "初级" },
  { key: "Intermediate", label: "中级" },
  { key: "Advanced", label: "高级" },
  { key: "Business", label: "商务" },
];

const FOCUS_AREAS = [
  { key: "General", label: "综合提升" },
  { key: "Speaking", label: "口语交流" },
  { key: "Listening", label: "听力训练" },
  { key: "Reading", label: "学术阅读" },
  { key: "Writing", label: "写作表达" },
];

const AUDIENCES = [
  { key: "General", label: "通用" },
  { key: "Students", label: "在校学生" },
  { key: "Professionals", label: "职场人士" },
  { key: "Travelers", label: "旅行者" },
  { key: "Children", label: "儿童" },
];

export default function CourseGenerator({ isOpen, onClose, onCourseGenerated }: CourseGeneratorProps) {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Intermediate");
  const [focus, setFocus] = useState("General");
  const [audience, setAudience] = useState("General");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState("");

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    setStatus("正在启动课程专家...");

    try {
      // Use new full course generation endpoint
      // 使用新的完整课程生成接口
      setStatus("正在生成完整课程（包含所有课时）...");
      
      const response = await fetch('/api/courses/generate/full', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic,
          level: level,
          focus: focus,
          audience: audience,
          num_lessons: 5
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Generation failed');
      }

      const data = await response.json();
      setStatus(`生成完成！共 ${data.lessons_count} 个课时，正在跳转...`);
      
      setTimeout(() => {
        setIsGenerating(false);
        onCourseGenerated(data.course_id);
        onClose();
        setTopic("");
        setStatus("");
      }, 1000);

    } catch (error) {
      console.error("Failed to generate course:", error);
      setStatus(`生成失败: ${error instanceof Error ? error.message : '请重试'}`);
      setIsGenerating(false);
    }
  };

  const renderOptionGroup = (label: string, icon: React.ReactNode, options: {key: string, label: string}[], value: string, onChange: (val: string) => void) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-default-600 flex items-center gap-2">
        {icon}
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.key}
            onClick={() => !isGenerating && onChange(opt.key)}
            disabled={isGenerating}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm transition-all border",
              value === opt.key
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-default-50 text-default-600 border-transparent hover:bg-default-100"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      backdrop="blur"
      size="2xl"
      classNames={{
        base: "bg-background border border-default-100 shadow-xl",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Sparkles className="text-primary" size={20} />
                <span>AI 课程生成器</span>
              </div>
            </ModalHeader>
            <ModalBody className="gap-6">
              <div className="space-y-6">
                <p className="text-sm text-default-500">
                  输入你想学习的主题，AI 将为你量身定制一套完整的英语课程。
                </p>
                
                <Input
                  label="课程主题"
                  placeholder="例如：商务谈判、去日本旅游、雅思口语..."
                  value={topic}
                  onValueChange={setTopic}
                  variant="bordered"
                  startContent={<BookOpen size={16} className="text-default-400" />}
                  isDisabled={isGenerating}
                />
                
                <div className="space-y-4">
                  {renderOptionGroup(
                    "适用等级", 
                    <GraduationCap size={16} className="text-default-400" />,
                    LEVELS,
                    level,
                    setLevel
                  )}

                  {renderOptionGroup(
                    "核心目标", 
                    <Target size={16} className="text-default-400" />,
                    FOCUS_AREAS,
                    focus,
                    setFocus
                  )}

                  {renderOptionGroup(
                    "受众群体", 
                    <Users size={16} className="text-default-400" />,
                    AUDIENCES,
                    audience,
                    setAudience
                  )}
                </div>

                {isGenerating && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-default-500">
                      <span>{status}</span>
                      <Loader2 className="animate-spin" size={14} />
                    </div>
                    <Progress 
                      size="sm" 
                      isIndeterminate 
                      color="primary" 
                      aria-label="Generating..." 
                    />
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose} isDisabled={isGenerating}>
                取消
              </Button>
              <Button 
                color="primary" 
                onPress={handleGenerate} 
                isDisabled={!topic.trim() || isGenerating}
                isLoading={isGenerating}
              >
                开始生成
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
