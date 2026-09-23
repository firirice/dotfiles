---
name: subagents
description: Defining Claude Code subagents — scopes, frontmatter, tools, models, permission modes, memory, hooks, forks, nesting
---

# Subagents

Markdown file with YAML frontmatter; the body is the **system prompt** (replaces Claude Code's system prompt). Runs in a fresh context and returns a summary. `/agents` no longer has a wizard (v2.1.198+) — write files directly.

## Scopes (same name → higher priority wins)

| Priority | Location |
|---|---|
| 1 | Managed settings dir `.claude/agents/` |
| 2 | `--agents '<json>'` (session only; `prompt` = body) |
| 3 | `.claude/agents/` (walks up from cwd to repo root; closest wins) |
| 4 | `~/.claude/agents/` |
| 5 | Plugin `agents/` (`plugin:subdir:name`) |

- Directories are scanned recursively; identity comes only from `name`. Duplicate names in one tree → arbitrary pick (`/doctor` reports).
- Live reload for existing dirs; a newly created `agents/` dir needs a restart.
- Silently skipped: no `name`, `---` not on line 1, `name` with `:` or leading `-`, missing `description`, bad YAML. Check with `claude --debug` or `claude plugin validate ~/.claude/agents`.
- Plugin agents ignore `hooks`, `mcpServers`, `permissionMode`.

## Frontmatter (camelCase; unknown fields ignored)

| Field | Notes |
|---|---|
| `name` | **Required.** Hooks see it as `agent_type` |
| `description` | **Required.** When to delegate; add "use proactively" to encourage. Combined descriptions > 15k tokens → warning |
| `tools` | Allowlist (comma string or list). Omit = inherit. `mcp__server` / `mcp__server__*` patterns. `Agent(a, b)` restricts spawnable types only for `--agent` main thread |
| `disallowedTools` | Denylist, applied before `tools`. `Bash(git push *)` removes **all** of Bash — use a permission deny rule instead. `mcp__*` removes all MCP |
| `model` | `sonnet` / `opus` / `haiku` / `fable` / full ID / `inherit` |
| `permissionMode` | `default` (`manual`), `acceptEdits`, `auto`, `dontAsk`, `bypassPermissions`, `plan` |
| `maxTurns` | Stop after N turns (output marked partial; resumable) |
| `skills` | Preload full skill content (can't preload `disable-model-invocation` skills) |
| `mcpServers` | Names of configured servers or inline `.mcp.json`-style definitions (only this agent sees their tools) |
| `hooks` | Scoped hooks; `Stop` becomes `SubagentStop`. Project agent hooks require workspace trust |
| `memory` | `user` → `~/.claude/agent-memory/<name>/`, `project` → `.claude/agent-memory/<name>/`, `local` → `.claude/agent-memory-local/<name>/` |
| `background` | `true` = always background |
| `omitClaudeMd` | Skip user/project/local CLAUDE.md |
| `effort` | `low` … `max` |
| `isolation` | `worktree` = temporary git worktree (from default branch); auto-removed if unchanged |
| `color` | `red` `blue` `green` `yellow` `purple` `orange` `pink` `cyan` |
| `initialPrompt` | First user turn when run as main agent (`--agent`) |
| `experimental.cacheTtl` | `5m` / `1h` |

```md
---
name: code-reviewer
description: Reviews diffs for correctness and security. Use proactively after code changes.
tools: Read, Grep, Glob, Bash
model: sonnet
memory: project
---
You are a senior reviewer. Run git diff, focus on changed files, report by priority with concrete fixes.
```

## Model Resolution

1. Per-invocation `model` param → 2. frontmatter `model` → 3. `CLAUDE_CODE_SUBAGENT_MODEL` → 4. main model.
- A family alias matching the main model's family resolves to the main model exactly (incl. `[1m]`).
- Force one model everywhere: `CLAUDE_CODE_SUBAGENT_MODEL=haiku` + `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` in `env`.
- Explore inherits the main model capped at Opus; override by defining your own `Explore` agent with `model: haiku`.
- `/tasks` shows each running subagent's model.

## Tools Available to Subagents

- Always removed: `AskUserQuestion`, `EnterPlanMode`, `ExitPlanMode` (unless `permissionMode: plan`), `ScheduleWakeup`, `Workflow`, `EndConversation`, `Agent` at depth limit.
- **Background** subagents (default in interactive sessions) keep only: Read, Grep, Glob, LSP, Bash, PowerShell, Edit, Write, NotebookEdit, WebFetch, WebSearch, TodoWrite, Skill, ToolSearch, Enter/ExitWorktree, Monitor, TaskStop, SendMessage, Artifact + all MCP tools.
- A `tools` list that resolves to nothing → launch error.

## Permission Mode Interaction

Parent in `bypassPermissions` / `acceptEdits` / `auto` → subagent uses the parent's mode (its `permissionMode` ignored). Parent in `default` / `dontAsk` / `plan` → subagent's `permissionMode` applies (except `bypassPermissions`). Background subagents surface prompts in the main session.

## What a Subagent Sees at Startup

Own system prompt + env details, Claude's delegation message, CLAUDE.md hierarchy (not for Explore/Plan or `omitClaudeMd`), git status (not Explore/Plan), preloaded skills. **Not**: conversation history, main auto memory, output style. Restate must-follow rules in the delegation prompt.

## Invocation

- Natural language ("use the X subagent"), `@"name (agent)"` / `@agent-<name>` to force, or `claude --agent <name>` / `"agent": "<name>"` in settings to make it the main thread.
- Disable: `"permissions": { "deny": ["Agent(Explore)", "Agent(my-agent)"] }`; deny `Agent` to disable all; `CLAUDE_CODE_DISABLE_EXPLORE_PLAN_AGENTS=1`.
- Resume: Claude uses `SendMessage` with the agent ID/name (Explore/Plan are one-shot). Transcripts: `~/.claude/projects/<p>/<session>/subagents/agent-<id>.jsonl`.

## Background, Forks, Limits

- Fork mode (default on in interactive, off in `-p`/SDK; `CLAUDE_CODE_FORK_SUBAGENT=0|1`): subagents run in background; Claude can spawn `fork` type which inherits full history, tools, model, and prompt cache. `/subtask <task>` starts a fork manually. Deny with `Agent(fork)`.
- `Ctrl+B` backgrounds a running task; `/tasks` lists them.
- Nesting depth default 3 (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`, `1` = off). Concurrency limit 20 (`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`).
- `/btw` for a quick question about current context without a subagent.

## Hooks for Subagent Events (settings.json)

`SubagentStart` / `SubagentStop` with matcher = agent `name` (anchor plugin names: `^my-plugin:db$`). Tool hooks in settings also fire inside subagents.

<!--
Source references:
- https://code.claude.com/docs/en/sub-agents.md
-->
