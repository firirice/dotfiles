---
name: mcp
description: Adding and configuring MCP servers in Claude Code — transports, scopes, .mcp.json, env expansion, OAuth, tool search, output limits
---

# MCP Servers

## Add

```bash
# Remote HTTP (recommended; falls back to SSE automatically)
claude mcp add --transport http notion https://mcp.notion.com/mcp
claude mcp add --transport http api https://api.example.com/mcp --header "Authorization: Bearer $TOKEN"

# Local stdio — everything after `--` goes to the server; put an option between --env and the name
claude mcp add --env API_KEY=xxx --transport stdio airtable -- npx -y airtable-mcp-server

# From JSON (pass the object inside mcpServers, not the wrapper)
claude mcp add-json weather '{"type":"http","url":"https://api.weather.com/mcp"}'
claude mcp add-json events '{"type":"ws","url":"wss://mcp.example.com/socket"}'   # ws only via JSON

# Scope: --scope local (default) | project | user
claude mcp add --transport http shared --scope project https://example.com/mcp
```

Manage: `claude mcp list | get <name> | remove <name> | login <name> [--no-browser] | logout <name> | reset-project-choices`; `/mcp` in-session (status, auth, toggle off). `claude mcp add-from-claude-desktop` imports Desktop config.

## Scopes

| Scope | Stored in | Loads |
|---|---|---|
| local (default) | `~/.claude.json` → `projects["<path>"].mcpServers` | this project, only you |
| project | `.mcp.json` at repo root (commit it) | this project, team; approval prompt per user |
| user | `~/.claude.json` → top-level `mcpServers` | all your projects |

Precedence for same name: local > project > user > plugin > claude.ai connectors (whole entry wins; no field merge). Managed `managedMcpServers` rank above all.

## `.mcp.json` Format

```json
{
  "mcpServers": {
    "api": {
      "type": "http",
      "url": "${API_BASE_URL:-https://api.example.com}/mcp",
      "headers": { "Authorization": "Bearer ${API_KEY}" }
    },
    "local-tool": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@example/mcp-server", "--root", "${CLAUDE_PROJECT_DIR:-.}"],
      "env": { "CACHE_DIR": "/tmp" }
    },
    "core": { "type": "http", "url": "https://mcp.example.com/mcp", "alwaysLoad": true }
  }
}
```

- `type`: `stdio` (default when omitted), `http` (alias `streamable-http`), `sse` (deprecated), `ws`. A `url` without `type` is an error.
- `${VAR}` / `${VAR:-default}` expand in `command`, `args`, `env`, `url`, `headers`. Credential vars (`ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `NPM_TOKEN`, `HTTPS_PROXY`, …) read as **empty** in remote `url`/`headers` — copy into your own var name.
- Stdio servers receive `CLAUDE_PROJECT_DIR` in their env (use `${CLAUDE_PROJECT_DIR:-.}` if referenced in config).
- Other fields: `headersHelper` (command printing headers; needs folder trust), `oauth: {clientId, callbackPort}`, `timeout`, `alwaysLoad`.
- Approvals: `enableAllProjectMcpServers`, `enabledMcpjsonServers`, `disabledMcpjsonServers` in settings. `-p`/SDK/cloud load project servers without asking.

## Auth

OAuth 2.0 for HTTP servers: `/mcp` → authenticate, or `claude mcp login <name>`. Tokens stored and refreshed automatically. Fixed redirect: `--callback-port 8080`; pre-registered client: `--client-id … --client-secret`. A configured `Authorization` header disables the OAuth fallback.

## Context and Output

- **Tool search** (default on): only tool names + server instructions load; schemas load on demand. `ENABLE_TOOL_SEARCH=true|false|auto|auto:N`. Descriptions/instructions truncated at 2,048 chars (`CLAUDE_CODE_MAX_MCP_DESCRIPTION_LENGTH`). `alwaysLoad: true` exempts a server.
- Output: warn > 10k tokens, max 25k (`MAX_MCP_OUTPUT_TOKENS`); over-limit results saved to a file. Servers can set `_meta["anthropic/maxResultSizeChars"]` (≤ 500k).
- `_meta["anthropic/requiresUserInteraction"]: true` forces a prompt every call, in every mode.
- `/context all` shows per-tool token cost.

## Naming and Permissions

Tools: `mcp__<server>__<tool>`; plugin servers `mcp__plugin_<plugin>_<server>__<tool>`; claude.ai connectors `mcp__claude_ai_<server>__<tool>`. Permission rules: `mcp__server`, `mcp__server__*`, `mcp__server__tool`. Hook matchers need `mcp__server__.*`.

- Resources: `@server:protocol://path` mentions.
- Prompts: `/server:prompt (MCP)` or `/mcp__server__prompt args`.
- Scope a server to one subagent via the agent's `mcpServers` frontmatter to keep its tools out of the main context.
- `claude mcp serve` exposes Claude Code itself as a stdio MCP server.
- claude.ai connectors load automatically when signed in with claude.ai; turn off with `disableClaudeAiConnectors: true`.

<!--
Source references:
- https://code.claude.com/docs/en/mcp.md
- https://code.claude.com/docs/en/mcp-quickstart.md
-->
