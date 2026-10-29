# O97 report: one configurable reader for the journal browser, the literature sources and the Recover sources

NOT done: two things wait for landing, as the round 1 brief says. Verify 1 (`npm run test:quick -- --base f4535f495`) exits 1 on `tests/checks/config/templates.test.ts` alone (two tests), because `docs/templates.md` lacks the new keys until the orchestrator writes this report's Doc text at landing; the brief allows that failure. Verify 4's fourth grep, as round 1 item 9 amends it, prints `docs/templates.md:438-443`, which the same Doc text removes. One decision is for Axel: round 1 item 1's choice between (A), keeping the row keys that item 2, rulings 511 (3) and 517 (1) and decisions 2 and 6 do not name, each of which a row of `rows.yml` uses, and (B), removing some of them; the table and the recommendation (A) are under "Repair round 1". Everything else in the brief, the 529 (a) ruling, the five case rulings and the eleven items of repair round 1 is built, and the case-run programs of this step are deleted.

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md` lines 181-191 of this worktree's copy. Item 529 there still reads "Status: open"; `agents/briefs/O97-cases.md` records that Axel ruled it (a) on 2026-10-28, and this step is built under that ruling.

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

- 529 (2026-10-28, O97's brief check, for Axel: kind 3, a check added to the rules). **Tests for the new configurable reader.** What it is about: O97 replaces the eight hand-written literature sources, the eleven Recover sources and adds the journal browser, all read by one new reader from rows in the hub's `config.yml`. The rules file lets a builder write a test only as the test of an entry of `agents/guarded.md`, and a new entry is yours to approve. Recover's readers already have one (G111, G114) and keep it; the literature hits, the requests each source sends, paging, encoding of values, links, the journal browser and the new Settings card have none, so without your word they are checked once by quoted runs and never again. The rule sentences of G111 and G114 also name PhysioNet, Kaggle and Synapse and their login requests, which become rows, so those sentences need rewording.
  - (a) Three new entries and two reworded sentences. G136: the configured reader sends exactly the requests a row describes (address, parameters, headers, body, paging, auth, pacing and the 429 state) and reads exactly the records and fields it names, every value encoded in its part; Code `src/lib/server/core/reader/`, Test `tests/server/core/reader/reader.test.ts`, a table with one row per literature source against its recorded answer, plus the request, paging, encoding, link and 429 rows (O97 cases 1 to 3, 5 to 7, 12 to 14, 24 to 27). G137: the journal browser asks only on a press and writes a hit, or a venue's fee and open access, through the write chain; Code the browser's files under `src/lib/views/sources/venues/` and `src/lib/state/sources/registries/`, Test `tests/state/sources/registries/browser.test.ts` (cases 15 to 17, 18's Read, 28, 32). G138: a Settings family marked `sparse: true` draws the fields its row sets with an Add field menu, and a pairs value may be a text or a record; Code `src/lib/state/system/config/editors/fields.ts`, Test `tests/state/system/config/sparse-card.test.ts` (cases 19 and 31). Case 11 (a kind with no row) joins G111's table. G111's and G114's rule sentences say the same rule with "a `recover.sources` row" in place of the named services and "the address the row's `access` names" in place of the three login requests. Pros: the reader every search and every Recover listing now goes through stays checked on every change; a row edited in a hub or a reader change that gives wrong hits fails a test. Cons: about three test files more to keep, each a table.
  - (b) No new entry: those cases are runs the report quotes once, and G111's and G114's sentences reworded only. Pros: no new test file. Cons: a later change to the reader can give wrong hits or send a wrong request with nothing failing.
  - Recommendation: (a), since the reader is the single path every literature search, Recover listing and the browser now share, and its failures (wrong hits, a request to the wrong address) cost wrong results without a visible error. The lazy option: (b).
  - Status: open. O97's builder is not held for it: until you rule, those cases are quoted runs and no test of them is written (the rules file's test rule); on (a), the tests are sent to the builder as a round-0 ruling before review.
```

### Item raised by this step, ruled

Ruled 526 (a), as the round 1 brief quotes it: O99 gives these rows their controls, so it is not built in this step and is no longer open. The text as raised:

**Values of a reader row that a Settings card keeps as file text.** A reader row's card in Settings draws every field the options catalog describes. A value nested deeper than the catalog's fields describe is held in the card's `kept` and written back unchanged, so a save never loses it, but the card offers no control for it. On the fixture rows these are (scratch run `npx vitest run --config .../scratchpad/caserun/kept/kept.config.mts`, which prints each kept value by row and path):

```
literature.sources[crossref].fields[3].value[0].each = {"path":"name","else":{"op":"join","parts":["given","family"]}}
literature.sources[pubmed].then[0].fields[4].value[0].each = {"path":"CollectiveName","else":{"op":"join","parts":["ForeName","LastName"]}}
literature.sources[pubmed].then[0].fields[6].value[0].else = {"path":"MedlineCitation.Article.Journal.JournalIssue.PubDate.MedlineDate","op":"match","pattern":"\\d{4}"}
literature.sources[europe_pmc].fields[8].value[0].else = {"path":"pubTypeList.pubType","map":{"review":["review"],"article":["journal article","research-article"]}}
literature.sources[arxiv].fields[8].value[0].value = true
recover.sources[stanford].fields[2].value[0].else = {"path":"hasMessageDigests[type=md5].digest","kind":"md5"}
recover.sources[synapse].then[1].then = [ ...the nested filehandles step... ]
recover.sources[synapse].then[1].body[1].value = ["file","folder"]
recover.sources[url].fields[0].value[0].else = {"path":"url","op":"last"}
recover.sources[url].fields[2].value[0].else = {"path":"md5","kind":"md5"}
venues.browser[utbrowser].paging[0].total = {"select":"#searchresult-functions .navbar-brand","op":"match","pattern":"/ (\\d+)"}
```

- (A) A catalog key by which a field's record refers to its own description (a field record's `else` and `each` are field records, a `then` step's `then` is a step), so the card draws a nested record at any depth. Pros: every value of every row is editable in Settings; the catalog stays the one description. Cons: the catalog reader, `config-fit.ts` and the card renderer each learn the reference; a recursion guard is needed.
- (B) The catalog writes the nesting out to a fixed depth (two levels of `else`, one of `then` inside `then`). Pros: no new catalog key. Cons: the catalog grows by copies, and a row one level deeper is again kept.
- (C) Leave them kept as file text. Pros: nothing to build. Cons: these values are edited only in the file (Edit in a file opens it at the key).
- Recommendation: (A), the one option that makes every row editable without copies. The lazy option: (C).

## The cases' first run on the unchanged tree

The first run was handed back before any change (the hand-back of 2026-10-28), and the five cases it found were ruled in `agents/briefs/O97-cases.md` (a) to (e). The run, as handed back:

**Case 1.** Command: `node hits.ts <worktree> 3` (its source is under "Repair round 1", item 11). The pages it printed are `tests/server/core/reader/expected/literature-pages.json`, G136's expected values.

| Source | Requests | Total | More | Cursor | Hits |
|---|---|---|---|---|---|
| openalex | 1 | 305 | true | 1 | 3 |
| semantic_scholar | 1 | 1847 | true | 3 | 3 |
| crossref | 1 | 334798 | true | 3 | 3 |
| pubmed | 2 | 101 | true | 3 | 3 |
| europe_pmc | 1 | 91 | true | `3\|AoIIQKiwcSg1NTU3OTY0Ng==` | 3 |
| arxiv | 1 | 20 | true | 3 | 3 |
| wos | 1 | 212 | true | 1 | 3 |
| scopus | 1 | 348 | true | 3 | 3 |

Two details of the unchanged tree's behaviour that the expected values carry:
- WoS hit 1's `pmid` `MEDLINE:25840362` is dropped by the base's `pubmedId`.
- Scopus hit 3 has no `eid`, so its id is `SCOPUS_ID:85068984721`.

**Case 2.** Command: `node addresses.ts <worktree> 25 case2` and `... doi`. The requests they printed are `tests/server/core/reader/expected/literature-requests.json`.
- Seven sources print an address and headers; arXiv prints `skipped` for both queries.
- PubMed sends esearch and then efetch with `id=11%2C12`.
- Europe PMC sends `cursorMark=AoE`.
- Headers sent: S2 `x-api-key`; WoS `X-ApiKey`; Scopus `X-ELS-APIKey`, `accept`, `X-ELS-Insttoken`; the others none.
- No source sends a User-Agent (ruling (c)).

**Case 3.** arXiv with a venue: `skipped`. With type article: `skipped`. With type preprint: one request, `search_query=all%3Atensor`. With DOI `10.48550/arXiv.2211.13793`: `id_list=2211.13793`.

**Case 7.**
- Gaps without keys: openalex 0, semantic_scholar 1000, crossref 1000, pubmed 340, europe_pmc 0, arxiv 3000, wos 0, scopus 0. With keys, pubmed's gap is 100.
- 429: G3's row `literature.test.ts:177` has `retry-after: '7'`.
- `ask.ts:73-82`: for OpenAlex, the wait is `x-ratelimit-reset` itself, only when `x-ratelimit-remaining` is `'0'`, and OpenAlex's `Retry-After` is ignored. For the other sources only `Retry-After` is read.

**Cases 4, 8, 10, 29 and the kept G3 rows.** The existing tables pass on the unchanged tree. Command: `npx vitest run tests/routes/docs/literature.test.ts tests/server/machine/runs/recover/{sources,access,safety,plan,runs}.test.ts tests/state/feeds/literature-merge.test.ts tests/server/machine/runs/lint/lint-route.test.ts tests/server/edit/literature.test.ts`. Output: `Test Files  9 passed (9)`, `Tests  162 passed (162)`.

**Case 9.** `node geo-pre.mts <worktree>` on `answers/geo/listing.body`: the pattern gives `[ 'GSE180759_annotation.txt.gz', 'GSE180759_expression_matrix.csv.gz' ]`; `pre a` gives those two and `/geo/series/GSE180nnn/GSE180759/`; `pre a:not([href^="/"]):not([href*="?"])` gives the two files (ruling (b)).

**Case 22.** Verify 4 on the unchanged tree: grep 1, 40 lines; grep 2, 524 lines (ruling (a)); grep 3, no hit (its only output the error for the missing `src/lib/server/core/reader`); grep 4, 57 lines.

**Cases 6 and 17.** The rule results that ruling (d) (Synapse depth 9 refuses the whole listing, `tokened.ts:135`) and ruling (e) (the status words are the `title` of `li.open_access`, `words.html` lines 640, 654, 668, 681) settle.

**Cases whose behaviour is absent on the unchanged tree: 5, 6's rows, 11 to 21, 23 to 28, 30 to 32.** `ls src/lib/server/core/reader`: no such directory. No `venues.browser`, `literature.sources`, `recover.sources` or `links` key in `config/` or `src/`; no `sparse` catalog key; no `issn`, `fee` or `open_access` venue field in `model-entities.ts`; `src/lib/views/sources/venues` holds only `Ribbon.svelte`, `VenueCard.svelte` and `Venues.svelte`; `tests/state/sources/registries` and `tests/state/system/config` do not exist.

### The recorded answers

- One `curl -sS '<address>'` per public source to the words query of case 1, printed to the terminal; PubMed's answer is two requests (esearch, then efetch). Semantic Scholar's one curl answered 429 (`{"message": "Too Many Requests. ...", "code": "429"}`), so its answer is written by hand from the zod shape of the base's `semantic-scholar.ts`, as WoS and Scopus are from `wos.ts` and `scopus.ts`. The UT browser: one request by words and one by ISSN (`q=1053-8119`, `wq_fld=q`).
- The characters outside ASCII were written as escapes by these commands, in the files of the first run: for `europepmc.json` and `openalex.json`, `python3 -c` with `out=''.join(c if ord(c)<128 else '\\u%04x'%ord(c) for c in t)` and `assert json.loads(out)==before`; for the two pages, the entities `&times;` (for the <multiplication sign>) and `&nbsp;` (for the <no-break space>), checked by `python3 -c` comparing the curl output with `.replace(<multiplication sign>,'&times;').replace(<no-break space>,'&nbsp;')` applied, which printed "equal 63304 63304" and "equal 59069 59069".
- Every recorded answer in the diff is a `.body` file written with Write: `tests/server/core/reader/answers/literature/{arxiv,crossref,europepmc,openalex,pubmed-efetch,pubmed-esearch,scopus,semantic-scholar,wos}.body` and `answers/browser/{issn,words}.body`. Checks, run now: `node -e` comparing `JSON.stringify(JSON.parse(...))` of the curl output with the file printed `openalex.body parses equal to its curl output: true` and `europepmc.body parses equal to its curl output: true`; `LC_ALL=C grep -c '[^ -~]'` prints 0 for every one of the eleven files; the two pages equal the checked pages of the first run with each tab written as four spaces and the spaces at line ends removed (`sed -e $'s/\t/    /g' -e 's/[ ]*$//' checked/words.html | cmp - <(sed 's/[ ]*$//' words.body)` prints nothing, as for `issn`), and read the same hits as before (`node pages2.ts`: `pages-body.txt`, `pages-html.txt` and `pages-before.txt` compare equal).

## DONE / NOT DONE

| Item or check | State | Command and output |
|---|---|---|
| Item 1, the reader `src/lib/server/core/reader/` | DONE | `ls src/lib/server/core/reader`: `agent.ts call.ts fields.ts formats.ts listing.ts paging.ts path.ts reader.ts request.ts timed.ts`; G136 test 72 passed |
| Item 2, the row's keys, findings at read | DONE | reader.test.ts case 20 and 27 rows pass; `rows/check.ts`, `rows/grammar.ts` |
| Item 3, encoding, `https:`, empty and repeated keys, primary-only keys | DONE | case 12, 20, 27 rows; case 30 run below |
| Item 4, literature sources | DONE | case 1 (8 rows), 2 (16 rows), 3, 5, 7, 24, 25 rows pass; `tests/routes/docs/literature.test.ts` 2 passed |
| Item 5, Recover sources | DONE | `npx vitest run <file>` each: `sources.test.ts` 36 passed, `access.test.ts` 17, `safety.test.ts` 45, `plan.test.ts` 15, `runs.test.ts` 16 |
| Item 6, links | DONE | case 14 and 26 rows pass |
| Item 7, the journal browser | DONE | `browser.test.ts` 10 passed; `entry-add.test.ts` 18 passed |
| Item 8, the keys out of `local.yml` | DONE | `local.test.ts` 31 passed; grep 4 below |
| Item 9, Settings | DONE | `sparse-card.test.ts` 15 passed; the look at landing |
| Item 10, the pages | DONE as Doc text | section "Doc text"; `docs/palette.md` regenerated by `npm run docs:palette` |
| Item 11, the hub's rows | DONE as Hub text | section "Hub text"; verify 7 below |
| Repair round 1, items 1 to 11 | DONE | each item's change, check and output under "Repair round 1"; item 1 holds a decision for Axel |
| Verify 1 | DONE as round 1 allows | exits 1 on `tests/checks/config/templates.test.ts` alone (2 tests), which the Doc text ends at landing; see "Verify 1" below |
| Verify 2, ASCII gate | DONE | over the 175 changed and added files (`git diff --name-only --diff-filter=d f4535f495` and `git ls-files --others --exclude-standard`, `.scratch/` left out): prints nothing |
| Verify 3, unused exports | DONE | `diff O97-base/unused-exports.txt` with `sh utils/unused-exports.sh`: only `22c22 < src/lib/server/accounts/connect/oauth.ts: READ_TIMEOUT_MS, callbackPath, CONNECT_MS --- > src/lib/server/accounts/connect/oauth.ts: callbackPath, CONNECT_MS` (the timed fetch moved to `core/reader/timed.ts`, where it is used); no new unused export |
| Verify 4, grep 1 | DONE | prints nothing |
| Verify 4, grep 2 | DONE under ruling (a) | the remaining lines quoted and judged below |
| Verify 4, grep 3 | DONE | prints nothing |
| Verify 4, grep 4, as round 1 item 9 amends it | DONE as round 1 allows | 6 lines, `docs/templates.md:438-443`, which the Doc text removes at landing |
| Verify 5, each new or changed test before and after | DONE | below |
| Verify 6, `wc -l` and folder-check | DONE | no source file over 880, no component over 520 (largest `src/lib/server/root/watch/git.ts` 878, `Cards.svelte` 488); `sh utils/folder-check.sh` exit 0 |
| Verify 7, Hub text against `rows.yml` | DONE | below |
| Verify 8, history words | DONE | below |
| Verify 9, prose rules | DONE | below |

### Verify 1

