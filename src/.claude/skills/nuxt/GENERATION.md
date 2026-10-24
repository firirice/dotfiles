# Generation Info

- **Base:** [antfu/skills](https://github.com/antfu/skills) `skills/nuxt` (generated from nuxt/nuxt `7d14c228ba9a78bd1819e39d885f915bad5cbe50`, Nuxt 5, 2026-09-25)
- **Source:** nuxt/nuxt `4.x` branch, `docs/`
- **Git SHA:** `d1f10b478bdca0878ef2157a10a7f70f3878121f` (Nuxt 4.6.2)
- **Generated:** 2026-10-25

## Method

Took the upstream Nuxt 5 skill and rewrote every passage that differs between `git diff d1f10b4 7d14c22 -- docs/`, using the 4.x docs as the source of truth.

## Updating

```bash
cd <nuxt clone>
git fetch origin 4.x
git diff d1f10b478bdca0878ef2157a10a7f70f3878121f..origin/4.x -- docs/
```

Update the affected references, then bump the SHA above and `metadata.version` in `SKILL.md`.

## License

Based on antfu/skills, MIT License, Copyright (c) Anthony Fu.
