# Firefly（ACG-Home）

一个二次元风格的轻量级个人主页，支持主题切换、Markdown 内容渲染、文章系统和内置音乐播放器。


> [!TIP]
> 此预览使用 [Liora](https://github.com/ChengCheng0v0/Liora) 主题，它是本项目的官方推荐主题。
> 强烈建议在部署后配置一个主题样式！


---

## 介绍

这是一个简洁的个人网站项目，设计理念为**简洁至上**，拥有现代的 UI 风格和合理的双栏页面布局。

### 核心特性

- **JSON 配置驱动**：网站标题、站长信息、社交链接、备案信息等全部通过 `config.json` 管理，无需修改代码即可完成个性化配置
- **Markdown 内容渲染**：使用 [markdown-it](https://github.com/markdown-it/markdown-it) 渲染 Markdown 为 HTML，支持内嵌 HTML 标签，编辑内容就像写 README 一样简单
- **文章系统**：支持 Markdown + YAML Frontmatter 格式的文章，自动生成文章清单（`manifest.json`），包含文章列表页和详情页
- **主题系统**：可插拔的主题架构，支持亮色/暗色/自动（按时段）配色切换，内置 Liora 主题
- **内置音乐播放器**：支持自定义歌单的紧凑型播放器，带进度条和音量控制
- **响应式设计**：适配桌面端和移动端
- **兼容 `file://` 协议**：通过预加载内嵌数据，无需 HTTP 服务器即可本地浏览

### 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | [Alpine.js](https://alpinejs.dev/) — 轻量响应式数据绑定 |
| Markdown 渲染 | [markdown-it](https://github.com/markdown-it/markdown-it) |
| 打字效果 | [Typed.js](https://github.com/mattboldt/typed.js) |
| 图标 | [Font Awesome](https://fontawesome.com/) 6.x |
| 弹窗提示 | [SweetAlert](https://sweetalert.js.org/) |
| 代码规范 | ESLint + Prettier |
| 开发工具 | Node.js（`md-sync.js` 热更新 Markdown） |

### 项目结构

```
├── index.html                  # 首页
├── articles.html               # 文章列表页
├── config.json                 # 网站配置文件
├── package.json                # 项目元信息 & npm 脚本
├── eslint.config.mjs           # ESLint 配置
├── scripts/
│   └── md-sync.js              # Markdown 同步监听工具（开发用）
├── assets/
│   ├── markdown/               # Markdown 内容目录
│   │   ├── announcement.md     # 公告内容
│   │   ├── content-page.md     # 首页正文内容
│   │   └── articles/           # 文章目录（.md + manifest.json）
│   ├── music/                  # 音乐播放器 & 歌单
│   │   ├── player.js           # 播放器核心逻辑
│   │   └── playlist.js         # 歌单配置
│   ├── scripts/                # 前端 JS
│   │   ├── utils.js            # 工具函数 & 配置加载 & Markdown 渲染
│   │   ├── theme-loader.js     # 主题加载 & 配色切换
│   │   ├── index.js            # 首页逻辑
│   │   ├── articles.js         # 文章页逻辑
│   │   └── meting.js           # 外部播放器占位组件
│   ├── styles/                 # CSS 样式
│   │   ├── index.css
│   │   ├── elements.css
│   │   ├── nav.css
│   │   ├── articles.css
│   │   ├── loaders.css
│   │   └── responsive/         # 响应式样式
│   ├── images/                 # 图片资源
│   └── fonts/                  # 字体文件
├── loaders/                    # 全局加载动画（iframe 注入）
│   ├── global.html
│   └── theme-color.html
└── themes/
    └── liora/                  # Liora 主题
        ├── theme.json          # 主题元数据
        ├── styles/             # 主题样式
        ├── scripts/            # 主题脚本
        └── colors/             # 配色方案（sun / moon）
```

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/ChengCheng0v0/ACG-Home.git
cd ACG-Home
```

### 2. 修改配置

编辑根目录下的 `config.json`，按照 JSON 格式修改以下内容：

- `title` — 网站标题
- `theme.theme` — 使用的主题名称
- `theme.colors.enable` — 启用的配色方案列表（`sun` 亮色 / `moon` 暗色 / `!autoSwitch` 自动切换）
- `theme.colors.default` — 默认配色
- `masterInfo` — 站长信息（名称、头像、社交链接等）
- `pageHead.typedContent` — 页首打字机效果的文本数组
- `icp` — ICP 备案信息

> [!CAUTION]
> 请勿删除配置文件中的任何字段，否则会导致 JavaScript 报错。不需要的字段可以设置为空字符串 `""`。

### 3. 编辑内容

- **首页正文**：编辑 `assets/markdown/content-page.md`
- **公告栏**：编辑 `assets/markdown/announcement.md`
- **文章**：在 `assets/markdown/articles/` 下创建 `.md` 文件，使用 YAML Frontmatter 定义文章元数据：

```markdown
---
title: 文章标题
date: 2026-06-15
tags: [标签1, 标签2]
description: 文章摘要描述
cover: 封面图URL（可选）
---

文章正文内容（Markdown 格式）...
```

### 4. 预览

直接用浏览器打开 `index.html` 即可（兼容 `file://` 协议）。

如需开发时热更新 Markdown 内容，运行：

```bash
npm run dev
```

此命令会启动 `md-sync.js`，自动监听 `assets/markdown/` 下的 `.md` 文件变化，并同步更新 HTML 中的内嵌数据和文章清单 `manifest.json`。

### 5. 部署

将整个项目目录上传到任意静态托管服务即可，例如：

- GitHub Pages
- Cloudflare Pages
- Vercel
- Netlify
- 任意 Nginx / Apache 静态服务器

## Markdown 渲染

页面中任意带有 `class="markdown-content"` 的元素都会被自动渲染：

```html
<div class="markdown-content" src="./assets/markdown/content-page.md"></div>
```

`src` 属性支持相对路径或远程 URL，内容通过 `fetch` 获取后由 markdown-it 渲染为 HTML。你可以在页面内任意位置插入这样的元素。

项目中预置了以下 Markdown 文件：

| 文件 | 用途 |
|------|------|
| `assets/markdown/content-page.md` | 首页正文内容区 |
| `assets/markdown/announcement.md` | 侧边栏公告卡片 |
| `assets/markdown/articles/*.md` | 文章内容 |

## 文章系统

文章使用 Markdown + YAML Frontmatter 格式编写，存放在 `assets/markdown/articles/` 目录下。

- **文章清单**：`manifest.json` 由 `md-sync.js` 自动生成，包含所有文章的标题、日期、标签、摘要、封面等信息
- **文章列表页**：`articles.html` 展示所有文章卡片，支持点击进入详情
- **文章详情**：点击文章卡片后在当前页展示完整内容

文章 Frontmatter 支持的字段：

| 字段 | 必填 | 说明 |
|------|------|------|
| `title` | 是 | 文章标题 |
| `date` | 否 | 发布日期（YYYY-MM-DD） |
| `tags` | 否 | 标签数组，如 `[Python, 教程]` |
| `description` | 否 | 文章摘要 |
| `cover` | 否 | 封面图 URL |

## 主题系统

主题存放在 `themes/` 目录下，每个主题是一个独立文件夹，包含 `theme.json` 元数据文件。

内置 **Liora** 主题，支持两种配色方案：

- ☀️ **Sun** — 亮色模式
- 🌙 **Moon** — 暗色模式
- 🎨 **Aura（自动）** — 根据系统时间自动切换（18:00 ~ 6:00 为暗色）

### 配色切换机制

- `!autoSwitch` 是自动切换关键字，会根据当前系统时间自动选择亮色或暗色
- 切换颜色时会显示短暂的主题色加载动画，确保视觉过渡平滑
- 配色偏好存储在 `localStorage` 中，刷新页面后保留

## 参与贡献

欢迎提 Issue 和 Pull Request！

## 许可证

本项目基于 [GPL-3.0](LICENSE) 许可证开源。

---

> 本项目最初基于 [wexuo/home](https://github.com/wexuo/home) 修改而来，现已完全重写。页面排版布局保留了原作者的设计，但代码架构和设计理念已完全不同。
