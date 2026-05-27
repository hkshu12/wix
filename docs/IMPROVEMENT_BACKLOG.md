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
| ~~场景预设（收藏组合）~~ | 专注/睡眠/旅行固定搭配 | — | 本次实现（v1.4.0） |
| **Android 后台播放与锁屏控制** | 锁屏/切 App 继续听 | 纯 WebView，无 Media Session | Capacitor 插件或原生 foreground service |
| **PWA `start_url` 与 Pages 子路径** | GitHub Pages 子目录安装 PWA | manifest `start_url: '/'` 可能与 `VITE_BASE_PATH` 不一致 | 构建时注入 base 到 manifest |
| **音频加载失败重试** | 弱网或 OGG 缺失 | `fetch` 失败直接抛错 | 指数退避重试 + 用户可见错误态 |
| **减少动效（`prefers-reduced-motion`）** | 前庭敏感用户 | 无媒体查询适配 | CSS/JS 缩短或关闭过渡 |
| **底部抽屉焦点陷阱** | 键盘/读屏用户 | 有 `role="dialog"` 但无 focus trap | `focus-trap` 或自管 Tab 循环 |

### P2

| 项 | 场景 | 当前不足 | 建议方案 |
| --- | --- | --- | --- |
| **导出/分享混音配置** | 向朋友分享「雨+篝火」配方 | 无序列化 | JSON 导出/导入或 URL 编码 |
| **横屏与安全区细化** | 平板横屏 | 主要为竖屏远程式布局 | 横屏 `@media` 调整网格与 dock |
| **新内置环境声** | 风扇、咖啡馆、列车等 | 8 轨 CC0 集 | 扩展 `sounds.ts` + `sounds:download` |
| **大文件导入进度** | 长播客/长环境录音 | 仅状态文案 | `FileReader` 进度或分块提示 |
| **混音 ARIA 实时区域** | 读屏知播放/定时状态 | 部分控件有 label | `aria-live` 播报播放与定时 |

### 体验场景与缺口（摘要）

| 场景 | 典型需求 | 现状 |
| --- | --- | --- |
| 睡眠 | 定时、渐出、低亮度 UI | 定时+渐出已有；主题可深色 |
| 专注 | 预设、快速恢复 | 命名预设 + 混音快照恢复 |
| 冥想 | 慢速播放、简单组合 | 有全局/ per-track 速度 |
| 哄娃 | 长时间稳定循环 | 定时渐出可用 |
| 屏蔽噪音 | 粉/棕噪 + 雨声 | 内置齐全 |
| 旅行/办公 | 离线 PWA、小体积 | PWA 缓存静态资源 |
| 自定义内容 | 导入本地音频 | IndexedDB + 混音层可恢复 |

### 外部信号

- GitHub Issues：当前无 open issue。
- 近期 CHANGELOG：v1.3.0 混音持久化、v1.2.0 睡眠定时——**避免重复**。
- 同类 App 常见能力：后台播放、分享配方、PWA 子路径——与剩余 P1/P2 一致。

## 本次选中项

**场景预设（收藏组合）（P1）**

- **理由**：混音快照已能恢复上次状态，但专注/睡眠等场景需要多套命名组合并一键切换；`localStorage` CRUD + 应用时过滤不可用音轨，边界清晰，单 PR 可交付。
- **范围**：最多 12 个预设；保存当前主音量、立体声宽度、全局速率与各层参数；加载时保留播放/暂停状态；自定义轨删除后加载预设自动剔除对应层。

## 历史已完成

| 日期 | 项 | 引用 |
| --- | --- | --- |
| 2026-05-27 | Android 自动更新与应用菜单（设置/关于/更新） | [PR #14](https://github.com/hkshu12/wix/pull/14), [v1.5.0](https://github.com/hkshu12/wix/releases/tag/v1.5.0) |
| 2026-05-27 | 场景预设（收藏组合） | [PR #15](https://github.com/hkshu12/wix/pull/15), [v1.4.0](https://github.com/hkshu12/wix/releases/tag/v1.4.0) |
| 2026-05-27 | 混音状态持久化 | [PR #13](https://github.com/hkshu12/wix/pull/13), [v1.3.0](https://github.com/hkshu12/wix/releases/tag/v1.3.0) |
| 2026-05-27 | 睡眠定时 + 渐出停止 | [PR #12](https://github.com/hkshu12/wix/pull/12), [v1.2.0](https://github.com/hkshu12/wix/releases/tag/v1.2.0) |
| 2026-05-23 | CC0 内置环境声、安全区、混音抽屉 | [v1.1.0](https://github.com/hkshu12/wix/releases/tag/v1.1.0) |
| 2026-05-22 | 初版 Web/PWA/Android 混音器 | [v1.0.0](https://github.com/hkshu12/wix/releases/tag/v1.0.0) |
