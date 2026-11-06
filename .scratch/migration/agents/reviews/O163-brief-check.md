# O163 brief check

Read on main at ebe587ec0 in `/Users/axelfaes/workspace/oculus`, and the research hub `~/workspace/research-hub` on disk, read only. Brief: `/Users/axelfaes/workspace/oculus/.scratch/migration/agents/briefs/O163.md`. `plan.md` has no Goal section (`grep -n '^## ' .scratch/migration/plan.md` prints only `## Steps, in execution order`, `## Could run in parallel`, `## Rulings`, `## Agents` and `## Blocked, and by what`), so check 5 uses the goal as the prompt states it.

## Names

`git grep -n -e 'engine\.md' -e 'transition\.md' -- . ':!config/local.yml' ':!.scratch'` hits only `tests/server/edit/deck/deck-acts.test.ts` (21 lines, lines 29 to 341). That file has its own synthetic `talk` deck, and the change does not make it false.

`git grep -n -e 'pillars\.count' -e 'more\.count' -e 'legend: pillars' -e 'slides: pillars' -e 'of: pillars' -e 'slides: more' -e 'of: more' -e 'of: ideas' -e 'slides: ideas' -e 'public artifact' ... -- src tests docs config README.md bin utils` hits:
- `tests/data/sources/present.test.ts:164,165,170,174`, synthetic fixture: not made false.
- `tests/routes/edit/deck-slides.test.ts:199,235,236`, synthetic fixture: not made false.
- `tests/routes/edit/write-fixture.ts:264,266`, synthetic fixture: not made false.
- `tests/server/edit/deck/deck-edit.test.ts:31,32`, synthetic fixture: not made false.
- `src/lib/views/shared/card/record/registry/LineCard.svelte:92` (`pillars.counts_tip`), the pillars registry: not made false.
- `tests/fixtures/hubs/demo/deck/present.yml:1`, the "public artifact" comment: see C-3.

The bare word `pillars` is mostly the pillars registry. Every hit about decks (`docs/decks.md:386,407`, `model-deck.ts:150`, `deck-facts.ts`) is the facts-strip field, which the change does not make false. No oculus file names the group `projects`, and the deck reader reserves no group name (`git grep -n reserved -- src/lib/data/sources/deck` prints nothing).

The hub, `git grep -n -I -e 'engine\.md' ... -e 'portfolio deck' -e 'portfolio_deck' -- . ':!.oculus/local.yml'`:
- Hits inside `deck/` itself: `present.yml:43-50`, `title.md:4,8`, `transition.md:3,6`. These are the step's own files.
- `.oculus/config.yml:26-27` and `README.md:60` ("the portfolio deck is the hub's `deck/` folder") stay true.
- A grep of the 25 project decks for `portfolio deck`, `engine.md`, `transition.md`, `pillars.count`, `more.count` and `legend:` prints nothing.

Ledger hits the change makes false:
- C-1. `.scratch/migration/agents/briefs/O151.md:18` ("O150 writes the hub's `deck/present.yml`, `deck/title.md` and `deck/engine.md`") and `:72` (C15 reads "each sentence of `deck/title.md`, `deck/engine.md` and the `deck.title`" against the 95 decks). After O163, `engine.md` is gone, so both lines are false. O151 gets `/spec` again from main after O163 (`orchestrator-state.md:850`). Close: the brief's "What is on the tree" names these two lines as made false, and states that O151's new brief drops `engine.md` from its line 18 and from C15. That is a ledger edit by the orchestrator; no oculus file changes for it.
- C-2. `plan.md:1706`, O150's booking: "Raised: the heading "Composable with constraints" over four settings, open item 703". That heading is on `engine.md:10`, which O163 removes. Open item 703 is not in the state file's open-items list (`orchestrator-state.md:200-204` is empty), and `grep -n 'item 703'` over the history, state, choices and queue files finds no closing. Close: the brief names open item 703 as void once `engine.md` is gone, and the orchestrator records it closed at O163's landing.
- C-3. `tests/fixtures/hubs/demo/deck/present.yml:1` ("# Rules for what goes on a slide (a public artifact): public-safe only, ... never a null or negative result ...") and the hub `README.md:60` ("A project's public slide is `present/main.md`"). O163 does not make either false. Both go against the ruling "Decks are internal", which the brief says "holds for this deck as for every deck" (`O163.md:9`), and item 7's grep for `public artifact` will hit the first. They are a different concern: an oculus fixture, and Axel's hub README. Close: the brief tells item 7 to name both as "not made false; against ruling Decks are internal", and the orchestrator books them into the step that owns the demo hub and the hub README.

