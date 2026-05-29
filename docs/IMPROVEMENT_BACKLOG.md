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
| ~~手动重试加载失败音轨~~ | 弱网后仍无法播放某轨 | — | 已完成 v1.28.0 |

### P2

| 项 | 场景 | 当前不足 | 建议方案 |
| --- | --- | --- | --- |
| ~~导出/分享混音配置~~ | 向朋友分享「雨+篝火」配方 | — | 已完成 v1.13.0 |
| ~~混音分享 URL 深链~~ | 点开链接即导入配方 | — | 已完成 v1.19.0 |
| ~~横屏与安全区细化~~ | 平板/手机横屏 | — | 已完成 v1.14.0 |
| ~~新内置环境声（办公室 HVAC）~~ | 办公室空调、专注底噪 | — | 已完成 v1.36.0 |
| ~~新内置环境声（工地）~~ | 装修/城市氛围 | — | 已完成 v1.39.0 |
| ~~新内置环境声（白噪音）~~ | 专注/哄娃需经典白噪 | 仅有粉/棕噪音 | 已完成 v1.47.0 `noise_03.ogg` |
| ~~新内置环境声（溪流）~~ | 冥想/自然放松 | 仅有雨、海边 | 已完成 v1.50.0 `loop_water_01.ogg` |
| **新内置环境声（续）** | 雨棚、鸟鸣、风声等 | 已有 17 轨 | 评估 CC0 `ambient_02`、风声 loop 等；避免连续版本仅加音 |
| ~~大文件导入进度~~ | 长播客/长环境录音 | — | v1.16.0 |
| ~~混音 ARIA 实时区域~~ | 读屏知播放/定时状态 | — | 已完成 v1.12.0 |
| ~~落地页功能列表更新~~ | 新用户了解分享链接、快捷键等 | — | 持续随版本同步 |
| ~~桌面键盘快捷键~~ | 办公专注时免鼠标 | — | 已完成 v1.15.0 |
| ~~快捷键帮助（`?`）~~ | 发现 Space 等快捷键 | — | 已完成 v1.17.0 |
| ~~自定义睡眠定时时长~~ | 90 分钟午睡等非 15–60 预设 | — | 已完成 v1.20.0 |
| ~~更多键盘快捷键~~ | `M` 开抽屉、`+/-` 主音量 | — | 已完成 v1.21.0 |
| ~~内置咖啡馆/列车/公路/飞机舱~~ | 旅途与办公氛围 | — | v1.24–1.27.0 |
| ~~可配置睡眠渐出时长~~ | 哄娃/睡眠不同渐弱 | — | 已完成 v1.30.0 |
| ~~设置页清除全部数据~~ | 换机/隐私重置 | — | 已完成 v1.31.0 |
| ~~播放渐入~~ | 睡眠/婴儿场景避免突兀起播 | — | 已完成 v1.32.0 |
| ~~播放时保持屏幕常亮~~ | 床头/婴儿房 | — | 已完成 v1.33.0 |
| ~~睡眠定时读屏播报~~ | 开始/取消/结束定时 | — | 已完成 v1.34.0 |
| ~~AudioContext 后台恢复~~ | 切回标签页后无声 | — | v1.35.0 |
| ~~自定义音轨库导出~~ | 换机备份导入的音频 | 仅 IndexedDB 存取 | 已完成 v1.51.0 JSON 备份 |
| ~~场景预设备份~~ | 换机后恢复「专注/睡眠」预设 | 预设仅存 localStorage | 已完成 v1.52.0 JSON 备份 |
| ~~唤醒定时~~ | 早晨渐强叫醒 | 无 | 已完成 v1.41.0 |
| ~~Android 分享深链~~ | APK 打开 `/studio?share=…` | 无 intent-filter | v1.44.0 |
| ~~Android 分享链接复制用公网 origin~~ | 从 APK 复制链接给朋友 | 曾复制 `https://localhost/...` | v1.45.0 |
| ~~唤醒定时读屏播报~~ | 低视力用户设叫醒 | — | 已随 v1.41.0 |
| ~~锁屏 Media Session 显示唤醒定时~~ | 锁屏看叫醒倒计时 | — | 已完成 v1.46.0 |
| ~~Studio 唤醒定时 UI 测试~~ | 回归唤醒流程 | — | 已完成 v1.48.0 |
| ~~`useMixerShareDeepLink` 单测~~ | 分享深链回归 | — | 已完成 v1.49.0 |

