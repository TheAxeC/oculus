# O97 report: one configurable reader for the journal browser, the literature sources and the Recover sources

NOT done: verify 1 (`npm run test:quick -- --base f4535f495`) is red, for three reasons outside the code this step writes, each a finding below with its fix. (1) `tests/checks/tree/boundaries.test.ts`: the state layer imports the three new typed readers of `data/sources/config/settings/rows/` (`grammar`, `links`, `read`), which the state row does not list. (2) `tests/checks/source/history.test.ts`: it reads only `tests/server/machine/runs/recover/answers/` as recorded data, so the recorded answers of `tests/server/core/reader/answers/` throw "no reader is known for its language". (3) `tests/checks/config/templates.test.ts`: `docs/templates.md` lacks the new keys until the orchestrator writes this report's Doc text at landing (item 10 forbids the edit here). Each of (1) and (2) passes only after its check's rule is widened, which the launch rules forbid a builder to do; the proposed text is under "What in the brief is wrong or impossible". Verify 4's fourth grep also prints lines: `docs/templates.md:438-443` (Doc text at landing) and `tests/data/sources/config/local/local.test.ts:132,134,145`, which case 21 requires. One open item for Axel is new (kept values a card cannot edit, below). Everything else in the brief, the 529 (a) ruling and the five case rulings is built.

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

### New open item from this step, for Axel

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

**Case 1.** Command: `node hits.ts <worktree> 3`. Expected pages saved at `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/caserun/case1-old.jsonl`.

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

**Case 2.** Command: `node addresses.ts <worktree> 25 case2` and `... doi`, saved as `case2-old.txt` and `doi-old.txt` in the same scratch folder.
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
| Item 5, Recover sources | DONE | `sources.test.ts` 35 passed, `access.test.ts` 16, `safety.test.ts` 45, `plan.test.ts` 15, `runs.test.ts` 16 |
| Item 6, links | DONE | case 14 and 26 rows pass |
| Item 7, the journal browser | DONE | `browser.test.ts` 10 passed; `entry-add.test.ts` 18 passed |
| Item 8, the keys out of `local.yml` | DONE | `local.test.ts` 30 passed; grep 4 below |
| Item 9, Settings | DONE | `sparse-card.test.ts` 15 passed; the look at landing |
| Item 10, the pages | DONE as Doc text | section "Doc text"; `docs/palette.md` regenerated by `npm run docs:palette` |
| Item 11, the hub's rows | DONE as Hub text | section "Hub text"; verify 7 below |
| Verify 1 | NOT DONE (red) | see "Verify 1" below |
| Verify 2, ASCII gate | DONE | over the 170 changed files of `git status --porcelain -uall` (deleted files and `.scratch/` left out): prints nothing |
| Verify 3, unused exports | DONE | `diff O97-base/unused-exports.txt` with `sh utils/unused-exports.sh`: only `22c22 < src/lib/server/accounts/connect/oauth.ts: READ_TIMEOUT_MS, callbackPath, CONNECT_MS --- > src/lib/server/accounts/connect/oauth.ts: callbackPath, CONNECT_MS` (the timed fetch moved to `core/reader/timed.ts`, where it is used); no new unused export |
| Verify 4, grep 1 | DONE | prints nothing |
| Verify 4, grep 2 | DONE under ruling (a) | the remaining lines quoted and judged below |
| Verify 4, grep 3 | DONE | prints nothing |
| Verify 4, grep 4 | NOT DONE | 9 lines: `docs/templates.md:438-443` (Doc text at landing) and `local.test.ts:132,134,145` (case 21) |
| Verify 5, each new or changed test before and after | DONE | below |
| Verify 6, `wc -l` and folder-check | DONE | no source file over 880, no component over 520 (largest `src/lib/server/root/watch/git.ts` 878, `Cards.svelte` 488); `sh utils/folder-check.sh` exit 0 |
| Verify 7, Hub text against `rows.yml` | DONE | below |
| Verify 8, history words | DONE | below |
| Verify 9, prose rules | DONE | below |

### Verify 1

