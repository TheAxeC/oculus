# Step D38 brief check (on main at db68c2cf3)

Agent a2a467a6aab8994d0, claude-opus-5-5: 294,737 tokens, 97 tool uses, 12.6 min (completion notice). The brief was written on main at 575c997c8; since then D42 (8077dd556) and S5 (71017ce60) landed and Z497, Z500, Z501 and Z502 were ruled. No literature API was called and `config/local.yml` was not opened.

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
- P3. S5 has landed (71017ce60); the brief says it is in flight.
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
