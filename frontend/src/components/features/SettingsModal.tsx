/**
 * Settings Modal Component
 * 设置弹窗组件
 * 
 * Contains TTS settings and AI provider settings.
 * 包含 TTS 设置和 AI 提供商设置。
 */
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Slider, Tabs, Tab, cn } from "@heroui/react";
import { Mic, Volume2, Cpu, Check } from "lucide-react";
import type { TTSVoice } from "../../types";
import AIProviderSettings from "./AIProviderSettings";

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
  
  // Build voice options | 构建语音选项
  // Note: We use the voices passed from props, but we should also include browser voices if they are in the list
  // Actually, SettingsModal receives `voices` which are only server voices.
  // We need to use `useVoices` hook inside here or pass all options.
  // But `SettingsModal` is a presentational component mostly.
  // Let's assume the parent passes all options or we modify how options are built.
  // Wait, `SettingsModal` builds `voiceOptions` locally from `voices` prop.
  // We should probably accept `voiceOptions` as a prop instead of building it, 
  // OR we should modify `SettingsModal` to accept browser voices too.
  
  // Let's modify `SettingsModal` to use `useVoices` hook directly or just accept the full options list?
  // The prompt says "Update SettingsModal to use Slider...".
  // The user also said "设置里的“语音模型”选项加上浏览器的TTS吧".
  
  // Let's modify `SettingsModal` to fetch browser voices directly for now to keep it simple,
  // or better, let's update the `voices` prop type to include browser voices?
  // `TTSVoice` type is strict.
  
  // Let's just fetch browser voices here to mix them in.
  const getBrowserVoices = () => {
    if (typeof window === 'undefined') return [];
    return window.speechSynthesis.getVoices()
      .filter(v => v.lang.startsWith('en'))
      .map(v => ({
        key: `browser:${v.name}`,
        label: `[Browser] ${v.name}`,
        description: '浏览器本地语音',
        quality: 'local'
      }));
  };

  const voiceOptions = [
    { key: 'auto', label: '自动检测', description: '根据文本自动匹配语言' },
    ...voices.map(v => ({
      key: v.key,
      label: v.name,
      description: `${v.language.toUpperCase()} · ${v.quality}`
    })),
    ...getBrowserVoices()
  ];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      backdrop="blur"
      size="2xl"
      scrollBehavior="inside"
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
            <ModalBody className="gap-4">
              <Tabs aria-label="Settings tabs" color="primary" variant="underlined">
                {/* TTS Settings Tab | TTS 设置标签页 */}
                <Tab
                  key="tts"
                  title={
                    <div className="flex items-center gap-2">
                      <Volume2 size={16} />
                      <span>语音设置</span>
                    </div>
                  }
                >
                  <div className="space-y-6 py-4">
                    {/* Voice Selection - Flat Grid | 语音选择 - 平铺网格 */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Mic size={16} /> 语音模型
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {voiceOptions.map((voice) => (
                          <button
                            key={voice.key}
                            onClick={() => onVoiceChange(voice.key)}
                            className={cn(
                              "relative flex flex-col items-start p-3 rounded-lg border-2 transition-all text-left",
                              selectedVoiceKey === voice.key
                                ? "border-primary bg-primary/10"
                                : "border-default-200 hover:border-default-400 hover:bg-default-100"
                            )}
                          >
                            <span className="font-medium text-sm">{voice.label}</span>
                            <span className="text-xs text-default-500">{voice.description}</span>
                            {selectedVoiceKey === voice.key && (
                              <Check size={14} className="absolute top-2 right-2 text-primary" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Speed Control | 语速调节 */}
                    <div className="space-y-4">
                      <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Volume2 size={16} /> 语速调节 ({ttsRate.toFixed(1)}x)
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0].map((rate) => (
                          <button
                            key={rate}
                            onClick={() => onRateChange(rate)}
                            className={cn(
                              "px-3 py-2 rounded-lg text-sm font-medium transition-all border",
                              ttsRate === rate
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-content1 hover:bg-content2 border-default-200 text-default-600"
                            )}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Tab>

                {/* AI Provider Tab | AI 提供商标签页 */}
                <Tab
                  key="ai"
                  title={
                    <div className="flex items-center gap-2">
                      <Cpu size={16} />
                      <span>AI 模型</span>
                    </div>
                  }
                >
                  <div className="py-4">
                    <AIProviderSettings />
                  </div>
                </Tab>
              </Tabs>
            </ModalBody>
            <ModalFooter className="justify-between">
              <div className="text-xs text-default-400">
                提示：Edge 语音需要联网，Browser 语音取决于浏览器。
              </div>
              <Button color="primary" onPress={onClose} className="px-8">
                完成
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
