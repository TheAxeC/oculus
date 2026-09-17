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


Everything in the brief is done, and all nine repair rulings are done. One more copy of the placeholder fill turned up outside the paths I was given:
- **Where:** `src/lib/server/pty/chat.ts:40`, `export function words(...)`, with its own `replaceAll` loop and a throw on a missing key. `server/pty/routes.ts:224` uses it too.
- **Not touched:** ruling 6 cleared me to edit only `server/audit.ts`.
- **Head comment:** so it stays true, the head comment of `data/finding-text.ts` no longer says the rule "lives here once". It now says `t()` uses the same `fillPlaceholders` and the audit scan calls `findingText`.
- **Needs a booking:** a ruling on whether `pty/chat.ts` should use `findingText` too.

(The first report, delivered earlier, stands; this is its repair section.)

## Repair round

### Rulings
| # | Ruling | State | Proof |
|---|---|---|---|
| 1 | `findingText` never throws; one formatter | DONE | See the notes below the table. |
| 2 | Key coverage by literals, whatever the variable is named | DONE | See the notes below the table. |
| 3 | `text catalog: {0} is not a map` worded through the file | DONE | See the notes below the table. |
| 4 | `iconFindings` and `behaviorFindings` on the one formatter | DONE | `grep -rn "findingTextOrKey" src tests` prints nothing. |
| 5 | The missing directory reads `findings.config.directory_missing` | DONE (kept) | The `tests/config.test.ts` expectation stays. It is said again in the Doc text. |
| 6 | The audit's `words` replaced by `findingText` | DONE | See the notes below the table. |
| 7 | `order_not_a_map` goes; use the shared key | DONE | `deckFindings` uses `findings.file.not_a_map`. The present group now has 11 keys; the file still has 76 keys. |
| 8 | A `t()` missing-argument test | DONE | `tests/text.test.ts` "leaves a placeholder with no argument as it is written". |
| 9 | Doc text corrected | DONE | See Doc text below. |

**Ruling 1, one formatter that never throws**
- `data/finding-text.ts` exports only `fillPlaceholders` and `findingText`. A key the catalog lacks comes out as the key followed by its arguments, joined by spaces.
- New watcher case in `tests/watch/portfolio.test.ts`, "publishes a portfolio worded by key over a broken sentence file, and rewords it once repaired":
  - On a fresh start with `findings.yml` set to `text: [`, the portfolio's findings are `['findings.manifests.id_not_folder "other" loewner', 'findings.registries.file_missing', 'findings.registries.file_missing']`. The fixture hub has no people or organisations registry, which gives the last two.
  - After the real file is written back, they are `['id "other" is not the folder name loewner', 'registry file does not exist', 'registry file does not exist']`.
- New doc route case in `tests/routes/docs.test.ts`, "answers 404 for a missing document while the sentence file does not parse": it gets status 404 with the body `{ error: 'findings.docs.missing' }`. It goes through `handleDocs` with `hub=nothing.md`, which reaches `renderHubDoc`.
- Probe, `node scratchpad/q30-builder/broken.ts broken-engine fixture/hub`: the config finding is `findings.file.does_not_parse Flow sequence ...`, and the snapshot builds with 27 findings where it threw before this round.

**Ruling 2, key coverage by literals**
- `findingLiterals(root)` in `tests/keys.test.ts` reads every `findings.` string literal under `src`, in any quote, with comments stripped.
- New case "holds every findings. literal of the source to config/text/findings.yml, both ways": every literal must be a key of the file, every key of the file must appear as a literal, and every key must start with `findings.`.
- The orphan check now counts those literals as readers.
- A synthetic case, "reads a findings. literal whatever holds the catalog, and none written in a comment", reads `findingText(rules.text, 'findings.validate.nope')` and `findingText(CATALOG, "findings.config.nope", 3)`, and skips the commented one.
- The hand-bound `const catalog = rules.text` lines in `validate-themes.ts` and `checkHostStatus` are gone.
- The regex that matches `findingText(catalog,` is gone from `tests/keys.test.ts`. The `WORDS` scan stays for `server/pty`'s own `words` (7 `server.*` keys depend on it). The audit's documented computed-prefix entry went with the audit's `words`.

**Ruling 3, the not-a-map finding**
- `flattenText` now throws `TextNotAMap`, an exported class carrying `path`. `mergeText` words it as `findingText(catalog, 'findings.config.text_not_a_map', path)`.
- New case in `tests/config.test.ts`, "words a catalog block that is not a map from the catalog, naming where it stops":
  - With the sentence file: `text catalog: app.title is not a map` and `text catalog: root is not a map`.
  - Without it: `findings.config.text_not_a_map root`.

**Ruling 6, the audit**
- `server/audit.ts` imports `findingText`, and its local `words` function is deleted.
- `tests/server/audit.test.ts` passes (it ran in the full suite).
- A side effect of ruling 1: an audit key the catalog lacks is now written as the key and its arguments, where it used to throw.

### Reverts run (file restored and checked with `cmp` after each)
- **`findingText` throws on a missing key again:** 7 red. They are the watcher case, the doc route case, the finding-text fallback case, and four config tests (missing directory, not-a-map, broken sentence file, paint limit).
- **`findingText(rules.text, 'findings.validate.nope');` inserted in `validate()`:** the keys test "holds every findings. literal ... both ways" goes red.
- **`mergeText` passing `error.message` through:** "words a catalog block that is not a map from the catalog" goes red.
- **`fillPlaceholders` returning `String(arg)`:** `tests/text.test.ts` "leaves a placeholder with no argument as it is written" goes red.
- **`present.ts` back on `findings.present.order_not_a_map`:** the keys literal test and the present test "reports an entry with no kind, an unknown kind, and a ref that is missing" go red.

