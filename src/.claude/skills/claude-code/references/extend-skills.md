---
name: skills
description: Authoring Claude Code skills — locations, frontmatter, substitutions, dynamic context, forking, visibility control
---

# Skills

A skill = `<dir>/SKILL.md` (+ optional supporting files). Follows the [Agent Skills](https://agentskills.io) standard plus Claude Code extensions. `.claude/commands/<name>.md` is the legacy single-file form (same fields except `name`, `paths`); a skill with the same name wins.

## Locations

| Level | Path | Notes |
|---|---|---|
| Enterprise | `.claude/skills/` in managed settings dir | wins over personal |
| Personal | `~/.claude/skills/<name>/SKILL.md` | not loaded in Cowork/cloud sessions/routines |
| Project | `.claude/skills/<name>/SKILL.md` | cwd and every parent up to repo root |
| Nested | `<subdir>/.claude/skills/...` | loads when Claude first touches files there; clash → `/<subdir>:<name>` |
| `--add-dir` | `<dir>/.claude/skills/` | also its `commands/`, `agents/` |
| Plugin | `<plugin>/skills/<name>/SKILL.md` | `/plugin:name` |
| claude.ai sync | `~/.claude/skills/synced/` | download-only; `/anthropic-skills:<name>` |

- Same name: enterprise > personal > project; your skill replaces a bundled one (not its aliases).
- Skill folders may be symlinks (loaded once per target). Don't name a folder `synced`.
- Adding `.claude-plugin/plugin.json` to a skill folder turns it into plugin `<name>@skills-dir`.
- Live reload: edits under existing skills dirs apply mid-session. A newly created top-level skills dir needs a restart.
- Command name = directory name (not frontmatter `name`, which is only the display label), except in plugins.

## Frontmatter

Only honored when `---` is line 1. Unknown fields are silently ignored; malformed YAML → skill loads with no metadata (check `claude --debug` or `claude plugin validate ~/.claude/skills`). Booleans accept `yes/no/on/off/1/0`.

| Field | Purpose |
|---|---|
| `name` | Display name (defaults to dir) |
| `description` | What + when. Key use case first. `description`+`when_to_use` capped at 1,536 chars in listing |
| `when_to_use` | Extra trigger phrases, appended to description |
| `argument-hint` | Autocomplete hint, e.g. `[issue-number]` |
| `arguments` | Named positional args → `$name` |
| `disable-model-invocation` | `true` = user-only; description not in context; not preloadable into subagents; won't run from scheduled tasks |
| `user-invocable` | `false` = Claude-only; hidden from `/` menu |
| `allowed-tools` | Pre-approve tools for the invoking turn only (clears on next user message). Not gated by workspace trust |
| `disallowed-tools` | Remove tools while active (clears on next message) |
| `model` | Model for the rest of the turn (`inherit` allowed) |
| `effort` | `low` / `medium` / `high` / `xhigh` / `max` |
| `context` | `fork` = run as a subagent with the skill body as its prompt |
| `agent` | Subagent type for `context: fork` (default `general-purpose`; `Explore`, `Plan`, or custom) |
| `background` | With `fork`: `false` waits for the result (default `true`, background) |
| `hooks` | Hooks registered when invoked, alive for the rest of the session |
| `paths` | Globs; auto-load only when working with matching files |
| `shell` | `bash` (default) or `powershell` for `!` injection |
| `metadata`, `license`, `compatibility` | Spec fields; not acted on |

Portability: claude.ai uploads / Skills API accept only `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools` — others hard-fail.

## Substitutions

| Token | Value |
|---|---|
| `$ARGUMENTS` | Full argument string. If no placeholder consumes args, `ARGUMENTS: <value>` is appended |
| `$ARGUMENTS[N]` / `$N` | 0-based positional (shell-style quoting). Missing index stays literal |
| `$name` | From `arguments:`; missing → empty string |
| `${CLAUDE_SKILL_DIR}` | Dir containing SKILL.md |
| `${CLAUDE_PROJECT_DIR}` | Project root |
| `${CLAUDE_SESSION_ID}`, `${CLAUDE_EFFORT}` | Session ID, effort level |
| `${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_PLUGIN_DATA}` | Plugin skills only |

`${CLAUDE_SKILL_DIR}` / `${CLAUDE_PROJECT_DIR}` are also expanded inside `allowed-tools` Bash rules — use the same path in both to run a bundled script without prompts:

```yaml
---
description: Render a chart from a CSV file
allowed-tools: Bash(${CLAUDE_SKILL_DIR}/scripts/render.sh *)
---
Run `${CLAUDE_SKILL_DIR}/scripts/render.sh <csv>`.
```

Escape a literal `$1` as `\$1`. Stacking: `/a /b 123` loads both skills (up to 6), each gets `123`.

## Dynamic Context Injection

- `` !`cmd` `` (at line start or after whitespace) or a ```` ```! ```` fenced block runs **before** Claude sees the skill; output replaces it. Single pass, not re-scanned.
- Runs in the session's cwd, stderr merged, 2-min timeout.
- Any non-zero exit aborts the whole invocation (`Shell command failed for pattern ...`), except exit 1 of search/compare commands. Append `|| true` when needed.
- Never prompts: anything not allowed by permission rules / `allowed-tools` aborts (outside auto mode).
- `"disableSkillShellExecution": true` disables it (bundled/managed skills unaffected). Never runs for claude.ai-synced skills.
- Include `ultrathink` in the body to request deep reasoning.

## Lifecycle and Size

- Rendered body enters the conversation once and stays; not re-read on later turns. Write standing instructions.
- After auto-compaction: most recent invocation of each skill is re-attached (first 5k tokens each, 25k total budget, newest first).
- Keep SKILL.md < 500 lines; move detail to supporting files and link them from SKILL.md so Claude knows when to read them.

## `context: fork`

Runs a new subagent (type from `agent`) whose prompt is the skill body — **no conversation history**. Not the same as forking the conversation. Only useful for skills with an explicit task. Background by default (narrower tool set; edits bypass `/rewind`); `-p`, SDK, and scheduled tasks wait.

## Visibility and Access Control

| Frontmatter | You invoke | Claude invokes | In context |
|---|---|---|---|
| default | ✓ | ✓ | description always |
| `disable-model-invocation: true` | ✓ | ✗ | nothing until invoked |
| `user-invocable: false` | ✗ | ✓ | description always |

- Permission rules: `Skill` (all), `Skill(name)`, `Skill(name *)` in allow/deny.
- `skillOverrides` in settings (not for plugin skills): `"on"` | `"name-only"` | `"user-invocable-only"` | `"off"`. `/skills` menu writes it (Space to cycle) to `.claude/settings.local.json`.
- `disableBundledSkills: true` turns off bundled skills (`/code-review`, `/batch`, `/debug`, `/loop`, `/run`, `/verify`, …).

## Listing Budget

All names always listed; descriptions trimmed when over budget (1% of context window; least-used first). Tune with `skillListingBudgetFraction`, `skillListingMaxDescChars`, or `SLASH_COMMAND_TOOL_CHAR_BUDGET`. `/doctor` estimates cost; `/skill-doctor` reports unused skills.

## Testing

- Check it's listed ("What skills are available?", `/skills`, `/context`).
- Compare fresh sessions with vs without the skill on realistic prompts.
- `skill-creator` plugin (`/plugin install skill-creator@claude-plugins-official`) runs evals and description tuning; `claude plugin eval` for plugin skills.
- Personal skills vanished → look in `~/.claude/skills/.trash/`.

<!--
Source references:
- https://code.claude.com/docs/en/skills.md
-->
