# Wix 改进 Backlog

每日 Cloud Agent 挖掘与实现记录。优先级：**P0**（高影响/低复杂度或强场景需求）→ **P1** → **P2**。

## 已发现项

### P0

| 项 | 场景 | 当前不足 | 建议方案 |
| --- | --- | --- | --- |
| ~~睡眠定时 + 渐出停止~~ | 睡前自动渐弱停止 | — | 已完成 v1.2.0 |
| ~~混音状态持久化~~ | 刷新后恢复组合与音量 | — | 已完成 v1.3.0 |
| ~~主音量记忆~~ | 每次打开主音量回到默认 | — | 已随混音快照一并持久化 |

### P1

| 项 | 场景 | 当前不足 | 建议方案 |
| --- | --- | --- | --- |
| ~~场景预设（收藏组合）~~ | 专注/睡眠/旅行固定搭配 | — | 已完成 v1.4.0 |
| **Android 后台播放与锁屏控制** | 锁屏/切 App 继续听 | 纯 WebView，无 Media Session | Capacitor 插件或原生 foreground service |
| ~~PWA `start_url` 与 Pages 子路径~~ | GitHub Pages 子目录安装 PWA | — | 本次实现（v1.6.0） |
| **音频加载失败重试** | 弱网或 OGG 缺失 | `fetch` 失败直接抛错 | 指数退避重试 + 用户可见错误态 |
| **减少动效（`prefers-reduced-motion`）** | 前庭敏感用户 | 无媒体查询适配 | CSS/JS 缩短或关闭过渡 |
| **底部抽屉焦点陷阱** | 键盘/读屏用户 | 有 `role="dialog"` 但无 focus trap | `focus-trap` 或自管 Tab 循环 |
| **睡眠定时持久化** | 睡前设好定时后刷新页面 | 定时器仅存内存 | 可选写入 `localStorage` 并在恢复时校验剩余时间 |

### P2

| 项 | 场景 | 当前不足 | 建议方案 |
| --- | --- | --- | --- |
| **导出/分享混音配置** | 向朋友分享「雨+篝火」配方 | 无序列化 | JSON 导出/导入或 URL 编码 |
| **横屏与安全区细化** | 平板横屏 | 主要为竖屏远程式布局 | 横屏 `@media` 调整网格与 dock |
| **新内置环境声** | 风扇、咖啡馆、列车等 | 8 轨 CC0 集 | 扩展 `sounds.ts` + `sounds:download` |
| **大文件导入进度** | 长播客/长环境录音 | 仅状态文案 | `FileReader` 进度或分块提示 |
| **混音 ARIA 实时区域** | 读屏知播放/定时状态 | 部分控件有 label | `aria-live` 播报播放与定时 |
| **落地页功能列表更新** | 新用户了解能力 | 未提及定时、预设、Android 更新 | 补充 Studio 已有功能文案 |

### 体验场景与缺口（摘要）

| 场景 | 典型需求 | 现状 |
| --- | --- | --- |
| 睡眠 | 定时、渐出、低亮度 UI | 定时+渐出已有；主题可深色 |
| 专注 | 预设、快速恢复 | 命名预设 + 混音快照恢复 |
| 冥想 | 慢速播放、简单组合 | 有全局/ per-track 速度 |
| 哄娃 | 长时间稳定循环 | 定时渐出可用 |
| 屏蔽噪音 | 粉/棕噪 + 雨声 | 内置齐全 |
| 旅行/办公 | 离线 PWA、子路径安装 | v1.6.0 起 manifest 与 `VITE_BASE_PATH` 对齐 |
| 自定义内容 | 导入本地音频 | IndexedDB + 混音层可恢复 |

### 外部信号

- GitHub Issues：当前无 open issue。
- 近期 CHANGELOG：v1.5.0 Android 更新、v1.4.0 场景预设——**避免重复**。
- 同类 App 常见能力：后台播放、分享配方、PWA 子路径——与剩余 P1/P2 一致。

## 本次选中项

**PWA `start_url` 与 GitHub Pages 子路径对齐（P1）**

- **理由**：CI/Pages 构建使用 `VITE_BASE_PATH=/{repo}/`，但 manifest 固定 `start_url: '/'` 与根路径图标，导致「添加到主屏幕」在子路径部署时打开错误 URL 或图标 404；改动集中在 `vite.config.ts` + 可测 helper，单 PR 可交付。
- **范围**：根据 `VITE_BASE_PATH` 注入 manifest 的 `start_url`、`scope` 与图标路径；单元测试覆盖根路径与子路径。

## 历史已完成

| 日期 | 项 | 引用 |
| --- | --- | --- |
| 2026-05-27 | PWA manifest 与 Pages 子路径对齐 | v1.6.0（本次） |
| 2026-05-27 | Android 自动更新与应用菜单（设置/关于/更新） | [PR #14](https://github.com/hkshu12/wix/pull/14), [v1.5.0](https://github.com/hkshu12/wix/releases/tag/v1.5.0) |
| 2026-05-27 | 场景预设（收藏组合） | [PR #15](https://github.com/hkshu12/wix/pull/15), [v1.4.0](https://github.com/hkshu12/wix/releases/tag/v1.4.0) |
| 2026-05-27 | 混音状态持久化 | [PR #13](https://github.com/hkshu12/wix/pull/13), [v1.3.0](https://github.com/hkshu12/wix/releases/tag/v1.3.0) |
| 2026-05-27 | 睡眠定时 + 渐出停止 | [PR #12](https://github.com/hkshu12/wix/pull/12), [v1.2.0](https://github.com/hkshu12/wix/releases/tag/v1.2.0) |
| 2026-05-23 | CC0 内置环境声、安全区、混音抽屉 | [v1.1.0](https://github.com/hkshu12/wix/releases/tag/v1.1.0) |
| 2026-05-22 | 初版 Web/PWA/Android 混音器 | [v1.0.0](https://github.com/hkshu12/wix/releases/tag/v1.0.0) |
