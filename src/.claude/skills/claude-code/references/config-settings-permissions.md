---
name: settings-permissions
description: settings.json files, precedence and merging, notable keys, permission rule syntax, permission modes, protected paths, workspace trust
---

# Settings and Permissions

## Files and Precedence (highest first)

1. **Managed** (`managed-settings.json`, MDM, server-managed) — can't be overridden (except a few "stricter wins" security keys)
2. **CLI**: `--settings '<json|file>'`, `--model`, `--permission-mode`, …
3. **Local** `.claude/settings.local.json` — personal, auto-added to global git excludes when Claude Code writes it; "don't ask again" approvals land here (at repo root)
4. **Project** `.claude/settings.json` — shared/committed; read from the primary working directory (no parent fallback)
5. **User** `~/.claude/settings.json`

- Scalars: highest wins. **Arrays merge** (e.g. `permissions.allow`). Exceptions: `fallbackModel`, `modelPicker`, managed `availableModels`.
- Env vars aren't a level; precedence is per pair (`ANTHROPIC_MODEL` beats `model`).
- Strict JSON (no comments/trailing commas). Add `"$schema": "https://json.schemastore.org/claude-code-settings.json"`.
- Hot-reloaded, except `model` / `effortLevel` (use `/model`, `/effort`).
- `~/.claude.json` is Claude Code's own state (OAuth, per-project trust, user/local MCP servers, global config like `autoConnectIde`, `diffTool`).
- Verify: `/status` (Setting sources), `claude doctor` (rejected entries), `/config` (UI; `/config key=value`).
- If `~/.claude/settings.json` is not writable, `/model` etc. changes don't persist. Symlinked dotfiles are fine as long as the target is writable.

### Keys ignored in a repo file

Scope "User, local, or managed" / "User or managed" / "Managed" / "Global config" keys never apply from `.claude/settings.json`. `defaultMode: auto|bypassPermissions` only from user/managed/`--settings`. Project `env` can't set `CLAUDE_CONFIG_DIR`, `HOME`, `TMPDIR`, `XDG_*`, etc.

### Waits for workspace trust

Project `permissions.allow`, `additionalDirectories`, `extraKnownMarketplaces`, most `env`, hooks (interactive). `deny`/`ask` apply immediately. `-p`/SDK treat the folder as trusted.

## Notable Keys

| Key | Example / notes |
|---|---|
| `model` | `"claude-opus-5-5"` or alias |
| `effortLevel` | `"high"` |
| `language` | `"japanese"` — respond in this language |
| `outputStyle` | name of a built-in or `output-styles/*.md` |
| `env` | `{ "DISABLE_AUTO_COMPACT": "1" }` — overrides shell exports |
| `permissions` | `allow` / `ask` / `deny` / `defaultMode` / `additionalDirectories` / `disableBypassPermissionsMode` / `blockReadsOutsideWorkingDirectories` |
| `hooks` | see extend-hooks |
| `statusLine` | `{ "type": "command", "command": "~/.claude/statusline.sh", "padding": 0, "refreshInterval": 5 }` (stdin JSON: `model.display_name`, `context_window.used_percentage`, `effort`, …) |
| `attribution` | `{ "commit": "", "pr": "", "sessionUrl": false }` hides attribution; CLAUDE.md rules take precedence over these lines |
| `includeGitInstructions` | `false` removes built-in commit/PR instructions |
| `enabledPlugins` / `extraKnownMarketplaces` | plugin enablement per scope |
| `skillOverrides`, `disableBundledSkills`, `disableSkillShellExecution` | skill control |
| `autoMemoryEnabled`, `autoMemoryDirectory`, `claudeMdExcludes` | memory |
| `cleanupPeriodDays` | transcript retention (default 30) |
| `agent` | run every session as a named subagent |
| `sandbox.enabled` + `sandbox.filesystem.*` / `sandbox.network.allowedDomains` | OS-level Bash isolation |
| `worktree.baseRef` / `sparsePaths` / `symlinkDirectories` | worktree creation |
| `theme`, `editorMode` (`"vim"`), `tui`, `spinnerTipsEnabled`, `verbose`, `viewMode` | interface |
| `enableAllProjectMcpServers`, `enabledMcpjsonServers`, `disabledMcpjsonServers` | `.mcp.json` approval |
| `plansDirectory` | where plan-mode files go |

Full index with ~230 keys: https://code.claude.com/docs/en/settings-reference.md (fetch when a key isn't listed here).

## Permission Rules

Evaluation order: **deny → ask → allow**; first match wins, specificity doesn't matter. A deny anywhere (any scope) can't be allowed elsewhere. Bare tool deny (`"Bash"`) removes the tool from context. Rules are enforced by Claude Code, not the model. Manage with `/permissions`.

