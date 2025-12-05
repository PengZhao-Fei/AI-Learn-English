import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, cn, Divider } from "@heroui/react";
import { BookOpen, Sparkles, Target, Users, GraduationCap, CheckCircle2, Music, Eye, FileText, Zap, Coffee, Hourglass } from "lucide-react";

interface CourseGeneratorWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCourseGenerated: (courseId: number) => void;
}

// macOS-like Icons wrapper
const MacIcon = ({ children, color = "bg-blue-500" }: { children: React.ReactNode, color?: string }) => (
  <div className={cn("p-1.5 rounded-md text-white shadow-sm", color)}>
    {children}
  </div>
);

const LEVELS = [
  { key: "Beginner", label: "零基础", desc: "A1-A2", icon: <MacIcon color="bg-green-500"><GraduationCap size={14} /></MacIcon> },
  { key: "Elementary", label: "初级", desc: "A2", icon: <MacIcon color="bg-teal-500"><GraduationCap size={14} /></MacIcon> },
  { key: "Intermediate", label: "中级", desc: "B1", icon: <MacIcon color="bg-blue-500"><GraduationCap size={14} /></MacIcon> },
  { key: "Advanced", label: "高级", desc: "B2-C1", icon: <MacIcon color="bg-indigo-500"><GraduationCap size={14} /></MacIcon> },
  { key: "Business", label: "商务", desc: "Pro", icon: <MacIcon color="bg-slate-500"><BriefcaseIcon size={14} /></MacIcon> },
];

const SKILLS = [
  { key: "Speaking", label: "口语", icon: <Users size={16} /> },
  { key: "Listening", label: "听力", icon: <Music size={16} /> },
  { key: "Reading", label: "阅读", icon: <BookOpen size={16} /> },
  { key: "Writing", label: "写作", icon: <FileText size={16} /> },
  { key: "Grammar", label: "语法", icon: <Target size={16} /> },
  { key: "Vocabulary", label: "词汇", icon: <Sparkles size={16} /> },
];

const STYLES = [
  { key: "Visual", label: "视觉型", desc: "图文结合", icon: <Eye size={20} /> },
  { key: "Auditory", label: "听觉型", desc: "对话为主", icon: <Music size={20} /> },
  { key: "Text-based", label: "文本型", desc: "深度阅读", icon: <FileText size={20} /> },
];

const DURATIONS = [
  { key: "Short", label: "5分钟", desc: "碎片", icon: <Zap size={20} /> },
  { key: "Medium", label: "15分钟", desc: "标准", icon: <Coffee size={20} /> },
  { key: "Long", label: "30分钟", desc: "深度", icon: <Hourglass size={20} /> },
];

const TONES = [
  { key: "Formal", label: "正式", desc: "严谨", color: "bg-slate-100 text-slate-700" },
  { key: "Casual", label: "轻松", desc: "日常", color: "bg-blue-50 text-blue-600" },
  { key: "Humorous", label: "幽默", desc: "有趣", color: "bg-orange-50 text-orange-600" },
  { key: "Strict", label: "严格", desc: "高压", color: "bg-red-50 text-red-600" },
];

const LESSON_COUNTS = [3, 5, 7, 10];

const AUDIENCES = [
  { key: "General", label: "通用", icon: <Users size={16} /> },
  { key: "Students", label: "在校学生", icon: <GraduationCap size={16} /> },
  { key: "Professionals", label: "职场人士", icon: <BriefcaseIcon size={16} /> },
  { key: "Travelers", label: "旅行者", icon: <PlaneIcon size={16} /> },
  { key: "Children", label: "儿童", icon: <BabyIcon size={16} /> },
];

