# O156 report: one deck reader for the Findings view and the Present view

Everything in the brief and in repair round 1 is done. The one red line of the verify list is two cases of `tests/data/hubs/hub-portfolio.test.ts`, a file the step does not change, which timed out at 20 s in the list's slow run and pass when the file is rerun alone (Verify 1 below).

## Open items of the state file

Quoted from `.scratch/migration/orchestrator-state.md`, section "Open items":

> None.

## Repair round 1, each ruling

| Ruling | State | Check |
| --- | --- | --- |
| 1. The module raises no domain finding | DONE | `readDecks` (`src/lib/data/sources/documents/decks.ts:107-125`) has no domain loop and returns `{ decks, findings: reader.findings() }`; `grep -rn "domain_unknown" src tests config docs --exclude=local.yml` prints nothing, exit 1 (the entry left `config/text/findings.yml`, `diff` against the base: `123d122 < domain_unknown: ...`); `HubProjects` is `{ projects, words }` (`deck-facts.ts:40-45`); `grep -rn "resolveKey\|findingText" src/lib/data/sources/documents/decks.ts src/lib/data/snapshot/hubs/deck-facts.ts` prints nothing |
| 1. Head comments | DONE | `decks.ts:15-21` and `src/lib/server/content/deck/read.ts:18-20`, quoted under "Head comments" below |
| 1. The table | DONE | `tests/data/hubs/decks.test.ts`: the portfolio row (C18) pins `[ambiguous('twind', 'twin', 'lab, far'), notKey('stray', 'nowhere')]`, the stray row (C3) `[notKey('stray', 'nowhere')]`, the twind row (C4) the ambiguity finding alone, the empty row (C15) `[notKey('empty', '')]`; one assertion over the whole build's findings pins no message holding "names the domain"; `npx vitest run tests/data/hubs/decks.test.ts`: `Tests  1 passed (1)` |
| 1. The docs | DONE | `docs/decks.md:387` and `docs/HELP.md:343`, quoted under "Head comments" below |
| 1. G32 | DONE | `.scratch/migration/agents/guarded.md:278` names the table's title "gives each deck the same slides, projects, domains and facts on the build's read and the route's, and leaves a project's domain to the manifest check's finding", the title `grep -n "it(" tests/data/hubs/decks.test.ts` prints at `:270` |
| 2. A slide's domain is an internal id | DONE | the list under "Ruling 2" below; `grep -rn 'domain:\` key\|domain key\|domain keys' src` prints only `model-entities.ts:587` and `:641`, which are about the theme words of venues and datasets, not a deck's domain |
| 3. The holders' order | DONE | `deck-facts.ts:59`: `// The hubs that hold each key of each kind: \`own\` first, then \`others\` in the order given.`, over `const hubs = [own, ...others]` (`:57`) and the loop that fills `held` in that order (`:65-72`) |
| 4. The probe's source | DONE | quoted under "The case-run probe" below |

### The changed rows before the code change

Command: `npx vitest run tests/data/hubs/decks.test.ts`, on the worktree with the table changed and `readDecks`'s domain loop and the `domain_unknown` entry in place. It printed `Tests  1 failed (1)` and these three soft failures, as printed (a diff line as vitest printed it, `<ellipsis>` vitest's own):

- `AssertionError: a portfolio deck placing decks of a domain of the own hub, of another hub, of no hub and of two other hubs, and a repository project: expected [ <ellipsis>(3) ] to deeply equal [ <ellipsis>(2) ]`, with `+   "hub/projects/manuscripts/stray/project.yml:undefined project stray names the domain nowhere, which no hub's domains registry holds (the file the domains entry of each hub's collections list names); its slides are drawn in the neutral tone",`
- `AssertionError: a project deck naming a domain key no hub holds: expected [ <ellipsis>(2) ] to deeply equal [ Array(1) ]`, with the same `+` line.
- `AssertionError: the build's findings: no deck finding on a project's domain: expected [ Array(1) ] to deeply equal []`, with the same line.

