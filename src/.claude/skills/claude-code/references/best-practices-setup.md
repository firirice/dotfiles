---
name: setup-best-practices
description: Choosing the right extension, writing CLAUDE.md, managing ~/.claude from dotfiles, and debugging configuration that doesn't take effect
---

# Setup Best Practices and Debugging

## Pick the Mechanism by Trigger

| Trigger | Add |
|---|---|
| Claude gets a convention/command wrong twice | CLAUDE.md line |
| Only relevant for some paths | `.claude/rules/*.md` with `paths:` |
| You keep typing the same prompt / pasting a playbook | skill (`disable-model-invocation: true` if it has side effects) |
| Reference docs needed sometimes | skill (reference type) |
| Must happen every time / must be enforced | hook or permission rule — never just CLAUDE.md |
| Side task floods context | subagent |
| Need an external system's data/actions | MCP server (+ skill describing how to use it) |
| Response tone/length/format | output style |
| Second repo needs the same setup | plugin |

Rule: CLAUDE.md = facts & "always" rules (<200 lines); skills = on-demand knowledge & workflows; hooks/permissions = guarantees.

## Writing CLAUDE.md

- Include: commands Claude can't guess, style rules that differ from defaults, test runner/instructions, branch/PR etiquette, env quirks, gotchas.
- Exclude: what the code already shows, standard conventions, long docs (link or move to a skill), frequently changing info, file-by-file tours.
- For each line ask "would removing this cause mistakes?" Emphasize (`IMPORTANT`) only single lines.
- Concrete and verifiable: "Run `pnpm test` before committing", not "test your changes".
- Global `~/.claude/CLAUDE.md`: personal preferences for all projects (commit format, language, style). Project CLAUDE.md: team conventions.
- `/init` bootstraps; `/doctor` proposes trims; `/context` confirms loading.

## Managing `~/.claude` from dotfiles

- Symlinking files into `~/.claude/` works for CLAUDE.md, settings.json, skills, agents, rules, output styles, commands (skill folders may also be symlinked directories).
- Claude's **Edit/Write tools refuse to write through a symlink** (`… is a symbolic link. Write to the link's target path instead`). Edit the real file in the dotfiles repo.
- Claude Code itself writes `~/.claude/settings.json` (e.g. `/model`, `/config`, `/memory` toggles, `modelSettings`). If that file can't be written (e.g. a read-only link), such changes last only for the session. If it is a writable symlink into the repo, check `git diff` for these machine-written keys before committing.
- Workflow saves (`/workflows` → `s`) refuse a symlinked target file.
- Never version: `~/.claude.json` (OAuth, trust, MCP state), `.credentials.json`, `projects/`, `history.jsonl`, caches. `settings.local.json` is per-machine.
- Don't name a skill folder `synced` (reserved for claude.ai sync in `~/.claude/skills/synced/`).
- New top-level dirs (`~/.claude/agents/`, `~/.claude/skills/`) created mid-session need a restart; edits inside existing ones hot-reload.
- `CLAUDE_CONFIG_DIR` can point Claude Code at an alternate config directory.

## Session Hygiene

- `/clear` between unrelated tasks; after two failed corrections, `/clear` and re-prompt with what you learned.
- Explore → plan (`Shift+Tab` to plan mode) → implement → verify. Give Claude a way to verify (tests, scripts, screenshots).
- Scope investigations or delegate them to subagents.
- `Esc` to interrupt, `Esc Esc` / `/rewind` to roll back; `/btw` for side questions.

## Debug Configuration

1. `/context` — what's actually loaded (memory files, skills, agents, MCP tools).
2. `/memory`, `/skills`, `/hooks`, `/mcp`, `/permissions`, `/status` (setting sources).
3. `claude doctor` (terminal, read-only) / `/doctor` (in-session, proposes fixes).
4. `claude --debug` or `--debug-file /tmp/claude.log`; `--debug=mcp` for MCP stderr; log at `~/.claude/debug/<session>.txt`.
5. Isolate: `claude --safe-mode` (no customizations), or `cd /tmp && CLAUDE_CONFIG_DIR=/tmp/claude-clean claude`.

| Symptom | Cause |
|---|---|
| Hook never fires | `matcher` is an array / lowercase (`bash`) / misspelled; hooks placed in a standalone file (only plugins use `hooks/hooks.json`) |
| Global permissions/hooks/env ignored | put in `~/.claude.json` instead of `~/.claude/settings.json` |
| Settings value ignored | overridden by `settings.local.json`, `--settings`, managed, or an env var |
| Skill not in `/skills` | file at `skills/name.md` instead of `skills/name/SKILL.md`; bad YAML (`claude plugin validate ~/.claude/skills`) |
| Skill never auto-invoked | `disable-model-invocation: true`, or description lacks the words users say |
| Subdirectory CLAUDE.md ignored | loads only when Claude **reads** a file there |
| Explore/Plan ignore CLAUDE.md | by design — restate in the delegation prompt |
| `.mcp.json` servers missing | file under `.claude/`, key `servers` instead of `mcpServers`, approval dismissed, or `mcpServers` put in settings.json |
| MCP server fails from some dirs | relative paths in `command`/`args` |
| `Bash(rm *)` deny doesn't block `/bin/rm` | rules match literal text — use hooks or sandbox |
| Hook JSON ignored | shell profile echoes on stdout; fields at wrong level (`permissionDecision` must be in `hookSpecificOutput`) |

<!--
Source references:
- https://code.claude.com/docs/en/features-overview.md
- https://code.claude.com/docs/en/best-practices.md
- https://code.claude.com/docs/en/debug-your-config.md
- https://code.claude.com/docs/en/errors.md
- https://code.claude.com/docs/en/memory.md
-->
