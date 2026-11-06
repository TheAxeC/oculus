# Step O156 refuter report (on .agents/worktrees/migration-O156, base a2385d834)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ npm run diagrams && npm run docs:palette   (from the worktree root; docs/ checksummed with shasum before and after)
... docs/diagrams/writes.dot
docs/diagrams/writes.svg
> oculus@1.0.0 docs:palette
> node utils/diagrams/palette.mjs
docs/palette.md
diff of the before and after checksums of every file under docs/: empty ("docs unchanged by diagrams and palette"); git status --short identical before and after ("status unchanged")

$ npm run test:quick -- --base a2385d834
test:quick: 25 changed file(s), from git since a2385d834
test:quick: 201 test file(s)
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (0.9 s)
ok      svelte-kit sync (2.3 s)
ok      eslint (2.4 s)
ok      svelte-check (9.4 s): 1793963925063 COMPLETED 583 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (123.3 s): Duration  110.60s (transform 73.50s, setup 0ms, import 159.06s, tests 249.98s, environment 5ms)
ok      vitest (162.3 s): Duration  150.73s (transform 75.47s, setup 0ms, import 213.17s, tests 362.88s, environment 5.71s)
ok      vitest slow (238.1 s): Duration  226.68s (transform 23.60s, setup 0ms, import 118.10s, tests 778.29s, environment 13ms)
test:quick: 240.6 s; every command passed
(the list includes tests/checks/diagrams/diagrams.test.ts, tests/routes/edit/deck-slides.test.ts and the four changed test files)

$ npx vitest run tests/data/hubs/decks.test.ts tests/routes/docs/deck.test.ts --reporter=dot
 Test Files  2 passed (2)
      Tests  5 passed (5)

$ npx vitest run tests/data/sources/present.test.ts tests/data/hubs tests/routes/edit/deck-slides.test.ts tests/server/edit/deck/deck-acts.test.ts tests/data/snapshot/normalise.test.ts --reporter=dot
 Test Files  12 passed (12)
      Tests  155 passed (155)

$ npx vitest run tests/checks/config/integrity.test.ts --reporter=dot
 Test Files  1 passed (1)
      Tests  7 passed | 7 skipped (14)

