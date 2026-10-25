# O60 landing

Position: migration (cockpit to oculus), step O60, each part of `config/` overridden where ruling 214 puts it (a hub's words and form fields, the workspace's catalogs, interface words and display language). Next: /spec O69, O70 and O71, which waited for O60.

## Open items

- 337: O60's builder wrote three helper scripts the brief does not build (`wrap.py` and `wrap2.py`, which rewrapped comment paragraphs, and `greps.sh`, which counted the reader files). (a) record it and use nothing they printed as evidence; every rewrapped comment was judged by reading the diff. (b) have the rewraps redone by hand. Recommended (a); (b) is not the lazy option but costs a round for no change in the text.
- 340: the unknown-stage finding names the closest stage at any distance (`closestWord`, `src/lib/data/shapes/vocab-keys.ts:272`), as the collection status finding does (`src/lib/data/snapshot/validate.ts:234`); over the look's hub with `stages: { nascent: null }`, 18 manifests read 'the closest word is failed'. (a) name the closest word only within half the word's length in edits, both findings. (b) keep both as built. Recommended (a); (b) is the lazy option. It changes the status finding too, outside O60's line, so it needs a step on Axel's word.

## Check of Steps 1

No agent of O60 was running (`ListAgents` listed two idle peer sessions and no subagent).

## NOT DONE

- The look was taken in the light theme only; the page's emulated dark scheme does not change oculus's own theme.
- Open items 337 and 340 wait for Axel.

## What landed

O60 from base 6912641f, the whole range (wip commit 5877ac47: the builder's work, its round 0 and its round 1), 173 files with the fixes at landing. A hub's `.oculus/config.yml` lays each `vocab.yml` key but `priority_levels` over oculus's by its shape: maps by word, `categories` by key with `{ key, removed: true }`, the ordered lists replaced whole. Each hub's records are drawn under their own hub's words, with no primary as with one, and a list over several hubs holds every hub's words. A hub's `manifest_fields:` rows add fields to its own project form. The workspace's `settings:` lays `agents` (never dropping a `confirm: true`; a changed or added value is asked about before a start), `patterns`, `glyphs`, `icons`, `latex_editing` and `latex_unimath` over oculus's catalogs, and sets `text` and `locale`, the display language an approved, enabled app contributes by `localizations`. `config/options/` describes each new key, and the unknown-stage finding names the closest stage.

## Verification

In the gate worktree, `npm run diagrams && npm run test:quick` (173 changed files, 303 test files), after the last fix:

```
ok      ASCII gate (0.8 s)
ok      prettier (2.1 s): All matched files use Prettier code style!
ok      svelte-kit sync (19.5 s)
ok      eslint (15.0 s)
ok      svelte-check (57.6 s): 1792893664545 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (150.8 s): Duration  133.43s
ok      vitest (180.0 s): Duration  162.78s
ok      vitest slow (203.5 s): Duration  186.52s
test:quick: 223.2 s; every command passed
```

An earlier run, made while a copy of the hub was being written to disk, timed out in `tests/state/sources/clone-after.test.ts`, `tests/data/hubs/hub-portfolio.test.ts` (two rows) and `tests/server/machine/pty/sessions.test.ts`; the three pass alone (`npx vitest run` of the three: 28 passed) and in the two runs after.

On main: `git diff --cached` compared under `cmp` with the gate's: SAME, 173 files.

## What was found, and the fixes at landing

- The review over round 1 (af9e8df3d3d7d269d): S1, P1, T1, B2 and B4 fixed with Z992 (open item 338, automode) in `src/lib/data/sources/config/merge/hub-layer.ts`: a word a hub's value no longer gives, by `<word>: null` or by a list replaced whole, leaves every word list of oculus's own values that names it and the options' defaults; a list or row the hub wrote that names it gives one finding, `hub_word_gone`, at the word's place in the hub's file, and the word is not read. Its rows in `tests/data/sources/config/layers/hub-vocab.test.ts` were seen failing first (2 failed, 12 passed) and pass after (55 passed, 2 skipped over `hub-vocab`, `config-value` and `config-folder`). The sentence is in `docs/HELP.md`, `docs/data-map.md`, `docs/templates.md` and the head comments of `config/catalogs/vocab.yml`, `in-place.ts`, `hub-layer.ts` and `hub-vocab.test.ts`, rewrapped by hand.
- S2: `research_audit` declared `control: multi` from `tiers` in `config/options/catalogs/vocab.yml`. S4: G126 states the removal. B1: the removal reads the keys the hub layer applied. B3: the options' defaults take the removal.
- S3: the builder ran `git cat-file -e` and `git rev-parse --short HEAD`, read-only commands outside the three the brief allows; nothing rests on them.
- Z992's clause on a one-word field applies to no field (its correction in `plan.md` Rulings): a board's `tier` and `role` are word lists, so a hub that removes a tier or a role leaves a board that named only that word taking no project, with no finding.
- Found at the look: Settings did not answer once opened on the step's tree. The Settings editor read back the `latex_unimath` row (2415 entries) by comparing every card with every record. `src/lib/state/system/config/editors/draft.ts` now makes the base of a value once, looks a record up by its text and gathers the held values once per field.
- Found at the look: a search found inside the Text row (6053 entries) unfolded it and drew every card, 2,211,677 page nodes. Open item 339, closed in automode as Z993 (a): a list of entries draws 100 at a time with a line Show 100 more of n entries (`Cards.svelte`, `settings.editor_more`); Add draws through to the entry it adds.
- `agents/guarded.md`: G126 to G130 added, G126 with the Z991 and Z992 sentence; the rows of G8, G39, G49, G64 and G124 named on their Test lines; G38's and G39's Test lines name their rows.

## The look

A scratch server on 8797 over a copy of the hub with `stages: { nascent: null }` and `chips: { blocked: null }`, driven through headless Chrome over the DevTools protocol.

- Focus board: drawn as before.
- Projects board: the stage toggles end with `nascent 18`, a stage the hub's words no longer hold, drawn after them as `stageCounts` (`src/lib/state/boards/board/stats.ts`) does.
- Findings: the 18 manifests at `nascent`, each with the stage finding naming the closest word, `failed` (open item 340).
- Settings: before the fixes it did not answer once opened, while main before O60 answered in 100 ms; after them it answers in 129 ms with the search `stages` standing, holding 120,019 page nodes (2,211,677 before the fix, 41,520 on main before O60). Show more drew the next 100 of the Text row's entries in 327 ms.
- The Display language row: `settings.locale`, `en`.

## Agents

- Brief check a27b945b801bfc89b: 277337 tokens, 97 tool uses, 12 min 56 s.
- Builder aaf9969093ea82a29: first run, stopped on three cases, 287511 tokens, 49 tool uses, 6 min 38 s; after round 0, 248615 tokens, 940 tool uses, 149 min 3 s; round 1, 278776 tokens, 186 tool uses, 33 min 18 s.
- Reviewer a30e6ce7d373ab517: 161839 tokens, 96 tool uses, 14 min 27 s.
- Reviewer over round 1 af9e8df3d3d7d269d: 303983 tokens, 101 tool uses, 20 min 23 s.
- All on claude-opus-5-5.

The builder's first report did not pass its bar: its first run stopped on three cases (ruled in `agents/briefs/O60-cases.md`), the review raised findings sent in repair round 1, and the review over the round raised the findings fixed at landing above.

## Next

/spec O69, O70 and O71, which were held until O60 landed.