## The step line

`plan.md:1704`, part by part, mapped to the brief:
- "the research hub's `deck/` written as O150's line states it": items 1 to 5. O150's line (`plan.md:1705`) has more parts:
  - "the comment on `deck/present.yml:1` ... removed": item 1 ("No comment line"), with C8.
  - "`deck/title.md` names no count of the removed groups": item 2, with C7.
  - "`deck/engine.md:12` says ...": void because `engine.md` is removed (item 3, Decision 2).
- "one group finding every research project's deck at every depth under `projects/` with `discover: true`": item 1 (`find: { folders: [projects/**/present], tiers: [research] }`, `discover: true`), with C2.
- "its order from `deck_order` (O155)": item 1 (no `slides:` and no `sort`), with C4.
- "every narrowing from the filter": item 1 (no `stages`, `forms` or `status`), with C5 and C6.
- "`title.md` before it and `closing.md` after it": item 1's order, with items 2 and 5.
- "with `engine.md` and `transition.md` removed": items 3 and 4.
- "no `engine.md` in the order": item 3, with C9.
- "since O150's and O155's hub changes are not on disk": a premise (`O163.md:10`). O155's hub change, `sort: folder` taken off `more` (`O155-landing.md`, NOT DONE), is served by item 1 ("no ... `sort`").
- "built by a builder agent": items 6 and 7.
- "the hub commit on the user's word": no requirement. Only "Writes to the hub" (`O163.md:14`) says it, which is right, since the commit is the orchestrator's at landing on Axel's word. No finding.

## Premises

Each command of "What is on the tree", rerun:
- `git -C ~/workspace/research-hub status --short --untracked-files=all -- deck projects` printed nothing (exit 0). Holds.
- `git log -1 -- deck` gives `8cae4a30b Update slide presentation configuration to include archived published projects`. Holds.
- `ls deck` gives `closing.md engine.md present.yml title.md transition.md`, and `wc -l deck/present.yml` gives 54. Holds.
- `cat -n deck/present.yml`: line 1 is the "public artifact" comment. The three groups each have a `stages` list, `sort: folder` is on `more`, and the order (lines 42-54) is as stated. Holds.
- `title.md`: line 3 is the kicker with "| June 2026", line 4 is `legend: pillars`, line 6 the heading, line 8 the lede with `{{pillars.count}}` and `{{more.count}}`. Holds.
- `closing.md` names no group. Holds.
- `grep -n portfolio_deck .oculus/config.yml` gives `27:portfolio_deck: deck`. Holds.
- `find projects -path '*/present/present.yml' | wc -l` gives 25. Holds.
- The oculus grep `git grep -n "engine.md\|transition.md" -- src tests docs config README.md ':!config/local.yml' | cut -d: -f1 | sort | uniq -c` gives `21 tests/server/edit/deck/deck-acts.test.ts`. Holds.
- In the O150 report, `grep -n '^## '` gives `85:## Hub files`, `191:## Proposed framing` and `242:## The cases on the built files`. The texts the brief cites lie at lines 89 to 139, inside that section. Holds.
- `O150-landing.md` "What landed" records the same `present.yml` and `title.md` texts. Holds.
- `docs/decks.md:108-127,184,351,372-381` give the group keys, the deck order, the filter, `{{<group>.count}}` and `legend:`. Holds.

Findings:
- C-4. `O163.md:7` says it was read "on main at ebe587ec0", and `O163.md:9` cites the ruling at `plan.md:3610`. The two texts of that ruling differ:
  - The committed one, `git show HEAD:.scratch/migration/plan.md | sed -n '3610p'`, ends: "built by a builder agent; the orchestrator writing the hub files at landing was the lazy option (the user)."
  - The working copy (`git diff -U0 -- .scratch/migration/plan.md`, uncommitted) drops the clause after "builder agent".
  - The brief's "Writes to the hub" (`O163.md:14`) has the orchestrator copy the hub files into the hub at landing.
  Close: the orchestrator settles which text is Axel's ruling. If the committed text stands, the brief says why a byte-for-byte `cp` of the builder's text is not "the orchestrator writing the hub files", or puts that reading to Axel as an open item. The edit of a line marked "(the user)" is itself reported.
