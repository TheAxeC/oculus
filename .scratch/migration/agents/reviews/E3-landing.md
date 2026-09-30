# E3 landing

Position: roadmap entry oculus/migration (the cockpit-to-oculus migration); step E3, the apps section's text to Z103 (b), Z106 (a), Z107 (b2) and Z112 (a). Next: Q111's landing once its review is in, then Q107, X3d after its diagnosis and a new /spec, and /spec S3 into the free slot.

## Open items (verbatim)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- Z113 (raised 2026-09-30 21:40, step Q106 "Close pane on a pane of two or more tabs closes it after Confirm", its diagnosis, `agents/reviews/Q106-diagnosis.md`). The cause is found: `Modal.svelte:69-71` gives focus back to the control that had it from inside an effect's cleanup, the control's focus handler (PaneView's `entered`, `PaneView.svelte:139-142`) runs inside that teardown, and there Svelte 5.57.1 answers every `$state` read with the value from before the flush's first write, so `activateInstance` writes the tree from before the close back. The palette has the same defect (Cmd+K, then Deposit: the choice is undone). The fix gives the focus back one microtask later, and only while nothing else holds it (`giveBackQuietly` in `quiet-focus.ts`). A rule clash stands on the test: `agents/spec.md:56` says "A behaviour that needs a DOM (a press, a focus, an effect) is seen at the look on landing. The unit suite renders to a string", and the `diagnose` skill (Steps 16) gives a defect whose failure costs something a test where it occurs. That test exists only in a second vitest project, `client`, which loads Svelte's client runtime with no DOM library (`tests/ui/frame/client-runtime.ts`, a stubbed `document` and `HTMLElement`) for files named `*.client.test.ts`; its five cases fail 4 of 5 without the fix and pass 5 of 5 with it, and the other 370 test files are collected as before.
  - (a) Keep the `client` project and the test in Q106, and `spec.md:56` gains the sentence that an effect's timing (a teardown, a flush) is tested in a `*.client.test.ts` file, other DOM behaviour still at the look. For: the defect, which already has two shapes (the pane and the palette), cannot return unseen; the project reaches what no other test can. Against: a second test environment and a changed `vite.config.ts` to keep up; a stubbed DOM that a later case may need to widen.
  - (b) The fix with no test; the look on landing checks the pane close and the palette. For: the suite keeps one environment and `spec.md:56` stands. Against: nothing stops a later dialog or effect from bringing the same stale write back; the look sees it only when someone closes a pane on the way.
  - Recommendation: (a), since the defect sits in an effect's teardown, which only this project reaches, and it has already appeared in two places. (b) is the lazy option.
- Z115 (raised 2026-09-30 22:16, step Q107 "a Terminal tab never closes while its terminals run", its brief check, `agents/reviews/Q107-brief-check.md` section 2). What the tree shows: the page saves its whole workbench, every page, under one localStorage key, `oculus.layout.v1` (`src/lib/state/workbench/layout/saved/storage.ts:14`), on every layout change (`savePages` in `layout.svelte.ts`), and nothing listens for another browser tab's writes (`grep -rn "addEventListener('storage'" src` prints nothing). With two browser tabs of one server open (yours and the TEST tab, for example), a layout change in one saves a workbench without the Terminal tab the other added, and the reload Vite makes after a restart (`client.mjs:1031-1036`) restores that. That is a Terminal tab gone while tmux lists its terminals, as Z99 saw. Q107's builder reproduces this path in the unit suite beside the `sessions` list path and fixes whichever is red; the fix of this path changes how two browser tabs share one workbench, which is yours to rule. The builder builds everything else meanwhile.
  - (a) Every browser tab follows the saved workbench: the layout store listens for the `storage` event and takes the workbench another browser tab saved; the page each browser tab shows (`current`) is kept per browser tab. For: one workbench, as the single key already means; nothing one tab adds is lost to the other or to a reload. Against: a change in one browser tab rearranges the other's panes live.
  - (b) A save merges by page: a browser tab re-reads the stored workbench and writes back only the pages it changed. For: each tab keeps its own view until it reloads. Against: two tabs changing the same page still overwrite each other; each tab holds a diverging copy in memory until reload; more code.
  - (c) One saved workbench per browser tab (a tab id in the key). For: no tab touches another. Against: a new browser tab starts from the default workbench, not yours; the saved workbenches pile up.
  - (d) Nothing built for this path. Against: a Terminal tab (or any tab) added in one browser tab is lost whenever the other saves; the closing Z99 saw can recur. This is the lazy option.
  - Recommendation: (a), since the workbench is already one saved value and (a) makes every browser tab agree with it instead of overwriting it.

