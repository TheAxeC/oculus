# D38 report: handed back at the first run, before any code change

## NOT done

Everything in the brief is NOT done. The first run found a case whose rule gives the wrong result, and the brief says to stop there and hand back before changing code. No file of `tools/oculus` outside this report has been changed. Full-list runs (`npm run test:quick`): 0. `npm run diagrams`, the checks.sh run, `npx vitest run tests/checks` and `sh utils/folder-check.sh`: not run, since nothing changed.

## The case the brief's rule gets wrong

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

Ruling needed. Option (a): PubMed's author clause is `<author>[au]` without quotes (PubMed documents `Faes L[au]` this way and parses the words itself), with `"`, `[`, `]`, `(` and `)` removed from the value first, so a value cannot close or open a clause; the venue clause stays quoted. Option (b): keep the quoted clause and send PubMed no author filter (the after-fetch filter alone), which makes PubMed return its unfiltered page, mostly dropped by the filter. Recommendation: (a). The lazy option is (b).

Two smaller points of the brief that a ruling does not hold up and that the build takes as follows unless reversed:

1. Item 2's OpenAlex `select=` omits `locations`, while decision 7 names OpenAlex's `locations` (an arXiv landing page beside the DOI) as one of the sources of a preprint-to-published link. The build adds `locations` to the select.
2. `appendEntry` and `startEntries` (`src/lib/server/edit/entry-edit/entries.ts`) both refuse a file whose list is the flow list `entries: []` (case 55): see the first run of case 55 below. The writer of item 8 handles it in the step by extending `startEntries`.

## Open items of the state file (verbatim from `orchestrator-state.md`, "Open items")

- Z545 (raised 2026-10-05, A3's brief check, implied input I4). A scheduled run of an update task is an interactive Claude session that never ends by itself, so at `@hourly` each run leaves one more idle Claude terminal open (24 a day). (a) A due time while the task's earlier terminal is still open, idle or not, starts nothing and is recorded as skipped. For: nothing piles up; VS Code's Automations run one session at a time. Against: the schedule stops until you close the earlier terminal. (b) A due time while the earlier run is idle ends that earlier terminal (oculus started it) and then starts the new run; a run that is still working is skipped. For: the schedule keeps running and one terminal per task stays open. Against: an idle session you were reading is closed under you. (c) Every due time starts a new terminal and the earlier ones stay. For: nothing is closed. Against: idle Claude processes pile up, the lazy option. Recommendation: (b).
- Z543 (raised 2026-10-05, D20's repair round 1). A new guarded entry for D20's Cancel of a merge, rebase or cherry-pick needs your yes (Z392): "G44. A git write stopped by Cancel says what it left in progress: a merge, a rebase or a cherry-pick cancelled midway is named in the answer, and the view shows it with its Abort." Code: `stoppedOn`, `cherryPick`, `continueRebase` in `src/lib/server/git/git-index.ts`, `src/lib/server/git/git-routes.ts`. Test: `tests/server/git/git-write.test.ts` 'names the merge a cancelled run left in progress, and nothing once it is aborted', `tests/routes/git/git.test.ts` 'says the merge a cancelled run left in progress'. (a) Yes: a user who cancels a merge and goes on working inside it can commit half a merge; the suite keeps the answer true. (b) No: the two tests are removed at landing. Recommendation: (a). The lazy option is (b).
- Z538 (raised 2026-10-05, D44's brief check 4). A new guarded entry for D44's two tests needs your yes (Z392): "G43. Submit runs only the plan the reader confirmed, equal to the plan the server computes at the press, and a job script whose code and sourced files never name `/local/$SLURM_JOB_ID` gets the warning before Submit." Code: `src/lib/server/machine/hpc/submit.ts`, `scratch.ts`. Test: `tests/server/machine/hpc/submit.test.ts`, the two tables. (a) Yes: a wrong copy or a job that writes to the shared home without warning is caught by the suite. (b) No: no tests; the look and quoted runs are D44's only check. Recommendation: (a). The lazy option is (b).
- Z539 (raised 2026-10-05, D44's brief check 5). D44's look can prove the copy and `sbatch` end to end only with one real job on your cluster account. (a) At the look I submit a one-minute job that only writes `hostname` and the date to its log, a new script `code/hpc/oculus_submit_check.slurm` in engram (its `code/` is 82 files, 569 KB), on the `main-cpu` partition (`docs/HPC-UTwente-howto.md:221`), and read its log. (b) You name an existing script and I submit that. (c) No real submit: the look stops at the confirm, and the rsync over ssh and the remote `sbatch` are never run before D44 lands. Recommendation: (a). The lazy option is (c).

## The cases' first run on the unchanged tree

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

## Other facts recorded for the resumed build

- OpenAlex keyless search answered with `x-ratelimit-limit: 1000`, `x-ratelimit-remaining: 960`, `x-ratelimit-credits-used: 10` and `x-ratelimit-reset: 47425` on 2026-10-05, so the rate headers item 3 reads for case 39 exist.
- WoS Starter's `sortField` is documented as `RS+D`; the Swagger examples carry a literal plus. The build sends it through `URLSearchParams`, which writes `RS%2BD`.
- Fixtures recorded from the live sources, in the session scratchpad `fixtures/`: `openalex-search.json` (`GET https://api.openalex.org/works?filter=title_and_abstract.search:block%20term%20decomposition%20EEG&per-page=3&select=...`), `oa-author.json`, `oa-combo.json`, `arxiv-search.xml` (`search_query=all:tensor AND all:regression AND submittedDate:[202401010000 TO 202612312359]`), `arxiv-id.xml` (`id_list=1403.4462`).

## Files changed

`diff -rq` against the base copy for the files of `tools/oculus`: this report is the only changed file (under `.scratch/migration/agents/reviews/`, outside `tools/oculus` source).