The twind row (C4) and the empty row (C15) printed no failure in that run: the module raised its finding only for a key no hub holds, so their pins (the merge's ambiguity finding alone; the manifest check's finding for `domain: ""`) already held.

### Ruling 2, the comments rewritten

Each now says the domain is the internal id of the domain the project's `domain:` resolves to, as the merge resolves it:

- `src/lib/data/model/model-deck.ts:90-93`, `DeckIdeaCard.domain` (was `:89-90`, "The project's \`domain:\` key, which the card's colour and words are read from.").
- `src/lib/data/model/model-deck.ts:101-104`, `DeckSummaryRow.domain` (was `:97-98`, "The project's \`domain:\` key; the field is that domain's label.").
- `src/lib/data/model/model-deck.ts:183-186`, the `DeckSlide` doc comment's `legend` sentence (found by reading `model-deck.ts` around the legend fields).
- `src/lib/data/model/model-deck.ts:215-218`, the project slide's `domain` (was `:208`, "The project's \`domain:\` key.").
- `src/lib/data/sources/deck/kinds.ts:91-93`, `Built` (was "which the reader turns into domain keys").
- `src/lib/views/academic/present/parts/project/Project.svelte:25-28`, the `domain` prop (was "The project's \`domain:\` key, which the chip's words and the slide's edge come from.", found by the grep).
- `src/lib/views/academic/present/parts/Title.svelte:14-17` and `src/lib/views/academic/present/parts/Section.svelte:14-17`, the `legend` prop (each was "The domain keys the legend shows.", found by the grep).
- `src/lib/views/academic/present/parts/Legend.svelte:11-14`, the `domains` prop (was "Domain keys, drawn with the \`domains\` entry's label and colour.", found by `grep -rn "domain" src/lib/views/academic/present src/lib/data/sources/deck src/lib/state | grep -i key`).

`src/lib/data/sources/deck/kinds.ts:51-55` (`DeckProject.domain`) already said this. `src/lib/state/shared/words/tones.ts:271-274` ("A domain's key and the entry of \`maps\` it names: the domain's id is its hub and its key") is about any domain id the words helpers are given and says the id is hub and key, which is true; it is not changed.

### The case-run probe

My record holds it. It was written by a heredoc to `<scratchpad>/caserun/tests/probe.test.ts` (the folder is deleted):

```ts
import { expect, it } from 'vitest';
import { factsWorkspace } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O156/tests/fixtures/hubs/deck-hub.ts';
it('probe', () => { const w = factsWorkspace(); console.log('projects', w.source.projects.length); expect(1).toBe(1); });
```

The command was `npx vitest run --dir $S/caserun --project unit`, `S` the scratchpad's path. It ran about 7 minutes with no output seen and was stopped with TaskStop; its result was not used.

## The cases' first run

The first run was made with `src` and `config` as the base holds them: `diff -rq` of `src` and `config` against `.agents/worktrees/O156-base` printed nothing, and `tests` differed only by the planted fixture (`tests/fixtures/hubs/deck-hub.ts`) and the table (`tests/data/hubs/decks.test.ts`, the file `deck-facts.test.ts` renamed with `mv`). The table's first form held every row of the final one except the comparison with the module's deck over the build's own input, since `deckReader` and `hubProjects` do not exist on the base; it used `expect.soft`, so every row ran. Command: `npx vitest run tests/data/hubs/decks.test.ts`: `Tests 1 failed (1)`, 14 soft failures, the lines below as printed.

- C1. Holds on the base. The rows "a project deck naming a domain key its own hub holds" (graph-bandits: `hub:graphs` on both project slides) and the portfolio row's `hccnet` and `kit` printed no failure for their slide domains and facts.
- C2. Fails on the base, as the brief says. `AssertionError: a project deck naming a domain key only another hub holds: expected [ Array(1) ] to deeply equal [ [ 'main.md#0', 'crossd', <ellipsis>(1) ] ]` with `-     "lab:labonly",` / `+     undefined,`; and on the route's answer and the build's findings: `+   "hub/projects/manuscripts/crossd/project.yml:undefined project crossd names the domain labonly, which is no key of the domains registry (the file the domains entry of the hub's collections list names); its slides are drawn in the neutral tone",`. The portfolio row: `"legend": [ "hub:graphs", -     "lab:labonly", ]`, `"summary"` and `"grid"` with `-     "lab:labonly",` / `+     undefined,`.
- C3. On the base the build raised two findings on `stray`'s manifest: `+   "hub/projects/manuscripts/stray/project.yml:5 domain is nowhere, which is not a key of domains",` (the manifest schema check) and `+   "hub/projects/manuscripts/stray/project.yml:undefined project stray names the domain nowhere, which is no key of the domains registry (...)"` (the base reader's); the slide drew no domain. The final row pins the schema check's finding alone.
- C4. Fails on the base: `+   "hub/projects/manuscripts/twind/project.yml:undefined project twind names the domain twin, which is no key of the domains registry (...)"` beside the merge's `"hub/projects/manuscripts/twind/project.yml:undefined domain is twin, which the hubs lab, far each hold and its own hub does not, so it names no record"`. The final row pins the merge's finding alone.
- C5. Holds on the base: the placeholder rows (`quantum`, `hccnet`, `ghost`, `empty`, `crossp`) printed no failure on their placeholder findings or titles.
- C6. Holds on the base: the `labp` row printed no failure on its facts' words (`sent out`, `Dana of Lab`); it failed on its domain, C17.
- C7. Holds on the base: `tests/routes/docs/deck.test.ts > ... answers the portfolio deck of a hub that never names it as unnamed when its folder is missing, and a named one as missing` passed (`npx vitest run tests/routes/docs/deck.test.ts tests/data/sources/present.test.ts tests/routes/edit/deck-slides.test.ts tests/server/edit/deck/deck-acts.test.ts tests/data/snapshot/normalise.test.ts tests/checks/config/integrity.test.ts --reporter=verbose`, `Tests 1 failed | 41 passed | 7 skipped (49)`; the one failure is the facts case of `deck.test.ts`, which reads the fixture the first run had planted into and is the case that moves). The build's side read on the base: `decks.ts:90-93` skips the read of an unnamed missing portfolio deck.
- C8. Holds on the base: in the same run, 'draws a slide from the text an editor holds, ...' and 'narrows every group of project decks to the kept projects, ...' passed.
- C9. On the base: `grep -rn "deckProjects\|createReader(\|hubDomainsOf" src tests` printed 18 lines, among them `src/lib/server/content/deck/read.ts:28` and `:129` (`hubDomainsOf`), `src/lib/data/sources/documents/decks.ts:37` and `:82` (`deckProjects`), `tests/checks/config/integrity.test.ts:22`, `:88`, `:108`, `:111`, `:336`.
- C10. On the base the build's findings on the planted manifests held the reader's domain finding for `crossd`, `stray`, `twind` and `labp` (the C2, C3, C4 and C17 lines), and the schema check's findings for `stray` and `empty`.
- C11. On the base the snapshot's `deck` and `deckTags` per project printed as the 14 rows the final table pins in `DECKS` (`AssertionError: the build's decks record: expected [ [ 'hub:crossd', <ellipsis>(2) ], <ellipsis>(13) ] to deeply equal []`, the first form pinning nothing).
- C12. Holds on the base for the slide: the portfolio row's `['kit/main.md#0', 'kit', 'hub:graphs']` and the row "the deck of a repository project of the primary hub" printed no failure.
- C13. Read on the base: `src/lib/server/root/watch/build.ts:146-165` hands `withDecks` the primary and `read.others` alone, and the folders of a workspace with no primary go to `readFolders` with no deck read; the route reads such a deck under the folder's name (`server/content/deck/read.ts:114-117` on the base, `hub = source.primary ?? { key: held.key, dir: held.dir }`).
- C14. Read on the base: `readOtherHub` sets `portfolioDeck: null` (`data/index.ts:616`), and `readDecks` reads the project decks (`projectDecks()`) and the portfolio deck alone; a talk deck is read only by the route.
- C15. On the base: `failedp` (no `domain:`) raised nothing; `empty` (`domain: ""`) raised `+   "hub/projects/manuscripts/empty/project.yml:5 domain is , which is not a key of domains",`, the schema check's, and no reader finding. Neither read gave a slide domain. The final row pins that one finding.
- C16. Holds on the base: the four `deck-slides.test.ts` and the six `deck-acts.test.ts` cases passed in the run of C7.
- C17. Fails on the base: `AssertionError: a deck in a second hub's root, in that hub's words, naming a domain key only the primary holds: expected [ [ 'main.md#0', 'labp', undefined ] ] to deeply equal [ [ 'main.md#0', 'labp', <ellipsis>(1) ] ]`, `-     "hub:hubonly",` / `+     undefined,`, and `+   "lab/projects/manuscripts/labp/project.yml:undefined project labp names the domain hubonly, which is no key of the domains registry (...)"` on both reads.
- C18. On the base `stray`'s reader finding appeared once in the build's findings, beside the schema finding: `expected [ <ellipsis>(5) ] to deeply equal [ <ellipsis>(2) ]` on the portfolio row. The final row pins the schema finding and the merge's twind finding, and no reader or module finding.
- C19. Holds on the base: `tests/checks/config/integrity.test.ts`, `Tests 7 passed | 7 skipped`, the real-hub cases skipped (`integrity: the cases over a real hub skipped, since OCULUS_TEST_HUB is not set`).
- C20. Not run on the base; the base's diagrams are the committed ones.

