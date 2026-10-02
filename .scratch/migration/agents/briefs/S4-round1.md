# S4, repair round 1

The refuter's report is `agents/reviews/S4-refuter.md`. Each finding below has its ruling; change nothing else. Run no git command at all, not `git status`, `git diff`, `git log`, `git show` or `git ls-files` (`agents/spec.md`, "Where you work"; finding ST2). Work in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/S4`. Your paths are the brief's, widened by this round where a ruling names a file. Rewrite your report `tools/oculus/.scratch/migration/agents/reviews/S4-report.md` for the whole step after the round, with a "Repair round 1" section that names each finding below, what changed, and the test that fails without the change, quoted from a run on the code before this round's change, in the test's final form.

## Spec

1. SP1, the block rewrite. Use the mechanism the brief named: `new Parser()`, `new Composer({ keepSourceTokens: true })` and `CST.setScalarValue` on the source token for a scalar, and the CST's own source text for the untouched bytes, so the `yaml` library does the quoting. Remove the hand quoter (`block-render.ts` `scalarText`, `plainOk`) and whatever of `block-render.ts` and `block-source.ts` the CST route makes unneeded. Keep every byte guarantee: C1, C3, C5, C6, C26 and C27 stay green, and a new test writes strings that need quoting (a leading `-`, a `: `, a `#`, `yes`, `null`, a number-like `012`, a leading space) and reads each back unchanged. If a case the brief's route cannot do exists, show it with a failing probe in the report and keep only the code that case needs.
2. SP2: mark in the report's file table each path outside "Paths this step writes" with its reason.
3. SP3: the `written` merge into `config-checks.ts` stands; keep it in the report's judgment calls as it is.
4. B5, the emptied `tab_rollup`. Ruled in automode as Z302: a family entry in `config/catalogs/options.yml` may carry `holds: lists`, meaning each key of the map holds a list of records; `tab_rollup` carries it. The options catalog's head comment (`options.yml:8-9`) says what the key means. The editor reads it: an emptied `tab_rollup: {}` draws the rollup form. The write reads it: a family with `holds: lists` refuses a key holding a single record, and a family without it refuses a key holding a list (ruling 9). The catalog's reader refuses `holds` with any other value. Tests: the rollup form for `{}`; the refused write of `{ projects: { label: x, ... } }` with nothing written; the reader's refusal of `holds: maps`.

## Proof

5. P1: remove `draftSlot` and its `data-draft` attribute (ST4) and the test at `editors-writer.test.ts:357-366`; C35 is carried by "keeps the drafts of two keys apart, and never meets the typed text", which the report names for it.
6. P2: list in the report every edit to an existing assertion or allow list with its before and after: the two removals and one retitle in `allow-audits.txt`, the chips floor, the duplication re-key, `config-folder.test.ts`'s predicate and chord list, and the rail count and label assertions in `settings.test.ts` and the rail and catalogue tests. The wall SOLID entry goes (ruling 13).
7. P3, P4, P6: correct the report: the rename grep row (DESIGN.md's Config view lines, fixed by ruling 11); the badge sentence (which views register badges, and that Audit is the only one on the merged page); item 4's proof is `contents.test.ts`.
8. P5: run the first runs again on the base copy with every new or changed test in its final form, and quote per test its failing line; for the seven suites whose module does not exist on the base, say so once with the `Cannot find module` line. Take the line counts again with `wc -l` after your last change.

## Behaviour

9. B2, the write accepts a wrong configuration (`config-value.ts:165-176`, `misfit`). A map family whose records are maps refuses a key holding a list (`nav_groups` with `help: [ ... ]` is refused, nothing written), and a key/value family refuses a value that is not a scalar (`read_limits` with `next: { a: 1 }` is refused), each with a catalog sentence naming the key. Tests for both, through `writeConfigValue` and through the route.
10. B1, a list row draws its refusal twice. One place draws it: the editor's `<p class="problem" role="status">`; `Item.svelte:104-105` no longer pushes the list editor's sentence into the item's status line. A test over the mounted row: one element with the sentence, one `role="status"`.
11. ST1: rewrite DESIGN.md:389, :391 and :399 so they describe the Settings view's editors and no Config view; :399's last card of `local.yml` goes, per Z170.
12. B3, saved layouts after the merge. `migrate.ts` relabels a saved views page to the rail entry's label ("System"), and when the saved views page has no pane holding a system view, it places the five system views (status, findings, audit, history, gallery) in a new pane under the pane holding `pages`, split 0.5/0.5, as the shipped arrangement has them, instead of appending them to the Pages pane. Tests over a saved layout of the old shape: the page's label is "System"; the five views sit in their own pane below Pages; the info page's tabs other than `config` keep their state. State in the report's before/after what a saved layout loses (the info page's splits, sizes and label, the `config` tab's state).
13. ST5, the narrow contents overlay. Draw `.contents.over` with the popover fraction (`--wall-popover`) as the tree's other overlays do, and remove the SOLID entry at `wall.test.ts:166-167`.
14. B4: state in the report's before/after: a Settings tab holding an editor draft counts as unsaved work, with what the marker and the close prompt show; the overlay's place over the list; the toggle left of the search box.

## Standards

15. ST3: one definition each. `isPlain` and `sameInOrder` live once in the data layer shared by both sides (or are replaced by `lodash-es` `isPlainObject` and `isEqual`, already a dependency), imported by `config-value.ts` and `draft.ts`. The two `flowText` get different names that say what each does, or become one when ruling 1 removes the server's.
16. ST4: `draftSlot` removed (ruling 5).
17. ST6: `context.ts:356-357` says a Settings tab holding a typed field or an editor draft not yet written.
18. ST7: `config/layout.yml` keeps the file's two blank lines between `arrangements:` and the floats comment.

## Verify before you report

The brief's verify list through `checks.sh`, from `tools/oculus` in the worktree, its printed lines quoted; the brief's verify 2 and 3 greps; `npm run diagrams` twice with the md5 of `docs/diagrams` equal; the ASCII gate.
