#!/usr/bin/env bash
# Launch the Wix daily-improvement Cursor Cloud Agent (API v1).
set -euo pipefail

REPO_URL="${WIX_REPO_URL:-https://github.com/hkshu12/wix}"
STARTING_REF="${WIX_STARTING_REF:-main}"
PROMPT_FILE="${WIX_PROMPT_FILE:-.cursor/automations/daily-improvement-prompt.md}"
API_BASE="${CURSOR_API_BASE:-https://api.cursor.com}"

if [[ -z "${CURSOR_API_KEY:-}" ]]; then
  echo "CURSOR_API_KEY is not set. Add it as a repository secret (see docs/automation/daily-improvement.md)." >&2
  exit 1
fi

if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "Prompt file not found: $PROMPT_FILE" >&2
  exit 1
fi

RUN_DATE_UTC="$(date -u +%Y%m%d)"
AGENT_ID="bc-wix-daily-${RUN_DATE_UTC}"

payload="$(jq -n \
  --arg text "$(cat "$PROMPT_FILE")" \
  --arg url "$REPO_URL" \
  --arg ref "$STARTING_REF" \
  --arg agentId "$AGENT_ID" \
  --arg name "Wix daily improvement ${RUN_DATE_UTC}" \
  '{
    agentId: $agentId,
    name: $name,
    prompt: { text: $text },
    repos: [{ url: $url, startingRef: $ref }],
    autoCreatePR: true,
    skipReviewerRequest: false
  }')"

http_code="$(curl -sS -o /tmp/cursor-agent-response.json -w '%{http_code}' \
  --request POST \
  --url "${API_BASE}/v1/agents" \
  -u "${CURSOR_API_KEY}:" \
  --header 'Content-Type: application/json' \
  --data "$payload")"

if [[ "$http_code" == "409" ]]; then
  echo "Agent already started today (${AGENT_ID}). Skipping duplicate launch."
  cat /tmp/cursor-agent-response.json
  exit 0
fi

if [[ "$http_code" -lt 200 || "$http_code" -ge 300 ]]; then
  echo "Cursor API returned HTTP ${http_code}" >&2
  cat /tmp/cursor-agent-response.json >&2
  exit 1
fi

echo "Daily improvement agent launched:"
jq -r '.agent.url // .agent.id // .' /tmp/cursor-agent-response.json
