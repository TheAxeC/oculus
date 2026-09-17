# Step Q30 builder report

Everything in the brief is done, with three things the orchestrator needs to rule on (all measured, details below):

1. **One finding no longer reads as before.** "config directory does not exist" now reads `findings.config.directory_missing`. With no config directory there is no catalog to take the sentence from, so the brief's test item 2 ("no expected sentence is changed") cannot hold for this one case. That expectation in `tests/config.test.ts` is the only expected sentence I changed.
2. **Decision 3 has a cost.** Outside `loadConfig`, a missing key throws. So if `findings.yml` does not parse and the hub raises any finding, `buildPortfolio` throws.
   - Measured with `node scratchpad/q30-builder/broken.ts <engine copy with broken findings.yml> <hub>`:
     - Real hub (0 findings): the config finding is `findings.file.does_not_parse Flow sequence ...` and there are 0 snapshot findings.
     - Synthetic broken hub: `buildPortfolio threw: text key not in the text catalog (config/text/): findings.manifests.scan_missing`.
   - Consequence, read from `server/watch/portfolio.ts` lines 296 to 350 but not run: the watcher logs "rebuild failed" and keeps the previous snapshot. On a fresh start, the rebuild throws before the watches (engine config folder included) are opened, so repairing the file would go unseen until a restart.
   - Two ways out: use `findingTextOrKey` in the readers too, or accept it as is. This is unfixed.
3. **I edited files outside decision 5's path list,** because item 3 cannot be built without them:
   - `src/lib/data/model.ts`: `ValidationRules.text` and `PortfolioConfig.text`.
   - `src/lib/data/validate-themes.ts`: validate's own split file, 2 sentences.
   - Six server files, one-line call changes each: `server/project-files.ts`, `server/deposit.ts` (2), `server/pty/context.ts`, `server/writes/subtasks.ts`, `server/writes/manifest.ts` (2), `server/docs.ts` (`answer` takes the catalog).
   - Tests outside `tests/data`: `tests/keys.test.ts`, `tests/boundaries.test.ts`, `tests/config-folder.test.ts`, `tests/config.test.ts`, `tests/watch/portfolio.test.ts`.
   - None of these paths is in Q32's or Q39's brief.

## DONE / NOT DONE (all commands from `tools/oculus` in the worktree)

| Item | State | Proof |
|---|---|---|
| 1. `config/text/findings.yml`, 76 keys under `text: findings:` | DONE | `python3 -c "import yaml; yaml.safe_load(open('config/text/findings.yml'))"` exit 0 |
| 2. Formatter `data/finding-text.ts`, sharing the placeholder fill with `t()` | DONE | `state/text.ts` `t()` now returns `fillPlaceholders(catalogEntry(key), args)`; `tests/boundaries.test.ts` passes with `data/finding-text` added to the state row |
| 3. Catalog threaded through; no literal sentence left | DONE | `grep -n "message: ['\`]" src/lib/data/validate.ts src/lib/data/sources/*.ts` prints nothing (exit 1) |
| 4. `loadConfig` words its findings after the merge; key-and-arguments fallback | DONE | `tests/config.test.ts` "names a sentence file that does not parse by its key and arguments, without throwing" |
| 5. Key coverage both ways | DONE | `tests/keys.test.ts` "words every data-layer finding from config/text/findings.yml, and that file from nothing else" |
| Tests 1 to 5 | DONE | see reverts below |
| `npx vitest run --reporter=dot` | DONE | 3979 passed, 1 failed: `tests/server/hpc/ssh.test.ts` "rejects a command that never returns at the budget", a timing test. Rerun alone twice: 5 passed |
| `npm run check` | DONE | `COMPLETED 1181 FILES 0 ERRORS 0 WARNINGS` |
| `npm run build` | DONE | `built in 6.03s`, `done` |
| `npm run format:check` | DONE | `All matched files use Prettier code style!` |
| `npm run lint` | DONE | exit 0 |
| ASCII gate (the perl command from the brief) | DONE | prints nothing, exit 0 |
| `npx playwright test tests/browser/audit.spec.ts` (after the build) | DONE | `3 passed (12.4s)` |
| HELP.md / DESIGN.md | Not edited, by decision 4 | Doc text below |

