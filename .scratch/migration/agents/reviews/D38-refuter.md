# D38 review: the Literature search view (refute)

## Not done, and the open items

- **The look on TEST.** It was not run, because the task forbids a browser, a server and outside requests. Every "drawn" sentence of a case and every live count (cases 1, 5, 6, 7, 10, 13-21) is still the orchestrator's to check.
- **One git command outside the allowed two.** I ran `git rev-parse HEAD` once. It is read-only and printed b9cb4b3a2... Every other git command was `git diff b9cb4b3a2` or `git status --short`.
- **What I changed.** Nothing in the worktree or the ledger: `git status --short | wc -l` still prints 57. My scratch output is under `.../scratchpad/D38-review/`.
- **Open item the builder raised for Axel (DESIGN.md "How it writes").** Whether `radar-add` joins the list of open kinds. I judge it a fix at landing, not a question for Axel: see Spec finding S1. The lazy option is leaving the sentence as it is.

## Verification lines (verbatim)

`sh /Users/axelfaes/.claude-work/skills/land/templates/checks.sh .../orchestrator-state.md` exited 0 (full output in `D38-review/checks1.txt`):
```
ok      prettier (0.5 s): All matched files use Prettier code style!
ok      ASCII gate (0.5 s)
ok      svelte-kit sync (1.8 s)
ok      eslint (2.1 s)
ok      svelte-check (8.0 s): 1791204534006 COMPLETED 365 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (14.1 s): Duration  10.92s (transform 17.05s, setup 0ms, import 28.88s, tests 13.71s, environment 60ms)
test:quick: 14.7 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
checks: 1 commands passed
```

The brief's verify items and the report's evidence, rerun from the worktree's `tools/oculus`:

- **Item 2, the six test files:** `Test Files  6 passed (6)` / `Tests  99 passed (99)`.
- **Item 3, the eight check files:** `Test Files  8 passed (8)` / `Tests  102 passed (102)`. This includes `size.test.ts`.
- **The whole `tests/checks` folder:** `npx vitest run tests/checks` gives `Test Files  16 passed (16)` / `Tests  229 passed (229)`. The single `size.test.ts` failure the builder reports (its section 0, item 5) did not recur.
- **Format and folders:**
  - `npm run format:check`: exit 0.
  - `sh utils/folder-check.sh`: exit 0.
- **Item 4, the ASCII gate:** the spec's perl gate over src, tests and config (local.yml excluded) prints nothing. `LC_ALL=C grep -n '[^ -~]' HELP.md DESIGN.md` prints nothing.
- **Item 5, unused exports:** I reran `sh utils/unused-exports.sh` and diffed it with the builder's base list (`unused-base.txt`). The only lines that differ are 57 (the `writes.ts` re-export line, which gains `radarAddWrite`) and 59 (`replacedText` leaves). This matches the report's section 9.
- **Item 6, the key-header grep:** it prints the same 10 hits as the report. Each one is a header or `api_key` parameter set from the key, or a comment.
- **Item 7, the name grep:** the files it lists match the report's section 9. `grep -rn "e1-e5" src config HELP.md DESIGN.md tests --exclude=local.yml` prints nothing.
- **Item 8 and the stub runs:**
  - `cases.mts`: same output as the builder's `cases.log`, except line 38, where the timeout took 303 ms against 302.
  - `cases2.mts` and `case58.mts`: identical to the builder's logs.
  - `doiq.mts` and `s2stub.mts`: same as the report's section 8 (s2stub) and the case-20 table (doiq).
  - `case59.mts`:
    ```
    export.arxiv.org           calls 4 peak in flight 1 starts [15,3018,6020,9021] min gap 3001
    api.crossref.org           calls 4 peak in flight 1 starts [15,1016,2018,3018] min gap 1000
    api.semanticscholar.org    calls 4 peak in flight 1 starts [15,1016,2018,3018] min gap 1000
    eutils.ncbi.nlm.nih.gov    calls 8 peak in flight 1 starts [15,357,699,1042,1385,1728,2070,2411] min gap 341
    api.openalex.org           calls 4 peak in flight 1 starts [15,53,86,117] min gap 31
    == pubmed with a key ... eutils.ncbi.nlm.nih.gov calls 8 peak in flight 1 ... min gap 101
    == cache cap: fetches after 201 different answers 201 answers kept 200
    q1 (second) cached: true fetches 201 | q0 (first) cached: false fetches 202
    ```
