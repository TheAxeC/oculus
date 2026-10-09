# D57 landing

Position: roadmap entry oculus/migration, the cockpit-to-oculus migration; plan step D57, an empty pane closes, step 326 of 342 in the step list (counted over `plan.md`'s "Packages, in execution order", removed lines left out). Next: D52 into the freed slot, /land D41, D47's repair round 1.

## Open items

- 25. D50: who may write an app in the hub's `.oculus/apps`. Ruling (9) moves the apps folder of `~/.oculus` into the hub, and the automode choice Z751(c) reads `<hub>/.oculus/apps` as the machine apps folder, so those apps keep every channel and may stay approved while they change. `docs/apps.md:11` gives the reason a root app gets fewer channels: whoever writes a repository, a `git pull` included, writes its apps. (a) Recommended: Z751(c) kept, and `docs/apps.md` says a machine app lives in the hub's own `.oculus/apps`, which only the hub's owner writes. (b) The hub's `.oculus/apps` read as the hub root's apps, with a root app's fewer channels. (c) Apps left in `~/.oculus`, against ruling (9). D50 waits for this ruling.
- 26. D50: four lines of the hub's registries name `tools/oculus/config/...` as the home of a key that moves into the hub's `.oculus/config/` (`registries/data.yml:28`, `registries/venues.yml:27`, `registries/domains.yml:1`, `registries/resources.yml:1`). (a) Recommended: D50 rewords these four lines by hand, the report listing each before and after. (b) The lines left naming the engine's file, false after D50; the lazy option. D50 waits for this ruling.

## Stopping the agents

The builder aa332d0db41803a43 and both reviewers had finished before the landing; the runner's agent listing names none of them.

## NOT DONE

- The drag of case 5 (a tab dragged out of an arrangement pane leaves it empty) was not driven on the page: a synthetic drag does not start HTML5 drag and drop there. The test of the step covers it; the page does not.

## What landed

An empty pane closes, from base 55d0ba416, 14 paths: a pane split off while the page is used carries a mark and closes with its last tab; a pane the page's arrangement defines stays empty when its last tab is closed or dragged out (a terminals pane after a Terminal tab, a documents pane after any other tab, a tool view included); the first pane of a page made by New page, or of the Page 1 that closing the last page or Reset all pages leaves, stays the same way; a locked pane stays; a page keeps at least one pane. `docs/window.md` and `DESIGN.md` follow.

## Fixes at landing

1. Round-1 Behaviour 1: `docs/window.md` widened to name the first pane of a page made by New page, or of the Page 1 left by closing the last page or Reset all pages. Before, the sentence named only the file's pane.
2. The inline comment in `src/lib/state/workbench/navigation/registry.ts` the review named, removed.
3. Three test files tagged `// @module-tag slow` under Z64: `tests/routes/files/source.test.ts`, `tests/server/machine/apps/manifest.test.ts`, `tests/server/machine/lsp/servers.test.ts`.

## Verification

The gate in `.agents/worktrees/gate` at 2a0e01c2c, `npm run diagrams && npm run test:landing`:

```
ok      ASCII gate (50.8 s)
ok      npm run format:check (52.5 s): All matched files use Prettier code style!
ok      npm run lint (182.7 s)
ok      npm run test:checks (477.5 s)
FAILED  npm test (522.6 s)        3 failed | 1141 passed | 78 skipped, in source.test.ts, servers.test.ts, manifest.test.ts
COMPLETED 3562 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
built in 41.23s
FAILED  test:slow                 3 failed | 75 passed, in git-ops.test.ts and start.test.ts
```

None of the five red files is changed by the step. Each run alone in the gate (Z64): source.test.ts 18 passed, manifest.test.ts 65 passed, servers.test.ts 6 passed, start.test.ts 5 passed, git-ops.test.ts 16 passed. Main's staged diff of `tools/oculus` equals the gate's (`diff` of the two `git diff --cached` outputs: identical). No diagram changed.

## The look

On a scratch oculus from the gate (port 8796): on a New page holding Status, a project opened lands in a new pane on the right; closing Status leaves the left pane as an empty documents pane ("Files and documents you open on this page appear here.") beside the project. After closing every page, Page 1 shows Status; a project opened lands beside it; closing Status leaves the same empty documents pane.

## Agents

- Builder aa332d0db41803a43, claude-sonnet-5-5: 294,570 tokens, 79 tool uses, 23.7 min; round 1: 300,733 tokens, 5 tool uses, 4.7 min.
- Brief check a7d14de49f99d0e6e, claude-opus-5-5: 223,069 tokens, 63 tool uses, 8.7 min.
- Reviewer a6cac719db08a46d2, claude-opus-5-5: 245,851 tokens, 62 tool uses, 23.9 min.
- Reviewer over round 1 a084253d21de24f0c, claude-opus-5-5: 165,543 tokens, 41 tool uses, 17.7 min.

The builder's first report did not pass its bar: the first review's findings went back in repair round 1. Fixes at landing: 3, listed above.