export default function CourseGeneratorWizard({ isOpen, onClose, onCourseGenerated }: CourseGeneratorWizardProps) {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState("");

  // Form State
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Intermediate");
  const [audience, setAudience] = useState("General");
  
  const [targetSkills, setTargetSkills] = useState<string[]>(["Speaking", "Listening"]);
  const [learningStyle, setLearningStyle] = useState("Text-based");
  const [duration, setDuration] = useState("Medium");
  const [tone, setTone] = useState("Casual");
  const [numLessons, setNumLessons] = useState(5);

  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleSkill = (skillKey: string) => {
    setTargetSkills(prev => 
      prev.includes(skillKey) 
        ? prev.filter(k => k !== skillKey)
        : [...prev, skillKey]
    );
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    setStatus("正在启动课程专家...");

    try {
      setStatus("正在生成完整课程...");
      
      const response = await fetch('/api/courses/generate/full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic, level, audience,
          target_skills: targetSkills.join(", "),
          learning_style: learningStyle,
          duration, tone,
          num_lessons: numLessons
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Generation failed');
      }

      const data = await response.json();
      setStatus(`生成完成！共 ${data.lessons_count} 个课时`);
      
      setTimeout(() => {
        setIsGenerating(false);
        onCourseGenerated(data.course_id);
        onClose();
        setStep(1);
        setTopic("");
        setStatus("");
      }, 1000);

    } catch (error) {
      console.error("Failed to generate course:", error);
      setStatus(`生成失败: ${error instanceof Error ? error.message : '请重试'}`);
      setIsGenerating(false);
    }
  };

  // --- Step Renderers ---

  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300 px-2">
      <div className="space-y-3">
        <label className="text-sm font-medium text-default-600 ml-1">想学什么主题？</label>
        <Input
          size="lg"
          placeholder="例如：商务谈判、去日本旅游..."
          value={topic}
          onValueChange={setTopic}
          variant="flat"
          radius="lg"
          classNames={{
            input: "text-base",
            inputWrapper: "bg-default-100/50 hover:bg-default-200/50 shadow-none transition-colors data-[hover=true]:bg-default-200/50 group-data-[focus=true]:bg-white group-data-[focus=true]:shadow-sm group-data-[focus=true]:ring-2 group-data-[focus=true]:ring-primary/20"
          }}
          startContent={<Sparkles size={18} className="text-default-400" />}
          autoFocus
        />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-default-600 ml-1">当前水平</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {LEVELS.map((l) => {
              const isSelected = level === l.key;
              return (
                <button
                  key={l.key}
                  onClick={() => setLevel(l.key)}
                  className={cn(
                    "flex flex-col items-start gap-1 p-3 rounded-xl transition-all duration-200 border text-left",
                    isSelected 
                      ? "bg-white text-primary border-primary/20 shadow-sm ring-2 ring-primary/10" 
                      : "bg-default-50 text-default-600 border-transparent hover:bg-default-100"
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    {l.icon}
                    <span className="text-xs font-medium">{l.label}</span>
                  </div>
                  <span className="text-[10px] text-default-400 pl-1">{l.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-default-600 ml-1">受众群体</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AUDIENCES.map((a) => {
              const isSelected = audience === a.key;
              return (
                <button
                  key={a.key}
                  onClick={() => setAudience(a.key)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl transition-all duration-200 border text-left",
                    isSelected 
                      ? "bg-white text-primary border-primary/20 shadow-sm ring-2 ring-primary/10" 
                      : "bg-default-50 text-default-600 border-transparent hover:bg-default-100"
                  )}
                >
                  {a.icon}
                  <span className="text-xs font-medium">{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300 px-1">
      
      {/* Target Skills */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-default-600 ml-1">重点提升</label>
        <div className="grid grid-cols-3 gap-2">
          {SKILLS.map((s) => {
            const isSelected = targetSkills.includes(s.key);
            return (
              <button
                key={s.key}
                onClick={() => toggleSkill(s.key)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all duration-200 border",
                  isSelected 
                    ? "bg-white text-primary border-primary/20 shadow-sm ring-2 ring-primary/10" 
                    : "bg-default-50 text-default-600 border-transparent hover:bg-default-100"
                )}
              >
                {s.icon}
                <span className="text-xs font-medium">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lesson Count */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-default-600 ml-1">课程数量</label>
        <div className="flex gap-3">
          {LESSON_COUNTS.map((count) => (
            <button
              key={count}
              onClick={() => setNumLessons(count)}
              className={cn(
                "flex-1 py-2 rounded-xl text-sm font-medium transition-all border",
                numLessons === count
                  ? "bg-white text-primary border-primary/20 shadow-sm ring-2 ring-primary/10"
                  : "bg-default-50 text-default-600 border-transparent hover:bg-default-100"
              )}
            >
              {count} 课时
            </button>
          ))}
        </div>
      </div>

      {/* Learning Style */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-default-600 ml-1">学习风格</label>
        <div className="grid grid-cols-3 gap-3">
          {STYLES.map((s) => {
            const isSelected = learningStyle === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setLearningStyle(s.key)}
                className={cn(
                  "flex flex-col items-center text-center gap-1 p-3 rounded-xl transition-all border",
                  isSelected 
                    ? "bg-white border-default-200 shadow-sm ring-2 ring-primary/10" 
                    : "bg-default-50 border-transparent hover:bg-default-100 text-default-500"
                )}
              >
                <div className={cn("mb-1", isSelected ? "text-primary" : "text-default-400")}>{s.icon}</div>
                <span className="text-xs font-semibold">{s.label}</span>
                <span className="text-[10px] text-default-400">{s.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Duration & Tone */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-default-600 ml-1">时长</label>
          <div className="flex flex-col gap-2">
            {DURATIONS.map((d) => {
              const isSelected = duration === d.key;
              return (
                <button
                  key={d.key}
                  onClick={() => setDuration(d.key)}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg transition-all text-left",
                    isSelected ? "bg-white shadow-sm ring-1 ring-black/5" : "text-default-500 hover:bg-default-50"
                  )}
                >
                  <div className={cn(isSelected ? "text-primary" : "text-default-400")}>{d.icon}</div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-default-900">{d.label}</span>
                    <span className="text-[10px] text-default-400">{d.desc}</span>
                  </div>
                  {isSelected && <CheckCircle2 size={14} className="ml-auto text-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-default-600 ml-1">语气</label>
          <div className="grid grid-cols-1 gap-2">
            {TONES.map((t) => {
              const isSelected = tone === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTone(t.key)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-medium transition-all text-left flex items-center justify-between",
                    isSelected ? "bg-white shadow-sm ring-1 ring-black/5 text-default-900" : "bg-default-50 text-default-500 hover:bg-default-100"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", t.color.split(' ')[0].replace('bg-', 'bg-').replace('text-', 'bg-'))} />
                    <span>{t.label}</span>
                  </div>
                  {isSelected && <CheckCircle2 size={14} className="text-default-400" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300 px-2">
      <div className="bg-default-50/50 rounded-2xl p-6 border border-default-100 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Sparkles size={24} />
          </div>
          <h3 className="text-lg font-semibold text-default-900">准备生成课程</h3>
          <p className="text-xs text-default-500">AI 将为您定制专属学习计划</p>
        </div>

        <Divider className="my-4" />
        
        <div className="space-y-4 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-default-500">主题</span>
            <span className="font-semibold text-default-900">{topic}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-default-500">难度</span>
            <span className="font-medium bg-default-100 px-2 py-0.5 rounded text-xs">{LEVELS.find(l => l.key === level)?.label}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-default-500">技能</span>
            <div className="flex gap-1">
              {targetSkills.map(s => (
                <span key={s} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{SKILLS.find(sk => sk.key === s)?.label}</span>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-default-500">风格</span>
            <span className="text-default-900">{STYLES.find(s => s.key === learningStyle)?.label} · {DURATIONS.find(d => d.key === duration)?.label}</span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-[10px] text-default-400">
          点击生成即表示您同意我们的 AI 使用条款
        </p>
      </div>
    </div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      backdrop="blur"
      size="md"
      isDismissable={!isGenerating}
      hideCloseButton={isGenerating}
      classNames={{
        base: "bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl",
        header: "border-b border-default-100/50 p-5",
        body: "p-5",
        footer: "border-t border-default-100/50 p-5 bg-transparent",
        closeButton: "hover:bg-default-100/50 active:bg-default-200/50 rounded-full",
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span className="text-lg font-semibold text-center">AI 课程向导</span>
            </ModalHeader>
            
            <ModalBody>
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in fade-in duration-500">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-default-100 border-t-primary animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles size={20} className="text-primary animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="font-medium text-default-900">正在思考...</h3>
                    <p className="text-xs text-default-500">{status}</p>
                  </div>
                </div>
              ) : (
                <>
                  {step === 1 && renderStep1()}
                  {step === 2 && renderStep2()}
                  {step === 3 && renderStep3()}
                </>
              )}
            </ModalBody>

            {!isGenerating && (
              <ModalFooter className="justify-between">
                {step > 1 ? (
                  <Button 
                    variant="light" 
                    onPress={handleBack} 
                    radius="full"
                    className="font-medium text-default-500"
                  >
                    返回
                  </Button>
                ) : <div />}

                <div className="flex gap-2 items-center">
                  <div className="flex gap-1 mr-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-colors", step >= i ? "bg-primary" : "bg-default-200")} />
                    ))}
                  </div>

                  {step < totalSteps ? (
                    <Button 
                      color="primary" 
                      onPress={handleNext} 
                      isDisabled={step === 1 && !topic.trim()}
                      radius="full"
                      className="font-medium px-6 shadow-lg shadow-primary/20"
                    >
                      下一步
                    </Button>
                  ) : (
                    <Button 
                      color="primary" 
                      onPress={handleGenerate}
                      radius="full"
                      className="font-medium px-6 shadow-lg shadow-primary/20 bg-gradient-to-r from-blue-600 to-indigo-600 border-none"
                    >
                      开始生成
                    </Button>
                  )}
                </div>
              </ModalFooter>
            )}
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

// Helper icons
function BriefcaseIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
}

function PlaneIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20"/><path d="M13 2v20"/><path d="m9 22 5-10-5-10"/><path d="m15 22 5-10-5-10"/></svg>
}

function BabyIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/></svg>
}
