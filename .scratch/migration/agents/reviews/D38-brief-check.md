# Step D38 brief check (on main at f9f6059d2)

Agent a2a467a6aab8994d0, claude-opus-5-5: 294,737 tokens, 97 tool uses, 12.6 min (completion notice). The brief was written on main at fc2905d77; since then D42 (863cdc7d0) and S5 (30b4ddced) landed and Z497, Z500, Z501 and Z502 were ruled. No literature API was called and `config/local.yml` was not opened.

## 1. Names

The names the step adds (view `literature`, route `/api/literature`, `literature:` in `behavior.yml` and in `local.yml`, write kind `radar-add` with `history.kind_radar_add`, `addRadarEntry`, `literatureSettings`, types in `model-search.ts`) collide with nothing (`git grep -n "radar-add\|radar_add\|addRadarEntry\|literatureSettings"` finds no hit).

- N1. Order 5 in the Incoming group makes false `Calendar.svelte:2` ("The calendar closes the Incoming page's group"), `HELP.md:68` ("e1-e5") and `config/text/app.yml:12` (the same row); none is in the write list.
- N2. `HELP.md:282` lists every `local.yml` key and is made false by `literature`; it is not in the write list or Docs item 11.
- N3. `tests/data/sources/config/wrong-settings.ts:1-3` ("A wrong value for every setting") and the sorted list in `tests/checks/config/config.test.ts:410-441` are made incomplete by the new reader and are not in the write list.

## 2. The step line

Every part of the plan line maps to an item of "What to build". Findings: none.

## 3. Premises

- P1. D38's lines in `plan.md` are `:502`, `:1061`, `:1223`, `:1226-1228` and `choices.md:416`, `:418`, `:423`; the brief says `:500` and `:1056` "and nothing else", and D39 is at `:503`.
- P2. Z497 (choices 2 to 13), Z500 (choice 1 (a)), Z501 (choice 14 (a), a guarded entry with one table test) and Z502 (`fast-xml-parser`, `@citation-js/core` with `@citation-js/plugin-bibtex`, no API client, pacing and cache by hand) are in force; the brief still says it is not ready until the orchestrator rules, presents choices 1 to 14 and Libraries 1 to 4 as open, writes "(option (a) assumed)", "Until he rules, the builder writes no merge test", and lists `package.json` "only for a library the orchestrator rules". Z497's paraphrase "keyless toggles disabled with their key named" differs from choice 12, which draws the keyed sources without a key disabled; the brief states choice 12 as written.
- P3. S5 has landed (30b4ddced); the brief says it is in flight.
- P4. `local.ts` is 472 lines (brief 376); `LocalConfig` `:26-100`, `LOCAL_KEYS` `:111-130`, `loadLocal` `:451`, `checkLocal` `:469`. Choice 1's "an unknown key is refused (`local.ts:267`)" is false: `:362` collects unknown keys and `:419-421`, `:440-442` warn and ignore them.
- P5. `options.yml`: the `local.yml` section is `:1178-1232` (brief `:686-722`), `search.max_hits` `:608`, `search.timeout_s` `:616-622`; `:9` now reads "A local.yml entry holds `description` and `section` alone"; every `behavior.yml` entry carries `heading`, `section`, `default`, `control` and, for a number, `min`, `max`, `whole` (`:9-13`).
- P6. `settings.ts` is 457 lines (brief 297), `searchSettings` `:230-236`; readers go through `settingReader`, and a reader that reports problems is listed in `PROBLEM_READERS` (`:425-440`); the brief names neither.
- P7. Line shifts: `writes.ts` 544 lines, `lead-add` `:446-452`; `addLead` `:325-393`; `context.ts` 729 lines, `ServerContext` `:104`, `mailConnects` `:459`; `watch/local.ts` `FIELDS` `:78-97`; `getJson` `api.ts:67`; `search-routes.ts` token check `:37-44`.
- P8. `guarded.md` entries moved: G8 `:34-36`, G9 `:37-39`, G12 `:83-85`, G13 `:86-88`, G24 `:111`; the read list's ranges are stale.
- P9. The literature-key grep finds only venue `scopus` lines; "and the radar's file path" is not a hit. The conclusion holds.