$ npx vitest run tests/data/hubs/decks.test.ts --reporter=verbose   (item 5's run alone)
 <check mark> |unit| tests/data/hubs/decks.test.ts > a deck's projects, facts and domains > gives each deck the same slides, projects, domains and facts on the build's read and the route's, and raises a domain finding once, on the build's 2513ms
 Test Files  1 passed (1)
      Tests  1 passed (1)

$ grep -rn "deckProjects\|createReader(\|hubDomainsOf" src tests   (C9)
src/lib/data/sources/documents/decks.ts:83:    return createReader({
src/lib/data/sources/deck/read.ts:202:export function createReader(context: DeckContext): DeckReader {
src/lib/data/index.ts:666:function hubDomainsOf(hub: string, config: PortfolioConfig): HubVocab['domains'] {
src/lib/data/index.ts:694: * The words one hub gives its own records, read from its own files: its domains (`hubDomainsOf`)
src/lib/data/index.ts:709:        domains: hubDomainsOf(hub, config),
tests/data/sources/present.test.ts:175:        const reader = createReader({
tests/data/sources/present.test.ts:284:            createReader({
tests/data/sources/present.test.ts:680:            const deck = createReader(context).read({ key: 'hub', dir }, one.path);
(identical to the report's C9 block; the same grep on .agents/worktrees/O156-base prints 19 lines, the report says 18; no decision rests on that count)

$ LC_ALL=C perl -ne '... the rules file's ASCII gate ...' $(find src tests bin config -type f ! -name local.yml)
(nothing; exit 0; the tree has no bin folder)
$ the same perl check without the config exemption over every path of git status --short and the three changed .svg files
(nothing)

$ wc -l (every changed file)
138 decks.ts | 106 server/content/deck/read.ts | 127 deck-facts.ts | 829 data/index.ts | 830 sources/deck/read.ts | 393 kinds.ts | 719 normalise.ts | 180 project-facts.ts | 361 decks.test.ts | 339 deck-hub.ts | 198 deck.test.ts | 336 integrity.test.ts | 749 present.test.ts | 506 findings.yml | 642 HELP.md | 431 decks.md | 447 guarded.md
(all equal to the report's table; every source file at or under 880)

$ sh utils/unused-exports.sh > <scratchpad>/unused.txt; diff .agents/worktrees/O156-base/unused-exports.txt <scratchpad>/unused.txt
(nothing; exit 0)

$ sh utils/folder-check.sh
(nothing; exit 0)
$ ls tests/data/hubs | wc -l ; ls tests/data/sources | wc -l ; ls src/lib/data/sources/deck | wc -l
9 / 10 / 10

$ history-word grep over the added lines of git diff a2385d834 -- src tests config docs/HELP.md docs/decks.md and the whole of tests/data/hubs/decks.test.ts
+import { readHubBeforeDecks, readOtherHub } from '../../../src/lib/data/index.ts';
+/** One hub of the workspace as the build reads it before its decks. */
+        raw: readHubBeforeDecks(one.dir, one.config, one.roots, one.key).raw
(the comment hit names the order of the build's steps, as the report judges; the other two are an identifier)

$ test -d docs/adr || echo "no docs/adr"
no docs/adr
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `deckReader` and the one `deckProject` are in `src/lib/data/sources/documents/decks.ts:61-92`; the C9 grep shows `createReader(` only there and in the three reader tests of `present.test.ts`; `integrity.test.ts:101` and `:328` read through `deckReader`. The reader's own `domains` input (`DeckContext.domains`) is removed instead of built, since item 4 moves the check into the module; the report states this as its decision 1.
- 2: holds. `decked` calls `readDecks` (`data/index.ts:312`), which builds the projects with `hubProjects` (`deck-facts.ts:53-127`, the merge's resolution through `resolvedId` and `linked`) and reads through `deckReader` (`decks.ts:113-115`); the `unnamed` rule (`decks.ts:130-135`) and the `decks` record (`decks.ts:116`) are kept, and the `DECKS` table of `decks.test.ts:346-361` pins the record.
- 3: holds. `server/content/deck/read.ts:95-101` calls `deckReader` and holds no `DeckProject`, `createReader` or `hubDomainsOf`; `DeckSource` and `readDeck` have the signature they had at the base (`read.ts:41-49`, `:69-75`); deck-slides and deck-acts pass in the 155-test run.
- 4: holds. Each of the 14 rows compares the module's deck over the build's input with `readDeck`'s answer whole (`decks.test.ts:285`), pins each slide's project and domain, and pins the build's domain findings and an empty list of route domain findings (`:320-333`); passes in my runs. The check sits in `readDecks` (`decks.ts:117-129`), on the manifest's `domain:` as written, through `resolveKey`, which answers `{ hubs }` (not null) for an ambiguous key (`hub-names.ts:532-541`). No field is added to `Project` (`git diff a2385d834 --stat -- src/lib/data/model docs/apps.md` is empty). `findings.yml:123` has the new words.
- 5: holds. `deck-facts.test.ts` is gone and `decks.test.ts` holds one table, `@module-tag slow`; every row of the removed route test (hccnet and kit facts, quantum, failedp, stoppedp, ghost, empty, labp, the graph-bandits domain and its absent registry finding) and of the old deck-facts test (the placeholder findings and titles of hccnet, quantum, ghost, empty, crossp) is a row or column of the new table; the route's refusal, draft and unnamed tests remain in `deck.test.ts` (four `it` titles, the same as at the base less the facts case); G32's Test line names the new file and title and drops the two gone titles.
- 6: violated, Standards 1. The comments the brief lists are rewritten, and `docs/HELP.md` and `docs/decks.md` each gained a true bullet. Three comments in `model-deck.ts` and one in `kinds.ts:91` still call a slide's domain a key.

Cases of the brief's "Cases":

- C1: met, row 'a project deck naming a domain key its own hub holds' (`hub:graphs` on both slides, no domain finding), passes.
- C2: met, rows 'a project deck naming a domain key only another hub holds' and the portfolio row (`lab:labonly` on the slide, legend, summary and grid; no domain finding on either read); the report quotes its failing lines on the base, which agree with the base code (`git show a2385d834:src/lib/data/sources/deck/read.ts` checked `keyOf(project.domain)` against the own hub's keys only).
- C3: met, row 'a project deck naming a domain key no hub holds': one `domain_unknown` on stray's manifest beside the schema check's finding, slide domain undefined on both reads. See Spec 1.
- C4: met, row for `twind`: the merge's ambiguity finding alone, no domain drawn.
- C5: met, the placeholder rows (quantum, hccnet, ghost, empty, crossp) with the same findings on both reads and none for hccnet and crossp.
- C6: met, row for `labp` in lab's words (`sent out`, `Dana of Lab`).
- C7: met, the route's unnamed test passes; the build side by reading `decks.ts:130-135`.
- C8: met, the draft test and the narrowing test pass.
- C9: met, the grep above, each hit as the brief names them.
- C10: met for the fixture, by reading the pinned build findings of every row; the running hub is for the look (Declined to judge).
- C11: met, `DECKS` pins path and tags for 14 projects; by reading, path and tags come from `projectDocs` and slide tag classes, which no input this step changes reaches. See Proof 1.
- C12: met, the `kit` row and the portfolio row (`hub:graphs`, resolved in the primary).
- C13: met by reading: the route's choice of hub (`read.ts:82-86`) is unchanged and the build's `withDecks` call is unchanged.
- C14: met by reading and the route's tests: `readDecks` reads project decks and the portfolio deck only; `readOtherHub` still sets `portfolioDeck: null`.
- C15: met for both deck reads: failedp (no `domain:`) and empty (`domain: ""`) draw no domain and raise no deck finding. The schema check's finding on the empty key is Spec 1.
- C16: met, deck-slides and deck-acts tests pass.
- C17: met, `labp` draws `hub:hubonly` with no domain finding.
- C18: met, the portfolio row and the stray row each find one `domain_unknown` for stray in the whole build's findings.
- C19: met, `Tests  7 passed | 7 skipped (14)` as at the base; the real-hub cases skip by design here (Declined to judge).
- C20: met, `npm run diagrams` leaves the committed diagrams unchanged, `writes.dot:1415` draws the `read.ts` to `decks.ts` edge (`deckReader`), `grep -c hubDomainsOf docs/diagrams/writes.dot` prints 0, and the quick list's diagram check passes.

## 1. Spec

- `src/lib/data/sources/documents/decks.ts:117-129` and the brief's C3 and "What is on the tree": "for (const manifest of read.raw.manifests) { ... if (resolveKey(made.domains, read.root, key) !== null) continue; unknown.push({ ... 'findings.deck.domain_unknown' ... })"; what is wrong: the builder built what C3 asks. The brief's premise list says a key no hub holds "is dropped in the hub's own build (`normalise.ts:681-697` ... `links.ts:87`, `:152`)", but it does not name the manifest schema check (`schema/check.ts:276`, `findings.schema.no_key`). That check already raises "domain is nowhere, which is not a key of domains" at the manifest's `domain:` line for such a key, and "domain is , which is not a key of domains" for `domain: ""`. Both findings are pinned in `decks.test.ts:123-124`, `:138` and `:243`, and both were there at the base, as the report's first run shows. In the fixture the schema check accepts a key another hub holds (the crossd row has no domain finding), so `domain_unknown` now fires only where the schema finding fires too. A key no hub holds therefore gives two findings for one cause, and the plan line's "a project slide's domain is checked once" is not true of the build as a whole. Item 4's "an empty key is no key" is not true of the Findings view either, since the empty key shows the schema finding. This is the orchestrator's decision, not a builder defect. Option (a) is to keep both findings, as the brief says. Option (b) is to drop `domain_unknown` and let the schema finding stand; that changes C3, `docs/decks.md:387`, `docs/HELP.md:343` and `findings.yml:123`. Neither fixes the schema check's finding on `domain: ""`, which is outside the write list. Failure scenario: a manifest with `domain: nowhere` and a deck shows two Findings rows on the same `project.yml` saying the same thing, one with a line and one without, and a manifest with `domain: ""` shows a finding although the docs say an empty `domain:` names none; verdict: none (C3 and C15 are met as the brief words them).

## 2. Proof

- `.scratch/migration/agents/reviews/O156-report.md`, "The cases' first run", C11: "On the base the snapshot's `deck` and `deckTags` per project printed as the 14 rows the final table pins in `DECKS` (`AssertionError: the build's decks record: expected [ [ 'hub:crossd', <ellipsis>(2) ], <ellipsis>(13) ] to deeply equal []`"; what is wrong: `DECKS` asserts a preserved behaviour, and the quoted base output is cut by vitest after the first row. No passing run on the base, and no whole printed value, shows that the 14 pinned rows are the base's. The C11 verdict rests on it; I settled it by reading instead: `projectDecks` (`deck/read.ts:816-828`) takes path and tags from the deck folders and the slide tag classes, which this step does not change. Failure scenario: none here. A reader of the report cannot see from the quoted line that the base and the step give the same decks record; verdict: none (C11 met by reading).

## 3. Standards

- `src/lib/data/model/model-deck.ts:89`, `:97`, `:208` ("/** The project's `domain:` key, which the card's colour and words are read from. */", "/** The project's `domain:` key; the field is that domain's label. */", "/** The project's `domain:` key. */") and `src/lib/data/sources/deck/kinds.ts:91` ("the group its `legend:` names, which the reader turns into domain keys"); what is wrong: after the step a slide's, a summary row's, a grid card's and a legend's domain is the resolved internal id on every read, and `decks.test.ts:107`, `:117-119` pin `hub:graphs` and `lab:labonly`. The `model-deck.ts` comments were already false for the route's answer at the base. The step changes `DeckProject.domain` on the build's read from the key to the id, so after it they are false on both reads. They are not in the report's list of comments. This breaks the rules file, "What every package obeys", the rule to grep a changed shape and list every comment that describes it, and item 6. Failure scenario: an app or view author reads `DeckSummaryRow.domain` as a bare key and looks it up in one hub's domains registry by key: `hub:graphs` matches nothing, so the row draws no domain; verdict: item 6 violated.
- `src/lib/data/snapshot/hubs/deck-facts.ts:45`: "/** The hubs that hold each key of a domain, in the workspace's folder order. */"; what is wrong: the lists are built from `const hubs = [own, ...others]` (`:60`, `:67-70`), so for any hub that is not the first folder (`lab` in a workspace ordered hub, lab, far) the own hub comes first, not the folder order. No caller reads the order today, since `readDecks` only tests for null (rules file, "Prose": name the actual behaviour). Failure scenario: a later caller that words a finding from `resolveKey(...).hubs`, as the merge's ambiguity finding does ("the hubs lab, far"), lists the hubs in a different order from the merge's finding for the same key; verdict: none.
- Builder's report, the paragraph after the DONE table: "One earlier run of it was stopped by me before it finished ... a probe `npx vitest run --dir <scratchpad>/caserun --project unit`, meant to run one file from the scratchpad, ran for about 7 minutes with its output unseen before I stopped it, and it may have run test files of the tree beyond the probe"; what is wrong: the rules file, "Token discipline", allows one run of the list after the last change, and it names a run of the list beyond that, or a whole-suite command, as a finding. The probe was a case-run program, and its source is not quoted ("What every package obeys", the case-run program rule). No claim rests on either run: every DONE row quotes the completed list or a named file run, and my reruns reproduce each one. Failure scenario: cost only. A run of perhaps the whole unit suite for 7 minutes on a machine where other steps' suites run at once slows those runs, as the state file's `workers_at_once` note records; verdict: none.

## 4. Behaviour

none. The report states with before and after the C2 and C17 domain drawn from another hub and its finding removed, the C4 `domain_unknown` removed with the merge finding kept, the C3 new words with the schema finding before and after, the C10 list, and the route answer carrying no domain finding (with `present.svelte.ts` drawing none of the route's findings: `grep -n "findings" src/lib/state/life/present.svelte.ts` shows only the too-tall ones). The client draws another hub's domain by its id (`tones.ts:285-290`, `splitHubId` over every hub's domains). The route's `Deck` shape and the `Project` fields of `docs/apps.md:402` are unchanged.

## Declined to judge

- The look: the Findings view of the running hub (C10) and the other hub's domain colour and title on the slide, legend, summary and grid. A read and a test run cannot show what is drawn; the look on landing does.
- The real-hub cases of `tests/checks/config/integrity.test.ts` (7 skipped). Running them needs `OCULUS_TEST_HUB` set to the research hub, and I did not load the real hub's configuration from this review. A run with that variable at landing settles whether the read over `mergeHubs` projects gives the same equation counts on the real hub.
- The cases' first run on the unchanged tree was not reproduced. The table's first form is gone and the base has no `deckReader` or `hubProjects`, so the new table cannot run there. I checked the quoted failing lines of C2, C4, C17 and C18 against the base code by reading `git show a2385d834:src/lib/data/sources/deck/read.ts` and `git show a2385d834:src/lib/data/sources/documents/decks.ts`.
- Whether the schema check's enum for `domain` always holds every hub's keys (Spec 1 relies on the fixture's crossd and stray rows). Reading `targetKeys` in `src/lib/data/snapshot/schema/record.ts` settles it.
- The judgement in Spec 1 between keeping both findings and dropping the deck's: the orchestrator's or Axel's call.
- `docs/HELP.md`, `docs/decks.md` and the redrawn `layers.dot`/`.svg` and `layer-server.dot`/`.svg` are outside the write list. I judge them justified, not findings. The rules file's documentation rule asks a step to write what a user meets into `docs/HELP.md`, and `docs/decks.md` is the guide of the changed behaviour; I read both added sentences as true. The diagram files are the output of `npm run diagrams`, which the verify list runs, and my rerun left them byte-identical. All are named in the report.

Reviewer usage: a883220b1e4e27a9e, claude-opus-5-5, 243008 tokens, 80 tool uses, 17.5 min.
