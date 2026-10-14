# D73 round 1: the review's findings

Rules: `agents/spec.md`, `agents/guarded.md` and the step's brief `agents/briefs/D73.md`, which stay in force except where this file says otherwise. This round is built on the worktree `.agents/worktrees/D73` as round 0 left it (`git diff 233a2e2d0 | shasum` begins `dfed29e24595`, 177 paths in `git status --short`, when the round was sent). The review is `agents/reviews/D73-refuter.md` in the main checkout's ledger; read it whole before changing anything. Every finding below names its place there.

Four choices are made for this round and booked as rulings (Z884 to Z887 in `plan.md`'s Rulings); they replace what the brief says where they differ.

## What to change

1. **The Literature view's Add asks the hub (Spec 1; item 21, case 34; Z884).** When more than one hub names `literature` in its `collections:`, `literatureAsk` (`src/lib/views/shared/forms/entry/entry-add.ts:144-163`) shows a Hub field in its box beside the DOI or address, listing only those hubs, the primary first and chosen, as `collectionAsk` does through `hubChoices`; the save goes to the chosen hub's Literature file (the save write takes the hub's root, refused as the `new-entry` `root` is refused when the hub does not name the collection). An empty answer still turns the box into the collection's Add. Save to Literature on a Literature search or Lit Watch card keeps writing to the primary, else the first hub naming `literature`, as item 21 says. Case 34 holds for the Literature view as written: two scratch hubs both naming `literature`, Add with a DOI and the second hub chosen, the entry lands in the second hub's file and no byte of the first changes. A row of G8 in `tests/server/edit/literature.test.ts` or `tests/routes/hubs/hub-writes.test.ts` checks the save with a root, its first run on the round-0 tree quoted.

2. **One hub naming a collection that is not the primary (Behaviour 1; item 21; Z884).** When exactly one hub names the collection, Add (the collection's Add and the Literature Add) asks no hub and writes to that hub, sending its root, primary or not. A workspace where only a second hub names `education`: Add on the Education view writes into that hub's file. A G8 row in `tests/routes/hubs/hub-writes.test.ts` (or the client case the report quotes, where the choice is made on the page) checks it, its first run on the round-0 tree quoted.

3. **`title` is not required in the Literature schema (Spec 2; items 1 and 5, case 9; Z885).** In the Doc text's `registries/literature.yml` and the demo's copy, `title` loses `required: true`; its help line says the title is filled in on the entry's page when the save found none. An address-only save then carries no schema finding (rerun the probe of case 17 and quote it).

4. **The demo's Literature file is the Doc text's file (Spec 3; item 1).** `tests/fixtures/hubs/demo/registries/literature.yml` has the same schema block as the Doc text's file, every `help:` and `label:` included, and its own sample entries.

5. **An option row with an extra key (Behaviour 2; item 11; Z886).** In `src/lib/data/snapshot/schema/field.ts:63,77-78`, a key of an option row other than `key` and `label` is a finding that names the key and the row (the `findings.schema.option_extra` line says so), and the row stays an option with its key and label. A row of `tests/data/snapshot/schema-rules.test.ts` (G56) checks it: `{ key: clinical, label: "Clinical", color: "#ff0000" }` gives the finding and `clinical` stays an option, so an entry using it gives no "not one of" finding.

6. **Untitled papers (Behaviour 3; decision 3; Z887).** Keep `sameTitle`'s rule that two titles holding no letter or digit are never the same paper. The report states it under host-visible changes with the before and after for Lit Watch (a second untitled paper with a different address: refused before, saved now).

7. **The G9 row is slow (Proof 1).** `tests/server/core/changes.test.ts`'s Literature row sits in a describe tagged `slow`. Either it moves to a file `npm test` runs, if it can run there within the unit project's limits, or the report names it as slow with its measured run time and why it cannot run in `npm test`. Say which.

8. **The G5 row checks the sanitiser (Proof 2).** In `tests/ui/html.dom.test.ts:57-59`, the card-line assertion also runs `inlineMarkdown` over the abstract as the source sent it (with `<i>`, an `<img onerror>` and a `<script>`), and asserts the line holds no `img`, no `onerror` and no `script`, so the row turns red if the card line let markup through. The server's `plainText` assertion stays.

9. **`config.test.ts`'s twice-held key (Proof 3).** `tests/checks/config/config.test.ts:354,362`: the row holding a key twice uses a key the hub's settings file still takes, and its assertion compares that key's value with the engine's, so it checks something.

10. **The probes as handed back (Proof 4).** Rerun every probe the report quotes on the code as it stands after this round, fixing a probe that calls a function no longer exported, and quote the new output. The report's quoted runs are those.

11. **Verify 4 (Proof 5).** Verify 4 of the brief is amended: the grep prints only lines where `venue_themes` and `data_themes` are the field names of the `hubs.lists` payload that Z881 keeps; every other hit is a defect. The report quotes the grep and names each line as a payload field.

12. **The head comment of `src/lib/data/prose/literature.ts` rewrapped at 100 columns (Standards 1),** no short line inside a sentence.

13. **The false "one writer" comment (Standards 2).** `src/lib/views/shared/explorer/control/tab-actions.ts:83-84` names both writers of `showHidden` and `showIgnored` (the menu's flip and the project card's seed in `ProjectTree.svelte`), or says no more than is true; the report's claim is corrected the same way.

14. **Sentences the change makes false (Standards 3; items 14 and 23).** Each is rewritten to the new places: `config/text/findings.yml:92` (`domain_unknown`: the domains registry, `registries/domains.yml` or the file the hub's `collections:` entry `domains` names), `config/text/views/system/workbench.yml:16` (`desc_config`) and `:31` (`desc_vocab`), `config/catalogs/vocab.yml:3`, and `DESIGN.md:738` (the `domains:` map rule is gone; say what holds now, the theme word defined by its option row, or remove the sentence when nothing replaces it). Grep every name the step removed (`domains:` map, `data_domains`, `venue_themes`, `data_themes`, `leads_file`, `radar_file`, `vocab.domains`, `vocab.venue_themes`, `vocab.data_themes`) across `config/text/`, `config/catalogs/`, HELP.md, DESIGN.md, `docs/`, the hub's `docs/DATA-MAP.md` and every comment, and fix each sentence it makes false; the report quotes the grep.

15. **One rule, one place (Standards 4).** `FILTERED_TYPES` is declared once (in the data layer the checker reads) and the collection board imports it. `domainKeysOf` (`src/lib/data/sources/deck/read.ts:615`) reads the domains registry through the reader `hubVocabOf` and the registry use, not a second `parse(readFileSync(...))`.

16. **Exports with no importer (Standards 5).** `Lookup` and `LookupOptions` in `src/lib/state/feeds/literature/lookup.ts:27,74` are made local, or the report names the importer outside the file.

17. **The rules on git and runs (Standards 6).** No git command of any kind in this round, read-only ones included, and the run rule of the launch prompt holds for this round: only the test files that cover a change while working, then the brief's checks once after the last change.

## Paths this round writes

- every path items 1 to 16 name, and the test files their rows need
- `src/lib/state/client/writes.svelte.ts`, `src/lib/server/edit/writes.ts`, `src/lib/server/edit/writes/`, `src/lib/server/edit/feeds/`, for items 1 and 2
- `src/lib/state/boards/collection.ts`, `src/lib/data/snapshot/schema/`, for items 5 and 15
- `config/text/` lines the items need
- `tools/oculus/docs/*.md`, `tools/oculus/DESIGN.md`, `tools/oculus/HELP.md` and the hub's `docs/DATA-MAP.md`, only where this round makes a sentence true or keeps it true
- `tools/oculus/docs/diagrams/*` and `docs/palette.md`, as `npm run diagrams` and `npm run docs:palette` rewrite them
- `tools/oculus/.scratch/migration/agents/reviews/D73-report.md`

## Verify before you report

The brief's "Verify before you report", every check, from `tools/oculus` in the worktree, `npm run test:checks` for the tree checks. Verify 4 as item 11 amends it. While working, run only the test files that cover what you change; after the round's last change, run the brief's checks once and quote their final lines; a red line in a file you touched is fixed and that file rerun alone, then the list once more. Every new or changed row has its first run on the round-0 tree (a scratch copy under `$TMPDIR`, never by breaking code) and its run after, both quoted.

Rewrite the report whole for the state after this round, the "Doc text" section with the changed `registries/literature.yml`. Copy the open items from the state file at the moment you write it. Every finding of the review gets a line saying what changed for it, with the file and line.