## The check of Steps 1

`ListAgents` at 22:18 listed three subagents, Q111's reviewer, X3d's diagnosis agent and Q107's builder; none of E3's builder (a3e7a56b3ea50f13c) or reviewers (ac1301d307cfb017c, abc7e9011cf0039bd) was listed, so none needed stopping.

## NOT DONE

Nothing.

## What landed

`tools/oculus/DESIGN.md`, the section "Apps added while oculus runs" (lines 236-327): the store fetched by `GET /api/app-store` on a `storeVersion` change, with the refetch and drop rules; `engine` and oculus's own `config/` folder closed to `open({ file })` by real path; `closed_paths`; the segment rule for every app; the order of checks; the measurements the build step owes. Rows 18, 20, 23, 32, 34, 36 and 42 of `agents/reviews/E2-report.md` carry the section's words.

## Fixes at landing (eight)

1. Z112 (a): the checks of `{ file }` after the key checks run on the server by `GET /api/app-open?app=<view id>&root=<root key>&path=<path>`, answering `{ result: "ok" | "closed" | "missing" }`, under the store route's rules (line 315). The round's Spec 4.
2. Round finding 1 (a): a 404 is dropped like any answer when a push after the fetch began holds a row of the app, and is the app's absence otherwise (line 311).
3. Round finding 1 (b): a dropped answer's refetch runs at once while a frame of the app is mounted, and otherwise when one mounts (line 311).
4. Round finding 2: `closed_paths` is compared without regard to letter case, so `SECRETS/x` is closed whether or not the root holds the folder, and the answer no longer tells an app whether a `secrets/` folder exists (line 315).
5. Round finding 3: the real path is defined once, at its first use under "Where an app lives" (line 242), for every real-path check of the section, the file route of line 323 included.
6. Round finding 4: the default `closed_paths: [secrets]` is written in `config/behavior.yml` (spec.md: the default lives in the config file); a missing or malformed value is a finding and closes every `file` target until fixed; `appsSettings` requires the limits as `mailSettings` does (lines 315, 327). This replaces the code fallback of my round ruling 8.
7. Round finding 5: the finding key `findings.apps.closed_paths_shape` (line 315).
8. Round findings 6 and 7: line 264 names the request a fetch; `E3-report.md` lines 103, 130, 151, 163, 199 and 203 describe the section as it now stands.

## Verification on main (from tools/oculus, after the fixes)

`npm run diagrams` exit 0, then `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`, exit 0:

```
$ npm test
 Test Files  350 passed | 19 skipped (369)
      Tests  5347 passed | 559 skipped (5906)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
$ npm run build
$ npm run format:check
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

The look: none, since the step changes only DESIGN.md's text. No A/B: the configuration names no `bench:`.

## Agents

- Builder a3e7a56b3ea50f13c, claude-sonnet-5-5: 182,505 tokens, 48 tool uses, 10.9 min; repair round 1 218,205 tokens, 13 tool uses, 7.9 min. Its first report did not pass its bar (the review's findings went to a repair round).
- Reviewer ac1301d307cfb017c, claude-opus-5-5: 205,911 tokens, 30 tool uses, 14.7 min. Round 1 reviewer abc7e9011cf0039bd, claude-opus-5-5: 186,912 tokens, 41 tool uses, 11.6 min.
- Brief check, claude-opus-5-5: 177,191 tokens, 44 tool uses, 8.9 min.
- No diagnosis record.
