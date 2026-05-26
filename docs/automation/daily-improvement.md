# 每日改进自动化（Wix）

每天 **北京时间 06:00**，GitHub Actions 通过 [Cursor Cloud Agents API](https://cursor.com/docs/cloud-agent/api/endpoints) 启动一次云 Agent。Agent 会：

1. 深度挖掘 wix 的潜在场景、需求与当前不足（更新 `docs/IMPROVEMENT_BACKLOG.md`）
2. 从 backlog 中选取 **一项** 高价值改进并实现
3. 运行 lint / test / build，并 **自动打开 Pull Request**

## 一次性配置

### 1. Cursor API Key

1. 登录 [Cursor Dashboard](https://cursor.com/dashboard) → **Integrations**（或 Cloud Agents 设置）
2. 创建具备 **Cloud Agents** 权限的 API Key
3. 在 GitHub 仓库 **Settings → Secrets and variables → Actions** 中添加：

   | Secret 名称 | 说明 |
   | --- | --- |
   | `CURSOR_API_KEY` | 上一步生成的 Key |

4. 确保 Cursor 已安装 GitHub App，并对 `hkshu12/wix` 具备 **读写** 权限（Agent 需要推送分支与开 PR）

### 2. 验证工作流

手动触发一次：

**Actions → Daily improvement → Run workflow**

成功后可在 [cursor.com/agents](https://cursor.com/agents) 看到运行记录；完成后仓库会出现 Agent 创建的 PR。

### 3. 时区说明

| 期望触发时间 | `cron`（UTC） |
| --- | --- |
| 每天 06:00 北京时间 (UTC+8) | `0 22 * * *`（默认，见 `.github/workflows/daily-improvement.yml`） |
| 每天 06:00 UTC | 改为 `0 6 * * *` |

GitHub Actions 的 `schedule` 仅支持 UTC。

## 仓库内相关文件

| 路径 | 作用 |
| --- | --- |
| `.cursor/automations/daily-improvement-prompt.md` | Agent 任务说明（发现 + 实现） |
| `.github/scripts/launch-daily-improvement-agent.sh` | 调用 `POST /v1/agents` |
| `.github/workflows/daily-improvement.yml` | 定时与手动触发 |
| `docs/IMPROVEMENT_BACKLOG.md` | 改进项 backlog（由 Agent 维护） |

同一 UTC 日只会启动一次 Agent（`agentId`: `bc-wix-daily-YYYYMMDD`）；重复触发返回 HTTP 409 时工作流会正常跳过。

## 可选：Cursor Automations 控制台

若希望在 Cursor 控制台统一管理，也可在 [cursor.com/automations](https://cursor.com/automations) 新建自动化：

- **触发器**：Cron `0 22 * * *`（或界面中的每日 6:00 北京时间等价设置）
- **仓库**：`hkshu12/wix`，分支 `main`
- **工具**：Open pull request、Memories（可选）
- **提示词**：复制 `.cursor/automations/daily-improvement-prompt.md` 全文

GitHub Actions 与控制台自动化 **二选一即可**，避免同一天重复启动两次。

## 费用与权限

Cloud Agent 按用量计费（Max Mode）。请为团队设置合理的 spend limit。自动化需要付费 Cursor 计划。
