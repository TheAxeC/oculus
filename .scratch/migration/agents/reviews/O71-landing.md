# O71 landing

Position: migration (cockpit to oculus), step O71, the priority removed (the manifest field `priority:`, `priority_levels`, the flames of a Focus lane card and the priority part of its move menu). Next: O69 after its repair round 1, and O70 after its review's findings, each landed with its look.

## Open items

- 337 (2026-10-25, O60's builder's report, the breach it records; `agents/spec.md`'s rule that a builder writes no script the brief does not build): O60's builder aaf9969093ea82a29 wrote three helper scripts the brief does not build and no ruling approves, in the session's scratch folder outside the tree: `wrap.py` and `wrap2.py`, which rewrapped the comment paragraphs of the changed files at 100 columns, and `greps.sh`, which runs the brief's four reader greps over a tree and gave the report's counts of 68 reader files on the base and 85 on the worktree. (a) record it, and use nothing they printed as evidence: every rewrapped comment is judged by the reviewers' and the orchestrator's own reading of the diff, and the reader coverage by the reviewer's own greps, as open item 330 ruled for O63. Pros: the step keeps its work and no evidence rests on an unapproved script. Cons: none found. (b) send the rewraps back in the repair round to be redone by hand. Pros: no edit a script made stays. Cons: the same text again, at the cost of a round, when a read already judges each paragraph. Recommended (a); (b) is not the lazy option but costs a round for no change in the text. Left for Axel: `refute`'s Finding dispositions send an unapproved script to the user.
- 340 (2026-10-25, O60's look at landing, item 3 of `agents/briefs/O60.md`): the unknown-stage finding names the closest word of the hub's stages at any distance (`closestWord`, `src/lib/data/shapes/vocab-keys.ts:272`), as a collection entry's status finding does (`src/lib/data/snapshot/validate.ts:234`). Over the look's copy of the hub with `stages: { nascent: null }`, each of the 18 manifests at `nascent` reads 'stage "nascent" is not a word of the stages list; the closest word is failed', which points the reader at a stage that means the opposite. (a) both findings name the closest word only when it is within half the word's length in edits, rounded down, and otherwise end after 'is not a word of the stages list' (or of the statuses). Pros: no hint that misleads. Cons: a word mistyped beyond that distance gets no hint. (b) keep both as built. Pros: no change. Cons: the misleading hint on every word removed or far off. Recommended (a); (b) is the lazy option. Left for Axel: it changes the collection status finding too, which is outside O60's line, so it needs a step, and no step is scheduled without his word.
- 342 (2026-10-25, O71's first run, case 11): a hub `manifest_fields:` row whose `from` names a list that `vocab.yml`, the registries or `projects` do not hold gets no finding, from `loadConfig`, the schema-file check or the build (`config/text/findings.yml:135-140` holds no such kind; `runSchemas` turns no problem of the manifest schema's context into a finding, `src/lib/data/snapshot/schema/run.ts:243-252`), so nothing tells the hub its row names no list. (a) a step that gives such a row a finding naming the hub's file and the row's `from`, with G128's text extended and its row in `manifest-fields.test.ts`. (b) leave it. Recommended (a); (b) is the lazy option. It is a new step and needs Axel's word.

## Check of Steps 1

No agent of O71 was running (`ListAgents` listed O69's builder ab7c1c30c97cc10a2 and O70's reviewer a62a519088c12adcb, neither of O71, and no other subagent).

## NOT DONE

- Open items 337, 340 and 342 wait for Axel.

## What landed

O71 landed on main from base bc4fce66, the whole range (one wip commit 7f62ee4d of the builder's work and its round 0), 27 paths with the fixes at landing (`git cherry-pick -n bc4fce66..migration-O71` in the gate worktree `.agents/worktrees/gate`, then the same range on main, `git diff --cached` of main equal under `cmp` to the gate's: SAME). Built: the manifest field `priority:` is gone from `manifest-schema.yml`, `Project`, `normalise.ts` and the project form; `priority_levels` and the row field `flames` are gone from `vocab.yml` and its shape; a Focus lane card draws no flame badge and its move menu lists the lanes alone, each item's id the bare lane key; the texts `fire_glyph`, `priority_none`, `set_priority` and the `fire` glyph rows are removed; the comments, `docs/templates.md`, `docs/data-map.md` and `docs/apps.md:402` say every list of `vocab.yml` is a hub's to set. A manifest still writing `priority:` gets the finding "key priority is not declared by the schema of this file" and the value is not read; a hub settings file setting `priority_levels` gets "key priority_levels is not one the hub's settings file takes; it is not applied"; a `flames:` field on a `venue_tiers` or `radar_buckets` row, accepted before, is now a config finding of the strict row shape (no shipped or hub file writes one: `grep -rln "flames:" ~/workspace/*/.oculus/config.yml` exit 1). An empty lane key never reaches the menu, and two `focus_lanes` rows of one key give two items of one id, as at the base. Verification in the gate: `npm run diagrams && npm run test:quick` (27 changed files, 228 test files): prettier, ASCII gate, svelte-kit sync, svelte-check (0 errors, 0 warnings), eslint, vitest checks, vitest and vitest slow ok, "test:quick: 254.9 s; every command passed". Fixes at landing: the Doc text of `docs/HELP.md:517` (" (every list but `priority_levels`)" removed); the comment at `Lanes.svelte:120` rewrapped under 100 columns and the head comment of `catalog-files/vocab.ts` rewrapped whole (refutation Standards 1 and 2); G126's sentence in `agents/guarded.md` no longer names `priority_levels`; the priority flame row of `parity.md` struck. The changed tests' failing lines were judged by reading (refutation Proof 1), and judgment call 2's grep prints four base lines all in `Lanes.svelte` (Proof 2). The builder's first run stopped on case 11 and was ruled in `agents/briefs/O71-cases.md` (round 0); its final report passed its bar, and its review (a9d96075314610db6) found no item violated and no case unmet, so no repair round was sent. Looked at on a scratch server on 8797 over a copy of the hub, on its one page named TEST (headless Chrome through the DevTools protocol): the Focus lanes with 59 cards and no flame (`.flames` count 0), a card's first tab stop its name button, the Move to menu listing Run, Push, Revise, Review, Blocked, Backburner, Scope, De-risk, Build and Idea with the held lane in the accent colour; light and dark themes. Usage: brief check a158f829f8014d7a0 210478 tokens, 74 tool uses, 8 min 55 s; builder a8db849d942ed8cc0 first run 190952 tokens, 55 tool uses, 7 min 30 s, round 0 278800 tokens, 56 tool uses, 13 min 16 s; reviewer a9d96075314610db6 221201 tokens, 61 tool uses, 13 min 13 s; all claude-opus-5-5. In full in `agents/reviews/O71-landing.md`.

## Verification

In the gate worktree, `npm run diagrams && npm run test:quick`, after the last fix:

```
test:quick: 27 changed file(s), from git since HEAD
test:quick: 228 test file(s)
ok      prettier (2.8 s): All matched files use Prettier code style!
ok      ASCII gate (3.2 s)
ok      svelte-kit sync (17.9 s)
ok      svelte-check (108.7 s): 1792898423711 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (148.6 s)
ok      vitest checks (191.7 s): Duration  181.50s (transform 134.79s, setup 0ms, import 349.63s, tests 280.20s, environment 3ms)
ok      vitest (226.2 s): Duration  216.31s (transform 234.11s, setup 0ms, import 517.28s, tests 235.16s, environment 42.04s)
ok      vitest slow (236.8 s): Duration  226.94s (transform 13.90s, setup 0ms, import 173.11s, tests 711.86s, environment 13ms)
test:quick: 254.9 s; every command passed
```

## Next

/land O70 once its review's findings are fixed at landing or sent in its one round; /refute O69 over its repair round 1, then /land O69.