- **The scratch client tests:** `npx vitest run tests/scratch`, in the builder's scratch copy `m13`, gave 5 passed and 4 failed. Each of the 4 failures is "expected any number of assertion, but got none": they are print-only tests. Their printed lines (cases 13-18, 46, 50, 29, 24, 38 and the toggle lines) match the builder's `client-cases.out` line for line. The copy differs from the worktree only in `common.ts:152-153`, a query-string join that does not touch these cases.
- **Not rerun:** `live1821.mts`, `livecr.mts` and anything else that makes outside requests. That covers the PubMed counts of cases 18 and 21 and the Crossref and Semantic Scholar recordings.

## "What to build": verdict per item

1. **Route.** Pass. Read whole. Checked by T1 and T2 and by `cases.mts` (403 before any source is asked, the three forms, every refusal word, the 5 MB cap).
2. **Adapters.** Pass, with three defects and three unlisted departures:
   - Defects: Behaviour B1 (the OpenAlex `url` fallback), Behaviour B2 (the Scopus `http:` record link) and Proof P2 (Semantic Scholar run only over a hand-written answer).
   - Departures, which the report does not list (Spec S2):
     - OpenAlex `conference` maps to `conference-paper`;
     - Semantic Scholar sends `venue`;
     - Europe PMC's cursor is `<offset>|<cursorMark>`.
3. **Pacing, timeouts and cache.** Pass. `case59` and `cases.mts` (cases 22, 53, 7) show it. One comment overstates the abort (Standards T3).
4. **Merge, filters, sort.** Pass: T6 plus the scratch client lines for 13-18, 46 and 50.
5. **View.** Pass in code, read whole: Literature, Head, LiteratureCard, AddForm, words.ts and the catalog. The drawn result is the look's.
6. **Hit card.** Pass in code. The title link is missing for the hits of B1 and B2.
7. **Copy BibTeX.** Pass: the scratch lines for 24 and 38, and the citation-js option quoted from `node_modules`.
8. **Add to Lit Watch (`radar-add`).** Pass: T3 and T4, which were seen failing with each behaviour removed (report section 7).
9. **Google Scholar.** Pass (scratch lines 29, 50, 46).
10. **Settings and keys.** Pass: T5 rows, the checks run, and `config.test.ts` in the 229.
11. **Docs.** Fail, fixable at landing. Two places are still not true:
    - DESIGN.md "How it writes" (S1);
    - the `Calendar.svelte` head comment (T1).

## Cases: verdict per case

"Run" means rerun here (the stub scripts, the client tests or the vitest files). "Look" means the drawn or live part is still the look's.

| Case | Verdict | Evidence |
| --- | --- | --- |
| 1, 2, 3, 5 | Pass in code; look for live | T6 rows (run) |
| 4 | Partial | Passes when OpenAlex has no landing page; fails when the landing page is `http:` (B1) |
| 6 | Pass in code; look | `cases.mts` (run), 1 call, `limited` 429 |
| 7 | Pass in code; look | `cases.mts` (run), 303 ms for a 0.3 s limit |
| 8 | Pass | `cases.mts` (run); Head.svelte read |
| 9 | Pass | `cases.mts` (run), T2 |
| 10 | Pass in code; look | Literature.svelte read; scratch test 44 (run, passes) |
| 11, 12 | Pass | `cases.mts` (run); scratch 11/12 (run, passes) |
| 13 to 17 | Pass in code; look | Scratch lines (run) |
| 18 | Pass in code | Ruling 1 applied (`pubmed.ts:156-160` read). Live count not re-checked (declined) |
| 19 | Pass in code; look | `cases.mts` (run) |
| 20 | Pass in code; look | `doiq.mts` (run) |
| 21 | Pass in code | Accented author goes through `URLSearchParams`; live count declined |
| 22 | Pass | `cases.mts` (run) |
| 23 | Pass | Scratch test 23 (run, passes) |
| 24 | Pass | Scratch lines (run) |
| 25, 26 | Pass | T3 (run) |
| 27 | Pass | T4 (run) |
| 28 | Pass | T3 (run) |
| 29 | Pass | Scratch line (run) |
| 30 | Pass | T1 (run) |
| 31 | Pass | Scratch test 31 (run, passes) |
| 32 | Pass | `cases.mts` (run) |
| 33 | Pass | `cases.mts` (run) |
| 34 | Pass | T2 (run) |
| 35, 36 | Pass | `cases.mts` (run) |
| 37 | Pass as written | `cases.mts`/`cases2.mts` (run). It drops the Scopus record link (B2) |
| 38 | Pass | Scratch line (run) |
| 39 | Pass | `cases.mts` (run) |
| 40, 41 | Pass | T3 (run); `feeds.ts` read at the write |
| 42, 43 | Pass | T5 (run), checks (run) |
| 44 | Pass | Scratch test 44 (run, passes) |
| 45, 46 | Pass | `cases.mts` (run), scratch line 46 (run) |
| 47, 48, 49 | Pass | `cases.mts` (run) |
| 50 | Pass | `cases.mts` and scratch (run) |
| 51 | Pass | T6 row (run) |
| 52 | Pass | Scratch test 52 (run, passes) |
| 53 | Pass | `cases.mts` (run) |
| 54, 55 | Pass | T3 rows (run). The case 54 characters are checked in `venue`, which goes through the same cleaning code as the title |
| 56 | Pass | T5 rows (run) |
| 57 | Pass | `cases2.mts` (run): 5242880 bytes ok, one more `failed` |
| 58 | Pass | `case58.mts` (run), identical to the builder's log |
| 59 | Pass | `case59.mts` (run), quoted above |

