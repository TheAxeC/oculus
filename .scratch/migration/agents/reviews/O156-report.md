# O156 report: one deck reader for the Findings view and the Present view

Everything in the brief is done.

## Open items of the state file

Quoted from `.scratch/migration/orchestrator-state.md`, section "Open items":

> None.

## The cases' first run

The first run was made with `src` and `config` as the base holds them: `diff -rq` of `src` and `config` against `.agents/worktrees/O156-base` printed nothing, and `tests` differed only by the planted fixture (`tests/fixtures/hubs/deck-hub.ts`) and the table (`tests/data/hubs/decks.test.ts`, the file `deck-facts.test.ts` renamed with `mv`). The table's first form held every row and assertion of the final one except the comparison with the module's deck over the build's own input, since `deckReader` and `hubProjects` do not exist on the base; it used `expect.soft`, so every row ran. Command: `npx vitest run tests/data/hubs/decks.test.ts` (output kept at the scratchpad's `first-run.txt`): `Tests 1 failed (1)`, 14 soft failures, the lines below as printed (a diff line is shown as vitest printed it).

- C1. Holds on the base. The rows "a project deck naming a domain key its own hub holds" (graph-bandits: `hub:graphs` on both project slides) and the portfolio row's `hccnet` and `kit` printed no failure for their slide domains and facts.
- C2. Fails on the base, as the brief says. `AssertionError: a project deck naming a domain key only another hub holds: expected [ Array(1) ] to deeply equal [ [ 'main.md#0', 'crossd', <ellipsis>(1) ] ]` with `-     "lab:labonly",` / `+     undefined,`; and on the route's answer and the build's findings: `+   "hub/projects/manuscripts/crossd/project.yml:undefined project crossd names the domain labonly, which is no key of the domains registry (the file the domains entry of the hub's collections list names); its slides are drawn in the neutral tone",`. The portfolio row: `"legend": [ "hub:graphs", -     "lab:labonly", ]`, `"summary"` and `"grid"` with `-     "lab:labonly",` / `+     undefined,`.
- C3. On the base the build raised two findings on `stray`'s manifest: `+   "hub/projects/manuscripts/stray/project.yml:5 domain is nowhere, which is not a key of domains",` (the manifest schema check, not a deck finding) and `+   "hub/projects/manuscripts/stray/project.yml:undefined project stray names the domain nowhere, which is no key of the domains registry (...)"`; the slide drew no domain. The first form of the row expected the deck finding alone, so it failed on the schema finding and on the old words; the final row pins both findings (see "Anything in the brief that was wrong").
- C4. Fails on the base: `+   "hub/projects/manuscripts/twind/project.yml:undefined project twind names the domain twin, which is no key of the domains registry (...)"` beside the merge's `"hub/projects/manuscripts/twind/project.yml:undefined domain is twin, which the hubs lab, far each hold and its own hub does not, so it names no record"`.
- C5. Holds on the base: the placeholder rows (`quantum`, `hccnet`, `ghost`, `empty`, `crossp`) printed no failure on their placeholder findings or titles.
- C6. Holds on the base: the `labp` row printed no failure on its facts' words (`sent out`, `Dana of Lab`); it failed on its domain, C17.
- C7. Holds on the base: `tests/routes/docs/deck.test.ts > ... answers the portfolio deck of a hub that never names it as unnamed when its folder is missing, and a named one as missing` passed (`npx vitest run tests/routes/docs/deck.test.ts tests/data/sources/present.test.ts tests/routes/edit/deck-slides.test.ts tests/server/edit/deck/deck-acts.test.ts tests/data/snapshot/normalise.test.ts tests/checks/config/integrity.test.ts --reporter=verbose`, `Tests 1 failed | 41 passed | 7 skipped (49)`; the one failure is the facts case of `deck.test.ts`, which reads the fixture the first run had already planted into and is the case that moves). The build's side read on the base: `decks.ts:90-93` skips the read of an unnamed missing portfolio deck.
- C8. Holds on the base: in the same run, 'draws a slide from the text an editor holds, ...' and 'narrows every group of project decks to the kept projects, ...' passed.
- C9. On the base: `grep -rn "deckProjects\|createReader(\|hubDomainsOf" src tests` printed 18 lines, among them `src/lib/server/content/deck/read.ts:28` and `:129` (`hubDomainsOf`), `src/lib/data/sources/documents/decks.ts:37` and `:82` (`deckProjects`), `tests/checks/config/integrity.test.ts:22`, `:88`, `:108`, `:111`, `:336`.
- C10. On the base the build's findings on the planted manifests held the deck domain finding for `crossd`, `stray`, `twind` and `labp` (the C2, C3, C4 and C17 lines above), and the schema check's findings for `stray` and `empty`.
- C11. On the base the snapshot's `deck` and `deckTags` per project printed as the 14 rows the final table pins in `DECKS` (`AssertionError: the build's decks record: expected [ [ 'hub:crossd', <ellipsis>(2) ], <ellipsis>(13) ] to deeply equal []`, the first form pinning nothing).
- C12. Holds on the base for the slide: the portfolio row's `['kit/main.md#0', 'kit', 'hub:graphs']` and the row "the deck of a repository project of the primary hub" printed no failure.
- C13. Read on the base: `src/lib/server/root/watch/build.ts:146-165` hands `withDecks` the primary and `read.others` alone, and the folders of a workspace with no primary go to `readFolders` with no deck read; the route reads such a deck under the folder's name (`server/content/deck/read.ts:114-117` on the base, `hub = source.primary ?? { key: held.key, dir: held.dir }`).
- C14. Read on the base: `readOtherHub` sets `portfolioDeck: null` (`data/index.ts:616`), and `readDecks` reads the project decks (`projectDecks()`) and the portfolio deck alone; a talk deck is read only by the route.
- C15. On the base: `failedp` (no `domain:`) raised nothing; `empty` (`domain: ""`) raised `+   "hub/projects/manuscripts/empty/project.yml:5 domain is , which is not a key of domains",`, the schema check's, and no deck finding. Neither read gave a slide domain.
- C16. Holds on the base: the four `deck-slides.test.ts` and the six `deck-acts.test.ts` cases passed in the run of C7.
- C17. Fails on the base: `AssertionError: a deck in a second hub's root, in that hub's words, naming a domain key only the primary holds: expected [ [ 'main.md#0', 'labp', undefined ] ] to deeply equal [ [ 'main.md#0', 'labp', <ellipsis>(1) ] ]`, `-     "hub:hubonly",` / `+     undefined,`, and `+   "lab/projects/manuscripts/labp/project.yml:undefined project labp names the domain hubonly, which is no key of the domains registry (...)"` on both reads.
- C18. On the base `stray`'s deck finding appeared once in the build's findings (`readDecks`'s reader deduplicated it), beside the schema finding: `expected [ <ellipsis>(5) ] to deeply equal [ <ellipsis>(2) ]` on the portfolio row.
- C19. Holds on the base: `tests/checks/config/integrity.test.ts`, `Tests 7 passed | 7 skipped`, the real-hub cases skipped (`integrity: the cases over a real hub skipped, since OCULUS_TEST_HUB is not set`).
- C20. Not run on the base; the base's diagrams are the committed ones.

The first-run lines above shortened with "(...)" are shortened by me, not verbatim: the rest of each is the domain finding's words, given whole in C2. The `<ellipsis>` marks are vitest's own.

No case is one the brief's rules get wrong. C3 and C15 meet a finding the brief does not name, handed below.

## DONE / NOT DONE

| Item | State | Proof (command, last line of its final run) |
| --- | --- | --- |
| 1. One module | DONE | `src/lib/data/sources/documents/decks.ts` holds `deckProject` and `deckReader`; `grep -rn "deckProjects\|createReader(\|hubDomainsOf" src tests` lists `createReader(` at `src/lib/data/sources/documents/decks.ts:83` and `src/lib/data/sources/deck/read.ts:202` (its definition) and the three reader tests of `tests/data/sources/present.test.ts` (`:175`, `:284`, `:680`) |
| 2. The build reads through it | DONE | `readDecks` (`decks.ts:107`) calls `hubProjects` (`snapshot/hubs/deck-facts.ts`) and `deckReader`; `npx vitest run tests/data/hubs/decks.test.ts tests/routes/docs/deck.test.ts --reporter=dot`: `Tests  5 passed (5)` |
| 3. The route reads through it | DONE | `src/lib/server/content/deck/read.ts` calls `deckReader` and holds no `DeckProject`, `createReader` or `hubDomainsOf` (the C9 grep); `DeckSource` and `readDeck` keep their shape; `npx vitest run tests/data/sources/present.test.ts tests/data/hubs tests/routes/edit/deck-slides.test.ts tests/server/edit/deck/deck-acts.test.ts tests/data/snapshot/normalise.test.ts --reporter=dot`: `Tests  155 passed (155)` |
| 4. Same deck, one domain check | DONE | the table's every row compares the module's deck over the build's input with `readDeck`'s answer whole (`toEqual`), and the build's domain findings; `decks.test.ts` run above, `Tests  5 passed (5)` |
| 5. The tests move | DONE | `tests/data/hubs/decks.test.ts` (renamed by `mv`), its one table of 14 rows; the facts case is gone from `tests/routes/docs/deck.test.ts`; G32's Test line rewritten (`.scratch/migration/agents/guarded.md:278`) |
| 6. The comments | DONE | the list under "Head comments" below; `docs/HELP.md` and `docs/decks.md` each gained one bullet |
| Verify 1 | DONE | `npm run diagrams && npm run docs:palette`, then `npm run test:quick`: `test:quick: 340.3 s; every command passed` |
| Verify 2 | DONE | the two runs above and `npx vitest run tests/checks/config/integrity.test.ts --reporter=dot`: `Tests  7 passed \| 7 skipped (14)` |
| Verify 3, C9 | DONE | grep output in "C9" below |
| Verify 4, ASCII | DONE | the rules file's perl gate over `src tests config` printed nothing (`find: bin: No such file or directory`, the tree has no `bin`); the same check over every touched file printed nothing |
| Verify 5, sizes | DONE | `wc -l` below; the largest source file is `src/lib/data/index.ts` at 829 |
| Verify 6, unused exports | DONE | `diff .agents/worktrees/O156-base/unused-exports.txt <(sh utils/unused-exports.sh)` printed nothing, exit 0 |
| Verify 7, folders | DONE | `sh utils/folder-check.sh` printed nothing, exit 0; `ls tests/data/hubs \| wc -l` prints `9` |
| Verify 8, history words | DONE | one hit, judged below |
| Verify 9, prose | DONE | read; see "Prose" below |

The verify list (`npm run test:quick`) ran once to the end. One earlier run of it was stopped by me before it finished, to change `readDecks`'s domain loop (each manifest checked on its own file); its output was not used. No whole-suite command was run on purpose; one command did more than meant: a probe `npx vitest run --dir <scratchpad>/caserun --project unit`, meant to run one file from the scratchpad, ran for about 7 minutes with its output unseen before I stopped it, and it may have run test files of the tree beyond the probe. Its result was not used, and the probe folder is deleted.

### C9

```
src/lib/data/sources/documents/decks.ts:83:    return createReader({
src/lib/data/sources/deck/read.ts:202:export function createReader(context: DeckContext): DeckReader {
src/lib/data/index.ts:666:function hubDomainsOf(hub: string, config: PortfolioConfig): HubVocab['domains'] {
src/lib/data/index.ts:694: * The words one hub gives its own records, read from its own files: its domains (`hubDomainsOf`)
src/lib/data/index.ts:709:        domains: hubDomainsOf(hub, config),
tests/data/sources/present.test.ts:175:        const reader = createReader({
tests/data/sources/present.test.ts:284:            createReader({
tests/data/sources/present.test.ts:680:            const deck = createReader(context).read({ key: 'hub', dir }, one.path);
```

Each hit: the module's one call; the definition; `hubDomainsOf`'s definition, now local to `data/index.ts`, its doc comment, and its one use in `hubVocabOf`; the three reader tests.

### Unused exports

The comparison printed nothing. During the work it printed `src/lib/data/sources/documents/decks.ts: DeckHub`; `DeckHub` was made local. `DeckInput` (decks.ts) and `HubProjects` (deck-facts.ts) are local too. `hubDomainsOf` lost its last importer outside `data/index.ts` and is local.

### Sizes (`wc -l`, after the last change)

| File | Lines |
| --- | --- |
| `src/lib/data/sources/documents/decks.ts` | 138 |
| `src/lib/data/sources/deck/read.ts` | 830 |
| `src/lib/data/sources/deck/kinds.ts` | 393 |
| `src/lib/data/snapshot/hubs/deck-facts.ts` | 127 |
| `src/lib/data/shapes/project-facts.ts` | 180 |
| `src/lib/data/snapshot/normalise.ts` | 719 |
| `src/lib/data/index.ts` | 829 |
| `src/lib/server/content/deck/read.ts` | 106 |
| `config/text/findings.yml` | 506 |
| `tests/data/hubs/decks.test.ts` | 361 |
| `tests/routes/docs/deck.test.ts` | 198 |
| `tests/data/sources/present.test.ts` | 749 |
| `tests/fixtures/hubs/deck-hub.ts` | 339 |
| `tests/checks/config/integrity.test.ts` | 336 |
| `docs/HELP.md` | 642 |
| `docs/decks.md` | 431 |
| `.scratch/migration/agents/guarded.md` | 447 |

### History words

The grep of the rules file over the added comment lines and test titles printed one line: `+/** One hub of the workspace as the build reads it before its decks. */` (`tests/fixtures/hubs/deck-hub.ts`). It names the order of the build's steps (`readHubBeforeDecks`), no earlier state of the code; kept.

## Files

From `diff -rq` of `src`, `tests`, `config`, `utils` against the base copy and `git status --short` for the rest. Every path is in the write list except where marked.

- `src/lib/data/sources/documents/decks.ts`: the one module (`deckProject`, `deckReader`, `readDecks`).
- `src/lib/data/sources/deck/read.ts`: `DeckContext.domains` and the reader's domain check removed, `projectOf` returns the project.
- `src/lib/data/sources/deck/kinds.ts`: `DeckProject.domain`'s comment.
- `src/lib/data/snapshot/hubs/deck-facts.ts`: `hubFacts` became `hubProjects`, giving the projects, the words and the domain holders.
- `src/lib/data/shapes/project-facts.ts`: head comment.
- `src/lib/data/snapshot/normalise.ts`: comments of `manifestProject` and `factRecords`.
- `src/lib/data/index.ts`: comments of `decked`, `withDecks`, `hubDomainsOf`; `hubDomainsOf` made local.
- `src/lib/server/content/deck/read.ts`: reads through `deckReader`; head comment.
- `config/text/findings.yml`: line 123.
- `tests/data/hubs/decks.test.ts`: from `deck-facts.test.ts` by `mv`; the table.
- `tests/routes/docs/deck.test.ts`: the facts case removed, head comment.
- `tests/data/sources/present.test.ts`: three `domains:` inputs removed.
- `tests/fixtures/hubs/deck-hub.ts`: the plants and `built`.
- `tests/checks/config/integrity.test.ts`: reads its decks through `deckReader`.
- `docs/diagrams/writes.dot`, `docs/diagrams/writes.svg`: by `npm run diagrams`.
- `docs/diagrams/layers.dot`, `docs/diagrams/layers.svg`, `docs/diagrams/layer-server.dot`, `docs/diagrams/layer-server.svg`: outside the write list; `npm run diagrams` redrew them, the count of `server` imports of `data` falling (`label="647"` to `label="643"`, `label="62"` to `label="58"`) since `server/content/deck/read.ts` imports four modules of `data/` where it imported eight (`grep -n "data/"` over it and over the base copy's).
- `docs/HELP.md`, `docs/decks.md`: outside the write list; one bullet each on how a project's domain is found, as `spec.md:72` asks a step that changes what a user sees to write.
- `.scratch/migration/agents/guarded.md`: line 278 (G32's Test line).
- `.scratch/migration/agents/reviews/O156-report.md`: this report.

## Host- and user-visible changes, for the look

Put a workspace in this state: a primary hub and a second hub, the second's domains registry holding a key the primary's lacks (`labonly`), a project of the primary with `domain: labonly` and a deck with a `kind: project` slide; a second project naming `domain: nowhere`, which no hub holds, with a deck; both decks members of a group of the primary's portfolio deck that has `legend:` on its title slide, a `{ kind: summary }` and a `{ kind: grid }`.

- C2, Present view. Open the first project's deck, then the portfolio deck. Before: the project slide's domain chip absent and its frame in the neutral tone; the legend lacking that domain; the summary row and the grid card with no domain. After: the second hub's domain (its title "Lab only" and its colour) on the slide, in the legend, on the summary row and on the grid card.
- C2, Findings view. Before: a finding on the first project's `project.yml`, "project crossd names the domain labonly, which is no key of the domains registry (...)". After: none.
- C3, Present view: the second project's slide is in the neutral tone before and after. Findings view: before, "project stray names the domain nowhere, which is no key of the domains registry (the file the domains entry of the hub's collections list names); its slides are drawn in the neutral tone"; after, once, "project stray names the domain nowhere, which no hub's domains registry holds (the file the domains entry of each hub's collections list names); its slides are drawn in the neutral tone". The schema check's "domain is nowhere, which is not a key of domains" is there before and after.
- C10, Findings view of the running hub: the same deck findings before and after, less the domain findings of keys another hub holds (C2, C17) or two other hubs hold (C4, whose merge finding stays), and with the new words for a key no hub holds.
- A project of the second hub naming a key only the primary holds (C17): its slide draws the primary's domain, where it drew none.
- The deck route's answer carries no domain finding; the page draws none of the route's findings, so nothing on screen changes for that.

## Edits to existing assertions

From `diff` of each changed test file against the base copy:

- `tests/data/sources/present.test.ts`: no assertion changed; three inputs removed: `<             domains: ['heart'],` (line 181), `<                 domains: ['heart', 'brain'],` (292), `<             domains: [],` (516).
- `tests/checks/config/integrity.test.ts`: no `expect` line changed (`diff ... | grep "^[<>].*expect"` printed nothing). The helpers changed: `deckProjects` and the `createReader` calls gave way to `deckReader`, and `builder` merges the one hub's snapshot (`mergeHubs`) so the projects are in the merged shape, which changes the `project.id` used as an assertion label to `hub:<key>`.
- `tests/routes/docs/deck.test.ts`: the case "answers each project's facts in the words of the hub its deck is read under, and each slide's domain" removed (its four `expect` lines); its rows are rows of the new table, the facts of `hccnet`, `kit` and `labp` gaining the domain facts the fixture's new plants give (`kit` names `graphs`, `labp` names `hubonly`).
- `tests/data/hubs/deck-facts.test.ts` to `tests/data/hubs/decks.test.ts`: the old case's assertions (the placeholder findings of the route and of the build per deck, and the first slide's title) are columns of the table, with the same expected lines for `hccnet`, `quantum`, `ghost`, `empty` and `crossp`.

The new table's failing lines on the unchanged tree are those of "The cases' first run".

## Head comments, doc comments and docs

- `src/lib/data/sources/documents/decks.ts` head and every doc comment: rewritten.
- `src/lib/data/snapshot/hubs/deck-facts.ts` head (`:1-15`) and `hubProjects`'s doc comment: rewritten.
- `src/lib/data/shapes/project-facts.ts` head (`:1-8`): rewritten.
- `src/lib/data/sources/deck/kinds.ts` `DeckProject.domain` (`:51-55`): rewritten; the other field comments still true.
- `src/lib/data/sources/deck/read.ts` head (`:1-39`): still true (it names no domain check); `DeckContext` and `projectOf` comments rewritten.
- `src/lib/data/snapshot/normalise.ts` `manifestProject` (`:261-265`) and `factRecords` (`:635-638`): rewritten.
- `src/lib/data/index.ts` head (`:1-10`): still true; `decked` (`:306-309`), `withDecks` (`:371-374`), `hubDomainsOf` (`:661-664`): rewritten.
- `src/lib/server/content/deck/read.ts` head: the paragraph of the facts rewritten into one on the module; the drafts, narrowing and roots paragraphs still true; `DeckSource` and `readDeck` doc comments still true.
- `src/lib/server/root/watch/build.ts` `buildHubs` doc comment: still true.
- `tests/fixtures/hubs/deck-hub.ts`, `tests/data/hubs/decks.test.ts`, `tests/routes/docs/deck.test.ts`, `tests/checks/config/integrity.test.ts` heads: rewritten where they name the readers or the plants.
- `docs/decks.md` "The project facts strip": one bullet added. `docs/HELP.md` Present: one bullet added. `docs/apps.md:402` (the `Project` fields): still true, no field added. `README.md`: names neither read.

## Decisions the orchestrator may reverse

1. The reader's own domain check and `DeckContext.domains` are removed (`deck/read.ts`), since item 4 places the check in the module and the reader's projects carry a resolved domain or none; item 1's "the reader's domains" is then no input of the reader.
2. The module raises the domain finding itself, with the words, file and key the reader raised it with (`{ file: <manifest>, key: 'domain', message }`, no line), after the reader's findings; it checks each manifest whose project has a deck the build read, on that manifest's own file.
3. `deckReader` takes the portfolio's projects in the merged shape and keeps the hub's itself (`ofHub`), so the route passes `source.projects` as it is and the build passes the projects `hubProjects` makes with `root` set to the hub.
4. `hubProjects` takes `Pick<PortfolioConfig, 'merged' | 'text'>` and returns the domain holders beside the projects and the words; its projects keep `relatedIds` empty and `waitingOn` as the manifest writes it, since no deck reads them, and its comment says so.
5. The table checks each row's build findings keyed `domain` on the manifests of the deck's projects, which takes in the manifest schema check's finding as well as the deck and merge findings; it pins what the Findings view lists for those manifests.
6. The fixture gains a third hub `far` holding only a domains file, rather than a third copy of the demo hub.
7. `tests/checks/config/integrity.test.ts` merges its one hub's snapshot with `mergeHubs` to hand the module projects in the merged shape, and reads with no records for facts (as the base read with no facts).

## Anything in the brief that was wrong or impossible

- C3 says "one `domain_unknown` finding on its manifest in the build's findings", and C15 "no domain and no finding on either read". Both hold for the deck reads. The build's findings carry one more finding on such a manifest, the manifest schema check's, before and after the step: "domain is nowhere, which is not a key of domains" for `stray` and "domain is , which is not a key of domains" for `empty`'s `domain: ""`, at the manifest's line 5 (the first run, C3 and C15). So a key no hub holds shows two findings in the Findings view, and an empty `domain:` one. The step leaves that check as it is; the table pins both.
- The brief's "What is on the tree" puts the reader's domain check at `deck/read.ts:279-293`; it was there (`projectOf`), and is removed.

## Limitations and sharp edges

- `docs/HELP.md` and `docs/decks.md` gained text outside the write list (named above).
- `readDecks` checks a manifest's domain when a deck of its id was read; in a hub where two manifests share an id and one has a deck, the other is checked too.
- The equality rows compare the two reads of the decks both read; the decks only the route reads (C13, C14) are covered by reading and by the route's own tests.
- The case that only a page shows (the domain's colour and title on a slide, the Findings view's list) is for the look on landing, as written above.
- The fixture's `buildReaders` repeats the two calls `readDecks` makes (`hubProjects`, then `deckReader`), so a change to `readDecks`'s composition is not followed by the fixture by itself.
- No script was used to edit a file; every edit was made with Edit and Write, and the rename with `mv`.
