/**
 * AI Provider Settings Component
 * AI 提供商设置组件
 * 
 * Allows users to configure which LLM provider to use (local, cloud, etc.)
 * 允许用户配置使用哪个 LLM 提供商（本地、云端等）
 */
import { useEffect, useState } from "react";
import { Button, Input, Chip, Spinner, cn } from "@heroui/react";
import { Cloud, Server, Key, Link, Cpu, CheckCircle, Eye, EyeOff, Check } from "lucide-react";
import api from "../../api";

// Simple notification helper | 简单通知辅助函数
const showNotification = (title: string, description: string, type: "success" | "error") => {
  console.log(`[${type.toUpperCase()}] ${title}: ${description}`);
};

// Provider info type | 提供商信息类型
interface ProviderInfo {
  key: string;
  name: string;
  description: string;
  requires_key: boolean;
  default_model: string | null;
}

// Config type | 配置类型
interface AIConfig {
  provider: string;
  provider_name: string;
  api_key_masked: string | null;
  base_url: string | null;
  model_name: string | null;
  providers: string[];
  available_providers: ProviderInfo[];
}

export default function AIProviderSettings() {
  // State | 状态
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Form state | 表单状态
  const [selectedProvider, setSelectedProvider] = useState<string>("local");
  const [apiKey, setApiKey] = useState<string>("");
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [modelName, setModelName] = useState<string>("");

  // Load config on mount | 挂载时加载配置
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/ai-provider/config");
      setConfig(data);
      setSelectedProvider(data.provider);
      setBaseUrl(data.base_url || "");
      setModelName(data.model_name || "");
    } catch (error) {
      console.error("Failed to load AI config:", error);
      showNotification("加载失败", "无法加载 AI 配置", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle provider change | 处理提供商变更
  const handleProviderSelect = (providerKey: string) => {
    setSelectedProvider(providerKey);
    
    // Set defaults for the new provider | 为新提供商设置默认值
    const providerInfo = config?.available_providers.find(p => p.key === providerKey);
    if (providerInfo?.default_model) {
      setModelName(providerInfo.default_model);
    }
    
    // Clear API key when switching | 切换时清空 API key
    setApiKey("");
  };

  // Save config | 保存配置
  const handleSave = async () => {
    try {
      setSaving(true);
      
      const payload: any = {
        provider: selectedProvider,
        model_name: modelName || undefined,
      };
      
      if (apiKey) {
        payload.api_key = apiKey;
      }
      
      if (selectedProvider === "custom" && baseUrl) {
        payload.base_url = baseUrl;
      }
      
      await api.put("/ai-provider/config", payload);
      
      showNotification("保存成功", "AI 提供商配置已更新", "success");
      
      await loadConfig();
      setApiKey("");
      
    } catch (error) {
      console.error("Failed to save config:", error);
      showNotification("保存失败", "无法保存配置，请重试", "error");
    } finally {
      setSaving(false);
    }
  };

  // Test connection | 测试连接
  const handleTest = async () => {
    try {
      setTesting(true);
      await api.post("/ai-provider/test", {});
      showNotification("连接成功", "AI 服务连接正常", "success");
    } catch (error: any) {
      console.error("Connection test failed:", error);
      showNotification("连接失败", error.response?.data?.detail || "无法连接到 AI 服务", "error");
    } finally {
      setTesting(false);
    }
  };

  // Get provider icon | 获取提供商图标
  const getProviderIcon = (key: string, size: number = 16) => {
    switch (key) {
      case "local":
        return <Server size={size} />;
      case "custom":
        return <Link size={size} />;
      default:
        return <Cloud size={size} />;
    }
  };

  // Current provider info | 当前提供商信息
  const currentProviderInfo = config?.available_providers.find(p => p.key === selectedProvider);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status | 当前状态 */}
      <div className="flex items-center gap-2 p-3 bg-default-100 rounded-lg">
        <span className="text-sm text-default-600">当前使用：</span>
        <Chip 
          color={selectedProvider === "local" ? "default" : "primary"} 
          variant="flat"
          startContent={getProviderIcon(selectedProvider)}
        >
          {config?.provider_name || selectedProvider}
        </Chip>
        {config?.api_key_masked && (
          <Chip color="success" variant="flat" size="sm">
            已配置密钥
          </Chip>
        )}
      </div>

      {/* Provider Selection - Flat Grid | 提供商选择 - 平铺网格 */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">选择 AI 提供商</label>
        <div className="grid grid-cols-2 gap-2">
          {(config?.available_providers || []).map((provider) => (
            <button
              key={provider.key}
              onClick={() => handleProviderSelect(provider.key)}
              className={cn(
                "relative flex flex-col items-start p-3 rounded-lg border-2 transition-all text-left",
                selectedProvider === provider.key
                  ? "border-primary bg-primary/10"
                  : "border-default-200 hover:border-default-400 hover:bg-default-100"
              )}
            >
              <div className="flex items-center gap-2">
                {getProviderIcon(provider.key)}
                <span className="font-medium text-sm">{provider.name}</span>
              </div>
              <span className="text-xs text-default-500 mt-1 line-clamp-1">
                {provider.description.split('|')[0].trim()}
              </span>
              {selectedProvider === provider.key && (
                <Check size={14} className="absolute top-2 right-2 text-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* API Key Input (for cloud providers) | API 密钥输入（云端提供商） */}
      {currentProviderInfo?.requires_key && (
        <Input
          label="API 密钥"
          placeholder={config?.api_key_masked || "输入 API Key"}
          value={apiKey}
          onValueChange={setApiKey}
          type={showApiKey ? "text" : "password"}
          startContent={<Key size={16} className="text-default-400" />}
          endContent={
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
          }
          description={
            config?.api_key_masked 
              ? `当前: ${config.api_key_masked}（留空保持不变）` 
              : "从提供商控制台获取 API 密钥"
          }
        />
      )}

      {/* Custom URL (for custom provider) | 自定义 URL（自定义提供商） */}
      {selectedProvider === "custom" && (
        <Input
          label="API 地址"
          placeholder="https://api.example.com/v1"
          value={baseUrl}
          onValueChange={setBaseUrl}
          startContent={<Link size={16} className="text-default-400" />}
          description="OpenAI 兼容的 API 端点地址"
        />
      )}

      {/* Model Name | 模型名称 */}
      {selectedProvider !== "local" && (
        <Input
          label="模型名称"
          placeholder={currentProviderInfo?.default_model || "gpt-3.5-turbo"}
          value={modelName}
          onValueChange={setModelName}
          startContent={<Cpu size={16} className="text-default-400" />}
          description="使用的模型标识符（留空使用默认值）"
        />
      )}

      {/* Action Buttons | 操作按钮 */}
      <div className="flex gap-3 pt-4 border-t border-default-200">
        <Button
          color="primary"
          onPress={handleSave}
          isLoading={saving}
          startContent={!saving && <CheckCircle size={16} />}
        >
          保存设置
        </Button>
        <Button
          variant="bordered"
          onPress={handleTest}
          isLoading={testing}
          startContent={!testing && <Cloud size={16} />}
        >
          测试连接
        </Button>
      </div>

      {/* Help Text | 帮助文本 */}
      <div className="text-xs text-default-400 space-y-1">
        <p>• <strong>本地模型</strong>：使用本机 llama.cpp 模型，无需网络</p>
        <p>• <strong>云端模型</strong>：需要 API 密钥，支持更强大的模型</p>
        <p>• <strong>自定义</strong>：连接任意 OpenAI 兼容的 API 端点</p>
      </div>
    </div>
  );
}
