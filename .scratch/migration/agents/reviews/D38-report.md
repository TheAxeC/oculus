# D38 report: the Literature search view, built whole

## 0. NOT done

1. **The look on TEST is not done.** No browser, server or tmux ran here (the task forbids them). Nothing of the view was drawn in a browser. The view was only rendered to a string by a scratch test (Head, LiteratureCard, AddForm and the whole Literature component through `render` from `svelte/server`), whose output shows the markup and the words of the catalog. Cases 1, 5, 6, 7, 10, 13 to 17, 19, 20 against the live sources and every "drawn" sentence of a case are the orchestrator's look; what is checked here for each is in section 4.
2. **Semantic Scholar was not run over a recorded answer.** Keyless it answers 429 (recorded in `fixtures/s2-search.json`), so its adapter was run over a hand-written answer in the documented Graph API shape (section 4, case 6 row), not over a real one. WoS and Scopus ran over the documented samples (case 58).
3. **One run of `npx vitest run tests/checks` showed `tests/checks/tree/size.test.ts > is on the list with a count it has not passed` failing (1 of 229); its output was not kept.** The same command passed 229 of 229 in each of the six runs after it, and `size.test.ts` alone passes. The cause is not known; not verified.

Full-list runs (`npm run test:quick`) of the first build: **8 executions** with their logs kept (`$S/D38-quick1.log` to `D38-quick5.log` direct, `$S/D38-checks3.log` to `D38-checks5.log` inside `checks.sh`). The last two (direct run 5 and the `checks.sh` after it) are on the final tree: `test:quick: 29.9 s (limit 45.0 s); every command passed` and `checks: 1 commands passed`.

## 1. Open items of the state file (verbatim from `orchestrator-state.md`, "Open items", read from the main checkout)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

