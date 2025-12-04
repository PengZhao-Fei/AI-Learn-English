import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Select, SelectItem, Slider } from "@heroui/react";
import { Mic, Bot, Volume2 } from "lucide-react";
import type { TTSVoice } from "../../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  voices: TTSVoice[];
  selectedVoiceKey: string;
  onVoiceChange: (key: string) => void;
  ttsRate: number;
  onRateChange: (rate: number) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  voices,
  selectedVoiceKey,
  onVoiceChange,
  ttsRate,
  onRateChange
}: SettingsModalProps) {
  
  // Build voice options
  const voiceOptions = [
    { key: 'auto', label: '自动检测 (Auto Detect)', description: '根据文本自动匹配语言' },
    ...voices.map(v => ({
      key: v.key,
      label: `${v.name} (${v.language.toUpperCase()})`,
      description: v.description
    }))
  ];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      backdrop="blur"
      classNames={{
        base: "bg-background border border-default-100 shadow-xl",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              AI 学习偏好设置
            </ModalHeader>
            <ModalBody className="gap-6">
              {/* Voice Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Mic size={16} /> 语音模型
                </label>
                <Select 
                  selectedKeys={[selectedVoiceKey]}
                  onChange={(e) => onVoiceChange(e.target.value)}
                  placeholder="选择语音"
                  variant="bordered"
                >
                  {voiceOptions.map((voice) => (
                    <SelectItem key={voice.key} textValue={voice.label}>
                      {voice.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Speed Control */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Volume2 size={16} /> 语速调节 ({ttsRate.toFixed(1)}x)
                </label>
                <Slider 
                  size="sm"
                  step={0.1}
                  minValue={0.5}
                  maxValue={2.0}
                  value={ttsRate}
                  onChange={(v) => onRateChange(v as number)}
                  className="max-w-md"
                  color="primary"
                  showSteps={true}
                  marks={[
                    { value: 0.5, label: "0.5x" },
                    { value: 1.0, label: "1.0x" },
                    { value: 1.5, label: "1.5x" },
                    { value: 2.0, label: "2.0x" },
                  ]}
                />
              </div>

              {/* AI Model (Mock) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Bot size={16} /> AI 模型
                </label>
                <Select defaultSelectedKeys={["gemini"]} variant="bordered">
                  <SelectItem key="gemini">Gemini 1.5 Pro (推荐)</SelectItem>
                  <SelectItem key="gpt4">GPT-4o</SelectItem>
                  <SelectItem key="claude">Claude 3.5 Sonnet</SelectItem>
                </Select>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                关闭
              </Button>
              <Button color="primary" onPress={onClose}>
                保存设置
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