```json
{
  "permissions": {
    "allow": ["Bash(npm run *)", "Bash(git commit *)", "WebFetch(domain:docs.example.com)", "mcp__github__get_*"],
    "ask":   ["Bash(git push *)"],
    "deny":  ["Read(./.env)", "Read(./.env.*)", "Read(./secrets/**)", "Bash(rm -rf *)"],
    "defaultMode": "acceptEdits",
    "additionalDirectories": ["../shared"]
  }
}
```

### Bash

- `*` matches any text incl. spaces. `Bash(ls *)` matches `ls` and `ls -la` but not `lsof`; `Bash(ls*)` matches `lsof`. `Bash(x:*)` ≡ `Bash(x *)`.
- Put `*` **after the subcommand**: `Bash(git log *)`, not `Bash(git * main)` (warned).
- Compound commands (`&&`, `||`, `;`, `|`, `&`, newline) — each subcommand must match an allow; deny/ask match any subcommand incl. `$()` and subshells.
- Stripped wrappers: `timeout`, `time`, `nice`, `nohup`, `stdbuf`, `command`, `builtin`, `noglob`, bare `xargs`, safe `VAR=` prefixes. Not stripped: `npx`, `docker exec`, `direnv exec`, `mise exec` — write full rules like `Bash(devbox run npm test)`.
- Deny rules match the literal command form only (`/bin/rm`, `sh -c '…'` escape them) → use sandbox or PreToolUse hooks for real boundaries.
- Built-in read-only commands (`ls`, `cat`, `grep`, `find`, `git` read forms, `cd` inside working dirs…) never prompt. Redirect targets are checked against Edit/Read rules.
- `Tool(param:value)` works in deny/ask only: `Agent(model:opus)`, `Bash(run_in_background:true)`.

### Read / Edit (gitignore syntax)

| Pattern | Anchors at |
|---|---|
| `//abs/path` | filesystem root |
| `~/path` | home |
| `/path` | the settings file's root (project → primary working dir; **user settings → `~/.claude/`**) |
| `path`, `./path` | current dir |

- In user settings, use `~/` or `//` to target project files everywhere.
- Allow `Edit(src/**)` matches only `./src`; deny/ask `Read(secrets/**)` matches at any depth. `**/src/**` = any depth.
- `Read` deny also blocks Edit/Write on that path. Rules for `Write(...)`, `Glob(...)` paths are never consulted — use `Edit(...)` / `Read(...)`.
- `!pattern` in deny/ask carves exceptions from earlier rules in the same file.
- Symlinks: allow needs both link and target to match; deny blocks if either matches.

### Other tools

- `WebFetch(domain:example.com)`, `WebFetch(domain:*.example.com)`; bare `WebFetch` in allow = fetch freely.
- MCP: `mcp__server`, `mcp__server__*`, `mcp__server__tool`; `mcp__*` in deny blocks all MCP.
- `Agent(Explore)`, `Skill(name)`, `Skill(name *)`, `Cd(~/code/**)`.
- Tool-name globs (`"*"`, `"mcp__*"`) allowed in deny/ask; allow globs only after `mcp__<server>__`.

## Permission Modes

| Mode | Runs without asking |
|---|---|
| `default` (Manual, alias `manual`) | reads |
| `acceptEdits` | + edits and `mkdir`/`touch`/`mv`/`cp` in working dirs |
| `plan` | reads; edits blocked until plan approved |
| `auto` | everything, reviewed by a classifier (default on Pro/Max/Team) |
| `dontAsk` | only pre-approved; everything else denied (CI) |
| `bypassPermissions` | everything (containers/VMs only) |

- Switch: `Shift+Tab` cycle, `--permission-mode <m>`, `permissions.defaultMode`. `bypassPermissions` appears in the cycle only when launched with `--dangerously-skip-permissions` / `--allow-dangerously-skip-permissions` or set in user/managed settings.
- Deny rules apply in every mode; allow rules are moot in bypass.
- **Protected paths** (never auto-approved except bypass): `.git`, `.claude` (not `.claude/worktrees`), `.vscode`, `.idea`, `.husky`, `.devcontainer`, shell rc files (`.zshrc`, `.bashrc`, `.profile`, `.envrc`…), `.gitconfig`, `.npmrc`, `.mcp.json`, `.claude.json`, … `permissions.allow` can't pre-approve them.
- **Critical paths**: `rm`/`rmdir` of `/`, top-level dirs, `$HOME`, cwd and parents, `"$VAR"/*` — never auto-approved by allow rules or hooks. Guard with `"${DIR:?}"`.
- `disableBypassPermissionsMode: "disable"`, `disableAutoMode: "disable"` lock modes out.

## Running `claude -p` in an Untrusted Repo

`--setting-sources user`, `--bare`, or `--settings '{"disableAllHooks": true}'`; `disabledMcpjsonServers` to reject servers.

<!--
Source references:
- https://code.claude.com/docs/en/settings.md
- https://code.claude.com/docs/en/settings-reference.md
- https://code.claude.com/docs/en/permissions.md
- https://code.claude.com/docs/en/permission-modes.md
-->
