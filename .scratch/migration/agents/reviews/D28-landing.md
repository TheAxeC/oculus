# D28 landing

Position: plan oculus/migration, step D28 (saving a source file as VS Code's text editor does), landed 2026-10-08. Next: M8 (the hub's YAML checked in the editor), then M6, D41, D43, D33, D39, D36 and D40.

## Open items

- Open item 5 (2026-10-08, X3e's landing): the root drag of the Files tree has no guarded entry, so the test written for S-R1 (`tests/views/shared/explorer/root-drag.test.ts`: a drop over a tree whose own drag never ended, from a drag of another tab, writes no order; the tree's own drag still drops) is not landed and is kept as `agents/reviews/X3e-root-drag-test.patch`. A wrong drop writes the order of the roots into `sources.yml` or the workspace in force, a wrong configuration written. Options: (a) a new entry G57, "A root dropped on a Files tree reorders only that tree's roots: a drag from another tab, or one whose start was in another tree, writes no order", Code `src/lib/views/shared/explorer/tree/control/dragging.svelte.ts`, Test the patch's file with its two titles, landed in the next step that touches the tree (D28); (b) no entry, the fix kept and the look the check, as for every view. Recommended (a): the failure writes the reader's configuration, the kind of cost spec.md names for a test, and the test runs in well under a second; (b) is the lazy option, since it leaves a configuration write with no check that runs.
- Open item 6 (2026-10-08, D28's review): the server's held parse of the config folder (D28 keeps it, since it takes about 200 ms off every file press against D13a-3's 300 ms bound) has no guarded entry, so its test is not landed; its text is in D28's report under "The config cache's test, not landed". A cache that misses a write serves a stale configuration, a wrong configuration in force. Options: (a) a new entry G61, "A configuration file written, added or removed is read by the next request that asks for the configuration", Code the server context's config cache, Test that test, landed with D28 or the next step that touches the server context; (b) no entry, the cache checked only by reading. Recommended (a): the failure puts a configuration in force that the disk no longer holds, the cost spec.md names for a test, and the test runs in milliseconds; (b) is the lazy option.
- Open item 7 (2026-10-08, D28's landing): the conflict compare's read key (`readKeyOf` in `src/lib/views/sources/repositories/diff/diff-read.ts`) has no guarded entry, so no test checks that the compare reads the file again when the file on disk moves while the compare is open. A key that misses the move leaves the compare's left side showing old disk text, and a reader who then presses Overwrite writes over a change they never saw, work lost. Options: (a) a new entry G62, "The save-conflict compare is read again when the file on disk moves, and no other diff pane is", Code `diff-read.ts` `readKeyOf`, Test a table of three rows (the conflict compare's key changes with the disk hash; a working-tree compare's key does not; a replace preview's key is unchanged), written in the next step that touches the diff panes; (b) no entry, the key checked by reading and by the look. Recommended (a): the failure loses the reader's work, the cost spec.md names for a test, and the rows run in milliseconds; (b) is the lazy option.

## Not done

- The look ran on a scratch oculus (port 8796), not on TEST: the page on 8790 is Axel's to view only.
- Case 43's 300 ms bound: the press to the response end of `/api/file/look/a.md` was 170 ms, read from resource timings in a hidden tab; the drawing itself was not timed.
- The config cache's test is not landed (open item 6), and the conflict compare's read key has no test (open item 7).
- The 8790 dev server holds the ServerContext it was started with; D28's `configCache` is created at server start, so that server needs a restart to serve D28's server half. Inferred from `src/lib/server/root/context.ts`, not verified on 8790.

## The check of Steps 1

`ListAgents` lists no agent of D28: the builder a7fdeabbe3ca09dfa, the brief check a148f9947c88c06e2 and the reviewers a8d21c562b6b3a8c6 and af492a99f09c58ae3 have all ended.

## What landed

On main from base 2441e0b53, 126 files, +6722 -2176 with the fixes at landing: a `source:` channel per open file polled by the server every 500 ms; a save sent with the hash of the bytes the tab read and refused `changed` when the file moved, with Compare, Overwrite and Revert and the conflict compare in the tab's pane; a deleted file's tab struck through, its Save writing it again; `editor.autosave` with `after_delay` and `on_focus_change`, a close under autosave saving first; `trim_trailing_whitespace` and `final_newline` per language; a file that is not UTF-8 throughout or holds a NUL drawn read-only and never saved over, a BOM kept; the server's parse of the config folder held in the ServerContext's cache.

The twelve findings of the review over round 1 are closed at landing (`agents/reviews/D28-refuter.md`, "Closed"). Fixes at landing, outside the builder's tree:

- F1 to F12 as closed there, among them a file deleted between the save's stat and its read answered 409 `changed` in place of 500 (F8; the new row of the G8 table fails on D28's tree with `expected 500 to be 409` and passes with the fix);
- the bar's Save enabled for a tab whose file was deleted on disk (`BarActions.svelte`), found by the look: the button was greyed while the tab's line said Save writes the file again;
- the nineteen `// Revert:` comments taken out of the tests;
- `agents/guarded.md` naming each row of D28's tables under one entry (G2, G8, G9, G28, G58, G59, G60).

F11, a host-visible change the builder's report did not state: a broken configuration file's findings now print to the server's log once per parse, not once per request.

## Verification

- `test:landing: 235.3 s; every command passed` in `.agents/worktrees/gate`, after `npm run diagrams`: ASCII gate, lint, format:check, `npm test`, `test:checks`, then check, build and test:slow.
- Main's staged diff equals the gate's: `git diff --cached -- tools/oculus | shasum` 65f48760 on both.

## The look

On the scratch oculus: a clean tab took an outside write; a dirty tab kept its text under "The file changed on disk after this tab read it; your changes are kept, and Save is refused until you compare, overwrite or revert."; Cmd+S refused with the conflict alert and its three buttons, the disk unchanged; Compare opened "a.md (in file) <-> a.md (in oculus): Resolve save conflict", disk left and tab right; Overwrite wrote the tab's text and cleared the line; a deleted file's tab struck through with "The file was deleted on disk; Save writes it again.", Cmd+S and (after the fix) the bar's Save writing it again; case 37, a Latin-1 byte after 9,000 bytes, drawn read-only under the `source.not_text` line; case 47, a 3 MB log, its first 2 MB under its line, saving nothing; `after_delay` saved a second after typing, trailing whitespace trimmed and one final newline; `on_focus_change` saved nothing while the editor kept the focus and saved when it lost it; a dirty tab closed under `on_focus_change` with no question, its text saved.

## Agents

| Agent | Role | Model | Tokens | Tool uses | Time |
|---|---|---|---|---|---|
| a7fdeabbe3ca09dfa | builder | claude-sonnet-5-5 | 310,478 | 558 | 138.0 min |
| a7fdeabbe3ca09dfa | builder, round 1 | claude-sonnet-5-5 | 305,070 | 253 | 53.3 min |
| a148f9947c88c06e2 | brief check | claude-opus-5-5 | 262,283 | 78 | 12.7 min |
| a8d21c562b6b3a8c6 | reviewer | claude-opus-5-5 | 239,746 | 145 | 22.6 min |
| af492a99f09c58ae3 | reviewer over round 1 | claude-opus-5-5 | 368,602 | 88 | 15.4 min |

The builder's first report did not pass its bar: the first review's sixteen findings went back in round 1. The fixes at landing are listed above.