## How I compared the finding texts
- **Real hub, before and after:** `node scratchpad/q30-builder/dump.ts <hub>` dumps the findings of `loadConfig`, `iconFindings`, `behaviorFindings` and `buildPortfolio`. It ran over `/Users/axelfaes/workspace/research-hub` and over the worktree's own hub copy. Both runs are byte-identical, but both hold 0 findings, so this comparison proves nothing about the sentences.
- **Every sentence, before and after:** `node scratchpad/q30-builder/compare.ts` raises every finding of every reader, of `deckFindings`, `loadConfig`, `iconFindings`, `behaviorFindings`, `validate` and `validate-themes` over synthetic inputs. That is 118 findings, every shape variant included. I ran it before any edit and after the last one; `diff before.txt after.txt` shows one line, the missing config directory above.
- **Existing tests:** `git diff -U0 -- tests` removes no expected sentence except that one.

## Sentences moved per file (message sites converted)
- validate.ts: 28
- validate-themes.ts: 2
- career: 2
- collections: 6
- config: 10
- docs: 3
- feeds: 3
- manifests: 5
- present: 12
- registries: 6

Total 77. One line in config.ts still passes a thrown `flattenText` message through as-is (the brief excluded such lines): "text catalog: root is not a map".

Keys by group: file 5, collections 2, registries 2, feeds 1, docs 1, manifests 3, present 12, config 7, shape 4, validate 39.

## Reverts run (each file restored and checked with `cmp`)
- **Placeholder rule** (`String(arg)` in `fillPlaceholders`): `finding-text.test` 2 red. `tests/text.test.ts` stayed green: `t()`'s missing-argument case has no test there.
- **`findingTextOrKey` throwing:** 4 red (finding-text test, 3 config tests).
- **`loadConfig`'s does_not_parse using `findingText`:** "names a sentence file that does not parse..." red with `Error: text key not in the text catalog`.
- **`slide_no_id` removed from findings.yml:** 2 keys tests and the present test red.
- **An unused key added to findings.yml:** "has a reader for every catalog key" and the findings coverage test red.
- **`no_venue` reworded:** validate.test "reports a dangling id in every relation field" red.
- **`id_not_folder` reworded:** manifests.test red.
- **Watch engine without findings.yml:** 18 red in `tests/watch/portfolio.test.ts`.
- **`data/finding-text` removed from the boundaries state row:** boundaries red.

## Decisions the orchestrator may reverse
1. **Shared group:** sentences raised by several readers live once under `findings.file.*` (does_not_parse, not_a_map, list_not_a_list, list_missing, entry_not_a_map), not copied into each file's group. The deck order entry keeps its own `findings.present.order_not_a_map`.
2. **Fragments became catalog words:**
   - shape words: `findings.shape.is_null|is_list|is_map|is_other`;
   - relation nouns: one sentence key per relation (`no_venue` and the rest), carried as a closure in `REFERENCES`;
   - theme nouns: `venue_theme` and `dataset_theme`;
   - shape sentences: four `must_be_*` keys chosen by `shapeSentence`.
   - The `PERSON` constant is gone.
3. **How the catalog travels:** it rides on `PortfolioConfig.text`, filled by `portfolioConfigFrom` with `textCatalog(merged)`. `buildPortfolio`'s signature is unchanged.
4. **Reader signatures:** the catalog is a required trailing parameter. The defaults of `readRegistries(files)` and `readCareer(file)` are removed; every caller already passed a value.
5. **Icon and behaviour findings:** `iconFindings` and `behaviorFindings` build the catalog from the merged config they already take and use `findingTextOrKey`, since the brief lists them among the catalog's own findings. Their signatures are unchanged.
6. **Fallback wording:** the key and each argument joined by single spaces.
7. **Key gate:** the `WORDS` regex in `tests/keys.test.ts` now also matches `findingText(catalog,` and `findingTextOrKey(catalog,`. Every call site must name its variable `catalog`.
8. **Doc comment:** I moved validate()'s orphaned doc comment, which sat above `checkHostStatus`, onto `validate`.