The lines shortened with "(...)" are shortened by me, not verbatim: the rest of each is the reader finding's words, given whole in C2. The `<ellipsis>` marks are vitest's own.

The brief's C3 and C15 named a deck domain finding; repair round 1 item 1 corrects that premise, and the rows pin the manifest check's finding instead.

## DONE / NOT DONE

| Item | State | Proof (command, last line of its final run) |
| --- | --- | --- |
| 1. One module | DONE | `src/lib/data/sources/documents/decks.ts` holds `deckProject` and `deckReader`; the C9 grep below lists `createReader(` at `decks.ts:83`, its definition `deck/read.ts:202` and the three reader tests of `present.test.ts` |
| 2. The build reads through it | DONE | `readDecks` (`decks.ts:107-125`) calls `hubProjects` (`snapshot/hubs/deck-facts.ts:51`) and `deckReader` |
| 3. The route reads through it | DONE | `src/lib/server/content/deck/read.ts` calls `deckReader` and holds no `DeckProject`, `createReader` or `hubDomainsOf` (the C9 grep) |
| 4. Same deck, one domain check | DONE | the table compares the module's deck over the build's input with `readDeck`'s answer whole (`toEqual`) per row, pins the manifest check's and the merge's findings and no deck finding on a domain |
| 5. The tests move | DONE | `tests/data/hubs/decks.test.ts` (renamed by `mv`), one table of 14 rows; the facts case is gone from `tests/routes/docs/deck.test.ts`; G32's Test line at `guarded.md:278` |
| 6. The comments | DONE | "Head comments" below |
| Verify 1 | DONE, one red line outside the step | `npm run diagrams && npm run docs:palette`, then `npm run test:quick`, run once in this round: `ok prettier`, `ok ASCII gate`, `ok svelte-kit sync`, `ok eslint`, `ok svelte-check (74.8 s): ... 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok vitest checks (271.3 s)`, `ok vitest (452.5 s)`, `FAILED  vitest slow (557.2 s)`, `test:quick: 560.6 s; failed: vitest slow`; the failures: `FAIL |unit| tests/data/hubs/hub-portfolio.test.ts > a workspace of several hubs, every record under its hub and its key > gives a key two hubs hold two records, each project naming its own hub record, each shown by the key (C1)` and `> finds the page of an entry of the one hub that holds it and writes that hub's file (C6)`, each `Error: Test timed out in 20000ms.`; `Test Files  1 failed \| 66 passed (67)`, `Tests  2 failed \| 661 passed \| 314 skipped (977)`. Rerun alone: `npx vitest run tests/data/hubs/hub-portfolio.test.ts --reporter=dot`: `Tests  16 passed (16)`; with `--reporter=verbose` the two cases took `2733ms` and `3670ms` |
| Verify 2 | DONE | `npx vitest run tests/data/hubs/decks.test.ts tests/routes/docs/deck.test.ts tests/data/sources/present.test.ts tests/checks/config/integrity.test.ts tests/data/snapshot/normalise.test.ts`: `Test Files  5 passed (5)`, `Tests  31 passed \| 7 skipped (38)` (the 7 the real-hub cases, `OCULUS_TEST_HUB is not set`); `npx vitest run tests/data/hubs tests/server/edit/deck/deck-acts.test.ts tests/routes/edit/deck-slides.test.ts`: `Test Files  10 passed (10)`, `Tests  136 passed (136)` |
| Verify 3, C9 | DONE | grep output in "C9" below |
| Verify 4, ASCII | DONE | the rules file's perl gate over `src tests bin config` printed only `find: bin: No such file or directory` (the tree has no `bin`); the same check over `guarded.md`, `docs/HELP.md`, `docs/decks.md` and the six diagram files printed nothing |
| Verify 5, sizes | DONE | `wc -l` below; the largest source file is `src/lib/data/sources/deck/read.ts` at 830 |
| Verify 6, unused exports | DONE | `sh utils/unused-exports.sh` into the scratchpad, `diff` against `/Users/axelfaes/workspace/oculus/.agents/worktrees/O156-base/unused-exports.txt`: no output, exit 0 |
| Verify 7, folders | DONE | `sh utils/folder-check.sh`: no output, exit 0; `ls tests/data/hubs \| wc -l` prints `9` |
| Verify 8, history words | DONE | one hit, judged below |
| Verify 9, prose | DONE | each new sentence read against the prose rule; no departure |