Rerun and unchanged: the radar file counts (5961 lines, 561 entries, buckets 191/185/154/31, hosts 363/115/16, 18 duplicates, ASCII), the feed writers, write route, Lit Watch view, outbound request sites, model, config and doc lines, folder counts, `local.yml` untracked, no ADR folder, `libraries: check`, the cited test titles, and none of the three ruled libraries installed.

## 4. Cases and checks

- C1. Case 42's second half (an unknown key under the map gets a finding and a default) contradicts S5's `local.ts`, which warns of and ignores an unknown key.
- C2. Case 43 holds only through the catalog bounds; the brief states no `min`, `max`, `whole` for `timeout_s` and `cache_min`, no `heading` or `section` for the three `behavior.yml` entries, and no `section` for the seven `local.yml` entries.
- C3. The merge test of Z501 has no file, title or entry number; G43 and G44 are held by Z538 and Z543, so the next is G45; a new `tests/state/feeds/` file is not in the write list; G1's Code line does not name `literature`.
- C4. T5 "in the form S5 gives" spans `settings.test.ts:44-70`, `settings.test.ts:~494-520`, `wrong-settings.ts:6-25` and `config.test.ts:410-441`; the last two are not in the write list.
- C5. Item 7 spells out a hand-written BibTeX key rule and escaping, against Z502 and `spec.md:55`.

## 5. The question

- Q1. The WoS and Scopus adapters are never exercised: no key at the look, no test or run over their answer shape, their fields "not verified".
- Q2. Item 3 (one request at a time per source, the gaps, the 200-answer cache cap) has no check.
- Q3. Item 1's rule that no log line or thrown message carries a key is checked on answer bodies only.

## 6. Implied inputs

Missing from "Cases": every source off; an unbalanced parenthesis or quote in the query; a venue or author holding a quote; venue and author length bounds; a malformed `page` cursor; `oa` values other than the two read; `from` without `to` and the reverse; one DOI twice inside one source's answer; More failing on page 2 or its cursor ending; the cache key across filters and toggles; an Add of a title with banned characters and an accented author; a radar file with empty `entries:` or one that does not parse; `literature: abc` in `local.yml`; a source answer of unbounded size.

## 7. ADRs

No `adr` key and no ADR folder. Findings: none.

## 8. Dictated text