### 体验场景与缺口（摘要）

| 场景 | 典型需求 | 现状 |
| --- | --- | --- |
| 睡眠 | 定时、渐出、渐入、读屏、常亮 | v1.34–1.35 定时与后台恢复 |
| 午睡/叫醒 | 倒计时后渐强起播 | v1.41.0 唤醒定时 |
| 冥想/放松 | 自然水声、森林氛围 | v1.50.0 溪流；可与森林/雨叠加 |
| 专注/办公 | 预设、办公室氛围、键盘、快速找轨 | v1.38.0 环境声搜索 |
| 哄娃/屏蔽突发声 | 白噪音底噪 | v1.47.0 内置白噪音 |
| 分享/社交 | 发链接好友一键同款混音 | Web/PWA v1.19；Android v1.44–1.45 |
| 换机/备份 | 迁移自定义音频 + 场景预设 | v1.51–1.52.0 设置页 JSON 双备份 |
| 居家/城市 | 屏蔽装修与街道施工 | v1.39.0 工地环境声 |
| 多任务 | 切标签/后台后仍听到混音 | v1.35.0 Web Audio 可见性恢复 |
| 隐私/换机 | 一键清除本机数据 | v1.31.0 设置页两步确认 |
| 弱网 | 内置 OGG 偶发失败 | 自动重试 + 按轨重试 v1.28.0 |
| 读屏 | 播放/加轨/定时/键盘与滑块音量 | 睡眠与唤醒定时均已播报 |
| 锁屏/PWA | 睡眠与唤醒倒计时 | v1.46.0 Media Session 副标题对称 |
| Android 原生 | 后台播放 | 仍为 P1 最大缺口 |

### 代码与架构备注（2026-05-29 第二十八次挖掘）

- **音库**：17 内置轨；CC0 可续加风声 `ambient_02` 等（P2，避免连续纯加音版本）。
- **备份**：v1.51 自定义音频 + v1.52 场景预设；可未来合并为单一「全量备份」v2（非本次范围）。
- **分享深链**：仍不含自定义音轨 blob；预设内自定义轨需先导入音频备份。
- **定时器**：睡眠/唤醒/锁屏/读屏已对称；Android 后台仍为 P1。
- **测试**：`mixerPresetsBackup` 域模块 + Settings 预设导出按钮。
- **版本**：仓库 **1.51.0** → 本次 **1.52.0** 场景预设备份。
- **近期 CHANGELOG**：v1.51.0 自定义库备份——本次补预设迁移闭环。

### 外部信号

- GitHub Issues：无 open issue（2026-05-29）。
- 同类 App：换机备份、Android 后台仍常见；wix 混音分享已强，双 JSON 备份覆盖音频+预设。

## 本次选中项

**完整备份：自定义音频 + 场景预设单文件导出/导入（P1 换机场景）**

- **理由**：v1.51–1.52 已支持分项 JSON，但换机需操作两次且易漏预设或音频；单 PR 在设置页增加「完整备份」推荐入口，复用既有序列化逻辑，不碰 Android 原生。
- **范围**：`fullAppBackup.ts`、`AppLayout` 导入链、`SettingsPage`、版本 **1.53.0**。

## 历史已完成

