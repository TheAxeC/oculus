# D47 landing

Position: roadmap entry oculus/migration, the cockpit-to-oculus migration; plan step D47, one Session view, step 336 of the 364 lines of the step list (`awk` over `plan.md`'s "Packages, in execution order"). Next: D41's cause into its Step 0 and /spec D41 again; D50 into the freed slot.

## Open items

- 27. The hub's `network/events.yml` fails its own schema since your commit f28e137f1: the entry "Research visit - Linkoping (Sweden)" (`entries[2]`, line 47) lost its `status: planned` line, and the file's `schema:` block (line 9) marks `status` as `required: true`. The landing gate's `tests/checks/config/integrity.test.ts` "validates with no findings" fails on it with "key entries[2].status is required", on main as on D41 (D41 changes no file under `network/` and no schema). (a) Recommended: put a status back on the entry; `planned` is what it held, and every other entry carries one. (b) Make `status` optional in the file's `schema:` block, so a dated entry may carry none. (c) Leave it, which keeps the integrity check red at every landing; this is the lazy option. Both files are yours, so I change neither until you rule. D41 lands with this red line named as main's, not D41's.
- 28. D46: the history check forbids the key name F1. `tests/checks/source/history.test.ts:41` lists `F1` among the plan's id families (the package F1, landed, `plan.md:79`), so the check fails on every comment and document line that names the F1 key: on D46's tree `chords.ts:3` and `:86`, `Workbench.svelte:278`, `Palette.svelte:4`, `palette.ts:474` and `:478`, `editor-status.svelte.ts:15`, `grid-keys.ts:2`, `HELP.md:81` and `docs/window.md:76`. D46's brief requires the key named in HELP's key row, `docs/window.md` and `editor-status.svelte.ts`. On main no comment or document names the package F1 (`grep -rnE '(^|[^A-Za-z])F1([^A-Za-z0-9]|$)'` over `src tests utils HELP.md DESIGN.md README.md docs` prints only the check's own line 41). Changing what a check passes is yours to rule. (a) Recommended: `F1` removed from `FAMILIES`, in D46 with the path widened; a comment naming the package F1 would then pass, and none does today, and the plan has no other F package. (b) The F1 pattern narrowed so a key named in prose passes (not next to `Shift+`, `Cmd+`, "and"); a guess about the next sentence that fails on it. (c) Every comment and document reworded to avoid the name ("the help key"); HELP.md would no longer say which key opens the palette; this is the lazy option. D46's builder waits for this ruling.

## Stopping the agents

The builder a03cb689a744cc64c and both reviewers had finished before the landing; the runner's stop tool found none of them running, and its listing named only the agents of D52, D51, D41 and D48.

## NOT DONE

- Not looked at on the page: the drag and Alt+Up of case 5, the Discard and branch questions of case 6, a pane 200 px wide (case 16), keyboard order (case 17). The tests and the reviewers' reading cover their code; the page does not.
- After a reload the Session tab showed no session until it was picked again (the tab not locked). Whether the base tree's Session detail tab kept its session over a reload was not checked.

## What landed

One Session view, from base 5f08fde1a, 47 paths: Session detail, Changes and Agents are one Session view with three collapsible sections built as the Files view's sections are, one picker in the bar, each section one tree, the closed sections and their order kept in the tab's state through a pick, a pin and an unpin. The Changes and Agents views are retired: a saved tab of either is carried to a Session tab, or dropped where one already holds the pane, and a `config` tab is carried to `settings` the same way. `config/layout.yml`'s Sessions arrangement holds the Session view; the keys, the glyph, the HELP rows, `docs/views.md`'s Session section, `DESIGN.md` and the `git.message_model` help follow.

Visible changes beyond the builder's list (round-1 finding 1): a shown Session tab with Changes open asks `/api/git` for its workspace's branches and draws the repository, where before the Session view never read git and only a shown Changes tab did; the Views catalogue and the palette offer no Changes or Agents view, where before both did.

## Fixes at landing

1. Round-1 finding 2: the cherry-pick's conflict in `src/lib/state/workbench/layout/saved/saved.ts`'s comment paragraph, merged as main's paragraph (D57's "an empty added pane") followed by D47's one sentence.
2. Round-1 finding 3: the report's description of `$TMPDIR/d47/out-first.log` corrected in the booking (the CASE lines of the first run on the unchanged tree, then RENDER lines of the changed tree from `render.test.ts`).
3. `tests/routes/edit/roots.test.ts` tagged `// @module-tag slow` under Z64: red in the gate's first `npm test` (timed out at 5000 ms), green alone (`npx vitest run tests/routes/edit/roots.test.ts`: 2 passed).

## Verification

The gate in `.agents/worktrees/gate` at 6fd9f49ee, `npm run diagrams && npm run test:landing`. The first run was red in `npm test` and svelte-check through `tests/state/system/link-rewrite.test.ts`, a file of D41 left untracked in the gate by D41's gate run (kept on branch D41, removed from the gate), and in the roots test above. The second run:

```
ok      ASCII gate (9.7 s)
ok      npm run format:check (24.6 s): All matched files use Prettier code style!
ok      npm run lint (49.7 s)
ok      npm test (253.5 s)
FAILED  npm run test:checks (302.4 s)   1 failed | 247 passed: integrity.test.ts 'validates with no findings', "key entries[2].status is required"
ok      npm run check, then npm run build, then npm run test:slow (450.4 s)
```

The integrity failure is the hub's `network/events.yml` (open item 27), on main and not D47's. No diagram changed. Main's staged diff of `tools/oculus` equals the gate's (`cmp` of the two `git diff --cached` outputs: identical).

## The look

On a scratch oculus from the gate (port 8796), with a scratch HOME holding one scratch transcript whose workspace is the hub. With no session picked the Session view says so and offers Open the Sessions view (case 3). A session picked in the bar shows Details, Changes (touched files, then the repository with its branch, ahead count and changed files) and Agents ("This session dispatched no agents.") (case 2). Changes closed, then a reload: Changes stays closed, Details and Agents open (case 4). The palette offers Session and Sessions and no Changes or Agents view (case 14).

## Agents

- Builder a03cb689a744cc64c, claude-sonnet-5-5: 118,882 tokens, 144 tool uses, 59.6 min; round 1: 237,020 tokens, 71 tool uses, 28.3 min.
- Brief check a176332cf8ff0b352, claude-opus-5-5: 229,921 tokens, 87 tool uses, 10.2 min.
- Reviewer af6ed9204a4a55b6f, claude-opus-5-5: 295,499 tokens, 92 tool uses, 39.4 min.
- Reviewer over round 1 a03935f40685cc337, claude-opus-5-5: 222,848 tokens, 63 tool uses, 20.3 min.

The builder's first report did not pass its bar: the first review's findings went back in repair round 1. Fixes at landing: 3, listed above.
