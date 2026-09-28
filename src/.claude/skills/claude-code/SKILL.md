---
name: claude-code
description: Exact specs for configuring and extending Claude Code — CLAUDE.md and rules, settings.json and permissions, hooks, skills, subagents, MCP servers, plugins, output styles, status line, CLI flags, headless/automation. Use when writing or fixing anything under .claude/ or ~/.claude/, .mcp.json, or a plugin, when choosing between these mechanisms, or when a Claude Code configuration doesn't take effect.
metadata:
  version: "2026.09.23"
  source: Generated from https://code.claude.com/docs/llms.txt, scripts at skills-generator/ in the dotfiles repo
---

# Claude Code Configuration

> Based on Claude Code docs as of 2026-09. Behavior changes often — check `claude --version` when a detail depends on a recent release, and fetch the page URL in a reference's source list when something here looks out of date.

## Essentials

- **Where things go**: `CLAUDE.md` (always-loaded rules, <200 lines) · `.claude/rules/*.md` (path-scoped rules) · `.claude/settings.json` (permissions, hooks, env; `.local.json` for personal) · `.claude/skills/<name>/SKILL.md` · `.claude/agents/<name>.md` · `.mcp.json` at repo root · user-level equivalents under `~/.claude/` · `~/.claude.json` is app state, not settings.
- **Precedence**: managed > CLI flags > local > project > user. Arrays (e.g. `permissions.allow`) merge; scalars override. CLAUDE.md files concatenate, they don't override.
- **Guarantees need hooks or permissions** — CLAUDE.md and skills are guidance only.
- **Permission rules**: deny → ask → allow, first match wins; `Bash(npm run *)`, `Read(./.env)`, `Edit(/src/**)`, `WebFetch(domain:x.com)`, `mcp__server__*`.
- **Hooks**: stdin JSON; `exit 2` blocks (exit 1 does not); JSON decisions go inside `hookSpecificOutput` with `hookEventName`.
- **Skills**: folder + `SKILL.md`; `description` decides auto-invocation; `disable-model-invocation: true` for side-effect workflows; `${CLAUDE_SKILL_DIR}` for bundled scripts.
- **Subagents**: `name` + `description` required; body replaces the system prompt; no conversation history.
- **Verify**: `/context`, `/status`, `/hooks`, `/mcp`, `/skills`, `claude doctor`, `claude --debug`.

## References

### Core

| Topic | Description | Reference |
|---|---|---|
| Memory & files | CLAUDE.md locations/imports, rules, AGENTS.md, auto memory, `.claude/` layout, frontmatter per file type | [core-memory-and-files](references/core-memory-and-files.md) |

### Extend

| Topic | Description | Reference |
|---|---|---|
| Skills | Locations, frontmatter, substitutions, `!` injection, `context: fork`, visibility | [extend-skills](references/extend-skills.md) |
| Subagents | Scopes, frontmatter, tools, model resolution, forks, nesting | [extend-subagents](references/extend-subagents.md) |
| Hooks | Events, matchers, handler types, exit codes, JSON output, recipes | [extend-hooks](references/extend-hooks.md) |
| MCP | `claude mcp add`, scopes, `.mcp.json`, env expansion, OAuth, tool search | [extend-mcp](references/extend-mcp.md) |
| Plugins | Layout, manifest, path variables, marketplaces, testing | [extend-plugins](references/extend-plugins.md) |

### Config

| Topic | Description | Reference |
|---|---|---|
| Settings & permissions | Files, precedence, notable keys, rule syntax, modes, protected paths | [config-settings-permissions](references/config-settings-permissions.md) |
| Model & interface | Aliases, effort, thinking, compaction, output styles, status line | [config-model-and-interface](references/config-model-and-interface.md) |

### Reference

| Topic | Description | Reference |
|---|---|---|
| CLI & commands | Subcommands, flags, slash commands, bundled skills, shortcuts, env vars | [reference-cli-commands](references/reference-cli-commands.md) |

### Advanced & Practices

| Topic | Description | Reference |
|---|---|---|
| Automation | `claude -p`, worktrees, `/loop`, `/goal`, workflows, background agents | [advanced-automation](references/advanced-automation.md) |
| Setup & debugging | Which mechanism to use, CLAUDE.md writing, dotfiles-managed `~/.claude`, troubleshooting table | [best-practices-setup](references/best-practices-setup.md) |

Full docs index: https://code.claude.com/docs/llms.txt (append `.md` to any page URL for markdown).
