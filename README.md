# Ear.th 🌍📻 (聆听世界)

**Ear.th** 是一个沉浸式的 3D 交互式网络应用，让你可以探索并聆听来自全球各地的数千个广播电台。它将实时的地理空间数据可视化与高保真的音频体验相结合，并包裹在独特的“赛博极简主义”美学之中。

![Project Preview](./public/preview.png)

> "通过声音这一通用语言，连接全人类的脉搏。"

## ✨ 核心功能

### 🌐 沉浸式 3D 体验
-   **交互式地球**: 基于 **React Three Fiber** 渲染的全功能可导航 WebGL 地球。
-   **高清视觉效果**: 采用 NASA Blue Marble 4K 高清贴图（色彩、法线、高光），呈现逼真的行星细节。
-   **宇宙氛围**: 处在一个程序化生成的深空背景中，拥有动态星场和空灵的星尘效果，专为视觉舒适度而调校。
-   **地理可视化**: 每一个广播电台都化身为地球表面亮起的信标，构建出一幅全球文化的“城市灯火”网络。

### 🎧 先进音频播放器
-   **全球媒体库**: 通过 **Radio Browser API** 接入全球超过 30,000 个直播电台。
-   **实时可视化**: 基于 Web Audio API 的动态频谱分析器，让视觉随音乐实时律动。
-   **统一控制面板**: 精致的磨砂玻璃风格控制面板，支持播放控制、深层链接分享以及随机探索功能。
-   **本地化体验**: 完美支持 简体中文 和 英文 双语界面切换。

### 🔗 星光协议 (The Starlight Protocol - 深度分享)
-   **优雅分享**: 使用独特的、经过混淆的“信号代码”（如 `?s=S7x9...`）来分享你发现的宝藏电台，告别冗长丑陋的 URL。
-   **鲁棒的深度链接**: 
    -   智能解析策略，优先读取本地缓存以实现秒开。
    -   强健的状态管理，确保链接在页面刷新或重复访问时依然有效。
    -   为接收者提供沉浸式的“信号接入”自动播放体验。

### 🎨 设计哲学
-   **赛博极简主义 (Cyber-Minimalism)**: 采用暗色调电影级 UI，大量运用玻璃拟态 (`backdrop-blur`)、霓虹点缀 (`#00f3ff`) 以及清晰的排版，让用户的注意力聚焦于声音本身。
-   **环境融合**: (实验性) 根据电台所在地的实时天气渲染环境氛围。

## 🛠 技术栈

-   **前端框架**: [React 18](https://reactjs.org/) (Vite)
-   **3D 引擎**: [Three.js](https://threejs.org/) + [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
-   **样式方案**: [Tailwind CSS](https://tailwindcss.com/)
-   **状态管理**: [Zustand](https://github.com/pmndrs/zustand)
-   **动画引擎**: [Framer Motion](https://www.framer.com/motion/)
-   **数据源**: [Radio Browser API](https://www.radio-browser.info/)
-   **图标库**: [Lucide React](https://lucide.dev/)

## 🚀 快速开始

### 预备环境
-   Node.js (v16+)
-   npm 或 yarn

### 安装步骤

1.  **克隆项目**
    ```bash
    git clone https://github.com/yourusername/listen-to-the-world.git
    cd listen-to-the-world
    ```

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **启动开发服务器**
    ```bash
    npm run dev
    ```
    打开浏览器访问 `http://localhost:5173`，开始探索声音宇宙。

## 📂 项目结构

```
src/
├── components/
│   ├── Globe/          # 3D 地球, 标记点, 大气层, 宇宙背景
│   ├── UI/             # 播放器面板, 自动播放弹窗, 电台列表
│   └── Effects/        # 视觉特效 (天气, 音频可视化)
├── store/              # 全局状态管理 (Zustand)
├── utils/              # 协议工具, 辅助函数, 本地化
├── services/           # API 集成 (RadioBrowser, Weather)
└── assets/             # 静态资源
```

## 🤝 贡献指南

欢迎任何形式的贡献！无论是新的可视化效果创意、着色器优化，还是隐藏的彩蛋功能，我们都非常期待。

## 📄 开源协议

MIT License. 自由探索，自由创作。