| 日期 | 项 | 引用 |
| --- | --- | --- |
| 2026-05-29 | 完整备份（音频+预设单 JSON） | v1.53.0 |
| 2026-05-29 | 场景预设备份 JSON 导出/导入 | v1.52.0 |
| 2026-05-29 | 自定义音轨库 JSON 备份导出/导入 | v1.51.0 |
| 2026-05-29 | 内置溪流环境声 | v1.50.0 |
| 2026-05-29 | `useMixerShareDeepLink` 单元测试 | v1.49.0 |
| 2026-05-29 | Studio 唤醒定时 UI 回归测试 | v1.48.0 |
| 2026-05-29 | 内置白噪音环境声 | v1.47.0 |
| 2026-05-29 | 锁屏 Media Session 显示唤醒定时倒计时 | v1.46.0 |
| 2026-05-28 | Android 复制分享链接使用 GitHub Pages 公网 URL | v1.45.0 |
| 2026-05-28 | Android 混音分享深链（GitHub Pages → APK） | v1.44.0 |
| 2026-05-28 | 品牌图标与主题色 | [v1.43.0](https://github.com/hkshu12/wix/releases/tag/v1.43.0) |
| 2026-05-28 | 点选即播与会话恢复自动播放 | [v1.42.0](https://github.com/hkshu12/wix/releases/tag/v1.42.0) |
| 2026-05-28 | Android 应用内更新 APK 下载 ENOENT | [v1.41.1](https://github.com/hkshu12/wix/releases/tag/v1.41.1) |
| 2026-05-28 | 唤醒定时（渐强起播） | [v1.41.0](https://github.com/hkshu12/wix/releases/tag/v1.41.0) |
| 2026-05-28 | 主音量滑块读屏播报 | [v1.40.0](https://github.com/hkshu12/wix/releases/tag/v1.40.0) |
| 2026-05-28 | 内置工地环境声 + 落地页同步 | [v1.39.0](https://github.com/hkshu12/wix/releases/tag/v1.39.0) |
| 2026-05-28 | Studio 环境声搜索/筛选 | [v1.38.0](https://github.com/hkshu12/wix/releases/tag/v1.38.0) |
| 2026-05-28 | 键盘主音量读屏播报 | [v1.37.0](https://github.com/hkshu12/wix/releases/tag/v1.37.0) |
| 2026-05-28 | 内置办公室环境声 | [v1.36.0](https://github.com/hkshu12/wix/releases/tag/v1.36.0) |
| 2026-05-28 | AudioContext 可见性恢复 | [v1.35.0](https://github.com/hkshu12/wix/releases/tag/v1.35.0) |
| 2026-05-28 | 睡眠定时读屏播报 | [v1.34.0](https://github.com/hkshu12/wix/releases/tag/v1.34.0) |
| 2026-05-28 | 播放时保持屏幕常亮 | [v1.33.0](https://github.com/hkshu12/wix/releases/tag/v1.33.0) |
| 2026-05-28 | 可选播放渐入（2/4/6/8 秒） | [v1.32.0](https://github.com/hkshu12/wix/releases/tag/v1.32.0) |
| 2026-05-28 | 设置页清除全部本机数据 | [v1.31.0](https://github.com/hkshu12/wix/releases/tag/v1.31.0) |
| 2026-05-28 | 可配置睡眠渐出时长 | [v1.30.0](https://github.com/hkshu12/wix/releases/tag/v1.30.0) |
| 2026-05-28 | 手动重试加载失败音轨 | [v1.28.0](https://github.com/hkshu12/wix/releases/tag/v1.28.0) |
| 2026-05-28 | 内置飞机舱环境声 | [v1.27.0](https://github.com/hkshu12/wix/releases/tag/v1.27.0) |
| 2026-05-28 | 内置公路环境声 | [v1.26.0](https://github.com/hkshu12/wix/releases/tag/v1.26.0) |
| 2026-05-28 | 内置列车环境声 | [v1.25.0](https://github.com/hkshu12/wix/releases/tag/v1.25.0) |
| 2026-05-28 | 内置咖啡馆环境声 | [v1.24.0](https://github.com/hkshu12/wix/releases/tag/v1.24.0) |
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
