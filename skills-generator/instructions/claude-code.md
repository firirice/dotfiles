# claude-code

Purpose: help an agent configure and extend Claude Code correctly (CLAUDE.md, settings.json, permissions, hooks, skills, subagents, MCP, plugins, automation).

- Prioritize exact specs that drift from training data: file locations and precedence, settings keys, frontmatter fields, hook events and their input/output JSON, CLI flags, slash commands, permission rule syntax.
- Prefer tables and minimal JSON/YAML examples over prose.
- Skip UI walkthroughs, Windows-specific steps, marketing copy, and enterprise/admin-only content.
- For exhaustive lists that are too long to embed (environment variables, error messages, every setting), keep only the commonly needed entries and link the page URL so the agent can fetch the rest on demand.
- Mention "check the version with `claude --version`" when behavior depends on a recent release.
