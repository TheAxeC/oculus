# O97 landing

Position: the migration plan (`.scratch/migration/plan.md`), step O97, the journal browser, landed on main with the research hub's commit of its Hub text (3f4d5d883). In flight: none. Next: /spec O99, then O101.

## Open items

None.

## Check of Steps 1

The runner's agent listing showed two peer sessions and no subagent; none of O97's builder (a0fed28c88758e2aa), brief check (a7747d4cd7b199a87) or reviewers (afd9d66fcf57bdd48, a6849cfbb9aa72906) was listed.

## NOT DONE

- Axel's server on 8790 shows O97 only after it is restarted: it runs the code it started with, and its Findings view lists O97's keys (`sparse`, `literature`, `venues`, `recover.sources`) as keys no file takes. The look ran on a scratch server instead.
- Not looked at: Copy BibTeX by DOI with no `doi` link row (the hub has one), and a 429 that gives a wait (Semantic Scholar's gave none).

## What landed

The whole range `f4535f495..migration-O97` (wip commit 615ed71e5: the builder's work, its round-0 cases ruling and repair round 1), 203 paths, 201 files changed, 12806 insertions and 4312 deletions, with the fixes at landing and the regenerated diagrams. In the gate worktree at main's head 4cefe47d2 the cherry-pick conflicted in 20 source files beside O98's work and in the generated diagrams; main's staged diff and the gate's compared equal with `cmp`. The research hub's `.oculus/config.yml` gained the Hub text (the `literature:`, `venues:` and `links:` rows, and the `recover.sources` rows beside `node_download` under one `recover:`), commit 3f4d5d883. `npm install` on main added `cheerio` 1.2.0 and its 16 dependencies (ruling 511 (2)); nothing else changed.

## Fixes at landing

- The primary-only finding: O98 and O97 each wrote one. O97's `primaryOnly` (`src/lib/data/shapes/hub-keys.ts`) is kept; O98's `PRIMARY_CONNECTION_KEYS` and `primaryKeyFindings` (`src/lib/data/index.ts`) are removed; one finding `hub_key_primary` names the hub through `other` (`merge.ts`, `hub-layer.ts`, `context.ts`).
- `config/defaults/behavior.yml` and `config/options/behavior.yml` each held `recover` twice after the merge, which oculus's YAML reader refuses (455 tests red in the first gate run): one `recover:` block with `node_download` and `sources`, one description naming both.
- `context.ts`: `timedFetcher` from `core/reader/timed.ts`, given `READ_TIMEOUT_MS`; `reloadLocal` compares `problems()` before and after (finding 1 of the review over round 1).
- `src/lib/data/index.ts`: the unused `findingText` import removed.
- Test rows that combine the two steps: `config-folder.test.ts` lists `recover` once; `config.test.ts:370` compares the kept `slurm.resource` list with `toEqual`; G13's `connection-keys.test.ts` row expects every primary-only key as a finding, `lint.writing_skip` among them, and a key each hub reads from its own file (`memories_dir`) as none.
- The Doc text: `docs/HELP.md`, `docs/templates.md` (O97's recover block merged into O98's), `docs/data-map.md` (lines 276 and 288 name the twenty primary-only keys), `docs/apps.md` (the datasets record's `recover` and `unread?`); `agents/guarded.md` (G3, G13, G45, G70, G111, G113, G114 and G134 edited, G136 to G138 added; G13's removed names and its doubled Code sentence corrected).
- Report corrections for finding 4, appended to `agents/reviews/O97-report.md` under "Corrected at landing".

## Verification

In the gate, `npm run diagrams && npm run docs:palette && npm run test:quick`:

```
test:quick: 201 changed file(s), from git since HEAD
test:quick: 351 test file(s)
ok      ASCII gate (1.6 s)
ok      prettier (3.0 s): All matched files use Prettier code style!
ok      svelte-kit sync (4.2 s)
ok      svelte-check (31.2 s): 1793232934364 COMPLETED 560 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (50.1 s)
ok      vitest checks (237.4 s)
FAILED  vitest (259.1 s)
      Tests  1 failed | 3306 passed | 890 skipped (4197)
ok      vitest slow (418.3 s)
```

The one failure is the load timeout of `tests/data/snapshot/references.test.ts` 'defines nothing for a funding entry that has no key'; `npx vitest run tests/data/snapshot/references.test.ts` alone: 40 passed. Every test title the guarded entries name is found under `tests/` (a grep over the titles printed no MISSING line). The verify list equals its page, the state file itself (`.agents/plan.yaml:4`). No A/B: the configuration block names no bench.

## The look

On a scratch server on port 8797 from the gate (the configured `look:` allows one when the running server cannot show the case), over a copy of the hub's `config.yml`, `bookmarks.yml`, `data/` and `tasks/` and a scratch `local.yml` holding `self` alone:

| View | Seen |
|---|---|
| Literature search | OpenAlex 25, Crossref 25, PubMed 4, Europe PMC 3, arXiv 6 hits, merged by DOI; Semantic Scholar "rate limited", no wait given; Web of Science and Scopus off, their tips naming the downloads row |
| Journal Browser | "from UT Journal Browser"; 2 of 2 journals for "neural engineering", each with ISSNs, publisher, fee, open-access status and Add |
| Venues card | Read from the browser off with "This venue has no ISSN to ask the browser by; add one to its issn field."; with an ISSN in the scratch copy it wrote `fee` and `open_access` and said "Read fee and open-access status from the browser by ISSN 0933-3657." |
| Data card | a set of a kind no row names: "No row of `recover.sources` in the `.oculus/config.yml` of the hub research-hub reads the source kind osf, so Recover does not run this set." |
| Recover | `aad-dtu`: 4 files listed through the `zenodo` row, sizes and md5 checksums |
| Settings | `literature.sources`: 8 entries; the nested `query` values show every field of their record, which O99 gives controls (ruling 526 (a)) |

No finding row named a venue, `issn`, `fee` or `open_access`. The scratch server is stopped and the tabs are closed.

## Found

- The builder's script that ran `git ls-files` (finding 5 of the review over round 1), closed under the standing ruling "Unapproved builder scripts"; nothing it produced is used.

## Agents

- Builder a0fed28c88758e2aa (claude-opus-5-5): round 0 hand-back 291761 tokens, 120 tool uses, 28 min 53 s; three pauses at Axel's word with no usage notice; final run 175220 tokens, 150 tool uses, 36 min 24 s; round 1 160003 tokens, 453 tool uses, 83 min 53 s.
- Brief check a7747d4cd7b199a87 (claude-opus-5-5): 258490 tokens, 89 tool uses, 12 min 30 s.
- Reviewer afd9d66fcf57bdd48 (claude-opus-5-5): 126654 tokens, 127 tool uses, 20 min 25 s.
- Reviewer over round 1 a6849cfbb9aa72906 (claude-opus-5-5): 298674 tokens, 99 tool uses, 19 min 46 s.

The builder's first report did not pass its bar: the review's findings went back in repair round 1. The five findings of the review over round 1 are closed (`agents/reviews/O97-refuter.md`, "Closed").

## Next

/spec O99 (every setting edited in Settings, with the controls of O97's reader rows), then /spec O101 (the Zenodo deposit).
