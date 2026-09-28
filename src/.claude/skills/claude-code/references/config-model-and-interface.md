---
name: model-and-interface
description: Model aliases, effort and thinking, auto-compaction, output styles, and status line scripts
---

# Model, Effort, Output Styles, Status Line

## Models

| Alias | Meaning |
|---|---|
| `default` | clear override → account default |
| `opus` / `sonnet` / `haiku` | latest of each family (Anthropic API: Opus 5.5, Sonnet 5) |
| `fable` / `best` | Fable 5.1 (best = fable if available, else opus) |
| `opus[1m]`, `sonnet[1m]` | 1M-token context |
| `opusplan` | Opus in plan mode, Sonnet for execution |

Pin with full IDs (`claude-opus-5-5`) or `ANTHROPIC_DEFAULT_OPUS_MODEL` / `…_SONNET_MODEL`. Set via `/model` (saves as default; `s` = session only), `--model`, `ANTHROPIC_MODEL`, or settings `model`. `fallbackModel` / `--fallback-model sonnet,haiku` for overload chains. `availableModels` restricts choices.

## Effort

Levels: `low`, `medium`, `high`, `xhigh`, `max` (+ `ultracode` = `xhigh` with dynamic workflows). Defaults: `high`; **Opus 5.5 → `medium`**; Opus 4.7 → `xhigh`.

Resolution: `CLAUDE_CODE_EFFORT_LEVEL` / `--effort` / `/effort` → saved per-model `modelSettings` or `effortLevel` → model default. `/effort` Enter saves per model; `s` session-only; `max` is session-only. Skill/subagent `effort` frontmatter overrides while active. `maxEffortLevel` caps.

- `ultrathink` anywhere in a prompt → deeper reasoning for that turn (other "think" phrases are plain text).
- Thinking toggle: `Option+T`, `alwaysThinkingEnabled`, `MAX_THINKING_TOKENS=0` — no effect on Opus 5.5 / Fable (always adaptive). `showThinkingSummaries: true` to expand full summaries (`Ctrl+O`).

## Auto-Compaction

`/autocompact 500k` (saves `autoCompactWindow`), `--autocompact <auto|tokens>`, `CLAUDE_CODE_AUTO_COMPACT_WINDOW`; range 100k–1M. Default: compact near the model limit. `DISABLE_AUTO_COMPACT=1` / `autoCompactEnabled: false`. `/compact [focus]` manually. Project-root CLAUDE.md and recent skills are re-injected after compaction.

## Output Styles

Built-in: Default, Proactive, Concise, Explanatory (`★ Insight` blocks), Learning (`TODO(human)` handoffs). Select with `/output-style <name>`, `/config`, or settings `outputStyle`.

Custom: `~/.claude/output-styles/<name>.md` or `.claude/output-styles/` (closest to cwd wins). Read at startup — restart after editing.

```md
---
name: Diagrams first
description: Lead every explanation with a diagram
keep-coding-instructions: true   # keep software-engineering instructions; default false replaces them
---
When explaining code, start with a Mermaid diagram, then prose.
```

Output style = how Claude responds (switchable); CLAUDE.md = facts/rules about the project. Subagents don't inherit the style (forks do).

## Status Line

```json
{ "statusLine": { "type": "command", "command": "~/.claude/statusline.sh", "padding": 0, "refreshInterval": 10 } }
```

- Or `/statusline <description>` to have Claude generate one (writes the script + setting).
- Script gets JSON on stdin; each stdout line = one row; ANSI colors and OSC 8 links allowed; use `$COLUMNS` (not `tput`). Runs on new assistant messages, `/compact`, mode changes, timers; debounced 300 ms; no token cost.
- Fields: `model.display_name`, `workspace.current_dir`, `workspace.project_dir`, `workspace.git_worktree`, `cost.total_cost_usd`, `cost.total_duration_ms`, `cost.total_lines_added/removed`, `context_window.used_percentage`, `context_window.context_window_size`, `effort.level`, `thinking.enabled`, `fast_mode`, `rate_limits.five_hour.used_percentage`, `rate_limits.seven_day.used_percentage`, `session_name`, `output_style.name`, `vim.mode`, `agent.name`, `pr.number`, `pr.review_state`, `worktree.name`, `version`, `transcript_path`.

```bash
#!/bin/bash
input=$(cat)
model=$(jq -r '.model.display_name' <<<"$input")
pct=$(jq -r '.context_window.used_percentage // 0' <<<"$input")
dir=$(basename "$(jq -r '.workspace.current_dir' <<<"$input")")
branch=$(git -C "$(jq -r '.workspace.current_dir' <<<"$input")" branch --show-current 2>/dev/null)
echo "[$model] $dir${branch:+ ($branch)} · ${pct}% ctx"
```

Disabled by `disableAllHooks`. `subagentStatusLine` customizes subagent rows.

<!--
Source references:
- https://code.claude.com/docs/en/model-config.md
- https://code.claude.com/docs/en/output-styles.md
- https://code.claude.com/docs/en/statusline.md
-->