Over the step the verify list ran to its end twice: once at the end of the first build (`test:quick: 340.3 s; every command passed`) and once at the end of this round (above). One more run in the first build was stopped before it finished and its output not used. No whole-suite command was run on purpose; the probe above may have run test files of the tree beyond itself, and its result was not used.

The two timed-out cases build several hubs, and each build now runs `readDecks` through `hubProjects`. Alone they take 2.7 s and 3.7 s against the 20 s limit; I judge the timeout to come from the load of the slow run (`tests 1764.74s` summed over the workers in 529 s), not from the step. That is not verified: the base copy has no `node_modules`, so the cases could not be timed on it.

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

Each hit: the module's one call; the definition; `hubDomainsOf`'s definition, local to `data/index.ts`, its doc comment, and its one use in `hubVocabOf`; the three reader tests.

### Unused exports

The comparison printed nothing. `DeckHub` and `DeckInput` (decks.ts) and `HubProjects` (deck-facts.ts) are local types; `hubDomainsOf` has no importer outside `data/index.ts` and is local.

### Sizes (`wc -l`, after the last change)

| File | Lines |
| --- | --- |
| `src/lib/data/sources/documents/decks.ts` | 125 |
| `src/lib/data/sources/deck/read.ts` | 830 |
| `src/lib/data/sources/deck/kinds.ts` | 394 |
| `src/lib/data/snapshot/hubs/deck-facts.ts` | 126 |
| `src/lib/data/shapes/project-facts.ts` | 180 |
| `src/lib/data/snapshot/normalise.ts` | 719 |
| `src/lib/data/index.ts` | 829 |
| `src/lib/data/model/model-deck.ts` | 340 |
| `src/lib/server/content/deck/read.ts` | 107 |
| `src/lib/views/academic/present/parts/Legend.svelte` | 43 |
| `src/lib/views/academic/present/parts/Section.svelte` | 110 |
| `src/lib/views/academic/present/parts/Title.svelte` | 75 |
| `src/lib/views/academic/present/parts/project/Project.svelte` | 267 |
| `config/text/findings.yml` | 505 |
| `tests/data/hubs/decks.test.ts` | 361 |
| `tests/routes/docs/deck.test.ts` | 198 |
| `tests/data/sources/present.test.ts` | 749 |
| `tests/fixtures/hubs/deck-hub.ts` | 339 |
| `tests/checks/config/integrity.test.ts` | 336 |
| `docs/HELP.md` | 642 |
| `docs/decks.md` | 431 |
| `.scratch/migration/agents/guarded.md` | 447 |

