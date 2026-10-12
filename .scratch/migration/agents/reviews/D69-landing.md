# D69 landing

Position: oculus/migration, step D69 (two clipping defects), step 348 of 352 landed. Next: D68 (workspaces as files), whose builder is building; then D64, Q72, O33.

## Open items

- Open item 58 (2026-10-12, D68's brief check; kind 3, Axel's rules file and a skill): two sentences outside oculus become false when D68 lands, and both are files the orchestrator may not edit on its own. `CLAUDE.md:102` says a personal project that grows its own repository gets "a `roots:` entry for the repository in `.oculus/config/sources.yml`"; after D68 it is a folder entry in the workspace file `.oculus/workspaces/research-hub.yml`. `.agents/skills/research-cockpit/SKILL.md:155` says the triage output goes to the `mail_dir` key of `tools/oculus/config/local.yml`; after D68 that key is in the hub's `.oculus/local.yml`. Options: (a) Axel approves the orchestrator rewriting both sentences at D68's landing to name the new places, recommended, since leaving them makes the next session follow a file that no longer exists; (b) Axel edits them himself; (c) they stay false, the lazy option. Blocks: D68's landing, not its build.
- Open item 59 (2026-10-12, D68's brief check; kind 1, outside the repository): records that name the roots `hub` and `engine` outside the repository. Pages saved in the browser (`oculus.layout` in localStorage) hold tabs addressed `hub:<path>` and `engine:<path>`, and `~/.oculus/changes.jsonl` and `~/.oculus/history` hold undo records with those keys. After D68 those keys are no folder: a saved tab of a hub file shows as unknown and an older undo record cannot be applied. No code may read the old form (no migration code), so the data is changed once or left. Options: (a) at D68's landing the orchestrator rewrites `~/.oculus/changes.jsonl` and `~/.oculus/history` once, `hub` to `research-hub` and `engine` to `oculus` with the path under oculus's folder, by a command that prints nothing of their content, and Axel lets the orchestrator do the same to his browser's saved pages once through his own Chrome page, recommended; (b) the `~/.oculus` records converted and the browser's pages left, so his open hub tabs show as unknown once and he reopens them; (c) both left, the lazy option. Blocks: D68's landing, not its build.

## Check of Steps 1

The builder a399b985009bb1ae1, the brief check ad3b6d05a2013035b and both reviewers (ae91041e053613856, a54ee23d243f650cf) had completed before the cherry-pick; the runner's agent listing showed only D68's builder (a3e55090e05050b84) running.

## NOT DONE

Nothing of the step. Not seen at the look, and held by the reviews' reading and the unit suite: the widgets of the diff, merge and peek editors, a wheel scroll of a diff list (a scroll event on the box's parent was dispatched instead), a high-contrast theme, and the linter item crowded to its cap.

## What landed

D69's whole range from base ff113f762 and the fixes at landing: 22 paths, +722 -164 against main, the ledger left out.

- What Monaco pops up over an editor's text is drawn on the document body, above every float: one node per editor box for the hover, suggest list, parameter hints, rename box, colour picker, message and paste-as widget, and one window-sized node for the page for every context view (the right-click menu, the code action list). The quick input and what Monaco places in the text stay in the editor.
- A key typed in such a widget reaches the editor that owns it, a peek's editor included; Tab moves inside a widget and returns to the editor when it would leave it; the shell takes the editor's pane as focused while a widget has the focus.
- When an ancestor of an editor scrolls, its menu, hover, suggest list and parameter hints close, and a widget that stays open (the rename box) is placed against the text again.
- The widget nodes carry the editors' theme type class (`vs`, `vs-dark`, `hc-black`, `hc-light`).
- The status bar's right group is walked by Tab from right to left as VS Code's, each item capped and clipped, an item wrapped out of the row inert, the linter item's buttons sharing its cap.

## What was found

- The run over round 1 found seven defects, all fixed at landing (`agents/reviews/D69-refuter.md`, Closed): widgets left floating on a scroll, the theme type class never applied, a check that never returned, the report's stale judgment call, Tab inside a focused hover, and false or over-long comment sentences.
- Nothing outside the step.

## The look

On a scratch oculus on port 8796 over a copy of main with the step, Axel's server and TEST untouched, under the light and the dark theme: the right-click menu and the hover drawn over the next pane; the code action list in the page node with all its rows; the nodes carrying `vs`, then `vs-dark`; a scroll closed the hover and kept the rename box and a message at their line with the focus kept; typing in the rename box reached it once and Escape closed it; Tab in a Ruff hover went to "Quick Fix..." and then to the editor; the status bar's right group in reverse markup order, the wrapped blame item inert. Main's `config/` unchanged (`git diff --exit-code -- tools/oculus/config`).

## Verification

In the gate worktree at main's head with the step and the fixes, `npm run diagrams && npm run test:landing`:

```
ok      ASCII gate (1.3 s)
ok      npm run lint (36.9 s): > eslint . --cache --cache-location node_modules/.cache/eslint/
ok      npm run format:check (43.2 s): All matched files use Prettier code style!
ok      npm test (150.2 s): Duration  143.36s (transform 47.79s, setup 0ms, import 399.40s, tests 132.46s, environment 203ms)
ok      npm run check, then npm run build, then npm run test:slow (322.2 s): Duration  205.91s (transform 34.40s, setup 0ms, import 268.25s, tests 440.69s, environment 204ms)
ok      npm run test:checks (426.1 s): Duration  420.28s (transform 47.50s, setup 0ms, import 102.95s, tests 564.70s, environment 5ms)
test:landing: 426.2 s; every command passed
```

Main's staged change compared with the gate's, the ledger left out: both `shasum` 33d1b85729d790b0ada2504edd741c4d29e7b1cb. A/B: none, the configuration names no bench.

## Agents

- Builder a399b985009bb1ae1 (claude-sonnet-5-5): 169,827 tokens, 136 tool uses, 45.0 min; round 1 331,491 tokens, 64 tool uses, 23.6 min. The first report did not pass its bar (one repair round).
- Brief check ad3b6d05a2013035b (claude-opus-5-5): 210,006 tokens, 74 tool uses, 9.7 min.
- Reviewer ae91041e053613856 (claude-opus-5-5): 331,344 tokens, 125 tool uses, 25.3 min.
- Reviewer over round 1 a54ee23d243f650cf (claude-opus-5-5): 295,300 tokens, 93 tool uses, 22.7 min.
- Fixes at landing: 7.

## Next

D68's report, its review, its repair round and its landing, which needs Axel's answers on open items 58 and 59 and joins DESIGN.md's widget paragraph with D68's wallpaper sentence by hand; then D64, Q72, O33.
