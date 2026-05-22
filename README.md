# Ambient 混音台

跨 **Web**、**PWA** 与 **Android（Capacitor）** 的环境声与白噪音混音器。单一代码库：Vite + React + TypeScript + Tailwind CSS v4，音频层统一使用 **Web Audio API**（Capacitor WebView 中与浏览器同构）。

## 功能

- **多轨混合**：内置雨声、海边、深海、篝火、壁炉、林风、溪流及白/粉/棕噪等程序化循环纹理，可多选同时播放。
- **独立控制**：每条轨道的音量、立体声声像（`StereoPannerNode`）、单轨播放倍速。
- **母线**：总音量、明亮度（母线低通）、全局倍速（作用于所有循环 `AudioBufferSource`）。
- **导入音频**：支持常见格式；文件经 `decodeAudioData` 后进入混音，元数据与原始 `ArrayBuffer` 持久化在 **IndexedDB（Dexie）**。
- **PWA**：`vite-plugin-pwa` 生成 Service Worker 与 manifest，可安装到主屏幕并离线加载壳层（程序化音与已导入音频仍依赖本地数据）。

## 开发

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## PWA

构建产物含 `manifest.webmanifest` 与 `sw.js`。通过 HTTPS 或 `localhost` 提供页面后，浏览器可提示「安装应用」。

## Android

需安装 [Android Studio](https://developer.android.com/studio) 与 JDK。每次更新前端后：

```bash
npm run build
npx cap sync android
npx cap open android
```

在 Android Studio 中选择设备或模拟器运行。`android/app/src/main/assets/public` 由 Capacitor 从 `dist` 同步生成，默认被 `.gitignore` 忽略；克隆仓库后需执行上述 `build` + `sync` 再编译原生工程。

## 架构摘要

| 模块 | 说明 |
|------|------|
| `src/audio/builtins.ts` | 程序化音景合成（噪声缓冲 + 滤波 + 包络/调度） |
| `src/audio/MixerEngine.ts` | `AudioContext`、分轨增益/声像、母线滤波 |
| `src/audio/customBufferCache.ts` | 导入轨解码后的 `AudioBuffer` 内存缓存 |
| `src/db/customTracks.ts` | Dexie 持久化导入文件 |
| `src/stores/mixerStore.ts` | Zustand + `persist`（混音状态写入 `localStorage`） |
| `src/hooks/useMixerAudioBridge.tsx` | 将 store 与 `MixerEngine` 对齐 |

## 许可

示例项目；内置音为程序合成，无采样版权依赖。用户导入的音频版权归用户所有。
