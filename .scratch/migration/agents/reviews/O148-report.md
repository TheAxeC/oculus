NOT done: nothing of items 1 to 7 is built; case C15 is handed back before any code change, as the brief's "Cases" section says for a case its rules get wrong, and no source file of the worktree is changed (`git status --short` prints only this report).

## Open items of the state file, verbatim

`.scratch/migration/orchestrator-state.md:168-170` holds no entry, only its heading and this paragraph:

"An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own."

## The case handed back: C15, the person the people registry lacks

- The case says: "A person id the people registry lacks among the lead: drawn by the person's key, as the card draws it".
- The rules it is judged against: item 1, "Each field holds the words the project card gives it ... a person by the people registry's `name`, else the person's key ... an id the registry lacks is left out as the card leaves it out", and decision 3, "The strip draws each field's words as the project card does".
- The result on the unchanged tree: the card never draws such a person, by key or otherwise. The merge drops every reference no hub resolves (`src/lib/data/snapshot/hubs/merge.ts:130-132` `idsOf`, "a key that resolves to none drops", applied to `lead`, `collaborators` and `supervisors` at `:149-151`) and raises a finding for it, so the snapshot's `Project.lead` the card reads (`src/lib/state/boards/board/items.ts:121`, `people.names[id] ?? own(id)`) never holds it. The card's key fallback is reached only for a person whose record has an empty `name` (`src/lib/state/boards/person.ts:48`, `one.name === '' ? keyOf(one.id) : one.name`).
- The run: the case program `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/cases/cases.ts` copies the demo hub fixture into the scratchpad, plants a project `ghost` with `lead: [dana-example, nobody-known]` and `venue: unknownvenue`, builds the snapshot and merges it. `node cases.ts <worktree>` prints:

```
  hub:ghost {"lead":["hub:dana-example"],"collaborators":[],"venueId":null,"year":null,"yearWritten":null,"domainIds":[],"pillarIds":[],"resourceIds":[],"reproduced":{"note":"rerun"},"code":null}
  merge finding projects/manuscripts/ghost/project.yml:5 lead[1] is nobody-known, which is not a key of people
  merge finding projects/manuscripts/ghost/project.yml:6 venue is unknownvenue, which is not a key of venues
```

- So the two halves of the brief cannot both hold for this person: "drawn by the person's key" contradicts "as the card draws it" and "left out as the card leaves it out".
- Recommended ruling: C15's person row reads "a person id the people registry lacks among the lead is not drawn, as the card does not draw it (the merge drops it with its finding); a person whose record has an empty `name` is drawn by the person's key, as the card draws it". The deck route's test then plants both. The snapshot build's read, which works from the raw manifest, leaves out a person key its people registry lacks, so both readers give the same words. The lazy option is to keep the case as written and draw the raw key on the deck route by reading the manifest again: it costs one lookup less to reason about, breaks "the words the project card gives it", and draws on the slide a name the Findings view says is wrong.
- The venue half of C15 holds on the base as the brief says: the merge drops `unknownvenue` (finding above), so no Venue chip and `{{project.venue}}` filled with nothing with its finding.

## A defect the first run found, inside the step's paths (not a case the brief got wrong)

Every project with a domain loses it on the deck route's read. `deckProject` (`src/lib/server/content/deck/read.ts:58-59`) passes `project.domainIds.at(0)`, an internal id (`hub:graphs`), while the reader checks it against the registry's bare keys (`src/lib/data/sources/deck/read.ts:191`, `context.domains.includes(project.domain)`, the keys from `Object.keys(hubDomainsOf(...))` at server `read.ts:104`). The run prints, for the portfolio deck:

```
  finding projects/manuscripts/hccnet/project.yml: project hccnet names the domain hub:graphs, which is no key of the domains registry (the file the domains entry of the hub's collections list names); its slides are drawn in the neutral tone
  finding projects/ideas/quantum/project.yml: project quantum names the domain hub:method, which is no key of the domains registry (the file the domains entry of the hub's collections list names); its slides are drawn in the neutral tone
  finding projects/active/graph-bandits/project.yml: project graph-bandits names the domain hub:graphs, which is no key of the domains registry (the file the domains entry of the hub's collections list names); its slides are drawn in the neutral tone
```

and every slide prints `domain=(none)`. The strip's Domain chip (C1, C2) needs the domain, so the planned build fixes it in the two files the brief already lists: the reader compares and names `keyOf(project.domain)`, and the server keeps the internal id on the slide, since the client's `domainTone` and `domainLabel` (`src/lib/state/shared/words/tones.ts:283-300`) read an internal id. The deck route's test row for C1's Domain fails on the unchanged tree because of it.

## The cases' first run, on the unchanged tree

