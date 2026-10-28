# Step O97 brief check (on main at 672cff80e)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O97.md`. Pages are cited by section; code lines and grep hits keep `file:line`. Head checked with `git log -1 --format=%h`: `672cff80e`; `git status --short` shows changes under `.scratch/` only.

## 1. Names

- `literature.wos_key`, `literature.scopus_key`, `literature.scopus_insttoken`, `literature.openalex_key`, `literature.semantic_scholar_key`, `literature.ncbi_key`, with their fields and `LITERATURE_KEYS` / `literatureKeys`: `git grep -n 'wos_key\|scopus_key\|scopus_insttoken\|openalex_key\|semantic_scholar_key\|ncbi_key\|wosKey\|...\|LITERATURE_KEYS\|literatureKeys' -- . ':!config/local.yml' ':!.scratch'`. Hits outside "Paths this step writes":
  - `src/lib/server/root/process/context/machine-defaults.ts:19` to `:24` (`LITERATURE_NAMES`, the six keys, used at `:78` for Settings' defaults): the step makes this false. It also makes verify 4's third grep red.
  - `src/lib/server/root/process/context/machine-values.ts:20`, `:60` (`LITERATURE_KEYS.map(...)` for the Settings answer): this breaks when `LITERATURE_KEYS` goes.
  - `src/lib/data/sources/config.ts:32` (re-export of `LITERATURE_KEYS`) and `:28-29` (`DownloadAccount`, `DownloadService`): these break.
  - `tests/routes/hubs/machine-answer.test.ts:86`, `:126` (`wos_key: ${WOS}` and `expect(body.machine.values['literature.wos_key']).toBe(hidden)`): this becomes false. The change to it is not an import change, so "every other test file whose import ... changes" does not cover it.
  - `docs/templates.md:435-443` (the `local.yml` template's `# literature:` block with the six keys): item 10 names `templates.md` only for "the commented rows of `.oculus/config.yml`", so these lines have no Doc text, and the step makes them false.
- `DOWNLOAD_SERVICES`, `DownloadService`, `DownloadAccount`: `git grep -n 'DOWNLOAD_SERVICES\|DownloadService\b\|DownloadAccount\b' -- . ':!config/local.yml' ':!.scratch'`. Hits outside the paths:
  - `src/lib/server/machine/runs/recover/local.ts:25`, `:156`, `:161` (`const SERVICES: DownloadService[] = ['physionet', 'kaggle', 'synapse'];`). This breaks when the type goes, it names services in code, and it is G113's code.
  - `src/lib/server/machine/runs/recover/cluster.ts:23`, `:93`, `:254` (`['physionet', 'kaggle', 'synapse'] as const`), `:262`: as above. O98 also changes this file.
  - `src/lib/state/system/machine/recover.svelte.ts:41`, `:62` (`service: z.enum(['physionet', 'kaggle', 'synapse'])`): this becomes false once a `downloads` row's `service` is any key a row's `auth` names.
  - `docs/templates.md:445-449` (`# downloads:` with `service: physionet`, `kaggle`, `kaggle-token`): no Doc text names these lines.
- `LITERATURE_SOURCES` and `LiteratureSource`: `grep -rn LITERATURE_SOURCES src tests` and `git grep -n 'LiteratureSource\b' -- src tests`. Every hit is inside the paths (`request.ts`, `handler.ts`, `form.ts`, `answers.ts`, `merge.ts`, `Head.svelte`, `model/index.ts`, `edit/feeds/literature.ts:48`, `literature-merge.test.ts:6`). No hit outside the paths.
- The `literature.source_*` words: `grep -n 'source_' config/text/views/feeds/literature.yml` prints `:65` to `:72`, read by `lookup.ts:111-118`. Both are inside the paths.
- The neighbouring words `copied_arxiv` and `copied_semantic_scholar` (`config/text/views/feeds/literature.yml:17`, `:20`; `src/lib/views/feeds/literature/words.ts:104-107`): these are inside the paths. Neither item 4 nor the `config/text/` line names them, and verify 4's second grep prints them.
- `service_*`, `setup_row_*`, `setup_secret_*`: `grep -rn "service_\|setup_row_\|setup_secret_" config/text` prints `config/text/views/sources/data.yml:93-104`. These are inside the paths.
- The service names, verify 4's second grep: `grep -rniE "openalex|...|wur\.nl" src config/options config/defaults config/text --exclude=local.yml`, files outside the removed folders. Hits outside the paths:
  - `src/lib/data/prose/literature.ts:110-134` (`arxivId`, `arxivOfDoi` with `/^10\.48550\/arxiv\.(.+)$/`, `pubmedId`), used by the merge (G45) and `request.ts:123`. The step does not make it false, but verify 4 prints it.
  - `src/lib/data/snapshot/normalise.ts:304-317`, `src/lib/data/snapshot/indexing.ts:2-3`, `config/text/views/sources/venues.yml:23` (`scopus: Scopus {0}`), `:34` (`wos: WoS {0}`) and `src/lib/views/sources/venues/VenueCard.svelte:158-159`. These are the venue fields `wos` and `scopus` of the hub's `venues.yml` schema, the hub's vocabulary for indexing notes. The change does not make them false, but verify 4 prints them.
  - `src/lib/server/edit/feeds/literature-key.ts:31` (comment, "Europe PMC and other feeds") and `src/lib/views/shared/forms/entry/entry-add.ts:31` (comment, "Literature's Add looks a DOI, an arXiv paper or a PubMed paper up through the sources"). Verify 4 prints both: they are not comments "that name an example row".
  - `config/options/behavior.yml:651` (the `literature.per_source` help, "Semantic Scholar takes at most 100 and Web of Science at most 50"). This is inside the file but outside "the four families and their group lines". The step makes it false, since the caps become the rows' `paging.max`, and verify 4 prints it.
- The removed folders: `git grep -n "literature/sources\|recover/sources"` (outside the folders and the ledger) prints `.scratch/migration/agents/guarded.md:357-358` (G111's Code and Test lines). Item 10 covers these.
- The files moved by decision 1 (`file-bytes.ts`, `file-poll.ts`): `git grep -ln "file-bytes\|file-poll"` lists 19 importers, which line 98 covers. `grep -n -o ".{80}file-bytes.{40}" .scratch/migration/agents/guarded.md` prints `:71` (G8's Code line, "`src/lib/server/core/file-bytes.ts` (the hash both sides compare by)") and `:144` (G58's Code line). Both become false, and item 10's Doc text list names only G3, G45, G70, G111 to G114 and G134.
- `access.ts`: `git grep -n "runs/recover/access"` finds `tests/server/machine/runs/recover/access.test.ts`, inside the paths. G114's rule sentence (`guarded.md:365`) reads "for physionet, kaggle and synapse, ... (PhysioNet's set `SHA256SUMS.txt`, Kaggle's dataset list, Synapse's user profile)". Brief line 25 says "Their rule sentences do not change". The step moves the login request into a row's `access`, so the parenthesis then describes hub rows rather than oculus. The brief does not say whether that sentence stays.
- The venue fields `issn`, `fee`, `open_access`: `grep -n "venues" docs/apps.md` prints `docs/apps.md:403`, the `venues` record's field list for apps. That file is outside the paths and item 10, and the new fields make the line incomplete.
- The route path in the write list: `git ls-files src/routes | grep -i literature` prints `src/routes/api/(docs)/literature/+server.ts`. The write list names `src/routes/api/(content)/literature/`, which does not exist.
- G134's code and test for case 18: `sed -n 213,215p guarded.md` gives Code `src/lib/views/shared/forms/entry/entry-add.ts` and Test `tests/views/shared/forms/entry-add.test.ts`. Both are outside the paths.

Findings:
- `machine-defaults.ts:19-24`, `machine-values.ts:20,60`, `data/sources/config.ts:28-32` and `machine-answer.test.ts:86,126` sit outside the paths, and the step breaks them or makes them false.
- `recover/local.ts:161` and `cluster.ts:254` sit outside the paths. They are G113's code and they name services.
- `recover.svelte.ts:41,62` is outside the paths and limits `service` to three names.
- G8 (`guarded.md:71`) and G58 (`:144`) name the moved `file-bytes.ts` and are missing from item 10.
- `docs/apps.md:403` and `docs/templates.md:435-449` have no Doc text.
- `behavior.yml:651` becomes false and is not in the line list.
- `copied_*` words are not named for change.
- The write-list route path is wrong: `(content)` should be `(docs)`.
- G134's files for case 18 are outside the paths.

## 2. The step line

- A browser reader searching by query and by ISSN: item 7 (b) covers words. For ISSN, item 7 (a) says "asks the browser by that ISSN", but item 2's `query` maps only the literature form's terms (`words`, `doi`, `years`, `type`, `open_access`, `venue`, `author`, `min_cited`). No key says how a row asks by ISSN. There is no requirement.
- Address, query and paging parameters, filters and sort orders with their words, record fields, fee and open-access labels, all from configuration: items 2 and 7. Item 2's list, though "exactly as rulings 511 (3) and 517 (1) name them", leaves out ruling 511's `filters`, `sorts` and paging `sizes`, which item 7 (b) uses.
- The hub names the UT Journal Browser: item 11.
- Another library works by configuration alone: items 1 and 2.
- A hub that names none shows no browser: item 7 and case 15.
- (a) ISSN field, and the card's fee line and open-access status: item 7 (a).
- (b) The view with filters and sorts, Add with the ISSN filled: item 7 (b).
- The /spec checks and the shape raised: done in Step 0 (rulings 511, 517, 518). No build requirement is needed.
- The same reader serves `literature.sources` in place of `sources/` and the lookups of `bibtex.ts`: item 4. The `s2` lookup of `bibtex.ts:53-60` is not covered (see 6).
- `recover.sources` in place of `recover/sources/`: item 5.
- Each row gives addresses, parameters, filters and their mappings, auth, field paths and operations: item 2.
- The code holds only formats, paging, auth and generic operations. Item 1 and item 2 cover the step chain, the inverted index, the HTML listing with first-byte sizes and the checksum file. "An answer holding a named field read as no hits" (Scopus's `error` entry, `scopus.ts:78-79`, `:146`) has no key and no requirement.
- The `links:` list used by the sources, BibTeX, Lit Watch, the client's lookup and lint: item 6.
- Every row in the hub's `.oculus/config.yml`, edited in Settings, oculus shipping none: items 9 and 11 and the opening paragraph.
- With nothing configured the view says what is missing: items 4, 5 and 7, and case 15.
- Rulings: 502 to item 7; 503 to item 1 and verify 4; 509 to items 1 and 6; 511 to items 1, 2, 5 and 7; 517 (1), (2) to items 2 and 7 (a); 518 (1), (2) (b) to items 4 to 7 and 9 with decision 3; 526 to item 9 and the O98 paragraph; 527 to decisions 2 and 3. Step 0's "what follows" (the six keys out, `mailto` stays, the words and lists go, the kinds from `data.yml`) maps to items 4, 5 and 8.

Findings:
- Searching by ISSN has no row key.
- "An answer holding a named field read as no hits" has no key and no requirement.
- Item 2's "exact" list leaves out `filters`, `sorts` and `paging.sizes`.

## 3. Premises

- Line 9, head: `git log -1 --format=%h` prints `672cff80e`. Holds.
- Line 13, O98's hunks: `cd .agents/worktrees/migration-O98 && git diff 54304adb4 -- <path> | grep "^@@"`.
  - `local.yml` `@@ -15,9`, `behavior.yml` `@@ -198,10` and `@@ -786,7`, `local.ts` (46, 139, 164, 204, 376, 483, 576), `routes.ts` (2, 91, 100, 210, 246, 274, 303, 313, 330, 347, 357, 372), `fields.ts` `@@ -471`, and `Item.svelte` (11, 37, 279) all match.
  - `docs/HELP.md` prints hunks at 249, 312, 321, 334, 448, 509, 550 and 583. The brief says "lines 252-337".
  - `git diff 54304adb4 --name-only` intersected with this step's paths also lists `config/defaults/behavior.yml`, `config/text/findings.yml`, `server.yml`, `statusbar.yml`, `views/personal/account-setup.yml`, `views/sources/data.yml`, `repositories.yml`, `source.yml`, `hpc.yml`, `workbench.yml`, `docs/data-map.md`, `docs/templates.md`, `src/lib/data/helpers/hub-names.ts`, `src/lib/data/model/index.ts`, `model-entities.ts`, `machine/model-recover.ts`, `src/lib/data/sources/config/catalog/schemas/options.ts`, `value-rule.ts`, `value-words.ts`, `settings/connectors.ts`, `latex.ts`, `problems.ts`, `reader.ts`, `src/lib/state/system/machine/recover-words.ts`, `src/lib/views/sources/data/recover/Recover.svelte`, `src/routes/api/(machine)/recover/+server.ts`, `tests/data/sources/config/local/local.test.ts`, `tests/server/machine/runs/recover/harness.ts`, `runs.test.ts` and `safety.test.ts`.
  - O98 adds `src/lib/server/core/git/credentials.ts` (from `git status --short`), inside the `core` folder decision 1 splits, and changes `cluster.ts`, which this step needs (section 1).
  - Main has 23 commits since `54304adb4` (`git log --oneline 54304adb4..672cff80e | wc -l`).
  - The brief's list is incomplete.
- Line 14:
  - `ls src/lib/server/content/literature/sources/` matches, and `desk.ts` also exists.
  - `handler.ts:61-71` and `:90-110` match.
  - `ask.ts:69-80` matches.
  - `bibtex.ts:39`, `:47` match.
  - `model-search.ts:93-103` matches.
  - The `LITERATURE_SOURCES` grep matches.
  - `grep -n 'source_' config/text/views/feeds/literature.yml` prints lines 65 to 72. The brief says `:68-75`.
  - `lookup.ts:111-118` matches.
  - `grep -n 'key:' sources/*.ts` prints `scopus.ts:181` and `wos.ts:129`, which matches.
- Line 15: the grep prints the two files named. It holds as output, but `tests/routes/docs/literature.test.ts:94-99` (`OPENALEX_OK`) and its rows at `:164-185` feed OpenAlex, WoS, Semantic Scholar and PubMed answers through the handler, so "No test reads a literature source's answer" is false in substance.
- Line 16:
  - `wc -l ... | tail -1` prints `2413 total`, which holds.
  - `ls answers | wc -l` prints `10`, which holds.
  - `routes.ts:47-56` holds.
  - `listFiles` runs `:141-172`, and `:188` is its caller.
  - `access.ts:14-15` holds.
  - `geo.ts:34` (`const ROW = /<a href=...`) holds.
  - `serviceOf` is at `:21-24` and the per-service branches at `:54-68`, which roughly holds.
- Line 17: `data.yml:28-39` holds (the `kind` line is `:27`).
- Line 18:
  - `local.yml:88-108` and `:120` hold.
  - `LITERATURE_KEYS` is at `:189` (`:188` is its comment).
  - `literatureKeys` runs `:384-404`.
  - `:143` and `:155` hold.
- Line 19: the address grep prints exactly the listed hits. Holds.
- Line 20: `behavior.yml:235-238` and options `:640-662` hold. The hub keys grep prints no `literature`, `recover`, `venues` or `links`. Holds.
- Line 21:
  - `sed -n 11,31p ... | grep -c 'field:'` prints `20`, with no `issn`, `fee` or `open_access`. Holds.
  - `FIELD_TYPES` at `record.ts:90-100` holds.
  - `wc -l` prints 194, 310 and 265, which holds.
  - `Venues.svelte:1-11` holds.
- Line 22: `readFamily` is at `fields.ts:204`, `familyForm` at `options.ts:125-128` and the words at `:131-145`. Holds.
- Line 23: `grep -n 'cheerio\|fast-xml-parser\|"jsdom"' package.json` prints `:52` and `:90` and no cheerio. Holds.
- Line 24: the item count gives 10 for all nine folders named. It also gives 10 for `tests/fixtures`, `src/lib/server/edit`, `src/lib/data/model`, `src/lib/data/sources/config`, `src/lib/data/sources/config/catalog` and `src/lib/views/system/workbench/settings`, which are not named. `tests/fixtures/config` does not exist (count 0), so item 11's new `tests/fixtures/config/reader-rows.yml` makes `tests/fixtures` eleven items.
- Line 25: the `guarded.md` line references `:13-15`, `:40`, `:125-127`, `:213` and `:356-367` hold.
- Line 26: Step 0 at `plan.md` 891-1188 holds.
- Line 27: `ls docs/adr` prints "No such file or directory". Holds.
- Item 2's example "Stanford's `digests[type=md5].digest`": `grep -n 'md5\|sha1\|digest' sources/stanford.ts` prints `:28 hasMessageDigests` and `:37-42`, "The sha1 of a file's digests, else its md5". The table row `sources.test.ts:365-376` expects `checksum: { kind: 'sha1', ... }`. The path and the kind both differ from the tree.

Findings:
- Line 13's overlap list leaves out about 30 shared files and the HELP hunks at 448 to 591.
- The `literature.yml` source words are at lines 65 to 72, where the brief says 68 to 75.
- Line 15's "No test reads a literature source's answer" is false, since `literature.test.ts` feeds stubbed answers.
- Line 24 leaves out `tests/fixtures` at ten, where item 11 adds a folder, and five more folders at ten inside the paths.
- The Stanford example contradicts `stanford.ts:28,37-42` and G111's row.
- The `(content)` route path does not exist.

## 4. Cases and checks

Each case is checked against the "What every package obeys" section of `spec.md`, where the test rule reads: "A test exists only as the test of one entry of `agents/guarded.md` ... A step that needs a new entry stops and asks Axel for it, and writes no test until he has ruled."

- The rule at line 88 adds a second ground for a test: "or as tests of behaviour whose failure gives wrong hits, wrong files or a request to the wrong address". The rules file has no such ground. `grep -n -i 'literature\|venue\|journal' guarded.md` shows no entry for:
  - a literature source's hits or requests (cases 1, 2, 3, 5, 6, 7);
  - case 11;
  - encoding (case 12);
  - field paths (case 13);
  - links (case 14);
  - the browser (cases 15, 16, 17);
  - "Read from the browser" (case 18, second half);
  - the Settings card (case 19).
  
  Cases 4 (G3), 8 and 9 (G111), 10 (G114), 20 and 21 (G13) and case 18's Add (G134) have an entry.
- Case 7 asks for "waits 2 s by the injected clock before the one retry". On the tree a 429 stops with state `limited` and `wait_s`, with no wait and no retry: `ask.ts:131-137` (`throw new SourceStop(source, 'limited', { status, wait: waitOf(...) })`) and `handler.ts:133`. Item 4 says the search keeps its behaviour, so the case contradicts item 4. G3's route test row `literature.test.ts:175-178` (`'retry-after': '7'`) would then wait or change.
- Case 10 with decision 2 ("the address asked first without the credential") contradicts G114's table row `access.test.ts:130`, `'Kaggle with no row: missing, nothing asked'`, and item 5's "G111 to G114 hold as written". The same holds for G111's rows `'kaggle refused: no row, before any request'` and `'synapse refused: no row, before any request'` (`sources.test.ts:454`, `:495`).
- Case 8 keeps G111's table and its rows need mechanisms that item 2's "exactly as rulings ... name them" list and decision 2 do not name. Each of these would be a new row key, a user-visible shape:
  - the entry field that picks files: `files`, DANDI's `assets` (`dandi.ts:65`), TCIA's `series` (`tcia.ts:41`) and Hugging Face's `patterns` glob (`huggingface.ts:3-5`, `:39-56`);
  - figshare's `article` source and its rule that a repeated name goes under the article id (`figshare.ts:1-5`, row `sources.test.ts:241-262`);
  - Kaggle's `dataset` written `owner/slug`, which the worked row's `{owner}/{slug}` holes do not match (`tokened.ts:35-45`);
  - Stanford's sha1-else-md5 (`stanford.ts:37-42`);
  - PhysioNet's `throttle` (`routes.ts:166-168`).
- Case 18 runs through G134, whose code (`entry-add.ts`) and test (`tests/views/shared/forms/entry-add.test.ts`) are outside the paths.
- Case 1's recorded answers ("saved once from the service") and item 7's saved HTML need a command that writes a file. The "Where you work" section of the rules file says every edit is made with Edit and Write and that a shell redirect that changes a file is a script, and brief line 140 refuses any script without an approval quoted from Rulings. The brief names neither a method nor an approval.
- The write list holds `.scratch/migration/agents/reviews/O97-report.md`, while the rules file's "Where you work" says "You never edit anything under `.scratch/`". The O91 and O95 briefs do the same, so this is a standing inconsistency.
- Verify 4 (and case 22) cannot be passed as written. The second grep prints the venue fields `wos` and `scopus`, `prose/literature.ts` and the comments of section 1, none of which the step changes or may change. In O97's worktree, which is at main's head before O98, the first grep prints `src/lib/server/machine/runs/recover/cluster.ts:308` (`https://nodejs.org/dist/${version}/`), which is O98's.

Findings:
- The line 88 test ground breaks the rules file's test rule, and cases 1 to 3, 5 to 7, 11 to 17, 18 (Read part) and 19 need new guarded entries: an open item for Axel.
- Case 7 asks for a behaviour the tree does not have and that item 4 excludes.
- Case 10 with decision 2 contradicts G114's and G111's "nothing asked" rows.
- Case 8 needs row keys the brief does not name.
- Case 18's files are outside the paths.
- The capture of recorded answers has no stated, permitted method.
- Verify 4 and case 22 are red on the tree for reasons outside the step.

## 5. The question

The goal: no address of an outside service in oculus's code, every one from configuration, one reader.

- Case 1: yes. It compares title, doi, year, type, authors, cited, open_access, url, pdf, abstract and bibtex, but not `id`, `pmid`, `arxiv`, `venue`, `date` and `rank` (`model-search.ts:169-194`), nor `total`, `more` and `cursor`. A reader that drops the ids G45 merges by passes.
- Case 2: no. The requests must equal the old adapters', and the reader holds no address.
- Cases 3 to 6: no.
- Case 7: not judged on the goal, since it tests a behaviour outside it (section 4).
- Cases 8 to 21: no.
- Case 22 (verify 4): yes, in three ways.
  - The address grep's folders leave out `src/lib/views/sources/venues/`, `src/lib/state/sources/registries/`, `src/lib/data/` and `src/routes/`, where the browser's code goes, so an address there passes.
  - The third grep runs with `--exclude=local.yml`, which also skips `config/options/local.yml`, the file the six keys leave.
  - The third grep has no pattern for `scopus_insttoken` or `semantic_scholar_key`.
- The step line's check: the step line names no check of its own beyond the /spec checks.
- Item 1: yes. Verify 4 greps addresses and service names only. A reader holding header or parameter names (`retry-after`, `x-ratelimit-reset`, `retstart`, `X-ELS-APIKey`) passes, though item 1 forbids them.
- Item 2: no.
- Item 3: no.
- Item 4: no.
- Item 5: yes. `local.ts:161` and `cluster.ts:254` keep the service names for Fetch's curl configs. They are outside the paths and no case covers Fetch's credentials, so Recover can pass every case while its code still names services.
- Item 6: no.
- Item 7: yes. Verify 4's names are only `utbrowser` and `wur.nl`, so a browser reader that holds the UT's parameters (`wq_ofs`, `wq_flt`, `journal/issn`) passes, against ruling 503. No row key says how the ISSN is asked (section 2), which leaves that to code.
- Item 8: yes, by the third grep's gaps above.
- Item 9: no.
- Item 10: yes, `docs/apps.md:403` and the `templates.md` `local.yml` lines can stay false.
- Item 11: no.

Findings:
- Case 1 compares a subset of the fields.
- Verify 4 and case 22 leave the browser's folders unscanned, exclude `config/options/local.yml`, and have no pattern for two of the six keys.
- Item 1's ban on parameter and header names has no check.
- Item 5 leaves Fetch's service names outside the paths.
- Item 7's UT parameters escape verify 4.
- Item 10 misses `docs/apps.md` and the `local.yml` lines of `templates.md`.

## 6. Implied inputs

This is a code step. Each input below is missing from "Cases", with its expected result.

- A dataset with a `library`, `request` or `derived` source. These kinds have no row and are "stated on the card" (`data.yml` schema, `model-entities.ts:566-568`). Expected: no Recover control and no missing-row message, as today.
- The card's Recover control, `recover` from `FETCHED_KINDS` at snapshot time (`retrieval.ts:175-184`, `model-entities.ts:513-525`), for a kind its hub has no row for. Expected: stated by the brief. Case 11 covers only the Recover route.
- Copy BibTeX by a Semantic Scholar id (`request.ts:116-120`, `bibtex.ts:53-60`, `state/feeds/literature/bibtex.ts:80`). Expected: the entry as today, from a row. Item 4 names only the DOI and arXiv lookups.
- A DOI lookup answered 404 (`common.ts:211-221`). Expected: no hit, not a failure.
- Scopus's empty result as one `error` entry (`scopus.ts:78-79`, `:146`). Expected: no hits.
- A Europe PMC hit whose `source` is not `MED` (`europe-pmc.ts:140`). Expected: the url keeps its source. The worked `europepmc` link writes `MED`.
- A row with an empty `key`, two rows sharing a `key`, a `links` key twice, and a row key equal to a kind word. The rules file's id and key rule requires these. Expected: each a finding naming the row.
- "Read from the browser" for an ISSN the browser answers with no hit or several hits, and a venue with two ISSNs. Expected: no write and a line saying so, and which ISSN is asked.
- Fetch of a credentialed set through a row's `auth` (G113): Synapse's `Bearer ` prefix, and PhysioNet's and Kaggle's `basic`. Expected: the curl config built from the row, mode 600, removed at the end, as `plan.ts:173-179` does today.
- A secondary hub that writes its own `literature.sources` or `links` (ruling 518 (1)). Expected: not read, or a finding. The brief says neither.
- A Settings card for a row whose `fields` mix a path text and a `{ path, op }` record, and whose `query` values are records. Expected: the card draws, not `broken`. `readFamily`'s pairs form takes one value spec (`fields.ts:213-224`).
- G3's 429 route row (`literature.test.ts:175-178`) under case 7. Expected: stated.
- Kaggle and Synapse with no row under decision 2. Expected: missing with no request (G114 and G111 rows).
- A browser hit with no ISSN on Add. Expected: stated.

Findings: each of the 14 inputs above is missing.

## 7. ADRs

- `ls docs/adr` prints "ls: docs/adr: No such file or directory". `.agents/plan.yaml` names no `adr` folder. There is no record.

Findings: none.

## 8. Dictated text

- Decision 4, "The UT browser's User-Agent is `oculus/<version> (+https://github.com/TheAxeC/oculus)`": `grep -n 'oculus/<version>' .scratch/migration/agents/briefs/O97.md` prints `147`. It is ASCII. Built in `src/lib/server/core/reader/`, it puts an address in the reader's code, which verify 4's first grep prints ("prints no address outside a comment"), and it sits against item 1's "no address ... appears in its code". It breaks the brief's own verify 4 and item 1.
- `"Read from the browser"` (lines 51 and 80, `grep -n 'Read from the browser'`): holds, as a catalog line through `t()`.
- `"Everything in the brief is done"` (line 187): holds. These are the rules file's words.

Findings: the User-Agent string breaks item 1 and verify 4.

## Declined to judge

- `grep -n -i '^goal\|^## goal' .scratch/migration/plan.md` prints nothing: `plan.md` has no Goal section. The goal used is the one given in the task.
- `cheerio` 1.2.0's version, licence and date, the UT page's selectors, the library's terms, whether `https://github.com/TheAxeC/oculus` exists, and whether Kaggle's dataset list answers without a credential all need a network fetch, which this check may not make. The last one decides whether decision 2 changes Kaggle's access.
- How simply O97 and O98 merge on the roughly 30 shared files is the orchestrator's judgment, recorded in `shared_paths:`.
- Whether the tests without an entry get new guarded entries, and the row keys case 8 needs, are Axel's decisions.

Usage: a7747d4cd7b199a87, claude-opus-5-5, 258490 tokens, 89 tool uses, 12 min 30 s.

## Closed

1. Names. The readers outside the paths (`machine-defaults.ts`, `machine-values.ts`, `data/sources/config.ts`, `machine-answer.test.ts`, Fetch's `recover/local.ts` and `cluster.ts`, `recover.svelte.ts`, the two comments, `entry-add.ts` and its test) are named under "What is on the tree", on the paths and in items 4, 5 and 8. G8 and G58, `docs/apps.md:403` and `docs/templates.md:435-449` are in item 10's Doc text. `behavior.yml:651` and the `copied_*` words are in item 4 and on the paths. The route path is `src/routes/api/(docs)/literature/+server.ts`. The id readers of `prose/literature.ts` and the venue fields `wos` and `scopus` are named as staying, and verify 4 leaves them out by name.
2. The step line. `query.issn`, `none_when`, `filters`, `sorts` and `paging.sizes` are in item 2; the ISSN ask is in item 7 (a); the "exactly" of item 2 is gone. The new keys are decision 6, open item 530, closed in automode (Z1056).
3. Premises. Line 13 names O98's HELP hunks and the thirty more shared files; the state file's `shared_paths` is the full list. The word lines are 65 to 72; `LITERATURE_KEYS` is at 189 and `literatureKeys` at 384 to 404. Line 15 is rewritten: `literature.test.ts` feeds stubbed answers for G3, and those rows stay. The folder list names the six more folders at ten, and the fixture moves to `tests/server/core/reader/rows.yml` (`tests/server/core` holds five). The Stanford example is sha1 with md5 as `else`.
4. Cases and checks. The added test ground is removed: cases under an entry are that entry's tests, and the rest are quoted runs until Axel rules open item 529 (raised, not blocking the build). Case 7 keeps today's 429 behaviour (state `limited` and `wait_s`, no retry). Decision 2 and case 10 keep G114's and G111's "nothing asked" rows for a `required` row. Case 8 reads through decision 6's keys. G134's files are on the paths. Recorded answers are fetched by one printed `curl -sS` each and written with Write (item 7), no redirect. Verify 4 is rewritten with named exclusions for O98's Node.js address, the id readers and the venue fields. The report path under `.scratch/` stays: it is the path the rules file's report section names for every step.
5. The question. Case 1 compares every field of the hit and `total`, `more` and `cursor`. Verify 4 covers the browser's folders and `src/routes/api`, reads `config/options/local.yml` through `git grep` with only `config/local.yml` left out, names all six keys and `LITERATURE_NAMES`, and has a grep for header and parameter names. Item 5 covers Fetch's credentials. Item 10 covers `docs/apps.md` and the `local.yml` lines of `templates.md`.
6. Implied inputs. Cases 23 to 32 hold them; the 429 row is case 7; Kaggle and Synapse with no row are in cases 8 and 10.
7. ADRs. None.
8. Dictated text. Decision 4's User-Agent is `oculus/<version>`, with no address.
- Declined. `plan.md` has no Goal section; the goal is the step line's. The network facts are read by the builder's one request each, as item 7 allows.