Every dictated line holds (Z501's merge sentence, the four test titles, the view, control, refusal and doc words, the keys, `kind_radar_add`, the Scholar address); the brief is ASCII. Findings: none.

## Shared paths

- X3f: simple (`HELP.md`, `DESIGN.md`, `docs/diagrams/`).
- D20: simple (`writes.svelte.ts`, `context.ts`, `HELP.md`, `DESIGN.md`, `docs/diagrams/`).
- D44: simple for `context.ts`, `HELP.md`, `package.json`; `DESIGN.md:133` simple only if D38's paragraph goes between `:131` and `:132`; `package-lock.json` rebuilt.
- D45: not simple (`HELP.md:19`, `config/text/app.yml:12`, `config.test.ts:409-441`).
- D23: not simple (`DESIGN.md:85`, `DESIGN.md:403`, `HELP.md:282`, the `local.yml` key in `local.ts`, `options.yml` and `local.test.ts`).
- D11: not simple (`DESIGN.md:358-431`, `HELP.md:54-95`, `HELP.md:282`, `app.yml:12`); `shapes.ts`, `context.ts`, `local.test.ts` not judged.

## Declined to judge

The live-source probes; the library registry facts (Z502 ruled the choice); whether Axel holds WoS or Scopus keys; whether `model-search.ts` is the home of the hit types; D11's and D23's insertion lines.

## Closed

Closing agent a4558e3331a0b5998, claude-opus-5-5: 250,737 tokens, 61 tool uses, 12.6 min (completion notice).

- N1: `Calendar.svelte` lines 2-4, `HELP.md:68` and `config/text/app.yml:12` are in "Paths this step writes" (brief `:261`, `:264`, `:268`) and in Docs item 11 (`:122`), each rewritten for a sixth Incoming view (`e1-e6`); the tree facts are at `:48-50`, decision 11 at `:27`, and the look's step 21 (`:232`) checks the overlay.
- N2: `HELP.md:282` is in the write list (`:268`) and Docs item 11 (`:122`), which has it name `literature` and its seven keys.
- N3: `tests/data/sources/config/wrong-settings.ts` lines 6-26 and `tests/checks/config/config.test.ts` lines 410-446 (the `settingFindings` sorted list) are in the write list (`:275`, `:277`); the tree facts are at `:60-62`.
- P1: the plan line is `plan.md:502` (`:7`), the rulings carry their current lines (`:11`), and the D38 grep prints `plan.md:502`, `:1061`, `:1223`, `:1226-1228` and `choices.md:416`, `:418`, `:423`, marked corrected (`:11`); D39 is `:503` (`:38`).
- P2: Z497, Z500, Z501 and Z502 are stated as ruled (`:11`, `:13`); "not ready for dispatch", "(option (a) assumed)", "(option (b) assumed)", "Until he rules, the builder writes no merge test" and the conditional on `package.json` are gone; choices 1 to 14 are "Decisions ruled" with each ruling named (`:15-30`); Libraries 1 to 4 are "Libraries ruled (Z502)" (`:310-319`) and `package.json`/`package-lock.json` are written for Z502's three packages (`:278`); choice 12 is stated as written, keyed sources without a key drawn disabled with their key named, with Z497's differing summary noted (`:28`).
- P3: S5 is stated as landed in `30b4ddced`, marked corrected (`:39`); the shared-path text about S5 in flight is gone.
- P4: `local.ts` 472 lines, `LocalConfig` `:26-100`, `LOCAL_KEYS` `:111-130`, `loadLocal` `:451`, `checkLocal` `:469`, marked corrected (`:39`, `:55`, `:67`); choice 1 now says an unknown key is collected at `:362`, warned of at `:440-442` and ignored (`:17`).
- P5: the `options.yml` local.yml section `:1178-1232`, `:9`'s current words, the entry keys of `:9-11`, `search.*` at `:608-622` with `heading: editor` and `section: Search`, marked corrected (`:55`, `:58`); the write list names `:616-622` and `:1178-1232` (`:266`).
- P6: `settings.ts` 457 lines, `searchSettings` `:230-236`, `settingReader` `:96`, `PROBLEM_READERS` `:423-445`, marked corrected (`:39`, `:58`); item 10 has `literatureSettings` read through `settingReader` and listed in `PROBLEM_READERS` (`:121`).
- P7: `writes.ts` 544 lines with `lead-add` `:446-452` (`:45`), `addLead` `:325-393` (`:44`), `context.ts` 729 lines with `ServerContext` `:104` and `mailConnects` `:146`/`:459` (`:67`, `:110`), `FIELDS` `:78-97` (`:55`), `getJson` `api.ts:67-81` (`:54`), the search token check `:43-45` (`:56`), each marked corrected.
- P8: the guarded entries carry their lines on the ledger at cd79fc23f, which holds G45 and G46 (G1 `:7-9`, G3 `:13-15`, G8 `:34-36`, G9 `:37-39`, G45 `:77-79`, G12 `:89-91`, G13 `:92-94`, G24 `:117`), marked corrected (`:71`); the read list's ranges are `:5-15`, `:34-39`, `:77-79`, `:89-94` (`:338`).
- P9: the literature-key grep's hits are named as the venue `scopus` lines alone, marked corrected (`:55`).
- C1: case 42 is rewritten so an unknown key under `literature:` is in `unknown`, warned of and ignored with no finding (`:174`), and item 10 states the reader that way (`:121`).
- C2: item 10 gives each `behavior.yml` entry `heading: editor`, `section: Literature search`, `default`, `control: number`, `whole: true` and the bounds 1-120, 1-100, 0-1440 that make case 43's values wrong, and each of the seven `local.yml` entries `section: Literature search` (`:121`); case 43 names the keys and defaults (`:175`); decision taken 12 (`:304`).
- C3: the merge test is G45's, `tests/state/feeds/literature-merge.test.ts` with its title and one table (decision 14 `:30`, T6 `:206`), in the write list (`:271`) and verification item 2 (`:349`); G1's Code line naming `literature` is the orchestrator's at dispatch (`:323`).
- C4: T5 names the four places S5's form spans with their lines, `settings.test.ts:44-69`, `:267-286`, `:497-528`, `wrong-settings.ts:6-26` and `config.test.ts:410-446`, plus the `local.test.ts` rows (`:205`), and the two files not in the list before are added (`:275`, `:277`).
- C5: item 7 builds CSL-JSON from the hit and has citation-js format the entry, the key set through citation-js's own option read from its documentation in `node_modules` and quoted in the report; the hand-written escaping and key rule are gone (`:118`, `:299`, `:315`, `:359`).
- Q1: case 58 has the builder save the documented sample answers of the WoS Starter API and the Scopus Search API, quoted with their URLs, as fixtures in its scratch folder and quote each adapter's run with every drawn field read correctly, stopping and handing back if no documented answer is found (`:190`, `:193`, `:282`, `:355`, `:359`); the "not verified" sentence points at case 58 (`:88`).
- Q2: case 59 is a quoted run with a stub fetcher recording start times and calls in flight: one in flight per source, the gaps held, the cache cap at 200 answers (`:191`, `:355`).
- Q3: T2's table captures `console.log`, `console.warn`, `console.error` and every thrown message and asserts no key in either (`:202`); case 34 says so (`:166`).
- I1 (every source off): case 44 (`:176`), item 5 (`:116`), look step 16 (`:227`).
- I2 (unbalanced parenthesis or quote): case 45 (`:177`).
- I3 (venue or author with a quote): case 46 (`:178`), item 2's quoted-clause rule (`:108`), item 4's filter (`:111-115`), decision taken 14 (`:306`).
- I4 (venue and author bounds): 200 characters each with `venue_long` and `author_long` in item 1 (`:96`), item 5 (`:116`), case 47 (`:179`), decision taken 2 (`:294`).
- I5 (malformed `page`): 400 `page` in item 1 (`:96`), case 48 (`:180`), decision taken 16 (`:308`).
- I6 (`oa` values): `1` and `0` read, anything else 400 `oa` (`:94`, `:96`), case 49 (`:181`).
- I7 (`from` without `to` and the reverse): item 1 (`:94`), item 9 (`:120`), case 50 (`:182`), decision taken 13 (`:305`).
- I8 (one DOI twice in one source's answer): item 4 (`:112`), case 51 (`:183`), a row of T6 (`:206`).
- I9 (More failing on page 2, cursor ending): case 52 (`:184`).
- I10 (the cache key across filters and toggles): item 3 (`:110`), case 53 (`:185`).
- I11 (Add with banned characters and an accented author): case 54 (`:186`), a row of T3 (`:203`).
- I12 (empty `entries:` or a radar file that does not parse): item 8 (`:119`), case 55 (`:187`), rows of T3 (`:203`).
- I13 (`literature: abc`): item 10 (`:121`), case 56 (`:188`), a row of T5 (`:205`).
- I14 (unbounded answer size): 5 MB per source answer, above it `failed`, in decision 3 (`:19`), item 1 (`:98`), case 57 (`:189`), decision taken 15 (`:307`); every new refusal word is worded in `config/text/views/feeds/literature.yml`, the file of `query_long` (`:96`, `:342`).
- Shared paths: "Steps sharing paths" (`:284-289`) states X3f and D20 in flight as simple merges, D44's `DESIGN.md:133` kept clear by D38's paragraph between `:131` and `:132` with `:132` unchanged (also Docs item 11 `:122` and the write list `:269`), and D45, D23 and D11 taking D38's landing into account when they are prepared; `shared_paths:` for the dispatch entry is noted at `:324`.
- Dictated lines added after the check, each held against `agents/spec.md`'s prose rules and the hub's writing rules (ASCII, no dash stand-in, no history word, no negation-contrast): `| e1-e6 | open a view of the Incoming page's group |` (`grep -n "e1-e6 |" D38.md`, `:122`), holds; `section: Literature search` and `heading: editor` (`grep -n "section: Literature search" D38.md`, `:121`), holds; the problem sentences `literature must be a map` and `literature.<key> must be a non-empty string` and their `checkLocal` forms (`grep -n "must be a map\|non-empty string" D38.md`, `:121`, `:174`, `:188`), hold; the refusal words `oa`, `venue_long`, `author_long`, `page` (`grep -n "venue_long" D38.md`, `:96`), hold; G45's test title, quoted from `agents/guarded.md:79` (`grep -n "keeps hits that share none apart" D38.md`, `:30`, `:206`), holds; the `npm install` command (`grep -n "npm install fast-xml-parser" D38.md`, `:319`), holds.
