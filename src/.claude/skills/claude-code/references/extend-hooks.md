---
name: hooks
description: Claude Code hooks — events, matchers, handler types, stdin JSON, exit codes, JSON decision output, async/prompt/agent hooks, debugging
---

# Hooks

Deterministic automation at lifecycle events. Use for anything that must happen every time (format, block, notify); CLAUDE.md is only a request.

## Where Hooks Live

`~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json`, managed settings, plugin `hooks/hooks.json`, skill frontmatter (rest of session after invoke; `once: true` supported), subagent frontmatter (while running). Hooks **merge** across sources (all run, in parallel; identical handlers dedupe). Edits are hot-reloaded. `/hooks` is a read-only browser.

Workspace trust: interactive sessions hold back **all** settings hooks until the folder is trusted; `-p` treats the folder as trusted (review repo `.claude/` before scripting `claude -p` over untrusted repos, or pass `--settings '{"disableAllHooks": true}'`).

## Shape

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "if": "Bash(rm *)",
            "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/block-rm.sh",
            "args": [],
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

## Events

| Event | Matcher filters | Can block |
|---|---|---|
| `SessionStart` | `startup` `resume` `clear` `compact` `fork` | no (context only) |
| `Setup` | `init` `maintenance` (only `--init-only`, `-p --init/--maintenance`) | no |
| `UserPromptSubmit` | — | yes (erases prompt) |
| `UserPromptExpansion` | command name (typed `/skill` bypasses PreToolUse) | yes |
| `PreToolUse` | tool name | yes |
| `PermissionRequest` | tool name | via `decision` object only |
| `PermissionDenied` | tool name (auto-mode denials) | no (`retry: true`) |
| `PostToolUse` / `PostToolUseFailure` | tool name | no (stderr/reason shown to Claude) |
| `PostToolBatch` | — | yes (stops loop) |
| `Notification` | `permission_prompt` `idle_prompt` `auth_success` `elicitation_*` `agent_needs_input` `agent_completed` `quota_auto_resume_*` | no |
| `SubagentStart` / `SubagentStop` | agent type | Stop: yes |
| `Stop` | — | yes (keeps Claude working) |
| `StopFailure` | `rate_limit` `overloaded` `server_error` `billing_error` … | no |
| `TaskCreated` / `TaskCompleted` / `TeammateIdle` | — | yes |
| `InstructionsLoaded` | `session_start` `nested_traversal` `path_glob_match` `include` `compact` | no |
| `ConfigChange` | `user_settings` `project_settings` `local_settings` `policy_settings` `skills` | yes |
| `CwdChanged` | — | no |
| `DirectoryAdded` | `slash_command` `register_repo_root` | no |
| `FileChanged` | literal filenames `".envrc\|.env"` (also builds the watch list) | no |
| `WorktreeCreate` / `WorktreeRemove` | — | any non-zero fails (replaces git worktree logic) |
| `PreCompact` / `PostCompact` | `manual` `auto` | Pre: yes |
| `PreModelSwitch` / `PostModelSwitch` | canonical model name | Pre: yes |
| `MessageDisplay` | — (display-only rewrite via `displayContent`) | no |
| `Elicitation` / `ElicitationResult` | MCP server name | yes |
| `SessionEnd` | `clear` `resume` `logout` `prompt_input_exit` `other` | no (1.5 s budget) |

## Matchers

- `"*"`, `""`, omitted → all.
- Only `[A-Za-z0-9_\- ,|]` → exact name(s): `Edit|Write`, `Edit, Write`.
- Anything else → **unanchored** JS regex: `^Notebook`, `mcp__memory__.*` (use `^…$` for whole match). `mcp__memory` alone matches nothing — append `__.*`.
- Plugin MCP tools: `mcp__plugin_<plugin>_<server>__<tool>`.
- Case-sensitive. A `matcher` on an event without matcher support is ignored.
- `if` (tool events only): one permission rule, e.g. `"Bash(git *)"`, `"Edit(**/src/**)"`, `"Edit(*.ts)"`. Checks each Bash subcommand incl. `$()`; best-effort — enforce hard rules with permissions.

## Handler Types

| `type` | Key fields | Default timeout |
|---|---|---|
| `command` | `command`, `args` (exec form, no shell), `async`, `asyncRewake`, `shell` (`bash`/`powershell`) | 600 s (30 s on UserPromptSubmit/ModelSwitch, 10 s MessageDisplay) |
| `http` | `url`, `headers` (`$VAR` only if in `allowedEnvVars`) | 600 s |
| `mcp_tool` | `server`, `tool`, `input` (`"${tool_input.file_path}"`) — skipped on launch `SessionStart`/`Setup` | 600 s |
| `prompt` | `prompt` (`$ARGUMENTS` = input JSON), `model`, `continueOnBlock` | 30 s |
| `agent` (experimental) | `prompt`, `model`; up to 50 turns with Read/Grep/Glob | 60 s |

Common: `type`, `if`, `timeout`, `statusMessage`, `once` (skill frontmatter only).
Prompt/agent hooks respond `{"ok": bool, "reason": "...", "impossible": bool}`; supported on PreToolUse, PostToolUse(Failure), PostToolBatch, Stop, SubagentStop, UserPromptSubmit/Expansion, Task*, TeammateIdle, PermissionDenied (and prompt on PermissionRequest).

Paths: `${CLAUDE_PROJECT_DIR}` (session start root; stays put in worktrees — read `cwd` from input for the current dir), `${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_PLUGIN_DATA}`. Prefer exec form (`"args": []`) when using placeholders; in shell form, double-quote them.

