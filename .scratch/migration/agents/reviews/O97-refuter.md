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

## Repair round 1, refuted

```
Verify 1, from the worktree root, PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH. The rules file names no output filter (grep -n "filter" .scratch/migration/agents/spec.md prints nothing), so the output went to a file in the reviewer's scratchpad and the summary lines are quoted:
$ (npm run diagrams && npm run docs:palette && npm run test:quick -- --base f4535f495) > <scratch>/verify1.txt 2>&1; echo "exit $?"
exit 1
test:quick: 201 changed file(s), from git since f4535f495
test:quick: 343 test file(s)
ok      ASCII gate (2.4 s)
ok      svelte-kit sync (2.4 s)
ok      prettier (2.4 s): All matched files use Prettier code style!
ok      eslint (19.7 s)
ok      svelte-check (34.4 s): ... COMPLETED 553 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
FAILED  vitest checks (213.8 s)
 FAIL  tests/checks/config/templates.test.ts > docs/templates.md > shows every key of a hub settings file in the config.yml template, and no other   (missing: links, literature.prefer, literature.sources, recover.sources, venues.browser)
 FAIL  tests/checks/config/templates.test.ts > docs/templates.md > shows every local.yml key of the options folder in the local.yml template, and no other   (extra: the six literature.*_key keys)
 Test Files  1 failed | 16 passed (17)
      Tests  2 failed | 308 passed | 9 skipped (319)
FAILED  vitest (244.1 s)
 FAIL  tests/routes/machine/recover.test.ts > ... starts a fetch with the token, and refuses a set Recover does not run   Error: Test timed out in 5000ms.
 FAIL  tests/routes/hubs/hub-secrets.test.ts > ... (G3)   Error: Test timed out in 5000ms.
 FAIL  tests/routes/hubs/make.test.ts > ... (G9)   Error: Test timed out in 5000ms.
 FAIL  tests/server/machine/runs/lint/eslint-life.test.ts > ... ends after 15 minutes without a lint and not a moment before   Error: Test timed out in 5000ms.
 FAIL  tests/server/machine/runs/lint/eslint-life.test.ts > ... keeps one child for the lints of a folder and restarts the idle wait at each   Error: Test timed out in 5000ms.
 Test Files  4 failed | 250 passed | 72 skipped (326)
      Tests  5 failed | 3210 passed | 862 skipped (4077)
FAILED  vitest slow (415.2 s)
 FAIL  tests/server/edit/config-value.test.ts > ... writes a family without a key as every key then the removed key set to null   Error: Test timed out in 20000ms.
 Test Files  1 failed | 90 passed (91)
      Tests  1 failed | 861 passed | 312 skipped (1174)
test:quick: 417.9 s; failed: vitest checks, vitest, vitest slow
test:quick: not covered: tests that reach no changed file within the import depth, other than the checks under tests/checks/source and tests/checks/tree, which run for any change under src, tests or utils; the build, the lint of unchanged files

The six timed-out tests, each file run alone after verify 1:
$ npx vitest run tests/routes/machine/recover.test.ts            Test Files 1 passed (1), Tests 14 passed (14)
$ npx vitest run tests/routes/hubs/hub-secrets.test.ts           Test Files 1 passed (1), Tests 10 passed (10)
$ npx vitest run tests/routes/hubs/make.test.ts                  Test Files 1 passed (1), Tests 35 passed (35)
$ npx vitest run tests/server/machine/runs/lint/eslint-life.test.ts   Test Files 1 passed (1), Tests 7 passed (7)
$ npx vitest run tests/server/edit/config-value.test.ts          Test Files 1 passed (1), Tests 23 passed (23)
So verify 1 is red only on templates.test.ts, as the round allows. git status --short after the run equals the one taken before it, and the round's delta recomputed after the run equals the one before it (the generated docs unchanged).

Verify 2, the ASCII gate over the 178 changed and added files (the 175 of the step plus the cases ruling, the round brief and the report):
(prints nothing)

Verify 3:
$ sh utils/unused-exports.sh > <scratch>/unused.txt; diff .agents/worktrees/O97-base/unused-exports.txt <scratch>/unused.txt
22c22
< src/lib/server/accounts/connect/oauth.ts: READ_TIMEOUT_MS, callbackPath, CONNECT_MS
---
> src/lib/server/accounts/connect/oauth.ts: callbackPath, CONNECT_MS

Verify 4:
grep 1 (https?://, cluster.ts nodejs and comment lines left out): prints nothing
grep 2: 62 lines, the same files as the report: config/text/views/sources/venues.yml 2, model-entities.ts 4, model-search.ts 2, content/literature/hits.ts 8, answers.ts 1, state/feeds/literature/bibtex.ts 1, lookup.ts 17, merge.ts 25, Literature.svelte 1, entry-add.ts 1 (identifier readers and venue fields, as cases ruling (a) allows)
grep 3: prints nothing
grep 4 as round item 9 amends it:
$ git grep -n "LITERATURE_SOURCES\|...\|ncbi_key" -- src tests config docs ':!config/local.yml' ':!tests/data/sources/config/local/local.test.ts'
docs/templates.md:438:#   wos_key: ""
docs/templates.md:439:#   scopus_key: ""
docs/templates.md:440:#   scopus_insttoken: ""
docs/templates.md:441:#   openalex_key: ""
docs/templates.md:442:#   semantic_scholar_key: ""
docs/templates.md:443:#   ncbi_key: ""

Verify 6: wc -l over the changed sources and tests: largest tests/checks/config/config.test.ts 879, src/lib/server/root/watch/git.ts 878, tests/checks/tree/boundaries.test.ts 876, src/lib/server/root/context.ts 864, fields.ts 852; largest component Cards.svelte 488; sh utils/folder-check.sh exit 0
Verify 7: the report's Hub text block against tests/server/core/reader/rows.yml: diff exit 0
Verify 8, over the round's added comment lines and test titles (the delta), the history words: two hits, sources.test.ts:5 "refused before any request" (an order of steps) and request.ts:40 "as if the row were missing" (a subjunctive); neither names a step, a date or an earlier form
Verify 9, the round's added lines grepped for " - ", " -- " and "not ... but": only three YAML list items in local.test.ts

The commands the round's section quotes as evidence:
$ grep -rn "with_terms\|text: true\|names:\s*\[\|expect: { path" src tests config --exclude=local.yml
  every hit is another module's `names` field (tasks.ts, recipes.ts, schedules, reader.test.ts:792-812 finding names, ...); none in the reader, the grammar or the catalog
$ npx tsc --noEmit -p .                                          exit 0, prints nothing
$ npx vitest run tests/server/core/reader tests/server/content/literature tests/routes/docs tests/server/edit tests/state/sources/registries tests/state/system/config --testTimeout 0
  Test Files 19 passed (19), Tests 362 passed (362)
$ npx vitest run tests/server/machine/runs/recover --testTimeout 0   Tests 129 passed (129)   (the report says 128, taken before item 6 added an access row; no decision rests on it)
$ npx vitest run tests/server/core/reader --testTimeout 0            Tests 72 passed (72)
$ npx vitest run tests/routes/docs/literature.test.ts                Tests 2 passed (2)
$ npx vitest run tests/checks/config/config.test.ts --testTimeout 0  Tests 42 passed (42)
$ grep -rn "row_primary_only\|primary: true" src config tests --exclude=local.yml
  tests/state/boards/board/board-rules.test.ts:469:            primary: true,
$ npx vitest run tests/data/sources/config/local tests/server/root --testTimeout 0   Test Files 13 passed (13), Tests 117 passed (117)
$ npx vitest run tests/checks/tree/boundaries.test.ts tests/checks/source/history.test.ts --testTimeout 0   Tests 17 passed (17)
$ ls <scratch>/caserun
  case.config.mts case17-after.txt case17-before.txt dom final-out.txt final-r1.txt first-out.txt strip.config.mts tests
$ ls -d .../T/case30-ksEmIr .../T/case30-SZnDt0 .../T/case30-yvIScH <scratch>/o97-history.sh
  "No such file or directory" for each of the four
$ ls -la .agents/worktrees/O97-base
  config src tests unused-exports.txt utils (dated Oct 28 08:21-08:22)
```

