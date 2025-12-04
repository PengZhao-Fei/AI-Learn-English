# English Learning Assistant

一个基于 AI 的英语学习辅助工具，集成了大语言模型（LLM）和文本转语音（TTS）功能，帮助用户更高效地学习英语。

An AI-powered English learning assistant that integrates Large Language Models (LLM) and Text-to-Speech (TTS) to help users learn English more efficiently.

## ✨ 主要功能 | Features

- **AI 智能辅导 | AI Tutoring**：使用 Qwen2.5-7B 大语言模型回答英语学习问题
- **文本转语音 | Text-to-Speech**：内置多款 Piper 英语音色，离线朗读课程或句子，支持中英文智能识别
- **课程管理 | Course Management**：创建和管理英语学习课程
- **内容导入 | Content Import**：从 URL 导入网页内容作为学习材料
- **现代化界面 | Modern UI**：基于 React + HeroUI + Tailwind CSS 的响应式三栏布局界面
- **右键菜单 | Context Menu**：选中文本右键可朗读或询问 AI
- **可调节面板 | Resizable Panels**：AI 对话面板宽度可拖拽调节

## 📅 更新日志 | Changelog

### 2024-12-04: HeroUI Migration | HeroUI 迁移

**What's Changed | 本次更新内容：**

1. **UI Framework Migration | UI 框架迁移**
   - 从 Ant Design 迁移到 HeroUI + Tailwind CSS
   - Migrated from Ant Design to HeroUI + Tailwind CSS
2. **New Three-Column Layout | 新三栏布局**

   - 左侧：课程大纲面板 | Left: Course outline sidebar
   - 中间：课程内容区域 | Center: Lesson content area
   - 右侧：AI 对话面板 | Right: AI chat panel

3. **Enhanced Interactions | 增强交互**

   - 单击单词朗读 | Click word to read
   - 双击单词追问 AI | Double-click to ask AI
   - 选中文本右键菜单（朗读/询问 AI）| Right-click menu for selected text
   - 禁用浏览器默认右键菜单 | Disabled browser default context menu

4. **TTS Language Detection | TTS 语言检测**

   - 自动识别中英文 | Auto-detect Chinese/English
   - 英文优先使用设置的语音 | English uses configured voice
   - 中文回退到浏览器语音 | Chinese falls back to browser TTS

5. **Resizable AI Panel | 可调节 AI 面板**
   - 拖拽左边框调节宽度（280px - 600px）
   - Drag left border to resize (280px - 600px)
6. **Hidden Scrollbars | 隐藏滚动条**
   - 全局隐藏滚动条，界面更简洁
   - Global hidden scrollbars for cleaner UI

**⚠️ Notes | 注意事项：**

- 需要重新安装前端依赖：`cd frontend && npm install`
- Reinstall frontend dependencies: `cd frontend && npm install`
- Tailwind CSS 版本为 3.4.17（与 HeroUI 兼容）
- Tailwind CSS version is 3.4.17 (compatible with HeroUI)

## 🚀 快速开始 | Quick Start

### 环境要求 | Requirements

- **后端 | Backend**：
  - Python 3.9+
  - macOS（支持 Metal 加速）/ Linux / Windows
  - 至少 8GB 可用磁盘空间（用于模型文件）
- **前端 | Frontend**：
  - Node.js 18+
  - npm 或 yarn

### 安装步骤 | Installation

#### 1. 安装后端依赖 | Install Backend Dependencies

```bash
# 创建并激活虚拟环境（推荐）
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 安装 Python 依赖
pip install -r requirements.txt

# macOS 用户：安装 Metal 加速版本的 llama-cpp-python
CMAKE_ARGS="-DLLAMA_METAL=on" pip install --upgrade --force-reinstall llama-cpp-python --no-cache-dir
```

#### 2. 下载模型文件 | Download Models

```bash
python scripts/download_models.py
```

此步骤会从 Hugging Face 下载：

- **LLM 模型**：Qwen2.5-7B-Instruct GGUF（自动选择 Q5/Q4 量化版本，约 4-6GB）
- **TTS 语音**：Piper Voices（多款美式男女声，自动缓存）

> ⚠️ **注意**：下载可能需要较长时间，请耐心等待

#### 3. 安装前端依赖 | Install Frontend Dependencies

```bash
cd frontend
npm install
```

#### 4. 启动应用 | Start Application

**开发模式 | Development Mode**（推荐）：

```bash
# 终端 1：启动后端服务器
python -m app.main
# 或使用 uvicorn（支持热重载）
uvicorn app.main:app --reload

# 终端 2：启动前端开发服务器
cd frontend
npm run dev
```

访问地址 | Access URLs：

- 前端界面 | Frontend：http://localhost:5173
- 后端 API | Backend API：http://localhost:8000
- API 文档 | API Docs：http://localhost:8000/docs

**生产模式 | Production Mode**：

