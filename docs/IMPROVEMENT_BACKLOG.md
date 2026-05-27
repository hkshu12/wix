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
| **Android 后台播放与锁屏控制** | 锁屏/切 App 继续听 | 纯 WebView，无 Media Session | Capacitor 插件或原生 foreground service；需调研 `@capacitor-community/media` 或自定义插件 |
| ~~PWA `start_url` 与 Pages 子路径~~ | GitHub Pages 子目录安装 PWA | — | 已完成 v1.6.0 |
| ~~音频加载失败重试~~ | 弱网或 OGG 短暂不可用 | — | 已完成 v1.8.0 |
| ~~减少动效（`prefers-reduced-motion`）~~ | 前庭敏感用户 | — | 已完成 v1.10.0 |
| ~~底部抽屉焦点陷阱~~ | 键盘/读屏用户 | — | 已完成 v1.9.0 |
| ~~睡眠定时持久化~~ | 睡前设好定时后刷新页面 | — | 已完成 v1.7.0 |

### P2

| 项 | 场景 | 当前不足 | 建议方案 |
| --- | --- | --- | --- |
| ~~导出/分享混音配置~~ | 向朋友分享「雨+篝火」配方 | — | 已完成 v1.13.0 |
| ~~横屏与安全区细化~~ | 平板/手机横屏 | — | 已完成 v1.14.0 |
| **新内置环境声** | 风扇、咖啡馆、列车等 | 8 轨 CC0 集 | 扩展 `sounds.ts` + `sounds:download` |
| ~~大文件导入进度~~ | 长播客/长环境录音 | 仅状态文案 | `FileReader` 进度条（v1.16.0） |
| ~~混音 ARIA 实时区域~~ | 读屏知播放/定时状态 | — | 已完成 v1.12.0 |
| ~~落地页功能列表更新~~ | 新用户了解能力 | — | 已完成 v1.11.0 |
| ~~桌面键盘快捷键~~ | 办公专注时免鼠标 | — | 已完成 v1.15.0（Space 播放/暂停） |
| **快捷键帮助（`?`）** | 发现 Space 等快捷键 | 无说明 UI | 抽屉内一行提示或 `?` 打开简短说明 |

### 体验场景与缺口（摘要）

| 场景 | 典型需求 | 现状 |
| --- | --- | --- |
| 睡眠 | 定时、渐出、低亮度 UI | 定时+渐出+刷新后恢复（v1.7.0） |
| 专注 | 预设、快速恢复、横屏平板、键盘控制 | 预设+快照；横屏 v1.14.0；Space 播放 v1.15.0 |
| 冥想 | 慢速播放、简单组合 | 有全局/ per-track 速度 |
| 哄娃 | 长时间稳定循环 | 定时渐出可用 |
| 屏蔽噪音 | 粉/棕噪 + 雨声 | 内置齐全 |
| 旅行/办公 | 离线 PWA、子路径安装 | v1.6.0 manifest 对齐 |
| 弱网/首次加载 | 内置 OGG 偶发失败 | fetch+decode 指数退避重试（v1.8.0） |
| 前庭敏感 | 减少 UI 动效 | 系统「减少动态效果」下抽屉/导航瞬时切换（v1.10.0） |
| 新用户认知 | 落地页了解 Studio 能力 | v1.11.0 补充定时/预设/持久化文案 |
| 读屏用户 | 播放/加轨状态播报 | v1.12.0 混音台 `role="status"` live 区域 |
| 社交分享 | 把配方发给朋友 | v1.13.0 JSON 分享码复制/粘贴导入 |
| 平板横屏 | 一屏多看环境声、少挡内容 | v1.14.0 宽屏多列 + 手机横屏右侧 dock |
| 自定义内容 | 导入本地音频 | IndexedDB + 混音层可恢复；读取阶段有进度条（v1.16.0） |

### 代码与架构备注（2026-05-27 三次挖掘）

- **分层清晰**：`domain/` / `storage/` / `audio/` 与 `AppLayout` 编排分离良好；`AppLayout` 仍偏大（导入/预设/分享共用状态）。
- **导入路径**：`readFileAsArrayBuffer`（`lib/readFileWithProgress.ts`）→ `saveCustomTrack` → IndexedDB；进度仅覆盖读取阶段，写入 IndexedDB 仍瞬时完成。
- **键盘**：Space 播放/暂停已上线；`?` 帮助仍缺。
- **响应式**：v1.14.0 横屏与 PWA `orientation: any`。
- **测试**：Vitest + `StudioPage` 集成测；域/存储/工具函数单测覆盖 sleep timer、share、keyboard、file read。
- **Android**：Capacitor 8；后台音频仍为最大平台缺口（P1）。

### 外部信号

- GitHub Issues：当前无 open issue（2026-05-27）。
- 近期 CHANGELOG：v1.15.0 Space 快捷键已合并（PR #26）——**避免重复**。
- 同类 App 常见能力：后台播放、更多环境声、快捷键说明——下一项建议 **Android 后台**、**新内置声** 或 **`?` 快捷键帮助**。

## 本次选中项

**大文件导入进度条（P2）**

- **理由**：v1.15.0 已交付 Space 快捷键；P1 Android 后台需原生插件，单次 PR 风险高。自定义音频导入在弱机/长文件场景下此前只有静态「正在导入…」，用户无法判断卡死还是进行中；`FileReader` 进度纯前端、与 `UpdatePage` 进度条模式一致，改动面可控。
- **范围**：`readFileAsArrayBuffer`、`saveCustomTrack` 回调、`importProgress` 状态、Studio 抽屉 `role="progressbar"`、单测；不含 IndexedDB 写入分块。

## 历史已完成

| 日期 | 项 | 引用 |
| --- | --- | --- |
| 2026-05-27 | 大文件导入进度条 | v1.16.0（本次） |
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
