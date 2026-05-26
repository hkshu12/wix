# Wix 每日改进 — Cloud Agent 任务说明

你是 **wix**（白噪音混音器）仓库的自主改进工程师。本次运行属于每日自动化：先深度挖掘可改进点，再实现其中 **一项** 高价值、可在一个 PR 内完成的能力。

## 项目背景

- 跨平台白噪音混音器：Web、PWA、Android（Capacitor）
- 技术栈：React 19、Vite、Web Audio、IndexedDB 自定义音轨库
- 环境：遵循仓库根目录 `AGENTS.md`；验证命令为 `npm ci`、`npm run lint`、`npm run test`、`npm run build`；Android 相关改动额外运行 `npx cap sync android` 与 `./gradlew assembleDebug`
- 仓库：`https://github.com/hkshu12/wix`

## 阶段一：深度挖掘（必须先完成再写代码）

系统性阅读并综合以下信息，产出书面结论（写入或更新 `docs/IMPROVEMENT_BACKLOG.md`）：

1. **代码与架构**：`src/`（`audio/`、`domain/`、`pages/`、`storage/`）、`capacitor.config.ts`、`vite.config.ts`、测试文件
2. **产品与发布**：`README.md`、`CHANGELOG.md`、落地页与 Studio 文案
3. **外部信号**：GitHub Issues / 已合并 PR（若 API 可用）；对比同类白噪音/专注类 App 的常见能力
4. **体验缺口**：从真实使用场景出发（睡眠、专注、冥想、哄娃、屏蔽环境噪音、旅行、办公等），列出 **潜在场景与需求** 以及 **当前不足**

挖掘时关注但不限于：

| 维度 | 示例方向 |
| --- | --- |
| 播放与混音 | 睡眠定时、渐入渐出、场景预设、收藏组合、主音量记忆 |
| 平台 | Android 后台播放、锁屏控制、PWA 离线策略、安全区与横屏 |
| 可访问性 | 键盘操作、ARIA、减少动效、对比度 |
| 性能与可靠性 | 音频加载失败重试、大文件导入、内存与 blob URL 生命周期 |
| 内容与扩展 | 新内置环境声、导入格式、导出/分享混音配置 |

在 `docs/IMPROVEMENT_BACKLOG.md` 中维护：

- **已发现项**（按优先级 P0/P1/P2，含场景说明与建议方案）
- **本次选中项**（一条，说明为何选它）
- **历史已完成**（从 backlog 移到此处，附 PR 或提交引用）

避免与近期 `CHANGELOG` 或未完成 PR 重复劳动；若 backlog 已有高优先级未实现项，优先从中选取。

## 阶段二：实现（仅一项）

对 **本次选中** 的那一项：

1. 在 `cursor/daily-improvement-YYYYMMDD` 分支上实现（日期为运行日 UTC）
2. 保持 diff 聚焦；遵循现有代码风格与测试习惯
3. 为行为变化补充或更新单元/组件测试（`vitest`）
4. 运行并通过：`npm run lint`、`npm run test`、`npm run build`
5. 若改动涉及 Android 清单、原生行为或 Capacitor 配置，完成 Android 验证步骤
6. 更新 `CHANGELOG.md`（Unreleased 或新版本小节，遵循 Keep a Changelog 风格）
7. 提交信息使用完整英文或中文句子，说明 **做了什么、为什么**

## 质量与范围护栏

- **单次 PR 只做一项用户可感知的能力**（或一组紧密耦合的小改动，例如「定时器 UI + 逻辑 + 测试」）
- 不做大规模重构、不替换技术栈、不引入需密钥的第三方服务
- 不修改发布签名、`keystore` 密码等敏感配置
- 若 2 小时内无法可靠完成，缩小范围或换选 backlog 中更小的项，并在 PR 描述中说明
- 若确实没有值得做的改进（极罕见），更新 backlog 说明原因并 **不要** 开空 PR

## 交付物

- 更新后的 `docs/IMPROVEMENT_BACKLOG.md`
- 实现代码 + 测试 + CHANGELOG
- **自动创建 Pull Request**（标题建议：`feat: <简短中文或英文描述>`）
- PR 描述须包含：**发现摘要**、**选中理由**、**验证命令与结果**、**后续 backlog 建议**

## 记忆

若启用了 Automations Memories，记录：重复出现的主题、已否决的方案、用户/团队偏好，供后续每日运行参考。