```bash
# 1. 构建前端
cd frontend
npm run build

# 2. 将构建产物复制到后端静态目录
cp -r dist/* ../app/static/

# 3. 启动后端服务器
cd ..
python -m app.main
```

访问地址：http://localhost:8000/static/index.html

## 📖 使用指南 | User Guide

### Web 界面 | Web Interface

1. **添加演示课程**: 点击侧边栏的"Add Demo Course"按钮创建示例课程
2. **导入网页内容**: 在输入框中粘贴 URL,点击"Import"导入外部内容
3. **选择课程**: 从侧边栏选择课程查看内容
4. **AI 对话**: 在右侧聊天面板向 AI 提问
5. **文本朗读**:
   - 单击单词：朗读该单词
   - 双击单词：朗读并追问 AI
   - 选中文本右键：显示朗读/询问 AI 菜单

### API 接口 | API Endpoints

主要 API 端点：

- **`POST /api/chat`** - 与 AI 对话

  ```json
  {
    "message": "What is the difference between 'affect' and 'effect'?",
    "context": "optional context"
  }
  ```

- **`GET /api/tts/voices`** - 查询已缓存的 Piper 英语语音（音色、质量、描述）
- **`POST /api/tts`** - 文本转语音，返回 `audio/wav` 流，可指定语音键或保持自动

  ```bash
  curl -X POST http://localhost:8000/api/tts \
    -H "Content-Type: application/json" \
    -d '{"text":"Hello there!","voice":"en_us_ryan_high"}' \
    --output hello.wav
  ```

  响应头会携带 `X-Voice-Key` / `X-Voice-Name` 等语音信息，响应体为可直接播放的 WAV 二进制，前端以 `fetch`/`axios` 获取后生成 `Blob URL` 即可播放。

- **`POST /api/courses/import`** - 导入课程

  ```json
  {
    "url": "https://example.com/article"
  }
  ```

- **`GET /api/courses`** - 获取所有课程
- **`GET /api/courses/{course_id}/lessons`** - 获取课程的课时列表

**完整 API 文档**：http://localhost:8000/docs

### 导入产品叙事课程 | Import Product Storytelling Course

项目附带了一个基于美国国务院公开课程素材重新编写的 **Product Storytelling Intensive** 教学大纲(`data/curriculum_product_comm.json`)。要导入或更新该课程,运行:

```bash
python scripts/import_curriculum.py --replace
```

脚本会将课程和 6 个课时写入 `data/learning.db`, 并在已有同名课程时清理旧数据。

## 🗂️ 项目结构 | Project Structure

```
english_learning_assistant/
├── app/                      # 后端应用 | Backend
│   ├── api/                  # API 路由 | API routes
│   │   └── endpoints.py      # 所有 API 端点 | All endpoints
│   ├── core/                 # 核心配置 | Core config
│   │   └── config.py         # 应用配置 | App config
│   ├── models/               # 数据模型 | Data models
│   │   └── database.py       # SQLite 数据库模型 | DB models
│   ├── services/             # 业务逻辑 | Business logic
│   │   ├── llm_service.py    # LLM 服务 | LLM service
│   │   ├── tts_service.py    # TTS 服务 | TTS service
│   │   └── content_service.py # 内容抓取服务 | Content service
│   ├── static/               # 前端构建产物 | Frontend build
│   └── main.py               # FastAPI 入口 | FastAPI entry
├── frontend/                 # 前端应用 | Frontend
│   ├── src/                  # 源代码 | Source code
│   │   ├── components/       # UI 组件 | UI components
│   │   │   ├── layout/       # 布局组件 | Layout components
│   │   │   └── features/     # 功能组件 | Feature components
│   │   ├── hooks/            # 自定义 Hooks | Custom hooks
│   │   ├── types/            # 类型定义 | Type definitions
│   │   ├── App.tsx           # 主应用组件 | Main component
│   │   └── api.ts            # API 客户端 | API client
│   ├── tailwind.config.js    # Tailwind 配置 | Tailwind config
│   ├── postcss.config.js     # PostCSS 配置 | PostCSS config
│   ├── package.json          # 前端依赖 | Dependencies
│   └── vite.config.ts        # Vite 配置 | Vite config
├── data/
│   ├── models/               # 模型文件 | Model files
│   │   ├── llm/              # LLM 模型 | LLM models
│   │   └── tts/              # TTS 模型 | TTS models
│   └── learning.db           # SQLite 数据库 | Database
├── scripts/
│   ├── download_models.py    # 模型下载 | Download models
│   └── import_curriculum.py  # 导入课程 | Import curriculum
├── requirements.txt          # Python 依赖 | Python deps
└── README.md                 # 本文件 | This file
```

## 🛠️ 技术栈 | Tech Stack

**后端 | Backend**：