- Z545 (raised 2026-10-05, A3's brief check, implied input I4). A scheduled run of an update task is an interactive Claude session that never ends by itself, so at `@hourly` each run leaves one more idle Claude terminal open (24 a day). (a) A due time while the task's earlier terminal is still open, idle or not, starts nothing and is recorded as skipped. For: nothing piles up; VS Code's Automations run one session at a time. Against: the schedule stops until you close the earlier terminal. (b) A due time while the earlier run is idle ends that earlier terminal (oculus started it) and then starts the new run; a run that is still working is skipped. For: the schedule keeps running and one terminal per task stays open. Against: an idle session you were reading is closed under you, with no question, which breaks `DESIGN.md:153` ("oculus stops only processes it started itself, behind a confirmation naming the process"); A3's brief then adds an exception for a scheduled run's own idle terminal to that sentence. (c) Every due time starts a new terminal and the earlier ones stay. For: nothing is closed. Against: idle Claude processes pile up, the lazy option. Recommendation: (b).

- Z543 (raised 2026-10-05, D20's repair round 1). A new guarded entry for D20's Cancel of a merge, rebase or cherry-pick needs your yes (Z392): "G44. A git write stopped by Cancel says what it left in progress: a merge, a rebase or a cherry-pick cancelled midway is named in the answer, and the view shows it with its Abort." Code: `stoppedOn`, `cherryPick`, `continueRebase` in `src/lib/server/git/git-index.ts`, `src/lib/server/git/git-routes.ts`. Test: `tests/server/git/git-write.test.ts` 'names the merge a cancelled run left in progress, and nothing once it is aborted', `tests/routes/git/git.test.ts` 'says the merge a cancelled run left in progress'. (a) Yes: a user who cancels a merge and goes on working inside it can commit half a merge; the suite keeps the answer true. (b) No: the two tests are removed at landing. Recommendation: (a). The lazy option is (b).

- Z538 (raised 2026-10-05, D44's brief check 4). A new guarded entry for D44's two tests needs your yes (Z392): "G43. Submit runs only the plan the reader confirmed, equal to the plan the server computes at the press, and a job script whose code and sourced files never name `/local/$SLURM_JOB_ID` gets the warning before Submit." Code: `src/lib/server/machine/hpc/submit.ts`, `scratch.ts`. Test: `tests/server/machine/hpc/submit.test.ts`, the two tables. (a) Yes: a wrong copy or a job that writes to the shared home without warning is caught by the suite. (b) No: no tests; the look and quoted runs are D44's only check. Recommendation: (a). The lazy option is (b).

- Z539 (raised 2026-10-05, D44's brief check 5). D44's look can prove the copy and `sbatch` end to end only with one real job on your cluster account. (a) At the look I submit a one-minute job that only writes `hostname` and the date to its log, a new script `code/hpc/oculus_submit_check.slurm` in engram (its `code/` is 82 files, 569 KB), on the `main-cpu` partition (`docs/HPC-UTwente-howto.md:221`), and read its log. (b) You name an existing script and I submit that. (c) No real submit: the look stops at the confirm, and the rsync over ssh and the remote `sbatch` are never run before D44 lands. Recommendation: (a). The lazy option is (c).

- D38 raises no open item of its own: `radar-add` joins the open kinds of DESIGN.md `How it writes` (section 13, row 3).

## 2. The coordinator's round 0 ruling, as carried out

1. PubMed author clause is `<author>[au]` without quotes, with `"`, `[`, `]`, `(` and `)` removed first; the venue clause stays `"<venue>"[ta]` (`src/lib/server/content/literature/sources/pubmed.ts:156-160`). Cases 18 and 21 rerun live, keyless, paced, through the adapter (`$S/live1821.mts`, 2 searches) and by direct `esearch` counts:

```
case 18 tensor regression + author Faes | state ok | total 3 | hits 3 | first authors ["A Faes","M M Van Hulle"]
case 21 author Lozano Jiménez (with tensor) | state ok | total 0 | hits 0
esearch term sent: tensor+regression+AND+Faes[au]       and       tensor+AND+Lozano+Jiménez[au]
tensor regression AND Faes[au]      3
tensor regression AND "Faes"[au]    0
Lozano Jiménez[au]               19
Lozano Jimenez[au]                  19
```

The Lozano Jiménez count with the word `tensor` is 0 because that author has no PubMed paper matching `tensor`; alone the author clause finds 19 papers, with the accent or without it.

2. OpenAlex `select=` carries `locations` (`sources/openalex.ts`, the `SELECT` constant).
3. `startEntries` and `appendEntry` accept `entries: []`, `entries: [] # comment` and `entries:` with nothing under it (`src/lib/server/edit/entry-edit/entries.ts`, `isEmptyList`, `emptyFlow`); the file is on the write list. T3 rows: see section 4, cases 25 to 28, 54, 55.
4. The base for `diff -rq` is the scratchpad copy of the unchanged tree (`$S/pristine`, with `-x local.yml -x node_modules -x .svelte-kit -x .scratch`); the unused-exports comparison ran `sh utils/unused-exports.sh` on a copy of that tree (`$S/ubase`, with `node_modules`). Section 5.
5. The documented samples are the fixtures; the Scopus sample's `openaccessFlag` and the `_added_by_hand` marker were added by hand, and are marked so in the fixture (`fixtures/scopusSearchResp.json`, each entry holds `"_added_by_hand": "openaccessFlag is not in the Elsevier sample; the builder added it"`) and in section 4, case 58.

## 3. The cases' first run on the unchanged tree (before any change)

### The case the brief's rule got wrong, with the evidence the ruling rests on

Cases 18 and 21 (author filter), through "What to build" item 2: "A venue or author is put into a source's quoted clause (PubMed's `"<venue>"[ta]` and `"<author>"[au]`, ...)". PubMed's `"<author>"[au]` finds nothing for a surname or a full name, so PubMed contributes no hit under any author filter. Run on 2026-10-05, keyless, paced, one `esearch.fcgi?db=pubmed&term=<term>&retmode=json&retmax=1&tool=oculus` each (`count` of `esearchresult`):

| term | count |
| --- | --- |
| `Faes[au]` | 840 |
| `"Faes"[au]` | 0 |
| `"Faes"[Author]` | 0 |
| `EEG AND Faes[au]` | 45 |
| `EEG AND "Faes"[au]` | 0 |
| `tensor regression AND Faes[au]` | 3 |
| `tensor regression AND "Faes"[au]` | 0 |
| `"Faes L"[au]` | 318 |
| `Faes L[au]` | 326 |
| `tensor AND "Lozano Jimenez"[au]` | 0 |
| `Lozano Jimenez[au]` | 19 |
| `Lozano-Jimenez[au]` | 19 |
| `EEG classification AND "Biomedical Signal Processing and Control"[ta]` (the venue clause) | 5 |

A quoted author is read as an exact phrase of PubMed's author index, whose entries are "Surname Initials", so the case's inputs (`Faes`, `Lozano Jimenez`) match nothing. The after-fetch filter of item 4 keeps case 18 and 21 from showing a wrong card, so the defect is silent: PubMed is asked, answers `ok` with 0 hits, and its chip says so. The same filter in Europe PMC (`AUTH:"Faes"` with `TITLE_ABS:(tensor regression)`: 3 hits), OpenAlex (`raw_author_name.search:Faes`: 11 hits for `tensor regression`) and the venue clauses work as the brief writes them.

The two options put to the coordinator. Option (a): PubMed's author clause is `<author>[au]` without quotes (PubMed documents `Faes L[au]` this way and parses the words itself), with `"`, `[`, `]`, `(` and `)` removed from the value first, so a value cannot close or open a clause; the venue clause stays quoted. Option (b): keep the quoted clause and send PubMed no author filter (the after-fetch filter alone), which makes PubMed return its unfiltered page, mostly dropped by the filter. Recommendation: (a). The lazy option is (b).

Two smaller points of the brief that a ruling does not hold up and that the build takes as follows unless reversed:

1. Item 2's OpenAlex `select=` omits `locations`, while decision 7 names OpenAlex's `locations` (an arXiv landing page beside the DOI) as one of the sources of a preprint-to-published link. The build adds `locations` to the select.
2. `appendEntry` and `startEntries` (`src/lib/server/edit/entry-edit/entries.ts`) both refuse a file whose list is the flow list `entries: []` (case 55): see the first run of case 55 below. The writer of item 8 handles it in the step by extending `startEntries`.

### The first run, case by case

The base copy the brief names (`.agents/worktrees/D38-base/tools/oculus/`) does not exist (`ls .agents/worktrees` lists D20, D37-base, D38, D42-base, gate, H3-base, S5-base, X3f, X3f-base). The tree as it was at the base is kept in the session scratchpad as `base/oculus/` (rsync of the worktree before any change, without `node_modules`, `.scratch` and `.svelte-kit`); `diff -rq` runs against it. `unused-exports.txt` for D38 does not exist either; `sh utils/unused-exports.sh` run on the unchanged worktree is its replacement.

Commands behind the rows (scratch scripts in the session scratchpad, run with `node --disable-warning=ExperimentalWarning` over the worktree's sources, no test run, no server):

- `ls "src/routes/api/(docs)/"` prints `diagrams docs memories wallpaper`: no `literature` route.
- `grep -rn -i --exclude=local.yml -l "literature" src config` prints `src/lib/data/index.ts`, `config/behavior.yml`, `config/catalogs/options.yml`, `config/sources.yml`: all are the `literature-radar` feed path and its text; no literature view, key, reader or catalog line.
- `readLocalText` on `literature: { wos_key: 3 }`, `literature: abc` and `literature: { foo: x }` gives `problems []` and `unknown ["literature"]` for each, and `checkLocal` gives `null` for each.
- `settingProblems` over the merged shipped config plus `literature: { timeout_s: 0, per_source: 500, cache_min: -1 }` gives `[]` for every `literature` key (total problems 0).
- `deleteFeedEntry(hub, config, 'radar', 'A')` over a scratch hub gives `refused: [{ field: 'feed', reason: 'the radar feed does not allow deletion' }]`; `FEED_RULES.radar` is `{ identity: 'title', fields: ['dismissed'], deletable: false }`.
- `appendEntry` and `startEntries` over `meta:\n  a: 1\nentries: []\n` both give `changed []` and one refusal and leave the text as it was; over `entries:` with nothing under it `startEntries` writes the entry and `appendEntry` refuses; over a file holding entries `appendEntry` writes the entry and leaves a blank line before it.
- `renderEntry([], 'title', { title: 'A "quoted": #title\nline2', ... })` writes `- title: "A \"quoted\": #title\nline2"` on one line and keeps curly quotes, dashes and ellipsis characters as given.

| Case | First run on the unchanged tree |
| --- | --- |
| 1 to 5 | No route, no view, no merge function: nothing to run (`ls "src/routes/api/(docs)/"`). |
| 6 to 9 | No source adapter, no state vocabulary: nothing to run. |
| 10 to 12 | No view, no route: a request to `/api/literature` has no route to answer it. |
| 13 to 21 | No filter, sort or search exists. Rule check against the live sources (keyless, small): Europe PMC accepts `PUB_TYPE:"review"`, `PUB_TYPE:"journal article"`, `JOURNAL:"..."`, `AUTH:"Faes"`, `SRC:PPR`, `DOI:"..."` and `TITLE_ABS:(tensor train: federated learning)`; PubMed accepts `review[pt]`, `preprint[pt]`, `"journal article"[pt]`, `free full text[sb]`, `"<venue>"[ta]`, `1000:2020[dp]`, `2020:2027[dp]` and `<doi>[doi]`; PubMed's `"<author>"[au]` is the defect above (cases 18 and 21); OpenAlex accepts `raw_author_name.search:Faes`, `cited_by_count:>99,type:article,is_oa:true,publication_year:2015-2024`, `publication_year:1000-2020` and `doi:<doi>`; Crossref accepts `from-pub-date:1000,until-pub-date:2020,type:journal-article`, `query.container-title`, `query.author` and `/works/<doi>` (without `select`, which that route refuses with 400); arXiv answered 200 to a search with `submittedDate:[202401010000 TO 202612312359]` and to `id_list=1403.4462`. Semantic Scholar was not asked (429 in the brief's probe 3). |
| 22, 23, 53, 59 | No cache, no pacing, no abort path exists. |
| 24, 38 | No BibTeX route; `@citation-js/*` is not installed (`ls node_modules/@citation-js` fails, as the brief states). |
| 25 | No `radar-add` kind: `POST /api/write` answers 400 "the body is not a write this route knows" (`writes.ts` last line). |
| 26, 28, 41, 54, 55 | No `addRadarEntry`. Premise of 55: `entries: []` is refused by both entry primitives (above), so the writer needs a change to `startEntries`. Premise of 28 and 54: `renderEntry` writes a newline as the escape `\n` inside a double-quoted scalar and does not change curly quotes, so the cleaning of decision 9 is new code in the writer. |
| 27 | No `radar-add` undo; `deleteFeedEntry` refuses the radar (above), so the removal path is new. |
| 29, 50 | No Scholar link function. |
| 30 | No route to refuse a request. |
| 31 | No instance state shape. |
| 32, 45 to 49 | No route, so no refusal word; `routes/api/(docs)/` holds no `literature` folder. |
| 33 to 37, 39, 57 | No adapter, no cleaning function: nothing to run. |
| 40 | No `radar-add` kind. |
| 42, 56 | `readLocalText`: no problem, `unknown ["literature"]`, `checkLocal` `null` for `literature: { wos_key: 3 }`, `literature: abc`, `literature: { foo: x }` (above). |
| 43 | `settingProblems`: no finding for `literature.timeout_s`, `literature.per_source` or `literature.cache_min` (above). |
| 44 | No view. |
| 51, 52 | No merge function, no `More`. |
| 58 | Documented sample answers found. WoS Starter: the `/documents` response example of the Swagger definition at `https://developer.clarivate.com/apis/wos-starter/swagger` (saved as `fixtures/wos-swagger.json`, `paths./documents.get.responses.200.content.application/json.example`, two hits, the second a `Bulletin of Hispanic Studies` article with `uid`, `title`, `types`, `source`, `names.authors`, `links.record`, `citations` and `identifiers`). Scopus Search API: `https://dev.elsevier.com/payloads/search/scopusSearchResp.json` (saved as `fixtures/scopusSearchResp.json`, 5 entries, a COMPLETE view with `dc:title`, `dc:creator`, `prism:publicationName`, `prism:coverDate`, `prism:doi`, `citedby-count`, `subtype`, `dc:description`, `link`). That sample carries no `openaccessFlag`, `pubmed-id` or `eid`; the field table at `https://dev.elsevier.com/sc_search_views.html` lists `openaccess / openaccessFlag` ("Open Access status"), `pubmed-id` and `eid`. The open access read of case 58 is therefore run over the sample with one `openaccessFlag` added by hand and marked as such in the report. No request went to `api.clarivate.com` or `api.elsevier.com`. |

## 4. Each case now: what runs and what it printed

Evidence names its command. `$S` is the session scratchpad, `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad`. Scripts: `$S/cases.mts`, `$S/cases2.mts`, `$S/case58.mts`, `$S/case59.mts`, `$S/doiq.mts`, `$S/s2stub.mts`, `$S/cr.mts` run with `node` over the worktree's sources and a stub `fetch` (no server, no live request), and `$S/m13/tests/scratch/*.test.ts` run with `npx vitest run tests/scratch` in a copy of the worktree (the client state and the merge filters). The committed tests are T1 to T6.

| Case | Result now | Evidence |
| --- | --- | --- |
| 1, 2, 3, 5, 51 | One card for hits sharing a DOI (any spelling), a PubMed id or an arXiv id; Crossref's title wins; a preprint and its published version are one card when a hit names both ids, two when none does; one DOI twice in one source keeps the better rank. The card lists every source, the highest citations with each source's count in the tooltip (`title="Journal \| 2024 \| Article \| 5 citations \| Crossref: 5"` in the rendered card) and `Open PDF` from the pdf order. | T6, `npx vitest run tests/state/feeds/literature-merge.test.ts`: 1 passed; seen failing twice (section 7). The live paper of case 1 and the pair of case 5 are the look's. |
| 4 | A hit with no DOI is its own card, `url` its source's page (`"url":"https://openalex.org/W3"` in the OpenAlex run); Copy BibTeX falls to Semantic Scholar, then citation-js (case 24). | `$S/cases2.log`, `$S/client-cases.out`. |
| 6 | A 429 is `state: limited` with `status: 429` and the wait when named; one request only (`calls 1`). Chip words `rate limited, try again in 12 s` (`words.ts` `stateWords`). | `$S/cases.log` line `6 retry-after`. |
| 7 | A hanging source answers `state: timeout` after the limit (302 ms for a 0.3 s limit) and its request is aborted (the stub rejects only on abort). | `$S/cases.log` line `7 timeout`. |
| 8 | Keyed sources without a key answer `no-key`, 0 requests; `?sources` lists `wos` (`wos_key`) and `scopus` (`scopus_key`) as `available: false`. The disabled toggle with the key named is in the rendered Head markup (`disabled=""` and the tooltip `Needs the wos_key key under literature: in local.yml`). | `$S/cases.log` lines `8`; scratch render of `Head.svelte`. |
| 9, 34 | A 401 or 403 is `refused` with the status; the key echoed in the stub's body is in no answer (`key in answer: false` for Scopus 401 and WoS 403). | `$S/cases.log`; T2, `npx vitest run tests/routes/docs/literature.test.ts`: 3 passed; seen failing without the key filter (section 7). |
| 10, 44 | No source on: `noneOn true`, 0 requests, Scholar link still built. No hits: `Empty` with `literature.no_hits` and the Scholar link in the bar (`Literature.svelte:196` for no source on, `:219` for no hits, `:164` for the Scholar link). The drawn line itself is the look's. | `$S/client-cases.out` line `44`; reading. |
| 11, 12, 47 | Route: `400 query_long` for 1001 characters (1000 is `ok`), `400 query_empty` for empty and for whitespace, `venue_long`, `author_long` for 201 characters (200 is `ok`). The page refuses with the same words before sending and sends 0 requests. | `$S/cases.log`; `$S/client-cases.out` lines `11`, `12`, `47`. |
| 13, 14, 15, 16, 17, 18 | Filters re-applied after the fetch, over five mixed hits: years 2024-2026 plus open access keeps the 2025 review and the preprint; type review keeps the review; minimum 100 keeps the two papers with 400 and 150, highest first, and drops the PubMed-only and arXiv-only hits; sort by date puts hits dated or with a year first, newest first, and the hit with no date or year last; venue words and author words match. arXiv is asked with `submittedDate:[202401010000 TO 202612312359]` and is `skipped` for type `review`, for a venue and for minimum citations. | `$S/client-cases.out` lines `13` to `18`; `$S/cases.log` lines `13`, `14`. |
| 19, 45 | `"tensor train": federated learning` and `tensor (decomposition` and `"tensor train` are sent as typed through URLSearchParams; a source answering 400 is `failed` on its own chip and the others answer `ok`. | `$S/cases.log` lines `45`. |
| 20 | A DOI query becomes each source's DOI lookup, and arXiv is `skipped` for a DOI that is not an arXiv DOI. | `$S/doiq.out`, below. |
| 21 | PubMed author sent as typed with the accent (`Lozano+Jiménez[au]`); names keep accents (`Juránková, J.` from the Scopus fixture). | live run above; `$S/case58.log`. |
| 22, 53 | Second identical request: `cached: true`, 1 fetch for 2 requests. A change of `from` is a new request (fetches 1 to 2), of `page` another (3), and of `type`, `oa`, `venue`, `author` and `min_cites` one each (8); the first request again is cached (still 8); with `cache_min: 0` two requests make 2 fetches. A change of the sort asks nothing (the sort is not a request parameter: `searchParams` in `form.ts` does not carry it). | `$S/cases.log` lines `22`, `53`. |
| 23 | A new search aborts the first (`first aborted true`), and only the second's hits are drawn; `stop()` (tab closed) aborts the third and leaves 0 hits and `asking false`. A sources listing that lands after the tab closed starts no search (`closed` in `Literature.svelte`). | `$S/client-cases.out` lines `23`. |
| 24, 38 | Copy BibTeX: a DOI hit takes doi.org's `@article`, an arXiv-only hit the DataCite `@misc`, a hit with neither the citation-js entry (key `Goh2016Multiway`, text below); when doi.org has none the next source is asked (`asked order doi,s2`, result `semantic_scholar`); when the route answers nothing, citation-js. No file is written (the route and the page hold no file write for it). | `$S/client-cases.out` lines `24`, `38`. |
| 25, 26, 27, 28, 40, 41, 54, 55 | `radar-add`: entry appended under `entries:` in the radar order with `found` today; the same title or address refused; undo puts the file back byte for byte; a title with `"`, `:`, `#` and a newline is one line and reparses; no radar file is 404 and none is made; the write reads the file at the write (`feeds.ts:455-456`); curly quote, en dash and ellipsis become `'`, `-`, `...` and the accented author letter stays; `entries: []` takes its first entry; a file that does not parse is refused and left as it was. | T3 `tests/server/edit/feeds.test.ts` and T4 `tests/routes/edit/undo/undo.test.ts`, with the other four files of the six-file command: 6 files, 88 tests passed. |
| 29, 50 | `https://scholar.google.com/scholar?q=tensor%20regression%20author%3A%22Faes%22&as_ylo=2024&as_yhi=2026`; `from=2020` alone gives `as_ylo=2020`, `to=2020` alone `as_yhi=2020`. The route sends `publication_year:2020-2027` (current year plus one) and `1000-2020` to OpenAlex. | `$S/client-cases.out` lines `29`, `50`; `$S/cases.log` line `50`. |
| 30, 32, 48, 49 | Without a token 403 `{error:"token"}`, 0 requests; `gscholar`, repeated `source`, `from=abc`, `from=2025&to=2020`, `min_cites=-1`, `type=thesis` give `source`, `source`, `year`, `year`, `cites`, `type`, 0 requests; `page=abc`, `page=-1`, a non-ASCII or 201-character cursor give `page`; `oa=1` and `oa=0` read, `oa=true`, `yes`, empty, `2` give `oa`. | `$S/cases.log`; T1. |
| 31 | A layout state missing or of the wrong types parses to the defaults (`q ""`, `type any`, `oa false`, `sort relevance`, `toggled {}`), no refusal. | `$S/client-cases.out` lines `31`. |
| 33 | `Rate exceeded.` text and an HTML page: `failed`; a 429: `limited`; nothing thrown. | `$S/cases.log` lines `33`. |
| 35, 36, 37 | An item with neither title nor identifier is dropped; a DOI and no title is a card with an empty title (the view draws the untitled line); markup `<i>`, `&amp;` and `<script>` come out as text (`Deep & learning`); an `http:` or `javascript:` pdf or url is dropped; arXiv `http://arxiv.org/abs/<id>` gives `https://arxiv.org/abs/<id>` and `https://arxiv.org/pdf/<id>`. | `$S/cases.log` lines `35/36/37`, `37`; `$S/cases2.log`. |
| 39 | OpenAlex 429 with `x-ratelimit-remaining: 0` and `x-ratelimit-reset: 3600` gives `wait_s: 3600`, worded `daily limit reached, resets in 60 min`; a 429 with only `Retry-After` gives no wait and `rate limited`. | `$S/cases.log` line `39`; `$S/oa429.mts`. |
| 42, 43, 56 | `local.yml` with a non-text literature key, an unknown key under the map and `literature: abc`, and `behavior.yml` with `timeout_s: 0`, `per_source: 500`, `cache_min: -1`: the problems, findings, `unknown` and `checkLocal` sentences named in the brief. | T5, the `settings.test.ts` and `local.test.ts` of the six-file command, and `tests/checks/config/config.test.ts`; seen failing on the unchanged tree (section 7). |
| 46 | A double quote in a venue or author is removed from the quoted clauses (`"OBrien"[ta] AND OBrien[au]`, `JOURNAL:"OBrien" AND AUTH:"OBrien"`) and read as a space by the after-fetch filter (`O"Brien` matches `O Brien Letters` and `O'Brien Journal`); the Scholar link reads it as a space. | `$S/cases.log` lines `46`; `$S/client-cases.out` lines `46`. |
| 52 | `More` with the next page limited, timed out or failed: page 1 hits stay (`hits 1`), the chip state is the failed page's (`limited` with `wait 9`, `timeout`, `failed` with `status 500`), `more` stays true; after a good page 2 `more false` and `hasMore false`; `More` with none left sends 0 requests, and a source with `more: false` is asked once. | `$S/client-cases.out` lines `52`. |
| 57 | A valid JSON answer of exactly 5 242 880 bytes reads (`ok`); one byte more is `failed`. | `$S/cases2.log`. |
| 58 | WoS and Scopus adapters over the documented samples: every field read; see below. | `$S/case58.log`. |
| 59 | At most one call in flight per source; starts at least the gap apart; 201 different answers leave 200; the first is dropped. | `$S/case59.log`, below. |

### Case 20, the DOI lookup of each source (`node $S/doiq.mts`, stub `fetch`)
```
openalex          failed   https://api.openalex.org/works?filter=doi:10.1016/j.jneumeth.2015.03.018&per-page=25&page=1
semantic_scholar  failed   https://api.semanticscholar.org/graph/v1/paper/DOI:10.1016/j.jneumeth.2015.03.018?fields=title,abstract,year,venue,authors,externalIds,citationCount,isOpenAccess,openAccessPdf,publicationTypes,publicationDate,journal,url,citationStyl
crossref          failed   https://api.crossref.org/works/10.1016/j.jneumeth.2015.03.018
pubmed            failed   https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=10.1016/j.jneumeth.2015.03.018[doi]&retmode=json&retmax=25&retstart=0&sort=relevance&tool=oculus
europe_pmc        ok       https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:"10.1016/j.jneumeth.2015.03.018"&format=json&resultType=core&pageSize=25&cursorMark=*
arxiv             skipped  (no request)
wos               failed   https://api.clarivate.com/apis/wos-starter/v1/documents?q=DO=(10.1016/j.jneumeth.2015.03.018)&db=WOS&limit=25&page=1&sortField=RS+D
scopus            failed   https://api.elsevier.com/content/search/scopus?query=DOI(10.1016/j.jneumeth.2015.03.018)&count=25&start=0&sort=relevancy
20 arxiv DOI:
failed https://export.arxiv.org/api/query?id_list=1403.4462&start=0&max_results=25&sortBy=relevance&sortOrder=descending
```

### Cases 6, 7, 8, 9, 11 to 12, 22, 30 to 39, 45 to 50, 53, 57 (`node $S/cases.mts`)
```
30 no token: {"http":403,"error":"token"} calls 0
8 wos no key: {"http":200,"ok":true,"source":"wos","state":"no-key"} | scopus {"http":200,"ok":true,"source":"scopus","state":"no-key"} calls 0
8 ?sources: [{"id":"wos","keyed":true,"available":false,"key":"wos_key"},{"id":"scopus","keyed":true,"available":false,"key":"scopus_key"}]
11 long: {"http":400,"error":"query_long"} | 1000 ok: {"http":200,"ok":true,"source":"openalex","state":"ok","cach
12 empty: {"http":400,"error":"query_empty"} {"http":400,"error":"query_empty"} calls 0
32 source=gscholar&q=x {"http":400,"error":"source"}
32 source=openalex&source=crossref&q=x {"http":400,"error":"source"}
32 source=openalex&q=x&from=abc {"http":400,"error":"year"}
32 source=openalex&q=x&from=2025&to=2020 {"http":400,"error":"year"}
32 source=openalex&q=x&min_cites=-1 {"http":400,"error":"cites"}
32 source=openalex&q=x&type=thesis {"http":400,"error":"type"}
32 calls 0
48 openalex page=abc {"http":400,"error":"page"}
48 openalex page=-1 {"http":400,"error":"page"}
48 epmc non-ascii {"http":400,"error":"page"} over200 {"http":400,"error":"page"} ok 200 {"http":200,"ok":true,"source":"europe_pmc","state calls 1
49 oa=1 {"http":200,"ok":true,"source":"openalex","state":"ok","cached":false,
49 oa=0 {"http":200,"ok":true,"source":"openalex","state":"ok","cached":false,
49 oa=true {"http":400,"error":"oa"}
49 oa=yes {"http":400,"error":"oa"}
49 oa= {"http":400,"error":"oa"}
49 oa=2 {"http":400,"error":"oa"}
47 venue 201 {"http":400,"error":"venue_long"} author 201 {"http":400,"error":"author_long"} | 200 {"http":200,"ok":true,"source":"openalex","state":"ok","cach
46 requests (quote in venue and author):
   https://api.openalex.org/works?filter=title_and_abstract.search:tensor,raw_author_name.search:O"Brien&per-page=25&page=1&select=id,doi,display_name,publication_year,publication_date,type,cited_by_count,open_access,best_oa_location,primary_location,authorships,
   https://api.crossref.org/works?query.bibliographic=tensor&rows=25&offset=0&select=DOI,title,author,published,type,is-referenced-by-count,container-title,abstract,link,license&query.author=O"Brien&query.container-title=O"Brien
   https://api.semanticscholar.org/graph/v1/paper/search?query=tensor&offset=0&limit=25&fields=title,abstract,year,venue,authors,externalIds,citationCount,isOpenAccess,openAccessPdf,publicationTypes,publicationDate,journal,url,citationStyles&venue=O"Brien
   https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=tensor AND "OBrien"[ta] AND OBrien[au]&retmode=json&retmax=25&retstart=0&sort=relevance&tool=oculus
   https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=TITLE_ABS:(tensor) AND JOURNAL:"OBrien" AND AUTH:"OBrien"&format=json&resultType=core&pageSize=25&cursorMark=*
45 tensor (decomposition {"http":200,"ok":true,"source":"crossref","state":"failed","status":400} | openalex {"http":200,"ok":true,"source":"openalex","state":"ok","cached":false,"total":30
45 "tensor train {"http":200,"ok":true,"source":"crossref","state":"failed","status":400} | openalex {"http":200,"ok":true,"source":"openalex","state":"ok","cached":false,"total":30
45 sent: https://api.crossref.org/works?query.bibliographic=tensor (decomposition&rows=25&offset=0&select=DOI,title,author,publis || https://api.openalex.org/works?filter=title_and_abstract.search:tensor (decomposition&per-page=25&page=1&select=id,doi,d || https://api.crossref.org/works?query.bibliographic="tensor train&rows=25&offset=0&s
33 crossref text: {"http":200,"ok":true,"source":"crossref","state":"failed","status":200} | arxiv text {"http":200,"ok":true,"source":"arxiv","state":"failed","status":200} | html {"http":200,"ok":true,"source":"openalex","state":"failed","status":200}
33 429: {"http":200,"ok":true,"source":"crossref","state":"limited","status":429}
34/9 scopus 401: {"http":200,"ok":true,"source":"scopus","state":"refused","status":401} key in answer: false
9 wos 403: {"http":200,"ok":true,"source":"wos","state":"refused","status":403} key in answer: false
39 openalex daily: {"http":200,"ok":true,"source":"openalex","state":"limited","status":429,"wait_s":3600}
6 retry-after: {"http":200,"ok":true,"source":"semantic_scholar","state":"limited","status":429,"wait_s":12} calls 1
7 timeout: {"http":200,"ok":true,"source":"arxiv","state":"timeout"} ms 303
57 5MB+1: {"http":200,"ok":true,"source":"openalex","state":"failed","status":200}
57 exactly 5MB (spaces, not JSON): {"http":200,"ok":true,"source":"openalex","state":"failed","status":200}
22 first cached false second cached true calls 1
53 filter change calls 2
53 page change calls 3
53 after type/oa/venue/author/min_cites calls 8
53 back to first cached, calls 8
53 cache_min 0: calls 0
53 cache_min 0 two requests -> calls 2
35/36/37 openalex hits: [{"id":"https://openalex.org/W1","title":"Deep & learning","url":"https://openalex.org/W1"},{"id":"https://openalex.org/W4","title":"ok","url":"https://openalex.org/W4","pdf":"https://x.org/a.pdf"}]
37 arxiv url/pdf: [{"id":"2510.16965","url":"https://arxiv.org/abs/2510.16965","pdf":"https://arxiv.org/pdf/2510.16965"},{"id":"2408.00746","url":"https://arxiv.org/abs/2408.00746","pdf":"https://arxiv.org/pdf/2408.00746"}]
13 arxiv clause: https://export.arxiv.org/api/query?search_query=all:ecg+AND+submittedDate:[202401010000+TO+202612312359]&start=0&max_results=25&sortBy=relevance&sortOrder=descending
14 arxiv type review: {"http":200,"ok":true,"source":"arxiv","state":"skipped"} | min_cites {"http":200,"ok":true,"source":"arxiv","state":"skipped"} | venue {"http":200,"ok":true,"source":"arxiv","state":"skipped"} calls 0
50: filter=title_and_abstract.search:x,publication_year:2020-2027 || filter=title_and_abstract.search:y,publication_year:1000-2020
```
```
57 valid JSON of 5242880 bytes: ok 0
57 valid JSON of 5242881 bytes: failed undefined
35/37 hits: [{"id":"https://openalex.org/W3","title":"","doi":"10.1234/bb","url":"https://openalex.org/W3"},{"id":"https://openalex.org/W5","title":"Landing","doi":"10.1234/cc","url":"https://openalex.org/W5"}]
```

### Client state and merge filters (`npx vitest run tests/scratch` in a copy of the worktree)
```
13 years 2024-2026 + oa     ["10.1234/a","2401.00001"]
14 type review              ["10.1234/a"]
15 min cites 100, by cites  ["10.1234/b","10.1234/a"]
15 sort citations (no min)  ["10.1234/b","10.1234/a","10.1234/e","1","2401.00001"]
16 sort date                ["10.1234/a","2401.00001","1","10.1234/b","10.1234/e"]
17 venue BSPC words         ["10.1234/a"]
18 author Faes              ["10.1234/a","1"]
46 venue O"Brien            ["1","10.1234/e"]
46 venue O'Brien            ["1"]
50 from=2025 only           ["10.1234/a"]
50 to=2023 only             ["10.1234/b"]
11 long query_long | 12 empty query_empty | 47 venue 201 venue_long author 201 author_long | 200 null
11/12 requests sent 0 refused query_long
44 noneOn true requests 0 | scholar https://scholar.google.com/scholar?q=tensor
23 first aborted true second aborted false
23 hits drawn ["from /api/literature?source=openalex&q=second"]
23 stop: third aborted true
23 after stop: hits 0 asking false
52 page 1: hits 2 hasMore true
52 page 2 429: state limited wait 9 status 429 hits 1 more true hasMore true
52 page 2 timeout: state timeout wait undefined status undefined hits 1 more true hasMore true
52 page 2 fail: state failed wait undefined status 500 hits 1 more true hasMore true
52 page 2 ok: hits 2 more false hasMore false
52 More with none left: new requests 0 | crossref requests total 1
toggle off: hits [ 'openalex' ]
toggle on: requests 3 /api/literature?source=crossref&q=one
31 missing {"q":"","from":"","to":"","type":"any","oa":false,"venue":"","author":"","minCites":"","sort":"relevance","toggled":{}} 
31 wrong types {"q":"","from":"","to":"","type":"any","oa":false,"venue":"","author":"","minCites":"","sort":"relevance","toggled":{}}
29 https://scholar.google.com/scholar?q=tensor%20regression%20author%3A%22Faes%22&as_ylo=2024&as_yhi=2026
50 https://scholar.google.com/scholar?q=tensor&as_ylo=2020 https://scholar.google.com/scholar?q=tensor&as_yhi=2020
46 author quote https://scholar.google.com/scholar?q=tensor%20author%3A%22O%20Brien%22
24 doi hit: doi @article{x, title={T}}
24 arxiv-only: arxiv @misc{y, title={T}}
24 neither: citation_js 
38 doi.org none -> next: semantic_scholar | asked order doi,s2
38 route failed -> citation-js: citation_js | asked 1
```

The citation-js entry of the `24 neither` row, as printed: `@article{Goh2016Multiway, author = {{Goh Sam} and {Lee Ann}}, year = {2016}, title = {Multiway analysis}, }`.

### Case 58: WoS and Scopus adapters over the documented samples (`node $S/case58.mts`)

Fixture sources: WoS Starter, the `/documents` response example of `https://developer.clarivate.com/apis/wos-starter/swagger` (saved as `fixtures/wos-swagger.json`, read at `paths./documents.get.responses.200.content.application/json.example`); Scopus Search, `https://dev.elsevier.com/payloads/search/scopusSearchResp.json` (saved as `fixtures/scopusSearchResp.json`). **The Scopus sample holds no `openaccessFlag`: it was added by hand to each of the five entries (true, false, true, false, true), each marked `_added_by_hand`.** The samples carry no `pubmed-id` for Scopus and no `identifiers.pmid` for WoS, so the last two lines below run a hand-edited variant (a `pubmed-id` and an `https:` record link on the first Scopus entry, an `identifiers.pmid` on the second WoS record) to show those fields are read.

```
== wos: request https://api.clarivate.com/apis/wos-starter/v1/documents?q=TS%3D%28heart%29+AND+PY%3D2000-2020+AND+DT%3D%28Article%29+AND+SO%3D%28Food%29+AND+AU%3D%28Jurankova%29&db=WOS&limit=25&page=1&sortField=RS+D
   header names X-ApiKey
   state ok total 2 more false cursor null hits 2
   {"id":"WOS:A1993MM96800012","title":"'EPITAFIO'","authors":["TOMLINSON, C"],"venue":"CUADERNOS HISPANOAMERICANOS","year":1993,"type":"other","cites":0,"url":"https://www.webofscience.com/api/gateway?GWVersion=2&SrcApp=&SrcAuth=WosAPI&KeyUT=WOS:A1993MM96800012&DestLinkType=FullRecord&DestApp=WOS","rank":1}
   {"id":"WOS:000222526200005","title":"Mapping the land of 'I-don't remember': For a re-evaluation ","authors":["Tomlinson, E"],"venue":"BULLETIN OF HISPANIC STUDIES","year":2004,"type":"article","cites":3,"doi":"10.3828/bhs.81.2.5","url":"https://www.webofscience.com/api/gateway?GWVersion=2&SrcApp=&SrcAuth=WosAPI&KeyUT=WOS:000222526200005&DestLinkType=FullRecord&DestApp=WOS","rank":2}
== scopus: request https://api.elsevier.com/content/search/scopus?query=TITLE-ABS-KEY%28heart%29+AND+PUBYEAR+%3E+1999+AND+PUBYEAR+%3C+2021+AND+DOCTYPE%28ar%29+AND+OPENACCESS%281%29+AND+SRCTITLE%28Food%29+AND+AUTH%28Jurankova%29&count=25&start=0&sort=relevancy
   header names X-ELS-APIKey,accept,X-ELS-Insttoken
   state ok total 2624604 more true cursor 5 hits 5
   {"id":"SCOPUS_ID:84884919538","title":"Brain is the predilection site of Toxoplasma gondii in exper","authors":["Juránková, J.","Basso, W.","Neumayerová, H.","Balá, V.","Jánová, E.","Sidler, X.","Deplazes, P.","Koudela, B."],"venue":"Food Microbiology","year":2014,"date":"2014-04-01","type":"article","cites":0,"doi":"10.1016/j.fm.2013.08.011","url":"https://www.scopus.com/inward/record.url?partnerID=HzOxMe3b&scp=84884919538","oa":true,"rank":1}
   {"id":"SCOPUS_ID:84888056396","title":"Recent developments in biased agonism","authors":["Wisler, J.W.","Xiao, K.","Thomsen, A.R.B.","Lefkowitz, R.J."],"venue":"Current Opinion in Cell Biology","year":2014,"date":"2014-04-01","type":"review","cites":0,"doi":"10.1016/j.ceb.2013.10.008","url":"https://www.scopus.com/inward/record.url?partnerID=HzOxMe3b&scp=84888056396","rank":2}
   {"id":"SCOPUS_ID:84884272794","title":"Symptoms as Solutions: Hypnosis and Biofeedback for Autonomi","authors":["Sugarman, L.I.","Garrison, B.L.","Williford, K.L."],"venue":"American Journal of Clinical Hypnosis","year":2014,"date":"2014-04-01","type":"article","cites":0,"doi":"10.1080/00029157.2013.768197","url":"https://www.scopus.com/inward/record.url?partnerID=HzOxMe3b&scp=84884272794","oa":true,"rank":3}
   {"id":"SCOPUS_ID:84884527646","title":"Investigating the effects of job demands and job resources o","authors":["Chen, C.-F.","Chen, S.-C."],"venue":"Tourism Management","year":2014,"date":"2014-04-01","type":"article","cites":0,"doi":"10.1016/j.tourman.2013.08.009","url":"https://www.scopus.com/inward/record.url?partnerID=HzOxMe3b&scp=84884527646","rank":4}
   {"id":"SCOPUS_ID:84886423686","title":"Antidiarrheal activities of isovanillin, iso-acetovanillon a","authors":["Sadraei, H.","Ghanadian, M.","Asghari, G.","Azali, N."],"venue":"Research in Pharmaceutical Sciences","year":2014,"date":"2014-04-01","type":"article","cites":0,"url":"https://www.scopus.com/inward/record.url?partnerID=HzOxMe3b&scp=84886423686","oa":true,"rank":5}
== hand-edited variant wos [{"id":"WOS:000222526200005","pmid":"15000001","url":"https://www.webofscience.com/api/gateway?GWVersion=2&SrcApp=&SrcAuth=WosAPI&KeyUT=WOS:000222526200005&DestLinkType=FullRecord&DestApp=WOS"}]
== hand-edited variant scopus [{"id":"SCOPUS_ID:84884919538","pmid":"24180911","url":"https://www.scopus.com/inward/record.url?partnerID=HzOxMe3b&scp=84884919538"},{"id":"SCOPUS_ID:84888056396","url":"https://www.scopus.com/inward/record.url?partnerID=HzOxMe3b&scp=84888056396"},{"id":"SCOPUS_ID:84884272794","url":"https://www.scopus.com/inward/record.url?partnerID=HzOxMe3b&scp=84884272794"},{"id":"SCOPUS_ID:84884527646","url":"https://www.scopus.com/inward/record.url?partnerID=HzOxMe3b&scp=84884527646"},{"id":"SCOPUS_ID:84886423686","url":"https://www.sc
```

Read from the run: WoS `title`, `authors` (`displayName`), `venue` (`sourceTitle`), `year` (`publishYear`), `type` (`Article` to `article`, `Poetry` to `other`), `cites` (the `WOS` count), `doi`, `url` (`links.record`) are read, request `X-ApiKey` header only, the query `TS=(heart) AND PY=2000-2020 AND DT=(Article) AND SO=(Food) AND AU=(Jurankova)`. Scopus `title`, `authors` (`dc:creator` split from `author[].authname` when present), `venue`, `year` and `date` (`coverDate`), `type` (`ar`, `re`), `cites`, `doi`, `oa` are read; every record's `url` is the sample's `link[@ref=scopus]` address read over `https:` (the sample gives `http://www.scopus.com/inward/record.url?...`, and the host `www.scopus.com` is read as the same address with `https:`). Headers `X-ELS-APIKey`, `accept` and `X-ELS-Insttoken`.

### Case 59: pacing and the cache cap (`node $S/case59.mts`, stub `fetch` answering after 30 ms)
```
== keyless elapsed ms 9051 requests 20 statuses all 200: true
export.arxiv.org           calls 4 peak in flight 1 starts [13,3016,6018,9019] min gap 3001
api.crossref.org           calls 4 peak in flight 1 starts [13,1015,2017,3017] min gap 1000
api.semanticscholar.org    calls 4 peak in flight 1 starts [13,1015,2017,3017] min gap 1000
eutils.ncbi.nlm.nih.gov    calls 8 peak in flight 1 starts [13,355,697,1039,1381,1723,2065,2407] min gap 342
api.openalex.org           calls 4 peak in flight 1 starts [13,54,85,115] min gap 30
== pubmed with a key elapsed ms 9035 requests 20 statuses all 200: true
export.arxiv.org           calls 4 peak in flight 1 starts [9052,12052,15052,18054] min gap 3000
api.crossref.org           calls 4 peak in flight 1 starts [9052,10052,11053,12054] min gap 1000
api.semanticscholar.org    calls 4 peak in flight 1 starts [9052,10052,11053,12054] min gap 1000
eutils.ncbi.nlm.nih.gov    calls 8 peak in flight 1 starts [9052,9152,9255,9358,9460,9562,9665,9768] min gap 100
api.openalex.org           calls 4 peak in flight 1 starts [9052,9085,9118,9150] min gap 32
== cache cap: fetches after 201 different answers 201 answers kept 200
q1 (second) cached: true fetches 201 | q0 (first) cached: false fetches 202
```

## 5. DONE / NOT DONE

| Row | State | Command that proves it |
| --- | --- | --- |
| Route `GET /api/literature`: token, `?sources`, `?source=`, `?bibtex`, 13 refusal words, no key in any answer | DONE | `node $S/cases.mts` (section 4); `npx vitest run tests/routes/docs/literature.test.ts`: 3 passed |
| Eight adapters (OpenAlex, Semantic Scholar, Crossref, PubMed, Europe PMC, arXiv, WoS, Scopus) | DONE; Semantic Scholar not run over a real answer | Recorded answers in section 8 for six; `node $S/s2stub.mts` for Semantic Scholar (a documented-shape answer); `node $S/case58.mts` for WoS and Scopus |
| Pacing, one call in flight per source, cache of 200 `ok` answers, 5 MB read cap | DONE | `node $S/case59.mts`; `node $S/cases2.mts` |
| Merge: any shared DOI, PubMed id or arXiv id; RRF k=60; published hit preferred | DONE | `npx vitest run tests/state/feeds/literature-merge.test.ts`: passed |
| Filters re-applied after the fetch; sorts relevance, date, citations; `More` | DONE | `npx vitest run tests/scratch` in a copy of the worktree (section 4) |
| Copy BibTeX order and citation-js fallback | DONE | `npx vitest run tests/scratch` (case 24, 38 rows) |
| Add to Lit Watch: `radar-add` write, refusals, `entries: []`, undo, history label | DONE | `npx vitest run tests/server/edit/feeds.test.ts tests/routes/edit/undo/undo.test.ts`: passed |
| `local.yml` keys, `behavior.yml` settings, options catalog | DONE | `npx vitest run tests/data/sources/config/settings.test.ts tests/data/sources/config/local.test.ts tests/checks/config`: passed |
| View: registration in the Incoming group, bar, head, cards, add form, 99 catalog keys (97 `literature.*`, `views.literature` and `views.literature_glyph`), `e1-e6` | DONE; not seen in a browser | `npm run test:quick`: `ok svelte-check ... 0 ERRORS`, `ok eslint`; `npx vitest run tests/checks/source/keys.test.ts`: passed (inside `tests/checks`) |
| DESIGN.md and HELP.md | DONE, `radar-add` in the open kinds list of `How it writes` | `grep -rn "e1-e5" src config HELP.md DESIGN.md tests --exclude=local.yml` prints nothing |
| Look on TEST | NOT DONE (the orchestrator's) | no browser here |
| Six-file T1 to T6 command | DONE | `npx vitest run tests/routes/docs/literature.test.ts tests/state/feeds/literature-merge.test.ts tests/server/edit/feeds.test.ts tests/routes/edit/undo/undo.test.ts tests/data/sources/config/settings.test.ts tests/data/sources/config/local.test.ts`: Test Files 6 passed (6), Tests 88 passed (88) |
| boundaries, size, duplication, config, keys, history, comment-width | DONE | `npx vitest run tests/checks`: Test Files 16 passed (16), Tests 229 passed (229) |
| ASCII gate of `agents/spec.md:97` | DONE | `LC_ALL=C perl -ne ... $(find src tests config -type f ! -name local.yml)` printed nothing (the spec's `bin` directory does not exist in this tree and is left out of the `find`) |
| `npm run diagrams`, `checks.sh`, `sh utils/folder-check.sh` | DONE | `npm run diagrams` exit 0; `checks: 1 commands passed`; `sh utils/folder-check.sh` exit 0 |
| `npm run test:quick` | DONE | `test:quick: 29.9 s (limit 45.0 s); every command passed`; 8 executions in all (section 0) |
| Prettier over the tree | DONE | `npm run format:check`: `All matched files use Prettier code style!` |
| Unused exports | DONE | `diff $S/unused-base.txt $S/unused-new.txt`, quoted in section 9 |

## 6. Judgment calls and user-visible changes, before and after

**Judgment calls (internal, reversible, listed):**

1. citation-js: `plugins.config.get('@bibtex').format.useIdAsLabel = false` is set in `state/feeds/literature/bibtex.ts`. In 0.9.0 the option already loads as `false`; the explicit line keeps the key `Goh2016Multiway` (first author, year, first title word) whatever the default is, where `true` gives the hit's own id (`W123`). Authors go in as `{literal}` so a name keeps the order a source gave it.
2. A toggled-off source drops its hits at once; toggling one on asks it with the last search's form. The filters applied to the list on screen are those of the search as asked (`run.asked()`), the sort is the live form's.
3. With no radar file the card shows the radar feed's `missing` state, and a 404 of the write is worded by `answerWords`.
4. OpenAlex: a wait is read only from `x-ratelimit-reset` with `x-ratelimit-remaining: 0`, so a wait of that source means the daily credits and is worded so; a 429 with only `Retry-After` is `rate limited` with no wait (`ask.ts` `waitOf`).
5. Scopus `url` is the `link[@ref=scopus]` address. For the host `www.scopus.com` given as `http:` it is read as the same address over `https:`, and an `http:` link to any other host (or with a port) is dropped by case 37 (`sources/scopus.ts:87-109`).
6. Files touched beyond the listed paths: `tests/server/root/context-fixture.ts` (the context's new `literature` member), `src/lib/data/prose/literature.ts` (the rules both sides read, so the page refuses a query by the rule the route uses), `src/lib/server/edit/feeds.ts` (imports `addressKey`, `sameTitle` from it), `tests/checks/tree/boundaries.test.ts` (the state row lists `data/prose/literature`), `tests/checks/config/config-folder.test.ts` and `tests/checks/config/config.test.ts` (the new key, the new catalog file), `tests/data/sources/config/wrong-settings.ts`.
7. Sources that answer `ok` with a changed `total` keep the page's count at the merged list's length; the source's own total is not shown.

**User-visible changes, before and after:**

| Where | Before | After |
| --- | --- | --- |
| Incoming page | Inbox, Lit Watch, Position Leads, LinkedIn beside the Calendar | the same, and Literature search after LinkedIn in the first pane (`config/layout.yml`) |
| Chords of the Incoming group | `e1-e5` | `e1-e6` (`config/text/app.yml`, HELP.md); `grep -rn "e1-e5" src config HELP.md DESIGN.md tests --exclude=local.yml` prints nothing |
| `config/behavior.yml` | no `literature:` | `literature: { timeout_s: 20, per_source: 25, cache_min: 30 }` |
| `config/local.yml` | no literature keys | an optional map `literature:` with `wos_key`, `scopus_key`, `scopus_insttoken`, `openalex_key`, `semantic_scholar_key`, `ncbi_key`, `mailto`; an unknown key under it is warned of once on stderr and ignored |
| History view | no `radar-add` kind | `kind_radar_add` label (`config/text/views/system/history.yml`) |
| Write route | no `radar-add` | `radar-add` accepted: 404 `Lit Watch has no file on this hub` when the file is missing |
| Dependencies | no XML or BibTeX library | `fast-xml-parser` 5.11.2, `@citation-js/core` 0.9.0, `@citation-js/plugin-bibtex` 0.9.0 (`package.json`, `package-lock.json`) |

## 7. Tests seen failing first (quoted)

Each new or changed test was run on the unchanged tree and again with its behaviour removed on a scratch copy. The lines below are the runs' own output (`$S/failing-log.txt`).

```
== T5 on the unchanged tree (scratch copy `unch`: base src/config/tests/utils, then the new/changed test files laid over) ==
npx vitest run tests/data/sources/config/settings.test.ts tests/data/sources/config/local.test.ts tests/checks/config/config.test.ts --reporter=dot
 Test Files  3 failed (3)
      Tests  17 failed | 91 passed (108)
 FAIL  tests/data/sources/config/local.test.ts > checkLocal > answers "literature: abc" with the sentence it would throw
AssertionError: expected null to be 'local.yml: literature must be a map' // Object.is equality
 FAIL  tests/data/sources/config/local.test.ts > checkLocal > answers "literature: { wos_key: 3 }" with the sentence it would throw
AssertionError: expected null to be 'local.yml: literature.wos_key must be...' // Object.is equality
 FAIL  tests/data/sources/config/local.test.ts > readLocal and loadLocal > warns once of an unknown key under literature with no problem, and reads the keys it knows
AssertionError: expected [ 'literature' ] to strictly equal [ 'literature.foo' ]
 FAIL  tests/data/sources/config/settings.test.ts > literatureSettings > answers the written values, and 0 minutes for a cache that keeps nothing
AssertionError: expected { Object (threw) } to strictly equal { value: { timeoutS: 9, ...(2) }, ...(1) }
 FAIL  tests/data/sources/config/settings.test.ts > the shipped files > answers the shipped default for each setting the shipped file gets wrong, and reads every shipped default
AssertionError: expected [ 'calendar.days_ahead', ...(27) ] to strictly equal [ 'calendar.days_ahead', ...(30) ]
 FAIL  tests/checks/config/config.test.ts > settingFindings > words each wrong setting against behavior.yml from the catalog, and nothing for the shipped files
AssertionError: expected [ 'calendar.days_ahead', ...(32) ] to deeply equal [ 'calendar.days_ahead', ...(35) ]
 FAIL  tests/checks/config/config.test.ts > loadConfig > names a sentence file that does not parse by its key and arguments, without throwing   (environment: this test also fails in the scratch copy whatever the tree; it passes in the worktree)
 FAIL  |unit| tests/server/edit/feeds.test.ts > Lit Watch writes > adds a Lit Watch entry in the order given and refuses one whose title or address is in the file
TypeError: addRadarEntry is not a function
 FAIL  |unit| tests/server/edit/feeds.test.ts > Lit Watch writes > answers a missing Lit Watch file as not found and makes none
TypeError: addRadarEntry is not a function
 FAIL  |unit| tests/server/edit/feeds.test.ts > Lit Watch writes > writes the first entry of a file whose list is empty: entries: []
 FAIL  |unit| tests/server/edit/feeds.test.ts > Lit Watch writes > writes the first entry of a file whose list is empty: entries: [] with a comment
 FAIL  |unit| tests/server/edit/feeds.test.ts > Lit Watch writes > writes the first entry of a file whose list is empty: entries: with nothing under it
TypeError: addRadarEntry is not a function
 FAIL  |unit| tests/server/edit/feeds.test.ts > Lit Watch writes > refuses a Lit Watch file that does not parse and leaves it as it was
TypeError: addRadarEntry is not a function
 FAIL  |unit| tests/server/edit/feeds.test.ts > Lit Watch writes > writes a title with quote, colon, hash and newline on one line, and plain characters for curly ones
TypeError: addRadarEntry is not a function
 FAIL  |unit| tests/server/edit/feeds.test.ts > Lit Watch writes > refuses a bucket outside the vocabulary, a relevance outside the three words and a missing title
TypeError: addRadarEntry is not a function
 Test Files  1 failed (1)
      Tests  8 failed | 5 passed (13)
== T3 with entries.ts at the unchanged tree (no entries: [] support)
 FAIL  |unit| tests/server/edit/feeds.test.ts > Lit Watch writes > adds a Lit Watch entry in the order given and refuses one whose title or address is in the file
AssertionError: meta:
 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
== T3 with the address refusal removed
 FAIL  |unit| tests/server/edit/feeds.test.ts > Lit Watch writes > adds a Lit Watch entry in the order given and refuses one whose title or address is in the file
AssertionError: expected [] to strictly equal [ { field: 'url', ...(1) } ]
 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
== T3 with the text cleaning removed
 FAIL  |unit| tests/server/edit/feeds.test.ts > Lit Watch writes > adds a Lit Watch entry in the order given and refuses one whose title or address is in the file
AssertionError: expected [] to strictly equal [ { field: 'title', ...(1) } ]
 FAIL  |unit| tests/server/edit/feeds.test.ts > Lit Watch writes > refuses a bucket outside the vocabulary, a relevance outside the three words and a missing title
TypeError: Cannot read properties of undefined (reading 'field')
 Test Files  1 failed (1)
      Tests  2 failed | 5 passed (7)
== T4 on the unchanged tree
 FAIL  |unit| tests/routes/edit/undo/undo.test.ts > taking a change back > takes an added Lit Watch entry out again
AssertionError: expected 400 to be 200 // Object.is equality
 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
== T4 with the exact put-back removed
 FAIL  |unit| tests/routes/edit/undo/undo.test.ts > taking a change back > takes an added Lit Watch entry out again
AssertionError: expected 'meta:\n  last_run: 2026-09-27\nentrie...' to be 'meta:\n  last_run: 2026-09-27\nentrie...' // Object.is equality
 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
== T4 with the undo going through the leads' delete path
 FAIL  |unit| tests/routes/edit/undo/undo.test.ts > taking a change back > takes an added Lit Watch entry out again
AssertionError: expected 400 to be 200 // Object.is equality
 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
== T1 and T2 on the unchanged tree
 FAIL  |unit| tests/routes/docs/literature.test.ts [ tests/routes/docs/literature.test.ts ]
Error: Cannot find module '../../../src/lib/server/content/literature/ask.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/unch2/tests/routes/docs/literature.test.ts
 Test Files  1 failed (1)
      Tests  no tests
== T2 with the key filter of a source's code removed
 FAIL  |unit| tests/routes/docs/literature.test.ts > the literature route > never answers a key, in a hit, a failure line or the source list
AssertionError: expected 'scopus: 401 SCOPUSKEY-bbbb-2222' not to contain 'SCOPUSKEY-bbbb-2222'
 Test Files  1 failed (1)
      Tests  1 failed | 2 passed (3)
== T1 with the token check removed
 FAIL  |unit| tests/routes/docs/literature.test.ts > the literature route > refuses a request without the write token, before any source is asked
AssertionError: sources null: expected 200 to be 403 // Object.is equality
 Test Files  1 failed (1)
      Tests  1 failed | 2 passed (3)
== T6 on the unchanged tree
 FAIL  |unit| tests/state/feeds/literature-merge.test.ts [ tests/state/feeds/literature-merge.test.ts ]
Error: Cannot find module '../../../src/lib/state/feeds/literature/merge.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/unch3/tests/state/feeds/literature-merge.test.ts
 Test Files  1 failed (1)
      Tests  no tests
== T6 with the join of hits that share an identifier removed
 FAIL  |unit| tests/state/feeds/literature-merge.test.ts > the literature merge > merges hits by DOI, PubMed id or arXiv id and keeps hits that share none apart
AssertionError: one DOI from two sources: expected 2 to be 1 // Object.is equality
 Test Files  1 failed (1)
      Tests  1 failed (1)
== T6 with a join on equal titles added
 FAIL  |unit| tests/state/feeds/literature-merge.test.ts > the literature merge > merges hits by DOI, PubMed id or arXiv id and keeps hits that share none apart
AssertionError: two hits with no identifier and one title: expected 1 to be 2 // Object.is equality
      Tests  1 failed (1)
```

## 8. Fixtures, with the live request that recorded each

All under `$S/fixtures/`, recorded keyless and paced, no key sent. The OpenAlex, arXiv, Europe PMC and PubMed rows give what the saved answer itself states of its query; the Crossref and Semantic Scholar rows give the request the adapter built.

| Fixture | Request |
| --- | --- |
| `openalex-search.json` | `GET https://api.openalex.org/works?filter=title_and_abstract.search:block%20term%20decomposition%20EEG&per-page=3&select=...` (the answer echoes `get works where title-abstract has (block term decomposition EEG)`) |
| `oa-author.json` | OpenAlex, author plus words: the answer echoes `get works where byline has (Faes) and title-abstract has (tensor regression)`, `meta.count` 11 |
| `oa-combo.json` | OpenAlex, citation, access, year, words and type: the answer echoes `get works where citation count > (99) and open access is (true) and year >= (2015) and year <= (2024) and title-abstract has (neural operator) and type is (article)`, `meta.count` 259 |
| `arxiv-search.xml` | arXiv: the answer echoes `search_query=all:tensor AND all:regression AND submittedDate:"202401010000 TO 202612312359"&start=0&max_results=2` |
| `arxiv-id.xml` | `GET https://export.arxiv.org/api/query?id_list=1403.4462` |
| `epmc-test.json` | Europe PMC: the answer echoes `queryString DOI:"10.1016/j.jneumeth.2015.03.018"`, `resultType core`, `cursorMark *`, `pageSize 2` |
| `pubmed-esearch.json` | PubMed `esearch`: `tensor regression` with the author clause, `count` 3, ids 36240727, 36395140, 40239679 |
| `pubmed-efetch.xml` | PubMed `efetch` (XML) of PMIDs among them 38825216, 25840362, 36240727, 36395140, 40239679 |
| `t.json` | PubMed `esearch` of `O Brien[au]`, `count` 40144 (the translation of an author written with a space) |
| `crossref-search.json` | `GET https://api.crossref.org/works?query.bibliographic=block+term+decomposition+EEG&rows=3&offset=0&select=...` (printed by `$S/livecr.mts`) |
| `crossref-doi.json` | `GET https://api.crossref.org/works/10.1016/j.jneumeth.2015.03.018` (printed by `$S/livecr.mts`) |
| `s2-search.json` | `GET https://api.semanticscholar.org/graph/v1/paper/search?query=block+term+decomposition+EEG&offset=0&limit=3&fields=...`: 429, 174 bytes (printed by `$S/livecr.mts`) |
| `wos-swagger.json` | not a request: `https://developer.clarivate.com/apis/wos-starter/swagger` read as documentation |
| `scopusSearchResp.json` | not a request: `https://dev.elsevier.com/payloads/search/scopusSearchResp.json` read as documentation; `openaccessFlag` added by hand |

Crossref adapter over its two recorded answers (`$S/livecr.out`):
```
crossref search GET https://api.crossref.org/works?query.bibliographic=block+term+decomposition+EEG&rows=3&offset=0&select=... -> 200 3684 bytes
crossref search state ok status undefined total 352043 hits 3
    {"id":"10.1016/j.bspc.2018.07.006","title":"Patient-specific seizure detection in long-term EE","authors":["Muhammad Kaleem","Aziz Guergachi"],"venue":"Biomedical Signal Processing and Control","year":2018,"date":"2018-09","type":"article","cites":45,"doi":"10.1016/j.bspc.2018.07.006","url":"htt
    {"id":"10.1016/j.neucli.2014.11.004","title":"Long-term EEG in adults: Sleep-deprived EEG (SDE),","authors":["V. Michel","L. Mazzola"],"venue":"Neurophysiologie Clinique/Clinical Neurophysiology","year":2015,"date":"2015-03","type":"article","cites":45,"doi":"10.1016/j.neucli.2014.11.004","url":
    {"id":"10.14569/ijacsa.2018.091007","title":"The User Behavior Analysis Based on Text Messages ","authors":["Bilius Laura Bianca"],"venue":"International Journal of Advanced Computer Science and Applications","year":2018,"date":"2018","type":"article","cites":0,"doi":"10.14569/ijacsa.2018.091007
crossref doi GET https://api.crossref.org/works/10.1016/j.jneumeth.2015.03.018? -> 200 32691 bytes
crossref doi state ok status undefined total 1 hits 1
    {"id":"10.1016/j.jneumeth.2015.03.018","title":"Tensor decomposition of EEG signals: A brief revie","authors":["Fengyu Cong","Qiu-Hua Lin"],"venue":"Journal of Neuroscience Methods","year":2015,"date":"2015-06","type":"article","cites":318,"doi":"10.1016/j.jneumeth.2015.03.018","url":"https://do
s2 search GET https://api.semanticscholar.org/graph/v1/paper/search?query=block+term+decomposition+EEG&offset=0&limit=3&fields=title%2Cabstract%2Cyear%2Cvenue%2Cauthors%2CexternalIds%2CcitationCount%2CisOpenAccess%2CopenAccessPdf%2CpublicationTypes%2CpublicationDate%2Cjournal%2Curl%2CcitationStyles 
s2 search state limited status 429 total undefined hits undefined
```

Semantic Scholar adapter over a hand-written answer in the documented Graph API shape (`node $S/s2stub.mts`; there is no recorded answer because the keyless source answers 429):
```
{"state":"ok","total":2,"more":true,"cursor":"3"}
{"source":"semantic_scholar","id":"ffffffffffffffffffffffffffffffffffffffff","title":"Block term decomposition for modelling epileptic seizures","authors":["Borbala Hunyadi","Maarten De Vos"],"type":"article","rank":1,"doi":"10.1186/1687-6180-2014-139","pmid":"25840362","venue":"EURASIP Journal on Advances in Signal Processing","year":2014,"date":"2014-09-12","abstract":"An abstract.","cites":93,"oa":true,"pdf":"https://example.org/a.pdf","url":"https://www.semanticscholar.org/paper/ffffffffffffffffffffffffffffffffffffffff","bibtex":"@article{x}"}
{"source":"semantic_scholar","id":"eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee","title":"Tensor Decompositions for Signal Processing Applications","authors":["A. Cichocki"],"type":"other","rank":2,"doi":"10.48550/arxiv.1403.4462","arxiv":"1403.4462","year":2014,"cites":1700}
```

Versions (`node -p "require('./node_modules/<pkg>/package.json').version"`): `fast-xml-parser` 5.11.2, `@citation-js/core` 0.9.0, `@citation-js/plugin-bibtex` 0.9.0, `zod` 4.6.5 (unchanged).

The citation-js option line (`node_modules/@citation-js/plugin-bibtex/README.md:60`): `| \`config.format.useIdAsLabel\` | \`true\`, [\`false\`] | Use the entry ID as the label instead of generating one. |`. Run (`$S/cj.mjs`): option as loaded `false`, entry `@article{Goh2016Multiway,`; with the option `true`, `@article{W123,`.

## 9. Every file changed, with line counts, and the checks that read the tree

| File | Kind | Lines (diff -rq against the base copy) |
| --- | --- | --- |
| DESIGN.md | changed | +6 -3 |
| HELP.md | changed | +8 -5 |
| config/behavior.yml | changed | +7 -0 |
| config/catalogs/options.yml | changed | +48 -0 |
| config/layout.yml | changed | +1 -1 |
| config/text/app.yml | changed | +1 -1 |
| config/text/views/feeds/literature.yml | new | 103 lines |
| config/text/views/system/history.yml | changed | +1 -0 |
| package-lock.json | changed | +199 -0 |
| package.json | changed | +3 -0 |
| src/lib/data/model/index.ts | changed | +24 -1 |
| src/lib/data/model/model-search.ts | changed | +146 -1 |
| src/lib/data/prose/literature.ts | new | 173 lines |
| src/lib/data/sources/config.ts | changed | +2 -0 |
| src/lib/data/sources/config/local.ts | changed | +64 -1 |
| src/lib/data/sources/config/settings.ts | changed | +33 -8 |
| src/lib/server/content/literature/ask.ts | new | 138 lines |
| src/lib/server/content/literature/bibtex.ts | new | 98 lines |
| src/lib/server/content/literature/desk.ts | new | 138 lines |
| src/lib/server/content/literature/handler.ts | new | 179 lines |
| src/lib/server/content/literature/request.ts | new | 125 lines |
| src/lib/server/content/literature/sources/arxiv.ts | new | 143 lines |
| src/lib/server/content/literature/sources/common.ts | new | 223 lines |
| src/lib/server/content/literature/sources/crossref.ts | new | 164 lines |
| src/lib/server/content/literature/sources/europe-pmc.ts | new | 160 lines |
| src/lib/server/content/literature/sources/index.ts | new | 23 lines |
| src/lib/server/content/literature/sources/openalex.ts | new | 169 lines |
| src/lib/server/content/literature/sources/pubmed.ts | new | 253 lines |
| src/lib/server/content/literature/sources/scopus.ts | new | 185 lines |
| src/lib/server/content/literature/sources/semantic-scholar.ts | new | 161 lines |
| src/lib/server/content/literature/sources/wos.ts | new | 133 lines |
| src/lib/server/edit/entry-edit/entries.ts | changed | +63 -11 |
| src/lib/server/edit/entry-edit/index.ts | changed | +2 -1 |
| src/lib/server/edit/feeds.ts | changed | +200 -1 |
| src/lib/server/edit/writes.ts | changed | +18 -0 |
| src/lib/server/edit/writes/bodies.ts | changed | +13 -0 |
| src/lib/server/edit/writes/undo.ts | changed | +9 -3 |
| src/lib/server/root/context.ts | changed | +4 -0 |
| src/lib/server/root/watch/local.ts | changed | +2 -1 |
| src/lib/state/client/writes.svelte.ts | changed | +6 -0 |
| src/lib/state/feeds/literature/answers.ts | new | 167 lines |
| src/lib/state/feeds/literature/bibtex.ts | new | 85 lines |
| src/lib/state/feeds/literature/form.ts | new | 130 lines |
| src/lib/state/feeds/literature/merge.ts | new | 328 lines |
| src/lib/state/feeds/literature/radar.ts | new | 48 lines |
| src/lib/state/feeds/literature/run.svelte.ts | new | 236 lines |
| src/lib/state/feeds/literature/scholar.ts | new | 19 lines |
| src/lib/state/shared/stores/shapes.ts | changed | +1 -0 |
| src/lib/views/feeds/literature/AddForm.svelte | new | 112 lines |
| src/lib/views/feeds/literature/Head.svelte | new | 168 lines |
| src/lib/views/feeds/literature/Literature.svelte | new | 269 lines |
| src/lib/views/feeds/literature/LiteratureCard.svelte | new | 204 lines |
| src/lib/views/feeds/literature/words.ts | new | 116 lines |
| src/lib/views/personal/calendar/Calendar.svelte | changed | +3 -3 |
| src/routes/api/(docs)/literature/+server.ts | new | 20 lines |
| tests/checks/config/config-folder.test.ts | changed | +2 -0 |
| tests/checks/config/config.test.ts | changed | +3 -0 |
| tests/checks/tree/boundaries.test.ts | changed | +7 -2 |
| tests/data/sources/config/local.test.ts | changed | +34 -2 |
| tests/data/sources/config/settings.test.ts | changed | +58 -7 |
| tests/data/sources/config/wrong-settings.ts | changed | +1 -0 |
| tests/routes/docs/literature.test.ts | new | 234 lines |
| tests/routes/edit/undo/undo.test.ts | changed | +51 -1 |
| tests/server/edit/feeds.test.ts | changed | +145 -1 |
| tests/server/root/context-fixture.ts | changed | +2 -0 |
| tests/state/feeds/literature-merge.test.ts | new | 135 lines |

The 14 files of docs/diagrams (7 .dot and 7 .svg) are regenerated by npm run diagrams: channels.dot, channels.svg, layer-data.dot, layer-data.svg, layer-server.dot, layer-server.svg, layer-state.dot, layer-state.svg, layer-views.dot, layer-views.svg, layers.dot, layers.svg, writes.dot, writes.svg.

`sh utils/unused-exports.sh` on the unchanged copy: `Unused exports (255)`; on this tree the first line is unchanged and the diff of the two outputs is:
```
57c57
< src/lib/server/edit/writes.ts: coerce, createIdea, fieldTypes, insideHub, writeDeck, collectionFile, createEntry, iden
---
> src/lib/server/edit/writes.ts: coerce, createIdea, fieldTypes, insideHub, writeDeck, collectionFile, createEntry, iden
59c59
< src/lib/server/edit/writes/config/config-checks.ts: optionText, replacedText
---
> src/lib/server/edit/writes/config/config-checks.ts: optionText
```
Added by this step: `radarAddWrite` in the re-export list of `src/lib/server/edit/writes.ts`, next to `leadAddWrite`, which the unchanged copy lists the same way (the write route reaches the parser through `writes/bodies.ts`). Removed from the list: `replacedText`, which the Lit Watch undo now uses.

`grep -rn "X-ELS-APIKey\|X-ApiKey\|x-api-key\|api_key" src`, each hit judged: `sources/semantic-scholar.ts:3` (comment) and `:87`, `bibtex.ts:58`: the `x-api-key` header from `keys.semanticScholarKey`, the only places that key leaves; `sources/wos.ts:2` (comment) and `:99`: the `X-ApiKey` header; `sources/scopus.ts:1` (comment) and `:108`: the `X-ELS-APIKey` header; `sources/pubmed.ts:171`, `sources/openalex.ts:3` (comment) and `:128`: the `api_key` query parameter those two APIs document, in an address that `ask.ts` never puts in a message (`SourceStop` names the source, the status and a plain code). All 10 hits (4 of them comments) are key transport and none is a log, message or answer. T2 asserts no key text in any answer, failure line or source list.

`grep -rn "literature\|radar-add\|radar_add\|addRadarEntry\|e1-e5" src config HELP.md DESIGN.md --exclude=local.yml` (case-insensitive, counted per file), each file judged: the literature folders and `config/text/views/feeds/literature.yml` are the step; `server/edit/writes.ts`, `writes/undo.ts`, `writes/bodies.ts`, `edit/feeds.ts`, `state/client/writes.svelte.ts`, `state/shared/stores/shapes.ts`: the write; `server/root/context.ts`, `watch/local.ts`, `data/index.ts` (the existing `radar: feeds/literature-radar.yml` path), `data/model/*`, `data/sources/config*`, `data/prose/literature.ts`, `routes/api/(docs)/literature/+server.ts`, `config/behavior.yml`, `config/layout.yml`, `config/sources.yml` (the existing `radar_file: feeds/literature-radar.yml`), `config/catalogs/options.yml`, `config/text/views/system/history.yml`, `Calendar.svelte` (head comment), DESIGN.md and HELP.md: each is a place this step adds, or the existing name of the radar file. `e1-e5` appears in none.

## 10. Head comments and paragraphs of the changed files: still true or rewritten

| Item | Result |
| --- | --- |
| `views/personal/calendar/Calendar.svelte` head | rewritten: it says the pane holds the feeds and the Literature search follows the Calendar |
| `server/edit/entry-edit/entries.ts` head and the comments of `startEntries`, `appendEntry` | still true for the head ("entry insertion"); the two functions' comments name the empty list forms they now accept |
| `server/edit/entry-edit/index.ts` head | still true; the export list gains `takeOutAppended` |
| `server/edit/feeds.ts` head | still true ("Reads and edits the generated YAML feeds"); `addRadarEntry`, `removeRadarEntry` and `radarBucketKeys` carry their own comments |
| `server/edit/writes.ts` head | still true (the order of refusals is unchanged; `radar-add` follows `lead-add`) |
| `server/edit/writes/bodies.ts` head | still true; `RadarAddWrite` and `radarAddWrite` carry their own comments |
| `server/edit/writes/undo.ts` head | still true (one table, read twice); the `radar-add` rows sit in the two tables it names |
| `server/root/context.ts` member comment | new: "The pacing of the literature sources and the answers kept for a repeated search." |
| `server/root/watch/local.ts` head | still true; `FIELDS` gains `literature` |
| `data/sources/config/settings.ts` head | rewritten: the list of readers names the Literature search |
| `data/model/index.ts`, `data/sources/config/local.ts`, `data/sources/config.ts` heads | still true; `LiteratureKeys`, `literatureSettings` and the `literature` reader carry their own comments |
| `data/model/model-search.ts` head | rewritten: it names the literature search's vocabulary (sources, states, document types, refusal words, the hit) |
| `state/client/writes.svelte.ts` head | still true; `addRadarEntry` carries its comment |
| `tests/checks/tree/boundaries.test.ts` head | rewritten: the paragraph naming the pure helpers of the state row gains `data/prose/literature` |
| `tests/checks/config/config-folder.test.ts`, `config.test.ts` heads | still true; the tables gain the `literature` key and `views/feeds/literature.yml` |
| `tests/data/sources/config/settings.test.ts` head | rewritten: the list of readers names the literature search |
| DESIGN.md `Untyped input`, `Writing`, `Local data` sentences; HELP.md view table, rail paragraph, chord table, `behavior.yml`/`local.yml` rows | rewritten, before and after in section 11 |

## 11. Each DESIGN.md and HELP.md sentence added or rewritten, before and after

(`diff` of the unchanged copy against this tree, split into sentences; a hunk that is new has no before.)

**DESIGN.md, diff hunk 85c85**

Before: What the portfolio reads in `sources.yml` (the tier scan paths, the registry and collection files, the document and feed paths) and the map from a file name to its language (`languages:`, a language's name against the file name endings it claims); words and their colours in `catalogs/vocab.yml` (the palette, the research `domains`, the status legend and palette, the focus lanes, the venue tiers, the venue and dataset theme words with their labels, the radar buckets); how things are arranged in `layout.yml` (the rail's pages and their arrangements, the view catalogue's groups, the board chrome, the tab rollups, the live badges, which title a surface draws); thresholds and horizons in `behavior.yml`, which also holds the source editor's `editor:` block (`tab_size`, `insert_spaces`, `word_wrap`, `minimap`, `render_whitespace`, `sticky_scroll`, the per-language `languages:` records of `tab_size`, `insert_spaces`, `word_wrap` and `rulers`, and `paint_limit_kb`), which a repository's `.oculus/settings.yml` `languages:` map overrides per language for the files of that root, through `resolveEditor` of `data/helpers/editor.ts` and `parseRepoSettings` of `data/sources/config/editor-options.ts`; the UI theme list with each theme's glyph, the wallpaper, the CRT default and the code theme (`code_theme:`, `tokens` or the id of a Shiki theme, which the Code theme row under This browser in the Settings view overrides per browser, just as its CRT row overrides `crt.default`; only the editors' syntax colours follow it, and Markdown code and the read-only code windows stay on highlight.js and the tokens) in `appearance.yml`; the glyph vocabulary in `catalogs/glyphs.yml` and the icon each of its names is drawn as in `catalogs/icons.yml`; every user-facing string in the catalog fragments under `config/text/`, read through `t("group.key")` on the client and, for the data layer's findings and the audit's, through `findingText` of `data/helpers/finding-text.ts` on the server; the edit form in `catalogs/manifest-schema.yml`; the tool's own identity in `catalogs/meta.yml`; the agent composer's models, efforts and permission modes in `catalogs/agents.yml`; every option of every config file in `catalogs/options.yml`, read through `catalogOf` of `data/sources/config/catalog/options.ts`, with its description, its default, the `heading` the Settings view lists it under (one of ten subject words, `unheaded` when it names none or an unknown one) and its `section`.

After: What the portfolio reads in `sources.yml` (the tier scan paths, the registry and collection files, the document and feed paths) and the map from a file name to its language (`languages:`, a language's name against the file name endings it claims); words and their colours in `catalogs/vocab.yml` (the palette, the research `domains`, the status legend and palette, the focus lanes, the venue tiers, the venue and dataset theme words with their labels, the radar buckets); how things are arranged in `layout.yml` (the rail's pages and their arrangements, the view catalogue's groups, the board chrome, the tab rollups, the live badges, which title a surface draws); thresholds and horizons in `behavior.yml`, which also holds the source editor's `editor:` block (`tab_size`, `insert_spaces`, `word_wrap`, `minimap`, `render_whitespace`, `sticky_scroll`, the per-language `languages:` records of `tab_size`, `insert_spaces`, `word_wrap` and `rulers`, and `paint_limit_kb`), the Literature search's `literature:` block (`timeout_s`, `per_source`, `cache_min`), which a repository's `.oculus/settings.yml` `languages:` map overrides per language for the files of that root, through `resolveEditor` of `data/helpers/editor.ts` and `parseRepoSettings` of `data/sources/config/editor-options.ts`; the UI theme list with each theme's glyph, the wallpaper, the CRT default and the code theme (`code_theme:`, `tokens` or the id of a Shiki theme, which the Code theme row under This browser in the Settings view overrides per browser, just as its CRT row overrides `crt.default`; only the editors' syntax colours follow it, and Markdown code and the read-only code windows stay on highlight.js and the tokens) in `appearance.yml`; the glyph vocabulary in `catalogs/glyphs.yml` and the icon each of its names is drawn as in `catalogs/icons.yml`; every user-facing string in the catalog fragments under `config/text/`, read through `t("group.key")` on the client and, for the data layer's findings and the audit's, through `findingText` of `data/helpers/finding-text.ts` on the server; the edit form in `catalogs/manifest-schema.yml`; the tool's own identity in `catalogs/meta.yml`; the agent composer's models, efforts and permission modes in `catalogs/agents.yml`; every option of every config file in `catalogs/options.yml`, read through `catalogOf` of `data/sources/config/catalog/options.ts`, with its description, its default, the `heading` the Settings view lists it under (one of ten subject words, `unheaded` when it names none or an unknown one) and its `section`.

**DESIGN.md, diff hunk 132a133,134**

Before: (nothing, the paragraph or row is new)

After: **Literature search.** One query over eight scholarly sources, answered by `GET /api/literature` behind the origin check and the write token, since a search puts the reader's query in a request to a third party and spends the keys of `local.yml`. The route has three forms, `?sources` (the eight sources, whether each needs a key and has it, and the name of the key, never a value), `?source=<id>&q=...` (one source's search, its answer `ok` with the hits or a state: `limited`, `timeout`, `refused`, `failed`, `no-key` or `skipped`) and `?bibtex&doi=...` (one entry as a source serves it). The page sends one request per source that is on and merges the answers as they arrive, so a slow source never holds a fast one, and a state of one source is that source's answer, never an error of the route. The adapters are in `server/content/literature/sources/`, one per source, each reading its answer through a zod schema beside it, with `fast-xml-parser` reading PubMed's `efetch` and arXiv's Atom. Every request goes through `ServerContext.literature`, a `LiteratureDesk` that holds one lane per source (one request in flight, and a minimum gap between two starts: 3000 ms for arXiv, 1000 ms for Crossref and Semantic Scholar, 340 ms for PubMed without a key and 100 ms with one) and the cache of `ok` answers (at most 200, kept `literature.cache_min` minutes under a key of the source and every parameter, no key among them), so no module keeps either as state of its own. Each request is given `literature.timeout_s` seconds, an answer is read to 5 MB and no further, and a 429 is never retried. A key is a header or a query parameter of the request to its source, read from `locals.server.local` at each request, and it is in no answer, no refusal word, no log line and no thrown message: a failure names the source, the status and the source's own plain code, never the address or the body. The merge, the filters applied again after the fetch, and the sort are pure functions in `state/feeds/literature/`, so a change of sort asks nothing.

**DESIGN.md, diff hunk 151c153**

Before: What is read that way on the server: the socket's subscribe message and the terminal socket's frames, the hook's request body, the request bodies of the write endpoint and of the terminal, git, deposit, file-browser write, file operations (`/api/ops`, through a module-level shape of `server/files/fs/ops.ts` that is held to `OpsRequest` with `satisfies`), source, open, account add, mail triage and memories upload routes, a line of the changes log and the values it records for an undo, the output of cloc, ripgrep and `gh`, the YAML and JSON files the writers parse, the records of a Claude transcript and of a Codex rollout, which the fold, the turns reader and the usage table read, the files of Claude, Codex and oculus (the fold cache, the overrides file, a Claude session registry file and the hooks of a settings file among them), the answers of the mail and calendar providers, and the configuration.

After: What is read that way on the server: the socket's subscribe message and the terminal socket's frames, the hook's request body, the request bodies of the write endpoint and of the terminal, git, deposit, file-browser write, file operations (`/api/ops`, through a module-level shape of `server/files/fs/ops.ts` that is held to `OpsRequest` with `satisfies`), source, open, account add, mail triage and memories upload routes, a line of the changes log and the values it records for an undo, the output of cloc, ripgrep and `gh`, the YAML and JSON files the writers parse, the records of a Claude transcript and of a Codex rollout, which the fold, the turns reader and the usage table read, the files of Claude, Codex and oculus (the fold cache, the overrides file, a Claude session registry file and the hooks of a settings file among them), the answers of the mail and calendar providers, the answers of the literature sources, and the configuration.

**DESIGN.md, diff hunk 403a406**

Before: (nothing, the paragraph or row is new)

After: - The Literature search view. `literature` is a listed view of the Incoming group at order 5, after the Calendar, so the chords of the views before it stay as they are and the group's are `e1-e6`; its tab sits after LinkedIn in the first pane of the Incoming arrangement. Its query, filters, sort and toggles are the tab's instance state, and its answers are not saved: a held query is asked again when the tab is drawn, which the server's cache answers within `literature.cache_min`. A keyed source (Web of Science, Scopus) whose key the machine does not hold is a toggle that cannot be pressed, its tooltip naming the `local.yml` key, and the six keyless sources are never disabled. Add to Lit Watch is the write kind `radar-add`, which appends one entry to the radar file through `addRadarEntry` and which History undoes byte for byte; the view writes no other file and never a `.bib`.

**HELP.md, diff hunk 19c19**

Before: As shipped there are eleven, top to bottom: Focus, Sessions, Projects, Incoming (the Inbox, Lit Watch, Position Leads and LinkedIn feeds beside the Calendar), Explorer (Files, Repositories and Search, with an empty pane beside them), Academic Life, Pillars, References, Present, Help (this manual and the HPC how-to beside Research approach, Agent approach, Data map and the Memories wall) and System (Settings, Account setup, the Views catalogue, Pages, Status, Findings, Audit, History, the gallery and Processes).

After: As shipped there are eleven, top to bottom: Focus, Sessions, Projects, Incoming (the Inbox, Lit Watch, Position Leads, LinkedIn and Literature search views beside the Calendar), Explorer (Files, Repositories and Search, with an empty pane beside them), Academic Life, Pillars, References, Present, Help (this manual and the HPC how-to beside Research approach, Agent approach, Data map and the Memories wall) and System (Settings, Account setup, the Views catalogue, Pages, Status, Findings, Audit, History, the gallery and Processes).

**HELP.md, diff hunk 68c68**

Before: | e1-e5 | open a view of the Incoming page's group |

After: | e1-e6 | open a view of the Incoming page's group |

**HELP.md, diff hunk 130a131**

Before: (nothing, the paragraph or row is new)

After: | `literature` | Literature search | One query asked of OpenAlex, Semantic Scholar, Crossref, PubMed, Europe PMC and arXiv, and of Web of Science and Scopus when `local.yml` holds their keys. A toggle per source, each with the state of its answer beside it (the number of hits, rate limited with the wait the source named, no answer within `literature.timeout_s`, key refused with the status, failed, skipped when the source cannot hold a filter), and a toggle that cannot be pressed names its `local.yml` key in its tooltip. The hits are merged into papers when they share a DOI, a PubMed id or an arXiv id, and a preprint and its published version are one paper when some source names both. Filters: year range, document type, open access only, venue, author and minimum citations; each is also applied to the merged list, so a source that ignored a filter shows nothing outside it. Sort by relevance, date or citations changes the order and asks nothing; `More` asks the next page of every source that has one. A card shows the authors, the venue, year, type and citations (each source's count in the tooltip), one tag per source, the abstract under a disclosure, Open PDF when a source names an open one, Copy BibTeX (from doi.org, Semantic Scholar or the arXiv DOI, else formatted by citation-js; it writes no file) and Add to Lit Watch, which asks for a bucket, a project, the relevance and a note, appends the entry to the radar file and reads `In Lit Watch` afterwards. A search sends the query and its filters to the sources that are on and to nothing else. Google Scholar is a link that opens the same query on its site, since it has no API and its terms forbid scraping. |

**HELP.md, diff hunk 267c268**

Before: | `behavior.yml` | Thresholds, horizons and cadences: read limits, the `refresh_stale_days` thresholds of the refresh strip, the context window, the Live HPC settings, the audit's waiting statuses and mute list, the source editor's `editor.paint_limit_kb`, `editor.tab_size`, `editor.insert_spaces`, `editor.word_wrap`, `editor.minimap`, `editor.render_whitespace`, `editor.sticky_scroll` and the per-language `editor.languages` records, the Files view's `files.confirm_delete` (true asks before a delete to the Trash), the update tasks' `tasks.skip_permissions`, the application `open.program_ext` names for each extension that may open, git (the commit-message model and the auto fetch period `git.autofetch_minutes`) and chat. |

After: | `behavior.yml` | Thresholds, horizons and cadences: read limits, the `refresh_stale_days` thresholds of the refresh strip, the context window, the Live HPC settings, the audit's waiting statuses and mute list, the source editor's `editor.paint_limit_kb`, `editor.tab_size`, `editor.insert_spaces`, `editor.word_wrap`, `editor.minimap`, `editor.render_whitespace`, `editor.sticky_scroll` and the per-language `editor.languages` records, the Files view's `files.confirm_delete` (true asks before a delete to the Trash), the Literature search's `literature.timeout_s`, `literature.per_source` and `literature.cache_min`, the update tasks' `tasks.skip_permissions`, the application `open.program_ext` names for each extension that may open, git (the commit-message model and the auto fetch period `git.autofetch_minutes`) and chat. |

**HELP.md, diff hunk 278c279**

Before: | `local.yml` | This machine's own values, read on their own and never merged into the configuration: the hub path, the port, the ssh alias of the cluster, the Claude command, the program an address is opened with, the account folders, the calendar accounts, the mail accounts and where the machine-local state is kept. |

After: | `local.yml` | This machine's own values, read on their own and never merged into the configuration: the hub path, the port, the ssh alias of the cluster, the Claude command, the program an address is opened with, the account folders, the calendar accounts, the mail accounts, the Literature search's keys and where the machine-local state is kept. |

**HELP.md, diff hunk 282c283**

Before: Its keys are `hub`, the absolute path of the research hub; `port`, the port the server listens on; `hpc_host`, the ssh alias the Live HPC view uses, which takes precedence over the host of the cluster that `slurm.resource` of `behavior.yml` names; `claude_bin`, the Claude command the update tasks and the chat terminal run; `open_bin`, the program a provider's consent page and an event's link are handed to, macOS `open` when absent; `accounts`, the agent account folders the Usage view reads; `calendars`, the calendar accounts the Calendar view reads, one `provider` (`google` or `microsoft`) and one `label` each, written by the view's Add account and Remove with the file's comments kept; `mail`, the mail accounts the Inbox view reads, written the same way; and `calendar_dir`, `mail_dir`, `sessions_cache`, `sessions_overrides`, `workspaces`, `bookmarks`, `notes`, `changes`, `history` and `approvals`, the places the calendar credential files, the mail credential files and triage notes, the session cache, the per-session overrides, the saved workspaces, the reader's own bookmarks, the scratch notes, the change log and the local history of files and the approved texts of project commands are kept in; a value of these that is `~` or starts with `~/` is under the home folder, as an account's `dir` is, and any other relative value is resolved against the engine folder.

After: Its keys are `hub`, the absolute path of the research hub; `port`, the port the server listens on; `hpc_host`, the ssh alias the Live HPC view uses, which takes precedence over the host of the cluster that `slurm.resource` of `behavior.yml` names; `claude_bin`, the Claude command the update tasks and the chat terminal run; `open_bin`, the program a provider's consent page and an event's link are handed to, macOS `open` when absent; `accounts`, the agent account folders the Usage view reads; `calendars`, the calendar accounts the Calendar view reads, one `provider` (`google` or `microsoft`) and one `label` each, written by the view's Add account and Remove with the file's comments kept; `mail`, the mail accounts the Inbox view reads, written the same way; `literature`, a map of the Literature search's keys, `wos_key` (Web of Science), `scopus_key` and `scopus_insttoken` (Scopus), `openalex_key`, `semantic_scholar_key`, `ncbi_key` (PubMed) and `mailto` (the contact address Crossref, OpenAlex and PubMed ask for), each a non-empty text and each optional; and `calendar_dir`, `mail_dir`, `sessions_cache`, `sessions_overrides`, `workspaces`, `bookmarks`, `notes`, `changes`, `history` and `approvals`, the places the calendar credential files, the mail credential files and triage notes, the session cache, the per-session overrides, the saved workspaces, the reader's own bookmarks, the scratch notes, the change log and the local history of files and the approved texts of project commands are kept in; a value of these that is `~` or starts with `~/` is under the home folder, as an account's `dir` is, and any other relative value is resolved against the engine folder.

Before: (nothing)

After: A `literature` that is not a map, or a key under it that is not a non-empty text, is such a key as well, and a key under it that is not one of these seven is warned of and ignored.

**HELP.md, diff hunk 295a297,298**

Before: (nothing, the paragraph or row is new)

After: The Literature search sends the query and its filters from the server to the sources toggled on, with the keys of `local.yml` in a header or a parameter of the request, and a key is never in an answer, a message or a log line. It reads the sources' answers and writes nothing but the Lit Watch entry the reader adds.

## 12. What is next

The orchestrator reads the diff of the 66 files outside `docs/diagrams`, adds the titles of T1 to T5 to their guarded entries, lands the package, and runs the look on TEST (cases 1, 5, 6, 7, 10, 13 to 17, 19, 20 on the live sources, a Copy BibTeX and an Add to Lit Watch with its undo from the History view).

## 13. Repair round 1

Items 1 to 8 of `agents/briefs/D38-round1.md`, all done. Not done in this round: P1 and P2, which the brief assigns elsewhere (P2 stays on the look's list: Semantic Scholar over a real answer).

Full-list runs (`sh /Users/axelfaes/.claude-work/skills/land/templates/checks.sh <main checkout>/tools/oculus/.scratch/migration/orchestrator-state.md`, which runs `npm run test:quick`): **3 in this round**. The first (`$S/D38-r1-checks-run1.log`) ended `test:quick: 33.9 s (limit 45.0 s); failed: eslint` on `desk.ts:46:36 no-confusing-void-expression` in the new `turnOrAbort`; the second (`D38-r1-checks-run2.log`) passed; `npm run diagrams` then changed `docs/diagrams/layer-server.dot` and `.svg` (the edge `server/content` to `server/accounts` went from 2 to 3 imports, from the `httpsLink` import of item 1), so the third run (`D38-r1-checks.log`) is on the final tree: `test:quick: 12.5 s (limit 45.0 s); every command passed` and `checks: 1 commands passed`. Over the whole task that is 8 + 3 = 11 full-list runs.

Other commands on the final tree: `npx vitest run tests/checks` gives `Test Files  16 passed (16)` / `Tests  229 passed (229)`; the six-file command gives `Test Files  6 passed (6)` / `Tests  88 passed (88)` (99 before item 7 folded 11 tests into their named tests, none of their assertions deleted: below); `sh utils/folder-check.sh` exit 0; `npm run format:check` clean; the ASCII gate over src, tests and config prints nothing.

"Before" below is a copy of the tree with only this round's edit of that item put back (`$S/r1before` for items 1, 2 and 6; `$S/m13` for items 3, 4 and 5, the working copy of the first build, which differs from the round's start only in `sources/common.ts:152-153`). "After" is the worktree. The stub script is `ROOT=<tree> node $S/round1.mts` (stub `fetch`, no request leaves).

| Item | Change (file:line) | Run that shows it | Before the change |
| --- | --- | --- | --- |
| 1. B1, OpenAlex `http:` landing page | `sources/openalex.ts:153` is `url: httpsLink(one.primary_location?.landing_page_url ?? undefined) ?? one.id`; the import is at `:7` | `ROOT=$PWD node $S/round1.mts`: `item 1 openalex {"title":"Landing http","url":"https://openalex.org/W5"}` (landing page `http://x.org/p`); the `https:` landing page keeps its address and a hit with none takes `https://openalex.org/W7`. `cases.log` line 48 and `cases2.log` line 3 now print `url` = the OpenAlex id for the same stub | `ROOT=$S/r1before node $S/round1.mts`: `item 1 openalex {"title":"Landing http","url":null}` |
| 2. B2, Scopus record link | `sources/scopus.ts:87-109` adds `recordLink`, which reads `http://www.scopus.com/...` as the same address over `https:` when the host is exactly `www.scopus.com` and no port is written, and leaves every other link as given; `:165` is `url: recordLink(one.link)` | same script: `item 2 scopus {"rank":5,"doi":null,"url":"https://www.scopus.com/inward/record.url?partnerID=HzOxMe3b&scp=84886423686"}` (the documented sample's fifth hit, the one with no DOI) and ranks 1 to 4 print theirs; `item 2 other host [null,null,null,null,null]` for `evil.example.com` and `item 2 other port [null,null,null,null,null]` for `www.scopus.com:8080` (case 37 holds). `case58.log` now prints `url` on all five hits | before: `item 2 scopus {"rank":5,"doi":null,"url":null}` and `url":null` on ranks 1 to 4 |
| 3. S1, open kinds | `DESIGN.md:326`: `lead-add`, `radar-add`, `linkedin-idea` in the list of open kinds; the sentence that `app-store` is the kind in neither set is true again | `grep -c "radar-add" DESIGN.md` prints 2 (lines 326 and 406); `grep -o "feed-delete\`, \`lead-add\`, \`radar-add\`" DESIGN.md` matches | `grep -c "radar-add" $S/m13/DESIGN.md` printed 0, so the sentence named `app-store` as the one kind in neither set while `radar-add` was in neither |
| 4. T1, Calendar head | `views/personal/calendar/Calendar.svelte:2`: "the fifth of the Incoming page's group" | `grep -rn "order: [0-9]" src/lib/views` for the group: Inbox 0, Radar 1, Leads 2, LinkedIn 3, `Calendar.svelte:12` 4, `Literature.svelte:10` 5; the calendar is the fifth of six | `$S/m13` line 2: "The calendar is the fourth of the Incoming page's group" |
| 5. T2, comments in `sources/common.ts` | `:179-183` is one doc comment whose sentence runs "A record that does not read is left out; a page none of whose records read is a source whose answer changed shape, and it is `failed`." wrapped at the comment width; `:198-199` has the doc comment of `looseText` directly above `export const looseText` | `npx prettier --check src/lib/server/content/literature/sources/common.ts` clean; `sed -n 179,183p` and `sed -n 197,200p` of the file | `$S/m13` lines 180-181: " * record that does not read is left out;" then " * a page none of whose records read is a source whose answer changed shape, and it is `failed`." and a blank line between the doc comment and `export const looseText` |
| 6. T3, abort while waiting | `server/content/literature/desk.ts:36-52` adds `reasonOf` and `turnOrAbort`, which resolves with the request before it or rejects with the signal's reason the moment the signal aborts; `:68-76` is the doc comment, now true; `:89-109` waits with `turnOrAbort`, and a waiter that never took its turn releases the lane only after the request before it ended (`void turn.then(release)`), so the next request still follows that request in order and measures its gap from it | `node $S/round1.mts` (3 requests on one lane, gap 2400 ms, the first takes 2000 ms; the second is aborted 100 ms in): `item 6 first starts 0 \| second rejected 'page gone' 1 ms after the abort \| first ends 2003 \| third starts 2402`; an abort during the gap wait: `item 6 gap wait a 0 \| b rejected 'page gone' 0 ms after the abort \| c starts 1502` | `ROOT=$S/r1before`: `item 6 first starts 0 \| first ends 2003 \| third starts 2402 \| second rejected 'page gone' 2277 ms after the abort` (the aborted request waited for the one in flight; the gap-wait row is unchanged, 0 ms) |
| 7. T4, tests folded into the named tests | below: 11 test cases folded into their named tests (99 to 88 cases) with every assertion kept: `feeds.test.ts` (1 case), `literature.test.ts` (1), `local.test.ts` (2), `settings.test.ts` (7 into 1, three groups of one case each) | `npx vitest run` on the six files: 88 passed; each folded assertion fails with its behaviour removed (mutation table below) | the review's list: `literature.test.ts:189`, `feeds.test.ts:327`, `local.test.ts:201` and `:218`, the `literatureSettings` describe with 3 cases (`it`, `it.each` of 6 rows, `it`) |
| 8. S2, departures | stay as built; named in the next section | n/a | n/a |

### Item 6 and items 1 and 2: the stub runs
After:
```
item 1 openalex {"title":"Landing http","url":"https://openalex.org/W5"}
item 1 openalex {"title":"Landing https","url":"https://x.org/q"}
item 1 openalex {"title":"No landing","url":"https://openalex.org/W7"}
item 2 scopus {"rank":1,"doi":"10.1016/j.fm.2013.08.011","url":"https://www.scopus.com/inward/record.url?partnerID=HzOxMe3b&scp=84884919538"}
item 2 scopus {"rank":2,"doi":"10.1016/j.ceb.2013.10.008","url":"https://www.scopus.com/inward/record.url?partnerID=HzOxMe3b&scp=84888056396"}
item 2 scopus {"rank":3,"doi":"10.1080/00029157.2013.768197","url":"https://www.scopus.com/inward/record.url?partnerID=HzOxMe3b&scp=84884272794"}
item 2 scopus {"rank":4,"doi":"10.1016/j.tourman.2013.08.009","url":"https://www.scopus.com/inward/record.url?partnerID=HzOxMe3b&scp=84884527646"}
item 2 scopus {"rank":5,"doi":null,"url":"https://www.scopus.com/inward/record.url?partnerID=HzOxMe3b&scp=84886423686"}
item 2 other host [null,null,null,null,null]
item 2 other port [null,null,null,null,null]
item 6 first starts 0 | second rejected 'page gone' 1 ms after the abort | first ends 2003 | third starts 2402
item 6 gap wait a 0 | b rejected 'page gone' 0 ms after the abort | c starts 1502
```
Before:
```
item 1 openalex {"title":"Landing http","url":null}
item 1 openalex {"title":"Landing https","url":"https://x.org/q"}
item 1 openalex {"title":"No landing","url":"https://openalex.org/W7"}
item 2 scopus {"rank":1,"doi":"10.1016/j.fm.2013.08.011","url":null}
item 2 scopus {"rank":2,"doi":"10.1016/j.ceb.2013.10.008","url":null}
item 2 scopus {"rank":3,"doi":"10.1080/00029157.2013.768197","url":null}
item 2 scopus {"rank":4,"doi":"10.1016/j.tourman.2013.08.009","url":null}
item 2 scopus {"rank":5,"doi":null,"url":null}
item 2 other host [null,null,null,null,null]
item 2 other port [null,null,null,null,null]
item 6 first starts 0 | first ends 2003 | third starts 2402 | second rejected 'page gone' 2277 ms after the abort
item 6 gap wait a 0 | b rejected 'page gone' 0 ms after the abort | c starts 1502
```

### Item 7: every changed assertion, before and after

| File | Before | After |
| --- | --- | --- |
| `tests/routes/docs/literature.test.ts` (T2) | `it('names the key a keyed source needs and never its value')` at `:189`: the eight ids in the route's order; `wos` is `{ id: 'wos', keyed: true, available: true, key: 'wos_key' }` with the keys held; with `keys: {}` the unavailable sources are `wos` and `scopus` | the `?sources` rows of the table of `never answers a key, in a hit, a failure line or the source list`: `{ name: 'the source list', ..., check: namesKeys(true) }` and a new row `the source list with no key held` with `keys: {}` and `check: namesKeys(false)`; `namesKeys` (`:105`) asserts the same eight ids in order, `wos` as `{ id, keyed: true, available: held, key: 'wos_key' }`, and the unavailable ids `[]` or `['wos', 'scopus']`. The row type gains `keys?` and `check?`; the loop passes `keys: row.keys ?? KEYS` and calls `row.check?.(body)` (`:199`, `:209`) |
| `tests/server/edit/feeds.test.ts` (T3) | `it('refuses a bucket outside the vocabulary, a relevance outside the three words and a missing title')` at `:327`: three `add` calls on a fresh file with `bucket: 'nonsense'`, `relevance: 'huge'` and `title: '  '`, `refused[0].field` equal to `bucket`, `relevance`, `title`, and the file unchanged | the same three calls inside `adds a Lit Watch entry in the order given and ...` after the duplicate title and address rows (`:262-269`), on `{ ...ADD, title: 'A fresh title', url: 'https://example.org/fresh' }` so the duplicate rule is not the one that refuses, with `readFileSync(into.file)` equal to `source` after them |
| `tests/data/sources/config/local.test.ts` (local table and cases) | `it('warns once of an unknown key under literature ...')` at `:201` (problems `[]`, `unknown` `['literature.foo']`, `config.literature` `{ wosKey: 'k' }`, one warning containing `ignoring unknown key(s) literature.foo`) and `it('keeps the rest of the file when literature is wrong ...')` at `:218` (a wrong map: `port` 9001, `literature` undefined, problem key `literature`; a wrong key: `port` 9001, `literature` `{ mailto: 'a@b.c' }`, problem key `literature.wos_key`) | the first moved to the end of `warns of an unknown key only when asked, and loadLocal asks every call` (`:212-224`), the same five assertions on a second engine file; the second moved to the end of `keeps the good keys when one is wrong` (`:104-114`), the same assertions on `readLocalText`; both texts are also two entries of the `texts` list of `localFindings words each problem ...` (`:243-244`), which asserts a finding per problem naming the same key. The `checkLocal` rows for `literature: abc`, `{ wos_key: 3 }` and `{ mailto: '' }` (`:85-87`) were already in the table |
| `tests/data/sources/config/settings.test.ts` (T5) | the `literatureSettings` describe with `it` (the written values and 0 minutes; the default for undefined), `it.each` of 6 rows (`timeout_s`, `per_source`, `cache_min`, each `range` and `whole`, each with the `NOT_FINITE` values) and `it` (`read(5)` answers the defaults and `literature: block`) | one `it('answers the written values, and the default with the key named for each wrong value or a block that is no map')` (`:292-325`) holding the same three groups of assertions, the six rows as the array `wrong` (`:309`), like `searchSettings`'s single case |

Each folded assertion fails with its behaviour removed (`$S/r1mut`, a copy of the final tree, one edit at a time, the named file run alone; `$S/round1-mutations.out`):
```
feeds.ts bucket check off: exit 1 | 1 failed | 5 passed (6) | ['FAIL  |unit| tests/server/edit/feeds.test.ts > Lit Watch writes > adds a Lit Watch entry in the order given and refuses one whose title or address is in the file']
feeds.ts relevance check off: exit 1 | 1 failed | 5 passed (6) | ['FAIL  |unit| tests/server/edit/feeds.test.ts > Lit Watch writes > adds a Lit Watch entry in the order given and refuses one whose title or address is in the file']
feeds.ts missing-title check off: exit 1 | 1 failed | 5 passed (6) | ['FAIL  |unit| tests/server/edit/feeds.test.ts > Lit Watch writes > adds a Lit Watch entry in the order given and refuses one whose title or address is in the file']
handler.ts key name dropped: exit 1 | 1 failed | 1 passed (2) | ['FAIL  |unit| tests/routes/docs/literature.test.ts > the literature route > never answers a key, in a hit, a failure line or the source list', "AssertionError: expected { id: 'wos', keyed: true, …(2) } to strictly equal { id: 'wos', keyed: true, …(2) }"]
handler.ts availability always true: exit 1 | 1 failed | 1 passed (2) | ['FAIL  |unit| tests/routes/docs/literature.test.ts > the literature route > never answers a key, in a hit, a failure line or the source list', "AssertionError: expected { id: 'wos', keyed: true, …(2) } to strictly equal { id: 'wos', keyed: true, …(2) }"]
local.ts unknown literature key not reported: exit 1 | 1 failed | 28 passed (29) | ['FAIL  |unit| tests/data/sources/config/local.test.ts > readLocal and loadLocal > warns of an unknown key only when asked, and loadLocal asks every call', "AssertionError: expected [] to strictly equal [ 'literature.foo' ]"]
local.ts wrong literature map not a problem: exit 1 | 3 failed | 26 passed (29) | ['FAIL  |unit| tests/data/sources/config/local.test.ts > checkLocal > answers "literature: abc" with the sentence it would throw', "AssertionError: expected null to be 'local.yml: literature must be a map' // Object.is equality"]
local.ts wrong literature key not a problem: exit 1 | 4 failed | 25 passed (29) | ['FAIL  |unit| tests/data/sources/config/local.test.ts > checkLocal > answers "literature: { wos_key: 3 }" with the sentence it would throw', "AssertionError: expected null to be 'local.yml: literature.wos_key must be…' // Object.is equality"]
settings.ts timeout_s ignores the file: exit 1 | 2 failed | 38 passed (40) | ['FAIL  |unit| tests/data/sources/config/settings.test.ts > literatureSettings > answers the written values, and the default with the key named for each wrong value or a block that is no map', 'AssertionError: expected { value: { timeoutS: 40, …(2) }, …
settings.ts per_source ignores the file: exit 1 | 2 failed | 38 passed (40) | ['FAIL  |unit| tests/data/sources/config/settings.test.ts > literatureSettings > answers the written values, and the default with the key named for each wrong value or a block that is no map', 'AssertionError: expected { value: { timeoutS: 9, …(2) }, …
settings.ts cache_min ignores the file: exit 1 | 2 failed | 38 passed (40) | ['FAIL  |unit| tests/data/sources/config/settings.test.ts > literatureSettings > answers the written values, and the default with the key named for each wrong value or a block that is no map', 'AssertionError: expected { value: { timeoutS: 9, …(2) }, …(
```

### Item 8: the three departures from the brief, each with its reason

1. **OpenAlex `conference` maps to `conference-paper`** (`sources/openalex.ts:31` in the request's type filter and `:41` in the answer's type table). OpenAlex names a conference paper `conference-paper` in its answers (`fixtures/openalex-search.json` carries `"type": "conference-paper"` twice); without the mapping a filter on type `conference` would drop every OpenAlex conference paper.
2. **Semantic Scholar is sent the `venue` filter** (`sources/semantic-scholar.ts:109`). The brief sends a filter to a source that has a parameter for it and keeps it for the after-fetch filter otherwise; Semantic Scholar's search has a `venue` parameter, so it narrows the source's own ranking.
3. **Europe PMC's cursor is `<hits so far>|<cursorMark>`** (`sources/europe-pmc.ts:104-108`). The source pages by `cursorMark` alone, and a hit's rank is its place in the source's order (`offset + at + 1`, `:142`) and the end of the list is `offset + got < total` (`:151`), so the count of hits so far is carried in the cursor. The cursor is printable ASCII of at most 200 characters, so the route's `page` rule (`request.ts:51-54`) holds, and a bare `cursorMark` is read as a page that starts at 0.

### Head comments and paragraphs touched in this round

| Item | Result |
| --- | --- |
| `views/personal/calendar/Calendar.svelte` head | rewritten ("fifth") |
| `server/content/literature/desk.ts` head and the doc comment of `run` | still true for the head (a waiting request leaves the lane when its page aborts); the doc comment of `run` rewritten for the abort during the wait for the request before it |
| `sources/common.ts` doc comments of `readRows` and `looseText` | rewritten (wrap and position) |
| `sources/scopus.ts` `recordLink` | new |
| `sources/openalex.ts` head | still true (it names the fields and the filter, not the landing page) |
| DESIGN.md `How it writes` | rewritten: `radar-add` in the open kinds |

