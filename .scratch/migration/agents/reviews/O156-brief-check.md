# Brief check, O156 (main at ce1bbd711, read only)

## Names

1. **Both write-list folders are full.** `git ls-files src/lib/data/sources/deck | wc -l` prints `10`, and `ls tests/data/sources | wc -l` prints `10`. `utils/folder-check.sh` refuses a folder with more than ten items. So the new `src/lib/data/sources/deck/<the one module>.ts` would make 11, and so would the new folder `tests/data/sources/deck/`. Neither write-list path can be built as written. The brief needs to name the split, or a different folder for each.
2. **`tests/checks/config/integrity.test.ts` is a third builder of reader input, and it is not on the write list.** It has its own `deckProjects` (:88), its own `readDeck` (:106-118) and a second `createReader` call (:336). It builds its domains from `hubDomainsOf` (:22, :111: `domains: Object.keys(hubDomainsOf(read.hub, read.config))`). This makes item 1's "No other file builds a `DeckProject` or a reader's input" false. The C9 grep will list it as a reader of a deck. It is one of the four read-only real-hub tests in `spec.md`.
3. **`tests/data/sources/present.test.ts` also builds reader input, and it stays.** It builds `DeckContext`s and `DeckProject`s by hand at :174-186, :285 and :683. That file is on the write list, but its reader tests stay, so item 1's "No other file" is false unless the rule is limited to `src/`.
4. **`src/lib/data/snapshot/normalise.ts` has two comments that name the build's deck read.** :264 says "The snapshot build's deck read (snapshot/hubs/deck-facts.ts `hubFacts`)", and :637 says `factRecords` is "for the snapshot build's read of the decks (hubs/deck-facts.ts)". Both become false if `hubFacts` is renamed or reshaped (item 2). Yet the write list allows `normalise.ts` only "if item 4 needs that field filled".
5. **`DeckSource` users outside the write list.** These read `DeckSource` and `readDeck`:
   - `src/routes/api/(docs)/deck/+server.ts:12,18` (`sourceOf`)
   - `src/lib/server/content/deck/endpoint.ts:23,77,106`
   - `src/lib/server/edit/writes/config/lists/deck/deck.ts:34,212`

   They stay correct only if `DeckSource` and `readDeck` keep their shape. If item 4's resolution needs a new `DeckSource` input (for example the domain holders), `+server.ts` must change, and it is not listed.
