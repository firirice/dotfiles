# History
HISTFILE="$HOME/.zsh_history"
HISTSIZE=10000
SAVEHIST=10000
setopt SHARE_HISTORY
setopt HIST_IGNORE_DUPS

# PATH
export PATH="$HOME/.local/bin:$PATH"

# Prompt
autoload -Uz promptinit
promptinit
PS1='%~ %# '

# Aliases
alias ls='ls -G'
alias ll='ls -la'

# Machine-local overrides (gitignored, not committed)
[[ -f "$HOME/.zshrc.local" ]] && source "$HOME/.zshrc.local"
