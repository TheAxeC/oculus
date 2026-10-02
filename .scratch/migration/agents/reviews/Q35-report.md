# Q35 report: the session views' last gaps, the Audit view as a list and the Present deck filling its pane

Everything in the brief is done. Not verified: the duplicate-signature case in a client runtime (case 5, below), and everything the look on TEST is for (frame fit, centring, letterbox, scroll, first paint, hover reveal, the arrow keys on Audit rows, the Customizations row opening). The first run of the cases on the unchanged tree is the previous builder's measurement, carried here; I could not rerun it without a git command.

## Open items of the state file, verbatim

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- Z187, the Files view's folder picker against "nothing outside a root served" (raised 2026-10-01 22:15 by X3a's brief check, finding 6.1, `agents/reviews/X3a-brief-check.md`). Z76 (a) rules both a folder picker for Add Folder to Workspace and, among the kept items, that nothing outside a root is served. A picker has to list folders outside every root, since the folder being added is not a root yet. Today nothing lists a folder outside a root; the token that would guard the new listing already lets its holder start a shell (`routes/api/(sessions)/terminal/+server.ts:13`, `handleTerminal(request, server.token, ...)`), so the listing reveals nothing a token holder cannot already read.
  - (a) The picker lists the names of folders under the home folder only, token-gated, folder names and no file and no content. For: VS Code's folder dialog starts at home; the folders a reader adds live there; nothing a token holder lacks. Against: the kept item becomes "no file content outside a root" instead of "nothing".
  - (b) The same, for any absolute folder, `/` included. For: a folder on another volume can be picked. Against: lists system folders no one adds as a root.
  - (c) No listing outside the roots: the picker browses only inside the served roots, and a folder outside them is added by typing its absolute path, checked to exist. For: the kept item stays word for word. Against: adding a new folder means typing its path, which the picker exists to spare; VS Code never asks for a typed path.
  - (d) No picker: the typed path of today stays. The lazy option: it drops the picker Z76 (a) rules.
  - Recommendation (a): the picker Z76 asks for, limited to the folders a root is ever added from, with nothing served that the token's shell cannot already reach. X3a waits on this ruling; its other brief-check findings are closed in automode (Z188).
