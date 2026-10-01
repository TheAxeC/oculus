# Q35 report: stopped after the first run, on case 8

NOT done: everything in the brief. The first run on the unchanged tree shows that case 8 states a value its own rule does not give, so the step stops here and nothing is built or verified. The worktree is not at main's head: source and test files were edited before the case 8 value was checked (listed under "State of the worktree"); none of those edits has been run since.

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








## The case the brief's rule gets wrong

Case 8 of the brief: "`fit`: 1920 by 720 gives 1; 1280 by 1440 gives 1; 640 by 360 gives 0.5; 100 by 50 gives 0.078125; 0 by 0, -5 by 10 and NaN give 0."

The rule of item 5: "`fit(w, h)` is `min(w / 1280, h / 720)`, and 0 for a non-positive or non-finite size".

Command: `node -e "const fit=(w,h)=>!(w>0)||!(h>0)||!isFinite(w)||!isFinite(h)?0:Math.min(w/1280,h/720); ..."` printed:

```
1920 720 1
1280 1440 1
640 360 0.5
100 50 0.06944444444444445
0 0 0
-5 10 0
NaN 360 0
```

The rule gives 0.06944444444444445 for 100 by 50, not 0.078125: 100/1280 = 0.078125 is the width ratio, and 50/720 = 0.0694... is the smaller height ratio, which `min` takes. The other six values of the case agree with the rule. Either the case's input or its expected value is wrong: 100 by 56.25 gives 0.078125 under the rule, and 100 by 50 gives 0.06944444444444445 (in a test, `50 / 720`). Which of the two the brief means is the orchestrator's to rule; the rule itself (`min`, letterboxed uniform scale) is what items 5 and 6 build on.

## The cases' first run on the unchanged tree

Tests written in the form each case has after the change, then run with `npx vitest run` over `tests/views/system/audit.test.ts tests/views/academic/present.test.ts tests/state/life/present.test.ts tests/views/shared/prose/jump.test.ts tests/state/shared/words/format.test.ts tests/views/sessions/changes.test.ts tests/server/sessions/stores/customizations.test.ts` with the sources of main (the run was before any source edit): `Test Files 7 failed (7)`, `Tests 19 failed | 181 passed (200)`.

| Case | First run on the unchanged tree |
| --- | --- |
| 1 Audit, two in `todo` and one in `data` | fails: `expected [] to deeply equal [ Array(3) ]`; the view draws `article.card`, no `li[data-card]` |
| 2 backtick as code; markup and an unmatched backtick as text | card form passes (probe run of the same assertions against `article[data-card]`); the row form (`li`) fails only on the `li` selector |
| 3 mute on an open row, un-mute on a parked one, no muted section with nothing parked | card form passes (probe); the row form fails on the `li` selector. The control disabled while a write is out has no case on the tree that presses a control; it is written as an audit over the source (`disabled={busy}`, `if (busy) return;`), which passes |
| 4 search by place, none, only a parked match, empty | the card form passes (probe); in the row form the first and last fail on the `li` selector, the parked-only case passes |
| 5 two findings, one signature, one section | stated outcome on the unchanged tree: the server render does not throw and draws two `article` elements carrying the same `data-card` (probe: `articles=2`). Kept as: two rows. A keyed `each` on a duplicate key is not exercised in a client runtime here (no DOM): not verified |
| 6 empty scope or empty place | the mute control is drawn (passes); the card draws an empty `<span class="where">` and an empty `h4` title, so the "no empty element" part fails on the unchanged tree |
| 7 Present frame | fails: `expected '' to contain 'width: 1280px'` and `expected '' to contain 'visibility: hidden'`; the empty deck and the grid outside any frame pass |
| 8 `fit` | `TypeError: fit is not a function`; and see above: the value of the fourth input is wrong in the brief |
| 9 `jump.ts` in a box scaled by 0.5 | fails: `expected 100 to be 200`; the unscaled case and the zero-height case pass |
| 10 Changes, 90-character path | fails: the span holds `.../deep/...` (the elided form) and not the whole path; `expected [ 'PATH_MAX', 'compactCount', ...(8) ] to not include 'elide'` |
| 11 Customizations links | three of four fail: `expected { name: 'out', ... } to deeply equal ...` (link path listed), `expected '.../links-.../agents/in.md' to be '.../root-.../CLAUDE.md'`, `expected null to be '# out'`; the dangling link and the plain file pass |

The probes were temporary files under `tests/` and are removed. On this machine `os.tmpdir()` is `/var/folders/...`, a link to `/private/var/folders/...`; the Customizations test file takes `realpathSync` of its scratch folders so the existing path comparisons keep their meaning once the listing gives real paths.

## State of the worktree

Edited, not run since the edit:
- tests: `tests/views/system/audit.test.ts`, `tests/views/academic/present.test.ts`, `tests/state/life/present.test.ts`, `tests/views/shared/prose/jump.test.ts` (new), `tests/state/shared/words/format.test.ts`, `tests/views/sessions/changes.test.ts`, `tests/server/sessions/stores/customizations.test.ts`.
- source: `src/lib/state/shared/words/format.ts` (`elide`, `PATH_MAX` removed), `config/text/views/sessions/changes.yml` (`ch_elide` removed), `src/lib/views/sessions/changes/ChangesTouched.svelte`, `src/lib/views/shared/changes/ChangeGroups.svelte`, `src/lib/views/sources/repositories/Repo.svelte`, `src/lib/server/sessions/stores/customizations.ts`, `src/lib/views/system/audit/Audit.svelte`.
- Not started: `fit` in `present.ts`, `Present.svelte`, `Slide.svelte`, `parts/`, `jump.ts`, the docs, `type-scale.test.ts`, `allow-audits.txt` line 11, the verify list. No full-list run was made (0).

## To go on

Rule on case 8: (a) keep 100 by 50 and change the expected value to `50 / 720` (0.06944444444444445), or (b) keep 0.078125 and change the input to 100 by 56.25. Both leave `fit = min(w / 1280, h / 720)` as the brief writes it. The lazy option is a test that accepts either value or drops the case. The builder continues from the edits above on the ruling.

Model: claude-sonnet-5-5. Usage as far as known: not measured by a command.
