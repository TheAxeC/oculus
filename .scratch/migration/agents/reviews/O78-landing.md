# O78 landing: collections and registries by flag

Position: the cockpit-to-oculus migration, O78 collections and registries by flag; next: O79, primary and foreign keys, then O80 and O81.

## Open items

- none.

## The check of Steps 1

The runner's agent listing showed no subagent: O78's builder a584e9b15ed298b15, its brief check ab5cec249b37c5055 and its reviewers a4d317d58db20e950 and af794cd1d241792f8 were not listed.

## NOT DONE

- Not looked at: a collection view joined across two hubs with a Literature Add or an unfunded card (the joined registry reading rests on the G131 rows of `tests/data/helpers/hub-names.test.ts` and the reviews), and the Settings save of an edited `ticker:` record or `dissemination_skip:` pair (rests on the editor tests and the reviews).

## What landed

O78 landed on main from base e5ad5b79, the whole range (one wip commit 5b82118f), 166 paths with the fixes at landing, on top of 84355f57. The staged diff was applied in the gate worktree at 84355f57, the diagrams regenerated there (unchanged); every one of the 166 staged paths on main equals the gate's file under `cmp`.

- Every feature that picked a hub collection by its key reads a flag on the hub's `collections:` entry (`band_positions`, `band_teaching`, `awaiting`, `open_badge`, `lead_applications`, `dissemination`, `tasks`, `joint_work`); every registry is recognised by the entry's `registry:` field.
- A collection view's group, order, label, glyph and about text come from its entry; `ticker_categories` is a keyed map in `vocab.yml`; `dissemination_skip:` is a condition on the entry.
- `ticker:` is described as one record (a category choice and an undated toggle) and `dissemination_skip:` as key and value rows, both checked by the options schema and edited in Settings; a value the list reader cannot read is a finding.
- The Registries rail entry carries `unplaced_collections: true`; a collection view whose entry names no group goes in that entry's group after its placed views, with findings for no flagged entry and for two; the rail editor has an Unplaced collections tick.
- A collection view joined across hubs reads each entry by its own hub's registry.
- The open-entry badge functions are `openCount` and `openBadge`.

## What was found

- The builder's first report handed back the options description of `ticker:` and `dissemination_skip:`: no control described a single record. Closed by the `holds: record` family (choice Z1017) and carried in repair round 1.
- The first review found items 1 and 5 violated, rows missing from the collections tests, an unrun finding, the key check's credits, two false comments, a ruling id in a comment and the open-badge names; all carried in repair round 1 with the rail placement of choice Z1018.
- The review over round 1 found six points, each closed in the refuter report's "Closed" section: the boards editor drawing `stages:` as cards (looked at); new tests named on no guarded entry (booked in `agents/guarded.md`); rows with no first run quoted (closed by reading); comment paragraphs over 100 columns (rewrapped); round item 3's premise on the Literature Add's hub (the Add follows `entry-add.ts:83`); two commands short in the builder's list of programs (recorded under the standing ruling on unapproved builder scripts).

## Fixes at landing

The comment paragraphs of `Collection.svelte`, `rail.ts`, `options.ts` (two), `model-entities.ts`, `fields.ts`, `option-findings.ts`, `draft.ts` and `Cards.svelte` rewrapped whole with no word changed; `collections.test.ts:400` split into two lines; the doc comment of `hub-names.test.ts` made multi-line; `agents/guarded.md`: G131 added, the Test lines of G9, G13, G32 and G96 extended.

## Verification

`npm run diagrams && npm run test:quick` in the gate after the last fix at landing: "test:quick: 165 changed file(s), from git since HEAD", "322 test file(s)"; ok prettier, ASCII gate, svelte-kit sync, svelte-check ("544 FILES 0 ERRORS 0 WARNINGS"), eslint, vitest checks, vitest, vitest slow; "test:quick: 395.1 s; every command passed". Not covered: tests that reach no changed file within the import depth, the build, the lint of unchanged files.

## Look

On a scratch server on 8797 with two hubs: Focus's Command center draws papers, funding, talks and events, teaching, positions and conference calls; Settings > This hub's `collections:` draws `ticker:` as one card with a category choice and an undated toggle, Add only on an entry with none, and the events entry's `dissemination_skip:` as key `role` with the value list `attend`; the rail editor's Unplaced collections tick is set on Registries alone; the Registries page's Resources view draws its three cards and the Hub list; Settings > Boards draws `stages:` as cards with Add. The record card's field words read "ticker 2, category", the outer entry's number, as every nested list of the editor already labels its fields.

## Usage

Builder a584e9b15ed298b15: 180777 tokens, 1384 tool uses, 2 h 46 min 38 s; round 1 348586 tokens, 579 tool uses, 1 h 32 min 0 s. Reviewer a4d317d58db20e950: 225223 tokens, 136 tool uses, 24 min 41 s. Reviewer over round 1 af794cd1d241792f8: 167318 tokens, 136 tool uses, 26 min 35 s. Brief check ab5cec249b37c5055: 263896 tokens, 81 tool uses, 11 min 55 s. The builder's first report did not pass its bar (one repair round); the fixes at landing are listed above. No A/B (no `bench:`).

## Next

O79, primary and foreign keys, then O80, Focus and the boards from config, and O81, the grouping heading and the Venues view.
