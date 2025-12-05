# English Learning Assistant

一个基于 AI 的英语学习辅助工具，集成了大语言模型（LLM）和文本转语音（TTS）功能，帮助用户更高效地学习英语。

An AI-powered English learning assistant that integrates Large Language Models (LLM) and Text-to-Speech (TTS) to help users learn English more efficiently.

## ✨ 主要功能 | Features

- **AI 智能辅导 | AI Tutoring**：支持多种 LLM 提供商（本地 llama.cpp、DeepSeek、Qwen、Kimi、自定义端点），可在设置面板一键切换
- **多智能体课程专家 | Multi-Agent Course Expert**：内置课程专家（Curriculum Designer → Content Writer → QC Reviewer）链路，几分钟内生成完整的双语课程
- **文本转语音 | Text-to-Speech**：离线 Piper 语音 + 在线 Edge TTS + 浏览器原生 TTS，支持语速 0.25x-2x、语种自动识别、词句朗读
- **课程管理 | Course Management**：创建/删除课程、实时查看 AI 生成内容、支持 SSE 流式写入
- **AI 课程生成器 | Course Generator**：提供快速模式与「向导模式」两种操作体验，支持课程级别、技能焦点、学习风格、语气等可视化配置
- **内容导入 | Content Import**：从 URL 导入网页内容作为学习材料
- **现代化界面 | Modern UI**：React 19 + HeroUI + Tailwind CSS 三栏布局，支持互动文本高亮、即时右键菜单、面板拖拽
- **右键菜单 | Context Menu**：选中文本右键可朗读或询问 AI，并可一键把句子发送到聊天输入框
- **可调节面板 | Resizable Panels**：AI 对话面板宽度可拖拽调节，聊天面板支持流式响应、自动滚动

## 📅 更新日志 | Changelog

### 2024-12-09: Course Expert & Provider Settings | 课程专家 + 多模型设置

**What's New | 本次更新：**

1. **Multi-Agent Course Expert | 多智能体课程专家**
   - 新增 `app/services/course_expert.py`，通过「大纲设计师 → 内容撰写师 → 质检专家」链路一次性生成完整课程
   - 前端新增 Course Generator & Course Generator Wizard，可配置 CEFR、受众、技能、学习风格、语气、课时数
2. **AI Provider Center | AI 提供商中心**
   - 新增 `app/services/llm_provider.py` + `/api/ai-provider/*` REST 接口，支持 Local / DeepSeek / Qwen / Kimi / Custom
   - 设置弹窗内新增「AI 模型」页签，可直接填入 API Key、Base URL、模型名称并测试连通性
3. **Edge & Browser Voices | Edge 与浏览器语音**
   - TTS 服务支持 Edge TTS 语音（Aria/Guy/Jenny 等）与浏览器语音，新增 `speed` 参数控制语速
   - UI 中可选择 Piper/Edge/Browser 语音，并提供 0.25x-2.0x 的语速按钮
4. **Real-time Lesson Builder | 流式课时生成**
   - 新增 `/api/courses/{course_id}/lessons/{lesson_id}/generate/stream` SSE 接口，前端实时展现 AI 写作进度
   - 课程内容区支持 Markdown 渲染、`<en>/<cn>` 标签分色展示、点击单词朗读、点击句子朗读/追问
5. **Database & API Enhancements | 数据库与 API**
   - `courses` 表新增 level/focus/audience/target_skills/learning_style/duration/tone 字段，保留课程元信息
   - 新增 `/api/courses/generate/full`（完整课程）、`/api/courses/generate/stream`（SSE 大纲）、`DELETE /api/courses/{id}` 等端点

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

> ℹ️ `requirements.txt` 现已包含 `edge-tts`（在线语音）与 `langchain(+community)`（多智能体/流式工具链），首次安装会额外下载依赖，请保持网络畅通。

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

> 如果之前安装过依赖，请重新执行一次 `npm install` 以拉取 `react-markdown`、`remark-gfm`、`rehype-raw` 等新组件。

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