- C-5. Decision 1 (`O163.md:49`): "Axel's corrections at O150's landing were taken in them". No ledger file records a correction by Axel. `O150-landing.md` lists one fix at landing, the orchestrator's own (engine line 12), and `plan.md:1706` says the same. Ruling 698 (`plan.md:3603`) has the drafts go in "with Axel's corrections". Close: Decision 1 cites where Axel corrected or accepted the `title.md` and `deck.title` texts, or says plainly that they are O150's drafts, which Axel has not corrected.
- C-6. Item 1 (`O163.md:19`): "Four-space indentation, as the hub's YAML has it". The first indentation in `.oculus/config.yml`, `projects/manuscripts/btfno/project.yml`, `projects/manuscripts/btfno/present/present.yml` and `.oculus/data/pillars/domains.yml` is 2 spaces each (`grep -m1 -o '^ \+'`). Only `deck/present.yml` uses 4. Close: "Four-space indentation, as `deck/present.yml` has it and `agents/spec.md:50` asks."

## Cases and checks

- C-7. Item 7 (`O163.md:25`) asks for each hit of a grep for `engine.md`, `transition.md`, `pillars`, `more.count` and `public artifact` to be named with whether the change makes it false. The grep is `git grep -n -e 'engine.md' -e 'transition.md' -e 'pillars' -e 'more.count' -e 'public artifact' -- src tests docs config README.md ':!config/local.yml' | wc -l`, which gives 424. Almost all the hits are the pillars registry (`config/defaults/sources.yml:39`, `src/lib/state/boards/focus/filter.ts` with 33, and others), places the step does not change and the hub's group `pillars` has nothing to do with. The grep also leaves out the deck forms of `more` and `ideas`, which C9 names. Close: item 7 greps the deck forms (`{{pillars.count}}`, `{{more.count}}`, `legend: pillars`, `legend: more`, `slides: pillars`, `slides: more`, `slides: ideas`, `of: pillars`, `of: more`, `of: ideas`, `engine.md`, `transition.md`, `public artifact`). Those hits are the 21 lines of `deck-acts.test.ts`, the 11 fixture lines listed under Names, `LineCard.svelte:92` and the demo comment (C-3).
- C-8. C6 ("The filter bar with a stage no deck project is at") cannot be set up on the page. The bar offers a slice only for a stage some held project is at: `sliceGroups` builds slices from `held` items (`src/lib/state/boards/board/facets.ts:223-229`, `if (words.length === 0) continue;`), and every other facet lists only values with a count above 0 (`facets.ts:148`, `has`). O150 ran this case through the reader's keep set, which the page cannot produce that way. Close: C6 names a narrowing the bar can make that keeps no deck, such as a search for a word no project holds. Expected: the title and closing slides only (2 slides), an empty legend, line 2 reading "0 of 25 shown", and no finding. The case-run program uses an empty keep set for it.
- C-9. The report shape (`O163.md:83-92`, "these parts in this order") leaves out what `agents/spec.md:84` requires: "files changed with line counts" and "every limitation, sharp edge or compromise you know of". It also leaves out the one line `agents/spec.md:69` requires of a step that adds or changes no test. Close: add the three parts, or say that the report also carries the parts `spec.md:69` and `:84` ask for.

No case is inconsistent with the rules file otherwise:
- The case-run program matches `spec.md:66`.
- "A builder runs no page" matches `spec.md:65`.
- The single `npm run test:quick` run matches `spec.md:26`.
- No hub file is written, which matches `spec.md:38`.

## The question

The goal: the hub's portfolio deck places every research project's deck, with no engine, transition, summary or grid slide, and nothing hidden.

- The step line's check. The line names no check of its own, only the shape and "the hub commit on the user's word". The cases carry it. It could pass without the goal only through the gaps below.
- Item 1. Cannot pass without the goal. `projects/**/present` finds every depth, and `find projects -type d -name present` gives exactly the 25 folders, each holding a `present.yml`. `tiers: [research]` keeps all 25: each manifest's `tier` is `research`, read with the `yaml` package. No research project sits outside `projects/`: no `side-projects` manifest holds `tier: research` (grep exit 1).
- Item 2. Cannot pass without the goal for the files themselves. C7 guards the legend name.
- Items 3 and 4. Can pass with `engine.md` and `transition.md` still on disk. See C-10.
- Item 5. Passes whether or not `closing.md`'s claims hold. See C-12.
- Item 6. Cannot pass without the texts being given.
- Item 7. Unrelated to the goal; see C-7.
- C1. Cannot pass while a deck finding stands.
- C2. Cannot pass with a research deck missing.
- C3. Cannot pass with a deck, an engine, a summary, a grid or a transition slide out of place. It gives no expected count (C-11).
- C4. Could pass on whatever order the report prints, unless the reviewer recomputes it (C-11).
- C5. "only the submitted decks" gives no expected set (C-11).
- C6. Cannot be set up on the page (C-8).
- C7. "each once" gives no expected set (C-11).
- C8. Cannot pass with a comment line in `present.yml`.
- C9. Reads only the report's text. It passes with the files left on disk (C-10).