Command: `npm run diagrams && npm run docs:palette && npm run test:quick -- --base f4535f495`, after the last change (output in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o97-verify1-rerun.txt`). The lines it prints:

```
test:quick: 195 changed file(s), from git since f4535f495
test:quick: 343 test file(s)
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      ASCII gate (1.0 s)
ok      svelte-kit sync (2.0 s)
ok      eslint (2.3 s)
ok      svelte-check (17.8 s): 1793221239226 COMPLETED 553 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
FAILED  vitest checks (220.4 s)
 FAIL  |unit| tests/checks/config/templates.test.ts > docs/templates.md > shows every key of a hub settings file in the config.yml template, and no other
 FAIL  |unit| tests/checks/config/templates.test.ts > docs/templates.md > shows every local.yml key of the options folder in the local.yml template, and no other
 FAIL  |unit| tests/checks/tree/boundaries.test.ts > layer boundaries > holds across src/lib
 FAIL  |unit| tests/checks/source/history.test.ts > no history in code > names no package id, date or session in any comment
 Test Files  3 failed | 14 passed (17)
      Tests  4 failed | 305 passed | 9 skipped (318)
ok      vitest (225.4 s): Duration  216.02s (transform 131.87s, setup 0ms, import 322.28s, tests 497.17s, environment 12.29s)
ok      vitest slow (379.3 s): Duration  370.03s (transform 16.70s, setup 0ms, import 171.48s, tests 1295.60s, environment 21ms)
test:quick: 381.5 s; failed: vitest checks
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
exit 1
```

The four failures are the three checks under "What in the brief is wrong or impossible", with their messages quoted there. The green tiers do not cover the tests that reach no changed file, the build, or the lint of unchanged files, as the run's last line says.

`tests/state/forms/choices.test.ts` 'offers the same venues when the hub keys the venues collection journals (G132)' timed out at 5000 ms in one of the two full runs of this command (`Error: Test timed out in 5000ms.`) and passed in the other. Run alone with `npx vitest run tests/state/forms/choices.test.ts --reporter=verbose`, it takes 207 ms on this tree and 203 ms on the base copy (`Tests 11 passed (11)` on both), so the step does not make it slower; a timeout of this test under the full run's load can recur at landing.

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
| G13 case 21 `tests/data/sources/config/local/local.test.ts` | `AssertionError: expected 'local.yml: downloads[0].service must ...' to be null`, 1 failed, 29 skipped | 30 passed |
| G3, G45, G111 to G114, lint and Literature save (kept tables) | `Test Files 9 passed (9)`, `Tests 162 passed (162)` | `literature.test.ts` 2, `literature-merge.test.ts` 1, `sources.test.ts` 35, `access.test.ts` 16, `safety.test.ts` 45, `plan.test.ts` 15, `runs.test.ts` 16, `lint-route.test.ts` 10, `edit/literature.test.ts` 24, all passed |

The related folders together (`npx vitest run tests/server/core/reader tests/state/sources/registries tests/state/system/config tests/state/system/settings tests/state/feeds tests/server/machine/runs/recover tests/views/shared/forms tests/data/sources/config tests/routes/docs tests/routes/hubs tests/server/edit tests/server/machine/runs/lint tests/server/machine/apps tests/checks/config tests/ui/html.dom.test.ts tests/server/accounts`): `Test Files 1 failed | 98 passed (99)`, `Tests 2 failed | 1502 passed | 9 skipped (1513)`; the two failures are `templates.test.ts`'s, which the Doc text ends.

### Cases after the build

- Cases 1 to 3, 5 to 7, 12 to 14, 15's literature half, 16's User-Agent of every reader request, 20, 24 to 27: rows of G136's test, `reader.test.ts`, 72 passed. Case 16's check is in case 1's table (every request of the eight searches carries `READER_AGENT`, which matches `^oculus/\d+\.\d+\.\d+`) and in figshare's listing.
- Cases 4 and 29's credential rows: G3's `literature.test.ts` and G113's `safety.test.ts`, passed.
- Cases 8, 9 and 11: G111's `sources.test.ts`, 35 passed, its rows 'a kind no row of its hub names refused: the kind named, before any request' and 'a second hub whose own recover.sources names the kind serves its own dataset' included.
- Case 10: G114's `access.test.ts`, 16 passed.
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
case 30 finding <hub>/.oculus/config.yml literature.sources literature.sources is read from the primary hub alone, and this hub is not the primary; it is not used
case 30 finding <hub>/.oculus/config.yml links links is read from the primary hub alone, and this hub is not the primary; it is not used
case 30 rows of the second hub merge [] []
case 30 the same file as the primary ["mine"] 0
```

  A stated kind has no Recover control and no missing-row line; a `zenodo` source in a hub with no `zenodo` row has no Recover control and is named in `unread`, the line the card draws. A second hub's `literature.sources` and `links` are each a finding of its file and are not merged; the same file read as the primary's gives its row and no finding.

### Verify 7

The "Hub text" section below is the text of `tests/server/core/reader/rows.yml`. Command: the section's fenced block extracted with `awk` and compared with `diff` against the file, `awk '/^## Hub text/{h=1} h && /^```yaml$/{f=1; next} f && /^```$/{exit} f' O97-report.md | diff - tests/server/core/reader/rows.yml`, prints nothing. The two template blocks of the Doc text compared the same way with the checked scratch files `caserun/templates-config.txt` and `caserun/templates-local.txt` print nothing.

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
- `src/lib/data/sources/config/merge/merge.ts`, `merge/hub-layer.ts`, `src/lib/server/root/context.ts`: the finding of a primary-only key (`literature.sources`, `literature.prefer`, `links`) set in another hub's `config.yml` (the brief's premise that HUB_LIST already gives it was false, below).
- `src/lib/server/edit/writes/config/config-fit.ts`: the server's write fits a family holding one record and a text-or-record field.
- `src/lib/state/system/config/editors/draft.ts`, `origins.ts`, `src/lib/views/system/workbench/editors/Cards.svelte`, `Editor.svelte`: the Add field menu and the sparse card are drawn by the family editor in `views/system/workbench/editors/`, not under `workbench/settings/` as the brief's path names.
- `src/lib/server/accounts/connect/api.ts`, `oauth.ts`, `src/lib/server/accounts/mail/poll.ts`, `calendar/poll.ts`: import the timed fetch from `core/reader/timed.ts`.
- `src/lib/server/edit/feeds/feed-route.ts`, `src/lib/server/machine/runs/lint/routes.ts`, `src/routes/api/(machine)/lint/+server.ts`: hand the `links` rows to the Literature save and to the ShellCheck reader (item 6).
- `src/routes/api/(docs)/venue-browser/+server.ts`: the journal browser's route.
- `src/lib/server/machine/runs/recover/verify.ts`: imports the checksum type from the model, since `files.ts` no longer defines it.
- `src/lib/views/sources/data/DatasetCard.svelte`: the card's Recover control and the missing-row line (item 5).
- `src/lib/server/files/fs/lsp-edit.ts`, `open-files.ts`, `src/lib/server/files/source/source-bytes.ts`, `source.ts`, `src/lib/server/files/workspace/follow.ts`, `src/lib/server/machine/apps/host/manager.ts`, `process.ts`, `src/lib/server/machine/apps/tools/workspace/workspace.ts`, `src/lib/server/machine/runs/lint/eslint.ts`, `lint/writing/comments.ts`, `lint/writing/folder.ts`, `src/lib/server/root/watch/apps.ts`, `autofetch.ts`, `git.ts`: importers of the two moved file helpers (inside decision 1's path).
- Tests: `tests/fixtures/doubles.ts`, `tests/server/machine/apps/world/hosts-world.ts`, `tests/server/machine/runs/lint/lint-fixture.ts` (the moved `Clock`, the `links` rows); `tests/server/edit/literature.test.ts`, `tests/ui/html.dom.test.ts` (`saveLiterature` takes the `links` rows); `tests/checks/config/config-folder.test.ts`, `tests/data/sources/config/catalog/options.test.ts` (the catalog's new keys); `tests/state/system/settings/fixture.ts` (`bareLists`, which `sparse-card.test.ts` and `collection-fields.test.ts` share) and `collection-fields.test.ts`.
- `docs/diagrams/*.dot`, `*.svg` and `docs/palette.md`: regenerated by `npm run diagrams` and `npm run docs:palette`.

## Judgment calls the brief left open

- The reader's folder and the splits above; the timed fetch in `core/reader/timed.ts`.
- `literature.prefer`, a new primary-only key: the merge took a field from a source named in code, and no code names a source, so the order is the hub's (`fields`, `abstract`, `pdf`, each a list of source keys).
- The primary-only flag on HUB_LIST (`primary: true`), applied to `literature.sources`, `literature.prefer` and `links`, with the finding `row_primary_only`.
- `venues.browser` is a family holding one record (`holds: record`), with a `key` field.
- A field of a row is a path text or a `{ path, op, ... }` record; a text field with `holds: record` and `fields` takes either, and the card draws each.
- A required `auth` entry with its `downloads` row is asked once with the credential, which keeps G114's asked column; an optional one is asked without it, then with it on 401 or 403.
- A Recover refusal names the row by its `key` (the kind), so G111's rows keep their wording.
- The per-kind field checks of the removed readers (GEO's `files` required, figshare's collection or article, a `url` file with both checksums) are the row's `holes` patterns and the reader's refusals.
- A generic list of a row must not be empty; `records` may be absent on a row with `then`; a repeated pick name takes its last item.
- `expect` on a row (ruling (b)): a path or selector with `holds`, refused naming the row when the answer lacks it.
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
| Literature search | The Hub text written into the hub | The same eight sources | The eight rows by `name` in their order; WoS and Scopus off with "Needs the downloads row wos in local.yml." and the row's help; Copy BibTeX's line "BibTeX copied, from <row name>" or "BibTeX copied, from the DOI link" |
| Literature card | A hit with a DOI, with and without a `doi` link row | The address written in code | The `doi` row's address; with no such row, no link |
| Venues, a card | A venue with `fee` and `open_access` set | No such lines | "fee ..." and "open access ..." lines |
| Venues, a card's menu | A venue with `issn`, in a hub whose `venues.browser` has `query.issn` | No action | "Read from the browser"; after it the entry holds `fee` and `open_access` and History holds one record; with no ISSN the action is off with "This venue has no ISSN to ask the browser by; add one to its issn field." |
| Journal Browser (Registries, after Venues) | The hub holding the UT row | No view | Words box, Filter, Sort, Page size, Search; hits with title, ISSNs, publisher, fee, open access and Add; with no hub naming a browser, "No hub names a journal browser. ..." |
| Data, a card | A dataset whose source kind no row of its hub names | Recover control drawn | No Recover control; the line "No row of `recover.sources` in the `.oculus/config.yml` of the hub <hub> reads the source kind <kind>, so Recover does not run this set." |
| Recover | A credentialed PhysioNet set with no `physionet` row | Fetch off with the PhysioNet setup words | Fetch off with `- { service: physionet, user: <user name>, secret: <secret> }` and the row's `help` |
| Settings, Literature | `literature.sources` with the Hub text | No such key | One card per row with only the fields it sets and "Add field" offering the others; values kept as file text listed under the new open item |
| Settings, This machine | `local.yml` | Six Literature key rows | `literature.mailto` only; the `downloads` rows as they are |

## What in the brief is wrong or impossible

- **Verify 1 cannot pass with the brief's paths.** Three checks outside the paths fail, and two of them pass only after their rule is widened:
  - `tests/checks/tree/boundaries.test.ts`: the state row lists the data modules the state layer may import one by one, `data/sources/config/settings/{connectors,files,latex,lint,machine,problems,reader,hub-slice}` among them. Item 6 says the page reads the `links` rows through the configuration it receives, so `state/feeds/literature/lookup.ts`, `merge.ts` and `scholar.ts` import `rows/grammar` (types), `rows/links` and `rows/read`. Proposed change: add `'data/sources/config/settings/rows/grammar'`, `'data/sources/config/settings/rows/links'` and `'data/sources/config/settings/rows/read'` to the state row after `'data/sources/config/settings/reader'`, and in the comment at line 84 change "the seven files of `data/sources/config/settings/`" to "the seven files of `data/sources/config/settings/` and the readers of its `rows/` folder (the reader rows' grammar, the `links` rows' addresses and the readers of the four keys)". Its output now: seven violations, `state/feeds/literature/lookup.ts imports data/sources/config/settings/rows/grammar`, `... rows/links`, `merge.ts ... rows/grammar`, `... rows/links`, `... rows/read`, `scholar.ts ... rows/grammar`, `... rows/links`.
  - `tests/checks/source/history.test.ts`: `ANSWERS = 'tests/server/machine/runs/recover/answers/'` (line 33) is the one folder whose `.body` and `.headers` files are read as data. Proposed change: `const ANSWERS = ['tests/server/machine/runs/recover/answers/', 'tests/server/core/reader/answers/'];` with line 98 reading `ANSWERS.some((folder) => file.split(sep).join('/').startsWith(folder))`, the comment at lines 28-31 "The folders of the answers the reader's and the Recover tests replay", and the planted file of line 189 under `ANSWERS[0]`. Its output now: `Error: tests/server/core/reader/answers/browser/issn.body does not parse: no reader is known for its language`.
  - `tests/checks/config/templates.test.ts`: two failures until the Doc text of `docs/templates.md` lands, `missing: [links, literature.prefer, literature.sources, recover.sources, venues.browser]` and `extra: [literature.ncbi_key, literature.openalex_key, literature.scopus_insttoken, literature.scopus_key, literature.semantic_scholar_key, literature.wos_key]`. The Doc text below was checked by a scratch run of the test's own helpers on the base page with it spliced in (`node templates-check.ts`): `config.yml {"missing":[],"extra":[]}`, `local.yml {"missing":[],"extra":[]}`, `UT example equals rows.yml venues.browser: true`.
- **Verify 4 grep 4 against case 21.** Case 21 requires a test holding `literature.wos_key`, and grep 4 must print nothing over `tests`: `local.test.ts:132`, `:134` and `:145` stay. Grep 4 also reaches `docs/templates.md:438-443`, which item 10 forbids this step to edit.
- **The primary-only finding.** Item 3 says `literature.sources` and `links` in another hub are a finding "as every primary-only key of HUB_LIST is". On the base no HUB_LIST key gives such a finding (only `local.yml` has `local_other_hub`); the step adds the flag and the finding.
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