- 前端界面 | Frontend：http://localhost:5174
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
2. **导入/生成课程**: 输入 URL 点击 "Import"，或点击「AI 课程生成器」弹出快速/向导模式，基于主题和学习参数生成全新课程
3. **选择课程**: 从侧边栏选择课程查看内容，可随时删除课程或触发课时生成
4. **AI 对话**: 在右侧聊天面板向 AI 提问，右键选中文本可一键将句子注入聊天输入框
5. **交互式朗读**:
   - 点击单词：以指定语速播放，并高亮该词
   - 点击句子：清除角色前缀后播放整句，可在设置里调整语速/语音
   - 选中文本右键：显示「朗读 / 询问 AI / 填充聊天输入框」菜单
6. **流式写作**：Lesson Content 区点击「生成课程内容」即调用 `/generate/stream` SSE，实时看到 AI 输出

### AI 课程专家 | AI Course Expert

- **快速生成**：点击侧边栏顶部的「AI 课程生成器」，输入主题+受众+技能焦点，一键调用 `/api/courses/generate/full`，数十秒内生成包含所有课时的完整课程
- **向导模式**：切换到「Course Generator Wizard」可按步骤选择 CEFR 等级、目标技能、学习风格、课时时长/语气等参数，底层由 `CourseExpert` 多智能体串联完成
- **课程信息落库**：生成后的 level/focus/audience/target_skills/learning_style/duration/tone 将同步写入 `courses` 表，便于后续检索或过滤

### AI 提供商与语音设置 | AI Provider & Speech Settings

- 打开设置弹窗（右上角 ⚙️），切换到「AI 模型」页签，即可在 Local/DeepSeek/Qwen/Kimi/Custom 之间切换，支持设置 API Key、Base URL、模型名称并立即测试连通性
- 「语音设置」页签展示 Piper/Edge/浏览器语音的统一列表，支持 0.25x-2.0x 语速按钮与自动语言检测
- TTS API 新增 `speed` 字段（默认为 1.0，即正常语速）；Piper 通过 `length_scale` 控制时长，Edge TTS 自动换算为微软的 `rate` 百分比

### 流式课时生成 | Streaming Lessons

- 点击任课时中的「生成课程内容」会触发 `/api/courses/{course_id}/lessons/{lesson_id}/generate/stream`，前端通过 `ReadableStream` 实时解析 JSON chunk
- 每个 chunk 会立即渲染到 Lesson Content 面板，生成完成后会自动写入数据库
- 可使用 `curl -N http://localhost:8000/api/courses/1/lessons/2/generate/stream` 手动订阅事件流，Headers 中 `event: status/result/done` 表示阶段信息

### API 接口 | API Endpoints

**Chat & Speech**

- `POST /api/chat`：与当前配置的 LLM 对话，可传 `context` 作为额外提示
- `GET /api/tts/voices`：列出 Piper + Edge 语音
- `POST /api/tts`：文本转语音，支持 `voice`（可为空表示自动）与 `speed`（0.25~2.0）

  ```bash
  curl -X POST http://localhost:8000/api/tts \
    -H "Content-Type: application/json" \
    -d '{"text":"Hello there!","voice":"en-US-AriaNeural","speed":0.8}' \
    --output hello.wav
  ```

**Courses & Lessons**

- `GET /api/courses`、`GET /api/courses/{course_id}/lessons`：读取课程与课时
- `POST /api/courses/import`：从 URL 导入内容
- `DELETE /api/courses/{course_id}`：删除课程（级联删除课时）
- `POST /api/courses/{course_id}/lessons/{lesson_id}/generate`：单次生成课时内容
- `GET /api/courses/{course_id}/lessons/{lesson_id}/generate/stream`：以 SSE 流式生成课时，事件类型包含 `status/result/done`

**Course Expert & Streaming**

- `POST /api/courses/generate`：根据主题生成大纲（仅创建空课时）
- `GET /api/courses/generate/stream`：SSE 方式生成大纲 + 插入课程
- `POST /api/courses/generate/full`：调用 `CourseExpert` 生成完整课程（含所有课时内容），可设置 level/focus/audience/target_skills/learning_style/duration/tone/num_lessons

**AI Provider Center**

- `GET /api/ai-provider/config`：读取当前提供商配置及可选 provider 列表
- `PUT /api/ai-provider/config`：更新 provider、API Key、Base URL、Model
- `POST /api/ai-provider/test`：快速检测当前配置是否可访问