## Limitations
- The broken-findings.yml portfolio throw (item 2 at the top).
- `server/audit.ts` `words` still holds its own copy of the placeholder replacement; that file is not in my paths.
- The test synthetic engines now carry the shipped findings.yml, so their `config.text` assertions include those keys (`{ ...SENTENCES, 'app.title': ... }`).

## Doc text
**HELP.md**, replace the paragraph at line 166:
> Every user-facing word lives under `config/text/`, one file per surface, and is read by its dotted key. Those files merge with the rest, so a word is changed there and nowhere else. The sentences of the Findings view are `config/text/findings.yml`, one per problem the readers and the checks report, with `{0}` and `{1}` standing for the values the finding names. While that file does not parse, the configuration's own findings are written as the sentence's key followed by those values, and the portfolio is not rebuilt while the hub holds a finding of its own.

**DESIGN.md**, layout tree after `validate-themes.ts`:
`        finding-text.ts        a finding's sentence by catalog key; the placeholder rule t() shares`

**DESIGN.md** line 123, replace "every user-facing string in `text.yml` read through `t("group.key")`" with:
> every user-facing string in the catalog fragments under `config/text/`, read through `t("group.key")` on the client and, for the data layer's findings, through `findingText` of `data/finding-text.ts` on the server

**DESIGN.md** Validate paragraph (line 133), append:
> A finding's sentence is a key of `config/text/findings.yml`, worded on the server before the snapshot carries it as a plain `message`, so a sentence is reworded in that file alone.

**DESIGN.md** decision line:
> - 2026-09-17, the data layer's finding sentences are catalog text. Every sentence a source reader or a validation rule reports is a key of `config/text/findings.yml` (`findings.<source>.*`, the sentences several readers share under `findings.file.*`, the shape words under `findings.shape.*`), worded by `findingText(catalog, key, ...args)` of `data/finding-text.ts`, whose `fillPlaceholders` is also what `t()` fills a string with. The readers take the catalog as a parameter and the rules as `ValidationRules.text`, both from `PortfolioConfig.text`; the wire shape of a finding is unchanged. `loadConfig`, `iconFindings` and `behaviorFindings` word their findings after the merge with `findingTextOrKey`, which writes a key the catalog lacks as the key and its arguments; everywhere else a missing key throws, and `tests/keys.test.ts` holds the file and the reads to each other. Package Q30.

## Files changed (`git diff --numstat`, added/removed)
**New:**
- `config/text/findings.yml`: 89 lines
- `src/lib/data/finding-text.ts`: 55 lines
- `tests/data/finding-text.test.ts`: 71 lines

**Data layer:**
- validate.ts: +262/-99 (827 lines now)
- sources/config.ts: +79/-24 (897 lines)
- sources/present.ts: +75/-17
- sources/collections.ts: +39/-12
- sources/registries.ts: +38/-12
- sources/manifests.ts: +32/-9
- sources/feeds.ts: +26/-12
- index.ts: +23/-13
- validate-themes.ts: +22/-8
- sources/docs.ts: +16/-6
- sources/career.ts: +14/-4
- model.ts: +7/-0

**Server and state:**
- server/docs.ts: +10/-6
- server/deposit.ts: +4/-2
- server/writes/manifest.ts: +2/-2
- server/project-files.ts: +1/-1
- server/pty/context.ts: +1/-1
- server/writes/subtasks.ts: +1/-1
- state/text.ts: +2/-5

**Tests:**
- config.test: +58/-15
- keys.test: +55/-3
- collections: +31/-19
- present: +28/-18
- manifests: +22/-17
- career: +22/-9
- validate: +15/-6
- docs: +12/-8
- registries: +11/-7
- watch/portfolio: +10/-8
- feeds: +8/-4
- boundaries: +6/-2
- config-folder: +3/-1
- real-hub.probe: +3/-3