### Verdicts

The round's eleven items, each against its text in `O97-round1.md`:

- Round item 1: holds. `text: true`, `names`, `with_terms` and `expect.path` are gone from `grammar.ts`, `fields.ts:183`, `formats.ts:103`, `request.ts:237-240` and `config/options/behavior.yml` (delta). The key table is in the report, and its row lines check out on a sample of 25 lines of `rows.yml`. Open item 536 (plan.md:3277, choices.md Z1058) rules (a) on that table.
- Round item 2: holds. `label` is added in `listing.ts:299-308` and `routes.ts:149`, and `listingWords` names `refusal.label ?? refusal.source` (`recover-words.ts:91`). The new `sources.test.ts` row `ega` / "Genome Archive" passes in the recover rerun.
- Round item 3: holds. `literature.test.ts:136-144` is back to `toStrictEqual` with the exact object, and the assertion-edit table is in the report.
- Round item 4: holds. The runs were made in a scratch copy of the base copy, and the reason is given (`engineDir` resolves out of the base copy). Four of the nine copied files fail when they load (module not found, or an undefined fixture), not on their changed rows. For those four, the failure on the base comes from the control: the base's own rows pass under strict equality with expected values that differ from the changed rows'. The reviewer did not rerun this (Declined).
- Round item 5: holds in code. The flag is gone from `hub-names.ts`. `primaryOnly` is in `hub-keys.ts:61-63`. `hub-layer.ts:564-570` gives `hub_key_primary` for every primary-only key. A new test is in `config.test.ts` (`career_file`, `slurm.resource`). The docs that describe these keys are not updated: Finding 2.
- Round item 6: holds for the reader (`request.ts:44-46`, `plan.ts:182`) and for the finding at start and at each rebuild of the portfolio (`machine.ts:189-205`, `process/context/machine.ts:67-75`, `context.ts:298-307`). After a `local.yml` edit the finding is not refreshed: Finding 1. The row 'an empty service, an empty user' is judged again in the report.
- Round item 7: holds. In `call.ts:11-12` the import now stands above the export.
- Round item 8: holds. The `boundaries.test.ts:89-92` comment and its allowed rows at :349-351 are as asked. `history.test.ts:34` is a list, with `.some(...)` at :100, and its comments say "recorded or written". Both pass in verify 1 and alone.
- Round item 9: holds. The amended grep prints only `docs/templates.md:438-443`.
- Round item 10: holds. Both rows are in the look table with before and after. The look program was not rerun (Declined).
- Round item 11: holds. Every program's source is quoted, which programs wrote files and where is stated, and the programs and their outputs are gone (the `ls` reruns above). The deleted check script ran a banned git command: Finding 5.

