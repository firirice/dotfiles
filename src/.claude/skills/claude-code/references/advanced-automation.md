---
name: automation
description: Non-interactive claude -p, worktrees, /loop and cron scheduling, /goal, dynamic workflows, and choosing between parallel-agent approaches
---

# Automation and Parallel Work

## Choose an Approach

| Need | Use |
|---|---|
| Side task that would flood context | subagent (`extend-subagents`) |
| Several independent tasks you check on later | background sessions: `claude --bg "…"`, `claude agents` (agent view) |
| Claude splits and supervises a team with shared task list | agent teams (experimental, off by default) |
| Dozens–hundreds of agents, cross-checked results | dynamic workflow (`ultracode:` prompt, `/workflows`) |
| One large change → many PRs | `/batch <instruction>` |
| Parallel sessions on the same repo without collisions | worktrees (`claude -w name`) |
| Repeat a prompt while session is open | `/loop` |
| Keep working until a condition holds | `/goal` or a Stop hook |
| Run on a schedule without your machine | cloud routines (`/schedule`) |

## `claude -p` (headless)

```bash
claude -p "What does the auth module do?"
cat log.txt | claude -p "explain"
claude -p "Run tests and fix failures" --allowedTools "Bash,Read,Edit" --permission-mode acceptEdits
claude -p "q" --output-format json | jq -r '.result'          # also .session_id, structured_output with --json-schema
claude -p "q" --output-format stream-json --verbose           # streaming events
sid=$(claude -p "Start a review" --output-format json | jq -r .session_id); claude -p "continue" --resume "$sid"
gh pr diff 123 | claude -p --append-system-prompt "Review for security issues." --output-format json
```

- Starts in Manual mode; `-p` has no prompts → pass `--allowedTools` or `--permission-mode auto|dontAsk|acceptEdits`; `--permission-prompts none` for unattended runs.
- `--bare`: skip hooks/skills/plugins/MCP/CLAUDE.md/memory; requires `ANTHROPIC_API_KEY` or `apiKeyHelper` (no OAuth). Recommended for CI/scripts.
- `-p` treats the folder as trusted → project hooks and `.mcp.json` run. Use `--bare` / `--setting-sources user` on untrusted repos.
- User-invocable skills work inside the prompt (`claude -p "/my-skill arg"`); `/model sonnet`, `/config k=v` too.
- `--max-turns`, `--max-budget-usd`, `--no-session-persistence`. Exit 0 on success; SIGTERM → 143.

## Worktrees

```bash
claude -w feature-auth           # .claude/worktrees/feature-auth, branch worktree-feature-auth
claude -w "#1234"                # from PR/MR
```

- Add `.claude/worktrees/` to `.gitignore`. Copy gitignored files (`.env`) via `.worktreeinclude` (gitignore syntax) at repo root.
- `worktree.baseRef`: `"fresh"` (remote default branch, default) or `"head"` (current HEAD). `worktree.sparsePaths`, `worktree.symlinkDirectories` for big repos.
- Subagents: `isolation: worktree` frontmatter. Clean worktrees auto-removed on exit; `-p` worktrees aren't.
- Shared with main checkout: `.git`, project plugins, "don't ask again" approvals, untracked `.claude/skills|agents|commands` when the worktree lacks them.
- `WorktreeCreate`/`WorktreeRemove` hooks replace git logic (other VCS).

## `/loop` and Scheduling

- `/loop 5m check the deploy` (fixed, cron-rounded) · `/loop check CI` (Claude self-paces 1 min–1 h) · `/loop` (maintenance prompt or `.claude/loop.md` / `~/.claude/loop.md`).
- `/loop 20m /some-skill` reruns a model-invocable skill.
- Natural-language reminders: "remind me at 3pm to …" → one-shot cron task.
- Session-scoped: fires only while the session is open and idle; recurring tasks expire after 7 days; `Esc` stops a self-paced loop. `CLAUDE_CODE_DISABLE_CRON=1` disables.
- Cron: 5 fields, local time, no `L`/`W`/names.
- Cloud routines (`/schedule`) run without your machine (min 1 h; no local files; don't read `~/.claude/skills`).

## `/goal`

`/goal all tests in test/auth pass and lint is clean` — starts working immediately; after each turn a separate evaluator checks the condition from the transcript (it doesn't run commands). One goal per session; `/goal` shows status; `/goal clear`. Write one measurable end state + how to prove it + constraints; add "or stop after 20 turns" to bound. Doesn't change permission mode (pair with auto mode for unattended). Works with `-p`.

## Dynamic Workflows

- Trigger: include `ultracode` (or "use a workflow") in a prompt, or `/effort ultracode` to plan a workflow for every substantive task. Bundled: `/deep-research <question>`.
- The runtime executes a JS script Claude writes; spawns many subagents in the background; returns one result; resumable.
- `/workflows` to watch/pause/resume; press `s` to save as `/<name>` into `.claude/workflows/` or `~/.claude/workflows/` (saved scripts accept `args`). Refuses to write through a symlinked target file.
- `workflowSizeGuideline`, `disableWorkflows`/`enableWorkflows`.

## Background Sessions (agent view)

`claude --bg "investigate the flaky test"`, `/background` to detach current session, `claude agents` to monitor, `claude attach|logs|stop|rm <id>`. Dispatched sessions move into their own worktree before editing.

<!--
Source references:
- https://code.claude.com/docs/en/agents.md
- https://code.claude.com/docs/en/headless.md
- https://code.claude.com/docs/en/worktrees.md
- https://code.claude.com/docs/en/scheduled-tasks.md
- https://code.claude.com/docs/en/goal.md
- https://code.claude.com/docs/en/workflows.md
-->
