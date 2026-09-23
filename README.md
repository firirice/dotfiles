# dotfiles

> [!IMPORTANT]
> This dotfiles repository is macOS only.

## Setup

```sh
git clone https://github.com/firirice/dotfiles.git ~/dotfiles
~/dotfiles/install.sh
```

## Overview

`src/` mirrors the layout of `$HOME`. `install.sh` walks every file under
`src/` and symlinks it to the matching path under `$HOME`, creating parent
directories as needed (e.g. `src/.config/tmux/tmux.conf` -> `~/.config/tmux/tmux.conf`).

Re-run `install.sh` any time after editing `src/` to refresh the symlinks.

## Machine-Local Configuration

Machine-specific values (e.g. secrets, per-machine overrides) can be placed in
`*.local` files under `$HOME`. These are git-ignored and never committed.

- `~/.zshrc.local` — sourced at the end of `.zshrc`

## Claude Code Skills Generator

`skills-generator/` generates [Agent Skills](https://agentskills.io) for Claude Code
from documentation sites (via their `llms.txt` index) into `src/.claude/skills/`.
Adapted from [antfu/skills](https://github.com/antfu/skills). Requires Node.js 24+.

Generation rules live in `skills-generator/CLAUDE.md`; sources are defined in
`skills-generator/meta.json`.

Update a generated skill:

```sh
node skills-generator/scripts/fetch-docs.ts claude-code --diff
```

Then ask Claude Code (started in `skills-generator/`) to "update the claude-code skill
for the changed pages following CLAUDE.md", and finish with:

```sh
node skills-generator/scripts/fetch-docs.ts claude-code --record
./install.sh
```
