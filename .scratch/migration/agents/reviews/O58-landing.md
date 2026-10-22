# O58 landing

Position: plan migration (cockpit to oculus), step O58 (`config/catalogs/meta.yml` removed with its shape and every line naming it), landed 2026-10-22. Next: /land O62, /land O52, /spec O49 and O57; O50's repair round 1 is building; O54 waits for O50.

## Open items

None. Open item 239 was ruled (a) and the look is taken.

## Not done

Nothing.

## The look

On TEST, by ruling 239 (a): the Settings tab of the System page moved to TEST, its filter `opacity` cleared. The Catalogs group lists `catalogs/agents.yml`, `file-nesting.yml`, `glyphs.yml`, `icons.yml`, `latex.yml`, `unimath.yml` and `vocab.yml`, and no `meta.yml`; the text "The tool identity" is nowhere on the page. The filter typed back and the tab moved back to the System page, where it now sits after Account setup instead of before it. No write in the hub's `.oculus` or oculus's `config` (`git status --short`). Defects: none.

## The check of Steps 1

The O58 builder (ad4a5ade2495e90dd), its brief check (a27ff5fa5d0557791) and its reviewer (aac7aef6659cb68a7) had all finished before the cherry-pick; none was running.

## What landed

From base 21c13dd7, replayed on `migration-O58-land` and staged with `git cherry-pick -n main..migration-O58-land`: `config/catalogs/meta.yml` deleted; `metaFileShape` removed and `nestingFileShape` moved unchanged from `data/shapes/catalog-files/meta.ts` (deleted) into `data/shapes/catalog-files/file-nesting.ts`; the `catalogs/meta` row of `data/shapes/catalog-files.ts` and of `tests/checks/config/config-folder.test.ts` removed; `settings.desc_meta` removed from `config/text/views/system/workbench.yml`.

## Fixes at landing

- The replay's conflicts: `.prettierignore` keeps main's `.claude/settings.local.json` block with O58's rewritten paragraph; the diagrams `layer-views`, `layers` and `writes` took main's copies and were regenerated with `npm run diagrams`.
- The `file-nesting.ts` import of `catalog-files.ts` placed after `common.ts` (path order, the review's note).
- `tests/routes/docs/deck.test.ts`, `tests/routes/edit/undo/undo.test.ts`, `tests/routes/hubs/hub-undo.test.ts` and `tests/server/edit/writes.test.ts` tagged `@module-tag slow`: each timed out only under the full run and passes alone on main; the head comment of `undo.test.ts` no longer says every other case runs in npm test.

## What was found

The review (`agents/reviews/O58-refuter.md`, no repair round) found no code defect; S1 and the brief's count of changed tests are closed there. The builder's first report passed its bar.

## Verification on main

`npm run test:landing`, 989.6 s:

```
ok      ASCII gate (1.2 s)
ok      npm run format:check (46.5 s): All matched files use Prettier code style!
ok      npm run lint (120.1 s): > eslint . --cache --cache-location node_modules/.cache/eslint/
ok      npm run check, without its type sync (244.3 s): 1792678900551 COMPLETED 4256 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      npm run test:checks (494.8 s): Duration  459.18s (transform 274.31s, setup 0ms, import 731.82s, tests 847.69s, environment 9ms)
FAILED  npm test (857.0 s)
FAILED  npm run test:slow (922.2 s)
ok      npm run build (989.6 s): See https://rolldown.rs/reference/InputOptions.checks#plugintimings for more details.
```

`npm test`: 17 failed in `deck.test.ts`, `undo.test.ts`, `hub-undo.test.ts` and `server/edit/writes.test.ts`, each `Test timed out in 5000ms`. `npm run test:slow`: 6 failed in `hub-portfolio.test.ts`, `undo.test.ts`, `hub-writes.test.ts`, `clone-exclude.test.ts`, `git-ops.test.ts` and `servers.test.ts`. Each of the nine files passes alone on main (`npx vitest run <file>`): deck 4, undo 56, hub-undo 1, writes 52, hub-portfolio 9, hub-writes 30, clone-exclude 16, git-ops 17, servers 7 passed. O58 changes none of them. A/B: none, `bench: []`.

## Agents

- Builder ad4a5ade2495e90dd, claude-opus-5-5: 136413 tokens, 38 tool uses, 8 min 2 s.
- Brief check a27ff5fa5d0557791, claude-opus-5-5: 177807 tokens, 59 tool uses, 8 min 26 s.
- Reviewer aac7aef6659cb68a7, claude-opus-5-5: 148061 tokens, 41 tool uses, 14 min 18 s.
