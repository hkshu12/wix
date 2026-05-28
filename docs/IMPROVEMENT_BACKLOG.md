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
| **新内置环境声（续）** | 列车、公路通勤等 | 已有 10 轨（含咖啡馆 v1.24.0） | 列车可用 CC0 TrainLoop 拼接延长；或 `sfx100v2_loop_highway` 作旅途底噪 |
| ~~大文件导入进度~~ | 长播客/长环境录音 | — | v1.16.0 |
| ~~混音 ARIA 实时区域~~ | 读屏知播放/定时状态 | — | 已完成 v1.12.0 |
| ~~落地页功能列表更新~~ | 新用户了解分享链接、快捷键等 | — | 已完成 v1.23.0（本次 v1.24.0 同步十种内置声） |
| ~~桌面键盘快捷键~~ | 办公专注时免鼠标 | — | 已完成 v1.15.0（Space 播放/暂停） |
| ~~快捷键帮助（`?`）~~ | 发现 Space 等快捷键 | — | 已完成 v1.17.0 |
| ~~自定义睡眠定时时长~~ | 90 分钟午睡等非 15–60 预设 | — | 已完成 v1.20.0 |
| ~~更多键盘快捷键~~ | `M` 开抽屉、`+/-` 主音量 | 仅 Space / `?` | 已完成 v1.21.0 |
| ~~内置咖啡馆环境声~~ | 专注/远程办公氛围 | — | 已完成 v1.24.0 |

### 体验场景与缺口（摘要）

| 场景 | 典型需求 | 现状 |
| --- | --- | --- |
| 睡眠 | 定时、渐出、自定义时长、风扇白噪 | 定时+渐出+刷新恢复；风扇 v1.22.0 |
| 专注 | 预设、咖啡馆氛围、键盘控制 | 咖啡馆 v1.24.0；预设+快照；快捷键 v1.21.0 |
| 冥想 | 慢速播放、简单组合 | 有全局/ per-track 速度 |
| 哄娃 | 长时间稳定循环、风扇声 | 定时渐出+风扇内置轨 |
| 屏蔽噪音 | 粉/棕噪 + 雨声 + 风扇 | 内置齐全 |
| 旅行/办公 | 离线 PWA、子路径安装 | v1.6.0 manifest 对齐；列车声仍缺 |
| 弱网/首次加载 | 内置 OGG 偶发失败 | fetch+decode 指数退避重试（v1.8.0） |
| 前庭敏感 | 减少 UI 动效 | 系统「减少动态效果」（v1.10.0） |
| 新用户认知 | 落地页了解 Studio 能力 | v1.23–24 十种内置声/定时/分享/快捷键 |
| 读屏用户 | 播放/加轨状态播报 | v1.12.0 live 区域 |
| 社交分享 | 把配方发给朋友 | v1.13.0 JSON + v1.19.0 深链 URL |
| 平板横屏 | 一屏多看环境声 | v1.14.0 |
| 自定义内容 | 导入本地音频 | IndexedDB + 导入进度（v1.16.0） |
| PWA 锁屏/通知栏 | 系统级播放/暂停 | v1.18.0 Media Session（Web）；Android 原生仍缺 |

### 代码与架构备注（2026-05-28 三次挖掘）

- **分层清晰**：`domain/` 纯逻辑、`storage/` 快照、`audio/` 引擎、`AppLayout` 编排；分享深链 `mixerShareUrl` + `useMixerShareDeepLink`。
- **内置声库**：10 轨 CC0 OGG；咖啡馆来自 BB_2HTC Night Cafe Vibes（~18s，经 `sounds:download` 转 OGG）；下一候选列车/公路通勤。
- **睡眠定时**：5–480 分钟自定义（v1.20.0）。
- **键盘**：`studioKeyboard` — Space / M / ± / `?`（v1.21.0）。
- **Android**：Capacitor 8；后台音频仍为最大平台缺口（P1），需原生 foreground service。
- **测试**：domain/hook/StudioPage 覆盖快捷键与深链；`LandingPage.test` 覆盖十种内置声文案。
- **版本**：当前实现目标 **1.24.0**；下一项宜 **列车/旅途环境声**（P2）或 **Android 后台**（P1，大项）。

### 外部信号

- GitHub Issues：无 open issue（2026-05-28）；近期 PR 以每日小功能为主。
- 近期 CHANGELOG：v1.23.0 落地页、v1.22.0 风扇——**避免重复**。
- 同类 App：列车白噪、Android 后台播放；Web 功能已较完整，内容与 Android 原生后台为主要缺口。

## 本次选中项

**内置咖啡馆环境声（P2）**

- **理由**：专注/远程办公场景常见需求，CC0 库有 ~18s 可循环的 Night Cafe Vibes；单轨 + 下载脚本 + 落地页计数更新，单 PR 可完成且用户可感知。
- **范围**：`cafe.ogg`、`sounds.ts`、`download-builtin-sounds.sh`、ATTRIBUTION、LandingPage；版本 **1.24.0**。

## 历史已完成

| 日期 | 项 | 引用 |
| --- | --- | --- |
| 2026-05-28 | 内置咖啡馆环境声 | v1.24.0（本次） |
| 2026-05-28 | 落地页功能列表更新 | [v1.23.0](https://github.com/hkshu12/wix/releases/tag/v1.23.0) |
| 2026-05-28 | 内置风扇环境声 | [v1.22.0](https://github.com/hkshu12/wix/releases/tag/v1.22.0) |
| 2026-05-28 | 更多键盘快捷键（M、+/-） | [v1.21.0](https://github.com/hkshu12/wix/releases/tag/v1.21.0) |
| 2026-05-28 | 自定义睡眠定时时长 | [v1.20.0](https://github.com/hkshu12/wix/releases/tag/v1.20.0) |
| 2026-05-27 | 混音分享 URL 深链 | [v1.19.0](https://github.com/hkshu12/wix/releases/tag/v1.19.0) |
| 2026-05-27 | Web Media Session（PWA/桌面锁屏） | [v1.18.0](https://github.com/hkshu12/wix/releases/tag/v1.18.0) |
| 2026-05-27 | 快捷键帮助（`?`） | [v1.17.0](https://github.com/hkshu12/wix/releases/tag/v1.17.0) |
| 2026-05-27 | 大文件导入进度条 | [PR #27](https://github.com/hkshu12/wix/pull/27), [v1.16.0](https://github.com/hkshu12/wix/releases/tag/v1.16.0) |
| 2026-05-27 | 桌面键盘快捷键（Space） | [PR #26](https://github.com/hkshu12/wix/pull/26), [v1.15.0](https://github.com/hkshu12/wix/releases/tag/v1.15.0) |
| 2026-05-27 | 横屏与安全区细化 | [v1.14.0](https://github.com/hkshu12/wix/releases/tag/v1.14.0) |
| 2026-05-27 | 导出/分享混音配置 | [v1.13.0](https://github.com/hkshu12/wix/releases/tag/v1.13.0) |
| 2026-05-27 | 混音播放 ARIA live 播报 | [v1.12.0](https://github.com/hkshu12/wix/releases/tag/v1.12.0) |
| 2026-05-27 | 落地页功能列表更新（首版） | [v1.11.0](https://github.com/hkshu12/wix/releases/tag/v1.11.0) |
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
