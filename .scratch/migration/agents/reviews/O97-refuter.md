# Step O97 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O97, base f4535f495)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ npm run diagrams && npm run docs:palette && npm run test:quick -- --base f4535f495; echo "exit $?"   (output redirected to a file, read by its exit)
ok      prettier
ok      ASCII gate
ok      svelte-kit sync
ok      eslint
ok      svelte-check (553 FILES 0 ERRORS)
ok      vitest (217.6 s)
FAILED  vitest checks
 Test Files  3 failed | 14 passed (17)
      Tests  4 failed | 305 passed | 9 skipped (318)
ok      vitest slow (378.9 s): Duration  369.37s (transform 16.68s, setup 0ms, import 170.99s, tests 1292.99s, environment 20ms)
test:quick: 383.2 s; failed: vitest checks
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
exit 1
  The four failures:
  - tests/checks/config/templates.test.ts (2): missing [links, literature.prefer, literature.sources, recover.sources, venues.browser]; extra [literature.ncbi_key, literature.openalex_key, literature.scopus_insttoken, literature.scopus_key, literature.semantic_scholar_key, literature.wos_key]
  - tests/checks/source/history.test.ts: "tests/server/core/reader/answers/browser/issn.body does not parse: no reader is known for its language" (Caused by: Error: no reader is known for its language, tests/checks/source/code.ts:175:20)
  - tests/checks/tree/boundaries.test.ts > layer boundaries > holds across src/lib: expected [ ...(7) ] to deeply equal []
      "state/feeds/literature/lookup.ts imports data/sources/config/settings/rows/grammar",
      "state/feeds/literature/lookup.ts imports data/sources/config/settings/rows/links",
      "state/feeds/literature/merge.ts imports data/sources/config/settings/rows/grammar",
      "state/feeds/literature/merge.ts imports data/sources/config/settings/rows/links",
      "state/feeds/literature/merge.ts imports data/sources/config/settings/rows/read",
      "state/feeds/literature/scholar.ts imports data/sources/config/settings/rows/grammar",
      "state/feeds/literature/scholar.ts imports data/sources/config/settings/rows/links"
  The generated docs (docs/diagrams, docs/palette.md) hash the same before and after the run.

$ printf '%s\0' <the 170 files the step changes> | xargs -0 env LC_ALL=C perl -ne '<verify 2 of the brief>'
(prints nothing)
  The same gate over .scratch/migration/agents/reviews/O97-report.md: prints nothing.

$ sh utils/unused-exports.sh > <scratch>; diff .agents/worktrees/O97-base/unused-exports.txt <scratch>
22c22
< src/lib/server/accounts/connect/oauth.ts: READ_TIMEOUT_MS, callbackPath, CONNECT_MS
---
> src/lib/server/accounts/connect/oauth.ts: callbackPath, CONNECT_MS