Findings:
- C-10. No case checks the hub's `deck/` folder after landing. Items 3 and 4 and C9 read only order entries and the report's text. The case-run program hands drafts over the hub's own paths, as O150's did (`O150-report.md:289-296`), so `engine.md` and `transition.md` stay on disk during the run. A landing that copied the two files and never ran the `rm` would pass every case, yet the ruling is about the file existing ("Why does engine.md even still exist?"). Close: add a landing case:
  - `ls ~/workspace/research-hub/deck` prints `closing.md`, `present.yml` and `title.md`;
  - `git -C ~/workspace/research-hub status --short -- deck` prints ` D deck/engine.md`, ` M deck/present.yml`, ` M deck/title.md` and ` D deck/transition.md`.
- C-11. C3, C4, C5 and C7 give no expected values. The values today:
  - C3: 27 slides. Every one of the 25 decks has the order `- main.md` and one slide. The order is O150's C3 list with slide numbers lowered by one (`O150-report.md`, "The cases on the built files", C3): hccnet-fl, dongho-ecg-clustering, bttn-incident-af, dries-bttr-ecg, ward-bttr-crosssubject, meseret-cirrhosis, hccnet-revision, bttd-source-eeg, fed-multicellular-immune, covert-theory, raw-pls, covert-applied, ecg-readable-substrate, ecg-af-fair, bt-operator-theory, btfno, btd-autoencoder, clinical-ai-eval-artifacts, fl-privacy-auditing, hccnet-fl-sweden, quantum-tensor-fl, ssm-longitudinal, florank-personalization, hccnet-pathology, fed-faithful-ecg.
  - C4: O150's C4 list by category.
  - C5: 11 decks and 13 slides. The 11 are bttd-source-eeg, bttn-incident-af, covert-applied, covert-theory, dries-bttr-ecg, ecg-readable-substrate, fed-multicellular-immune, hccnet-revision, meseret-cirrhosis, raw-pls and ward-bttr-crosssubject, each with `stage: submitted` in the manifest read.
  - C7: seven domains, heart, liver, brain, method, meta, privacy and liverfl.
  Close: the cases state these values.
- C-12. Item 5 keeps `closing.md` with no read of its claims. Its line 8 says "Several are open to collaborators across computer science, psychology, and medicine." `grep -ril psycholog` over the 25 deck folders exits 1: no deck names psychology. Ruling 698 holds the deck's framing to what is true of every deck (Axel: "OBVIOUSLY the title is then wrong"), but its list names the title, the thesis, the engine heading and the kicker, not the closing. Adding a check therefore widens the step, which the standing demand "A brief check never widens a step" sends to Axel. Close: raise it as an open item with two options:
  - (a) the builder drafts a closing lede that holds for the 25 decks (and the 95 after O151), for Axel's corrections;
  - (b) the closing is kept as it is; this is the lazy option.

## Implied inputs

- C-13. Research projects with no deck. This input has happened: 95 research manifests and 25 decks, so 70 research projects have none (the tier count over the 99 manifests under `projects/`: `{ research: 95, software: 4 }`). A wrong answer costs, for example a finding or an Add tile per project. Close: C2 says "the 70 research projects without a `present/` deck place nothing and raise no finding".

Inputs not missing:
- A deck of a non-research project under `projects/` has not happened: the 4 software projects, `elixir-fl4e` under `coauthor/` among them, hold no `present/`. The expected result is that the deck is not kept (`docs/decks.md:113`).
- A deck under `projects/coauthor/` has not happened: the 14 research coauthor projects hold no deck today. O151, which lands after O163, adds them. The expected result is that the decks are kept, placed by category, and kept by Mine only while `isMine` reads `collaborators` (`src/lib/data/shapes/boards/roles.ts:97-130`, not verified). This belongs to O151's brief.
- A filter that leaves no deck: C6, see C-8.
- A `present/` folder of no project under `projects/**`: none today. The expected result is that it is dropped while `tiers` is set (`docs/decks.md:118`).
- Two decks of one name: none. `uniq -d` over the 99 project folder names printed nothing.