The program above was run with `node cases.ts /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148` (exit 0, 50 lines). It plants projects `hccnet` (every field: stage submitted, domain graphs, pillars graphs, datasets synthgraph, two leads, three collaborators, year 2026, venue `intelmed` whose short is `A*B_<x>`, funding ecf, compute utwente, code deposited), `quantum` (stage nascent), `failedp` (failed), `stoppedp` (stopped), `ghost` and `empty` (`venue: ""`, `year: ""`, `lead: []`), each with a `present/` deck, and a plain deck `talks/plain` with a group named `project`. Its output is kept at `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/cases/base-run.txt`.

- C1 (run): the portfolio deck's slides placed from `hccnet`'s deck print `project=(none)` and `deck.projects: "(absent)"`; no slide carries a project and the deck carries no facts. `grep -rn "facts" src/lib/views/academic/present src/routes/present` prints nothing of a strip. The domain is dropped by the defect above.
- C2 (run): `quantum`'s deck: `deck.projects: "(absent)"`, `slide main.md#0 kind=text project=(none)`; no strip.
- C3 (run): `failedp` and `stoppedp`: `deck.projects: "(absent)"`, `project=(none)`; no strip, so no stage chip.
- C4 (run and read): the plain deck `talks/plain`: `slide main.md#0 kind=text project=(none)`; `Bar.svelte` draws no Project facts control (no such control in the file).
- C5 (read): `presentStateShape` (`src/lib/state/life/present.ts:98-103`) holds `slide`, `overview`, `recent`, `filters` and no toggle; `Bar.svelte` has no Project facts control.
- C6 (read): the `keep` message (`present.ts:709-713`) is `{ kind: 'keep', keep: string[] | null, at }`, no toggle; the audience page (`src/routes/present/show/+page.svelte:161-164`) reads the deck again only when `keep` changes and draws no strip.
- C7 (read): `answerPrint(ref, keep, at)` (`acts/export.ts:113`) and `exportKeep` carry the kept list alone; the print page draws no strip.
- C8 (run): `hccnet`'s slide body prints `"At {{project.venue}}"` and `"Lead {{project.lead}}"` as written; the placed copy in the portfolio deck prints the same.
- C9 (run): `quantum`'s body prints `"Venue {{project.venue}}, {{project.nope}}, {{project.Venue}}."` unchanged and no finding names a placeholder; the plain deck prints `"{{project.venue}} and 1"`, the count of the group `project` filled and the project placeholder left.
- C10 (run): `hccnet`'s project slide front matter prints `"title":"At {{project.venue}}"`, `"notes":"Lead {{project.lead}}"`, `"specs":[{"label":"Venue","value":"{{project.venue}}"}]`, unfilled.
- C11 (read): no strip exists to wrap; checked at the look after the build.
- C12 (read): `screen/Stage.svelte:69` subtracts the `[data-key-hint]` height from the measure; nothing else is left out, and no strip exists to count.
- C13 (read): `parsePresentState` reads each field of `presentStateShape` with `.catch` to its default; there is no toggle field yet.
- C14 (read): `readDeck` (`server/content/deck/read.ts:95-113`) reads a deck in a second hub's root over that hub's folder and config and `ofHub(source.projects, hub.key)`; no facts are carried for either hub.
- C15 (run): handed back above; the venue half holds as written.
- C16 (read): `deck-files.ts:91-102` builds `DeckSource` from `WriteTarget` with `projects` alone; nothing of the step changes yet.
- C17 (run): `== snapshot build: deck findings naming a placeholder` prints no line: the snapshot build's read neither fills nor reports `{{project.venue}}`.
- C18 (run): `hccnet`'s slides hold `{{project.venue}}` unfilled, so `A*B_<x>` is not drawn at all.
- C19 (run): `ghost` (reproduced with a note, no date) and `empty` print their placeholders as written and `deck.projects: "(absent)"`; the merge holds `ghost`'s `reproduced` as `{"note":"rerun"}` and `empty`'s `yearWritten` as `""`, `venueId` null, `lead` `[]`.
- C20 (read): `leftDeck` (`present.ts:454-462`) spreads `...held`, so a toggle field added to `PresentState` carries over; `sendKeep` (`present.svelte.ts:618-621`) sends nothing while `link.keep()` is undefined.

## DONE / NOT DONE

| Item | State | Evidence |
| --- | --- | --- |
| First run of C1 to C20 on the unchanged tree | DONE | `node cases.ts <worktree>` output above, and the readings named per case |
| C15 handed back with the rule and the result | DONE | this report |
| Items 1 to 7, tests, HELP, verify list | NOT DONE | held until C15 is ruled, as the brief's "Cases" section requires |

## Files

`git status --short` in the worktree prints only `?? .scratch/migration/agents/reviews/O148-report.md`: no file of the tree is changed. The only file written outside this report is the case program and its output in the scratchpad named above.

## What in the brief was wrong

- C15's person row, above.
- Nothing else found wrong in the first run. The base's domain defect is a defect of the tree the brief's premises did not name; its fix lies inside the step's write list.