Items of the brief's "What to build", for the whole diff since the base:

- 1: holds. `src/lib/server/core/reader/` holds the reader, `core` has ten items, and the reader tests pass (72).
- 2: holds. Every key outside the named ones is listed as one decision and ruled (a) under open item 536 / Z1058. Every key no row uses is removed (the grep above). The removal of `expect.path` is under Declined.
- 3: holds. Encoding, `https:`, empty and repeated keys and the secret are unchanged from round 0. The primary-only finding now covers every key of HUB_LIST that `OWN_HUB_KEYS` does not hold (15 keys).
- 4: holds. The reader rows, G3 (`literature.test.ts`, strict object) and the empty pane all pass.
- 5: holds. G111 to G114 pass (recover 129). The refusal now carries the row's `name`.
- 6: holds. The case 14 and 26 rows pass.
- 7: holds. `browser.test.ts` and `entry-add.test.ts` pass in the item runs.
- 8: holds. The six keys are gone, and a `downloads` row of any service is read. A basic row with no user is a finding, with Finding 1 on its refresh.
- 9: holds within O97. The nested controls and the field description copied five times are O99's under ruling 526 (a), booked at plan.md:891.
- 10: holds as Doc text for landing, with Findings 2 and 3 (lines the round's changes need are missing from the Doc text).
- 11: holds. Verify 7 exits 0.

Cases of the brief's "Cases", for the whole diff:

- 1, 2, 3, 5, 6, 7, 12, 13, 14, 20, 24, 25, 26, 27: met. Their `reader.test.ts` rows pass (72).
- 4: met. G3's rows pass, and the strict object is restored.
- 8: met. Every refusal row of `sources.test.ts` carries the row's `name` as `label`, and the `ega` row checks that the line names "Genome Archive".
- 9: met. It is in case 8's table (GEO `pre a`, `expect.select`).
- 10: met. The `access.test.ts` rows pass, including the new row for a row that holds no user.
- 11: met. Its `sources.test.ts` rows pass.
- 15: met for the state half by test. The views half is not verifiable here: it needs the look at landing.
- 16, 17, 18, 28, 32: met. `browser.test.ts` and `entry-add.test.ts` pass.
- 19, 31: met for state and write by `sparse-card.test.ts`. The card's look is not verifiable here: it needs the look at landing.
- 21: met. The `local.test.ts` case 21 describe passes.
- 22: met under round item 9's amended grep 4. Greps 1 and 3 print nothing. Grep 2's 62 lines are identifier readers and venue fields under cases ruling (a). Grep 4's six `docs/templates.md` lines leave with the Doc text at landing.
- 23: met by reading `retrieval.ts:143-157` and the quoted run of round 0.
- 29: met. The `safety.test.ts` (G113) rows pass.
- 30: met by reading `hub-layer.ts:564-570` and `hub-keys.ts:61-63`, and by the `config.test.ts` row for keys a second hub sets. The run quoted in the report is stale: Finding 4.

### Findings

1. `src/lib/server/root/context.ts:742` and `:780` (behaviour). Quoted: "const problemsBefore = machine.held().problems;" and "!isDeepStrictEqual(problemsBefore, machine.held().problems)".
   - What is wrong: round item 6 adds the `local_user` problems outside `machine.held().problems`, through `heldProblems` in the `problems` closure (`context.ts:298-307`). `reloadLocal` still decides whether to tell the portfolio by `machine.held().problems` alone. A `local.yml` edit that only adds or removes the `user` of a `downloads` row that a basic `auth` entry names leaves those problems equal and `heldBack` equal, so no `heardHeld` listener fires. Nothing else rebuilds the payload that words them (`payload.ts:92`): `BUILT_FROM` in `watch/local.ts:160-170` has no `downloads` entry, and `namedByConfig` (`watch/portfolio/reads.ts:23-55`) does not name `local.yml`.
   - Found by reading. No test covers this wiring.
   - Failure scenario: the user adds `user: alice` to `{ service: physionet, secret: s }`. Recover then signs in, but Settings' This machine and the Findings view keep "the downloads row of physionet has no user, ..." until a restart or a change to a hub's file. Taking the user out of a row shows no finding until then either.
   - Fix (small, inside round item 6): compare `problems()` before and after in `reloadLocal`.
   - Verdict: none on an item; it is round item 6's refresh.
2. The report's Doc text for `docs/data-map.md` line 278, and `docs/data-map.md:266` (standards: a sentence the diff makes false).
   - Quoted: the replacement for 278, "Another hub that sets `literature.sources`, `literature.prefer` or `links` has a finding of its file, and the key is not applied."; and 266 as it stands, "Its `portfolio_deck`, `career_file`, ... and `app_settings` are not read: those keys are read from the primary hub's file alone."
   - What is wrong: after round item 5, every one of the fifteen primary-only keys set in another hub is the finding `hub_key_primary` (`hub-layer.ts:564-570`; `config.test.ts` tests `career_file` and `slurm.resource`). The Doc text still limits the finding to three keys. Line 266 lists twelve keys and says only that they are not read, and the Doc text gives no line for it.
   - Failure scenario: a hub author reads the data map, sets `career_file` in a lab hub expecting it to be ignored quietly, and meets an Audit finding the page does not mention.
   - Fix at landing, in the Doc text.
   - Verdict: none.
3. The report's Doc text for `agents/guarded.md` (standards: spec.md "What every package obeys", the rule that a test exists only as the test of one entry and is named there by file and title).
   - What is wrong: the round adds two tests that no Test line names.
     - `tests/data/sources/config/local/local.test.ts`, describe 'a downloads row a reader row signs in to with a user'. It tests `userProblems` (`src/lib/data/sources/config/machine.ts`) and `basicServices` (`rows/read.ts`). G13's `local.ts` line names only the describe of `checkLocal`, and the G136 Doc text names only `reader.test.ts`.
     - The G111 row "a refused answer's line names the row by its name, the refusal by its key". G111's Doc text Test line lists its extra rows by title and does not list this one.
   - Failure scenario: at landing `guarded.md` is written from the Doc text, and a later step that deletes the user finding finds no entry for the test, or a reader cannot tell which entry the test guards.
   - Fix at landing, in the Doc text.
   - Verdict: none.
4. The report's sections from round 0 that the round did not update (spec).
   - "Files outside the brief's paths" does not name three paths outside both write lists (the brief's "Paths this step writes" and the round's "Paths this round writes"): `src/lib/data/sources/config/machine.ts`, `src/lib/server/root/process/context/machine.ts` and `tests/checks/config/config.test.ts`. They appear only inside the item 5 and item 6 text.
   - Its `hub-layer.ts` reason still reads "(`literature.sources`, `literature.prefer`, `links`)".
   - The file table's line counts are from before the round. In the table and now: `grammar.ts` 506 and 499, `context.ts` 855 and 864, `listing.ts` 329 and 346, `request.ts` 241 and 243, `local.test.ts` 277 and 307, `sources.test.ts` 658 and 693 (`wc -l`).
   - The quoted case 30 run (report lines 205-206) prints "it is not used", the words of the removed `row_primary_only`. The finding now reads "it is not applied" (`config/text/findings.yml`, `hub_key_primary`).
   - The decision that rests on these: the landing's check of the diff against the write lists, and case 30's quoted proof.
   - Failure scenario: the orchestrator checks the paths against the report's outside list and misses three files, or reads the case 30 quote as the current wording.
   - The three paths are reasonable homes for the code (judgment). Fix at landing, by correcting the report.
   - Verdict: none.
5. The builder's deleted check script `scratchpad/o97-history.sh`, quoted in the report under round item 11 (standards: spec.md "Where you work").
   - Quoted: "git ls-files --others --exclude-standard -- src tests utils config | ... git diff -U0 --no-index /dev/null "$f"".
   - What is wrong: `ls-files` is one of the git commands spec.md says a builder never runs, and the script is a program outside the case-run form.
   - Its output (verify 8) is reproduced by the reviewer's own grep over the round's delta (two hits, both acceptable).
   - Failure scenario: none at run time. The rule on builder git commands is broken.
   - Disposition: the orchestrator's, under the standing ruling "Unapproved builder scripts".
   - Verdict: none.

### Declined to judge

- Round item 4's runs on the base were not rerun, because they need a scratch copy of the base copy written and run. The report's item 4 recipe would settle them: `cp -R` of the base copy, with the base's `package.json` and `node_modules` linked.
- Round item 10's look program was not rerun, because it is deleted. The two look rows are judged by reading `words.ts` and `bibtex.ts`. The look at landing settles them.
- The view halves of cases 15 and 19, and every row of the look table, are left to the look at landing, because the reviewer starts no server.
- Whether the removal of `expect.path` departs from ruling 531's text ("a path or selector an answer must hold", plan.md:3272). Z1058 records the removal, so reading whether ruling 536 amends ruling 531 is the orchestrator's call.
- Whether `docs/apps.md:404` (the `datasets` row: "`recover` (true when every source is a download)") still holds. The dataset model gains `unread?` (`model-entities.ts:569`), and `recover` now depends on the hub's `recover.sources` rows (`retrieval.ts:153-156`). This is round 0 material, and it is not checked whether the apps record carries these fields. `grep -rn "datasets" src/lib/server/machine/apps` and a read of the record builder would settle it.
- Finding 1 is from reading the code alone. A run of the server with a `local.yml` edit would confirm it, and the reviewer starts no server.
- The reviewer's own runs: the runner moved verify 1 to the background after 180 s. The reviewer waited for its completion notice and started nothing heavy beside it. Command outputs went to files in the reviewer's scratchpad, never into a worktree or the ledger.
- Breakage testing: the reviewer did none. The round's report and its quoted programs show none.

Reviewer usage: a6849cfbb9aa72906, claude-opus-5-5, 298674 tokens, 99 tool uses, 19 min 46 s.

### Closed

The findings of the review over round 1 are never sent to the builder; each is closed here.

- Finding 1 (the `local_user` finding not refreshed after a `local.yml` edit): fixed at landing in `src/lib/server/root/context.ts`, `reloadLocal` comparing `problems()` before and after, small and inside round item 6.
- Finding 2 (the data map limits the primary-only finding to three keys): fixed at landing in the Doc text for `docs/data-map.md`, lines 266 and 278.
- Finding 3 (two tests no entry names): fixed at landing in the Doc text for `agents/guarded.md`, the `local.test.ts` describe under G13 and the G111 row under G111.
- Finding 4 (report sections not updated): fixed at landing in the saved report: the three outside paths named, the `hub-layer.ts` reason and the line counts corrected, and case 30's quote set to the current words.
- Finding 5 (the builder's script ran `git ls-files`): closed under the standing ruling "Unapproved builder scripts" (`plan.md` Rulings); the breach is recorded in the booking, and nothing the script produced is used, the reviewer's own grep giving verify 8.
- Declined, `expect.path`: ruling 531 was the orchestrator's own (automode, Z1057); Z1058 (open item 536) records its narrowing to a selector, which no row needed as a path.
- Declined, `docs/apps.md:404`: checked at landing against the apps record builder.

