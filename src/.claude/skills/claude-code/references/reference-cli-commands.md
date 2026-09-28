---
name: cli-commands
description: Claude Code CLI subcommands and flags, slash commands, bundled skills, keyboard shortcuts, and commonly used environment variables
---

# CLI, Slash Commands, Shortcuts

## CLI Subcommands

| Command | Purpose |
|---|---|
| `claude ["prompt"]` | interactive session |
| `claude -p "q"` / `cat f \| claude -p "q"` | non-interactive (print) |
| `claude -c` / `claude -r <id\|name> ["q"]` | continue latest / resume |
| `claude mcp …` | add, add-json, list, get, remove, login, logout, serve, add-from-claude-desktop, reset-project-choices |
| `claude plugin …` | init, install, uninstall, enable, disable, update, list, details, validate, eval, prune |
| `claude agents [--json]` / `attach` / `logs` / `stop` / `rm` / `respawn` | background sessions (agent view) |
| `claude doctor` | read-only install + settings diagnostics |
| `claude auth login\|logout\|status` | auth |
| `claude setup-token` | long-lived OAuth token for CI |
| `claude update`, `claude install [stable\|latest\|x.y.z]` | versions |
| `claude project purge [path] [--dry-run]` | delete local state for a project |
| `claude import [codex\|gemini\|cursor]` | bring config from other agents |
| `claude auto-mode defaults\|config\|reset` | auto-mode classifier rules |

## Key Flags

| Flag | Notes |
|---|---|
| `--model <alias\|id>`, `--effort <low…max\|ultracode>`, `--fallback-model a,b` | model per session |
| `--permission-mode <mode>`, `--dangerously-skip-permissions`, `--allow-dangerously-skip-permissions` | permissions |
| `--allowedTools "Bash(git log *)" "Read"`, `--disallowedTools …`, `--tools "Bash,Edit,Read"` | tool control |
| `--settings <file\|json>`, `--setting-sources user,project,local` | settings |
| `--add-dir <path>` | extra working dirs (file access; loads its skills/agents/commands) |
| `--agent <name>`, `--agents '<json>'` | main-thread agent / session-only subagents |
| `--append-system-prompt[-file]`, `--system-prompt[-file]` | system prompt (append keeps defaults) |
| `--mcp-config <file…>`, `--strict-mcp-config` | MCP for this run |
| `--plugin-dir <dir\|zip>`, `--plugin-url <url>` | load plugins for one session |
| `-w, --worktree [name\|#PR]`, `--tmux` | isolated git worktree at `.claude/worktrees/<name>` |
| `-n, --name <name>`, `--fork-session`, `--session-id <uuid>`, `--from-pr <n>` | sessions |
| `--bg "prompt"` | start as background agent |
| `--bare` | skip hooks, skills, plugins, MCP, CLAUDE.md, auto memory (fast scripted runs) |
| `--safe-mode` | disable all customizations to debug config |
| `--debug[=cats]`, `--debug-file <path>`, `--verbose` | diagnostics |
| Print-mode only | `--output-format text\|json\|stream-json`, `--input-format`, `--json-schema`, `--max-turns`, `--max-budget-usd`, `--no-session-persistence`, `--permission-prompt-tool`, `--permission-prompts none`, `--include-hook-events`, `--init`, `--maintenance` |

## Slash Commands (built-in)

Context & session: `/clear [name]`, `/compact [focus]`, `/context [all]`, `/resume`, `/rename`, `/branch`, `/rewind` (`Esc Esc`), `/export`, `/copy [N]`, `/btw <q>`, `/recap`, `/usage` (`/cost`, `/stats`), `/cd <path>`, `/add-dir <path>`.
Config: `/config [k=v]`, `/status`, `/model`, `/effort`, `/fast`, `/permissions`, `/hooks`, `/memory`, `/mcp`, `/plugin`, `/reload-plugins`, `/skills`, `/reload-skills`, `/keybindings`, `/statusline`, `/theme`, `/output-style`, `/sandbox`, `/terminal-setup`, `/tui`, `/init`, `/import`.
Work modes: `/plan [task]`, `/goal <condition>`, `/tasks`, `/subtask <task>` (fork), `/fork`, `/background`, `/workflows`, `/diff`.
Diagnostics: `/doctor`, `/debug`, `/skill-doctor`, `/insights`, `/release-notes`, `/bug`, `/feedback`.

Bundled skills (prompt-based, overridable; `disableBundledSkills`): `/code-review` (`/review`), `/simplify`, `/security-review`, `/batch`, `/loop [interval] [prompt]`, `/schedule` (cloud routines), `/verify`, `/run`, `/run-skill-generator`, `/update-config`, `/fewer-permission-prompts`, `/claude-api`, `/dataviz`, `/design`, `/deep-research`, `/workflow-authoring`.

MCP prompts: `/server:prompt` or `/mcp__server__prompt args`.

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Shift+Tab` | cycle permission modes |
| `Esc` / `Esc Esc` | interrupt / clear draft or open rewind |
| `Ctrl+C` / `Ctrl+D` | interrupt or clear / exit |
| `Ctrl+O` | transcript viewer |
| `Ctrl+B` | background running task |
| `Ctrl+T` | toggle task checklist |
| `Ctrl+G` | edit prompt in `$EDITOR` |
| `Ctrl+R` | history search |
| `Ctrl+S` | stash/restore prompt |
| `Ctrl+V` (`Cmd+V` iTerm2) | paste image |
| `Option+P` / `Option+T` / `Option+O` | switch model / toggle thinking / toggle fast mode |
| `!cmd` | shell mode (output added to context) |
| `@path` | file/resource mention |
| `?` | shortcut help |

Rebind in `~/.claude/keybindings.json` (`/keybindings`; `$schema: https://www.schemastore.org/claude-code-keybindings.json`). Vim mode: `/config` → Editor mode (`editorMode: "vim"`).

## Commonly Used Environment Variables

| Variable | Effect |
|---|---|
| `CLAUDE_CONFIG_DIR` | relocate `~/.claude` |
| `ANTHROPIC_MODEL` | model (beats `model` setting) |
| `CLAUDE_CODE_SUBAGENT_MODEL`, `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` | subagent model |
| `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`, `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` | subagent limits |
| `CLAUDE_CODE_FORK_SUBAGENT=0\|1` | fork mode |
| `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` | auto memory off |
| `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1` | load CLAUDE.md from `--add-dir` dirs |
| `CLAUDE_CODE_NEW_INIT=1` | interactive `/init` (CLAUDE.md + skills + hooks) |
| `DISABLE_AUTO_COMPACT=1` | no auto-compaction |
| `MAX_MCP_OUTPUT_TOKENS`, `ENABLE_TOOL_SEARCH` | MCP output / deferral |
| `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` | Stop-hook continuation cap (default 8) |
| `CLAUDE_CODE_DEBUG_LOG_LEVEL=verbose` | verbose debug log |
| `CLAUDE_CODE_SKIP_PROMPT_HISTORY=1` | don't write transcripts/history |
| `DISABLE_AUTOUPDATER=1` | no auto-updates |
| `SLASH_COMMAND_TOOL_CHAR_BUDGET` | skill listing budget |

Set persistently via settings `env`. Full list (hundreds): https://code.claude.com/docs/en/env-vars.md. Error messages: https://code.claude.com/docs/en/errors.md.

<!--
Source references:
- https://code.claude.com/docs/en/cli-reference.md
- https://code.claude.com/docs/en/commands.md
- https://code.claude.com/docs/en/interactive-mode.md
- https://code.claude.com/docs/en/env-vars.md
-->
