# S3a landing

Position: roadmap entry oculus/migration (the cockpit-to-oculus migration); S3a, the options catalog, landed; 246 of the 288 package lines of `plan.md` (removed lines left out) are ticked. Next: /spec Q109 and /spec S3b from main, beside X3d's builder.

## Open items (verbatim)

- None.

## Not done

Nothing inside the brief. `bench: []`, so no A/B.

## The check of Steps 1

The runner's agent listing (ListAgents) showed only X3d's builder a479ec935c42cc52a running. S3a's builder a52442ea29934cb41 and its reviewers a26ea48400eec2512 and a193060d0c81340e9 were not listed.

## What landed

Main at b73101cf plus the step, from base 89bc8f36, 32 files changed (1857 insertions, 91 deletions).

- `config/catalogs/options.yml`: every option of the five tracked config files and every `local.yml` key, with its description, default, control and a family's `fields`.
- `src/lib/data/sources/config/options.ts`: the catalog's reader and the walk that says which key paths are options; `LOCAL_KEYS` exported from `local.ts`.
- `tests/checks/config/options-findings.ts`, `options-catalog.test.ts`, `options-walk.test.ts`: the check over the shipped tree and over fixtures.
- `focus_label_mode` read by the Focus board's lane cards and the week's ticker lines (Z131 (a)); `map_label_mode` takes `short` or `full` (Z132 (a)).
- `stale_days` folded into `refresh_stale_days`; `board.no_funding`, `indexes` and the `collections` rows' `title` and `icon` removed (Z130 (a), Z133 (a)).
- `HELP.md`, `DESIGN.md`, `config/text/views/system/config.yml` and the regenerated diagrams.

The worktree's cherry-pick onto main's head conflicted on the generated `docs/diagrams/layers.dot` and `layers.svg`. They were resolved by taking main's copy and running `npm run diagrams` on the merged source in the worktree. `npm run diagrams` on main afterwards changed nothing.

## Verification on main

```
$ npm run diagrams          exit 0
$ sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md
$ npm test
 Test Files  355 passed | 20 skipped (375)
      Tests  5485 passed | 573 skipped (6058)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  438 passed | 9 skipped (447)
$ npm run check
1790817237360 COMPLETED 2491 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

## Fixes at landing

The four findings of the run over repair round 1, each small and inside the brief:

1. Spec 1: `config/catalogs/options.yml`, the `scan` description now says a project's tier is the last segment of the rule's `dir` (`projects/active` gives `active`), true to `manifests.ts:210`.
2. Standards 1: the head comments of `src/lib/data/sources/config/options.ts` and `tests/checks/config/options-findings.ts` say the catalog is there for an editor of the settings and a write of one key to look an option up, naming neither as existing.
3. Behaviour 1: item 5 of the report's "User-visible changes" states the before and after of `map_label_mode`.
4. Spec 2: the tab name, checked in the look below.

## The look (TEST, localhost:8790, tab 812136282 of tab group 727993564)

With `focus_label_mode: full` set in `config/layout.yml` for the look and the file then restored (`cmp` against the staged copy):

- The Focus board's lane cards showed the full titles, such as "Cross-Dataset Selective Auditory Attention Decoding (ICASSP 2027 Grand Challenge)".
- Pressing that card opened a project tab named `EEG-sAAD`, the short handle.
- The week's ticker lines showed the full titles, such as "Which representation clusters? A chance-corrected benchmark of ECG representations for unsupervised arrhythmia structure on PTB-XL".

## Agents' usage

- Brief check a372d0c9df7b81e87: claude-opus-5-5, 183,760 tokens, 53 tool uses, 8.5 min.
- Builder a52442ea29934cb41 (claude-sonnet-5-5):

  | Run | Tokens | Tool uses | Time |
  |---|---|---|---|
  | First run, handed back at case 17 | 318,463 | 79 | 16.2 min |
  | After the round-0 ruling | 64,669 | 175 | 54.9 min |
  | Repair round 1 | 125,294 | 29 | 8.4 min |

- Reviewers (claude-opus-5-5):

  | Run | Reviewer | Tokens | Tool uses | Time |
  |---|---|---|---|---|
  | First review | a26ea48400eec2512 | 291,094 | 87 | 17.7 min |
  | Over round 1 | a193060d0c81340e9 | 239,655 | 70 | 23.7 min |

- The bar: the builder's first report did not pass it. A round-0 ruling on case 17, one repair round, four fixes at landing.
