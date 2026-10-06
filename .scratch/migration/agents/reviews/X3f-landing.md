# X3f landing

Position: roadmap entry oculus/migration (the cockpit-to-oculus migration); X3f, a file tab's actions in its breadcrumb bar, file icons on file tabs, blame on HEAD and index tabs and a double click opening a kept tab, landed (its third landing). Next: D20's landing with its diagnosis fix, then /spec of D23 and a brief writer for M6.

## Open items (verbatim)

- Z545 (A3's scheduled runs, an idle terminal per due time), Z543 (G44 for D20's Cancel), Z538 (G43 for D44's tests), Z539 (D44's look with one real job): as booked in `orchestrator-state.md`'s open items.

## Not done

Case 7's staged-line attribution was checked through the route's answer and `git diff --cached -U0`, not by reading the gutter's colours. `bench: []`, so no A/B.

## The check of Steps 1

`ListAgents` listed one subagent running, a9235d4e14cc878c9 (D38's builder). None of X3f's agents was listed.

## What landed

From base b249c7e49, 120 files (+3126 -995, `git diff --cached --stat`): a double click on a file in the Files tree opens one kept tab with the keyboard in it; each file tab's actions (Save, Revert File, the star, Open in Program, Open Preview, Open Preview to the Side, Open Source, Toggle Blame), each where it applies, at the right end of the pane's breadcrumb bar, the tab row carrying only Split and `...`; a file tab draws its file's icon; blame on HEAD and index tabs (`stage=head` and `stage=index` of `GET /api/git?blame=`); the status bar's caret-line blame as VS Code's; the Files view's Outline and `docs/DATA-MAP.md`'s contents list (Z490).

Fixes at landing, from the run over round 3:
- Proof 1: `DESIGN.md:128` lists `blame --porcelain HEAD -- <path>` and `blame --porcelain --contents - -- <path>` (`blameAt`).
- Standards 1: the sentences made false in `Breadcrumb.svelte`, `PaneStrip.svelte`, `Source.svelte` and `DESIGN.md` rewritten.
- Standards 2: the comment broken in `MarkdownPreview.svelte` rewrapped.
- Standards 3 and 4: the `strip` place removed; `handUp(handed, id, actions, applies)` hands into one store.
- Standards 5: one 400 answer for a wrong side (`notASide` in `git-reads.ts`); BarActions takes `SAVE_KEY` from `ui/controls/editor/chords`.
- Behaviour 1: a view hands its snippet up only while one of its actions applies, so a tab with no path and nothing applying draws no bar.
- Behaviour 2: `shownFileOfTab` draws a file icon only on source, file, document and Doc tabs; a Files tab on a folder and a LaTeX tab keep their view glyphs.

Fixes at landing, from the look on TEST:
- A source tab whose read was refused (404) drew the star and Toggle Blame and asked for blame on every read: `read` in `Source.svelte` gates the bar's actions and the gutter's file.
- The status bar blame ran over the left group and carried the commit subject: it says `${authorName} (${authorDateAgo})`, VS Code's `git.blame.statusBarItem.template` default, and each status group clips.
- A set star drawn bare showed unfilled: `BookmarkStar.svelte` fills it.
- A Markdown preview tab drew the file's icon: it keeps the preview view's glyph, as VS Code's preview tab carries the preview icon.
- In a narrow pane the tab strip shrank, and a HEAD tab's bar covered Split and `...`: the strip keeps its height (`flex: none` in `Tabs.svelte`).
- Two comment lines past column 100 (`pages.ts`, `File.svelte`), rewrapped.

Kept: `blameAt` in `server/core/git/compare.ts` (Spec 1), since a stage on `blameOf` would make `reads.ts` and `compare.ts` import each other. Spec 2 is closed by Z546 (automode). Spec 3: G37 is written into `agents/guarded.md`.

## Verification

In `.agents/worktrees/gate` after `npm run diagrams && npm run test:landing`:

```
ok      ASCII gate (4.3 s)
ok      npm run format:check (18.8 s): All matched files use Prettier code style!
ok      npm run lint (96.4 s)
ok      npm test (163.0 s): Duration  134.15s
FAILED  npm run test:checks (174.4 s)
ok      npm run check, then npm run build (194.9 s)
ok      npm run test:slow (194.9 s): Duration  167.75s
```

`test:checks` failed on `src/lib/views/sources/file/File.svelte:47`, a comment line past column 100. After the rewrap, `npm run test:checks` alone: `Test Files 15 passed | 1 skipped (16)`, `Tests 226 passed | 3 skipped (229)`; `npx prettier --check` and `npx eslint` on the file pass. The diagrams the gate regenerated (`channels`, `layer-state`) were copied to main. The 120 staged files on main are `cmp`-equal to the gate's.

## The look

On TEST (`localhost:8790`, page 9b8276a4), each case of the brief and its cases ruling:

- 1: an unsaved `docs/HPC-UTwente-howto.md`: the bar shows Save, Revert, the star, Open Preview, Open Preview to the Side and Toggle Blame; the tab row shows Split and `...`. An `x` typed and undone; `git status` clean.
- 2: met. 3 and 4: a png, a jpg and a pdf draw their own icons, the path and the star, with no Toggle Blame, as the cases ruling's item 2 reads them.
- 5: the Doc tab of `docs/DATA-MAP.md` draws the Markdown icon, its path and the star; the preview tab of `HPC-UTwente-howto.md` draws the preview's book glyph, its path, the star and Open Source.
- 6: the HEAD tab of `docs/DATA-MAP.md` shows Toggle Blame alone; its blame is read with `stage=head`.
- 7: the index tab of `tools/oculus/HELP.md`: Toggle Blame alone, blame read with `stage=index`; the lines it marks uncommitted (48 to 50, 86, 103, 121, 160, 162, 168, 248) equal the hunks of `git diff --cached -U0 -- tools/oculus/HELP.md`.
- 8: `stage=bogus` answers 400 "that is not a side of a file"; a path climbing out answers 400.
- 9: `claude/CLAUDE.md`, outside any repository: no blame, no branch.
- 10: the status bar says "TheAxeC (3 months ago)".
- 11: a narrow pane cuts the path from the left and keeps the actions whole.
- 12: the star added and removed, filled while set.
- Z533: a Files tab draws the files glyph and a LaTeX tab the newspaper glyph.

Types seen: md, png, jpg, pdf, txt, tex, yml, html, py, json, a LaTeX tab, a Files tab. The bookmark list ended as it began (5 entries, `/api/fs?bookmarks=1`).

## Agents

Builder abb2cc439fd4f1181 (claude-sonnet-5-5): first run 213,532 tokens, 38 tool uses, 6.8 min; build 344,227 tokens, 87 tool uses, 18.5 min; round 1 193,522 tokens, 70 tool uses, 12.1 min; round 2 200,564 tokens, 261 tool uses, 45.2 min, 1 full-list run; round 3 352,573 tokens, 271 tool uses, 48.3 min, 3 full-list runs, its first run 310,369 tokens, 29 tool uses, 4.0 min. Brief check a32169013a80278c0: 220,933 tokens, 70 tool uses, 10.3 min. Reviewer a987da9e569065d2b: 246,295 tokens, 57 tool uses, 11.0 min; over round 1 a2e13fa0838de52ab: 190,712 tokens, 56 tool uses, 7.9 min; over round 2 a4505c32f469215eb: 136,251 tokens, 114 tool uses, 17.1 min; over round 3 a74583b625c668d96: 323,724 tokens, 102 tool uses, 18.5 min. Diagnosis aea533fdd969879a2: 182,164 tokens, 165 tool uses, 88.1 min (`agents/reviews/X3f-diagnosis.md`, three causes found and proved, the "no tab opened" form of symptom 1 not found). Round-2 brief a91dafc2010e37e55: 209,890 tokens, 208 tool uses, 29.5 min. Every agent but the builder ran on claude-opus-5-5. The first report did not pass its bar; thirteen fixes at landing.
