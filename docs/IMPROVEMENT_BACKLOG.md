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
| **Android 后台播放与锁屏控制** | 锁屏/切 App 继续听 | WebView 无原生 foreground service | Capacitor 插件或自定义 Media Session 原生桥；与 v1.18.0 Web API 互补 |
| ~~PWA `start_url` 与 Pages 子路径~~ | GitHub Pages 子目录安装 PWA | — | 已完成 v1.6.0 |
| ~~音频加载失败重试~~ | 弱网或 OGG 短暂不可用 | — | 已完成 v1.8.0 |
| ~~减少动效（`prefers-reduced-motion`）~~ | 前庭敏感用户 | — | 已完成 v1.10.0 |
| ~~底部抽屉焦点陷阱~~ | 键盘/读屏用户 | — | 已完成 v1.9.0 |
| ~~睡眠定时持久化~~ | 睡前设好定时后刷新页面 | — | 已完成 v1.7.0 |
| ~~Web Media Session（PWA/桌面锁屏）~~ | 浏览器/PWA 锁屏控制播放 | — | 已完成 v1.18.0 |

### P2

| 项 | 场景 | 当前不足 | 建议方案 |
| --- | --- | --- | --- |
| ~~导出/分享混音配置~~ | 向朋友分享「雨+篝火」配方 | — | 已完成 v1.13.0 |
| ~~混音分享 URL 深链~~ | 点开链接即导入配方 | — | 已完成 v1.19.0 |
| ~~横屏与安全区细化~~ | 平板/手机横屏 | — | 已完成 v1.14.0 |
| **新内置环境声** | 风扇、咖啡馆、列车等 | 8 轨 CC0 集 | 扩展 `sounds.ts` + `sounds:download` |
| ~~大文件导入进度~~ | 长播客/长环境录音 | — | v1.16.0 |
| ~~混音 ARIA 实时区域~~ | 读屏知播放/定时状态 | — | 已完成 v1.12.0 |
| ~~落地页功能列表更新~~ | 新用户了解能力 | — | 已完成 v1.11.0 |
| ~~桌面键盘快捷键~~ | 办公专注时免鼠标 | — | 已完成 v1.15.0（Space 播放/暂停） |
| ~~快捷键帮助（`?`）~~ | 发现 Space 等快捷键 | — | 已完成 v1.17.0 |
| ~~自定义睡眠定时时长~~ | 90 分钟午睡等非 15–60 预设 | 仅四档预设 | `sleepTimer.ts` 校验范围 + 抽屉数字输入 |
| **更多键盘快捷键** | `M` 开抽屉、`+/-` 主音量 | 仅 Space / `?` | 扩展 `studioKeyboard` |

### 体验场景与缺口（摘要）

| 场景 | 典型需求 | 现状 |
| --- | --- | --- |
| 睡眠 | 定时、渐出、自定义时长（午睡 90 分等） | 定时+渐出+刷新恢复；自定义分钟 v1.20.0 |
| 专注 | 预设、快速恢复、横屏平板、键盘控制 | 预设+快照；横屏 v1.14.0；Space + `?` v1.15–17 |
| 冥想 | 慢速播放、简单组合 | 有全局/ per-track 速度 |
| 哄娃 | 长时间稳定循环 | 定时渐出可用；可设最长 8 小时自定义 |
| 屏蔽噪音 | 粉/棕噪 + 雨声 | 内置齐全 |
| 旅行/办公 | 离线 PWA、子路径安装 | v1.6.0 manifest 对齐 |
| 弱网/首次加载 | 内置 OGG 偶发失败 | fetch+decode 指数退避重试（v1.8.0） |
| 前庭敏感 | 减少 UI 动效 | 系统「减少动态效果」（v1.10.0） |
| 新用户认知 | 落地页了解 Studio 能力 | v1.11.0（可再补「分享链接」文案） |
| 读屏用户 | 播放/加轨状态播报 | v1.12.0 live 区域 |
| 社交分享 | 把配方发给朋友 | v1.13.0 JSON + v1.19.0 深链 URL |
| 平板横屏 | 一屏多看环境声 | v1.14.0 |
| 自定义内容 | 导入本地音频 | IndexedDB + 导入进度（v1.16.0） |
| PWA 锁屏/通知栏 | 系统级播放/暂停 | v1.18.0 Media Session（Web）；Android 原生仍缺 |

### 代码与架构备注（2026-05-28 挖掘）

- **分层清晰**：`domain/` 纯逻辑、`storage/` 快照、`audio/` 引擎、`AppLayout` 编排；分享深链 `mixerShareUrl` + `useMixerShareDeepLink`。
- **睡眠定时**：`sleepTimer.ts` + `useSleepTimerController` + `sleepTimerSnapshot`；预设与自定义分钟共用 `startSleepTimer`。
- **键盘**：`studioKeyboard` 仅 Space/`?`；抽屉内输入框需 `isEditableKeyboardTarget` 排除。
- **Android**：Capacitor 8；后台音频仍为最大平台缺口（P1），需原生 foreground service，不宜与 Web 小功能同 PR。
- **测试**：domain/hook 单测齐全；`StudioPage` 覆盖深链与抽屉；睡眠定时 UI 可补组件测。
- **版本**：当前 `1.19.0`；CHANGELOG 单日密集发布，下一项宜选小范围、可测能力。

