# Ambient 混音台 — 设计摘要

## 技术选型

- **Vite + React 19 + TypeScript**：主流、工具链成熟。
- **Tailwind CSS v4**：响应式与暗色玻璃拟态 UI。
- **Web Audio API**：多轨 `GainNode` + `StereoPannerNode` + 可变速 `AudioBufferSource`，在 Capacitor Android WebView 中与 Web 同构。
- **Dexie**：导入音频 `ArrayBuffer` 与元数据持久化。
- **Zustand `persist`**：混音参数持久化（不含音频二进制）。
- **vite-plugin-pwa**：安装与离线壳层。
- **Capacitor 8**：封装同一 `dist` 为 Android 应用。

## 范围

- 内置音全部为 **程序化合成**，避免仓库捆绑采样文件的版权与体积问题。
- 立体声与倍速为 Web Audio 标准能力；母线「明亮度」映射为低通截止频率。

## 风险与说明

- 浏览器需用户手势解锁 `AudioContext`；首次打开任意声卡即触发解锁。
- 极长自定义音频会占用 IndexedDB 与内存；未做硬限制，后续可按大小提示。