$ verify 4, grep 1 (https?:// over the reader, literature, recover, feeds, venues, registries and routes paths, cluster.ts and comment lines left out)
(prints nothing)
$ verify 4, grep 2 (the service names over src config/options config/defaults config/text --exclude=local.yml, the brief's exclusions)
62 lines: src/lib/server/core/reader/hits.ts 8, src/lib/state/feeds/literature/lookup.ts 17, model-entities 4, model-search 2, entry-add 1 (:31), bibtex 1 (:6), answers 1 (:29), merge 1 (:25), Literature.svelte 1 (:18), config/text/views/sources/venues.yml:29 and :40; the same list the builder's report quotes under "Verify 4, grep 2's remaining lines"
$ verify 4, grep 3 (retry-after|x-ratelimit|x-els|x-apikey|retstart|retmax|wq_|mailto= over the reader, venues and registries)
(prints nothing)
$ verify 4, grep 4 (git grep LITERATURE_SOURCES ... ncbi_key -- src tests config docs ':!config/local.yml')
9 lines: docs/templates.md:438, :439, :440, :441, :442, :443; tests/data/sources/config/local/local.test.ts:132, :134, :145

$ wc -l <every source file the step changes> | sort -n | tail; sh utils/folder-check.sh; echo $?
largest src/lib/server/root/watch/git.ts 878; largest component src/lib/views/system/workbench/editors/Cards.svelte 488; folder-check exit 0
ls src/lib/server/core: 10 items; ls src/lib/server/content: 10; ls src/lib/server/settings: 10; ls tests/server/core: 6

$ diff <the report's "Hub text" block> tests/server/core/reader/rows.yml; echo $?
exit 0

$ git diff f4535f495 -U0 -- src tests config | grep '^+' | grep -E '<comment markers>' | grep -niE 'O[0-9]{2}|step|item [0-9]|20[0-9]{2}-|before|used to|no longer|earlier|previously'
no comment names a step, an item, a date or an earlier state of the code

$ npx vitest run --config /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/caserun/kept/kept.config.mts
printed exactly the eleven kept values the report's new open item lists (exit 1 from "expected any number of assertion" only)

$ git show f4535f495:src/lib/data/helpers/hub-names.ts | grep -n primary ; grep -rn 'primary_only\|other_hub' at the base (git show of the findings words)
the base has no finding for a primary-alone key set in another hub; only `local_other_hub` (a local.yml in another hub) and the write refusal `server.workspace.primary_only`

$ git diff f4535f495 -- tests/routes/docs/literature.test.ts | grep -n 'toStrictEqual\|toMatchObject'
100:-        expect(sources.find((one) => one.id === 'wos')).toStrictEqual({
101:+        expect(sources.find((one) => one.id === 'wos')).toMatchObject({
184:-        expect(thrown).toStrictEqual(['scopus: 401', 'scopus: 403', 'scopus: 429', 'scopus: 500']);
185:+        expect(thrown).toStrictEqual([

$ grep -c 'the path the value is read at' config/options/behavior.yml
5   (lines 860, 959, 1206, 1307, 1541)

$ for k in per_word with_terms refuse_when order_by markup absent unless; do grep -c "$k" tests/server/core/reader/rows.yml; sed -n 272,298p <report> | grep -c "$k"; done
per_word rows=1 judgment-calls=0; with_terms rows=0 judgment-calls=0; refuse_when rows=1 0; order_by rows=1 0; markup rows=2 0; absent rows=3 1; unless rows=3 0

$ grep -n "refused" tests/server/machine/runs/recover/sources.test.ts; grep -n "listing_answer" src/lib/state/system/machine/recover-words.ts
the refusals carry `source: 'zenodo'`, `'figshare'`, `'dandi'` (the row's key); recover-words.ts:98 `return t('recover.listing_answer', refusal.source);`, config/text/views/sources/data.yml:50 `listing_answer: '{0} answered with something that is not its file list.'`
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `src/lib/server/core/reader/` holds the reader (agent, call, fields, formats, listing, paging, path, reader, request, timed); `src/lib/server/core` is at ten items after the split; the vitest tier of verify 1, which runs `tests/server/core/reader/reader.test.ts`, passed. The verify 1 red does not come from this item.
- 2: violated, Spec 1 (grammar keys no ruling, decision or report section names).
- 3: holds for encoding, `https:`, empty and repeated keys and the secret (reader.test.ts case 12, 20 and 27 rows; literature.test.ts:226-228 and :249 assert no secret in body, lines or message); the primary-only finding is built for three keys only, Standards 1.
- 4: holds (case 1 to 3, 5, 7, 24, 25 rows of reader.test.ts; the empty pane of case 15's state half).
- 5: holds, with Behaviour 2 on the `downloads` rows' service and user checks that went with it.
- 6: holds (case 14 and 26 rows; `src/lib/data/sources/config/settings/rows/links.ts` is pure).
- 7: holds (browser.test.ts, entry-add.test.ts "a journal browser hit's Add").
- 8: holds as code (`src/lib/data/sources/config/local.ts:58` keeps `mailto` alone; case 21's test); verify 4 grep 4 is not empty, Proof 3.
- 9: violated, Spec 3 (values the cards hold with no control, the new open item) and Standards 2 (the field description copied).
- 10: holds as Doc text for landing; the templates check is red until it lands (verify 1).
- 11: holds, verify 7 exit 0.

Cases of the brief's "Cases":

- 1: met, reader.test.ts one row per source, expected hits the old adapters' output on the unchanged tree (decision 5); vitest tier passed.
- 2: met, reader.test.ts one row per source by a stand-in fetcher, compared as ruled in `O97-cases.md` (c).
- 3: met, in case 2's table.
- 4: met, literature.test.ts (G3), with Proof 1 on the widened `toMatchObject` row.
- 5: met, reader.test.ts paging rows.
- 6: met, reader.test.ts rows for PubMed ids, figshare per record, Synapse `max_depth: 8`.
- 7: met, reader.test.ts 429 and OpenAlex reset rows and PubMed gaps by the injected clock; wording change in Behaviour 1.
- 8: partial, the refusal line names the row's `key`, not its `name`, Spec 2.
- 9: met, in case 8's table (GEO `pre a`).
- 10: met, access.test.ts (G114), rows through `access`.
- 11: met, sources.test.ts rows 'a kind no row of its hub names refused: the kind named, before any request' and 'a second hub whose own recover.sources names the kind serves its own dataset'.
- 12: met, reader.test.ts encoding and `http://` rows.
- 13: met, reader.test.ts absent-field and no-list rows.
- 14: met, reader.test.ts links rows; ShellCheck through `src/lib/server/machine/runs/lint/routes.ts`.
- 15: partial, the state half is met by test; the views half is the look at landing, not verifiable here.
- 16: met, browser.test.ts and the User-Agent check of case 1's table.
- 17: met, browser.test.ts.
- 18: met, entry-add.test.ts and browser.test.ts.
- 19: partial, state and write met by sparse-card.test.ts; the look at landing not verifiable here.
- 20: met, reader.test.ts finding rows.
- 21: met, local.test.ts 'reads literature.wos_key as a key it does not know, and takes a downloads row of any service'.
- 22: unmet, verify 4 grep 4 prints nine lines, Proof 3.
- 23: met by reading `src/lib/state/sources/registries/datasets.ts` (`statedKind`, `unread`) and `DatasetCard.svelte` (the `unread` line), with the builder's quoted run; the reviewer did not rerun the program (Declined).
- 24: met, in case 1's table (S2 `query.id`).
- 25: met, in case 1's table (`missing: none`, `none_when`).
- 26: met, in case 14's table.
- 27: met, in case 20's table.
- 28: met, browser.test.ts.
- 29: met, safety.test.ts (G113).
- 30: met by reading `src/lib/data/sources/config/merge/hub-layer.ts:563-568` and the quoted run, with Standards 1.
- 31: met, sparse-card.test.ts.
- 32: met, entry-add.test.ts and browser.test.ts.

## 1. Spec

- `src/lib/data/sources/config/settings/rows/grammar.ts:154-220, 338-375`: "`absent: none` reads a missing path as no records ...; `where` and `unless` keep the records ...; `first` keeps the first record alone ...; `refuse_when` names a path", "per_word?: true; with_terms?: true;", "order_by?: string;", "for_each: z.string().optional()"; what is wrong: the grammar accepts row keys that item 2, rulings 511 (3) and 517 (1), and decisions 2 and 6 do not name: field operations `last`, `split`, `resolve`; field record keys `select`, `attr`, `text`, `value`, `each`, `map`, `suffix`, `pattern`, `host`, `names`, `markup`; `records` keys `field`, `absent`, `where`, `unless`, `first`, `refuse_when`; term keys `per_word`, `with_terms`, `params`, `headers`, `records`, `fields`, `format`, `by`; step keys `when`, `unless`, `order_by`; row keys `headers`, `holes`, `given`, `for_each`; archive `name`, `match`, `when`; pick `field`, `by`; hole operations `bare`, `phrase`, `spaced`, `last`. They are keys of the hub's `config.yml`, a user-visible shape the rules file's "no silent design decisions" covers; the report's "Judgment calls the brief left open" names `expect`, `holds: record`, `literature.prefer` and `absent` once, and none of the rest (grep above: per_word, with_terms, refuse_when, order_by, markup, unless 0 in that section). `with_terms` is used by no row of rows.yml (0) and no row of the Hub text, so it is a key with no user. The brief asked for the keys it lists plus a named decision for each further key (decisions 2 and 6 were written for exactly that); failure scenario: Axel rules on the row grammar from the brief and the report and learns of `refuse_when` or `per_word` only when he reads rows.yml or a later step depends on them; `with_terms` stays a configuration key nothing exercises and nothing documents in the templates; verdict: item 2 violated. Repair: list every key outside item 2 in the report as one decision with what it reads and the row that needs it, and remove `with_terms` if no source needs it.
- `src/lib/state/system/machine/recover-words.ts:98`: "return t('recover.listing_answer', refusal.source);" with `tests/server/machine/runs/recover/sources.test.ts:259` "refused: { refused: 'answer', source: 'zenodo' }"; what is wrong: case 8 asks for "an answer that does not parse is refused with a line naming the row's `name`"; the refusal carries the row's `key` and the line reads "zenodo answered with something that is not its file list." The report states this as a judgment call ("A Recover refusal names the row by its `key` (the kind), so G111's rows keep their wording"), so it was seen, but the brief left nothing open there: G111's rows can keep `source` as the key while the line looks up the row's `name` for the words; failure scenario: a hub whose row is `key: ega, name: European Genome-phenome Archive` gives the user "ega answered with something that is not its file list", the internal key and not the name the hub gave the service; verdict: case 8 partial.
- `.scratch/migration/agents/reviews/O97-report.md`, "New open item from this step": "A value nested deeper than the catalog's fields describe is held in the card's `kept` and written back unchanged ... the card offers no control for it"; what is wrong: reproduced exactly (the kept run above prints the eleven values; `literature.prefer: no row` in the program's output is an artifact of the program's grouping, since `literature.prefer` has three option rows). Item 9 asks for "every key of item 2 with its control and help line", and `else` is an item 2 key, so the gap is inside the brief's part. The open item does not cite ruling 526 (a) ("O97's service cards in Settings are built on the Settings of main and O99 gives O97's rows their controls"), which may already place these controls at O99; the orchestrator must read 526 (a) against it before it goes to Axel. Option (C) leaves item 9 unmet as written and is the lazy option as the report says; option (A) is a new catalog key, a shape of the kind decision 3 booked, so raising it is right; failure scenario: Axel rules (C) without knowing item 9 asked for the controls, or the item reaches him when 526 (a) already gave the work to O99; verdict: item 9 violated, pending the reading of 526 (a).
- `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/caserun/` (hits.ts, addresses.ts, geo-pre.mts, case23-30.ts, templates-check.ts, kept/kept.test.ts, kept/kept.config.mts, pages2.ts); what is wrong: spec.md's rule for a case-run program says it only prints, writes nothing, its source and output are quoted in the report, and it is gone before the report. The report quotes the outputs of `node case23-30.ts` and `node templates-check.ts` and the kept run, but no program's source, the programs are still on disk, and `case23-30.ts` makes a temporary folder (`mkdtemp`) and `templates-check.ts` writes `templates-spliced.md`; failure scenario: the orchestrator cannot judge the quoted case 23, case 30 and templates results without reading eight files the report does not show, and the "only prints" condition those quotes rely on does not hold; verdict: none on an item (cases 23 and 30 are met by reading the code).
- Paths outside the brief, `.scratch/migration/agents/briefs/O97.md` "Paths this step writes" against "Files outside the brief's paths": the report names each outside file with its reason, and those reasons hold on reading. The three checks verify 1 fails on (`tests/checks/tree/boundaries.test.ts`, `tests/checks/source/history.test.ts`, `docs/templates.md`) are not in the brief's paths, so the builder could not close verify 1; the builder reported rather than edited, as the rules file's test rule asks; verdict: none (a fault of the brief, Proof 2 for the disposition).

## 2. Proof

- `tests/routes/docs/literature.test.ts:136`: "expect(sources.find((one) => one.id === 'wos')).toMatchObject({"; what is wrong: G3's row was `toStrictEqual` on the base (diff line 100) and is `toMatchObject` now, a predicate widened on a guarded test. The rules file asks the report to list every edit to an existing assertion with before and after; the report has no such list, and this edit, the message change at diff lines 184-185 (`'scopus: 401'` to the row-name form), the repurposed row of `tests/data/sources/config/catalog/options.test.ts` (`holds: record` now a family case, the old no-fields row gone) and the fourteen removed assertion lines of existing tests appear nowhere as before and after. The secret itself stays guarded by literature.test.ts:226-228 and :249 (`not.toContain(secret)` over body, lines and message); failure scenario: a `SourceInfo` for WoS that gains a wrong `name`, `help` or `bibtex`, or any extra field, passes G3's row; an orchestrator reading the report cannot see that a guarded predicate changed; verdict: none on a case (case 4 is met by the secret rows), a finding to repair: return the exact object (`toStrictEqual` with `name`, `help` and `bibtex`) and add the assertion-edit table.
- `.scratch/migration/agents/reviews/O97-report.md`, "What in the brief is wrong or impossible", verify 1; what is wrong: the claim that verify 1 is red only on these three checks reproduces exactly (four failures, three files, quoted above). On the three proposals, the reviewer's judgment: the boundaries change adds `rows/grammar`, `rows/links` and `rows/read` to a list that already names the settings readers one by one (`data/sources/config/settings/reader` among them); they are pure data-layer readers of the same kind, item 6 requires the page to read the `links` rows, so this is an extension of the allowed list by its own reason, not a loosened rule. The history change extends the existing exemption for recorded answers (`ANSWERS`, history.test.ts:33) to the second recorded-answers folder for the same reason; note that the WoS, Scopus and S2 bodies are written by hand from the adapters' zod shapes (case 1), not bytes a service sent, so the comment's reason should say "recorded or written answers". The templates failures close when the Doc text lands. All three are small edits the orchestrator can make at landing; verdict: none, the disposition is the orchestrator's (fix at landing).
- Verify 4 grep 4, nine lines; what is wrong: the report's claim "the brief contradicts itself" holds for `tests/data/sources/config/local/local.test.ts:132, :134, :145`: case 21 requires a test holding `literature.wos_key`, and grep 4 over `tests` must print nothing, so both cannot hold. The six lines of `docs/templates.md:438-443` are not a contradiction: item 10 hands the page over as Doc text, and they go when it lands; failure scenario: an orchestrator who takes "contradicts itself" for all nine lines leaves the template lines in place, or one who closes grep 4 by removing the case 21 test removes the test the case asks for; verdict: case 22 unmet; fix at landing by landing the Doc text and by excluding `local.test.ts` from grep 4 (or writing the key in that test as a joined string), the orchestrator's choice.
- Verify 5 table, the report's "Verify 5, each new or changed test before and after": the changed rows of kept tables (G3's messages and `SourceInfo` fields, G111's two new case 11 rows with `refused: 'row'`, G114's access rows gaining `name`, `basic`, `help`) are tests of behaviour the change adds or changes, and the report quotes them only as "Test Files 9 passed (9), Tests 162 passed (162)" on the unchanged tree, which is the old version of those files, not the changed rows; no failure on the unchanged tree is quoted for the changed rows; failure scenario: a changed row that would pass on the unchanged tree (so tests nothing the step changed) is not distinguishable from one that does; verdict: none on a case; the reviewer did not rerun the base copy (Declined).

## 3. Standards

- `src/lib/data/helpers/hub-names.ts:694-779`: "A key marked `primary` is read from the primary hub alone, and a hub other than the primary that sets it has a finding of its file" and "{ key: 'literature.sources', file: 'behavior.yml', primary: true }"; what is wrong: `src/lib/data/shapes/hub-keys.ts:3-5` already defines the same set: "The other keys of the hub list are read from the primary hub's file alone". The step adds a second representation (`primary: true` on three rows) beside the existing one (every HUB_LIST key not in `OWN_HUB_KEYS`), against the design principle that a fact is named once. Item 3 says the finding holds "as every primary-only key of HUB_LIST is"; the builder found that premise false and built the finding for the three new keys only, so the twelve other primary-alone keys still give no finding when another hub sets them; failure scenario: a later key added to HUB_LIST and left out of `OWN_HUB_KEYS` is read from the primary alone but gives no finding unless its author also marks it `primary`; a second hub that sets one of the twelve existing primary-alone keys sees its value silently ignored. Repair: `primaryOnly(key)` as `!OWN_HUB_KEYS.includes(key)` and drop the flag; since that gives the twelve keys a new finding, the orchestrator decides whether it is inside O97 or a booking; verdict: item 3 holds for its three keys, the representation is a finding to repair.
- `config/options/behavior.yml:860, 959, 1206, 1307, 1541`: "path: the path the value is read at"; what is wrong: the field record of a reader row is described five times, once per family and nesting (the file went from 806 to 1742 lines); the coding standard's rule against copies of one description, and the same cause as the new open item (the catalog has no way to refer to a description), so option (A) would remove these copies too; failure scenario: a later change to a field record's keys is made in one copy and the other four cards draw the old controls; verdict: none on an item (the catalog is not a source file for `size.test.ts`).
- `src/lib/server/core/reader/call.ts:14-15`: "export type Fetcher = ...;" then "import type { ReaderRow } from ..."; what is wrong: an import placed after an export, against the import order the coding standard and the other files of the folder follow; failure scenario: none at run time; a reader looking for the module's imports misses one; verdict: none (fix at landing).

## 4. Behaviour

- `config/text` (diff): "-        state_daily: daily limit reached, resets in {0}"; what is wrong: the OpenAlex daily-limit sentence is gone; a 429 from any row now says the generic "rate limited, try again in ...". The report's look table has no row for it; failure scenario: a user who hits OpenAlex's daily cap is told to try again in some seconds and does not learn that the cap is daily; verdict: none on a case (case 7 asks for `wait_s` only), to state in the look table or keep as a row-level wording.
- `src/lib/data/sources/config/local.ts:405-407`: "const service = filledText(row.service); if (service === undefined) { problems.push(wrong(`${at}.service`, 'a non-empty string', 'row'));"; what is wrong: the base checked a `downloads` row's service against a list and required `user` on a PhysioNet or Kaggle row (`DOWNLOAD_SERVICES`, `USER_SERVICES`, removed). Case 21 asks for a row of any service to be accepted, so the service check had to go; the user check did not have to, and `src/lib/server/core/reader/request.ts:50` now sends `Buffer.from(`${held.user ?? ''}:${held.secret}`)`, an empty user. The test row 'a physionet row with no user' became 'an empty service, an empty user' in local.test.ts. The report does not state the change; failure scenario: a `downloads` row `{ service: physionet, secret: s }` was a finding of `local.yml` naming the missing user; now Recover asks PhysioNet with `:s`, gets 401, and shows the set as missing a row the user has written. Repair: a row whose service a `basic` auth entry names and that holds no user is a finding at read; verdict: none on a case, a defect to repair.
- `src/lib/server/content/literature/bibtex.ts`: the DOI lookup goes through the `doi` link row with `accept: application/x-bibtex`, and the Copy BibTeX line now reads "BibTeX copied, from <row name>" or "from the DOI link"; what is wrong: the report states this in its look table and judgment calls; with no `doi` link row Copy BibTeX by DOI no longer has a lookup, which follows item 6 ("nothing falls back") and is not stated for BibTeX; failure scenario: a hub without a `doi` link row loses Copy BibTeX for DOI-only hits and the user is not told why; verdict: none, to state in the look table.

## Declined to judge

- The reruns of `case23-30.ts` and `templates-check.ts`, since each writes files (a temporary folder, `templates-spliced.md`) and the reviewer writes nothing; cases 23 and 30 are judged by reading the code instead.
- Verify 5's unchanged-tree runs, since they need the base copy and writes into it.
- The views halves of cases 15 and 19 and the look of the Journal Browser view, the Data card's line and the Settings cards, since they are the look at landing and the reviewer starts no server.
- Whether ruling 526 (a) already gives the nested controls of the new open item to O99, since reading a ruling's reach is the orchestrator's call.
- Whether the primary-only finding for the twelve other primary-alone keys belongs in O97, since it adds findings outside the brief's keys.
- The transitive dependencies of `cheerio` 1.2.0 (named in the brief): `package-lock.json` adds cheerio-select, htmlparser2, parse5 and its adapters, encoding-sniffer, iconv-lite, safer-buffer, whatwg-encoding, whatwg-mimetype, and `undici` 7.30.0 loses `dev`/`optional` and becomes a runtime dependency through cheerio; the reviewer judged no finding but did not check their licences or advisories, which needs a web fetch.
- Breakage testing: none was done by the reviewer; the builder's report and the scratch programs show none (no mutation, no revert of code under test).

Reviewer usage: afd9d66fcf57bdd48, claude-opus-5-5, 126654 tokens, 127 tool uses, 20 min 25 s.