Command: `npm run diagrams && npm run docs:palette && npm run test:quick -- --base f4535f495`, after the last change of repair round 1 (output in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o97-r1-verify1d.txt`). The lines it prints:

```
test:quick: 201 changed file(s), from git since f4535f495
test:quick: 343 test file(s)
ok      ASCII gate (2.7 s)
ok      svelte-kit sync (2.7 s)
ok      prettier (2.7 s): All matched files use Prettier code style!
ok      eslint (16.4 s)
ok      svelte-check (26.4 s): 1793229093238 COMPLETED 553 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
FAILED  vitest checks (213.5 s)
 FAIL  |unit| tests/checks/config/templates.test.ts > docs/templates.md > shows every key of a hub settings file in the config.yml template, and no other
 FAIL  |unit| tests/checks/config/templates.test.ts > docs/templates.md > shows every local.yml key of the options folder in the local.yml template, and no other
 Test Files  1 failed | 16 passed (17)
      Tests  2 failed | 308 passed | 9 skipped (319)
ok      vitest (249.8 s): Duration  240.88s (transform 229.65s, setup 0ms, import 416.26s, tests 496.11s, environment 17.85s)
ok      vitest slow (376.9 s): Duration  368.22s (transform 13.38s, setup 0ms, import 158.90s, tests 1300.93s, environment 21ms)
test:quick: 380.1 s; failed: vitest checks
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
exit=1
```

The two failures are `templates.test.ts`'s: `missing: [links, literature.prefer, literature.sources, recover.sources, venues.browser]` in the config.yml template and `extra: [literature.ncbi_key, literature.openalex_key, literature.scopus_insttoken, literature.scopus_key, literature.semantic_scholar_key, literature.wos_key]` in the local.yml template, which the Doc text of `docs/templates.md` ends at landing. `boundaries.test.ts` and `history.test.ts` pass (round 1 item 8). The green tiers do not cover the tests that reach no changed file, the build, or the lint of unchanged files, as the run's last line says.

Timeouts under load. The machine ran the main checkout's `vite dev` at 104% CPU throughout (`ps -Ao pcpu,etime,command -r`), with load averages of 9.73 13.40 12.13 (`uptime`). In the two runs of this command before the one quoted, tests timed out at 5000 ms (`Error: Test timed out in 5000ms.`): in one run `tests/routes/hubs/make.test.ts` 'makes a folder with no .git a git repository by running git init there ... (G9)' and 'carries the marks of each folder ... (G32)', `tests/server/machine/apps/shell/shell-commands.test.ts` 'answers `missing` for the command of an app that is disabled and starts nothing', and `tests/server/machine/runs/lint/eslint-trust.test.ts` 'starts no child and imports nothing until the configuration is approved, then lints'; in the other run the git init test alone. The three files, run alone twice on each tree with `--reporter=verbose` (the base through `caserun/base-run/base.config.mts`, a scratch copy of the base), take: git init 85 and 81 ms on this tree, 66 and 65 ms on the base; folder marks 126 and 122 ms, 113 and 116 ms; the disabled app 23 and 25 ms, 24 and 26 ms; the lint approval 80 and 71 ms, 85 and 93 ms; `Tests 52 passed (52)` on all four runs. The step's changes to the files `make.test.ts` imports directly are `hub-names.ts` and `config.ts` (`git diff --stat f4535f495`), neither on the git init path. A timeout of one of these tests under a loaded full run can recur at landing.

### Verify 4, grep 2's remaining lines

Command: the brief's grep 2 with its four exclusions. Every line it prints, with its judgment under ruling (a):

- `src/lib/server/content/literature/hits.ts:4` (a comment naming the hit fields), `:18`, `:19`, `:23` (imports of `arxivId`, `arxivOfDoi`, `pubmedId`), `:93`, `:94`, `:96`, `:114`: reads an identifier.
- `src/lib/state/feeds/literature/lookup.ts:2`, `:11`, `:12`, `:14`, `:31`, `:40`, `:41`, `:42`, `:44`, `:45`, `:46`, `:59`, `:60`, `:61`, `:63`, `:64`, `:71`: reads an identifier or parses the address a reader types into Add (the patterns at `:41-46` recognise a typed PubMed or arXiv address; the address the lookup asks is the `links` row's).
- `src/lib/data/model/model-entities.ts:486`, `:488`, `:490`, `:491`: the hub's venue field.
- `src/lib/data/model/model-search.ts:165`, `:166`: reads an identifier (the hit field `arxiv`).
- `src/lib/views/shared/forms/entry/entry-add.ts:31`: a comment, reads an identifier.
- `src/lib/state/feeds/literature/bibtex.ts:6`: a comment, reads an identifier.
- `src/lib/state/feeds/literature/answers.ts:29`: reads an identifier.
- `src/lib/state/feeds/literature/merge.ts:5`, `:6`, `:7`, `:9`, `:18`, `:19`, `:34`, `:35`, `:38`, `:84`, `:98`, `:101`, `:102`, `:105`, `:114`, `:115`, `:175`, `:178`, `:181`, `:182`, `:198`, `:222`, `:223`, `:240`, `:250`: reads an identifier; `:181` and `:182` name the `links` row keys `arxiv` and `pubmed` the address is built from.
- `src/lib/views/feeds/literature/Literature.svelte:18`: a comment, reads an identifier.
- `config/text/views/sources/venues.yml:29` `scopus: Scopus {0}` and `:40` `wos: WoS {0}`: the hub's venue field (the brief's lines 23 and 34 are at 29 and 40 now, below the words this step adds).

### Verify 5, each new or changed test before and after

The unchanged-tree runs are in the base copy `scratchpad/o97base` (the base's `src` with the new tests copied in).

| Test | Unchanged tree | After |
|---|---|---|
| G136 `tests/server/core/reader/reader.test.ts` | `Error: Cannot find module '../../../../src/lib/server/core/reader/agent.ts'`, `Test Files 1 failed (1)`, `Tests no tests` | `Tests 72 passed (72)` |
| G137 `tests/state/sources/registries/browser.test.ts` | `Error: Cannot find module '../../../../src/lib/server/core/reader/agent.ts'`, `Tests no tests` | `Tests 10 passed (10)` |
| G138 `tests/state/system/config/sparse-card.test.ts` | `Failed Tests 15`, `Error: no row literature.sources`, `Error: no row recover.sources` | `Tests 15 passed (15)` |
| G134 `tests/views/shared/forms/entry-add.test.ts` | `TypeError: browserHitAsk is not a function` (2 failed), 16 passed | 18 passed |
| G13 case 21 `tests/data/sources/config/local/local.test.ts` | `AssertionError: expected 'local.yml: downloads[0].service must ...' to be null`, 1 failed, 29 skipped | 31 passed (round 1 item 6 adds one) |
| G3, G45, G111 to G114, lint and Literature save (kept tables) | `Test Files 9 passed (9)`, `Tests 162 passed (162)` | `literature.test.ts` 2, `literature-merge.test.ts` 1, `sources.test.ts` 36, `access.test.ts` 17, `safety.test.ts` 45, `plan.test.ts` 15, `runs.test.ts` 16, `lint-route.test.ts` 10, `edit/literature.test.ts` 24, all passed |

The related folders together (`npx vitest run tests/server/core/reader tests/state/sources/registries tests/state/system/config tests/state/system/settings tests/state/feeds tests/server/machine/runs/recover tests/views/shared/forms tests/data/sources/config tests/routes/docs tests/routes/hubs tests/server/edit tests/server/machine/runs/lint tests/server/machine/apps tests/checks/config tests/ui/html.dom.test.ts tests/server/accounts`): `Test Files 1 failed | 98 passed (99)`, `Tests 2 failed | 1502 passed | 9 skipped (1513)`; the two failures are `templates.test.ts`'s, which the Doc text ends.

### Cases after the build

- Cases 1 to 3, 5 to 7, 12 to 14, 15's literature half, 16's User-Agent of every reader request, 20, 24 to 27: rows of G136's test, `reader.test.ts`, 72 passed. Case 16's check is in case 1's table (every request of the eight searches carries `READER_AGENT`, which matches `^oculus/\d+\.\d+\.\d+`) and in figshare's listing.
- Cases 4 and 29's credential rows: G3's `literature.test.ts` and G113's `safety.test.ts`, passed.
- Cases 8, 9 and 11: G111's `sources.test.ts`, 36 passed, its rows 'a kind no row of its hub names refused: the kind named, before any request' and 'a second hub whose own recover.sources names the kind serves its own dataset' included.
- Case 10: G114's `access.test.ts`, 17 passed.
- Cases 15's browser half, 16, 17, 18's Read, 28 and 32's Read: G137's `browser.test.ts`, 10 passed.
- Cases 18's Add and 32's Add: G134's `entry-add.test.ts`, describe "a journal browser hit's Add", passed.
- Cases 19 and 31: G138's `sparse-card.test.ts`, 15 passed.
- Case 21: `local.test.ts` 'reads literature.wos_key as a key it does not know, and takes a downloads row of any service', passed.
- Case 22: verify 4 above.
- Cases 23 and 30, a run quoted: `node case23-30.ts <worktree>` prints

```
case 23 [{"kind":"library","call":"QA76 .F3"}] -> {"retrieval":[{"kind":"library","call":"QA76 .F3"}],"recover":false}
case 23 [{"kind":"request","contact":"data@example.org"}] -> {"retrieval":[{"kind":"request","contact":"data@example.org"}],"recover":false}
case 23 [{"kind":"derived","from":["set-a"],"script":"build.py"}] -> {"retrieval":[{"kind":"derived","from":["set-a"],"script":"build.py"}],"recover":false}
case 23 [{"kind":"zenodo","record":"12"}] -> {"retrieval":[{"kind":"zenodo","record":"12"}],"recover":false,"unread":["zenodo"]}
case 30 finding <hub>/.oculus/config.yml literature.sources literature.sources is read from the primary hub alone, and this hub is not the primary; it is not used (the words of round 0; round 1 words it "it is not applied", and the landing, merging O98's finding, names the hub)
case 30 finding <hub>/.oculus/config.yml links links is read from the primary hub alone, and this hub is not the primary; it is not used
case 30 rows of the second hub merge [] []
case 30 the same file as the primary ["mine"] 0
```

  A stated kind has no Recover control and no missing-row line; a `zenodo` source in a hub with no `zenodo` row has no Recover control and is named in `unread`, the line the card draws. A second hub's `literature.sources` and `links` are each a finding of its file and are not merged; the same file read as the primary's gives its row and no finding.

### Verify 7

The "Hub text" section below is the text of `tests/server/core/reader/rows.yml`. Command: the section's fenced block extracted with `awk` and compared with `diff` against the file, `awk '/^## Hub text/{h=1} h && /^```yaml$/{f=1; next} f && /^```$/{exit} f' O97-report.md | diff - tests/server/core/reader/rows.yml`, prints nothing. The two template blocks of the Doc text were checked by `templates-check.ts`, whose source is under round 1 item 11; that item deletes the program and its files, so the comparison is not re-run in this report's final pass (not verified after the deletion; landing's run of `templates.test.ts` with the Doc text in place is the check).

### Verify 8, history words

The added comment lines and test titles of the diff (`git diff -U0 f4535f495` over `src tests utils config`, the recorded answers and expected values left out, plus every untracked file), grepped for the rules file's words and the package, date and guarded-entry ids. Every hit, judged by reading:

- "before" in `model-search.ts`, `oauth.ts`, `routes.ts` (two), `merge.ts`, `rows/grammar.ts`, `rows/holes.ts` (three), `core/files/file-bytes.ts`, `core/files/file-poll.ts` (two), `call.ts`, `fields.ts` (two), `formats.ts` (two), `listing.ts` (three), `paging.ts`, `path.ts` (two), `reader.ts` (six), `sources.test.ts`, `reader.test.ts`: the order of steps inside one operation (before any request, before the read, the request before), no earlier state of the code.
- "now" in `open-files.ts:19`: the base's sentence rewrapped after a path changed; it says a link may point elsewhere at the time of a tick.
- "replace"/"replaces" in `merge.ts`, `reader.ts`, `file-bytes.ts`, `file-poll.ts`: what the code does to a file or a record.
- "was"/"were" in `recover-words.ts`, `VenueCard.svelte:119`, `check.ts`, `browser.ts`, `reader.ts`, `timed.ts`, `paging.ts`, `formats.ts`, `stand-in.ts`, `reader.test.ts`, `entry-add.test.ts`: the outcome of an operation in its own run (what was asked, what was written).
- "still" in `grammar.ts` and `listing.ts`: "the row is still read", "its size still to be read": present facts.
- G111, G114, G45, G134, G136, G137, G138 in test heads and titles: the guarded-entry ids, which the base's tests carry the same way (`tests/state/forms/choices.test.ts:117` '(G132)').

No hit names a package, a date or an earlier form of the code.

### Verify 9, prose

Each new or changed sentence of the comments, the words of `config/text/`, the options' help and the Doc text was read against the rules file's prose rules. Departures: none found. The ASCII gate prints nothing over the changed files; the Doc text and this report hold no character outside ASCII (`LC_ALL=C grep -c '[^ -~]'` on this file prints 0).

## The files, their line counts, and the splits

### Splits

- `src/lib/server/core` was at ten items. The two file helpers moved to `src/lib/server/core/files/` (`file-bytes.ts` 27, `file-poll.ts` 107), their importers changed (decision 1). The reader is `src/lib/server/core/reader/`. `core` holds ten items: `auth.ts changes.ts channels.ts files git json.ts paths.ts program.ts reader words.ts`.
- The timed fetch (`timedFetcher`, `ReadTimeout`, `READ_TIMEOUT_MS`), which the mail and calendar polls and the connectors used from `accounts/connect/oauth.ts`, moved to `src/lib/server/core/reader/timed.ts`, since the reader needs it and `core` cannot import `accounts`; `oauth.ts` lost 56 lines (`git diff --stat`: `4 insertions(+), 56 deletions(-)`).
- The typed readers of the four keys are a sub-folder `src/lib/data/sources/config/settings/rows/` (`check.ts` 328, `grammar.ts` 506, `holes.ts` 171, `links.ts` 58, `read.ts` 112); `settings/` holds ten items.
- The browser's server module is `src/lib/server/content/literature/browser.ts` (282), since `src/lib/server/content` is at ten items; the hit fields are `hits.ts` (135).
- The tests: `tests/server/core/reader/` (`reader.test.ts` 827, `stand-in.ts` 179, `rows.ts` 45, `rows.yml` 619, `answers/`, `expected/`), `tests/state/sources/registries/browser.test.ts` 256, `tests/state/system/config/sparse-card.test.ts` 323. `tests/server/core` holds six items, `tests/state/sources` eight, `tests/state/system` eight.

### Line counts (`wc -l`)

Source files changed or added, from `wc -l` over `git status --porcelain -uall`'s `src` files (none over 880, no component over 520): `src/lib/server/root/watch/git.ts` 878, `src/lib/server/root/context.ts` 855, `src/lib/state/system/config/editors/fields.ts` 852, `src/lib/data/model/index.ts` 848, `src/lib/data/helpers/hub-names.ts` 836, `src/lib/data/index.ts` 835, `src/lib/state/system/config/editors/draft.ts` 793, `src/lib/server/machine/apps/host/manager.ts` 774, `src/lib/data/sources/config/catalog/options.ts` 753, `src/lib/data/model/model-entities.ts` 732, `src/lib/data/snapshot/normalise.ts` 666, `src/lib/data/sources/config/merge/hub-layer.ts` 648, `src/lib/data/sources/config/local.ts` 647, `src/lib/server/core/reader/reader.ts` 615, `src/lib/server/edit/writes/config/config-fit.ts` 549, `src/lib/server/root/watch/apps.ts` 508, `src/lib/data/sources/config/settings/rows/grammar.ts` 506, `src/lib/views/system/workbench/editors/Cards.svelte` 488, `src/lib/server/machine/runs/recover/cluster.ts` 464, `src/lib/server/machine/apps/tools/workspace/workspace.ts` 444, `src/lib/views/shared/forms/entry/entry-add.ts` 437, `src/lib/server/machine/runs/recover/local.ts` 436, `src/lib/server/machine/runs/lint/routes.ts` 436, `src/lib/data/sources/config/catalogs.ts` 409, `src/lib/server/machine/runs/recover/routes.ts` 381, `src/lib/server/machine/runs/lint/readers.ts` 377, `src/lib/views/sources/venues/VenueCard.svelte` 367, `src/lib/server/files/source/source.ts` 344, `src/lib/server/accounts/calendar/poll.ts` 344, `src/lib/data/sources/config/catalog/value-rule.ts` 344, `src/lib/server/accounts/mail/poll.ts` 343, `src/lib/state/feeds/literature/merge.ts` 336, `src/lib/views/sources/venues/Browser.svelte` 332, `src/lib/views/feeds/literature/Literature.svelte` 329, `src/lib/server/core/reader/listing.ts` 329, `src/lib/data/sources/config/settings/rows/check.ts` 328, `src/lib/server/core/reader/fields.ts` 325, `src/lib/server/accounts/connect/oauth.ts` 302, `src/lib/server/edit/feeds/literature.ts` 301, `src/lib/server/machine/runs/lint/eslint.ts` 294, `src/lib/data/model/model-search.ts` 291, `src/lib/views/sources/data/recover/Recover.svelte` 289, `src/lib/server/machine/runs/recover/plan.ts` 287, `src/lib/state/system/machine/recover.svelte.ts` 283, `src/lib/server/content/literature/browser.ts` 282, `src/lib/views/feeds/literature/LiteratureCard.svelte` 280, `src/lib/data/sources/config/merge/merge.ts` 275, `src/lib/views/sources/data/DatasetCard.svelte` 261, `src/lib/server/files/fs/open-files.ts` 254, `src/lib/views/system/workbench/editors/Editor.svelte` 253, `src/lib/server/root/watch/autofetch.ts` 250, `src/lib/server/content/literature/handler.ts` 242, `src/lib/server/core/reader/request.ts` 241, `src/lib/state/feeds/literature/run.svelte.ts` 233, `src/lib/server/machine/apps/host/process.ts` 226, `src/lib/server/machine/runs/lint/writing/folder.ts` 224, `src/lib/state/sources/registries/browser.ts` 219, `src/lib/server/machine/runs/lint/writing/comments.ts` 200, `src/lib/server/core/reader/formats.ts` 197, `src/lib/server/core/reader/call.ts` 195, `src/lib/server/edit/feeds/feed-route.ts` 190, `src/lib/state/feeds/literature/bibtex.ts` 189, `src/lib/data/sources/config/settings/reader.ts` 187, `src/lib/state/feeds/literature/answers.ts` 184, `src/lib/server/core/reader/paging.ts` 175, `src/lib/data/snapshot/normalise-parts/retrieval.ts` 175, `src/lib/server/files/fs/lsp-edit.ts` 174, `src/lib/data/sources/config/settings/rows/holes.ts` 171, `src/lib/state/system/machine/recover-words.ts` 163, `src/lib/views/feeds/literature/Head.svelte` 162, `src/lib/server/edit/feeds/literature-key.ts` 153, `src/lib/data/model/machine/model-recover.ts` 150, `src/lib/data/shapes/catalog-files/options.ts` 147, `src/lib/server/machine/runs/recover/verify.ts` 139, `src/lib/server/content/literature/desk.ts` 139, `src/lib/server/core/reader/path.ts` 138, `src/lib/server/content/literature/request.ts` 137, `src/lib/server/content/literature/hits.ts` 135, `src/lib/server/accounts/connect/api.ts` 132, `src/lib/server/files/workspace/follow.ts` 130, `src/lib/state/system/config/editors/origins.ts` 128, `src/lib/state/feeds/literature/form.ts` 128, `src/lib/state/feeds/literature/lookup.ts` 127, `src/lib/state/sources/registries/datasets.ts` 117, `src/lib/data/sources/config/settings/rows/read.ts` 112, `src/lib/server/machine/runs/recover/files.ts` 111, `src/lib/views/feeds/literature/words.ts` 109, `src/lib/server/core/files/file-poll.ts` 107, `src/lib/server/machine/runs/recover/access.ts` 101, `src/lib/data/sources/config.ts` 95, `src/lib/server/root/process/context/machine-values.ts` 94, `src/lib/server/files/source/source-bytes.ts` 91, `src/lib/server/content/literature/bibtex.ts` 88, `src/lib/data/sources/config/catalog/option-findings.ts` 82, `src/routes/api/(machine)/recover/+server.ts` 73, `src/lib/data/sources/config/settings/problems.ts` 71, `src/lib/views/sources/data/recover/RecoverAccess.svelte` 67, `src/lib/server/core/reader/timed.ts` 59, `src/lib/data/shapes/hub-keys.ts` 59, `src/lib/data/sources/config/settings/rows/links.ts` 58, `src/lib/server/root/process/context/machine-defaults.ts` 54, `src/routes/api/(docs)/venue-browser/+server.ts` 40, `src/routes/api/(docs)/literature/+server.ts` 31, `src/routes/api/(machine)/lint/+server.ts` 28, `src/lib/server/core/files/file-bytes.ts` 27, `src/lib/state/feeds/literature/scholar.ts` 22, `src/lib/server/core/reader/agent.ts` 8.

Removed: `src/lib/server/content/literature/ask.ts`, `src/lib/server/content/literature/sources/` (ten files), `src/lib/server/machine/runs/recover/sources/` (ten files), `src/lib/server/core/file-bytes.ts` and `file-poll.ts` (moved).

Tests changed or added: `reader.test.ts` 827, `stand-in.ts` 179, `rows.ts` 45, `rows.yml` 619, `browser.test.ts` 256, `sparse-card.test.ts` 323, `recover/access.test.ts` 317, `recover/safety.test.ts` 771, `recover/sources.test.ts` 658, `recover/harness.ts` 282, `routes/docs/literature.test.ts` 259, `state/feeds/literature-merge.test.ts` 154, `views/shared/forms/entry-add.test.ts` 507, `data/sources/config/local/local.test.ts` 277, `routes/hubs/machine-answer.test.ts` 135, `fixtures/doubles.ts` 100, `server/edit/literature.test.ts` 204, `ui/html.dom.test.ts` 141, `checks/config/config-folder.test.ts` 838, `data/sources/config/catalog/options.test.ts` 271, `server/machine/apps/world/hosts-world.ts` 481, `server/machine/runs/lint/lint-fixture.ts` 278, `state/system/settings/fixture.ts` 107, `state/system/settings/collection-fields.test.ts` 161; `expected/literature-pages.json` 513, `expected/literature-requests.json` 148.

Configuration: `config/options/behavior.yml` 1742 (806 on the base; the four families and their option lists written as block sequences; configuration is outside the size check, `tests/checks/tree/size.test.ts:56` walks `src`, `tests` and `utils`), `config/text/findings.yml` 485, `config/defaults/behavior.yml` 314, `config/text/views/system/workbench.yml` 284, `config/options/appearance.yml` 217, `package.json` 133 (`cheerio` 1.2.0 added), `config/text/views/sources/data.yml` 129, `config/text/views/feeds/literature.yml` 108, `config/options/local.yml` 99, `config/text/views/sources/venues.yml` 85.

### Files outside the brief's paths, each with why

- `config/options/appearance.yml`: the catalog's head describes `holds: record` on a family, `sparse: true` and a text field that takes a record.
- `src/lib/data/index.ts`: computes `Venue.browsable` from the hub's `venues.browser` row with `query.issn`, so a card knows whether Read from the browser is on.
- `src/lib/data/snapshot/normalise.ts`: reads a venue's `issn`, `fee` and `open_access` (`openAccess`).
- `src/lib/data/shapes/hub-keys.ts`: `recover.sources` and `venues.browser` are read from each hub's own file (`OWN_HUB_KEYS`).
- `src/lib/data/shapes/catalog-files/options.ts`, `src/lib/data/sources/config/catalog/option-findings.ts`, `catalogs.ts`, `value-rule.ts`: the catalog key `sparse`, `holds: record` on a family, and the row findings' words.
- `src/lib/data/sources/config/merge/merge.ts`, `merge/hub-layer.ts`, `src/lib/server/root/context.ts`: the finding of a primary-only key (every key of the hub list `OWN_HUB_KEYS` does not hold, after round 1) set in another hub's `config.yml` (the brief's premise that HUB_LIST already gives it was false, below).
- `src/lib/server/edit/writes/config/config-fit.ts`: the server's write fits a family holding one record and a text-or-record field.
- `src/lib/state/system/config/editors/draft.ts`, `origins.ts`, `src/lib/views/system/workbench/editors/Cards.svelte`, `Editor.svelte`: the Add field menu and the sparse card are drawn by the family editor in `views/system/workbench/editors/`, not under `workbench/settings/` as the brief's path names.
- `src/lib/server/accounts/connect/api.ts`, `oauth.ts`, `src/lib/server/accounts/mail/poll.ts`, `calendar/poll.ts`: import the timed fetch from `core/reader/timed.ts`.
- `src/lib/server/edit/feeds/feed-route.ts`, `src/lib/server/machine/runs/lint/routes.ts`, `src/routes/api/(machine)/lint/+server.ts`: hand the `links` rows to the Literature save and to the ShellCheck reader (item 6).
- `src/routes/api/(docs)/venue-browser/+server.ts`: the journal browser's route.
- `src/lib/server/machine/runs/recover/verify.ts`: imports the checksum type from the model, since `files.ts` no longer defines it.
- `src/lib/views/sources/data/DatasetCard.svelte`: the card's Recover control and the missing-row line (item 5).
- `src/lib/server/files/fs/lsp-edit.ts`, `open-files.ts`, `src/lib/server/files/source/source-bytes.ts`, `source.ts`, `src/lib/server/files/workspace/follow.ts`, `src/lib/server/machine/apps/host/manager.ts`, `process.ts`, `src/lib/server/machine/apps/tools/workspace/workspace.ts`, `src/lib/server/machine/runs/lint/eslint.ts`, `lint/writing/comments.ts`, `lint/writing/folder.ts`, `src/lib/server/root/watch/apps.ts`, `autofetch.ts`, `git.ts`: importers of the two moved file helpers (inside decision 1's path).
- Tests: `tests/fixtures/doubles.ts`, `tests/server/machine/apps/world/hosts-world.ts`, `tests/server/machine/runs/lint/lint-fixture.ts` (the moved `Clock`, the `links` rows); `tests/server/edit/literature.test.ts`, `tests/ui/html.dom.test.ts` (`saveLiterature` takes the `links` rows); `tests/checks/config/config-folder.test.ts`, `tests/data/sources/config/catalog/options.test.ts` (the catalog's new keys); `tests/state/system/settings/fixture.ts` (`bareLists`, which `sparse-card.test.ts` and `collection-fields.test.ts` share) and `collection-fields.test.ts`.
- `src/lib/data/sources/config/machine.ts`, `src/lib/server/root/process/context/machine.ts`: the `local_user` finding of round item 6 (`userProblems`, `heldProblems`).
- `tests/checks/config/config.test.ts`: the test of round item 5's primary-only finding.
- `docs/diagrams/*.dot`, `*.svg` and `docs/palette.md`: regenerated by `npm run diagrams` and `npm run docs:palette`.

## Judgment calls the brief left open

- The reader's folder and the splits above; the timed fetch in `core/reader/timed.ts`.
- `literature.prefer`, a new primary-only key: the merge took a field from a source named in code, and no code names a source, so the order is the hub's (`fields`, `abstract`, `pdf`, each a list of source keys).
- A key of HUB_LIST is primary-only when `OWN_HUB_KEYS` does not hold it, read through `primaryOnly` in `src/lib/data/shapes/hub-keys.ts`; every such key set in a hub other than the primary is the finding `hub_key_primary` of that hub's file and is not applied.
- `venues.browser` is a family holding one record (`holds: record`), with a `key` field.
- A field of a row is a path text or a `{ path, op, ... }` record; a text field with `holds: record` and `fields` takes either, and the card draws each.
- A required `auth` entry with its `downloads` row is asked once with the credential, which keeps G114's asked column; an optional one is asked without it, then with it on 401 or 403.
- A Recover refusal keeps the row's `key` (the kind) as `source` and carries the row's `name` as `label`, which the line the user reads names.
- The per-kind field checks of the removed readers (GEO's `files` required, figshare's collection or article, a `url` file with both checksums) are the row's `holes` patterns and the reader's refusals.
- A generic list of a row must not be empty; `records` may be absent on a row with `then`; a repeated pick name takes its last item.
- `expect` on a row (ruling (b)): the CSS selector of an element an html answer holds, with `holds`, refused naming the row when the answer lacks it.
- The BibTeX lookup: the DOI through the `doi` link row with `accept: application/x-bibtex`, then each row's `query.id`, with `by` naming the hit field; a gap of 1000 ms between two lookups stays a constant of `bibtex.ts`; the answer is `{ bibtex, from, name }`, and the word `copied_from` names the row's `name`.
- Recover's largest answer read (`maxBytes`) stays a constant, 5 MB in the tests' setup and the route's own value in `files.ts`.
- In case 2, the parameters are compared sorted by name with each name's values in order, and every header but `user-agent` (ruling (c)); DOI `10.1000/x?y=1` reaches the lookup's path as `10.1000%2Fx%3Fy%3D1`.
- The browser route is `/api/venue-browser` in `(docs)`; `?list` asks oculus only.
- The journal browser view: id `venues-browser`, Registries group, order 0 after Venues by id, glyph `journals` (shared with LaTeX's), title "Journal Browser".
- Read from the browser is an action of the venue card's menu.
- A hit's Add goes through the collection's Add box with the hit's fields given (`browserHitAsk`, `entry-add.ts`).
- The link operation with no `id` reads the record's `path`.
- `statedKind` (`library`, `request`, `derived`) is in the model, read by the snapshot, the card and Recover's route.
- The recorded answers are `.body` files, as Recover's are (`tests/server/machine/runs/recover/recorded.ts`), so the formatter leaves the bytes a service sent as they are.
- `rows.yml` writes a flow map longer than 100 columns as a block map, and `config/options/behavior.yml` writes the long option lists as block sequences, so prettier changes neither.
- `orderOf` in `state/feeds/literature/merge.ts` reads `literature.prefer` and `links` for the page; the Literature view, the Add box and the merge test read the order through it.
- `bareLists` in `tests/state/system/settings/fixture.ts`, shared by two tests that built the same empty inputs.
- `kaggle-token` is no longer a service any row names; the `local.yml` template drops it (Doc text).

## The look at landing: what is visible and what should differ

| View | State to put it in | Before | After |
|---|---|---|---|
| Literature search | A workspace whose primary hub's `config.yml` has no `literature.sources` | Eight sources listed by fixed names, WoS and Scopus off without keys | The empty pane "No literature source is configured. The rows of literature.sources in the primary hub's .oculus/config.yml set them, in Settings."; no request |
| Literature search | The Hub text written into the hub | The same eight sources | The eight rows by `name` in their order; WoS and Scopus off with "Needs the downloads row wos in local.yml." and the row's help; Copy BibTeX's line "BibTeX copied, from <row name>" or "BibTeX copied, from the DOI link"; with no `doi` link row, see "Repair round 1", item 10 |
| Literature card | A hit with a DOI, with and without a `doi` link row | The address written in code | The `doi` row's address; with no such row, no link |
| Venues, a card | A venue with `fee` and `open_access` set | No such lines | "fee ..." and "open access ..." lines |
| Venues, a card's menu | A venue with `issn`, in a hub whose `venues.browser` has `query.issn` | No action | "Read from the browser"; after it the entry holds `fee` and `open_access` and History holds one record; with no ISSN the action is off with "This venue has no ISSN to ask the browser by; add one to its issn field." |
| Journal Browser (Registries, after Venues) | The hub holding the UT row | No view | Words box, Filter, Sort, Page size, Search; hits with title, ISSNs, publisher, fee, open access and Add; with no hub naming a browser, "No hub names a journal browser. ..." |
| Data, a card | A dataset whose source kind no row of its hub names | Recover control drawn | No Recover control; the line "No row of `recover.sources` in the `.oculus/config.yml` of the hub <hub> reads the source kind <kind>, so Recover does not run this set." |
| Recover | A credentialed PhysioNet set with no `physionet` row | Fetch off with the PhysioNet setup words | Fetch off with `- { service: physionet, user: <user name>, secret: <secret> }` and the row's `help` |
| Settings, Literature | `literature.sources` with the Hub text | No such key | One card per row with only the fields it sets and "Add field" offering the others; values kept as file text listed under the new open item |
| Settings, This machine | `local.yml` | Six Literature key rows | `literature.mailto` only; the `downloads` rows as they are |

Five more rows (the 429 line, Copy BibTeX by DOI with no `doi` link row, a primary-only key in a second hub, a `downloads` row with no user, a refused Recover listing's line) are in "Repair round 1", item 10.

## What in the brief is wrong or impossible

- **Verify 1 cannot pass with the brief's paths.** Three checks outside the paths failed; repair round 1 widened the paths to two of them and built their changes (item 8 there), which leaves:
  - `tests/checks/config/templates.test.ts`: two failures until the Doc text of `docs/templates.md` lands, `missing: [links, literature.prefer, literature.sources, recover.sources, venues.browser]` and `extra: [literature.ncbi_key, literature.openalex_key, literature.scopus_insttoken, literature.scopus_key, literature.semantic_scholar_key, literature.wos_key]`. The Doc text below was checked by a scratch run of the test's own helpers on the base page with it spliced in (`node templates-check.ts`): `config.yml {"missing":[],"extra":[]}`, `local.yml {"missing":[],"extra":[]}`, `UT example equals rows.yml venues.browser: true`.
- **Verify 4 grep 4 against case 21.** Case 21 requires a test holding `literature.wos_key`, and grep 4 must print nothing over `tests`; the round 1 brief amends grep 4 to leave out `tests/data/sources/config/local/local.test.ts` (item 9 there). Grep 4 also reaches `docs/templates.md:438-443`, which item 10 forbids this step to edit.
- **The primary-only finding.** Item 3 says `literature.sources` and `links` in another hub are a finding "as every primary-only key of HUB_LIST is". On the base no HUB_LIST key gives such a finding (only `local.yml` has `local_other_hub`); the step gives it to every primary-only key (round 1, item 5).
- **The brief's paths name `src/lib/views/system/workbench/settings/`** for the Add field menu; the family cards are drawn in `src/lib/views/system/workbench/editors/` (`Cards.svelte`, `Editor.svelte`).
- **Grep 2's exclusion `config/text/views/sources/venues.yml:(23|34)`** names lines that are at 29 and 40 after the words this step adds.
- **Cases 2, 6, 9, 17 and 22** as handed back and ruled in `O97-cases.md` (a) to (e).

## Doc text

Each line as `grep -n` prints it on the base (the worktree's `docs/` and `.scratch/migration/agents/guarded.md` are unchanged), then its replacement or the line a new one follows.

### docs/HELP.md

```
143:| f1, m1-m5, p1-p4, e1-e4, s1-s8, c1-c7, l1-l3, r1-r6, b1-b3, t1, y1-y9 | open a view of a group (f Focus, m Sessions, p Projects, e Incoming, s Explorer, c Academic Life, l Pillars, r Registries, b Literature, t Present, y System) |
```
becomes
```
| f1, m1-m5, p1-p4, e1-e4, s1-s8, c1-c7, l1-l3, r1-r7, b1-b3, t1, y1-y9 | open a view of a group (f Focus, m Sessions, p Projects, e Incoming, s Explorer, c Academic Life, l Pillars, r Registries, b Literature, t Present, y System) |
```

After `217:| \`venues\` | Venues | The venue catalogue. |` a new line:
```
| `venues-browser` | Journal Browser | A hub's journal browser, searched by words, its journals added to the venues. |
```

```
239:| `literature-search` | Literature search | One query to OpenAlex, Semantic Scholar, Crossref, PubMed, Europe PMC and arXiv, and Web of Science and Scopus with keys. |
```
becomes
```
| `literature-search` | Literature search | One query to the sources of `literature.sources` in the primary hub's `.oculus/config.yml`; a source whose row needs a `downloads` row is off without it. |
```

Line 314, in the sentence "A set whose sources are all downloads has a Recover control;", that clause becomes "A set whose sources are all of kinds its hub's `recover.sources` rows name has a Recover control, and a source of a kind no row names says so on the card;", the rest of the line unchanged.

```
318:  - Fetch is disabled until access is set up for a credentialed PhysioNet set, a Kaggle set or a Synapse set: add the row the view shows under `downloads:` in the primary hub's `.oculus/local.yml`.
```
becomes
```
  - Fetch is disabled until access is set up for a source whose row's `auth` needs a `downloads` row: add the row the view shows, as its help says, under `downloads:` in the primary hub's `.oculus/local.yml`.
```

Line 325 (Venues), at its end after "With several hubs the rows are the union of every hub's, each key once with the first hub's row." add: "A card draws the venue's fee and open-access status from its `fee` and `open_access` fields. Read from the browser, in a card's menu, asks the hub's journal browser by the venue's first ISSN, then by the next while no journal answers, and writes the fee and the open-access status of the one journal it finds into the entry, undoable in History; no journal, or several, writes nothing and says so. With no ISSN, or a hub that names no browser asking by ISSN, it is off with the reason."

After line 325 a new line:
```
- **Journal Browser.** Searches the journal browser of a hub, the row `venues.browser` of its `.oculus/config.yml`, by words, with the filter, the sort and the page size its row offers. Search and More each send one request, and nothing else asks the browser. Each journal shows its title, ISSNs, publisher, fee and open-access status, and Add writes it into the hub's venues file as a new entry with its name, ISSNs, fee and open-access status, through the venues Add. With no hub naming a browser the view says so and where it is set.
```

```
327:- **Literature search.** Sends the query only to the sources that are on. Results with one DOI, PubMed id or arXiv id merge. Copy BibTeX writes no file. Add to Lit Watch and Save to Literature are the writes.
```
becomes
```
- **Literature search.** Sends the query only to the sources that are on, the rows of `literature.sources` in the primary hub's `.oculus/config.yml`, in their order; with no row it says that no source is configured and sends nothing. Results with one DOI, PubMed id or arXiv id merge, each field taken from the source `literature.prefer` puts first. A paper's address and its PDF come from the `links` rows; a link whose row is missing is not drawn. Copy BibTeX writes no file. Add to Lit Watch and Save to Literature are the writes.
```

Line 342 (Settings), after "oculus's own files are never written." add: "A reader row of `literature.sources`, `recover.sources` and `venues.browser` is a card that shows the fields its row sets, with an Add field menu offering the others."

Line 532, "the `editor`, `files`, `literature`, `apps`," becomes "the `editor`, `files`, `literature`, `recover`, `venues`, `links`, `apps`,", the rest of the line unchanged.

Line 553, "the calendar and mail accounts, the Literature keys, the download accounts," becomes "the calendar and mail accounts, the contact address the Literature search sends (`literature.mailto`), the download accounts (the secrets of the services the reader rows' `auth` names),", the rest of the line unchanged.

### docs/templates.md

After `127:#   resource: ""` (the `slurm:` block of the `config.yml` template), these lines, starting with a blank line:

```

# The literature sources of the Literature search, read from the primary hub, in the order the
# search lists them. A row is a reader row: `key`, `name`, `format` (json, xml, html, text or
# none), `address` with `{name}` holes, `query` (each term of the search form to the parameter it
# is sent as), `paging`, `pace`, `wait`, `auth` (the `downloads` row of local.yml it reads, with
# `required: true` for a source that is off without it), `records` and `fields`. oculus ships no
# row; with none the search says that no source is configured. `prefer` names, by source key,
# whose value a merged paper takes for its fields, its abstract and its PDF.
# literature:
#   sources: []
#   prefer: {}

# The Recover sources of this hub's datasets: one reader row per source kind, the `kind` of a
# dataset's source being the row's `key` and the source's other fields filling the row's holes.
# A row may also hold `access`, `archive`, `pick`, `clash`, `expect` and `pace.field`. A source of a
# kind no row names is not fetched, and the Data view says so.
# recover:
#   sources: []

# The journal browser of this hub's venues: one reader row, asked only when Search, More or Read
# from the browser is pressed. `query.issn` is what Read from the browser asks by; `filters`,
# `sorts` and `paging.sizes` are the choices the Journal Browser view offers.
# venues:
#   browser: {}
#   example:
#   browser:
#       key: utbrowser
#       name: UT Journal Browser
#       format: html
#       address: https://library.wur.nl/WebQuery/utbrowser
#       query:
#           words: { param: title }
#           issn: { param: q, params: { wq_fld: q } }
#       filters:
#           - label: Open access status
#             params: { wq_flt: journal/oa-status, wq_val: '{value}' }
#           - { label: JCR quartile, params: { wq_flt: jcr/category/kwartiel, wq_val: '{value}' } }
#       sorts:
#           - { label: CiteScore, params: { wq_srt_desc: citescore } }
#           - { label: SNIP, params: { wq_srt_desc: snip } }
#           - { label: SJR, params: { wq_srt_desc: sjr } }
#           - { label: 'Title, A to Z', params: { wq_srt_asc: journal/title } }
#           - { label: 'Title, Z to A', params: { wq_srt_desc: journal/title } }
#       paging:
#           kind: offset
#           param: wq_ofs
#           size: wq_max
#           sizes: [20, 50, 100]
#           total:
#               select: '#searchresult-functions .navbar-brand'
#               op: match
#               pattern: '/ (\d+)'
#       records: { select: 'table#records tbody tr' }
#       fields:
#           title: 'a[title="more info"]'
#           issn: { select: div.issns, op: match, pattern: '\d{4}-\d{3}[\dXx]', all: true }
#           publisher: div.author
#           fee: a.apc_discount
#           open_access: { select: li.open_access, attr: title }

# The addresses of the page links, read from the primary hub: a row is a `key` and an `address`
# holding `{id}`, and other holes filled from the hit's fields. A link whose row is missing is not
# drawn.
# links: []
#   example:
#   links:
#     - { key: doi, address: 'https://doi.org/{id|path}' }
#     - { key: shellcheck, address: 'https://www.shellcheck.net/wiki/{id}' }
```

The `local.yml` template, base lines 436-451:

```
436:# Keys for the Literature search. A source without its key is off, or limited.
437:# literature:
438:#   wos_key: ""
439:#   scopus_key: ""
440:#   scopus_insttoken: ""
441:#   openalex_key: ""
442:#   semantic_scholar_key: ""
443:#   ncbi_key: ""
444:#   mailto: you@example.org
445:
446:# Download accounts for the Data view's Recover. One row per service.
447:# downloads:
448:#   - { service: physionet, user: <user name>, secret: <password> }
449:#   - { service: kaggle, user: <user name>, secret: <key> }
450:#   - { service: kaggle-token, secret: <token> }
451:#   - { service: synapse, secret: <token> }
```
become
```
# The address the Literature search sends to a source whose row names a `contact` parameter.
# literature:
#   mailto: you@example.org

# Accounts for the services the reader rows name, one row per service: a row's `auth` names the
# `service` it reads, for the Literature search's keys and the Data view's Recover. A row no reader
# row names is read and unused.
# downloads:
#   - { service: physionet, user: <user name>, secret: <password> }
#   - { service: kaggle, user: <user name>, secret: <key> }
#   - { service: synapse, secret: <token> }
#   - { service: wos, secret: <key> }
```

### docs/data-map.md

Line 57, after "A venue is shown by its `short`, else its `name`, and linked to by its `id`, its primary key." add: "A venue's `issn`, a list, is what Read from the browser asks the hub's journal browser by, and `fee` and `open_access` are the fields it writes."

```
68:| Literature search, Lit Watch, Literature | Literature | the search over the literature sources, the `radar` feed, and the `literature` file |
```
becomes
```
| Literature search, Lit Watch, Literature | Literature | the search over the sources of `literature.sources`, the `radar` feed, and the `literature` file |
```

Line 72, `| Venues, Data, Statements, People, Organisations, Resources | Registries | their files |` becomes `| Venues, Journal Browser, Data, Statements, People, Organisations, Resources | Registries | their files, and the journal browser of `venues.browser` |`.

Line 81, "`.oculus/config.yml` may set these 52 keys and no others" becomes "`.oculus/config.yml` may set these 57 keys and no others", the rest of the line unchanged (`node -e "import('./src/lib/data/helpers/hub-names.ts').then(m=>console.log(m.hubKeys().length))"` prints 57).

After `135:app_settings:             # the values of the settings apps declare`:
```
literature.sources:       # the reader rows of the Literature search's sources (the primary hub's)
literature.prefer:        # the source a merged paper takes its fields, abstract and PDF from first (the primary hub's)
recover.sources:          # the reader rows Recover lists a dataset's files with, one per source kind
venues.browser:           # the reader row of the hub's journal browser
links:                    # the addresses page links are built from (the primary hub's)
```

```
275:- This machine's values: only the primary's `.oculus/local.yml` is read (the port, who you are (`self`), `hpc_host`, the programs, the calendar, mail and download accounts, the Literature keys), its account rows joined over every hub's file.
```
becomes
```
- This machine's values: only the primary's `.oculus/local.yml` is read (the port, who you are (`self`), `hpc_host`, the programs, the calendar, mail and download accounts, the Literature search's contact address), its account rows joined over every hub's file.
```

```
278:- Twelve keys of a hub's `config.yml` are read from the primary's alone: `portfolio_deck`, `career_file`, `bookmarks`, `schedules`, `apps_dir`, `app_settings`, `wallpaper.image`, `docs`, `counts`, `slurm.resource`, `lint.writing_skip` and `lint.writing_glyphs`.
279:- Settings writes those twelve keys to the primary's `config.yml`; any other key of a hub's `config.yml` it writes to the hub the row names, the primary first and chosen.
```
become
```
- Fifteen keys of a hub's `config.yml` are read from the primary's alone: `portfolio_deck`, `career_file`, `bookmarks`, `schedules`, `apps_dir`, `app_settings`, `wallpaper.image`, `docs`, `counts`, `slurm.resource`, `lint.writing_skip`, `lint.writing_glyphs`, `literature.sources`, `literature.prefer` and `links`. Another hub that sets `literature.sources`, `literature.prefer` or `links` has a finding of its file, and the key is not applied.
- Settings writes those fifteen keys to the primary's `config.yml`; any other key of a hub's `config.yml` it writes to the hub the row names, the primary first and chosen.
```

### docs/apps.md

```
403:| `venues` | `id`, `name`, `themes`, `short?`, `tier?`, `category?`, `jif?`, `quartile?`, `wos?`, `scopus?`, `free?`, `format?`, `wants?`, `link?`, `deadline?`, `deadlineMonth?`, `heldMonth?`, `timing?`, `call?`, `email?`, `wosMark?`, `scopusMark?` |
```
becomes
```
| `venues` | `id`, `name`, `themes`, `short?`, `tier?`, `category?`, `jif?`, `quartile?`, `wos?`, `scopus?`, `free?`, `format?`, `wants?`, `link?`, `deadline?`, `deadlineMonth?`, `heldMonth?`, `timing?`, `call?`, `email?`, `wosMark?`, `scopusMark?`, `issn?`, `fee?`, `openAccess?`, `browsable?` |
```

### agents/guarded.md

G3 (lines 13-15). The rule sentence stays. In line 14, "the literature route and its source adapters." becomes "the literature route: `src/lib/server/content/literature/` (`handler.ts`, `request.ts`, `hits.ts`) and the reader's `src/lib/server/core/reader/request.ts` (`applyAuth`), which puts a `downloads` secret only in the header or parameter a row's `auth` names." In line 15, "the literature route and its source adapters: `tests/routes/docs/literature.test.ts`" becomes "the literature route over the fixture rows: `tests/routes/docs/literature.test.ts`", the titles unchanged.

G70 (lines 40-42). Line 41 becomes:
```
  Code: `src/lib/data/places/hub-address.ts` (`webAddress`), `src/lib/server/machine/runs/lint/readers.ts`, `src/lib/data/sources/config/settings/rows/links.ts` (`linkAddress`) and `rows/check.ts`, which reads no `links` row whose address is not `https:`, `src/lib/views/sources/source/language/lint-fixes.ts`, `src/lib/views/sources/source/language/problem-marks.svelte.ts`, `src/lib/views/sources/search/Problems.svelte`.
```
Line 42 gains, after the ruff row: "; ShellCheck: `tests/server/core/reader/reader.test.ts`, "links ShellCheck's SC2086 to the shellcheck row's address" and 'reads no links row whose address is not https:'".

G8 (line 71). "`src/lib/server/core/file-bytes.ts` (the hash both sides compare by)." becomes "`src/lib/server/core/files/file-bytes.ts` (the hash both sides compare by).", the rest unchanged.

G45 (lines 125-127). Lines 126-127 become:
```
  Code: the merge of `src/lib/state/feeds/literature/merge.ts` (`mergeHits`, `orderOf`), ordered by the rows of `literature.sources`, `literature.prefer` and `links`.
  Test: `tests/state/feeds/literature-merge.test.ts` 'merges hits by DOI, PubMed id or arXiv id and keeps hits that share none apart'.
```
("written by D38" is left out as history.)

G58 (line 144). "`src/lib/server/core/file-bytes.ts`, which keeps the BOM" becomes "`src/lib/server/core/files/file-bytes.ts`, which keeps the BOM".

G134 (lines 213-215). Line 214 becomes "  Code: `src/lib/views/shared/forms/entry/entry-add.ts` (the collection's Add, a journal browser hit's Add `browserHitAsk`), `src/lib/ui/forms/prompt.ts` (`answered`)."; line 215 stays "every row".

G111 (lines 356-358) become:
```
- G111. Each Recover source is read through a `recover.sources` row of its hub into the files it lists, each with its name, size and checksum, and an answer that does not parse is refused with a line naming the source, never read as an empty list.
  Code: `src/lib/server/core/reader/` (`listing.ts`, `reader.ts`, `fields.ts`, `formats.ts`, `paging.ts`, `path.ts`), `src/lib/server/machine/runs/recover/routes.ts` (`listFiles`), `files.ts` (`rowOf`).
  Test: `tests/server/machine/runs/recover/sources.test.ts`, describe 'the Recover source readers', one table, a row per kind through the fixture row of `tests/server/core/reader/rows.yml` from a recorded answer, a refusal row per kind, and the rows 'a kind no row of its hub names refused: the kind named, before any request' and 'a second hub whose own recover.sources names the kind serves its own dataset'.
```

G112 (lines 359-361): unchanged.

G113 (line 363) becomes "  Code: `src/lib/server/machine/runs/recover/local.ts`, `cluster.ts`, `unpack.ts`, `routes.ts`, `plan.ts` (`credentialFiles`, the curl config from a row's `auth`: `basic`, or a header with its `prefix`)."; lines 362 and 364 unchanged.

G114 (lines 365-367) become:
```
- G114. Missing access disables Fetch with the setup steps: for a source whose `recover.sources` row's `auth` needs a `downloads` row, no such row in the primary hub's `local.yml`, or a row with which the address the row's `access` names answers 401 or 403. Oculus never opens `~/.netrc` or `kaggle.json`, and curl is never passed `--netrc`.
  Code: `src/lib/server/machine/runs/recover/access.ts` (`accessOf`), `src/lib/server/core/reader/request.ts` (`applyAuth`).
  Test: `tests/server/machine/runs/recover/access.test.ts`, describe 'Recover access', one table, a row per kind and answer through the fixture rows.
```

New entries. G136 after G114 (line 367), beside the Recover readers; G137 and G138 after G134 (line 215), in "Your work is not lost or misplaced":

```
- G136. The configured reader sends exactly the requests a row describes (address, parameters, headers, body, paging, auth, pacing and the 429 state) and reads exactly the records and fields the row names, every value encoded in its part, and every request names oculus and its version.
  Code: `src/lib/server/core/reader/`; the rows' readers `src/lib/data/sources/config/settings/rows/`.
  Test: `tests/server/core/reader/reader.test.ts`: describe 'the fixture rows'; 'case 1: each literature source read through its row', 'reads $id as the adapter did', every row; 'case 2: the requests a row sends, as the adapter sent them', 'sends $id the words, the choices and page 2' and 'sends $id the DOI lookup', every row; 'case 15: a primary hub with no literature.sources'; 'case 3: arXiv sits out a search it cannot answer', every row; 'case 5: the paging a row names', every row; 'case 6: requests built from the records of another', every row; 'case 7: a 429 and the pacing of a row', every row; 'case 12: a value reaches its request encoded in its one part', every row; 'case 13: an answer the row does not fit', every row; 'case 14 and case 26: the addresses the links rows build', every row; 'case 24 and case 25: Copy BibTeX by id, and lookups that find nothing', every row; "case 20 and case 27: a row the reader cannot read is a finding of the hub's config.yml", every row.
- G137. The journal browser asks only on a press, one request per press, and writes a hit, or a venue's `fee` and `open_access`, through the write chain.
  Code: `src/lib/views/sources/venues/Browser.svelte`, `VenueCard.svelte` (Read from the browser), `src/lib/state/sources/registries/browser.ts`, `src/lib/server/content/literature/browser.ts`, `src/routes/api/(docs)/venue-browser/+server.ts`.
  Test: `tests/state/sources/registries/browser.test.ts`, describe 'the journal browser' and describe 'Read from the browser', every row.
- G138. A Settings family marked `sparse: true` draws each card with the fields its row sets and an Add field menu offering the others, a pairs value may be a text or a record and is held as the file has it, and a change is written to the hub the key is read from.
  Code: `src/lib/state/system/config/editors/fields.ts`, `draft.ts`; `src/lib/views/system/workbench/editors/Cards.svelte`.
  Test: `tests/state/system/config/sparse-card.test.ts`, describe 'a sparse family card: the fields its row sets and an Add field menu of the others', 'a field added from the Add field menu', "a reader row's fields and query values, a text or a record" and 'where a change to a sparse family is written, with a second hub shown', every row.
```

## Hub text

The text of `tests/server/core/reader/rows.yml`, to be written into the research hub's `.oculus/config.yml` as its `literature:`, `recover:`, `venues:` and `links:` keys:

```yaml
literature:
    sources:
        - key: openalex
          name: OpenAlex
          format: json
          address: https://api.openalex.org/works
          query:
              words: { param: filter, text: 'title_and_abstract.search:{words|spaced}' }
              doi: { param: filter, text: 'doi:{doi}' }
              years: { param: filter, text: 'publication_year:{from}-{to}' }
              type: { param: filter, text: 'type:{value}' }
              open_access: { param: filter, text: 'is_oa:true' }
              min_cited: { param: filter, text: 'cited_by_count:>{value-1}' }
              author: { param: filter, text: 'raw_author_name.search:{value|spaced}' }
          join: { filter: ',' }
          types:
              article: article
              review: review
              preprint: preprint
              conference: conference-paper
              book: book
              chapter: book-chapter
          paging: { kind: page, param: page, first: 1, size: per-page, total: meta.count }
          params:
              select: id,doi,display_name,publication_year,publication_date,type,cited_by_count,open_access,best_oa_location,primary_location,authorships,ids,abstract_inverted_index,locations
          wait: { reset: x-ratelimit-reset, remaining: x-ratelimit-remaining }
          auth:
              - param: api_key
                row: openalex
                help: The `secret` is an OpenAlex API key, made under Settings on openalex.org. Without it OpenAlex allows about 100 searches a day.
          contact: mailto
          records: results
          fields:
              id: id
              doi: doi
              pmid: { path: ids.pmid, op: match, pattern: '(\d+)/?$' }
              arxiv:
                  path: 'locations[].landing_page_url'
                  op: match
                  pattern: 'arxiv\.org/(?:abs|pdf)/(.+)$'
              title: display_name
              authors: 'authorships[].author.display_name'
              venue: primary_location.source.display_name
              year: publication_year
              date: publication_date
              type: type
              abstract: { path: abstract_inverted_index, op: inverted_index }
              cites: cited_by_count
              oa: open_access.is_oa
              pdf: best_oa_location.pdf_url
              url: { path: primary_location.landing_page_url, op: https, else: id }
        - key: semantic_scholar
          name: Semantic Scholar
          format: json
          address: https://api.semanticscholar.org/graph/v1/paper/search
          query:
              words: { param: query }
              doi:
                  address: 'https://api.semanticscholar.org/graph/v1/paper/DOI:{doi|path}'
                  params:
                      fields: title,abstract,year,venue,authors,externalIds,citationCount,isOpenAccess,openAccessPdf,publicationTypes,publicationDate,journal,url,citationStyles
                  missing: none
              id:
                  address: 'https://api.semanticscholar.org/graph/v1/paper/{id}'
                  params: { fields: citationStyles }
                  fields: { bibtex: citationStyles.bibtex }
              years: { param: year, text: '{from}-{to}' }
              type: { param: publicationTypes }
              open_access: { param: openAccessPdf, text: '' }
              min_cited: { param: minCitationCount }
              venue: { param: venue }
          types:
              review: Review
              article: JournalArticle
              conference: Conference
              book: Book
              chapter: BookSection
          paging: { kind: offset, param: offset, size: limit, total: total }
          params:
              fields: title,abstract,year,venue,authors,externalIds,citationCount,isOpenAccess,openAccessPdf,publicationTypes,publicationDate,journal,url,citationStyles
          pace: { gap: 1000 }
          wait: { retry_after: retry-after }
          auth:
              - header: x-api-key
                row: semantic_scholar
                help: The `secret` is a Semantic Scholar API key, asked for on semanticscholar.org/product/api. Without it Semantic Scholar often answers that too many requests were made.
          records: data
          fields:
              id: paperId
              doi: externalIds.DOI
              pmid: externalIds.PubMed
              arxiv: externalIds.ArXiv
              title: title
              authors: 'authors[].name'
              venue: { path: journal.name, else: venue }
              year: year
              date: publicationDate
              type: publicationTypes
              abstract: abstract
              cites: citationCount
              oa: isOpenAccess
              pdf: openAccessPdf.url
              url: url
              bibtex: citationStyles.bibtex
        - key: crossref
          name: Crossref
          format: json
          address: https://api.crossref.org/works
          query:
              words: { param: query.bibliographic }
              doi:
                  address: 'https://api.crossref.org/works/{doi|path}'
                  records: message
                  missing: none
              years: { param: filter, text: 'from-pub-date:{from},until-pub-date:{to}' }
              type: { param: filter, text: 'type:{value}' }
              author: { param: query.author }
              venue: { param: query.container-title }
          join: { filter: ',' }
          types:
              article: journal-article
              preprint: posted-content
              conference: proceedings-article
              book: book
              chapter: book-chapter
          paging: { kind: offset, param: offset, size: rows, total: message.total-results }
          params:
              select: DOI,title,author,published,type,is-referenced-by-count,container-title,abstract,link,license
          pace: { gap: 1000 }
          wait: { retry_after: retry-after }
          contact: mailto
          records: message.items
          fields:
              id: DOI
              doi: DOI
              title: title.0
              authors:
                  path: 'author[]'
                  each: { path: name, else: { op: join, parts: [given, family] } }
              venue: container-title.0
              date: { path: published.date-parts.0, op: date }
              type: type
              abstract: abstract
              cites: is-referenced-by-count
              url: { op: link, link: doi, id: DOI }
        - key: pubmed
          name: PubMed
          format: json
          address: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi
          query:
              words: { param: term }
              doi: { param: term, text: '{doi}[doi]' }
              years: { param: term, text: '{from}:{to}[dp]' }
              type: { param: term, text: '{value}[pt]' }
              open_access: { param: term, text: 'free full text[sb]' }
              venue: { param: term, text: '"{value|quote}"[ta]' }
              author: { param: term, text: '{value|bare}[au]' }
          join: { term: ' AND ' }
          types:
              review: review
              preprint: preprint
              article: journal article
          paging: { kind: offset, param: retstart, size: retmax, total: esearchresult.count }
          params: { db: pubmed, retmode: json, sort: relevance, tool: oculus }
          pace: { gap: 340, gap_with_key: 100 }
          wait: { retry_after: retry-after }
          auth:
              - param: api_key
                row: ncbi
                help: The `secret` is an NCBI API key, made under Account Settings on ncbi.nlm.nih.gov. It lets PubMed answer more requests a second.
          contact: email
          records: esearchresult.idlist
          then:
              - address: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi
                params: { db: pubmed, id: '{ids}', retmode: xml, tool: oculus }
                ids: .
                order_by: MedlineCitation.PMID
                format: xml
                records: { path: 'PubmedArticleSet.PubmedArticle[]', absent: none }
                fields:
                    id: MedlineCitation.PMID
                    doi: 'PubmedData.ArticleIdList.ArticleId[@IdType=doi]'
                    pmid: MedlineCitation.PMID
                    title: { path: MedlineCitation.Article.ArticleTitle, markup: true }
                    authors:
                        path: 'MedlineCitation.Article.AuthorList.Author[]'
                        each:
                            path: CollectiveName
                            else: { op: join, parts: [ForeName, LastName] }
                    venue: MedlineCitation.Article.Journal.Title
                    date:
                        path: MedlineCitation.Article.Journal.JournalIssue.PubDate
                        op: date
                        parts: [Year, Month, Day]
                        else:
                            path: MedlineCitation.Article.Journal.JournalIssue.PubDate.MedlineDate
                            op: match
                            pattern: '\d{4}'
                    type: 'MedlineCitation.Article.PublicationTypeList.PublicationType[]'
                    abstract:
                        path: 'MedlineCitation.Article.Abstract.AbstractText[]'
                        op: join
                        by: ' '
                        markup: true
                    url: { op: link, link: pubmed, id: MedlineCitation.PMID }
        - key: europe_pmc
          name: Europe PMC
          format: json
          address: https://www.ebi.ac.uk/europepmc/webservices/rest/search?format=json&resultType=core
          query:
              words: { param: query, text: 'TITLE_ABS:({words})' }
              doi: { param: query, text: 'DOI:"{doi}"' }
              years: { param: query, text: 'PUB_YEAR:[{from} TO {to}]' }
              type: { param: query, text: '{value}' }
              open_access: { param: query, text: 'OPEN_ACCESS:y' }
              venue: { param: query, text: 'JOURNAL:"{value|quote}"' }
              author: { param: query, text: 'AUTH:"{value|quote}"' }
          join: { query: ' AND ' }
          types:
              article: 'PUB_TYPE:"journal article"'
              review: 'PUB_TYPE:"review"'
              preprint: 'SRC:PPR'
          paging:
              kind: cursor
              param: cursorMark
              start: '*'
              from: nextCursorMark
              size: pageSize
              total: hitCount
          wait: { retry_after: retry-after }
          records: resultList.result
          fields:
              id: { value: '{source}:{id}', else: 'MED:{id}' }
              doi: doi
              pmid: { path: pmid, else: '[source=MED].id' }
              title: title
              authors: { path: authorString, op: split, suffix: '.', pattern: ',\s*' }
              venue: journalInfo.journal.title
              year: pubYear
              date: firstPublicationDate
              type:
                  path: source
                  map: { preprint: [PPR] }
                  else:
                      path: pubTypeList.pubType
                      map: { review: [review], article: [journal article, research-article] }
              abstract: abstractText
              cites: citedByCount
              oa: { path: isOpenAccess, map: { 'true': ['Y'] } }
              pdf: 'fullTextUrlList.fullTextUrl[documentStyle=pdf][availabilityCode=OA].url'
              url: { path: id, op: link, link: europepmc }
        - key: arxiv
          name: arXiv
          format: xml
          address: https://export.arxiv.org/api/query
          query:
              words: { param: search_query, text: 'all:{words}', per_word: true }
              doi: { param: id_list, match: '^10\.48550/arxiv\.(.+)$' }
              years: { param: search_query, text: 'submittedDate:[{from}01010000 TO {to}12312359]' }
              author: { param: search_query, text: 'au:{value|phrase}' }
              id:
                  address: 'https://doi.org/10.48550/arXiv.{id|path}'
                  headers: { accept: application/x-bibtex }
                  format: text
                  fields: { bibtex: . }
                  by: arxiv
          join: { search_query: ' AND ' }
          skip_when: [venue, min_cited]
          types: { preprint: '' }
          types_only: true
          paging:
              kind: offset
              param: start
              size: max_results
              total: 'feed.opensearch:totalResults'
          params: { sortBy: relevance, sortOrder: descending }
          pace: { gap: 3000 }
          wait: { retry_after: retry-after }
          records: { path: 'feed.entry[]', absent: none }
          fields:
              id: { path: id, op: match, pattern: '/abs/(.+?)(?:v\d+)?$' }
              arxiv: { path: id, op: match, pattern: '/abs/(.+?)(?:v\d+)?$' }
              doi: 'arxiv:doi'
              title: title
              authors: 'author[].name'
              date: published
              type: { value: preprint }
              abstract: summary
              oa: { value: true }
              pdf: { op: link, link: arxiv_pdf, id: id }
              url: { op: link, link: arxiv, id: id }
        - key: wos
          name: Web of Science
          format: json
          address: https://api.clarivate.com/apis/wos-starter/v1/documents
          query:
              words: { param: q, text: 'TS=({words})' }
              doi: { param: q, text: 'DO=({doi})' }
              years: { param: q, text: 'PY={from}-{to}' }
              type: { param: q, text: 'DT=({value|phrase})' }
              venue: { param: q, text: 'SO=({value|plain})' }
              author: { param: q, text: 'AU=({value|plain})' }
          join: { q: ' AND ' }
          types:
              article: Article
              review: Review
              conference: Proceedings Paper
          paging: { kind: page, param: page, first: 1, size: limit, max: 50, total: metadata.total }
          params: { db: WOS, sortField: RS D }
          wait: { retry_after: retry-after }
          auth:
              - header: X-ApiKey
                row: wos
                required: true
                help: The `secret` is a Web of Science Starter API key, made on developer.clarivate.com.
          records: hits
          fields:
              id: uid
              doi: identifiers.doi
              pmid: identifiers.pmid
              title: title
              authors: 'names.authors[].displayName'
              venue: source.sourceTitle
              year: source.publishYear
              type: types.0
              cites: 'citations[db=WOS].count'
              url: links.record
        - key: scopus
          name: Scopus
          format: json
          address: https://api.elsevier.com/content/search/scopus
          query:
              words: { param: query, text: 'TITLE-ABS-KEY({words})' }
              doi: { param: query, text: 'DOI({doi})' }
              years: { param: query, text: 'PUBYEAR > {from-1} AND PUBYEAR < {to+1}' }
              type: { param: query, text: 'DOCTYPE({value})' }
              open_access: { param: query, text: 'OPENACCESS(1)' }
              venue: { param: query, text: 'SRCTITLE({value|plain})' }
              author: { param: query, text: 'AUTH({value|plain})' }
          join: { query: ' AND ' }
          types:
              article: ar
              review: re
              conference: cp
              book: bk
              chapter: ch
          paging:
              kind: offset
              param: start
              size: count
              max: 25
              total: 'search-results.opensearch:totalResults'
          params: { sort: relevancy }
          headers: { accept: application/json }
          wait: { retry_after: retry-after }
          auth:
              - header: X-ELS-APIKey
                row: scopus
                required: true
                help: The `secret` is an Elsevier API key, made on dev.elsevier.com.
              - header: X-ELS-Insttoken
                row: scopus-insttoken
                help: The `secret` is the Elsevier institutional token that goes with the Scopus key, sent when the key needs one.
          none_when: 'search-results.entry[].error'
          records: { path: 'search-results.entry[]', absent: none }
          fields:
              id: { path: eid, else: 'dc:identifier' }
              doi: 'prism:doi'
              pmid: pubmed-id
              title: 'dc:title'
              authors: { path: 'author[].authname', else: 'dc:creator' }
              venue: 'prism:publicationName'
              date: 'prism:coverDate'
              type: subtype
              abstract: 'dc:description'
              cites: citedby-count
              oa: openaccessFlag
              url: { path: 'link[@ref=scopus].@href', op: https, host: www.scopus.com }
    prefer:
        fields: [crossref, pubmed, europe_pmc, scopus, wos, openalex, semantic_scholar, arxiv]
        abstract: [pubmed, europe_pmc, semantic_scholar, openalex, arxiv, crossref, scopus]
        pdf: [openalex, europe_pmc, semantic_scholar, arxiv]
recover:
    sources:
        - key: dandi
          name: DANDI
          format: json
          address: 'https://api.dandiarchive.org/api/dandisets/{dandiset}/versions/{version}/assets/'
          paging: { kind: next, from: next, size: page_size, sizes: [100] }
          records: { path: results, refuse_when: zarr }
          fields:
              name: { path: path, op: last }
              size: size
              url: 'https://api.dandiarchive.org/api/assets/{asset_id}/download/'
          pick: { field: assets, by: path }
          then:
              - address: 'https://api.dandiarchive.org/api/dandisets/{dandiset}/versions/{version}/assets/{asset_id}/'
                for_each: asset_id
                fields: { checksum: { path: 'digest.dandi:sha2-256', kind: sha256 } }
        - key: figshare
          name: figshare
          format: json
          address: 'https://api.figshare.com/v2/collections/{collection}/articles'
          holes: { article: '^\d+$' }
          given: { article: id }
          paging: { kind: page, param: page, first: 1, size: page_size, sizes: [100] }
          records: .
          clash: id
          pick: { field: files }
          then:
              - address: 'https://api.figshare.com/v2/articles/{id}'
                for_each: id
                records: files
                fields:
                    name: name
                    size: size
                    checksum: { path: computed_md5, kind: md5 }
                    url: download_url
        - key: geo
          name: GEO
          format: html
          address: 'https://ftp.ncbi.nlm.nih.gov/geo/series/{accession|series}/{accession}/suppl/'
          holes: { accession: '^GSE\d+$' }
          expect: { select: title, holds: Index of }
          records: { select: 'pre a:not([href^="/"]):not([href*="?"])' }
          fields:
              name: { attr: href, op: last }
              url: { attr: href, op: resolve }
              size: { op: first_byte_size }
          pick: { field: files }
        - key: huggingface
          name: Hugging Face
          format: json
          address: 'https://huggingface.co/api/datasets/{repo|path}/tree/main?recursive=true&limit=100'
          holes: { repo: '^[A-Za-z0-9][A-Za-z0-9._-]*/[A-Za-z0-9][A-Za-z0-9._-]*$' }
          paging: { kind: link }
          records: { path: ., where: { type: file } }
          fields:
              name: path
              size: size
              checksum: { path: lfs.oid, kind: sha256 }
              url: 'https://huggingface.co/datasets/{repo|path}/resolve/main/{path|path}'
          pick: { field: patterns, glob: true }
        - key: kaggle
          name: Kaggle
          format: json
          address: 'https://www.kaggle.com/api/v1/datasets/list/{dataset|path}'
          holes: { dataset: '^[A-Za-z0-9][A-Za-z0-9_-]*/[A-Za-z0-9][A-Za-z0-9_.-]*$' }
          auth:
              - basic: true
                row: kaggle
                required: true
                help: The `user` is your Kaggle user name and the `secret` the key of an API token made under Settings on kaggle.com.
          access: { address: 'https://www.kaggle.com/api/v1/datasets/list/{dataset|path}' }
          records: datasetFiles
          archive:
              address: 'https://www.kaggle.com/api/v1/datasets/download/{dataset|path}'
              name: '{dataset|last}.zip'
        - key: physionet
          name: PhysioNet
          format: text
          address: 'https://physionet.org/files/{project}/{version}/SHA256SUMS.txt'
          auth:
              - basic: true
                row: physionet
                help: The `user` and `secret` are your PhysioNet login, on an account with access to this set.
          access: { address: 'https://physionet.org/files/{project}/{version}/SHA256SUMS.txt' }
          pace: { field: throttle }
          records: { op: checksum_file, kind: sha256 }
          fields:
              name: name
              checksum: { path: digest, kind: sha256 }
              url: 'https://physionet.org/files/{project}/{version}/{name|path}'
              size: { op: first_byte_size }
          pick: { field: files }
          archive:
              address: 'https://physionet.org/content/{project}/get-zip/{version}/'
              match: '\.zip$'
              when: archive
        - key: stanford
          name: Stanford Digital Repository
          format: json
          address: 'https://purl.stanford.edu/{druid}.json'
          holes: { druid: '^[a-z]{2}\d{3}[a-z]{2}\d{4}$' }
          records: 'structural.contains[].structural.contains[]'
          fields:
              name: filename
              size: size
              checksum:
                  path: 'hasMessageDigests[type=sha1].digest'
                  kind: sha1
                  else: { path: 'hasMessageDigests[type=md5].digest', kind: md5 }
              url: 'https://stacks.stanford.edu/file/druid:{druid}/{filename|path}'
          pick: { field: files }
        - key: synapse
          name: Synapse
          format: json
          address: 'https://repo-prod.prod.sagebase.org/repo/v1/entity/{ids}'
          for_each: ids
          holes: { ids: '^syn\d+$' }
          auth:
              - header: Authorization
                prefix: 'Bearer '
                row: synapse
                required: true
                help: The `secret` is a personal access token made under Account Settings on synapse.org.
          access: { address: https://repo-prod.prod.sagebase.org/repo/v1/userProfile }
          then:
              - address: 'https://repo-prod.prod.sagebase.org/repo/v1/entity/{id}/filehandles'
                for_each: id
                when: { concreteType: org.sagebionetworks.repo.model.FileEntity }
                records:
                    path: list
                    unless: { concreteType: org.sagebionetworks.repo.model.file.PreviewFileHandle }
                    first: true
                fields:
                    name: '{folders}{fileName}'
                    size: contentSize
                    checksum: { path: contentMd5, kind: md5 }
                    url: 'https://repo-prod.prod.sagebase.org/repo/v1/entity/{id}/file'
              - address: https://repo-prod.prod.sagebase.org/repo/v1/entity/children
                for_each: id
                unless: { concreteType: org.sagebionetworks.repo.model.FileEntity }
                method: post
                body: { parentId: '{id}', includeTypes: [file, folder] }
                paging: { kind: cursor, param: nextPageToken, in: body, from: nextPageToken }
                records: page
                recurse:
                    when: { type: org.sagebionetworks.repo.model.Folder }
                    id: id
                    folder: name
                    max_depth: 8
                then:
                    - address: 'https://repo-prod.prod.sagebase.org/repo/v1/entity/{id}/filehandles'
                      for_each: id
                      when: { type: org.sagebionetworks.repo.model.FileEntity }
                      records:
                          path: list
                          unless:
                              concreteType: org.sagebionetworks.repo.model.file.PreviewFileHandle
                          first: true
                      fields:
                          name: '{folders}{fileName}'
                          size: contentSize
                          checksum: { path: contentMd5, kind: md5 }
                          url: 'https://repo-prod.prod.sagebase.org/repo/v1/entity/{id}/file'
        - key: tcia
          name: TCIA
          format: json
          address: 'https://services.cancerimagingarchive.net/nbia-api/services/v1/getSeries?Collection={collection}&format=json'
          records: .
          fields:
              name: '{SeriesInstanceUID}.zip'
              url: 'https://services.cancerimagingarchive.net/nbia-api/services/v1/getImage?SeriesInstanceUID={SeriesInstanceUID}'
          pick: { field: series, by: SeriesInstanceUID }
        - key: url
          name: Address
          format: none
          records: { field: urls }
          fields:
              name: { path: name, else: { path: url, op: last } }
              size: { op: first_byte_size }
              checksum: { path: sha256, kind: sha256, else: { path: md5, kind: md5 } }
              url: url
        - key: zenodo
          name: Zenodo
          format: json
          address: 'https://zenodo.org/api/records/{record}'
          records: files
          fields:
              name: key
              size: size
              checksum: { path: checksum, op: strip, prefix: 'md5:', kind: md5 }
              url: links.self
          pick: { field: files }
venues:
    browser:
        key: utbrowser
        name: UT Journal Browser
        format: html
        address: https://library.wur.nl/WebQuery/utbrowser
        query:
            words: { param: title }
            issn: { param: q, params: { wq_fld: q } }
        filters:
            - label: Open access status
              params: { wq_flt: journal/oa-status, wq_val: '{value}' }
            - { label: JCR quartile, params: { wq_flt: jcr/category/kwartiel, wq_val: '{value}' } }
        sorts:
            - { label: CiteScore, params: { wq_srt_desc: citescore } }
            - { label: SNIP, params: { wq_srt_desc: snip } }
            - { label: SJR, params: { wq_srt_desc: sjr } }
            - { label: 'Title, A to Z', params: { wq_srt_asc: journal/title } }
            - { label: 'Title, Z to A', params: { wq_srt_desc: journal/title } }
        paging:
            kind: offset
            param: wq_ofs
            size: wq_max
            sizes: [20, 50, 100]
            total:
                select: '#searchresult-functions .navbar-brand'
                op: match
                pattern: '/ (\d+)'
        records: { select: 'table#records tbody tr' }
        fields:
            title: 'a[title="more info"]'
            issn: { select: div.issns, op: match, pattern: '\d{4}-\d{3}[\dXx]', all: true }
            publisher: div.author
            fee: a.apc_discount
            open_access: { select: li.open_access, attr: title }
links:
    - { key: doi, address: 'https://doi.org/{id|path}' }
    - { key: arxiv, address: 'https://arxiv.org/abs/{id|path}' }
    - { key: arxiv_pdf, address: 'https://arxiv.org/pdf/{id|path}' }
    - { key: pubmed, address: 'https://pubmed.ncbi.nlm.nih.gov/{id}/' }
    - { key: europepmc, address: 'https://europepmc.org/article/{source}/{id}' }
    - key: scholar
      address: 'https://scholar.google.com/scholar?q={id}&as_ylo={from}&as_yhi={to}'
    - { key: shellcheck, address: 'https://www.shellcheck.net/wiki/{id}' }
```

The three `schema:` lines of the hub's `.oculus/data/research/venues.yml`, each after line 22 `  - { field: free,           type: text,     help: "Open-access and article processing charge note." }`, in this order:

```
  - { field: issn,           type: tags,     label: "ISSN", help: "The venue's ISSNs, print and electronic, each as 1234-567X." }
  - { field: fee,            type: text,     help: "The article processing charge the journal browser states." }
  - { field: open_access,    type: text,     label: "Open access", help: "The open-access status the journal browser states." }
```

## Repair round 1

Brief: `agents/briefs/O97-round1.md`, review `agents/reviews/O97-refuter.md`. Every item of the round is built. Verify 1 exits 1 on `tests/checks/config/templates.test.ts` alone, which the round's brief allows (it closes with the Doc text at landing).

### Item 1, the row keys

The grammar, the options catalog and the code no longer hold the keys no row of `rows.yml` uses:

- the field record's `text: true` and `names`, removed from `FieldRecord` and its shape (`grammar.ts`), from the field reader (`fields.ts:183` read `spec.text === true` as a selection's text) and from the two field descriptions of `config/options/behavior.yml` that drew a `text` toggle; a selector's element is read as its text when the record names no `attr`, and the catalog's `select` line says so;
- the term's `with_terms`, removed from `Term`, its shape, its catalog entry and `askedOf` in `request.ts` (a DOI or ISSN term sent as a parameter sends that term alone);
- `expect`'s `path`: `Expect` is `{ select: string; holds?: string }` with `select` required, `holdsExpected` (`formats.ts`) reads the selector alone, and the three `expect` entries of the catalog drop `path` and say "the element of an html answer the row's pages hold, which a page that lacks it refuses".

Three descriptions now say what the code does: the `https` operation's `host`, "the host whose http address https reads as https"; a literature term's `params`, "the parameters sent with the term alone, beside its parameter or with its lookup" (the UT browser's `issn: { param: q, params: { wq_fld: q } }`, rows.yml:584, is sent so); and the doc comment of `Term` in `grammar.ts:186-192`, which says the same of `params` and that `headers` go with a lookup.

Kept: the operations `first` and `exists`, which no row uses but item 2 and ruling 517 (1) name.

Check: `grep -rn "with_terms\|text: true\|names:\s*\[\|expect: { path" src tests config --exclude=local.yml` prints no line of the reader, the grammar or the catalog (its hits are other modules' `names` fields). `npx tsc --noEmit -p .` prints nothing. `npx vitest run tests/server/core/reader tests/server/content/literature tests/routes/docs tests/server/edit tests/state/sources/registries tests/state/system/config --testTimeout 0`: `Tests 362 passed (362)`.

**Decision for Axel: the row keys that item 2, rulings 511 (3) and 517 (1), and decisions 2 and 6 do not name.** Each is read by the reader, described in the options catalog, and used by the row named, by line of `tests/server/core/reader/rows.yml` (the Hub text is that file):

| Key | What it reads | The row that needs it |
|---|---|---|
| field op `last` | the last `/` part of a path or address | DANDI `name: { path: path, op: last }` (:392); GEO `name: { attr: href, op: last }` (:427); Address `else: { path: url, op: last }` (:561) |
| field op `split` | a text split into a list at `pattern`, `suffix` cut from each part | Europe PMC `authors: { path: authorString, op: split, suffix: '.', pattern: ',\s*' }` (:237) |
| field op `resolve` | an `href` read as an address against the page's address | GEO `url: { attr: href, op: resolve }` (:428) |
| field `value` | a constant, or a text with holes | Europe PMC `id: { value: '{source}:{id}', else: 'MED:{id}' }` (:233); arXiv `type: { value: preprint }` (:287), `oa: { value: true }` (:289) |
| field `each` | a spec read on each element of a list | Crossref authors (:139); PubMed authors (:187) |
| field `map` | the key whose listed values match the value, without case | Europe PMC `type` (:243, :246), `oa: { path: isOpenAccess, map: { 'true': ['Y'] } }` (:249) |
| field `pattern` | the pattern of `match` and `split` | OpenAlex `pmid` (:36), `arxiv` (:40); PubMed's year (:198); Europe PMC (:237) |
| field `suffix` | with `split`, the text cut from each part's end | Europe PMC (:237) |
| field `all: true` | with `match`, every match as a list | UT browser `issn: { select: div.issns, op: match, pattern: ..., all: true }` (:607) |
| field `host` | with `https`, the host whose http address is read as https | Scopus `url: { path: 'link[@ref=scopus].@href', op: https, host: www.scopus.com }` (:378) |
| field `markup: true` | an XML element read as its inner markup | PubMed `title` (:184), abstract (:204) |
| a field written as a text with holes | the text with each `{name}` filled from the record | DANDI `url` (:394); Hugging Face `url` (:442); PhysioNet `url` (:473) |
| records `field` | the records are an entry field's list | Address `records: { field: urls }` (:559) |
| records `kind` | the checksum kind of `checksum_file` | PhysioNet `records: { op: checksum_file, kind: sha256 }` (:469) |
| records `absent: none` | a missing path is no records | PubMed's efetch (:179); arXiv (:279); Scopus (:365) |
| records `where` | keeps the records whose fields equal the values | Hugging Face `records: { path: ., where: { type: file } }` (:437) |
| records `unless` | drops the records whose fields equal the values | Synapse's file handles (:514, :539) |
| records `first: true` | keeps the first record, refuses an answer with none | Synapse's file handles (:515, :541) |
| records `refuse_when` | refuses an answer whose records hold the path | DANDI `records: { path: results, refuse_when: zarr }` (:390) |
| term `per_word` | one text per word or quoted phrase | arXiv `words: { param: search_query, text: 'all:{words}', per_word: true }` (:257) |
| term `params` | the parameters sent with the term alone, beside its parameter or with its lookup | Semantic Scholar's `doi` (:60) and `id` (:65) lookups; the UT browser's `issn` (:584) |
| term `headers` | the headers a lookup is sent with | arXiv's `id` lookup `headers: { accept: application/x-bibtex }` (:263) |
| term `records` | where a lookup's answer holds its records | Crossref's `doi` lookup `records: message` (:113) |
| term `fields` | the fields of a lookup's records | Semantic Scholar's `id` (:66); arXiv's `id` (:265) |
| term `format` | how a lookup's answer is read | arXiv's `id` `format: text` (:264) |
| term `by` | the hit field a lookup by id takes its id from | arXiv's `id` `by: arxiv` (:266) |
| row and step `headers` | the headers every request of the row sends | Scopus `headers: { accept: application/json }` (:354) |
| row `for_each` | one reading per value of an entry field | Synapse `for_each: ids` (:499) |
| row `holes` | the pattern an entry's value must match, else the source is refused | figshare (:404); GEO (:423); Hugging Face (:435); Kaggle (:448); Synapse (:500) |
| row `given` | the entry field a hole is filled from | figshare `given: { article: id }` (:405) |
| row `expect` | the element an html answer must hold, with `holds` | GEO `expect: { select: title, holds: Index of }` (:424) |
| step `when`, `unless` | the records a step takes | Synapse's steps (:511, :523, :535) |
| step `order_by` | the path of each record holding the id it was asked by, so the records come in the order of the ids | PubMed's efetch `order_by: MedlineCitation.PMID` (:177) |
| archive `name`, `match`, `when` | the archive's file name; the pattern its address must match; the entry field that asks for it | Kaggle `name: '{dataset\|last}.zip'` (:458); PhysioNet `match: '\.zip$'`, `when: archive` (:477, :478) |
| pick `by` | the file field the picked values are compared with | DANDI `pick: { field: assets, by: path }` (:395); TCIA `by: SeriesInstanceUID` (:555) |
| hole ops `bare`, `phrase`, `spaced`, `last` | quotes and brackets dropped; a phrase quoted; spaces kept as written; the last `/` part | PubMed `'{value\|bare}[au]'` (:157); arXiv `'au:{value\|phrase}'` (:260), WoS (:300); OpenAlex `{words\|spaced}` (:8), `{value\|spaced}` (:14); Kaggle `{dataset\|last}` (:458) |
| holes `{ids}`, `{folders}` | the ids of the request before, joined by commas; the folders a recursion went down | PubMed's efetch `id: '{ids}'` (:175); Synapse `'{folders}{fileName}'` (:517, :543) |
| formats `text`, `none` | an answer read as plain text; a row whose records are an entry field | arXiv's `id` lookup (:264), PhysioNet (:461); Address (:558) |
| `literature.prefer` | the order of the sources the merge takes a paper's fields, abstract and PDF from | `prefer:` (:379-382) |

A row and a step share their request keys, so a row also accepts `method`, `body` and `recurse`, which the rows use in steps (Synapse's children step, :524-528).
- (A) Take these keys as built. Pros: every row of the tree reads with them; each is a named generic mechanism with its catalog line and no service in the code. Cons: the grammar is wider than the rulings named.
- (B) Remove some of them and write the rows that need them differently. Pros: a smaller grammar. Cons: each removal breaks the row named above (its hits or its file list differ from the old reader's, which case 1 and G111 hold), so a removal needs another mechanism in its place.
- Recommendation: (A), since each key is the one the row named needs and none is unused. The lazy option: none; (B) costs more and ends nothing.

### Item 2, the refusal line

`ListRefusal` (`src/lib/server/core/reader/listing.ts`) and `RecoverRefusal` (`src/lib/data/model/machine/model-recover.ts`) carry `label`, the row's `name`; `listRow` puts it on every refusal of a row's reading, a host stop excepted (no row read it). `src/lib/server/machine/runs/recover/routes.ts` adds it to the `name` refusals. `listingWords` (`src/lib/state/system/machine/recover-words.ts`) names `refusal.label ?? refusal.source` in the access, status, answer, name, missing and network lines; the `row` line keeps the kind. Every refusal row of `sources.test.ts`, `safety.test.ts:326` and `reader.test.ts` carries its row's `label`. New row of `tests/server/machine/runs/recover/sources.test.ts`: "a refused answer's line names the row by its name, the refusal by its key", a row `{ key: ega, name: Genome Archive }`, refused `{ refused: 'answer', source: 'ega', label: 'Genome Archive' }`, line `Genome Archive answered with something that is not its file list.`

Check: `npx vitest run tests/server/machine/runs/recover --testTimeout 0`: `Tests 128 passed`; `npx vitest run tests/server/core/reader --testTimeout 0`: `Tests 72 passed (72)`.

### Item 3, G3's row and the edits to existing assertions

`tests/routes/docs/literature.test.ts:136-144` is `toStrictEqual` with the exact object: `{ id: 'wos', name: 'Web of Science', keyed: true, available: held, key: 'wos', help: 'The `secret` is a Web of Science Starter API key, made on developer.clarivate.com.', bibtex: null }`. Check: `npx vitest run tests/routes/docs/literature.test.ts`: `Tests 2 passed (2)`.

Every edit to an assertion of a test that exists on the base (`git diff f4535f495 -- tests`, the new folders `tests/server/core/reader/`, `tests/state/sources/registries/` and `tests/state/system/config/` left out):

| File and line now | Before | After | Why |
|---|---|---|---|
| `tests/checks/config/config-folder.test.ts:179-181` | the top-level keys without them | `'recover'`, `'venues'`, `'links'` added | the three settings families the step adds to `config/defaults/behavior.yml` |
| `tests/data/sources/config/catalog/options.test.ts:84`, `:107` | "record only by a family field with no key field" | "record only by a family, or by a family field with no key field" | `holds: record` is read on a family too (`venues.browser`, a family of one record) |
| `options.test.ts:95`, `:113-119` | a family with `holds: record` and fields `{ kind }`: the finding `['probe', sentence('record')]`, `holds` dropped | a family with `holds: record` and fields `{ key, kind }`: no finding, `holds` kept as `'record'` | the same |
| `tests/data/sources/config/local/local.test.ts`, the `checkLocal` table (base line 86) | `['literature: { wos_key: 3 }', 'local.yml: literature.wos_key must be a non-empty string']` | removed | the six literature keys leave `local.yml`; `literature.wos_key` is an unknown key, read in the new case 21 describe |
| `local.test.ts:127-130` | `literature: { wos_key: 3, mailto: a@b.c }`, literature `{ mailto }`, problems `['literature.wos_key']` | `literature: { mailto: 3 }`, literature undefined, problems `['literature.mailto']` | the same; the row still reads a wrong literature key, with the one key left |
| `local.test.ts:166-174` | "a wrong service, a physionet row with no user and a repeated kaggle row" | "an empty service, an empty user and a repeated kaggle row", the same three problems | case 21: a row of any service is read, so a named service is no wrong value; the shape faults stay; the PhysioNet row with no user is item 6's machine-level finding |
| `local.test.ts:190-193` | "a kaggle-token row that names a user": problem `downloads[0].user: row`, services `[]` | "a row of any service that names a user": no problem, services `['kaggle-token']` | case 21 |
| `local.test.ts:234-240` | `literature: { wos_key: k, foo: x }` read as `{ wosKey: 'k' }` | `literature: { mailto: a@b.c, foo: x }` read as `{ mailto: 'a@b.c' }` | the six keys leave `local.yml` |
| `local.test.ts:288` | `'port: 9001\nliterature: { wos_key: 3, mailto: a@b.c }'` | `'port: 9001\nliterature: { mailto: 3 }'` | the same |
| `tests/routes/hubs/machine-answer.test.ts:122-131` | `expect(text).not.toContain(WOS)` alone and `values['literature.wos_key']` toBe the word for set | `WOS` in the secrets loop; the `wos_key` assertion gone; the `downloads` value holds `{ service: wos, secret: <set> }` | the WoS secret is a `downloads` row |
| `tests/routes/docs/literature.test.ts:136-144` | `toStrictEqual({ id: 'wos', keyed: true, available: held, key: 'wos_key' })` | `toStrictEqual` with `name`, `key: 'wos'`, `help` and `bibtex` | `SourceInfo` carries the row's name, the `downloads` row, the auth entry's help and the BibTeX lookup's field (item 4) |
| `literature.test.ts:210` | `keys: {}` | `downloads: []` | the secrets are `downloads` rows |
| `literature.test.ts:254-259` | `['scopus: 401', 'scopus: 403', 'scopus: 429', 'scopus: 500']` from `callFor` | `['Scopus: refused 401', 'Scopus: refused 403', 'Scopus: limited 429', 'Scopus: status 500']` from `send` | the reader's stop names the row's `name` and its state; the loop over every secret (`not.toContain`) is unchanged |
| `tests/server/machine/runs/recover/access.test.ts:113-322`, every access entry | `{ service, state, row[, status] }` | `{ ...PHYSIONET \| KAGGLE_ACCESS \| SYNAPSE_ACCESS, state, row[, status] }`, adding `name`, `basic`, `help` | the entry carries the row's name, whether it signs in with a user, and the auth entry's help the view draws (decision 2) |
| `access.test.ts:246`, `:269` | `accessOf(sources, { fetch, downloads })` | `accessOf(sources, listDeps(fetch, downloads))` | access reads the rows; the assertion is the same |
| `tests/server/machine/runs/recover/safety.test.ts:323-327` | `{ refused: 'name', source: 'url', name }` | `label: 'Address'` added | item 2 |
| `safety.test.ts:376-381` | `expect(curlConfig(one.account)).toBe(one.text)` | `expect(credentialFiles(fetchItems([row(...)]), [one.account])).toEqual(text === null ? null : [{ service, text }])`, each row with its `credential` | the curl config is built from the row's credential (`basic`, or a header with its prefix); the four texts are unchanged |
| `tests/server/machine/runs/recover/sources.test.ts:228-638`, every refusal row but `row` | `{ refused, source[, status \| name] }` | `label: '<the row's name>'` added | item 2 |
| `sources.test.ts:682` | `expect(Array.isArray(answer)).toBe(true)` | the same with the message `JSON.stringify(answer)` | a failing row prints the refusal; the predicate is unchanged |
| `tests/checks/source/history.test.ts:191-193` | two plants under `ANSWERS` | the two under `ANSWERS[0]` and one under `ANSWERS[1]`; the expected hits unchanged | item 8 |
| `tests/checks/tree/boundaries.test.ts:349-351` | the state row without them | `rows/grammar`, `rows/links`, `rows/read` allowed | item 8 |

Edits that change no assertion: `tests/state/system/settings/collection-fields.test.ts:28` (`bareLists`), `tests/ui/html.dom.test.ts:70-77` (the `links` argument `[]`), `tests/server/edit/literature.test.ts:34-42` and `tests/state/feeds/literature-merge.test.ts:10-26` (wrappers passing the fixture's rows), `tests/views/shared/forms/entry-add.test.ts:69` (the double's `entities`), and the import moves of `file-poll.ts` in three fixtures.

### Item 4, the changed rows on the base

`.agents/worktrees/O97-base/` holds no `package.json`, so `engineDir()` (`src/lib/data/places/engine-dir.ts:19`, which walks up to a folder holding `package.json` and `config/`) resolves to the main checkout's folder from there, and its tests read the main checkout's `config/`. The runs are therefore in a scratch copy of the base copy: `cp -R` of its `config`, `src`, `tests` and `utils` (`diff -rq` against the base copy prints nothing), with `git show f4535f495:package.json`, `git show f4535f495:docs/templates.md` and `node_modules` linked to the worktree's (the base's `package.json` differs from the worktree's by the line `"cheerio": "1.2.0"`). The config, `caserun/base-run/base.config.mts` (source under item 11), is the worktree's `vite.config.ts`, equal to the base's (`git diff f4535f495 -- vite.config.ts` prints nothing), with its `dir` the scratch copy.

Control, the base's own nine files on the base copy: `Test Files 9 passed (9)`, `Tests 212 passed | 2 skipped (214)`.

The nine changed files copied in as `*.changed.test.ts` beside the base's, then run: `Test Files 9 failed (9)`, `Tests 15 failed | 117 passed | 2 skipped (134)`. What each printed:

- G3 `tests/routes/docs/literature.changed.test.ts`: `Error: Cannot find module '../../../src/lib/server/core/reader/call.ts'`. The base's own file passes in the control, so the base answers `?sources` with `{ id: 'wos', keyed: true, available: held, key: 'wos_key' }` under `toStrictEqual` and stops with `['scopus: 401', 'scopus: 403', 'scopus: 429', 'scopus: 500']` under `toStrictEqual`: the changed row's object (with `name`, `help`, `bibtex`, `key: 'wos'`) and its four lines are not what the base gives.
- G114 `access.changed.test.ts`: `TypeError: Cannot read properties of undefined (reading 'flatMap')` at `helpOf` (the base's `harness.ts` has no `RECOVER_ROWS`). The base's own rows, the same sources, rows and routes, pass in the control under `toEqual` with `{ service, state, row, status }` and no `name`: the changed rows' `name: 'PhysioNet'`, `basic` and `help` fail there.
- G111 `sources.changed.test.ts`: `TypeError: Cannot read properties of undefined (reading 'filter')` at `rowsWithout`. The base's own refusal rows pass under `toEqual` with no `label`, so the changed rows' `label` is not what the base gives; the base's row "zenodo: the record API with each file's size and md5", the same source `{ kind: 'zenodo', record: '1199011' }` and route, lists `AUDIO.zip` and passes, so case 11's row expecting `{ refused: 'row', source: 'zenodo' }` gets a file list on the base.
- G13 `local.changed.test.ts`: `Error: Cannot find module '../../../../server/core/reader/rows.ts'`.
- G113 `safety.changed.test.ts`, 9 failed: the five name rows `- "label": "Address"` (the base's refusal has no `label`), and the four credential rows `TypeError: credentialFiles is not a function`.
- `machine-answer.changed.test.ts`, 1 failed: `- { service: wos, secret: set }` missing from the `downloads` value (the base reads the WoS secret as `literature.wos_key`).
- `options.changed.test.ts`, 2 failed: `- "... record only by a family, or by a family field with no key field ..."` against the base's `+ "... record only by a family field with no key field ..."`.
- `config-folder.changed.test.ts`, 2 failed: `- "links"`, `- "recover"`, `- "venues"` missing from the base's keys.
- `config.changed.test.ts`, 1 failed: "names a key the primary hub alone is read for, set in another hub, and applies none of it", `expected [] to deeply equal [ [ ... 'career_file' ], [ ... 'slurm.resource' ] ]`.

The copies, the scratch copy and its outputs were then deleted (item 11).

### Item 5, the primary-only finding

`src/lib/data/helpers/hub-names.ts` holds no `primary` flag. `src/lib/data/shapes/hub-keys.ts` adds:

```ts
export function primaryOnly(key: string): boolean {
    return hubFileOf(key) !== undefined && !OWN_HUB_KEYS.includes(key);
}
```

`src/lib/data/sources/config/merge/hub-layer.ts` reads it for every key of a non-primary hub's file: a primary-only key set there is the finding `hub_key_primary`, "{0} is read from the primary hub alone, and this hub is not the primary; it is not applied" (`config/text/findings.yml`, which no longer holds `row_primary_only`), and its value is not merged. New test in `tests/checks/config/config.test.ts`: "names a key the primary hub alone is read for, set in another hub, and applies none of it", a second hub setting `career_file`, `slurm.resource` and `memories_dir`: two findings with that sentence, `career_file` and `slurm.resource` keep the engine's values, `memories_dir` (a hub's own key) is applied. Check: `npx vitest run tests/checks/config/config.test.ts --testTimeout 0`: `Tests 42 passed`. `grep -rn "row_primary_only\|primary: true" src config tests --exclude=local.yml` prints one line, `tests/state/boards/board/board-rules.test.ts:469`, a board's field of the same name.

### Item 6, the empty user

- `applyAuth` (`src/lib/server/core/reader/request.ts:42-73`) takes for a `basic: true` entry only a `downloads` row that holds a `user`, so a row without one is as a missing row: a required entry leaves the source off with its help line, and the Basic pair is `${held.user}:${held.secret}` with no empty user.
- `curlConfig` (`src/lib/server/machine/runs/recover/plan.ts`) writes no config for such a row.
- The finding at read: `basicServices` (`src/lib/data/sources/config/settings/rows/read.ts`) gives the services a `basic: true` auth entry of any hub's `literature.sources` or `recover.sources` names; `userProblems` (`src/lib/data/sources/config/machine.ts`) gives a problem of key `downloads` for each row of one of them that holds no user; `heldProblems` (`src/lib/server/root/process/context/machine.ts`) runs both at start and for the portfolio's findings (`src/lib/server/root/context.ts`); the sentence is `local_user`, "the downloads row of {0} has no user, which a reader row signs in to {0} with; the row is not used".
- New rows: `access.test.ts` "PhysioNet, a credentialed set with a row that holds no user: missing, as with no row" (`downloads: [{ service: 'physionet', secret: 'pw' }]`: `{ ...PHYSIONET, state: 'missing', row: false, status: 403 }`, asked once with no credential), and `local.test.ts` "a downloads row a reader row signs in to with a user" (PhysioNet with no user is the one finding, Kaggle with a user and Synapse, a header entry, are none).
- The row 'an empty service, an empty user and a repeated kaggle row' of `local.test.ts`, judged again: it stays. It holds the `local.yml` reader's own shape faults, which hold without any reader row (an empty `service` and an empty `user` are no values); a missing user is a fault only against a row that signs in with one, which `local.yml`'s reader does not read, so it is the new machine-level finding and `access.test.ts`'s row.

Check: `npx tsc --noEmit -p .` prints nothing; `npx vitest run tests/data/sources/config/local tests/server/root --testTimeout 0`: `Tests 117 passed`.

### Item 7, the import order

`src/lib/server/core/reader/call.ts`: `import type { ReaderRow } ...` stands above `export type Fetcher`.

### Item 8, the two checks

- `tests/checks/tree/boundaries.test.ts:349-351` allow `data/sources/config/settings/rows/grammar`, `rows/links` and `rows/read` for the state layer; the comment (lines 89-92) names them: "the grammar of a reader row, the addresses of the `links` rows and the readers of `links` and `literature.prefer`, which the Literature page reads by the rule the server reads them by, so the links it draws and the order its merge takes a paper's fields in are the server's".
- `tests/checks/source/history.test.ts:34`: `const ANSWERS = ['tests/server/machine/runs/recover/answers/', 'tests/server/core/reader/answers/'];`; `proseLines` tests `ANSWERS.some((folder) => path.startsWith(folder))`; the comments say "data a server sent, or written in the shape a service answers in" and "a recorded or written web answer"; the plants use `ANSWERS[0]`, and a new plant `${ANSWERS[1]}browser/x.body` holding a date and an id gives no hit.

Check: `npx vitest run tests/checks/tree/boundaries.test.ts tests/checks/source/history.test.ts --testTimeout 0`: `Tests 17 passed`; both pass in verify 1 below.

### Item 9, verify 4 grep 4, amended

Command: `git grep -n "LITERATURE_SOURCES\|LITERATURE_NAMES\|DOWNLOAD_SERVICES\|wos_key\|scopus_key\|scopus_insttoken\|openalex_key\|semantic_scholar_key\|ncbi_key" -- src tests config docs ':!config/local.yml' ':!tests/data/sources/config/local/local.test.ts'`. Output:

```
docs/templates.md:438:#   wos_key: ""
docs/templates.md:439:#   scopus_key: ""
docs/templates.md:440:#   scopus_insttoken: ""
docs/templates.md:441:#   openalex_key: ""
docs/templates.md:442:#   semantic_scholar_key: ""
docs/templates.md:443:#   ncbi_key: ""
```

These six lines go with the Doc text of `docs/templates.md` at landing.

### Item 10, two rows of the look table

Command: `npx vitest run --config caserun/look/look.config.mts --disableConsoleIntercept` (source under item 11), the "before" from the base copy's `src/lib/views/feeds/literature/words.ts`, the "after" from the worktree's, the BibTeX lookup through the worktree's route handler with the fixture's `links` less its `doi` row and a fetcher that counts. Output:

```
429 openalex wait 12000 s
  before: daily limit reached, resets in 4 h
  after:  rate limited, try again in 4 h
429 crossref wait 7 s
  before: rate limited, try again in 7 s
  after:  rate limited, try again in 7 s
links keys without doi: arxiv, arxiv_pdf, pubmed, europepmc, scholar, shellcheck
route answer: {"ok":true,"bibtex":null}
requests sent: 0
entry from: citation_js
line: BibTeX copied, built by citation-js because no source served one
requests sent after the copy: 0
```

| View | State to put it in | Before | After |
|---|---|---|---|
| Literature, a source's chip | OpenAlex answers 429 with `x-ratelimit-remaining: 0` and `x-ratelimit-reset` 12000 s away | "daily limit reached, resets in 4 h" | "rate limited, try again in 4 h", the generic wait line with the wait the row's `wait` headers give; the word `state_daily` is gone |
| Literature card, Copy BibTeX | A paper with a DOI and no other id, in a hub whose `links` has no `doi` row | `doi.org` asked; "BibTeX copied, from doi.org" | no request; the entry is citation-js's: "BibTeX copied, built by citation-js because no source served one" |
| Settings, a second hub's file | A hub other than the primary whose `config.yml` sets a primary-only key (`career_file`, `slurm.resource`, `literature.sources`, `links`) | the key not applied, no finding | the same, and the finding "<key> is read from the primary hub alone, and this hub is not the primary; it is not applied" |
| Settings, This machine | `local.yml` with `- { service: physionet, secret: s }` and a reader row that signs in to `physionet` with a user | no finding; Recover asked PhysioNet with an empty user | the finding "the downloads row of physionet has no user, which a reader row signs in to physionet with; the row is not used"; Recover shows the set as missing a row, with the row's help |
| Recover, a refused listing | A row whose `name` differs from its `key`, answered with something that is not a file list | "<key> answered with something that is not its file list." | "<name> answered with something that is not its file list." |

### Item 11, the case-run programs

All under `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/caserun/`. What each writes:

- `case23-30.ts` makes one empty folder per run, `case30-<random>` under the system temporary folder (`mkdtempSync`), and writes nothing into it; three were on disk (`/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/case30-ksEmIr`, `case30-SZnDt0`, `case30-yvIScH`).
- `templates-check.ts` writes `templates-spliced.md` beside itself.
- `kept/kept.test.ts`, `hits.ts`, `addresses.ts`, `geo-pre.mts`, `pages2.ts` (and `pages.ts`, its first form) and this round's `base-run/base.config.mts` and `look/look.test.ts` with `look/look.config.mts` print only; their printed output was saved by the shell's redirect beside them.

`case23-30.ts`:

```ts
// Case-run program, prints only. Case 23: what retrievalOf makes of a stated source and of a
// zenodo source in a hub whose recover.sources has no zenodo row. Case 30: the findings of a
// second hub whose config.yml sets literature.sources and links, and the rows its merge carries.

import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = process.argv[2];
const { retrievalOf } = await import(`${root}/src/lib/data/snapshot/normalise-parts/retrieval.ts`);
const { loadConfig, engineDir, literatureRows, linkRows } = await import(
    `${root}/src/lib/data/sources/config.ts`
);

const kinds = new Set(['dandi', 'figshare']);
for (const value of [
    [{ kind: 'library', call: 'QA76 .F3' }],
    [{ kind: 'request', contact: 'data@example.org' }],
    [{ kind: 'derived', from: ['set-a'], script: 'build.py' }],
    [{ kind: 'zenodo', record: '12' }]
]) {
    console.log('case 23', JSON.stringify(value), '->', JSON.stringify(retrievalOf(value, kinds)));
}

const text = [
    'literature:',
    '  sources:',
    '    - { key: mine, name: Mine, format: json, address: "https://example.org/works", records: items }',
    'links:',
    '  - { key: doi, address: "https://example.org/{id|path}" }',
    ''
].join('\n');
const hub = mkdtempSync(join(tmpdir(), 'case30-'));
const engine = engineDir();
const other = loadConfig(engine, {
    hub,
    other: true,
    instead: { layer: 'hub', name: '.oculus/config.yml', text }
});
for (const finding of other.findings) {
    console.log('case 30 finding', finding.file.replace(hub, '<hub>'), finding.key, finding.message);
}
const problems: unknown[] = [];
console.log(
    'case 30 rows of the second hub merge',
    JSON.stringify(literatureRows(other.config, problems).map((row: { key: string }) => row.key)),
    JSON.stringify(linkRows(other.config, problems).map((row: { address: string }) => row.address))
);
const primary = loadConfig(engine, {
    hub,
    instead: { layer: 'hub', name: '.oculus/config.yml', text }
});
console.log(
    'case 30 the same file as the primary',
    JSON.stringify(literatureRows(primary.config, problems).map((row: { key: string }) => row.key)),
    primary.findings.length
);
```

`templates-check.ts`:

```ts
// Scratch case run: docs/templates.md with the report's Doc text spliced in, read by the
// template test's own helpers against the hub keys and the options folder's local.yml keys.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const root = process.argv[2];
const { parse } = await import(join(root, 'node_modules/yaml/dist/index.js'));
const here = process.argv[3];
const { templateBlock, templateKeys, keyDifference } = await import(
    join(root, 'tests/checks/config/template-keys.ts')
);
const { hubKeys } = await import(join(root, 'src/lib/data/helpers/hub-names.ts'));

const base = readFileSync(join(root, 'docs/templates.md'), 'utf8').split('\n');
const config = readFileSync(join(here, 'templates-config.txt'), 'utf8').replace(/\n$/, '').split('\n');
const local = readFileSync(join(here, 'templates-local.txt'), 'utf8').replace(/\n$/, '').split('\n');
if (base[126] !== '#   resource: ""') throw new Error(`line 127 is ${base[126]}`);
if (!base[435].startsWith('# Keys for the Literature')) throw new Error(`line 436 is ${base[435]}`);
if (!base[450].includes('service: synapse')) throw new Error(`line 451 is ${base[450]}`);
const page = [...base.slice(0, 127), ...config, ...base.slice(127, 435), ...local, ...base.slice(451)];
writeFileSync(join(here, 'templates-spliced.md'), page.join('\n'));
const text = page.join('\n');
const listed = Object.keys(
    (parse(readFileSync(join(root, 'config/options/local.yml'), 'utf8')) as { options: object }).options
);
console.log('config.yml', JSON.stringify(keyDifference(hubKeys(), templateKeys(templateBlock(text, '## config.yml')))));
console.log('local.yml', JSON.stringify(keyDifference(listed, templateKeys(templateBlock(text, '## local.yml')))));
const rows = readFileSync(join(root, 'tests/server/core/reader/rows.yml'), 'utf8').split('\n');
const ut = rows.slice(rows.indexOf('    browser:'), rows.indexOf('links:')).map((l) => `# ${l.slice(2)}`);
const shown = config.slice(config.indexOf('#   browser:'), config.indexOf('#   browser:') + ut.length);
console.log('UT example equals rows.yml venues.browser:', JSON.stringify(ut) === JSON.stringify(shown));
```

`templates-config.txt` and `templates-local.txt`, which it reads, are the Doc text's `config.yml` and `local.yml` lines of "### docs/templates.md" above.

`kept/kept.test.ts`:

```ts
// Case-run program, prints only: every value a Settings card of the fixture rows keeps as file
// text because no control of the card draws it, by row and path.
import { readFileSync } from 'node:fs';
import { it } from 'vitest';

const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O97';
const { fileRows } = await import(`${W}/src/lib/state/system/config/rows.ts`);
const { draftOf } = await import(`${W}/src/lib/state/system/config/editors/draft.ts`);
const { cardsOf } = await import(`${W}/src/lib/state/system/config/editors/fields.ts`);
const { FIXTURE_CONFIG } = await import(`${W}/tests/server/core/reader/rows.ts`);
const { config, shipped, text } = await import(`${W}/tests/state/system/settings/fixture.ts`);

const ROWS_TEXT = readFileSync(`${W}/tests/server/core/reader/rows.yml`, 'utf8');
const HELD = {
    ...config,
    literature: { ...(config.literature as object), ...(FIXTURE_CONFIG.literature as object) },
    recover: { ...(config.recover as object), ...(FIXTURE_CONFIG.recover as object) },
    venues: { ...(config.venues as object), ...(FIXTURE_CONFIG.venues as object) },
    links: FIXTURE_CONFIG.links
};

function walk(card: any, at: string, out: string[]): void {
    for (const [name, value] of Object.entries(card.kept ?? {})) {
        out.push(`${at}.${name} = ${JSON.stringify(value)}`);
    }
    for (const [name, value] of Object.entries(card.fields ?? {})) {
        cardsOf(value).forEach((one: any, i: number) => walk(one, `${at}.${name}[${i}]`, out));
    }
}

it('lists the kept values', () => {
    const read = fileRows('behavior.yml', shipped['behavior.yml'], HELD, {
        hubFile: { text: text(ROWS_TEXT), present: true },
        workspace: null
    });
    const out: string[] = [];
    for (const key of ['literature.sources', 'literature.prefer', 'recover.sources', 'venues.browser', 'links']) {
        const row = read.rows.find((one: any) => one.key === key);
        if (row === undefined) {
            out.push(`${key}: no row`);
            continue;
        }
        const draft = draftOf(row);
        const cards = draft === null ? [] : (draft.cards ?? draft.entries ?? []);
        out.push(`${key}: draft keys ${draft === null ? 'none' : Object.keys(draft).join(',')}`);
        (Array.isArray(cards) ? cards : []).forEach((card: any, i: number) => {
            const name = card.fields?.key ?? i;
            walk(card, `${key}[${String(name)}]`, out);
        });
    }
    console.log(out.join('\n'));
});
```

`kept/kept.config.mts`:

```ts
import base from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O97/vite.config.ts';

const SCRATCH =
    '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/caserun/kept';

export default async (env: { mode: string; command: string }) => {
    const made = await (base as unknown as (e: unknown) => Promise<Record<string, any>>)(env);
    const test = { ...made.test };
    delete test.projects;
    test.environment = 'node';
    test.dir = SCRATCH;
    test.include = ['*.test.ts'];
    test.maxWorkers = 1;
    return { ...made, test };
};
```

`hits.ts`:

```ts
// Case-run program, prints only. Each old adapter of the unchanged tree reads its recorded answer to
// case 1's words query through a stand-in call; the page it answers (total, more, cursor, hits) is
// printed as case 1's expected value. No request leaves the machine.

import { readFileSync } from 'node:fs';

const root = process.argv[2];
const size = Number(process.argv[3] ?? '3');
const { ADAPTERS } = await import(`${root}/src/lib/server/content/literature/sources/index.ts`);
const { searchOf } = await import(`${root}/src/lib/server/content/literature/request.ts`);

const NOW = Date.parse('2026-10-28T12:00:00Z');
const dir = `${root}/tests/server/core/reader/answers/literature`;
const ANSWERS: Record<string, string[]> = {
    openalex: ['openalex.json'],
    crossref: ['crossref.json'],
    semantic_scholar: ['semantic-scholar.json'],
    pubmed: ['pubmed-esearch.json', 'pubmed-efetch.xml'],
    europe_pmc: ['europepmc.json'],
    arxiv: ['arxiv.xml'],
    wos: ['wos.json'],
    scopus: ['scopus.json']
};

for (const [id, adapter] of Object.entries(ADAPTERS) as [string, any][]) {
    const read = searchOf(new URLSearchParams({ source: id, q: 'tensor decomposition EEG' }), NOW);
    if ('refused' in read) {
        console.log(id, 'refused', read.refused);
        continue;
    }
    const files = ANSWERS[id] ?? [];
    const asked: string[] = [];
    const page = await adapter.ask({
        query: read.value,
        size,
        keys: {},
        now: NOW,
        call: async (url: string) => {
            const file = files[asked.length];
            asked.push(url);
            if (file === undefined) throw new Error(`no recorded answer for request ${asked.length}`);
            return { status: 200, headers: new Headers(), text: readFileSync(`${dir}/${file}`, 'utf8') };
        }
    });
    console.log(JSON.stringify({ id, requests: asked.length, page }));
}
```

Its eight printed pages equal `tests/server/core/reader/expected/literature-pages.json` (a `node -e` comparing the saved output's `JSON.parse` of each line with the file's: `rows 8 8 equal true`).

`addresses.ts`:

```ts
// Case-run program, prints only. The addresses and headers the old adapters of the unchanged tree
// send for one query, read by a stand-in call that answers each request with a body the adapter
// stops on, so no request leaves the machine.

const root = process.argv[2];
const size = Number(process.argv[3] ?? '3');
const which = process.argv[4] ?? 'case1';
const { ADAPTERS } = await import(`${root}/src/lib/server/content/literature/sources/index.ts`);
const { searchOf } = await import(`${root}/src/lib/server/content/literature/request.ts`);

const NOW = Date.parse('2026-10-28T12:00:00Z');
const QUERIES: Record<string, Record<string, string>> = {
    case1: { q: 'tensor decomposition EEG' },
    case2: {
        q: 'tensor',
        from: '2020',
        to: '2024',
        type: 'review',
        oa: '1',
        venue: 'Nature "Medicine"',
        author: "O'Brien, J.",
        min_cites: '10',
        page: '2'
    },
    doi: { q: '10.1000/x1' },
    arxivdoi: { q: '10.48550/arXiv.2211.13793' },
    case3venue: { q: 'tensor', venue: 'Nature' },
    case3type: { q: 'tensor', type: 'article' },
    case3preprint: { q: 'tensor', type: 'preprint' }
};
const KEYS =
    which === 'case1'
        ? {}
        : {
              mailto: 'reader@example.org',
              wosKey: 'wos-secret',
              scopusKey: 'scopus-secret',
              scopusInsttoken: 'scopus-token',
              openalexKey: 'oa-secret',
              semanticScholarKey: 's2-secret',
              ncbiKey: 'ncbi-secret'
          };

for (const [id, adapter] of Object.entries(ADAPTERS) as [string, any][]) {
    const params = new URLSearchParams({ source: id, ...QUERIES[which] });
    if (id === 'europe_pmc' && which === 'case2') params.set('page', '25|AoE');
    const read = searchOf(params, NOW);
    if ('refused' in read) {
        console.log(id, 'refused', read.refused);
        continue;
    }
    const query = read.value;
    if (adapter.skips(query)) {
        console.log(id, 'skipped');
        continue;
    }
    const calls: unknown[] = [];
    try {
        await adapter.ask({
            query,
            size,
            keys: KEYS,
            now: NOW,
            call: async (url: string, headers: Record<string, string> = {}) => {
                calls.push({ url, headers });
                if (id === 'pubmed' && calls.length === 1) {
                    return {
                        status: 200,
                        headers: new Headers(),
                        text: '{"esearchresult":{"count":"9","idlist":["11","12"]}}'
                    };
                }
                throw new Error('stop');
            }
        });
    } catch {
        // The stand-in ends the adapter after it has sent what it sends.
    }
    console.log(JSON.stringify({ id, gap: adapter.gap(KEYS), calls }, null, 1));
}
```

The addresses its `case2` and `doi` runs printed are those of `tests/server/core/reader/expected/literature-requests.json` (a `node -e` comparing the sorted `"url"` values: `old 16 expected 16 same urls true`).

`geo-pre.mts`:

```ts
// Case-run program, prints only. Case 9 on the unchanged tree: the recorded GEO listing read by
// geo.ts's hand-written row pattern, and by the `pre a` selector the brief names, parsed by jsdom.

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const root = process.argv[2];
const require = createRequire(`${root}/package.json`);
const { JSDOM } = require('jsdom');
const text = readFileSync(`${root}/tests/server/machine/runs/recover/answers/geo/listing.body`, 'utf8');

const ROW = /<a href="([^"/?#]+)">\1<\/a>/g;
console.log('pattern:', [...text.matchAll(ROW)].map((row) => row[1]));

const doc = new JSDOM(text).window.document;
const hrefs = (selector: string): string[] =>
    [...doc.querySelectorAll(selector)].map((a: any) => a.getAttribute('href'));
console.log('pre a:', hrefs('pre a'));
console.log('pre a:not([href^="/"]):not([href*="?"]):', hrefs('pre a:not([href^="/"]):not([href*="?"])'));
```

`pages2.ts` (`pages.ts` is the same program with the answers folder fixed at `tests/server/core/reader/answers/browser` and the pages fixed at `words.html` and `issn.html`, where `pages2.ts` reads the folder and the extension from its arguments):

```ts
// Case-run program, prints only. Every hit the fixture browser row reads off the two recorded
// pages through the browser route's handler, as JSON, so the pages can be compared before and
// after a formatting pass.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2];
const answers = process.argv[3];
const { mintToken } = await import(`${root}/src/lib/server/core/auth.ts`);
const { LiteratureDesk } = await import(`${root}/src/lib/server/content/literature/desk.ts`);
const { handleBrowser } = await import(`${root}/src/lib/server/content/literature/browser.ts`);
const { fixtureRows } = await import(`${root}/tests/server/core/reader/rows.ts`);

const token = mintToken();
const row = fixtureRows().browser;
for (const name of ['words.' + process.argv[4], 'issn.' + process.argv[4]]) {
    const page = readFileSync(join(answers, name), 'utf8');
    const fetcher = () =>
        Promise.resolve(new Response(page, { status: 200, headers: { 'content-type': 'text/html' } }));
    const request = new Request(
        'http://127.0.0.1:8791/api/venue-browser?hub=main&q=x&size=100',
        { headers: { 'x-oculus-token': token } }
    );
    const response = await handleBrowser(request, {
        token,
        browsers: () => [{ hub: 'main', row }],
        downloads: [],
        timeoutS: 5,
        desk: new LiteratureDesk(),
        fetcher,
        agent: 'oculus/case'
    });
    console.log(name, JSON.stringify(await response.json()));
}
```

`base-run/base.config.mts` (item 4):

```ts
// Runs the changed test files copied into the base copy against the base copy's code, with the
// worktree's vite config, which equals the base's (git diff f4535f495 -- vite.config.ts is empty).
import base from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O97/vite.config.ts';

const BASE =
    '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/caserun/base-run/base-clean';

export default async (env: { mode: string; command: string }) => {
    const made = await (base as unknown as (e: unknown) => Promise<Record<string, any>>)(env);
    const test = { ...made.test };
    delete test.projects;
    test.environment = 'node';
    test.dir = BASE;
    test.include = (process.env.BASE_INCLUDE ?? 'tests/**/*.changed.test.ts').split(',');
    test.maxWorkers = 1;
    test.testTimeout = 0;
    test.hookTimeout = 0;
    return { ...made, test };
};
```

The modules of the base copy's `src/lib/server` and `src/lib/data` import nothing through `$lib` (`grep -rlF "from '\$lib" .../base-clean/src/lib/server .../base-clean/src/lib/data | wc -l` prints 0), so SvelteKit's `$lib` alias, which names the worktree's `src/lib`, reaches none of the code these tests run.

`look/look.test.ts` (item 10):

```ts
// Case-run program, prints only: the two look-table rows of repair round 1 item 10, before (the
// base copy's code) and after (the worktree's).
//   1. The chip line of a source answered 429, for OpenAlex with its reset 12000 s away and
//      Crossref with Retry-After 7.
//   2. Copy BibTeX by DOI with links that hold no `doi` row: the route's answer, how many requests
//      it sent, and the line the page then says for a paper with a DOI and no other id.
import { it } from 'vitest';

const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O97';
const B =
    '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/caserun/base-run/base-clean';

/** A chip's run of a source answered 429 with a wait. */
function limited(wait: number) {
    return {
        asking: false,
        state: 'limited',
        wait,
        hits: [],
        total: null,
        more: false,
        cursor: null,
        cached: false
    };
}

it('prints the look rows', async () => {
    const words = async (root: string) => {
        const config = await import(`${root}/src/lib/data/sources/config.ts`);
        const text = await import(`${root}/src/lib/state/shared/words/text.ts`);
        text.setCatalog(config.textCatalog(config.loadConfig(config.engineDir()).config));
        return import(`${root}/src/lib/views/feeds/literature/words.ts`);
    };
    const before = await words(B);
    const after = await words(W);
    for (const [source, wait] of [
        ['openalex', 12000],
        ['crossref', 7]
    ] as const) {
        console.log(`429 ${source} wait ${wait} s`);
        console.log(`  before: ${before.stateWords(source, limited(wait), 5)}`);
        console.log(`  after:  ${after.stateWords(limited(wait), 5)}`);
    }

    const { handleLiterature } = await import(`${W}/src/lib/server/content/literature/handler.ts`);
    const { LiteratureDesk } = await import(`${W}/src/lib/server/content/literature/desk.ts`);
    const { mintToken } = await import(`${W}/src/lib/server/core/auth.ts`);
    const { fixtureRows } = await import(`${W}/tests/server/core/reader/rows.ts`);
    const { entryFor } = await import(`${W}/src/lib/state/feeds/literature/bibtex.ts`);
    const rows = fixtureRows();
    const links = rows.links.filter((row: { key: string }) => row.key !== 'doi');
    const token = mintToken();
    let sent = 0;
    const fetcher = async () => {
        sent += 1;
        return new Response('@article{x, title = {X}}', { status: 200 });
    };
    const options = {
        token,
        rows: rows.literature,
        links,
        downloads: [],
        mailto: 'someone@example.org',
        settings: { timeoutS: 5, perSource: 25, cacheMin: 30 },
        desk: new LiteratureDesk(),
        fetcher,
        agent: 'oculus/test'
    };
    const ask = async (url: string) => {
        const request = new Request(`http://127.0.0.1:8791${url}`, {
            headers: { 'x-oculus-token': token }
        });
        return (await handleLiterature(request, options)).json();
    };
    console.log(`links keys without doi: ${links.map((row: { key: string }) => row.key).join(', ')}`);
    console.log(`route answer: ${JSON.stringify(await ask('/api/literature?bibtex=&doi=10.1000%2Fx1'))}`);
    console.log(`requests sent: ${sent}`);
    const hit = {
        key: 'k',
        type: 'article',
        title: 'Block-term tensor regression',
        authors: ['John Smith'],
        year: 2024,
        doi: '10.1000/x1',
        ids: {}
    };
    const entry = await entryFor(hit, [], ask);
    console.log(`entry from: ${entry.from}`);
    console.log(`line: ${after.copiedWords(entry)}`);
    console.log(`requests sent after the copy: ${sent}`);
});
```

`look/look.config.mts`:

```ts
// Runs look.test.ts with the worktree's vite config, in node, from this folder. A module of the
// base copy that imports `$lib/...` gets the base copy's module, not the worktree's: SvelteKit's
// alias names the worktree's src/lib, and this plugin maps what it resolves back into the base copy
// for an importer inside the base copy.
import base from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O97/vite.config.ts';

const SCRATCH =
    '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/caserun/look';
const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O97';
const B =
    '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/caserun/base-run/base-clean';

const baseLib = {
    name: 'case-run:base-lib',
    enforce: 'pre' as const,
    async resolveId(this: any, source: string, importer: string | undefined) {
        if (importer === undefined || !importer.startsWith(B)) return null;
        if (!source.startsWith(`${W}/src/lib/`)) return null;
        return this.resolve(source.replace(W, B), importer, { skipSelf: true });
    }
};

export default async (env: { mode: string; command: string }) => {
    const made = await (base as unknown as (e: unknown) => Promise<Record<string, any>>)(env);
    const test = { ...made.test };
    delete test.projects;
    test.environment = 'node';
    test.dir = SCRATCH;
    test.include = ['look.test.ts'];
    test.maxWorkers = 1;
    test.expect = { requireAssertions: false };
    return { ...made, plugins: [baseLib, ...(made.plugins ?? [])], test };
};
```

The history-word check of verify 8, `scratchpad/o97-history.sh`, prints only:

```bash
#!/bin/bash
# Prints the added comment lines and test titles of the step's diff that hold a history word.
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O97 || exit 1
WORDS='\b(O[0-9]{2,3}|Q[0-9]+|D[0-9]+[a-z]?|G[0-9]{2,3}|20[0-9]{2}-[0-9]{2}|before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|today|was|were|old|formerly|replac(e|es|ed|ing)|anymore|now)\b'
{
    git diff -U0 f4535f495 -- src tests utils config ':!tests/server/core/reader/answers' ':!tests/server/core/reader/expected'
    git ls-files --others --exclude-standard -- src tests utils config | grep -v '/answers/\|/expected/' | while read -r f; do
        git diff -U0 --no-index /dev/null "$f"
    done
} | awk '/^\+\+\+ /{file=substr($0,7); next} /^\+/{print file": "substr($0,2)}' |
    grep -E '^[^:]+: *(//|\*|/\*|#|<!--)|(describe|it|test)(\.each\([^)]*\))?\(' |
    grep -E "$WORDS"
```

Deleted with `rm -rf`, with what they wrote and the outputs saved beside them: under `caserun/`, `case23-30.ts`, `case23-30-after.txt`, `templates-check.ts`, `templates-config.txt`, `templates-local.txt`, `templates-spliced.md`, `kept/`, `hits.ts`, `addresses.ts`, `geo-pre.mts`, `pages.ts`, `pages2.ts`, `pages-before.txt`, `pages-body.txt`, `pages-html.txt`, `case1-old.err`, `case1-old.jsonl`, `case2-old.txt`, `doi-old.txt`, `checked/`, `a.txt`, `b.txt`, `cmds.txt`, `my-text.txt`, `summary.txt` and `summary1.txt` to `summary15.txt`, `grep2-before.txt`, `handback1.md`, `hub-names-base.ts`, `issn-curl-trim.txt`, `issn-new-trim.txt`, `words-curl-trim.txt`, `words-new-trim.txt`, `write-probe.txt`, `base-run/` (with the base's scratch copy `base-clean/`) and `look/`; the three `case30-*` folders under `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/`; `scratchpad/o97-history.sh`; and the vitest results cache `node_modules/.vite/vitest/` that a base run wrote into `.agents/worktrees/O97-base/`. `ls caserun` now prints only the files of an earlier step: `case.config.mts case17-after.txt case17-before.txt dom final-out.txt final-r1.txt first-out.txt strip.config.mts tests`; `ls -d` of the three `case30-*` folders and of `o97-history.sh` prints "No such file or directory" for each; `ls -la .agents/worktrees/O97-base` prints `config src tests unused-exports.txt utils`, all dated Oct 28 08:21-08:22.

### Verify before you report

Each run from the worktree's root after the round's last change.

- Verify 1: exit 1 on `tests/checks/config/templates.test.ts` alone, 2 tests, as the round allows; the lines it prints are under "Verify 1" above, with the load timeouts of the two runs before it.
- Verify 2, the ASCII gate over the 175 changed and added files: prints nothing.
- Verify 3, `sh utils/unused-exports.sh` against `O97-base/unused-exports.txt`: `22c22 < src/lib/server/accounts/connect/oauth.ts: READ_TIMEOUT_MS, callbackPath, CONNECT_MS --- > src/lib/server/accounts/connect/oauth.ts: callbackPath, CONNECT_MS`, the only difference; no new unused export.
- Verify 4, grep 1: prints nothing. Grep 2: `config/text/views/sources/venues.yml` 29 40; `model-entities.ts` 486 488 490 491; `model-search.ts` 165 166; `hits.ts` 4 18 19 23 93 94 96 114; `answers.ts` 29; `bibtex.ts` 6; `lookup.ts` 2 11 12 14 31 40 41 42 44 45 46 59 60 61 63 64 71; `merge.ts` 5 6 7 9 18 19 34 35 38 84 98 101 102 105 114 115 175 178 181 182 198 222 223 240 250; `Literature.svelte` 18; `entry-add.ts` 31: the same files and lines as "Verify 4, grep 2's remaining lines", each judged there. Grep 3: prints nothing. Grep 4 as item 9 amends it: `docs/templates.md:438-443` alone.
- Verify 6: no changed source file over 880 lines and no component over 520 (largest `src/lib/server/root/watch/git.ts` 878, `src/lib/server/root/context.ts` 864, `src/lib/state/system/config/editors/fields.ts` 852, `Cards.svelte` 488); `sh utils/folder-check.sh` exit 0.
- Verify 7: the Hub text block extracted with `awk` and compared with `diff` against `tests/server/core/reader/rows.yml`: prints nothing, exit 0.
- Verify 8: the history-word check above, 63 lines, its words `before` 33, `was` 11, `were` 5, `replaces` 3, `still` 2, `now` 2, `replace` 1, `replaced` 1, and the guarded-entry ids G111, G114, G134, G136, G137, G138, G45. Each was read: the hits listed under "Verify 8, history words" above, plus this round's `request.ts` "takes no row that holds none, as if the row were missing", a subjunctive. None names a package, a date or an earlier form of the code.
- Verify 9: the sentences this round adds or changes (the catalog's `select`, `expect`, `host` and term `params` help, the `Term` doc comment, the `local_user` and `hub_key_primary` findings, the comments of `boundaries.test.ts` and `history.test.ts`, the test titles of items 2, 5 and 6) read against the prose rules: no departure found.
- The item test files, each run with `npx vitest run <file>`: `reader.test.ts` 72, `literature.test.ts` 2, `sources.test.ts` 36, `access.test.ts` 17, `safety.test.ts` 45, `plan.test.ts` 15, `runs.test.ts` 16, `browser.test.ts` 10, `entry-add.test.ts` 18, `local.test.ts` 31, `sparse-card.test.ts` 15, all passed.

## Corrected at landing

The review over round 1 (Finding 4) found sections of this report left as round 0 wrote them. Corrected here: the three outside paths and the `hub-layer.ts` reason under "Files outside the brief's paths", and the case 30 quote's words. The line counts of "Line counts" are round 0's; after round 1 they read `grammar.ts` 499, `context.ts` 864, `listing.ts` 346, `request.ts` 243, `local.test.ts` 307 and `sources.test.ts` 693 (`wc -l`, the reviewer's).