### Verification, rerun (from `tools/oculus` in the worktree)
- **Node suite:** `npx vitest run --reporter=dot` gives `Test Files 237 passed (237)`, `Tests 3983 passed (3983)`.
- **Type check:** `npm run check` gives `COMPLETED 1181 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- **Build:** `npm run build` gives `built in 5.60s`, `done`.
- **Formatting:** `npm run format:check` gives `All matched files use Prettier code style!`.
- **Lint:** `npm run lint` exits 0.
- **ASCII gate:** the perl command prints nothing (exit 0).
- **YAML:** `python3 -c "import yaml; yaml.safe_load(open('config/text/findings.yml'))"` exits 0.
- **Browser spec:** after the build, `npx playwright test tests/browser/audit.spec.ts` gives `3 passed (10.0s)`.
- **Literal sentences:** `grep -n "message: ['\`]" src/lib/data/validate.ts src/lib/data/validate-themes.ts src/lib/data/sources/*.ts` prints nothing.
- **Sentence comparison:** `node scratchpad/q30-builder/compare.ts` ran again. `diff before.txt after2.txt` is still the one missing-directory line out of 118.
- **Real hub:** `node dump.ts <hub>` is byte-identical before and after (0 findings on both sides).

### Doc text (updated)
**HELP.md**, replacing the paragraph at line 166:
> Every user-facing word lives under `config/text/`, one file per surface, and is read by its dotted key. Those files merge with the rest, so a word is changed there and nowhere else. The sentences of the Findings view are `config/text/findings.yml`, one per problem the readers and the checks report, with `{0}` and `{1}` standing for the values the finding names. A sentence the file does not hold, which is every sentence while the file does not parse, is shown as its key followed by those values. A missing `config/` folder is always shown that way, as `findings.config.directory_missing`, since there is then no file to read the sentence from.

**DESIGN.md**, in the layout tree after `validate-themes.ts`:
`        finding-text.ts        a finding's sentence by catalog key; the placeholder rule t() shares`

**DESIGN.md** line 123: replace "every user-facing string in `text.yml` read through `t("group.key")`" with:
> every user-facing string in the catalog fragments under `config/text/`, read through `t("group.key")` on the client and, for the data layer's findings and the audit's, through `findingText` of `data/finding-text.ts` on the server

**DESIGN.md**, Validate paragraph (line 133), appended:
> A finding's sentence is a key of `config/text/findings.yml`, worded on the server before the snapshot carries it as a plain `message`, so a sentence is reworded in that file alone.

**DESIGN.md**, decision line, in the form of the dated lines beside it:
> - 2026-09-17, the data layer's finding sentences are catalog text. Every sentence a source reader, a validation rule or `loadConfig` reports is a key of `config/text/findings.yml` (`findings.<source>.*`, the sentences several readers share under `findings.file.*`, the shape words under `findings.shape.*`), worded on the server by `findingText(catalog, key, ...args)` of `data/finding-text.ts`, which the audit scan also words its findings with and whose `fillPlaceholders` is what `t()` fills a string with. The readers take the catalog as a parameter and the rules as `ValidationRules.text`, both from `PortfolioConfig.text`; the wire shape of a finding is unchanged. `findingText` never throws: a key the catalog lacks is written as the key followed by its arguments, so a sentence file that does not parse costs the wording and never the portfolio, a document read or a write, and a missing `config/` folder, which has no catalog at all, is always shown as `findings.config.directory_missing`. A key misspelt in the code is caught by `tests/keys.test.ts`, which holds every `findings.` literal under `src` to the file and every key of the file to a literal.

### Files changed this round
- `src/lib/data/finding-text.ts`: now 42 lines, with one formatter.
- `src/lib/data/sources/config.ts`: `TextNotAMap`, `mergeText`, one formatter; now 902 lines.
- `src/lib/data/sources/present.ts`: uses the shared not-a-map key.
- `src/lib/data/validate.ts` (826 lines) and `src/lib/data/validate-themes.ts`: the catalog binds removed.
- `src/lib/server/audit.ts`: +2/-11 against base.
- `config/text/findings.yml`: +`text_not_a_map`, -`order_not_a_map`; 89 lines, 76 keys.
- `tests/keys.test.ts`: +66/-9 against base.
- `tests/config.test.ts`: +82/-15 against base.
- `tests/watch/portfolio.test.ts`: +43/-8 against base.
- `tests/routes/docs.test.ts`: +25/-2.
- `tests/text.test.ts`: +6.
- `tests/data/finding-text.test.ts`: now 57 lines.

Every other file stands as in the first report (`git diff --numstat` against base covers them).

### Limitations
- **Formatter copy:** the `server/pty/chat.ts` copy described at the top.
- **File size:** `sources/config.ts` is at 902 lines, about 100 under the cap, as the reviewer noted.
- **Audit keys:** a missing audit key now shows as the key and its arguments instead of throwing.
- **What the new cases do not exercise:** a manifest write over a broken sentence file. `writeManifest` reaches `readManifests`, which now words by key and cannot throw there; that is from reading the code, not from a test.