> 完整交互式文档： http://localhost:8000/docs

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
│   │   ├── llm_provider.py   # LLM 提供商中心 | Provider hub
│   │   ├── llm_service.py    # LLM 门面层 | LLM facade
│   │   ├── course_expert.py  # 课程专家多智能体 | Course Expert agents
│   │   ├── tts_service.py    # TTS 服务 | TTS service
│   │   └── content_service.py # 内容抓取服务 | Content service
│   ├── static/               # 前端构建产物 | Frontend build
│   └── main.py               # FastAPI 入口 | FastAPI entry
├── frontend/                 # 前端应用 | Frontend
│   ├── src/                  # 源代码 | Source code
│   │   ├── components/       # UI 组件 | UI components
│   │   │   ├── layout/       # 布局组件 | Layout components
│   │   │   └── features/     # 功能组件 (AIProviderSettings / CourseGenerator / InteractiveText)
│   │   ├── hooks/            # 自定义 Hooks | Custom hooks
│   │   ├── types/            # 类型定义 | Type definitions
│   │   ├── utils/            # Markdown & 格式工具 | Markdown helpers
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
- Edge-TTS - 在线语音 | Cloud speech
- SQLite3 - 数据库 | Database
- BeautifulSoup4 - 网页抓取 | Web scraping
- LangChain / langchain-community - 智能体链路 | Agent pipeline

**前端 | Frontend**：

- React 19 - UI 框架 | UI framework
- TypeScript - 类型安全 | Type safety
- Vite - 构建工具 | Build tool
- **HeroUI** - UI 组件库 | UI components
- **Tailwind CSS 3.4** - 样式框架 | CSS framework
- Axios - HTTP 客户端 | HTTP client
- Lucide React - 图标库 | Icon library
- Framer Motion - 动画库 | Animation
- React Markdown + remark-gfm + rehype-raw - Markdown & `<en>/<cn>` 渲染

## 🎙️ TTS 语音系统 | Speech System

### Piper 离线语音

- 首次启动或运行 `python scripts/download_models.py` 时，会自动从 [rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices) 下载 6 个美式音色（Amy、Bryce、Danny、Joe、Kristin、Ryan），覆盖男女声与不同音色质量
- `POST /api/tts` 请求体可传 `voice` 键来选择具体音色；`language` 默认为 `en`
- `GET /api/tts/voices` 用于前端渲染语音下拉框，`quality` 字段可提示音色清晰度（low/medium/high）
- 自定义音色：将 Piper `model.onnx` 与同名 `model.onnx.json` 放在 `data/models/tts/<voice_key>/`，并创建 `metadata.json`，重启后端即可自动扫描

### Edge / 浏览器语音

- `edge-tts` 现已作为默认依赖，可使用 `en-US-AriaNeural / Guy / Jenny` 等在线语音（需联网）
- 设置面板会把 Piper、Edge 与浏览器语音统一展示，可视化切换
- `speed` 参数范围 0.25~2.0：Piper 会映射到 `length_scale`，Edge 会自动换算为微软 API 的 `rate` 百分比，浏览器语音则直接控制 `SpeechSynthesisUtterance.rate`
- 当前的 `GET /api/tts/voices` 会包含 `provider` 字段（`piper`/`edge`），前端可以据此显示来源

## ⚙️ 配置说明 | Configuration

主要配置位于 `app/core/config.py`:

- `DATA_DIR`: 数据存储目录 | Data directory
- `MODEL_DIR`: 模型文件目录 | Model directory
- `DB_PATH`: 数据库文件路径 | Database path
- `LLM_MODEL_PATH`: LLM 模型路径 | LLM model path

### AI Provider 配置 | AI Provider Config

- `ai_config` 表保存当前 Provider（local/deepseek/qwen/kimi/custom）、API Key、Base URL、模型名称
- 默认会写入一条示例配置（Kimi K2），请在首次运行后通过设置面板或 `PUT /api/ai-provider/config` 替换为自己的 Key
- `GET /api/ai-provider/config` 会返回掩码后的 Key 及可用 Provider 列表；`POST /api/ai-provider/test` 可即时校验连接情况

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