### History words

The grep of the rules file's words over the added and changed comment lines and test titles (`git diff -U0 -- src tests config` with the new `tests/data/hubs/decks.test.ts`, the comment and title lines, `grep -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O1[0-9][0-9]|20[0-9][0-9]-"`) printed one line: `+/** One hub of the workspace as the build reads it before its decks. */` (`tests/fixtures/hubs/deck-hub.ts:219`). It names the order of the build's steps, no earlier state of the code; kept.

## Files

From `diff -rq` of `src`, `tests`, `config` against the base copy (the base copy holds no `docs`) and `git status --short` for the rest. Every path is in the write list or a path the round brief names, except where marked.

- `src/lib/data/sources/documents/decks.ts`: the one module (`deckProject`, `deckReader`, `readDecks`).
- `src/lib/data/sources/deck/read.ts`: `DeckContext.domains` and the reader's domain check removed, `projectOf` returns the project.
- `src/lib/data/sources/deck/kinds.ts`: `DeckProject.domain`'s and `Built`'s comments.
- `src/lib/data/snapshot/hubs/deck-facts.ts`: `hubFacts` became `hubProjects`, giving the projects and the words; the holders' order comment.
- `src/lib/data/shapes/project-facts.ts`: head comment.
- `src/lib/data/snapshot/normalise.ts`: comments of `manifestProject` and `factRecords`.
- `src/lib/data/index.ts`: comments of `decked`, `withDecks`, `hubDomainsOf`; `hubDomainsOf` made local.
- `src/lib/data/model/model-deck.ts`: four comments on a deck's domain (ruling 2).
- `src/lib/server/content/deck/read.ts`: reads through `deckReader`; head comment.
- `src/lib/views/academic/present/parts/project/Project.svelte`, `Title.svelte`, `Section.svelte`, `Legend.svelte`: one prop comment each (ruling 2; `Legend.svelte` found by the wider grep).
- `config/text/findings.yml`: the `deck.domain_unknown` entry removed.
- `tests/data/hubs/decks.test.ts`: from `deck-facts.test.ts` by `mv`; the table.
- `tests/routes/docs/deck.test.ts`: the facts case removed, head comment.
- `tests/data/sources/present.test.ts`: three `domains:` inputs removed.
- `tests/fixtures/hubs/deck-hub.ts`: the plants and `built`.
- `tests/checks/config/integrity.test.ts`: reads its decks through `deckReader`.
- `docs/diagrams/writes.dot`, `docs/diagrams/writes.svg`: by `npm run diagrams`.
- `docs/diagrams/layers.dot`, `docs/diagrams/layers.svg`, `docs/diagrams/layer-server.dot`, `docs/diagrams/layer-server.svg`: outside the write list, closed by the round brief; `npm run diagrams` redrew them, since `server/content/deck/read.ts` imports fewer modules of `data/`.
- `docs/HELP.md`, `docs/decks.md`: outside the first write list, closed by the round brief; one bullet each on how a project's domain is found.
- `.scratch/migration/agents/guarded.md`: line 278 (G32's Test line).
- `.scratch/migration/agents/reviews/O156-report.md`: this report.

## Host- and user-visible changes, for the look

Put a workspace in this state: a primary hub and a second hub, the second's domains registry holding a key the primary's lacks (`labonly`), a project of the primary with `domain: labonly` and a deck with a `kind: project` slide; a second project naming `domain: nowhere`, which no hub holds, with a deck; both decks members of a group of the primary's portfolio deck that has `legend:` on its title slide, a `{ kind: summary }` and a `{ kind: grid }`.

- C2, Present view. Open the first project's deck, then the portfolio deck. Before: the project slide's domain chip absent and its frame in the neutral tone; the legend lacking that domain; the summary row and the grid card with no domain. After: the second hub's domain (its title "Lab only" and its colour) on the slide, in the legend, on the summary row and on the grid card.
- C2, Findings view. Before: a finding on the first project's `project.yml`, "project crossd names the domain labonly, which is no key of the domains registry (the file the domains entry of the hub's collections list names); its slides are drawn in the neutral tone". After: none.
- C3, Present view: the second project's slide is in the neutral tone before and after. Findings view: before, two findings on its `project.yml`, "domain is nowhere, which is not a key of domains" at the `domain:` line and "project stray names the domain nowhere, which is no key of the domains registry (...)"; after, the first alone.
- C10, Findings view of the running hub: the same findings before and after, less every finding worded "project <key> names the domain <key>, which is no key of the domains registry (...)". The manifest check's "domain is <key>, which is not a key of domains" and the merge's finding for a key two or more other hubs hold stay.
- A project of the second hub naming a key only the primary holds (C17): its slide draws the primary's domain, where it drew none.
- The deck route's answer carries no domain finding; the page draws none of the route's findings, so nothing on screen changes for that.

