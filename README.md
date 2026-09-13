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
