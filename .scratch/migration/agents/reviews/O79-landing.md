# O79 landing

Roadmap entry: the oculus migration plan (`.scratch/migration/`). Step O79, primary and foreign keys, landed 2026-10-26. Next: O85's review, its round and landing; /spec O86, O88, O89, O84 and O87.

## Open items

- none.

## Check of the agents

`ListAgents` at the landing listed one subagent running, O85's reviewer a0e17faa413580c97; none of O79's builder (aed0feff241baf1c1) or reviewers (a3d077e13c109e0ab, a71fbc599aa5dbf73).

## NOT DONE

Nothing of the step.

## What landed

The whole range from base a11f9f14 (one wip commit 81953a3d of the builder's work), 147 paths with the fixes at landing:

- A schema field flagged `primary_key: true` is an entry's identity; a file with no schema names it on its `collections:` entry. A file with no primary key, two, one on a list or map field, one beside a named key, or a schema that does not read, is drawn with its writes refused by a sentence naming that cause, and the Audit view lists the finding.
- `from:` renamed `foreign_key:` everywhere; a foreign key reaches any collection, stores the target's primary key and shows the target's first filled field by its `display:` rank.
- The hub rewrite: hub commit dd97f7ec0, 38 files (the 18 data files' schemas flagged and `foreign_key:`, a `short` on 47 venues and 20 project manifests); Axel's uncommitted venue `jneumeth` in `venues.yml` stays out of it.
- `src/lib/data/helpers/hub-names.ts` split: its disk-file helpers moved to `src/lib/data/helpers/files/paths.ts`, so both stay under the size limit.

## Checks

In the gate worktree at main's head f9bca1ab, after `git cherry-pick -n a11f9f14..migration-O79` (conflicts with O81 in `model/index.ts` and `hub-names.ts`, resolved by hand, the diagrams regenerated):

```
$ npm run diagrams && npm run test:quick
ok      ASCII gate (1.7 s)
ok      prettier (3.5 s): All matched files use Prettier code style!
ok      svelte-kit sync (3.8 s)
ok      svelte-check (35.6 s): 1793032537214 COMPLETED 545 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (58.8 s)
ok      vitest checks (182.9 s)
ok      vitest (219.6 s)
ok      vitest slow (267.3 s)
test:quick: 271.3 s; every command passed
```

The run before it failed only in vitest slow, on time-outs in `tests/data/hubs/hub-portfolio.test.ts` (four rows) and `tests/server/machine/lsp/svelte-trust.test.ts` (one wait) at a load average near 22; `npx vitest run` of both files alone with `--testTimeout 0` gave 2 files, 18 tests passed. On main the gate's staged diff was applied with `git apply --index`, the `docs/data-map.md` lines staged alone so Axel's uncommitted sections stay out of the commit; every one of the 147 staged paths is equal under `cmp` to the gate's file.

## The look

On a scratch server on port 8797 started from the gate, over the scratch copy of the hub with both rewrites:

- Venues: cards headed AIIM, Appl Sci, ASOC, BSPC, CBM, by `short`.
- Findings: no new finding.
- `applications.yml` with its flag taken out: its cards read "Writes are off: applications.yml has no primary key, as its schema flags no field with primary_key: true; flag the field an entry is addressed by", and Findings names the file. The copy was put back.

## Visible changes

The report's twelve, and these beyond them:

- Leads Add with an empty title: "A lead needs a title." becomes "An entry needs a title."
- Leads Add with a title already in the file: "A lead with this title is in the file already." becomes "An entry with this title is in the file already."
- The Literature view's save of a paper whose key is in the file is refused with "An entry with this key is in the file already."
- The undo of a deleted feed entry whose title is back in the file: "an entry with that title is already in the file" becomes "An entry with this title is in the file already."
- A file with no primary key names its own cause in the refusal and on its cards, among them a schema that does not read and a key named on the `collections:` entry beside no flag.

## What was found

- The builder's first report did not pass its bar: handed back at case 15, then one repair round of five items.
- The review over the round found small points inside the brief, fixed at landing (Z1038): the `unread` cause and the named key of the `none` cause with their sentences, `primary_key?` and `key_fault?` on the feeds row of `docs/apps.md`, two doc sentences, a rewrapped comment, the assertions over catalog constants removed.
- One fix from the look: `VenueCard.svelte` headed a card by `name`; it now heads it by the display, `short` else `name`.
- `agents/guarded.md`: G132 added; G8's Code and Test lines name the file with no primary key and its rows; G28 names `files/paths.ts`.

## Usage

- Brief check a1f2ea95e545e0ba6, claude-opus-5-5: 286519 tokens, 102 tool uses, 15 min 30 s.
- Builder aed0feff241baf1c1, claude-opus-5-5: 119528 tokens, 125 tool uses, 21 min 28 s (first run); 411377 tokens, 1501 tool uses, 170 min 19 s (build under the cases ruling); 330723 tokens, 230 tool uses, 35 min 3 s (repair round 1).
- Reviewer a3d077e13c109e0ab, claude-opus-5-5: 247539 tokens, 121 tool uses, 31 min 26 s.
- Reviewer over round 1 a71fbc599aa5dbf73, claude-opus-5-5: 239602 tokens, 58 tool uses, 13 min 40 s.

## Next

O85's review, its round and landing; /spec O86, O88, O89, O84 and O87.