## ADRs

`test -d docs/adr || echo "no docs/adr"` printed `no docs/adr`, and `git ls-files | grep -i '/adr'` printed nothing. None.

## Dictated text

Each dictated text, with the grep that finds it in the brief:
- `grep -n "deck.title: 'Research projects'"` gives lines 11 and 19. Holds: ASCII and plain. The title's claim, that each deck placed is a research project's, holds on the hub: all 25 manifests have `tier: research`.
- `grep -n 'find: { folders: \[projects/\*\*/present\], tiers: \[research\] }'` gives 11 and 19. Holds.
- `` grep -n '`discover: true`' `` gives 11 and 19. Holds.
- `` grep -n '`title.md`, `{ slides: projects }`, `closing.md`' `` gives 19. Holds.
- "No comment line" (19). Holds.
- "Four-space indentation, as the hub's YAML has it" (19). The rule holds; the reason given is false (C-6).
- `` grep -n '`kind: title`' `` gives 20. Holds.
- `` grep -n 'kicker: Research portfolio | technical briefing`' `` gives 11 and 20. Holds: ` | ` is the hub's separator in place of the middle dot, and the date is gone. "technical briefing" is Axel's own words.
- `` grep -n '`legend: projects`' `` gives 11 and 20. Holds: it names the group item 1 defines.
- `` grep -n '`# Research projects`' `` gives 11 and 20. Holds.
- `grep -n '"Research projects that have a deck of their own, each in its own slides."'` gives 11 and 20. It holds against the prose rule: plain, no "not X but Y", no dash. Its claims hold on the hub as it stands:
  - "Research projects that have a deck of their own": each of the 25 is a research project with its own `<project>/present/present.yml`, and the phrase does not claim that every research project has a deck.
  - "each in its own slides": `{ slides: projects }` places "every slide of each deck of the group, each in its own order" (`docs/decks.md:155`).
  - Both claims stay true under any narrowing and after O151.
- `LC_ALL=C grep -n '[^ -~]'` over the brief exits 1, so the brief is ASCII.

## Declined to judge

- Whether a byte-for-byte `cp` at landing of the builder's text counts as "the orchestrator writing the hub files at landing" in Axel's committed ruling (C-4). That reading is Axel's.
- Whether "technical briefing" in the kicker describes the deck. These are Axel's words, kept under ruling 698.
- Whether Mine only keeps a project that names Axel only in `collaborators` (`roles.ts`). Not verified, and it matters only once O151's coauthor decks exist.

Usage: ad6ecc7ddb8993bc9, claude-opus-5-5, 207946 tokens, 62 tool uses, 11.7 min

## Closed

- C-1: the brief's "What is on the tree" names `agents/briefs/O151.md:18` and `:72` as made false; O151's new brief drops `engine.md` from both.
- C-2: the O150 booking's clause naming the engine heading and its open item is removed from `plan.md`, since that item must not exist in the ledger and `engine.md` goes with this step; nothing in the brief.
- C-3: the demo fixture comment and the hub `README.md:60`, ruled by Axel under open item 707 (a): items 8 and 9 remove the comment and make "public slide" read "slide"; cases C10 and C12.
- C-4: the committed ruling "Hub deck written again" (`plan.md`, preparation commit 8a423feb3) ends "built by a builder agent (the user)"; the clause after it was the session's, not Axel's, and is gone. The builder writes the texts and the orchestrator copies them byte for byte, so the brief stands.
- C-5: Decision 1 says the texts are O150's drafts, which no ledger file records Axel correcting, and that his corrections come at O163's landing under ruling 698.
- C-6: item 1's reason is `deck/present.yml` and `agents/spec.md:50`.
- C-7: item 7 greps the deck forms of the group names, with the expected hits.
- C-8: C6 is a search word no project holds, with 2 slides, "0 of 25 shown" and an empty keep set for the case-run program.
- C-9: the report shape adds the files changed with line counts, the limitations and the line of `spec.md:69`.
- C-10: C10 checks the hub's `deck/` folder at landing.
- C-11: C3, C5 and C7 give the expected values; C4 is recomputed and compared with O150's list.
- C-12: `deck/closing.md`, ruled by Axel under open item 708 (a): item 5 has the builder draft the closing so it holds for every deck, the sentence on collaborators across computer science, psychology and medicine kept word for word; case C11.
- C-13: C2 says the 70 research projects without a deck place nothing and raise no finding.
