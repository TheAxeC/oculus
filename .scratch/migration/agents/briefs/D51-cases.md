# D51, the cases ruling (round 0)

The builder's first run handed back case 13 (Solarized Light's `--muted`) and noted that the plus and Visual Studio themes get `--bg` equal to `--panel`. The orchestrator checked both against the brief: under item 2 and item 3, Solarized Light's three candidates and their registered defaults are all at or above `--ink`'s contrast on `--panel`, so `--muted` falls to `:root`'s `#64748b` (4.41 against `--ink`'s 4.13); and Dark+, Light+, Visual Studio Dark and Visual Studio Light hold `editor.background` but not `sideBar.background`, so `--bg` takes the last key of its list while VS Code draws the side bar at the registered `sideBar.background` default.

1. Case 13: option A. When every `--muted` candidate is skipped, `--muted` is the theme's `--ink` at 0.7, composited over `--panel`, which is VS Code's registered rule for `descriptionForeground` (`foreground` at 0.7); the block's comment names that source. It is below `--ink` for every theme. Option C (oculus's slate kept and reported) is the lazy option and is refused: it breaks case 13 and puts a colour of no theme in the block. Option B breaks case 13.

2. `--bg` is the side bar VS Code draws: the theme's `sideBar.background`, else its registered default for the theme's type; the rest of `--bg`'s list is read only when that default is `null`. Every other token keeps the order item 2 gives (the theme's own keys of the list first, then the registered defaults), which case 1 depends on. Case 1's quoted `--bg` values are unchanged by this (Dark Modern, Abyss, Monokai and Quiet Light hold `sideBar.background`; Red's is held; High Contrast's default is `#000000`). The report lists the new `--bg` of the four themes as a visible change.

3. The text-on-tint pairs: item 4's "for every theme" holds as the first run measured it, 226 pairs under 4.5:1 across all 17 existing themes, not the three the brief's premise named. `derive.ts`'s nudge applies to every theme, and the report lists, theme by theme, each `-txt` value that changes, before and after, the 14 ported themes included.

4. The registration forms beyond those the brief lists (`qe.white`, `qe.black`, `qe.fromHex(...).transparent(a)`, the colour objects of the diff tints) are resolved into the converter's table as hexes and alphas, as the builder proposes; the table's comment names the form each came from.

5. The contrast test's lane-text case that timed out under load: run again after the last change and quoted; its timeout is not touched. A timeout that remains is named in the report with the load average.
