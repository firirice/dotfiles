# Skills Generator

Generate [Agent Skills](https://agentskills.io/home) from documentation sites and keep them in sync.
Adapted from [antfu/skills](https://github.com/antfu/skills) (MIT), using `llms.txt` indexes instead of git submodules.

Follow the skill best practices: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices

- Focus on agent capabilities and practical usage patterns.
- Ignore user-facing guides, introductions, get-started, and install guides.
- Ignore content LLM agents are already confident about from training data.
- Keep skills concise; avoid creating too many references.

## Layout

```
skills-generator/
├── meta.json                  # source name -> { index (llms.txt URL), output, include (sections) }
├── instructions/{source}.md   # source-specific generation instructions (optional)
├── scripts/fetch-docs.ts      # fetch pages and track changes by sha256
└── sources/{source}/          # fetched pages (git-ignored)
    ├── {slug}.md              # first line: <!-- {section} | {url} -->
    └── manifest.json

src/.claude/skills/{source}/   # output, symlinked into ~/.claude/skills by install.sh
├── SKILL.md                   # index of references + essentials
├── GENERATION.md              # fetched date + manifest (written by --record)
└── references/{category}-{topic}.md
```

`include` entries are `"{##}/{###}"` headings of the `llms.txt` index. `####` sub-headings belong to their `###` parent.

## Adding a Source

1. Add an entry to `meta.json`.
2. Run `node skills-generator/scripts/fetch-docs.ts {source}` and check the page list.
3. Generate the skill (below).

## Generating a Skill

1. Read `instructions/{source}.md` if it exists.
2. Read the fetched pages in `sources/{source}/`.
3. Write `references/{category}-{topic}.md`. Prefix names with a category such as `core`, `extend`, `config`, `reference`, `best-practices`, `advanced`.
4. Write `SKILL.md`:
   - frontmatter `name` equals the directory name; `description` says what it covers and **when to use it** (concrete trigger words).
   - `metadata.version` is the generation date (`YYYY.MM.DD`); `metadata.source` is the index URL.
   - Body: essentials the agent needs most often, then tables linking each reference.
5. Run `node skills-generator/scripts/fetch-docs.ts {source} --record` to write `GENERATION.md`.

Each reference file:

```md
---
name: {topic}
description: {one line}
---

# {Title}

{concise content: exact keys, fields, paths, commands, minimal examples}

<!--
Source references:
- {url}
-->
```

## Updating a Skill

1. Run `node skills-generator/scripts/fetch-docs.ts {source} --diff`.
2. Read each added/changed page listed and update the affected references and `SKILL.md`. Drop content for removed pages.
3. Bump `metadata.version` in `SKILL.md`.
4. Run `node skills-generator/scripts/fetch-docs.ts {source} --record`.
