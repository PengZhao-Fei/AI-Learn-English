# English Learning Assistant

一个基于 AI 的英语学习辅助工具，集成了大语言模型（LLM）和文本转语音（TTS）功能，帮助用户更高效地学习英语。

## ✨ 主要功能

- **AI 智能辅导**：使用 Qwen2.5-7B 大语言模型回答英语学习问题
- **文本转语音**：内置 Edge-TTS，支持朗读任意英文文本
- **课程管理**：创建和管理英语学习课程
- **内容导入**：从 URL 导入网页内容作为学习材料
- **现代化界面**：基于 React + Ant Design 的响应式 Web 界面

## 🚀 快速开始

### 环境要求

- **后端**：
  - Python 3.9+
  - macOS（支持 Metal 加速）/ Linux / Windows
  - 至少 8GB 可用磁盘空间（用于模型文件）
- **前端**：
  - Node.js 18+
  - npm 或 yarn

### 安装步骤

#### 1. 安装后端依赖

```bash
# 创建并激活虚拟环境（推荐）
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 安装 Python 依赖
pip install -r requirements.txt

# macOS 用户：安装 Metal 加速版本的 llama-cpp-python
CMAKE_ARGS="-DLLAMA_METAL=on" pip install --upgrade --force-reinstall llama-cpp-python --no-cache-dir
```

#### 2. 下载模型文件

```bash
python scripts/download_models.py
```

此步骤会从 Hugging Face 下载：

- **LLM 模型**：Qwen2.5-7B-Instruct GGUF（自动选择 Q5/Q4 量化版本，约 4-6GB）
- **TTS 模型**：Coqui XTTS-v2（可选，默认使用 Edge-TTS）

> ⚠️ **注意**：下载可能需要较长时间，请耐心等待

#### 3. 安装前端依赖

```bash
cd frontend
npm install
```

#### 4. 启动应用

**开发模式**（推荐）：

```bash
# 终端 1：启动后端服务器
python -m app.main
# 或使用 uvicorn（支持热重载）
uvicorn app.main:app --reload

# 终端 2：启动前端开发服务器
cd frontend
npm run dev
```

访问地址：
- 前端界面：http://localhost:5173
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/docs

**生产模式**：

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

## 📖 使用指南

### Web 界面

1. **添加演示课程**: 点击侧边栏的"Add Demo Course"按钮创建示例课程
2. **导入网页内容**: 在输入框中粘贴 URL,点击"Import"导入外部内容
3. **选择课程**: 从侧边栏选择课程查看内容
4. **AI 对话**: 在右侧聊天面板向 AI 提问
5. **文本朗读**: 点击文本中的单词或句子触发 TTS 朗读

### API 接口

主要 API 端点:

- `POST /api/chat` - 与 AI 对话

  ```json
  {
    "message": "What is the difference between 'affect' and 'effect'?",
    "context": "optional context"
  }
  ```

- `POST /api/tts` - 文本转语音

  ```json
  {
    "text": "Hello, how are you?"
  }
  ```

- `POST /api/courses/import` - 导入课程

  ```json
  {
    "url": "https://example.com/article"
  }
  ```

- `GET /api/courses` - 获取所有课程
- `GET /api/courses/{course_id}/lessons` - 获取课程的课时列表

### 导入产品叙事课程

项目附带了一个基于美国国务院公开课程素材重新编写的 **Product Storytelling Intensive** 教学大纲(`data/curriculum_product_comm.json`)。要导入或更新该课程,运行:

```bash
python scripts/import_curriculum.py --replace
```

脚本会将课程和 6 个课时写入 `data/learning.db`, 并在已有同名课程时清理旧数据。

## 🗂️ 项目结构

```
english_learning_assistant/
├── app/
│   ├── api/              # API路由
│   │   └── endpoints.py  # 所有API端点
│   ├── core/             # 核心配置
│   │   └── config.py     # 应用配置
│   ├── models/           # 数据模型
│   │   └── database.py   # SQLite数据库
│   ├── services/         # 业务逻辑
│   │   ├── llm_service.py      # LLM服务
│   │   ├── tts_service.py      # TTS服务
│   │   └── content_service.py  # 内容抓取服务
│   ├── static/           # 前端文件
│   │   ├── index.html    # 主页面
│   │   ├── app.js        # 前端逻辑
│   │   └── style.css     # 样式
│   └── main.py           # FastAPI应用入口
├── data/
│   ├── models/           # 模型文件存储
│   │   ├── llm/          # LLM模型
│   │   └── tts/          # TTS模型
│   └── learning.db       # SQLite数据库
├── scripts/
│   ├── download_models.py       # 模型下载脚本
│   └── import_curriculum.py     # 导入课程数据
├── requirements.txt      # Python依赖
├── start.sh             # 启动脚本
└── README.md            # 本文件
```

## 🛠️ 技术栈

- **后端框架**: FastAPI
- **LLM**: Qwen2.5-7B-Instruct (通过 llama-cpp-python 运行)
- **TTS**: Edge-TTS (默认) / Coqui XTTS-v2
- **数据库**: SQLite3
- **前端**: 原生 HTML + CSS + JavaScript
- **内容抓取**: BeautifulSoup4

## ⚙️ 配置说明

主要配置位于 `app/core/config.py`:

- `DATA_DIR`: 数据存储目录
- `MODEL_DIR`: 模型文件目录
- `DB_PATH`: 数据库文件路径
- `LLM_MODEL_PATH`: LLM 模型路径(自动检测)

## 🔧 常见问题

**Q: 启动时提示缺少模型文件?**  
A: 请先运行 `python scripts/download_models.py` 下载模型

**Q: Mac 上 LLM 运行很慢?**  
A: 确保安装了 Metal 支持版本的 llama-cpp-python,启动脚本会自动配置

**Q: 如何更换 LLM 模型?**  
A: 修改 `scripts/download_models.py` 中的 `LLM_REPO_ID` 和相关参数

**Q: TTS 不工作?**  
A: 应用默认使用 Edge-TTS,无需额外配置。如需使用 XTTS-v2,需在 download 脚本中启用下载

## 📝 开发说明

### 启动开发服务器

```bash
# 仅启动服务器(不安装依赖)
python -m app.main
```

### 修改端口

编辑 `app/main.py` 中的 `uvicorn.run()` 参数

### 添加新功能

1. API 端点: 在 `app/api/endpoints.py` 中添加
2. 服务逻辑: 在 `app/services/` 中创建新服务
3. 前端界面: 修改 `app/static/` 中的文件

## 📄 许可证

本项目仅供学习和研究使用。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

---

**Enjoy Learning English! 🎉**
# AI-Learn-English
