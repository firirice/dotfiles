#!/usr/bin/env bash
set -euo pipefail

DOTFILES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$DOTFILES_DIR/src"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This dotfiles repository is macOS only." >&2
  exit 1
fi

link() {
  mkdir -p "$(dirname "$2")"
  ln -sf "$1" "$2"
  echo "linked: $2 -> $1"
}

# src/ 以下の全ファイルを $HOME 配下へシンボリックリンク
while IFS= read -r -d '' file; do
  rel="${file#"$SRC"/}"
  link "$file" "$HOME/$rel"
done < <(find "$SRC" -type f -print0)
