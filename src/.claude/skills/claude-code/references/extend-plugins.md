---
name: plugins
description: Creating, testing, installing, and distributing Claude Code plugins and marketplaces
---

# Plugins

A plugin bundles skills, agents, hooks, MCP/LSP servers, monitors, output styles into one installable unit. Components are namespaced: `/plugin-name:skill`. Use standalone `.claude/` config for personal/project work; convert to a plugin to share across repos or people.

## Layout

```
my-plugin/
├── .claude-plugin/plugin.json   # optional manifest; ONLY this file goes in .claude-plugin/
├── skills/<name>/SKILL.md
├── commands/*.md                # legacy flat skills
├── agents/*.md                  # ignores hooks/mcpServers/permissionMode frontmatter
├── workflows/*.js
├── hooks/hooks.json             # same shape as settings "hooks" (+ optional "description")
├── .mcp.json
├── .lsp.json                    # {"go": {"command": "gopls", "args": ["serve"], "extensionToLanguage": {".go": "go"}}}
├── monitors/monitors.json       # [{"name", "command", "description"}] — stdout lines notify Claude
├── output-styles/
├── bin/                         # added to Bash PATH while enabled
└── settings.json                # only "agent" and "subagentStatusLine" supported
```

A single-skill plugin may put `SKILL.md` at the root (command name from frontmatter `name`).

## Manifest (`.claude-plugin/plugin.json`)

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "…",
  "author": { "name": "…" },
  "homepage": "…", "repository": "…", "license": "MIT", "keywords": [],
  "skills": "./custom/skills/",
  "hooks": "./config/hooks.json",
  "mcpServers": "./mcp.json",
  "userConfig": { },
  "dependencies": ["helper-lib", { "name": "vault", "version": "~2.1.0" }]
}
```

Only `name` (kebab-case) is required. If `version` is set, users get updates only when you bump it. `skills` adds to the default scan; `commands`, `agents`, `outputStyles`, `workflows` **replace** defaults.

## Path Variables

| Variable | Value |
|---|---|
| `${CLAUDE_PLUGIN_ROOT}` | install dir (changes on update — don't store state) |
| `${CLAUDE_PLUGIN_DATA}` | `~/.claude/plugins/data/<id>/`, survives updates (node_modules, venvs, caches) |
| `${CLAUDE_PROJECT_DIR}` | project root |

Substituted inline in skill/agent content, hook/monitor commands, MCP `command`/`args`/`env`/`url`/`headers`; exported to hook/MCP/LSP processes, **not** to Claude's Bash tool. `userConfig` values: `${user_config.KEY}` (exec-form hooks only) or `$CLAUDE_PLUGIN_OPTION_<KEY>`.

## Develop and Test

```bash
claude plugin init my-tool                 # scaffolds ~/.claude/skills/my-tool/ → loads as my-tool@skills-dir
claude --plugin-dir ./my-plugin            # load for one session (also .zip, or a folder of plugins)
claude --plugin-url https://…/plugin.zip
claude plugin validate ./my-plugin [--strict]
claude plugin eval                         # eval suite: with vs without plugin
```

- `/reload-plugins` picks up changes (hooks, agents, MCP, LSP) without restarting; SKILL.md text is live.
- Skills-dir plugins: any `~/.claude/skills/<x>/.claude-plugin/plugin.json` loads as `<x>@skills-dir` (project `.claude/skills/` requires trust; loads only from the primary working dir). Disable: `claude plugin disable x@skills-dir`.
- Check `/plugin` → Errors tab; `claude --debug`.

## Install and Manage

```text
/plugin                                         # Discover / Installed / Marketplaces / Errors
/plugin marketplace add owner/repo              # also git URL, local path, URL to marketplace.json
/plugin install name@marketplace                # choose scope: user (default) | project | local
/plugin install name --marketplace owner/repo   # add + install
/plugin marketplace update|remove|list
```

Shell: `claude plugin install|uninstall|enable|disable|update|list|details|prune [--scope user|project|local]`.

- Installed state lives in settings `enabledPlugins` (`{"name@marketplace": true}`) per scope; marketplaces in `extraKnownMarketplaces`:

```json
{
  "extraKnownMarketplaces": { "team": { "source": { "source": "github", "repo": "org/claude-plugins" } } },
  "enabledPlugins": { "formatter@team": true }
}
```

- Official marketplace `claude-plugins-official` is auto-added (e.g. `/plugin install github@claude-plugins-official`, `skill-creator@claude-plugins-official`, LSP "code intelligence" plugins). Community: `anthropics/claude-plugins-community`.
- Auto-update: on for official marketplaces, off for third-party by default; toggle per marketplace in `/plugin`. `DISABLE_AUTOUPDATER=1` (+ `FORCE_AUTOUPDATE_PLUGINS=1` to keep plugin updates).
- Plugins run arbitrary code with your privileges — install only from trusted sources.

## Marketplace

A repo with `.claude-plugin/marketplace.json` listing plugins and their sources. Details: https://code.claude.com/docs/en/plugin-marketplaces.md

## Migrate `.claude/` → Plugin

Copy `skills/`, `agents/`, `commands/` to the plugin root, move settings `hooks` into `hooks/hooks.json`, then delete the originals (user/project agents override same-named plugin agents; skills would duplicate under two names).

<!--
Source references:
- https://code.claude.com/docs/en/plugins.md
- https://code.claude.com/docs/en/plugins-reference.md
- https://code.claude.com/docs/en/discover-plugins.md
-->
