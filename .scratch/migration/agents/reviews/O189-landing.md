# O189 landing report

Position: the oculus migration plan, step O189 (the terminal's locale and its colours), landed. Next: `~/Applications/oculus.app` rebuilt from this commit and replaced.

Open items: none. Open item 775 was withdrawn and its text fixed here.

Agents stopped before the landing: the runner's agent listing showed no agent of the step.

NOT DONE: a whole `test:quick` run on the final code; a reviewer's read of the fixes at landing.

## What landed

The booking under O189 in `plan.md` lists it, with its five fixes at landing.

| What | Before | After |
|---|---|---|
| Text after a line or block glyph, black or bright black, dark themes | 1.00 to 2.87:1 | 4.5:1 or more |
| Inverse glyph with a colour of its own, and its text | panel's colour | panel's colour where the ink fails, else the ink |
| Fold of the line of emails | circled plus before the line | chevron after the words |
| Threads under it | under To reply, To action / do, Unsorted | one list, newest first |

## Verification

In the gate at 9b1a3f16f with every fix, at background priority, one command at a time: prettier and the ASCII gate passed; eslint exit 0; `npm run check` 4687 files, 0 errors; `npm run diagrams` and `npm run docs:palette` changed no file; vitest over 23 files, 264 of 279 passed and 15 timed out at 5000 ms, their 9 files rerun with a 120000 ms time-out, 62 of 62 passed; the build passed. Main's staged diff equals the gate's under `cmp`.

## The look

On scratch servers on 8797 from the gate's production builds, scratch HOME and shell, in Chrome.

- Locale: Tab completion draws `python ../` right; a new terminal has `LANG=en_US.UTF-8`.
- Contrast, samples of every glyph form (line, block, powerline, wide, emoji, underline, inverse, the sixteen colours inverse, 256-colour and truecolor greys, a box table), measured in all 49 themes: no non-dim text under the floor but inverse default text in VS Code Solarized Light, 4.13:1, the theme's own ink on its panel. Seen: Oculus Light, Nord, Dark Modern. Block fills keep their colour.
- Theme changes redraw an open terminal; the block cursor over inverse text, a selection, find marks and a stand-in wallpaper read.
- Change Color yellow and an app's `terminal.ansiYellow` decoration: the interface's gold.
- Command center: the chevron after "5 emails to reply / act on", down when open; five threads newest first, the one with an unreadable time last with no age; in Phosphor the ASCII `v`; in Dark Modern the icon; a press on a thread opens the Inbox at its card.

## Found

Findings outside the brief: none.

## Agents

- Builder aeba585072c7eec9c, claude-opus-5-5: 244583, 226565 and 318363 tokens, 35, 191 and 60 tool uses, 355, 1992 and 424 s. Its first report did not pass its bar.
- Brief check a4d05a14db5bd64bf, claude-opus-5-5: 284488 tokens, 60 tool uses, 528 s.
- Reviewer a273156eeab76f27e, claude-opus-5-5: 271716 tokens, 42 tool uses, 526 s.
- Reviewer over round 1 a3c0ec569a51bd6b5, claude-opus-5-5: 210206 tokens, 26 tool uses, 411 s.

## Next

The app rebuilt and replaced, the running one closed first on Axel's word, with no release.