### 外部信号

- GitHub Issues：无 open issue（2026-05-28，与 05-27 一致）。
- 近期 CHANGELOG：v1.19.0 深链、v1.18.0 Media Session——**避免重复**。
- 同类 App：自定义定时、后台播放、更多环境声；下一项大项仍为 **Android 原生后台（P1）**；小项 **键盘 M/+/-（P2）** 或 **新内置声（P2，含资源下载）**。

## 本次选中项

**自定义睡眠定时时长（P2）**

- **理由**：午睡 90 分钟、哄娃 2 小时等真实场景无法被 15–60 四档覆盖；逻辑已集中在 `sleepTimer.ts`，单次 PR 只需 domain 校验、controller 泛化、抽屉 UI 与测试，不碰 Android 原生。
- **范围**：5–480 分钟整数输入；与预设、跨刷新持久化、30 秒渐出共用现有管线；不含改 fade 时长或新预设档。

## 历史已完成

| 日期 | 项 | 引用 |
| --- | --- | --- |
| 2026-05-28 | 自定义睡眠定时时长 | v1.20.0（本次） |
| 2026-05-27 | 混音分享 URL 深链 | [v1.19.0](https://github.com/hkshu12/wix/releases/tag/v1.19.0) |
| 2026-05-27 | Web Media Session（PWA/桌面锁屏） | [v1.18.0](https://github.com/hkshu12/wix/releases/tag/v1.18.0) |
| 2026-05-27 | 快捷键帮助（`?`） | [v1.17.0](https://github.com/hkshu12/wix/releases/tag/v1.17.0) |
| 2026-05-27 | 大文件导入进度条 | [PR #27](https://github.com/hkshu12/wix/pull/27), [v1.16.0](https://github.com/hkshu12/wix/releases/tag/v1.16.0) |
| 2026-05-27 | 桌面键盘快捷键（Space） | [PR #26](https://github.com/hkshu12/wix/pull/26), [v1.15.0](https://github.com/hkshu12/wix/releases/tag/v1.15.0) |
| 2026-05-27 | 横屏与安全区细化 | [v1.14.0](https://github.com/hkshu12/wix/releases/tag/v1.14.0) |
| 2026-05-27 | 导出/分享混音配置 | [v1.13.0](https://github.com/hkshu12/wix/releases/tag/v1.13.0) |
| 2026-05-27 | 混音播放 ARIA live 播报 | [v1.12.0](https://github.com/hkshu12/wix/releases/tag/v1.12.0) |
| 2026-05-27 | 落地页功能列表更新 | [v1.11.0](https://github.com/hkshu12/wix/releases/tag/v1.11.0) |
| 2026-05-27 | 减少动效（prefers-reduced-motion） | [PR #21](https://github.com/hkshu12/wix/pull/21), [v1.10.0](https://github.com/hkshu12/wix/releases/tag/v1.10.0) |
| 2026-05-27 | 混音台底部抽屉焦点陷阱 | [PR #20](https://github.com/hkshu12/wix/pull/20), [v1.9.0](https://github.com/hkshu12/wix/releases/tag/v1.9.0) |
| 2026-05-27 | 音频 fetch/decode 失败重试 | [v1.8.0](https://github.com/hkshu12/wix/releases/tag/v1.8.0) |
| 2026-05-27 | 睡眠定时跨刷新持久化 | [PR #18](https://github.com/hkshu12/wix/pull/18), [v1.7.0](https://github.com/hkshu12/wix/releases/tag/v1.7.0) |
| 2026-05-27 | PWA manifest 与 Pages 子路径对齐 | [PR #16](https://github.com/hkshu12/wix/pull/16), [v1.6.0](https://github.com/hkshu12/wix/releases/tag/v1.6.0) |
| 2026-05-27 | Android 自动更新与应用菜单 | [PR #14](https://github.com/hkshu12/wix/pull/14), [v1.5.0](https://github.com/hkshu12/wix/releases/tag/v1.5.0) |
| 2026-05-27 | 场景预设（收藏组合） | [PR #15](https://github.com/hkshu12/wix/pull/15), [v1.4.0](https://github.com/hkshu12/wix/releases/tag/v1.4.0) |
| 2026-05-27 | 混音状态持久化 | [PR #13](https://github.com/hkshu12/wix/pull/13), [v1.3.0](https://github.com/hkshu12/wix/releases/tag/v1.3.0) |
| 2026-05-27 | 睡眠定时 + 渐出停止 | [PR #12](https://github.com/hkshu12/wix/pull/12), [v1.2.0](https://github.com/hkshu12/wix/releases/tag/v1.2.0) |
| 2026-05-23 | CC0 内置环境声、安全区、混音抽屉 | [v1.1.0](https://github.com/hkshu12/wix/releases/tag/v1.1.0) |
| 2026-05-22 | 初版 Web/PWA/Android 混音器 | [v1.0.0](https://github.com/hkshu12/wix/releases/tag/v1.0.0) |