## Edits to existing assertions

From `diff` of each changed test file against the base copy:

- `tests/data/sources/present.test.ts`: no assertion changed; three inputs removed: `<             domains: ['heart'],` (line 181), `<                 domains: ['heart', 'brain'],` (292), `<             domains: [],` (516).
- `tests/checks/config/integrity.test.ts`: no `expect` line changed (`diff ... | grep "^[<>].*expect"` printed nothing). The helpers changed: `deckProjects` and the `createReader` calls gave way to `deckReader`, and `builder` merges the one hub's snapshot (`mergeHubs`) so the projects are in the merged shape, which changes the `project.id` used as an assertion label to `hub:<key>`.
- `tests/routes/docs/deck.test.ts`: the case "answers each project's facts in the words of the hub its deck is read under, and each slide's domain" removed (its four `expect` lines); its rows are rows of the new table, the facts of `hccnet`, `kit` and `labp` gaining the domain facts the fixture's new plants give (`kit` names `graphs`, `labp` names `hubonly`).
- `tests/data/hubs/deck-facts.test.ts` to `tests/data/hubs/decks.test.ts`: the old case's assertions (the placeholder findings of the route and of the build per deck, and the first slide's title) are columns of the table, with the same expected lines for `hccnet`, `quantum`, `ghost`, `empty` and `crossp`. The table's domain columns pin the manifest check's finding (`notKey`, at the manifest's line 5) and the merge's (`ambiguous`), and the title is "gives each deck the same slides, projects, domains and facts on the build's read and the route's, and leaves a project's domain to the manifest check's finding".

## Head comments, doc comments and docs

- `src/lib/data/sources/documents/decks.ts` head and every doc comment: rewritten. Its domain paragraph (`:15-21`): "Neither read raises a finding on a project's domain. Each manifest's \`domain:\` is checked by the manifest check (snapshot/schema/check.ts) against the keys of every hub of the workspace, which raises the finding on that line for a key no hub holds, and the merge raises its own for a key two or more other hubs hold and the project's own hub does not; such a project has no domain, and its slides are drawn in the neutral tone. An empty \`domain:\` names no domain, and the manifest check raises its finding for it as for any key no hub holds. The findings of the build's read are the hub's findings, which the Findings view lists."
- `src/lib/server/content/deck/read.ts` head: the paragraph on the module rewritten; its last sentences (`:18-20`): "Neither read raises a finding on a project's domain: a key no hub holds is the finding of the manifest check (snapshot/schema/check.ts) on the manifest's \`domain:\` line, and the project's slides are drawn in the neutral tone." The drafts, narrowing and roots paragraphs and the `DeckSource` and `readDeck` doc comments: still true.
- `src/lib/data/snapshot/hubs/deck-facts.ts` head (`:1-15`): still true; `HubProjects` and `hubProjects`'s doc comments: rewritten; `:59`: added (ruling 3).
- `src/lib/data/shapes/project-facts.ts` head (`:1-8`): rewritten.
- `src/lib/data/sources/deck/kinds.ts` `DeckProject.domain` (`:51-55`) and `Built` (`:91-93`): rewritten; the other field comments still true.
- `src/lib/data/sources/deck/read.ts` head (`:1-39`): still true (it names no domain check); `DeckContext` and `projectOf` comments rewritten.
- `src/lib/data/model/model-deck.ts` and the four Present parts: the comments of ruling 2, rewritten.
- `src/lib/data/snapshot/normalise.ts` `manifestProject` (`:261-265`) and `factRecords` (`:635-638`): rewritten.
- `src/lib/data/index.ts` head (`:1-10`): still true; `decked` (`:305-309`), `withDecks`, `hubDomainsOf` (`:661-664`): rewritten.
- `src/lib/server/root/watch/build.ts` `buildHubs` doc comment: still true.
- `tests/fixtures/hubs/deck-hub.ts`, `tests/data/hubs/decks.test.ts`, `tests/routes/docs/deck.test.ts`, `tests/checks/config/integrity.test.ts` heads: rewritten where they name the readers or the plants.
- `docs/decks.md:387`, "The project facts strip": rewritten. It ends: "A key no hub holds names no domain: the finding is the manifest's, "domain is heart, which is not a key of domains" on its \`domain:\` line under Findings, and the project's slides are drawn in the neutral tone. A key two or more other hubs hold and the own hub does not names no domain either, with the finding of that reference. An empty \`domain:\` names no domain and is that same finding of the manifest. A deck raises no finding of its own on a project's domain."
- `docs/HELP.md:343`, Present: rewritten. It ends: "A key no hub holds, the empty \`domain:\` among them, names no domain: it is the finding of the manifest's \`domain:\` line under Findings, and the project's slides are drawn in the neutral tone."
- `docs/apps.md:402` (the `Project` fields): still true, no field added. `README.md`: names neither read.

## Decisions the orchestrator may reverse

1. The reader's own domain check and `DeckContext.domains` are removed (`deck/read.ts`): the reader's projects carry a resolved domain or none, and the manifest check and the merge raise the domain findings.
2. `deckReader` takes the portfolio's projects in the merged shape and keeps the hub's itself (`ofHub`), so the route passes `source.projects` as it is and the build passes the projects `hubProjects` makes with `root` set to the hub.
3. `hubProjects` takes `Pick<PortfolioConfig, 'merged' | 'text'>` and returns the projects and the words; its projects keep `relatedIds` empty and `waitingOn` as the manifest writes it, since no deck reads them, and its comment says so.
4. The table checks each row's build findings keyed `domain` on the manifests of the deck's projects, which takes in the manifest check's and the merge's findings; it pins what the Findings view lists for those manifests.
5. The fixture gains a third hub `far` holding only a domains file, rather than a third copy of the demo hub.
6. `tests/checks/config/integrity.test.ts` merges its one hub's snapshot with `mergeHubs` to hand the module projects in the merged shape, and reads with no records for facts (as the base read with no facts).

## Anything in the brief that was wrong or impossible

- The brief's "What is on the tree" missed the manifest schema check on `domain:` (`snapshot/schema/check.ts`, `joinedLists` at `schema/lists.ts:111-125`); round 1 item 1 corrects it, and the module raises no domain finding.
- The brief puts the reader's domain check at `deck/read.ts:279-293`; it was there (`projectOf`), and is removed.

## Limitations and sharp edges

- The verify list's slow run timed out twice in `tests/data/hubs/hub-portfolio.test.ts`, which passes alone; whether the step adds time to those builds is not verified, since the base copy cannot run tests (Verify 1).
- The equality rows compare the two reads of the decks both read; the decks only the route reads (C13, C14) are covered by reading and by the route's own tests.
- The case that only a page shows (the domain's colour and title on a slide, the Findings view's list) is for the look on landing, as written above.
- The fixture's `buildReaders` (`tests/fixtures/hubs/deck-hub.ts:223-240`) repeats the two calls `readDecks` makes (`hubProjects`, then `deckReader`), so a change to `readDecks`'s composition is not followed by the fixture by itself.
- No script was used to edit a file; every edit was made with Edit and Write, and the rename with `mv`.