## Input (stdin JSON)

Common: `session_id`, `prompt_id`, `transcript_path`, `cwd`, `scratchpad_dir`, `permission_mode` (`default|plan|acceptEdits|auto|dontAsk|bypassPermissions`), `effort.level`, `hook_event_name`; `agent_id`/`agent_type` inside subagents.

- Tool events: `tool_name`, `tool_input`, `tool_use_id`; Post adds `tool_response`, `duration_ms`. MCP tools add `mcp_server {name, source}`.
- File tool paths (`tool_input.file_path`) are always absolute.
- Bash: `command`, `description`, `timeout`, `run_in_background`. Edit: `file_path`, `old_string`, `new_string`, `replace_all`. Write: `file_path`, `content`.
- Stop/SubagentStop: `stop_hook_active`, `last_assistant_message`, `background_tasks`, `session_crons`.
- UserPromptSubmit: `prompt`. SessionStart: `source`, `model?`, `agent_type?`, `session_title?`.
- No `$CLAUDE_MODEL` env var. `$CLAUDE_EFFORT` is set.

## Exit Codes

- **0**: success. stdout parsed as JSON if it starts with `{` and ends with `}`; otherwise plain text. Plain stdout becomes Claude context only on `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart`, `PostModelSwitch`. stderr → debug log only.
- **2**: blocking error (on events that can block); stderr becomes the reason. Overrides any JSON `allow`.
- **Other (incl. 1)**: non-blocking error, action proceeds. **Use `exit 2` for policy hooks.** A missing/non-executable script (127) also silently fails open.
- Timed-out PreToolUse command hook does **not** block.

## JSON Output

Universal: `continue` (false = stop everything), `stopReason`, `systemMessage` (shown to user), `terminalSequence` (OSC 0/1/2/9/99/777 or BEL — hooks have no `/dev/tty`). Strings capped at 10,000 chars.

| Event(s) | Decision fields |
|---|---|
| PreToolUse | `hookSpecificOutput.permissionDecision`: `allow` \| `deny` \| `ask` \| `defer` (`-p` only); `permissionDecisionReason`; `updatedInput` (full replacement); `additionalContext`. Precedence deny > defer > ask > allow |
| PermissionRequest | `hookSpecificOutput.decision`: `{behavior: allow\|deny, updatedInput?, updatedPermissions?, message?, interrupt?}` |
| PostToolUse | top-level `decision: "block"` + `reason`; `hookSpecificOutput.updatedToolOutput` (must match tool shape), `additionalContext`, `classifierContext` |
| UserPromptSubmit/Expansion, PostToolBatch, Stop, SubagentStop, ConfigChange, PreCompact | top-level `decision: "block"`, `reason` |
| Stop | also `hookSpecificOutput.additionalContext` = non-error "keep going" feedback |
| SessionStart | `additionalContext`, `initialUserMessage` (`-p`), `sessionTitle`, `watchPaths`, `reloadSkills` |
| FileChanged | `watchPaths` |
| WorktreeCreate | print the worktree path on stdout |

`hookSpecificOutput` always needs `"hookEventName"`. Misplaced fields are ignored silently (debug log: `Hook JSON output had unrecognized keys`).

A PreToolUse `deny` blocks even in `bypassPermissions`; `allow` never overrides settings deny rules.

`updatedPermissions` entries: `{type: addRules|replaceRules|removeRules, rules: [{toolName, ruleContent?}], behavior, destination}`, `{type: setMode, mode}`, `{type: addDirectories|removeDirectories, directories}`; `destination`: `session` | `localSettings` | `projectSettings` | `userSettings`.

## Recipes

Block with a reason (PreToolUse):

```bash
#!/bin/bash
cmd=$(jq -r '.tool_input.command')
if grep -q 'rm -rf' <<<"$cmd"; then
  jq -n '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:"Destructive command blocked"}}'
fi
```

Format after edits:

```json
{ "hooks": { "PostToolUse": [{ "matcher": "Edit|Write", "hooks": [{ "type": "command", "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write" }] }] } }
```

macOS notification: `Notification` with `"command": "osascript -e 'display notification \"Claude needs you\" with title \"Claude Code\"'"` (grant Script Editor notification permission once).

Re-inject context after compaction: `SessionStart` with matcher `compact` that echoes reminders.

Persist env vars: in `SessionStart`/`Setup`/`CwdChanged`/`FileChanged`, append `export X=…` lines to `"$CLAUDE_ENV_FILE"`.

Stop hook loop guard: exit 0 when `.stop_hook_active == true` (cap: 8 consecutive blocks, `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`). `/goal` is a built-in prompt-based Stop hook.

Async: `"async": true` (command only) → runs in background, `additionalContext`/`systemMessage` delivered next turn; can't block. `asyncRewake: true` wakes Claude on exit 2.

## Disable / Debug

- `"disableAllHooks": true` (can't disable managed hooks from lower levels).
- Test manually: `echo '{"tool_name":"Bash","tool_input":{"command":"ls"}}' | ./hook.sh; echo $?`
- `claude --debug-file /tmp/claude.log` (or `/debug` mid-session); `CLAUDE_CODE_DEBUG_LOG_LEVEL=verbose` for matcher details. `Ctrl+O` shows transcript outcomes.
- JSON ignored? Shell profile echoing on non-interactive shells — guard with `[[ $- == *i* ]]`. Script not running? `chmod +x`, absolute paths, or exec form.

<!--
Source references:
- https://code.claude.com/docs/en/hooks.md
- https://code.claude.com/docs/en/hooks-guide.md
-->
