---
name: memory-and-files
description: Where Claude Code reads CLAUDE.md, rules, AGENTS.md, auto memory, and every other file under .claude/ and ~/.claude/
---

# Memory and the .claude Directory

## Choose the Right File

| Want to | Edit | Scope |
|---|---|---|
| Project context, conventions, "always do X" | `CLAUDE.md` | project / global |
| Instructions only for some paths | `.claude/rules/*.md` with `paths:` | project / global |
| Allow/block tool calls | `settings.json` → `permissions` or `hooks` | project / global |
| Env vars for sessions | `settings.json` → `env` | project / global |
| Personal overrides, not committed | `.claude/settings.local.json` | project |
| `/name` prompt or on-demand knowledge | `skills/<name>/SKILL.md` | project / global |
| Specialized worker with own tools | `agents/*.md` | project / global |
| Script orchestrating many subagents | `workflows/*.js` (saved from `/workflows`) | project / global |
| Team MCP servers | `.mcp.json` (project root) | project |
| Personal MCP servers, app state, UI toggles | `~/.claude.json` | global |
| Response role/tone/format | `output-styles/*.md` | project / global |
| Gitignored files to copy into new worktrees | `.worktreeinclude` (project root, gitignore syntax) | project |
| Keybindings / themes | `~/.claude/keybindings.json`, `~/.claude/themes/*.json` | global |

`commands/*.md` still works and equals a single-file skill; a skill with the same name wins. Prefer skills.
`CLAUDE_CONFIG_DIR` relocates every `~/.claude` path.

## CLAUDE.md Locations (load order, broadest first)

| Scope | Path |
|---|---|
| Managed | macOS `/Library/Application Support/ClaudeCode/CLAUDE.md`, Linux `/etc/claude-code/CLAUDE.md`; or `claudeMd` key in managed settings |
| User | `~/.claude/CLAUDE.md` |
| Project | `./CLAUDE.md` or `./.claude/CLAUDE.md` |
| Local | `./CLAUDE.local.md` (add to `.gitignore` yourself) |

- Files in cwd **and every ancestor** load at launch and are **concatenated** (root first, cwd last; `CLAUDE.local.md` after `CLAUDE.md` in each dir). Nothing overrides.
- Subdirectory `CLAUDE.md` files load lazily when Claude reads a file there.
- `--add-dir` dirs don't load CLAUDE.md unless `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1`.
- Block-level `<!-- comments -->` are stripped before injection (free maintainer notes).
- Delivered as a user message after the system prompt — guidance, not enforcement. Use hooks/permissions for guarantees.
- Target < 200 lines. Files > 4 MiB are skipped. `/doctor` proposes trims.
- Project-root CLAUDE.md is re-injected after `/compact`; nested ones reload when their files are read again.
- `claudeMdExcludes: ["glob", ...]` (any settings layer, arrays merge) skips files by absolute-path glob. Managed CLAUDE.md can't be excluded.

### Imports

- `@path/to/file` anywhere in the text; relative to the containing file; absolute and `~/` allowed; max depth 4.
- Ignored inside code spans/fences — write `` `@README` `` to mention without importing.
- Imports still load at launch (organization only, no context savings).
- In project files, imports resolving **outside the working directory** trigger a one-time approval dialog. User-scope files (`~/.claude/CLAUDE.md`, `~/.claude/rules/`) import without a dialog.

## Rules (`.claude/rules/`, `~/.claude/rules/`)

- Every `.md` found recursively. No `paths` → loads at launch like CLAUDE.md. With `paths` → loads when Claude **reads** a matching file.
- Only frontmatter field: `paths` (YAML list or comma string). Other fields ignored. Bad YAML → treated as no `paths` (see `claude --debug`).

```md
---
paths:
  - "src/**/*.{ts,tsx}"
  - "tests/**/*.test.ts"
---
# API rules
- Validate input with Zod
```

- User rules load before project rules; neither overrides.
- Symlinks supported. A symlink pointing outside the project is treated like an external import (needs approval; afterwards only non-`paths` rules load). Keep shared rules in `~/.claude/rules/` to avoid that.

## AGENTS.md

Default (`claude-md-or-agents-md`): read `AGENTS.md` / `.claude/AGENTS.md` **only if** no `CLAUDE.md`, `.claude/CLAUDE.md`, or `CLAUDE.local.md` exists in cwd or ancestors (`~/.claude/CLAUDE.md`, managed, and rules don't count). Needs v2.1.277+.

Change via `/config` → Project instructions, or user/`--settings`/managed settings only:

```json
{ "pluginConfigs": { "agents-md@builtin": { "options": { "instructionFiles": "claude-md-and-agents-md" } } } }
```

Values: `claude-md-or-agents-md` (default), `claude-md-and-agents-md`, `claude-md`, `managed-only`.
Portable fallback: `CLAUDE.md` containing `@AGENTS.md` (never double-loads).

## Auto Memory

- `~/.claude/projects/<project>/memory/` — `<project>` derived from the git repo (shared across worktrees); machine-local.
- `MEMORY.md` is the index: first **200 lines or 25KB** load every session. Topic files are read on demand.
- Memory frontmatter `type`: `user` | `feedback` | `project` | `reference`. Claude Code stamps a `modified` ISO timestamp on write.
- Toggle: `/memory`, `"autoMemoryEnabled": false`, or `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`. Relocate: `"autoMemoryDirectory": "~/dir"` (absolute or `~/`).
- Not loaded into subagents (except forks). Subagents get their own via the `memory` frontmatter field.

## Frontmatter Fields by File

| File | Fields |
|---|---|
| `skills/<name>/SKILL.md` | `name`, `description`, `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, `disallowed-tools`, `model`, `effort`, `context`, `agent`, `background`, `hooks`, `paths`, `shell`, `metadata`, `license`, `compatibility` |
| `commands/*.md` | skill fields except `name`, `paths` |
| `agents/*.md` | `name`, `description`, `tools`, `disallowedTools`, `model`, `permissionMode`, `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory`, `background`, `effort`, `isolation`, `color`, `initialPrompt`, `omitClaudeMd`, `experimental` |
| `output-styles/*.md` | `name`, `description`, `keep-coding-instructions`, `force-for-plugin` |
| `rules/*.md` | `paths` |

## Application Data (`~/.claude/`)

- Swept after `cleanupPeriodDays` (default 30, min 1): `projects/*/<session>.jsonl` transcripts, `file-history/`, `plans/`, `debug/`, `paste-cache/`, `tasks/`, `shell-snapshots/`, `backups/`…
- Kept: `history.jsonl`, `stats-cache.json`, auto memory, `agent-memory/`, `.credentials.json`. Never delete `~/.claude.json`, `~/.claude/settings.json`, `~/.claude/plugins/`.
- Transcripts are plaintext — secrets read by tools land on disk. `CLAUDE_CODE_SKIP_PROMPT_HISTORY` skips writing them.
- `claude project purge [path] [--dry-run|--yes|--all|-i]` deletes one project's state.

## Debugging

`/context` (Memory files loaded), `/memory` (browse/edit, toggle auto memory), `InstructionsLoaded` hook (log which files load and why), `/doctor`.

<!--
Source references:
- https://code.claude.com/docs/en/features-overview.md
- https://code.claude.com/docs/en/claude-directory.md
- https://code.claude.com/docs/en/memory.md
-->