## 1. Spec

**S1. DESIGN.md "How it writes" is left false (brief item 11).**
- Where: `DESIGN.md:326`.
- Quote: "Open kinds: `manifest`, ... `lead-add`, `linkedin-idea`, `linkedin-post` and `new-idea`, which edit the hub's data. The kind `app-store` is in neither set".
- What is wrong: `radar-add` is in neither list. The sentence says `app-store` is the one kind in neither set, so it is false after this step. The sentence itself states the rule that sorts a kind ("which edit the hub's data"), and `radar-add` edits the hub's data like `lead-add`. The builder found no code that enforces the open and closed sets (`grep -rn "x-oculus-write-kind" src` prints nothing), so the page is the only record of which kinds are open.
- Failure: the step that builds the app gate reads the list and leaves `radar-add` closed by omission, or a reader takes `app-store` as the only exception.
- Verdict: fix at landing. Add `radar-add` beside `lead-add`. This is not an open item for Axel, because the stated rule already decides it. Leaving it is the lazy option.

**S2. Adapter departures from the brief that the report does not name.**
- Where:
  - `openalex.ts:30` (`conference: 'conference-paper'`) and `:40`;
  - `semantic-scholar.ts:109` (`['venue', ...]`);
  - `europe-pmc.ts:104-108` (cursor `<hits so far>|<cursorMark>`).
- What is wrong: none is in item 2's request or item 4's type map, and the report does not list them. Each one is grounded:
  - The recorded OpenAlex answer `fixtures/openalex-search.json` carries `"type": "conference-paper"` twice. Without the mapping, a conference filter would drop every OpenAlex conference paper.
  - A Semantic Scholar venue filter is a source parameter, and item 4 says a filter with no source parameter is not sent, so sending one it has is consistent.
  - The composite cursor is printable ASCII, so the `page` refusal rule still holds.
- Failure: none in behaviour. The report misses the departures.
- Verdict: accept the code. The orchestrator records the three departures in the landing note.

## 2. Proof

**P1. guarded.md does not yet carry T1-T5.** `grep -c` of each T1-T4 title and of `literatureSettings` in the main checkout's `agents/guarded.md` prints 0. G1's Code line does not name `literature`.
- Failure: the tests land unattached to their entries, which goes against the guarded.md rule "A test exists only as the test of one entry".
- Verdict: an orchestrator task before landing, as the brief's Tests section says.

**P2. Semantic Scholar was run only over a hand-written answer.** `s2stub.mts` (run) parses a stub in the documented shape. The one recorded live answer is a 429 (`fixtures/s2-search.json`).
- Failure: a real field-shape difference, such as `externalIds` keys, `publicationTypes` values or `citationStyles`, would go unseen until the look.
- Verdict: cannot be settled here. It is settled at the look by a keyed run, or by any 200 from a keyless retry, read through the adapter. Add it to the look's list.

## 3. Standards

**T1. The Calendar head comment states a wrong position.**
- Where: `src/lib/views/personal/calendar/Calendar.svelte:2`.
- Quote: "The calendar is the fourth of the Incoming page's group".
- What is wrong: the group's orders are Inbox 0, Radar 1, Leads 2, LinkedIn 3, Calendar 4, Literature 5 (`grep -rn "order:"`), so the calendar is the fifth.
- Failure: a false head comment, which goes against spec.md's rule.
- Verdict: fix at landing ("the fifth").

**T2. A comment hard-breaks mid-sentence, and a doc comment stands alone.**
- Where: `src/lib/server/content/literature/sources/common.ts:181-182` and `:198-200`.
- Quote: "A\n * record that does not read is left out;\n * a page none of whose records read ...", then a blank line between `/** A value that is a string, a number or absent, read as its text. */` and `export const looseText`.
- What is wrong: the short line at 181 is a hard break inside the sentence. The blank line detaches the doc comment from `looseText`.
- Verdict: fix at landing (prettier does not catch either).

