# S4 landing

Position: roadmap entry oculus/migration (the cockpit-to-oculus migration); S4, the Settings editor finished, landed. Next: D17, project commands, with Z305 (a), Z304 and the rest of its Closed section, its look on `~/workspace/zz-look-d17`.

## Open items (verbatim)

- Z276 (2026-10-02, at Axel's question whether O34 covers the task "A second person in the hub" in `tasks/tasks.yml`): it does not. O34 reads the signed-in person in one place, which is the base that task needs; the task's three parts (a Focus board per person, a private-or-shared marker per field and document with private as the default, the group views of shared deadlines, who waits on whom and the meeting rotation) are in no step, and D10 waits on a second person too. Options: (a) one new step O36 after O34 with those three parts, so the plan ends with the hub usable by your group; (b) leave the task in `tasks/tasks.yml` until someone else works in the hub, as its note says, and open a step then. For (a): the remote server is built with several users in mind and the privacy marker is cheapest to add before anything is shared. Against (a): it builds for people who are not using the hub yet. Recommended (b): the task's own condition is not met, and O34 already leaves the one place a person is read. (b) is also the cheaper option, chosen because the condition is unmet, not because it costs less.
- Z274 (2026-10-02, Axel's word that oculus is now a full IDE rather than a dashboard): a new name for oculus. Where the name lives, counted on main: 122 files under `tools/oculus/src` and 1054 occurrences across its `src`, `tests` and `config`; 40 references to the `~/.oculus` folder; the `.oculus/project.yml` manifests the other repositories carry; five browser-storage keys (`oculus.ui.v1`, `oculus.layout.v1`, `oculus.layout.previous`, `oculus.carry.v1`, `oculus.diff.addComment`); and 1241 files of the hub outside `tools/oculus` that name it (the skills, rules, memory and manifests among them). Options for when: (a) the rename done in O33, as part of the move into its own repository: the repository, the package, the folder, the source, the docs and the hub's references take the new name at once; the first-run check moves `~/.oculus` and each repository's `.oculus/` folder and carries the five browser-storage keys over once, so nothing Axel saved is lost. For: the repository is created then anyway, so its name is chosen once; no step in flight conflicts with it. Against: the old name stays on screen until the last step. (b) the rename as a step of its own now. For: the new name is in use sooner. Against: it touches nearly every file five steps in flight also touch, so each of them meets conflicts at landing, and it needs a ruling for a new step. (c) keep the name oculus. For: no work. Against: the name no longer says what the tool is, which is Axel's reason for asking. Names, in the style of the other repositories (cathedra, ordo, officium, scotoma): scriptorium (the room where manuscripts were written and copied, fitting a tool for writing papers and code); officina (a workshop; close to officium in sound); fabrica (a workshop where things are made). Recommended (a) with scriptorium. (c) is the lazy option.
- Z314 (2026-10-03, the owed look Q81): a Confirm drawn over the update tray. Taking it needs `tasks.skip_permissions` on in `config/behavior.yml` for the look and back off after; the permission classifier refused that edit, so it waits on Axel. Options: (a) Axel allows the edit for the look, which is reverted and checked with `git diff --exit-code -- tools/oculus/config`; (b) Axel takes the point himself on TEST; (c) the point is dropped from the look. Recommendation: (a), since the look then runs as every other look does and leaves no write behind.
- Z315 (2026-10-03, the owed look Q79c): the Live HPC jobs table and a job's log. The cluster was unreachable from this machine (`ssh: connect to host hpc-head1.ewi.utwente.nl port 22: Operation timed out`), which needs the UT network or EduVPN, Axel's account. Options: (a) Axel connects EduVPN and the look is taken then; (b) the point is dropped from the look. Recommendation: (a).
- Z251 (2026-10-02 09:40, all steps): fewer repair rounds. Axel asked whether the criteria for a round can be stricter so more steps land without one. Evidence: 12 of the last 13 landings had a round; each round's rulings (`agents/briefs/<step>-round1.md`) number 5 to 16, and every one of them holds rulings that change code or add a test. Options: (a) keep the round as ruled 2026-10-01 (`plan.md:773`); (b) land without a round when every first-review finding is small and inside the brief, as the refute dispositions already allow (none of the last 13 would have qualified, so it saves nothing); (c) `refute_after_repair: no` when the round stays inside its rulings, the orchestrator reading the delta in its place (saves about 185k to 270k tokens and 14 to 46 min per step; those runs found 4 to 9 findings that would then rest on the orchestrator's read; reverses part of the 2026-10-01 ruling); (d) fewer findings at the source: the overdue recurring-findings pass, its causes in three or more steps ending in a rule sentence in `agents/spec.md` or a sentence every brief carries. Recommendation: (d), with (a) kept until its effect shows; (b) and (c) are the lazy options, since they lower the bar and keep the cause. Axel, 2026-10-02: (d) taken through Z253; (a) stands meanwhile; Z251 is ruled after ten steps have landed under the new rules (count from the first landing after this line). Count at 2026-10-02 13:05: 1 of 10 (X3a, landed 11:49). Nothing is asked of Axel until the count reaches 10.

## Not done

Nothing inside the brief. `bench: []`, so no A/B. The two defects the look found (below) widen D25, ruled Z319, and are not fixed here: the first has no known cause, and both change the Settings editors' write sequence and the Undo of a `config-value` write beyond a landing fix.

## The check of Steps 1

ListAgents at 05:55 listed no subagent, only two idle peer sessions (ordo-01, research-hub-d8). S4's builder `aa51d64b83ba51019` and its reviewers `aad14f00793820d71`, `ad1b9e8780a114381` and `a9cea1ba510bb2171` were not listed.

## What landed

From base eb87b0fc, on main with the merge and the landing fixes (`git diff --cached --shortstat` at the commit, quoted in the commit's booking).

- A list editor (add, edit, remove, reorder) for every list option, a key/value table for every key/value family, a form for each record family and the rollup form for `tab_rollup`, all through the confirmed `config-value` write of the whole value with its `base` (Z190 (a)); the block writer `server/edit/block-edit.ts` with `block-render.ts` and `block-source.ts`, the checks shared with `config-key` in `config-checks.ts`.
- A draft kept per tab under the file and key, a second Save waiting while a write is out, a draft started over a value the file no longer holds named and only discarded, and a draft dropped with a sentence when a push leaves its row in a form the editor does not draw.
- `holds: lists` in the options catalog: `tab_rollup` holds lists of records, `languages` lists of values (Z302, Z306); the write reads the catalog entry, so an emptied family keeps its kind.
- The Config view removed; Settings opening each file, the `config/catalogs/` files as entries and a Texts group of the `config/text/` files; `local.yml` link-only.
- One rail item, System, on the Views and Settings layout with Settings and Catalogue swapped and the system views in a pane below Pages; `processes` last in that group and pane with no chord (Z282); a saved `info` page folded into System, a maximised Pages pane kept maximised.
- The table of contents below 700 px drawn over the list with its toggle, hidden by a choice or Escape.
- `HELP.md`, `DESIGN.md`, the text catalogs, `layout.yml`, `options.yml` and the regenerated diagrams.

## Verification on main

`npm run build` alone first (exit 0), then from `tools/oculus`:

```
$ npm test
 Test Files  544 passed | 24 skipped (568)
      Tests  13638 passed | 640 skipped (14278)
$ npm run test:checks
 Test Files  31 passed | 2 skipped (33)
      Tests  471 passed | 9 skipped (480)
$ npm run check
COMPLETED 3256 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

## The merge with main

D18, D32 and D14 landed after S4's base, and the cherry-pick met them in 19 paths, resolved on the worktree: `config/layout.yml` (the info page gone, the System lower pane `[status, findings, audit, history, gallery, processes]`); `config/text/app.yml` (the y1 to y9 row in place of y1 to y7, the w1 to w4 row dropped, main's Cmd+Shift+F and Cmd+Shift+H rows kept); `Processes.svelte` (`group: 'views', order: 9`, Z282); `allow-duplication.txt`; `fs.test.ts` and `fs-files.test.ts`; `arrangement.test.ts`; the two catalogue tests; `DESIGN.md`; `HELP.md`; the diagrams, regenerated.

## Fixes at landing

The findings of the run over repair round 2 (`agents/reviews/S4-refuter.md`, "Closed"), the merge's consequences and one defect of the look, each small and inside the brief:

1. R2-b and SP-a (Z306): `isTableValue` in `server/edit/writes/config/config-value.ts` takes a list only where the catalog entry says `holds: lists`; `languages` carries it in `config/catalogs/options.yml`, whose head comment and the `CatalogEntry` doc in `data/sources/config/catalog/options.ts` say so. `tests/server/edit/config-value.test.ts` gains "refuses a list in an emptied key/value family whose catalog entry holds single values"; with the old rule put back it fails (1 failed, 36 passed), and the file was restored and its shasum checked.
2. P-a: `readsAs` in `server/edit/block-render.ts` is `parse(source) === value`, the library's `inFlow` and `implicitKey` doing the quoting; `tests/server/edit` 11 files, 412 tests passed.
3. ST-a: `fold.ts` names the saved shapes it reads (`VIEWS_LABEL`, "views of a saved `info` page") and `SYSTEM_VIEWS` gains `processes`; `layout-system.test.ts:95` likewise.
4. `tests/state/workbench/navigation/registry.test.ts`: `processes` at `{ group: 'views', order: 9 }`.
5. `tests/views/system/machine/processes.test.ts`: the registration audit at group `views`, order 9.
6. `tests/state/system/settings/editors-draft.test.ts`: 8 lists, D18's `processes.patterns` among them.
7. `tests/views/system/workbench/catalogue.test.ts`: a key on each of a group's first nine entries, since `keyOf` answers none past the ninth; System's keys y1 to y9 over its ten entries.
8. `tests/checks/tree/allow-duplication.txt`: the entry for `status.test.ts` and `usage.test.ts` dropped, D18 having repaired that clone.
9. From the look: the narrow table of contents (`.contents.over` in `Settings.svelte`) drawn on `var(--panel)`; it was drawn on `--wall-popover`, which is unset without a wallpaper, so the list showed through it. `tests/ui/theme/wall.test.ts` names it a solid surface with its reason.

## The look (TEST, localhost:8790, tab 812136282)

Dark theme, 2026-10-03 05:28 to 05:50. S4 changes no theme. Before it: `changes.jsonl` f3d06124 (37 lines), `workspaces.json` 1bf5d57a, 3 history entries, `behavior.yml` 231c72f8, `sources.yml` e64fae65.

Seen working:
- The narrow table of contents: the Settings pane at about 490 px draws the toggle beside the search; pressed, the table draws over the list; choosing Processes scrolled to it and hid the table; Escape hid it too.
- The list editor (Processes patterns, Waiting status), the key/value table (Read limits, Languages) and the record form (Tab rollup's buckets).
- A draft held in Waiting status ("pendingx", the tab marked unsaved) while `behavior.yml` was edited on disk to `waiting_status: [one, 2]`: the row said "The file now holds this setting in a form the editor does not draw, so the unsaved edit was dropped." and the tab lost its marker; the file restored and `git diff --exit-code` clean.
- An emptied `read_limits` (`{}` in the file) refused a list: "Not written: Entry next must be one value, not a list or a record", the file unchanged. A save of `next: 300` ended its draft.
- An emptied `languages` saved and ended its draft; History's Undo of that write said "sources.yml / languages is back" with all 32 entries and their lists.
- The rail holds one System button and no Info button (read from the DOM; no rail button is clicked on TEST).
- A saved layout with an `info` page (status and processes) beside System: reloaded and saved again, the Info page is gone and its tabs are a pane below Pages on System; with Pages maximised, the focus path moved from [1,1] to [1,1,0] and still names the Pages pane.

Two defects found, widening D25 (Z319):

1. Save of an emptied `read_limits` (every entry removed) wrote `read_limits: {}` and the draft never ended: Save and Discard stayed disabled and the tab kept its unsaved marker (seen on two page loads); after a reload the row said "The file changed since this edit was started, so it was not saved." An emptied `languages` ends its draft, so the cause lies in what differs between the two; not found here.
2. Undo of the `languages` write gave the value back without the file's own text: the aligned columns of `sources.yml` were rewritten in 31 lines.

Seen and not S4's: History draws a row's Undo and its Before value only under the pointer (the `reveal` span, on main before S4).

Cleanup: `behavior.yml` and `sources.yml` restored from backups and `git diff --exit-code -- tools/oculus/config` clean apart from S4's own staged `options.yml`; the five change-log lines the look added removed, `changes.jsonl` back at f3d06124 (37 lines), `workspaces.json` 1bf5d57a, 3 history entries; the saved layout restored byte for byte from its copy, the copy removed; History's filter, the Settings search and the active tabs put back; TEST keeps its 54 tabs.

## Agents' usage

- Brief check (claude-opus-5-5): 234,939 tokens, 68 tool uses, 11.8 min.
- Builder `aa51d64b83ba51019` (claude-sonnet-5-5, ordo-high): 303,266 tokens, 143 tool uses, 31.2 min to the cases; 198,895 tokens, 542 tool uses, 254.1 min after the cases ruling; round 1 369,088 tokens, 243 tool uses, 85.4 min; round 2 141,492 tokens, 184 tool uses, 50.0 min.
- Reviewer `aad14f00793820d71` (claude-opus-5-5, ordo-high), first run: 351,130 tokens, 91 tool uses, 17.7 min; Spec 3, Proof 6, Standards 7, Behaviour 5.
- Reviewer `ad1b9e8780a114381` (claude-opus-5-5, ordo-high), over round 1: 312,772 tokens, 87 tool uses, 21.7 min; Spec 2, Proof 3, Standards 2, Behaviour 4.
- Reviewer `a9cea1ba510bb2171` (claude-opus-5-5, ordo-high), over round 2: 279,542 tokens, 74 tool uses, 26.2 min; Spec 1, Proof 1, Standards 1, Behaviour 1.
- The builder's first report did not pass its bar; two repair rounds, the second under the cap exception; nine fixes at landing.