6. **`docs/diagrams/writes.dot` (:1157, :1343, :1381, :1384) and `writes.svg` change when the diagrams are rebuilt.** They draw the edges `read.ts -> data/index.ts: hubDomainsOf` and `read.ts -> deck/read.ts: createReader`. `npm run diagrams` rewrites both, and neither is on the write list.
7. **A new field on `Project` (item 4's option) is visible to apps.** It reaches the apps' `portfolio` payload (`payloadOf`, `src/lib/server/machine/apps/read/held.ts:43`), and `docs/apps.md:402` lists every project field that payload carries. The brief calls such a field "internal". It would be a wire shape apps can see, and `docs/apps.md` is not on the write list.
8. **A required `Project` field would break files outside the write list.** `grep -rln "domainIds:" src tests` lists ten files that build a `Project`. These are outside the write list: `src/lib/state/boards/board/new-project.ts`, `tests/state/forms/referrers.test.ts`, `tests/state/forms/form-draft.test.ts`, `tests/state/boards/board/board-rules.test.ts`, `tests/fixtures/entities-fixture.ts` and `tests/data/snapshot/normalise.test.ts`. Also, `normalise.test.ts:308` (`expect(alpha).toEqual({`, a G32 row) compares the whole project, so it changes if `manifestProject` fills the field. That would be an edit to an existing assertion outside the write list.
9. **Hits the change leaves true.** These stay true if `readDeck` and the hub rule stay in `server/content/deck/read.ts`:
   - `src/lib/state/life/present.ts:197`
   - `deck-files.ts:4`
   - `deck.ts:14`
   - `deck-facts.ts:2` (`withDecks`, `index.ts:374`)
   - `src/lib/data/index.ts:665/693/708` (`hubDomainsOf` used by `hubVocabOf`, which is not deck code)
   - `src/lib/state/life/present.svelte.ts:260` and the present show and print routes (a different, client-side `readDeck`)
   - `tests/routes/edit/write-fixture.ts:276` (a `deckProject` that builds a `Project`, not a `DeckProject`; it is affected only by finding 8).

## The step line

10. **Each part of the O156 line, and the item that serves it:**
    - "one module reads a deck folder for both": item 1.
    - "the snapshot build": item 2.
    - "the deck route the Present view draws": item 3.
    - "in place of decks.ts and read.ts each reading it": items 2 and 3.
    - "so both give the same deck and the same findings": item 4.
    - "a project slide's domain is checked once, as the merge resolves it": item 4.
    - "the tests of both readers move to the one module": item 5.
11. **No requirement serves "(the Findings view, the Overview's counts)".** C10 covers the Findings view. Nothing in the brief names the Overview's counts. One related output has no case either: the build's `decks` output (path and tags per project) feeds the snapshot's `deck` and `deckTags` (`normalise.ts:320-322`), which the deck menu reads (`present.svelte.ts:534-538`).
12. **"The tests of both readers move" is met only in part.** Decision 3 keeps the route's refusal, draft and unnamed tests in `deck.test.ts`, which is a departure from the line, and the brief does say it. Ruling "One deck reader" (`plan.md:3581`) says nothing about the tests. Item 5 also moves the facts case of `present.test.ts`, which tests `createReader` and belongs to neither of the two readers the line names.

## Premises

13. **One sentence about the base is false.** "What is on the tree" says a key resolved in another hub "raises the finding though the slide on the route draws that domain". The route does not draw it:
    - The route hands over `project.domainIds.at(0)`, for example `lab:x` (`server/content/deck/read.ts:77`).
    - It checks that against the own hub's keys only (:129).
    - `projectOf` (`deck/read.ts:283-290`) then raises `domain_unknown` and returns `domain: undefined`.

    The next sentence of the brief says the same thing, so the paragraph contradicts itself.
14. **C2's "the route drops the domain" is true but leaves something out.** On the base the route also raises `domain_unknown`, in the `findings` of its deck answer (`Deck.findings`, `model-deck.ts:329`). So the failing run on the base will show the finding on both reads.
15. **C2's claim about the build is true.** `decks.ts:61-62` passes the raw key, and `decks.ts:83` checks it against the keys of the own hub's registry.
16. **The brief drops a no-hub key at the wrong place.** It says a key no hub holds "is dropped by the merge (`idsOf`, `merge.ts:130-132`)". It is dropped earlier, in the hub's own build. `normalise.ts:681-697` passes `linked` a `known` set that holds the own keys plus the other hubs' keys, and `links.ts:87` and `:152` drop any id not in that set. `idsOf` never sees the key; it drops only an ambiguous key. So any field item 4 adds has to be filled in `manifestProject` and kept through both `linked` calls.
17. **Line ranges, compared with the files on main:**
    - Off by one or two, none wrong in substance:
      - `decks.ts` `deckProjects`: the function is at 37-65 (brief :38-64).
      - `server/content/deck/read.ts` `deckProject`: 63-80 (brief :62-79).
      - The domains line is :129 (brief :126, which is the `createReader` call).
      - The head comment is 1-25 (brief 1-24).
      - `index.ts` comment: 306-309.
      - `hubFacts`: 49-123.
    - Exact: `findings.yml:123`, `model-entities.ts:485`, `deck-facts.ts` 123 lines, `deck-files.ts:94`, `MAX_KEEP = 1024` (`endpoint.ts:32`), `guarded.md` :10-12 and :276-278, `deck.test.ts` 373 lines, `deck-facts.test.ts` 79 lines.
    - The importer grep prints exactly the ten files the brief lists.
18. **The brief does not mention that both test files being merged are slow.** `deck-facts.test.ts:6` and `deck.test.ts:10` both carry `@module-tag slow`, and `factsWorkspace` builds two copies of the demo hub. The new table will be slow too, so `npm test` leaves it out. The brief should say this, and say how the file is run, as the rules file's test paragraph requires.

## Cases and checks

19. **Item 4 and C4 contradict each other.** Item 4 says "a key that resolves to none raises `findings.deck.domain_unknown`". But an ambiguous key also resolves to none (`resolvedId`, `hub-names.ts:544-547`), while C4 says it raises no deck finding. Item 4 needs to say "a key no hub holds", as its own wording for `findings.yml` does.
20. **C4 cannot be built on the current fixture.** It needs two hubs other than the own one that both hold the key. `tests/fixtures/hubs/deck-hub.ts` holds two hubs (`hub` and `lab`) and the repository folder `kit`. The brief does not say a third hub must be planted.
21. **C1, C5 and C6 claim things about the build that the build does not output.** They say the build gives the slide a domain, values and facts. The build's output is the `decks` record (`{ path, tags }`) and findings, so no slide, domain or fact comes out of it. On the build these cases can only be read by calling the module with the build's input, and the brief does not say so.
22. **C9 fails on the tree as the brief leaves it.** `integrity.test.ts:22,:111` stays a reader of a deck that uses `hubDomainsOf`, and it is not on the write list (finding 2).
23. **The `present.test.ts` facts case has rows that test `createReader` itself.** An example is the row `"{{project.count}} in a project's deck that defines no group project"` (:660-680), which tests the reader's counts and has nothing to do with the module. If the whole case moves, `read.ts`'s own tests end up in two files. The brief should name the rows that move.
24. **The report wording departs from the rules file.** Brief line 117 asks for "true as it stands" or "rewritten". `spec.md:72` asks for 'still true' or 'rewritten'.
25. **C10 and the look.** Its "The Findings view of the running hub" can only be checked at the look, because a builder runs no page (rules file). The brief already says "at the look", so C10 holds as written.
26. **No case asks the builder to check or explain a place the step does not change**, apart from finding 22, where C9's grep reaches `integrity.test.ts`.
27. **The test rule holds.** G32's Code line covers `src/lib/data/sources/` and `src/lib/data/snapshot/` (`guarded.md:277`), so the new module and its one table fall under G32.

## The question

The goal: one module reads a deck folder for both the snapshot build and the deck route, both give the same deck and findings, a project slide's domain is checked once as the merge resolves it, and the tests of both readers are in that module's test file.

28. **Item 1: yes, it could pass.** One file could hold one `deckProject` while the two callers still hand it different inputs, for example the build passing raw keys. Item 4's rule closes that gap only if the equality rows go through the real entry points (finding 29).
29. **Item 4 and its equality rows: yes, they could pass.** A table that calls the module twice, with inputs the test makes itself, passes even if `decked` and `readDeck` feed it different things. The brief does not say what the rows must compare: the build's findings from `buildHubs`, as `factsWorkspace().findings` gives them, against `readDeck`'s answer, which is what `deck-facts.test.ts:20-75` does now.
30. **Item 2: no, given finding 29's comparison is used.** It fixes the build's input to resolved `Project`s.
31. **Item 3: yes, partly.** `hubDomainsOf` could be removed from `read.ts` while the check moves somewhere else that still uses the own keys only. C2 closes that, provided its row runs through `readDeck`.
32. **Item 5: no.** The G32 Test line and the moved rows are concrete.
33. **Item 6: no for the files it lists.** It misses `normalise.ts:264,:637` (finding 4), although its own grep would find them.
34. **C1: yes, on the build side** (finding 21).
35. **C2 and C3: no, if the rows run through `buildHubs` and `readDeck`.** Otherwise yes.
36. **C4: no, once it is consistent with item 4 and has the third hub it needs** (findings 19 and 20).
37. **C5 and C6: no on the route.** On the build, C5 holds through the findings. C6's facts are not in the build's output.
38. **C7 and C8: no.**
39. **C9: yes.** A grep of three names passes when the copy keeps different names, for example the `deckProjects` and `readDeck` of `integrity.test.ts`.
40. **C10: yes.** "The same deck findings except those C2 removes" is read over one fixture. A deck the build never reads would not show up in it (findings 43 to 45).
41. **The step line's check, "same deck and the same findings": yes.** No requirement or case names the build's `decks` output, the Overview's counts, or which decks the equality covers (findings 11 and 43 to 45).

## Implied inputs

42. **A project from a workspace folder that is no hub, in a workspace with a primary** (`kit` in the fixture). It belongs to the primary (G32). Expected: the same slide project and domain on both reads, the domain resolved in the primary first. The fixture tests the facts but no domain for it.
43. **A workspace with no primary.** The build reads no deck of the folder projects: `build.ts:146-165` passes only the hubs to `withDecks`, and `readFolders` bypasses it. The route reads such a deck under the folder's name, with that folder's domains, which are empty. The expected result must be stated: either the equality does not cover these decks, or the build now reads them. On the base the route raises `domain_unknown` for every domain such a project names.
44. **The portfolio deck of a hub other than the primary.** The build never reads it (`readOtherHub` sets `portfolioDeck: null`, `index.ts:616`). The route reads it with that hub's `portfolio_deck` (`hubTargets`, `roots.ts:65`). Expected: the route answers as on the base, and no Findings view entry appears for it.
45. **A deck folder that is neither a project's nor the portfolio deck, such as a talk.** Only the route reads it. Expected: the route answers as on the base. Item 4's "same findings" does not apply to it, and the brief does not say so.
46. **A project with no `domain:`, or with `domain: ""`.** Expected: no domain and no finding on either read. On the base, `decks.ts:62` drops `''`, while `normalise.ts:314` keeps `['']` and `linked` drops it later. A new "named key" field must not count `''` as named.
47. **The deck writes reading a group's members.** These are `deck.ts:212` and `deck-files.ts:147` (`readDeck(deckSourceOf(...))`). Expected: the same members, candidates and missing names as on the base. The `deck-slides` and `deck-acts` tests in verify item 2 cover this, but there is no case for it.
48. **The build's `decks` record.** Expected: `path` and `tags` per project are unchanged, so the snapshot's `project.deck` and `deckTags` stay the same (`normalise.ts:320-322`).
49. **Domains read from a group's members.** These are a legend's domains (`deck/read.ts:452-455`), a grid card's domain (:592) and a summary row's domain (:617). Expected: on both reads they carry the cross-hub domain of C2 and none for C3. Item 4 lists only "domain of each slide".
50. **A project of hub `lab` naming a key that only the primary holds,** the reverse of C2. Expected: the primary's domain and no finding, on both reads.
51. **A project's deck that is also a member of the portfolio deck.** Expected: C3's finding appears once in the build's findings (one reader, findings each once) and once in each route answer.

## ADRs

52. `test -d docs/adr || echo "no docs/adr"` prints `no docs/adr`.

## Dictated text

53. **"Everything in the brief is done"**, found by `grep -n "Everything in the brief is done" .scratch/migration/agents/briefs/O156.md` at :109. It holds; it matches `spec.md:84`.
54. **"true as it stands" or "rewritten"**, found by `grep -n '"true as it stands"' .scratch/migration/agents/briefs/O156.md` at :117. It breaks `spec.md:72` ("Nothing left undone" section of the rules file, the paragraph on changing a name), which asks for 'still true' or 'rewritten'.
55. The brief dictates no other text for a file. `grep -n '"' .scratch/migration/agents/briefs/O156.md` shows only lines 5, 17, 41, 109, 111, 113 and 117, which are quoted titles, a command or wording for the report.

## Declined to judge

- **The base runs.** The worktree `.agents/worktrees/migration-O156`, the base copy `.agents/worktrees/O156-base` and its `unused-exports.txt` do not exist yet (`ls .agents/worktrees/ | grep O156` printed nothing). I ran no test, so C2's failing run on the base was settled by reading the code (findings 13 to 16), not by running it.
- **The meaning of "the Overview's counts" in the step line.** The Present view's Overview group count comes from the deck route (`Group.svelte:135`, `block.decks.length`). I did not find a count that reads the snapshot build's decks, so I cannot say which counts the line means.
- **The sentence "The verify list of the state file equals the commands of its verification page".** I did not read `orchestrator-state.md` against it.
- **Whether a domain key written in a different case from the registry key needs a case.** The client lowercases the key (`domainEntry`, `tones.ts:280`), but the reader matches it exactly. I did not check whether such a key has ever occurred.

Usage: a7ae7433adbc605b5, claude-opus-5-5, 201,464 tokens, 68 tool uses, 10.3 min.

## Closed

Each finding is closed by a change to `agents/briefs/O156.md`, rewritten whole:

- 1: the one module is `src/lib/data/sources/documents/decks.ts` itself, rewritten as the reader both reads call (no new file in `sources/deck/`); its test is `tests/data/hubs/deck-facts.test.ts`, renamed `decks.test.ts` in the same folder (no new folder in `tests/data/sources/`).
- 2, 22, 39: `tests/checks/config/integrity.test.ts` is on the write list and reads its decks through the module; C9's grep widened to `deckProjects`, `createReader(` and `hubDomainsOf` across `src` and `tests`.
- 3: item 1's rule is limited to `src/`; `present.test.ts` keeps its own reader inputs for the tests of `createReader`.
- 4, 33: `normalise.ts:264` and `:637` are on the write list for their comments.
- 5: item 3 keeps the shape of `DeckSource` and `readDeck`; a change to them carries `+server.ts`, `endpoint.ts` and `deck.ts`, which are on the write list for that case.
- 6: `docs/diagrams/writes.dot` and `writes.svg` are on the write list, rebuilt by `npm run diagrams`.
- 7, 8, 16, 46: no field is added to `Project`, so no apps payload changes. The domain finding is raised by the module on the build's read, which holds each manifest's named key (an empty key is no key); the route's projects carry the resolved domain alone and its answer raises no domain finding. The route's `Deck.findings` are drawn nowhere (`grep -rn "findings" src/lib/state/life/present.svelte.ts` shows only the too-tall findings the page makes), so the Findings view, fed by the build, lists the finding once. Decision 4 states this.
- 10, 11, 41: `plan.md`'s O156 line is corrected: the build's read serves the Findings view and the deck menu (`project.deck`, `deckTags`); the Overview's counts come from the deck route. Case C11 covers the `decks` record.
- 12, 23: item 5 names the rows that move (the facts and domain rows of the two readers) and keeps every row that tests `createReader` in `present.test.ts`; decision 3 states the route's own tests stay.
- 13, 14, 15: the premise paragraph is corrected: on the base both reads raise `domain_unknown` for a key held only by another hub, and both drop that domain.
- 17: the line ranges corrected.
- 18: the brief says the module's test file is slow, run alone with `npx vitest run <file>`, and quoted.
- 19: item 4 says a key no hub holds.
- 20: C4 plants a third hub in the fixture.
- 21, 28, 29, 31, 34, 35, 37: the equality rows run through the real entry points: the build's findings from `buildHubs` (as `factsWorkspace` gives them) and the module called with the build's own input, against `readDeck`'s answer.
- 24, 54: the report asks for 'still true' or 'rewritten'.
- 42 to 51: cases C12 to C20 added.
- 25, 26, 27, 30, 32, 36, 38, 40, 52, 53, 55: no change needed.