- Z190, the shape of S4's new confirmed write for lists, key/value families and records (raised 2026-10-01 23:00 at /spec S4; Z168 left the shape to Axel). Today a Settings row writes one scalar: `{ kind: 'config-key', file, key, value }` (`state/client/writes.svelte.ts:371`), edited in place over the bytes and refused unless the edited file parses back with only that key changed, gives no new finding, and passes every reader (`server/edit/writes/config-key.ts:1-20`). Lists are already rewritten in place for the rail, the deck and the audit mute list through `setItems` (`server/edit/list-edit.ts:112`), the whole list's lines replaced and every other line kept.
  - (a) One new kind `{ kind: 'config-value', file, key, value, base }`: the editor sends the whole new list, map or record, and `base`, the value it started from; the server refuses when the file's value is no longer `base` (an edit made elsewhere meanwhile), rewrites only that key's lines over the bytes (`setItems` for a list, the same for a map's entries), and runs config-key's three checks before writing; undo through the change log as every write. For: one shape for the 7 lists, 5 key/value families and 15 records; VS Code's own list and object editors write the whole value to settings.json; reuses the in-place edit the rail already uses. Against: a whole value per save, so two tabs editing one list at once get a refusal instead of a merge.
  - (b) A kind per operation `{ kind: 'config-op', file, key, op: 'add' | 'set' | 'remove' | 'move', at, to, value }`. For: two edits of different items of one list both land. Against: four operations times three families, reorder and rename rules of its own, much more server code, and no counterpart in VS Code.
  - (c) `config-key` widened to take any value. For: no new kind. Against: its head comment and its scalar edit are for one value; the list and map edits are a different byte edit; Z168 asked for a new kind.
  - (d) No editors, the description and the link as today. The lazy option, which Z168 already declined.
  - Recommendation (a): the shape VS Code uses, one write for all three families, with `base` so a stale editor never overwrites an edit made meanwhile. S4 waits on this ruling.

## The cases' first run

On the tree as I found it (the first builder's edits in the worktree, none run before), run once before I changed anything: `npx vitest run --reporter=dot tests/views/system/audit.test.ts tests/views/academic/present.test.ts tests/state/life/present.test.ts tests/views/shared/prose/jump.test.ts tests/state/shared/words/format.test.ts tests/views/sessions/changes.test.ts tests/server/sessions/stores/customizations.test.ts tests/views/whole/type-scale.test.ts tests/views/whole/tinted.test.ts` printed `Test Files  9 passed (9)`, `Tests  494 passed (494)`. Cases 1 to 11 pass there in their final form, case 8 with `toBeCloseTo(50 / 720, 12)` for `fit(100, 50)` as `Q35-cases.md` rules (`tests/state/life/present.test.ts:838`).

On the unchanged tree (main's sources, the first builder's run of the same tests written in the form each case has now; carried from its report, not rerun by me): `Test Files 7 failed (7)`, `Tests 18 failed | 182 passed (200)`. Two cases written for the row form select by `data-card` and so pass on the unchanged tree: "draws a message holding markup and an unmatched backtick as text" and "carries the mute control on an open row".

| Case | Unchanged tree |
| --- | --- |
| 1 Audit, two in `todo` and one in `data` | fails: `expected [] to deeply equal [ Array(3) ]`, the view drew `article.card` and no `li[data-card]` |
| 2 backtick as code; markup with an unmatched backtick as text | the backtick case fails on the `li` selector; the markup and unmatched-backtick case selects by `data-card` and passes on the unchanged tree |
| 3 mute on an open row, un-mute on a parked one, no muted section with nothing parked, control disabled while a write is out | the open-row case ("carries the mute control on an open row") selects by `data-card` and passes on the unchanged tree; the parked row fails on the `li` selector; the disabled control is an audit over source (`disabled={busy}`, `if (busy) return;`) |
| 4 search by place, none, only a parked match, empty | card form passes, row form fails on the `li` selector except the parked-only case |
| 5 two findings with one signature in one section | outcome on the unchanged tree: the server render does not throw and draws two `article` elements carrying the same `data-card`. Kept as two rows (`tests/views/system/audit.test.ts`, "draws two findings carrying one signature as two rows"). A keyed `each` over a duplicate key in a client runtime is not exercised (no DOM): not verified |
| 6 empty scope or empty place | the control was drawn; the card drew an empty `<span class="where">` and an empty `h4`, so the "no empty element" part fails |
| 7 Present frame | fails: `expected '' to contain 'width: 1280px'`, `expected '' to contain 'visibility: hidden'`; the empty deck and the grid outside any frame pass |
| 8 `fit` | `TypeError: fit is not a function`; fourth value corrected by the cases ruling to `50 / 720` |
| 9 `jump.ts` in a box scaled by 0.5 | fails: `expected 100 to be 200`; the unscaled and zero-height cases pass |
| 10 Changes, 90-character path | fails: the span held the elided `.../deep/...` form; `expected [ 'PATH_MAX', 'compactCount', ...(8) ] to not include 'elide'` |
| 11 Customizations links | three of four fail: link path listed, `expected '.../links-.../agents/in.md' to be '.../root-.../CLAUDE.md'`, `expected null to be '# out'`; the dangling link and the plain file pass |

## DONE / NOT DONE

| Row | State | Command and output |
| --- | --- | --- |
| 1 Changes paths cut at the end; `elide`, `PATH_MAX`, `sessions.ch_elide` removed | DONE | `grep -rn "elide" src config` prints nothing (exit 1). The three callers draw the whole path with `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` and the whole path in `title`: `ChangesTouched.svelte` `.pa`, `ChangeGroups.svelte` `.pa`, `Repo.svelte:290` `.path`. `tests/views/sessions/changes.test.ts:192` "draws a path of 90 characters whole, with the whole path as its title"; `tests/state/shared/words/format.test.ts:128` asserts `elide` and `PATH_MAX` are gone |
| 2 Aligned columns in Changes | DONE | `ChangesTouched.svelte` `.files` grid `max-content minmax(0, 1fr) max-content max-content`, `.file` takes it by `grid-template-columns: subgrid`; `ChangeGroups.svelte` `.rows` grid of five columns by subgrid; the count is `--font-num`, right-aligned. Seen only at the look |
| 3 Customizations open where the file is | DONE | `customizations.ts` `realPath()` applied to every item in `rowOf()`; `Customizations.svelte` unchanged. `tests/server/sessions/stores/customizations.test.ts` cases 353, 362, 368 (case 11) |
| 4 Audit as a list | DONE | `Audit.svelte` (304 lines): `<ul>` per section, `<li data-card={signature}>`, scope `span`, message through `CodeText`, `where` in mono `--fs-sm`, compact `ToolButton` in `.act` revealed by `--row-reveal` on hover, focus-within, and always under `(hover: none)`, `li:hover` takes `--chip`, `<Pane ... tinted>`. `grep -n "Card" src/lib/views/system/audit/Audit.svelte` prints nothing (exit 1) |
| 5 Present filling its pane | DONE | `Present.svelte`: deck box `height: 100%`, `overflow: hidden` when framed; `.stage` of `1280 * s` by `720 * s` px; `.frame` 1280 by 720 with `transform: scale(s)`, `transform-origin: 0 0`, `visibility: hidden` while `s` is 0; `bind:clientWidth`/`bind:clientHeight`; surface `var(--card)`, translucent mix under `body.wall`. `fit` at `src/lib/state/life/present.ts:114` |
| 6 The slide laid out for its frame | DONE | `.frame` sets `--slide-fs-title` 56, `-h` 36, `-sub` 28, `-body` 24, `-small` 18 px times `--text-scale`, 64 px padding, `overflow-y: auto`, `data-scroll`; `Slide.svelte` `.reading` is `max-width: var(--slide-reading)` (1040 px) centred; Title and Closing centre both ways; no `ch` cap remains in `parts/`; `jump.ts` `scaleOf()` divides the scroll distance by the scale |
| 7 Tests | DONE | see the test run below; `tests/checks/tree/allow-audits.txt` no longer lists the Audit card case |
| 8 Docs | DONE | `DESIGN.md:367` (frame), `DESIGN.md:378` (rows), `HELP.md:120` (present), `HELP.md:130` (changes: path cut at its end, columns), `HELP.md:139` (audit rows) |
| Case 5 in a client runtime | NOT verified | no DOM in the suite; the row `each` is keyed by `finding.signature` as the card list was |
| Look on TEST | NOT done | the orchestrator's look |

Test run after the last change, scoped: `npx vitest run --reporter=dot tests/views/shared/prose/jump.test.ts tests/checks/source/comment-width.test.ts tests/checks/tree/audits.test.ts tests/checks/tree/negatives.test.ts` printed `Test Files  4 passed (4)`, `Tests  27 passed (27)`.

Brief verify, step 3: `grep -n "Card" src/lib/views/system/audit/Audit.svelte` prints nothing; `grep -rn "elide" src config` prints nothing; `sh utils/folder-check.sh` exits 0; the ASCII gate (`LC_ALL=C perl -ne ... $(find src tests config -type f ! -name local.yml)`) prints nothing; `LC_ALL=C grep -n '[^ -~]' DESIGN.md HELP.md` prints nothing. The brief's gate names `bin` too and the worktree has no `bin` folder; `find` printed `bfs: error: bin: No such file or directory` and the gate printed nothing for the rest.

Full list, 5 runs (`npm run diagrams` ran before each and exited 0):
- Runs 2 and 3: red for reasons inside files I changed, fixed and rerun alone each time (run 2 stopped at `npm run test:checks`, run 3 at `npm run lint`): `tests/checks/source/comment-width.test.ts` (three comment lines past column 100: `Summary.svelte:83`, `jump.ts:18`, `jump.test.ts:3`), `tests/checks/tree/audits.test.ts` (the three `jump.test.ts` cases rendered nothing and were not named audits), `tests/checks/tree/negatives.test.ts` (nine absences in `audit.test.ts` and `present.test.ts` without a reason above them), and `npm run lint` (`tests/views/shared/prose/jump.test.ts:44` `no-this-alias`).
- Runs 1 and 4: `npm test` stopped on five to eight 5000 ms timeouts in files this step did not change: `tests/routes/edit/config-key.test.ts`, `tests/server/edit/config-key.test.ts`, `tests/server/git/autofetch.test.ts`. Rerun alone: `npx vitest run --reporter=dot tests/routes/edit/config-key.test.ts tests/server/edit/config-key.test.ts tests/server/git/autofetch.test.ts` printed `Test Files  3 passed (3)`, `Tests  96 passed (96)`; the second rerun of the last two printed `Test Files  2 passed (2)`, `Tests  82 passed (82)`. checks.sh stops at its first red command, so those runs did not reach the other six commands, which is why the list was run again.
- Run 5, the last, quoted from checks.sh:

```
$ npm test
 Test Files  424 passed | 22 skipped (446)
      Tests  11100 passed | 619 skipped (11719)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
1790898119148 COMPLETED 2957 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

Number of full-list runs: 5.

## Files changed (line counts now)

Source: `src/lib/views/system/audit/Audit.svelte` 304; `src/lib/views/academic/present/Present.svelte` 288; `Slide.svelte` 69; `parts/Closing.svelte` 63, `Equation.svelte` 61, `Framing.svelte` 94, `Ideas.svelte` 109, `Project.svelte` 250, `Summary.svelte` 101, `Title.svelte` 65, `Words.svelte` 55; `Panel.svelte` 174; `src/lib/state/life/present.ts` 460 (`FRAME_WIDTH`, `FRAME_HEIGHT`, `fit`); `src/lib/views/shared/prose/jump.ts` 89; `src/lib/state/shared/words/format.ts` 116; `config/text/views/sessions/changes.yml` 79; `src/lib/views/sessions/changes/ChangesTouched.svelte` 124; `src/lib/views/shared/changes/ChangeGroups.svelte` 311; `src/lib/views/sources/repositories/Repo.svelte` 322; `src/lib/server/sessions/stores/customizations.ts` 469.
Tests: `tests/views/system/audit.test.ts` 311; `tests/views/academic/present.test.ts` 353; `tests/state/life/present.test.ts` 849; `tests/views/shared/prose/jump.test.ts` 113 (new); `tests/state/shared/words/format.test.ts` 131; `tests/views/sessions/changes.test.ts` 475; `tests/server/sessions/stores/customizations.test.ts` 381; `tests/views/whole/type-scale.test.ts` 388; `tests/checks/tree/allow-audits.txt` 120.
Docs: `DESIGN.md` 419, `HELP.md` 302, `docs/diagrams/` (layer-state, layer-views, layers regenerated by `npm run diagrams`).

## Decisions the brief did not cover (each reversible)

1. `realPath()` is applied to every item of every Customizations row (instructions, skills, agents, hooks, MCP, plugins, tools), in `rowOf()`, so one rule serves all rows rather than three call sites. A path that does not resolve keeps the path as found.
2. The frame carries `data-frame` (the marker the test reads) and `data-scroll` (the brief's; it also makes the shell's scroll keys scroll the slide).
3. `FRAME_WIDTH` and `FRAME_HEIGHT` are exported from `state/life/present.ts` beside `fit`, so the view and `fit` read one size.
4. The three `jump.test.ts` cases are named "audits that ..." because the suite has no DOM and they run over stubs; `tests/checks/tree/audits.test.ts` requires the word for a case that draws nothing. They are reported as audits, not coverage.
5. Absences in `audit.test.ts` and `present.test.ts` each carry a reason comment above them, as `tests/checks/tree/negatives.test.ts` requires.
6. A Customizations row with no root holding its real file opens the Customization viewer (a fallback the brief names), and a link into a root opens a source tab.

## Limitations and sharp edges

- The client decides "a root holds this file" by comparing strings with the roots' configured `dir` (`state/sources/fs.ts:731` `rootHolding`), while the server compares real paths. A root that is itself configured as a link, now that Customizations gives real paths, would send a row to the viewer, not to a source tab. The viewer shows the file, so nothing 404s.
- A slide taller than the frame scrolls inside it. Because the frame carries `data-scroll`, the shell's `gg` and `G` scroll the frame, while PageUp and PageDown step the slide (`Present.svelte` `keys`).
- Duplicate signatures in one section (case 5) are drawn as two rows; the client-side keyed `each` over a duplicate key is not verified.
- The unit suite does not see the frame's fit, centring, letterbox, scroll or first paint, the row hover reveal, or the aligned columns; the look does.

## Before and after for the look (TEST)

- **Audit**, any pane width, with a hub that has findings: before, each finding was a bordered card with an `h4` scope; after, a flat list under each section head, one row per finding at the tree-row height, scope in the row's main words, message in muted ink with backticked words as code, place in mono, the mute control appearing at the row's end under the pointer or with the focus inside; narrow pane: rows wrap by whole lines; the arrow keys still step through the rows.
- **Present**, narrow, wide, tall pane and the full page, then with a rice wallpaper theme and with the text size raised: before, the slide used the left part of the pane at the interface's type size; after, a 16:9 frame letterboxed and centred, scaled with the pane, its words scaling with it, its own surface so the words never sit on the picture; Title and Closing centred both ways; a long narrative slide scrolls inside the frame and a `#` link lands on its heading. The grid (`O`) and the empty deck are not framed.
- **Changes**, a session with long paths in a narrow pane: before, the path was cut at its start (`.../deep/...`) and the verb floated; after, the whole path is cut at its end with an ellipsis and the verb and count start at one x in every row; the same for the Staged, Changed and Untracked rows and the root path of Repositories.
- **Customizations**, the row `~/.claude/agents/ordo-high.md`: before, `Cannot open: HTTP 404`; after, it opens its file.

Model: claude-sonnet-5-5. Usage: not measured by a command.

## Anything wrong in the brief

Item 6 of the brief says the slide parts use the slide type scale "in place of the UI's `--fs-*` tokens" and that the Panel is not scaled. `Panel.svelte` is drawn only inside `parts/Project.svelte`, inside the frame, so its text is slide text and it reads `--slide-fs-small` (`Panel.svelte` and its row in `tests/views/whole/type-scale.test.ts:161`). The Panel is kept on the slide scale; the sentence was wrong for it.

## Changes outside the brief's listed items

- `tests/ui/theme/wall.test.ts:154`, the entry `'src/lib/views/system/audit/Audit.svelte li:hover'` with the reason "a hover response, saying which row the pointer is on". It serves item 4: the Audit row takes `--chip` under the pointer, and the wall test lists each hover rule with its reason.
- `DESIGN.md:87`, the sentence "A Customizations item names its file by real path (a link followed to its target), so the roots decide where it opens". It serves item 3.
- `HELP.md:139`, the `audit` row: "Each finding is a row of the list, with a mute control at its end". It serves item 4.

## Repair round 1

1. **Spec S1, a viewer tab saved with a link path.** `customizationFile` now compares `realPath(resolve(path))` with the listing (`src/lib/server/sessions/stores/customizations.ts:402`; its doc comment says so), so a tab restored with the old link path reads the file the link points to. Tests in `tests/server/sessions/stores/customizations.test.ts`: "serves the file a link points at when the viewer is asked for the link path" (line 382) and "serves nothing for a path the listing does not give, a file beside the target included" (line 389). With `const wanted = realPath(resolve(path));` replaced by `const wanted = resolve(path);` by hand: `FAIL ... serves the file a link points at when the viewer is asked for the link path`, `AssertionError: expected null to be '# out'`, `Tests  1 failed | 30 passed (31)`. With the fix back: `Tests  31 passed (31)`. The second test (a path no item resolves to, and a dangling link, give null) guards the refusal and passes both without and with the fix, since the refusal was already there.
2. **Spec S2, `Panel.svelte`.** Kept on the slide scale; the sentence of the brief is named above under "Anything wrong in the brief". No code change.
3. **Spec S3.** The three changes outside the listed items are named above with the item each serves. No code change.
4. **Proof P1.** The first-run section now names the two cases that pass on the unchanged tree and reads `Tests 18 failed | 182 passed (200)`.
5. **Proof P2, case 4's count.** `tests/views/system/audit.test.ts:269` parks two findings and searches for one, and asserts the muted section's count (`['1']`, read as the test at 138 reads counts). With `const hidden = $derived(auditSearch(parked(), search));` replaced by `const hidden = $derived(parked());` by hand: `FAIL ... keeps the muted section, with its count, when only a parked finding matches`, `AssertionError: expected [ '2' ] to deeply equal [ '1' ]`, `Tests  1 failed | 23 passed (24)`. With the fix back: `Tests  24 passed (24)`.
6. **Proof P3, keys.** Both row loops of `src/lib/views/system/audit/Audit.svelte` (lines 163 and 181) key a row by `` `${finding.signature}:${index}` ``, as `Findings.svelte:42` keys its rows, so two findings with one signature are two keys. The unit suite cannot mount a keyed `each`; the fix is checked by reading and is left to the look. "draws two findings carrying one signature as two rows" stays and passes.
7. **Proof P4.** "cuts no path" is removed from `tests/state/shared/words/format.test.ts` with its now unused `import * as format`; the behaviour is held by "draws a path of 90 characters whole, with the whole path as its title" in `tests/views/sessions/changes.test.ts:192`.
8. **Standards St1.** `src/lib/views/shared/changes/ChangeGroups.svelte:140-142` writes `<span class="counts">` with `<ChangeCounts {entry} />` on its own line.
9. **Behaviour B1 and B2, for the look.** In the Touched list of Changes the "also open" mark now stands before the path (`ChangesTouched.svelte`, grid column 1), and a Customizations row whose file is a link opens a tab labelled with the real file's name (`Customizations.svelte:89`, the last segment of `item.path`, which is now the real path).
10. **Behaviour B3.** Written under the sharp edges above: `gg` and `G` scroll the frame, PageUp and PageDown step the slide.

Scoped run while working: `npx vitest run --reporter=dot tests/server/sessions/stores/customizations.test.ts tests/views/system/audit.test.ts tests/state/shared/words/format.test.ts tests/views/sessions/changes.test.ts tests/views/whole/type-scale.test.ts` printed `Test Files  5 passed (5)`, `Tests  376 passed (376)`.

Full list, 4 runs (`npm run diagrams` before each, exit 0). Runs 1 to 3 stopped at `npm test` on a suite error or a 5000 ms timeout in files this round did not change, with the machine at a load average near 20: `tests/ui/controls/editor/kit/theme.test.ts` (`Cannot read properties of undefined (reading 'config')`; alone: `Tests  11 passed (11)`), `tests/data/sources/registries.test.ts` and `tests/server/edit/config-key.test.ts` (`Test timed out in 5000ms`; alone: `Test Files  2 passed (2)`, `Tests  53 passed (53)`), `tests/routes/edit/config-key.test.ts` and `tests/server/edit/config-key.test.ts` (`Test timed out in 5000ms`). Run 4, quoted from checks.sh:

```
$ npm test
 Test Files  424 passed | 22 skipped (446)
      Tests  11101 passed | 619 skipped (11720)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
1790903375083 COMPLETED 2957 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

Full-list runs in this round: 4.
