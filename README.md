# Ambient Mix — 白噪音混音器

跨平台环境音混合应用：**Web**、**PWA**、**Android** 同构单代码库。

## 功能

- **多轨混音**：同时播放多种白噪音/环境音，独立控制每轨音量
- **内置音效**：下雨、海边、篝火、壁炉、风声、森林、雷鸣、溪流、夜晚、咖啡馆（程序化合成，无需外部音频版权）
- **立体声平衡**：每轨左右声道 Pan 调节
- **播放速度**：0.5×–2× 变速
- **场景预设**：温馨小屋、海边度假、深林漫步等一键组合
- **自定义导入**：支持 MP3/WAV/OGG 等，通过 IndexedDB **持久化**存储
- **睡眠定时**：15–90 分钟自动停止
- **PWA**：可安装到桌面/主屏幕，离线缓存
- **Android**：Capacitor 打包原生壳

## 技术栈

| 层 | 技术 |
|---|---|
| UI | React 19 + TypeScript + Tailwind CSS 4 + Framer Motion |
| 状态 | Zustand（持久化轨道设置） |
| 音频 | Web Audio API（GainNode + StereoPannerNode + 循环 BufferSource） |
| 存储 | Dexie / IndexedDB |
| 构建 | Vite 8 |
| PWA | vite-plugin-pwa |
| 移动端 | Capacitor 8 |

## 快速开始

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # 生产构建 → dist/
npm run preview      # 预览生产包
```

### PWA

`npm run build` 后部署 `dist/` 到任意 HTTPS 静态托管即可安装为 PWA。

### Android

需安装 [Android Studio](https://developer.android.com/studio) 与 JDK 17+：

```bash
npm run build
npx cap add android    # 首次
npm run cap:sync       # 同步 Web 资源到 Android 工程
npx cap open android   # 在 Android Studio 中打开并运行/打包
```

或直接：

```bash
npm run android:build  # 需已 add android 且配置 SDK
```

## 项目结构

```
src/
  audio/          # 音频引擎、程序化音效、类型
  components/     # UI 组件
  db/             # IndexedDB 自定义音频
  store/          # Zustand 全局状态
```

## 使用说明

1. 点击音效卡片开启/关闭该轨
2. 点击底部 **播放** 开始混音（需用户手势解锁 AudioContext）
3. 展开已激活轨道调节音量、立体声、速度
4. **导入自定义音频** 持久保存在本机浏览器
5. 选择 **场景预设** 快速组合

## License

MIT
