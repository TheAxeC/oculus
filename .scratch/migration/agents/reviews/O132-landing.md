# O132 landing

Roadmap entry: the cockpit-to-oculus migration. Step O132, the words of every hub held to the vocabulary check (ruling 647). Next: O136's repair round 1 (rulings 651 and 653), then /spec O135 (ruling 650), O137 (ruling 654) and O138 (ruling Interview status).

## Open items

- Open item 655 (2026-11-03): rename a collection's `status` field to `stage`? (a) keep `status`, recommended; (b) rename it in the hub's six collection files, `vocab.yml`, every reader that finds the field by name and the three pages. The full text is in `orchestrator-state.md` under "Open items".
- Open item 656 (2026-11-03): a finding of a hub other than the primary is drawn in the Findings view with no hub chip and its place relative to the hub, so it reads as the primary's; `configPayload` (`src/lib/server/root/watch/portfolio/payload.ts:88-90`) joins the other hubs' findings with no hub. (a) a new step giving each such finding its hub, recommended; (b) no change, the lazy option. The full text is in `orchestrator-state.md` under "Open items".

## Steps 1

The runner's agent listing (ListAgents) showed one subagent running, O136's builder a0d181eb863e4804e; none of O132's agents (the builder add07c2a46cc28593, the brief check a3a364c925924ff9a, the reviewer a3d8deb001529c2b6, the reviewer over round 1 acbc1234def53be42) was listed.

## Not done

Nothing of the step. The defect the look found (open item 656) predates the step and is outside it.

## What landed

The whole range from base 95025410b (the wip commit 1425299f3), 8 paths, 196 insertions and 41 deletions. `readOtherHub` (`src/lib/data/index.ts`) runs `vocabFindings` over another hub's merged config when its settings file sets a key of `catalogs/vocab.yml`, each finding naming that hub's settings file. `docs/HELP.md:594` gains one line. `tests/data/shapes/catalog-files/vocab.test.ts` gains describe 'the vocabulary words of a hub that is not the primary', eleven rows. G13's Test line in `agents/guarded.md` names it.

## Verification

In the gate, `npm run diagrams && npm run docs:palette && npm run test:quick`:

```
test:quick: 319.9 s; failed: vitest slow
 Test Files  1 failed | 44 passed (45)
      Tests  2 failed | 498 passed | 165 skipped (665)
```

Every other command passed. Both red tests are in `tests/data/hubs/hub-portfolio.test.ts`, a file the step does not change. Alone in the gate: `Tests  16 passed (16)`, Duration 42.53 s, load average 7.93. On main without the step: 16 passed, Duration 45.95 s, load average 5.24, so the step adds no time to the file. The diagrams and the palette page as staged. The staged diffs of main and the gate are equal under `cmp`. The verify list equals the page's commands. No A/B: the configuration names no bench.

## Fixes at landing

The builder's first report did not pass its bar; repair round 1 closed the first review's three findings. From the review over round 1:

- R1: the report's verify 2 row reads "thirteen" timeouts.
- R2: the report's figures of `vocab.test.ts`: 363 lines, the new code at 236-363, the head comment at 1-11.
- R3, a breach of the ruling "Unapproved builder scripts": the builder appended its round section to the report with a shell here-document redirect, which changed the report alone; the section was read against the round brief and is kept with R1 fixed.

## The look

A scratch server on 8797 from the gate, the second hub `lab` with C1's text (`tiers: { personal: { label: Personal, default: true } }`) in its `.oculus/config.yml`: the Findings view lists ".oculus/config.yml tiers.personal research, personal each carry default, which one word carries at most; none of them is read for it". The row has no hub chip and its place is written relative to the hub, so it does not say the file is lab's: open item 656. The console was not read. The server is stopped and 8797 is free (`lsof -nP -iTCP:8797 -sTCP:LISTEN` prints nothing).

## Usage

- Builder add07c2a46cc28593: first run 194868 tokens, 101 tool uses, 21 min 11 s; round 1 225398 tokens, 29 tool uses, 14 min 14 s.
- Brief check a3a364c925924ff9a: 226477 tokens, 74 tool uses, 11 min 31 s.
- Reviewer a3d8deb001529c2b6: 180985 tokens, 52 tool uses, 14 min 58 s.
- Reviewer over round 1 acbc1234def53be42: 180694 tokens, 38 tool uses, 14 min 53 s.

All served claude-opus-5-5.

## Next

O136's repair round 1 and its review; /spec O135, O137 and O138.