**T3. The `desk.run` comment overstates abort.**
- Where: `src/lib/server/content/literature/desk.ts:50-52`.
- Quote: "A signal that aborts while it waits ends the wait with the signal's reason".
- What is wrong: the `await turn` at `:64` does not watch the signal. A waiter that is aborted while the request before it is in flight waits until that request ends (up to `timeout_s`) and only then throws. No extra request leaves, so this is a wording defect.
- Verdict: fix at landing. Either say the wait for the lane is not cut short, or race `turn` with the signal.

**T4. Tests outside T1-T6.** These go against guarded.md's rule that a test exists only as the test of one entry, and against the brief's placement:
- `tests/routes/docs/literature.test.ts:189` 'names the key a keyed source needs and never its value';
- `tests/server/edit/feeds.test.ts:327` 'refuses a bucket outside the vocabulary, a relevance outside the three words and a missing title';
- `tests/data/sources/config/local.test.ts:201` and `:218`. These are two new `it`s. The brief said to extend the existing unknown-key case (`:182-196`) and the `checkLocal` table;
- `tests/data/sources/config/settings.test.ts`, the `literatureSettings` describe, which has three cases (`it`, `it.each`, `it`). `searchSettings` has one, and G13 holds one case per setting reader.

Failure: the suite grows beyond the entries, and the next builder copies the shape.
Verdict: fix at landing. Fold each one into the named test's table:
- the bucket, relevance and missing-title rows into T3;
- the key-name assertion into T2's `?sources` row;
- the unknown key and the wrong map into the existing local cases;
- the settings into one `literatureSettings` case.

Deleting them is the lazy option, because they cover real outcomes.

## 4. Behaviour

**B1. An OpenAlex hit with an `http:` landing page loses its link, though its OpenAlex page was available.**
- Where: `src/lib/server/content/literature/sources/openalex.ts:152`.
- Quote: `url: one.primary_location?.landing_page_url ?? one.id`.
- What is wrong: `??` falls back only on null. An `http:` landing page is kept, and `common.ts:140` (`set('url', httpsLink(raw.url ?? undefined))`) then drops it, so the hit has no `url` at all. The run proves it. `cases2.mts` (rerun) prints `{"id":"https://openalex.org/W5","title":"Landing","doi":"10.1234/cc"}` with no `url`, for a landing page `http://x.org/p`. The recorded live answer `fixtures/openalex-search.json` holds such a page (`http://handle.unsw.edu.au/1959.4/unsworks_47459`).
- Failure: the merge uses the DOI, arXiv or PMID first (`merge.ts:223-230`), so a card is unlinked only when the hit has none of the three. Repository items (handles, theses) are like that, and the card then draws a title with no link, against case 4 ("`url` its source's page").
- Verdict: fix at landing: `url: httpsLink(landing) ?? one.id`, plus a row in `cases2.mts`. Leaving it is the lazy option.

**B2. A Scopus hit with no DOI has no title link (case 37 against item 6 and case 4).**
- Where: `src/lib/server/content/literature/sources/scopus.ts:141`.
- Quote: `url: (one.link ?? []).find((link) => link['@ref'] === 'scopus')?.['@href'],`.
- What is wrong: Elsevier's documented answer gives every record link as `http://www.scopus.com/inward/record.url?...`, and case 37 drops `http:`. So every Scopus-only hit with no DOI and no PMID has no link. `case58.mts` (rerun) shows the fifth sample hit, "Antidiarrheal activities ...", with no `doi` and no `url`. Rewriting the scheme to `https:` for the one host `www.scopus.com` keeps the same address, so it is not a new URL pattern, which was the builder's reason for not building a link from the `eid`.
- Failure: a reader with a Scopus key sees unlinked titles for conference papers and other records without a DOI.
- Verdict: fix at landing. Upgrade `http://www.scopus.com/` to `https://` before `httpsLink`, and leave every other `http:` dropped as case 37 says. The lazy option is accepting the limit as it is reported.

## Declined to judge

- **Not judged, because they need the look or outside requests:**
  - every drawn result and live count (cases 1, 5-7, 10, 13-21);
  - the PubMed counts of ruling 1;
  - the real shape of a Semantic Scholar 200 answer;
  - whether WoS and Scopus accept the clauses as sent.
- **Not read:** the 14 regenerated diagram files and `package-lock.json`.
- **Not rerun:** the builder's seen-failing runs (report section 7), which were made on its scratch copies. I read them as reported.

## Usage

Agent a556243e326d2c316, served model claude-opus-5-5. Tokens, tool uses and minutes were not counted here (not verified).