- FastAPI - Web 框架 | Web framework
- llama-cpp-python - LLM 推理引擎 | LLM inference
- Qwen2.5-7B-Instruct GGUF - 大语言模型 | LLM
- Piper TTS + Piper Voices - 离线 TTS | Offline TTS
- SQLite3 - 数据库 | Database
- BeautifulSoup4 - 网页抓取 | Web scraping

**前端 | Frontend**：

- React 19 - UI 框架 | UI framework
- TypeScript - 类型安全 | Type safety
- Vite - 构建工具 | Build tool
- **HeroUI** - UI 组件库 | UI components
- **Tailwind CSS 3.4** - 样式框架 | CSS framework
- Axios - HTTP 客户端 | HTTP client
- Lucide React - 图标库 | Icon library
- Framer Motion - 动画库 | Animation

## 🎙️ Piper 英语语音 | Piper TTS Voices

- 首次启动或运行 `python scripts/download_models.py` 时，会自动从 [rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices) 下载 6 个美式音色（Amy、Bryce、Danny、Joe、Kristin、Ryan），覆盖男女声与不同音色质量。
- `POST /api/tts` 请求体可传 `voice` 键来选择具体音色；`language` 始终为 `en`，若传入其他值会自动回退为英语。
- `GET /api/tts/voices` 用于前端渲染语音下拉框，`quality` 字段可帮助提示音色的清晰度（low/medium/high）。
- 接口返回即时 `audio/wav` 流且不在磁盘落地文件，避免音频缓存越来越多。
- 自定义音色：将 Piper `model.onnx` 与同名 `model.onnx.json` 放在 `data/models/tts/<voice_key>/`，并创建 `metadata.json`（UTF-8，`language` 需设置为 `en`）：

  ```json
  {
    "key": "en_us_alex_medium",
    "language": "en",
    "name": "Alex (US · Male)",
    "quality": "medium",
    "description": "中性美式男声"
  }
  ```

  重启后端即可被自动扫描并展示在 API/前端中。

## ⚙️ 配置说明 | Configuration

主要配置位于 `app/core/config.py`:

- `DATA_DIR`: 数据存储目录 | Data directory
- `MODEL_DIR`: 模型文件目录 | Model directory
- `DB_PATH`: 数据库文件路径 | Database path
- `LLM_MODEL_PATH`: LLM 模型路径 | LLM model path

## 🔧 常见问题 | FAQ

**Q: 启动时提示缺少模型文件？**
A: 请先运行 `python scripts/download_models.py` 下载模型

**Q: Mac 上 LLM 运行很慢？**
A: 确保安装了 Metal 加速版本的 llama-cpp-python：

```bash
CMAKE_ARGS="-DLLAMA_METAL=on" pip install --upgrade --force-reinstall llama-cpp-python --no-cache-dir
```

**Q: 如何更换 LLM 模型？**
A: 修改 `scripts/download_models.py` 中的 `LLM_REPO_ID` 和相关参数

**Q: TTS 不工作？**
A: 请确认已安装 `piper-tts` 与 `huggingface_hub`，并检查 `data/models/tts` 下是否存在 `model.onnx`。可以运行 `python scripts/download_models.py` 重新触发 Piper 语音下载。

**Q: 前端开发服务器无法访问后端 API？**
A: 确保后端服务器在 8000 端口运行，Vite 配置了自动代理 `/api` 和 `/static` 路径

**Q: 生产部署时前端页面无法加载？**
A: 确保运行了 `cd frontend && npm run build`，并将 `frontend/dist/*` 复制到 `app/static/`

## 📝 开发说明 | Development

### 后端开发 | Backend Development

```bash
# 启动后端开发服务器（支持热重载）
uvicorn app.main:app --reload --port 8000

# 或直接运行
python -m app.main
```

### 前端开发 | Frontend Development

```bash
cd frontend

# 启动开发服务器（支持热重载）
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint
```

### 修改配置 | Modify Configuration

- **后端端口**：编辑 `app/main.py` 中的 `uvicorn.run()` 参数
- **前端代理**：编辑 `frontend/vite.config.ts` 中的 `proxy` 配置
- **模型路径**：编辑 `app/core/config.py` 中的相关配置

### 添加新功能 | Add New Features

1. **后端 API**：在 `app/api/endpoints.py` 中添加新的路由
2. **业务逻辑**：在 `app/services/` 中创建新的服务模块
3. **前端组件**：在 `frontend/src/components/` 中创建新的 React 组件
4. **自定义 Hooks**：在 `frontend/src/hooks/` 中创建新的 Hook
5. **API 调用**：在 `frontend/src/api.ts` 中添加 API 客户端方法

## 📄 许可证 | License

本项目仅供学习和研究使用。
This project is for learning and research purposes only.

## 🤝 贡献 | Contributing

欢迎提交 Issue 和 Pull Request!
Issues and Pull Requests are welcome!

---

**Enjoy Learning English! 🎉**
