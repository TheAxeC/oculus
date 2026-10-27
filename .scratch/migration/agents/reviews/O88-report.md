# O88 builder report

Not done: the final run is red on one check, `tests/checks/source/html-sites.test.ts:242`, `expected 33 to be greater than or equal to 34`. The brief's removal of the intros takes six `{@html}` sites out of the tree (the four of `RadarIntro.svelte` and two of `Pillars.svelte`), and the check's floor of 34 counts them. Lowering the floor is a threshold change in a committed check, so it is left as it is and is the orchestrator's to rule at landing; the evidence is under "What in the brief was wrong or impossible". Every other red of the final run was a time limit in an unchanged file, and each of those files passes alone (the final run section).

Apart from that floor, everything in the brief is done, under the coordinator's ruling below. Two things stand outside the builder's reach and are the orchestrator's at landing, as the ruling and the brief assign them: G126's text in `guarded.md`, and the Doc text and Hub text below.

## The coordinator's ruling this build carries

"O88: your three places are ruled; build the step."

- R1 (a): GroupHead, FoldControl and FoldHead move into a `ui/` folder with fewer than 10 items, SubHead beside them, every importer following. The tray draws GroupHead from there. The boundaries check is not changed.
- R2 (a): a hub file that still holds `intro:` gets `findings.schema.not_declared intro`; case 18 reads so; there is no accepted-but-unread key.
- R3: `pillar_kinds` is shaped and merged exactly as `venue_categories` and added to the lists replaced whole. No second duplicate check is built; case 21's duplicate is settled at landing.
- The approved files outside the paths: FolderFiles.svelte, Processes.svelte, Hpc.svelte, Table.svelte, workbench-keys.svelte.ts, and a new pane-fold file beside the heading components. Each is named below with why.
- G126's text in guarded.md is the orchestrator's at landing.

How R1 was built: the four heads are in `src/lib/ui/controls/heads/` (FoldControl, FoldHead, GroupHead, SubHead), and `views/shared/card/heads/` no longer exists. The folder is set by the import-order check (`tests/checks/imports/order.ts`): the ui folders are ordered tabs, tree, forms, controls, menu, frame, display, theme, and a module imports only its own folder or one below it. FoldControl imports `ui/controls/ToolButton.svelte` and FoldHead `ui/controls/Chip.svelte`, so the heads cannot sit in `ui/frame` or any folder below `ui/controls`; `theme` (5 items) is the only ui folder with room and it is the lowest. At the base every ui folder above it held 10 items (`ls <folder> | wc -l` on the base copy prints `10` for `ui`, `tabs`, `tree`, `forms`, `controls`, `menu`, `frame` and `display`). So `ui/controls/Confirm.svelte` and `ui/controls/CloseQuestion.svelte` moved into `src/lib/ui/controls/confirm/`, every importer following, and `ls src/lib/ui/controls | wc -l` now prints `10` (Chip, confirm, editor, heads, RowButton, segment, Tag, text, tool-button.ts, ToolButton). `ui/frame/` is as at the base. The Update tray draws GroupHead from `ui/controls/heads/` and imports no state module.

## Open items of the state file, verbatim

`.scratch/migration/orchestrator-state.md:194-196` holds the heading and its standing sentence and no entry:

"An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own."

## The cases

### The first run, on the unchanged tree (85a826ca6, with the case 20 row added)

`first.mts`, run with `node first.mts <worktree>` (Node 24 strips the types):

```ts
const tree = process.argv[2];
const lines = await import(`${tree}/src/lib/state/boards/structure/lines.ts`);
const venues = await import(`${tree}/src/lib/state/sources/registries/venues.ts`);
const hub = await import(`${tree}/src/lib/data/snapshot/schema/hub.ts`);
const check = await import(`${tree}/src/lib/data/snapshot/schema/check.ts`);
const input = [
    { id: 'p', kind: 'pillar' }, { id: 'v', kind: 'provisional' }, { id: 'o', kind: 'offpillar' },
    { id: 'n' }, { id: 'x', kind: 'other' }
];
const kinds = lines.lineKinds(input);
console.log('case 19 lineKinds:', JSON.stringify(Object.fromEntries(Object.entries(kinds).map(([k, v]) => [k, v.map((l) => l.id)]))));
console.log('case 19 arity (a list of kinds is not read):', lines.lineKinds.length);
for (const folded of [undefined, ['gone', 'a', 'a', ''], 'a', [3, 'a']]) {
    console.log('case 7 parseVenuesState folded', JSON.stringify(folded), '->', JSON.stringify(venues.parseVenuesState({ folded }).folded));
}
const schema = hub.fileSchema([{ field: 'name', type: 'text' }], { kind: 'entries', list: 'entries', written: [], own: true }, { lists: () => null, problems: [], at: 'schema.' });
const texts = { demo: JSON.stringify(schema) };
const checker = check.createChecker();
for (const top of ['intro', 'blurb']) {
    const text = `title: Demo\n${top}: A paragraph.\nschema:\n  - { field: name, type: text }\nentries:\n  - { name: one }\n`;
    const found = check.checkDocument({ name: 'demo', file: '/hub/demo.yml', text }, texts, checker, {});
    console.log(`case 18 file holding ${top}:`, JSON.stringify(found));
}
```

Its output:

```
case 19 lineKinds: {"pillars":["p","n","x"],"provisional":["v"],"offpillar":["o"]}
case 19 arity (a list of kinds is not read): 1
case 7 parseVenuesState folded undefined -> []
case 7 parseVenuesState folded ["gone","a","a",""] -> ["gone","a","a",""]
case 7 parseVenuesState folded "a" -> []
case 7 parseVenuesState folded [3,"a"] -> ["a"]
case 18 file holding intro: []
case 18 file holding blurb: [{"file":"/hub/demo.yml","key":"blurb","message":"findings.schema.not_declared blurb","line":2}]
```

`case21.mts`, run with `node case21.mts <worktree> <list>`:

```ts
const tree = process.argv[2];
const list = process.argv[3];
const fixture = await import(`${tree}/tests/data/sources/config/layers/layers-fixture.ts`);
for (const text of [
    `${list}: [ { key: '', label: Empty }, { key: b, label: B } ]\n`,
    `${list}: [ { key: a, label: One }, { key: a, label: Two } ]\n`
]) {
    const read = fixture.withHub(text);
    console.log(JSON.stringify(text.trim()));
    console.log('  findings:', JSON.stringify(fixture.findingLines(read.findings)));
    console.log('  merged:', JSON.stringify(read.config[list]));
}
```

Its output on the unchanged tree for `venue_categories` and for `pillar_kinds`:

```
"venue_categories: [ { key: '', label: Empty }, { key: b, label: B } ]"
  findings: ["/scratch/lab/.oculus/config.yml | venue_categories.0.key | venue_categories.0.key is not a value this key takes"]
  merged: [{"key":"","label":"Empty"},{"key":"b","label":"B"}]
"venue_categories: [ { key: a, label: One }, { key: a, label: Two } ]"
  findings: []
  merged: [{"key":"a","label":"One"},{"key":"a","label":"Two"}]
"pillar_kinds: [ { key: '', label: Empty }, { key: b, label: B } ]"
  findings: ["/scratch/lab/.oculus/config.yml | pillar_kinds | key pillar_kinds is not one the hub's settings file takes; it is not applied"]
  merged: undefined
"pillar_kinds: [ { key: a, label: One }, { key: a, label: Two } ]"
  findings: ["/scratch/lab/.oculus/config.yml | pillar_kinds | key pillar_kinds is not one the hub's settings file takes; it is not applied"]
  merged: undefined
```

The case 20 row on the unchanged tree, `npx vitest run tests/data/sources/config/layers/hub-vocab.test.ts -t "pillar kinds" --reporter=verbose`:

- ` <multiplication sign> |unit| tests/data/sources/config/layers/hub-vocab.test.ts > the vocabulary a hub lays over oculus's > replaces oculus's pillar kinds whole 210ms`
- `AssertionError: expected [ Array(1) ] to deeply equal []`
- `      Tests  1 failed | 16 skipped (17)`

Each case on the unchanged tree:

1. Projects without a wallpaper. Reading: the heading is wrapped in the view's `<div class="heading">` (`Projects.svelte:422-431`), sticky on `--panel` with `padding: 2px 0 6px` (`:452-458`); the strip has no rounding. Not met.
2. Projects over a wallpaper. Reading: the view's `.heading` paints `--panel-on-wall` with the blur (`Projects.svelte:462-465`).
3. Tinted views and a free float over a wallpaper. Reading: Audit (`Audit.svelte:182`), Slides (`Slides.svelte:230`) and Catalogue (`Catalogue.svelte:234`) are tinted; none of their headings sticks or paints.
4. Sticky headings. Reading: only the Projects heading sticks (`Projects.svelte:452-458`).
5. The headings side by side. Reading: five shapes (the `GroupHead` line; `ToolButton` headings in Lit Watch and Leads; `h3` at `--fs-xs` uppercase in Inbox, LinkedIn, Audit, Pillars, Catalogue, Keys, Person; `h2` at `--fs-xl` in Settings; `h3` at `--fs-md` in Slides and the Gallery's accent `h3`).
6. Fold and reload. Reading: a Lit Watch bucket's fold is the component's own `$state(true)` (`Bucket.svelte:44`), lost on reload; Audit sections, Slides groups, Inbox sections and Settings groups do not fold.
7. The reader of `folded`. No helper of item 2 exists; the nearest reader, Venues' parser, run above: no `folded` and a non-list read as none, a duplicate is read twice, a mixed list keeps its strings.
8. A Lit Watch search with a bucket folded. Reading: the fold is the bucket's local state and the count is `entries.length` of the searched entries (`Bucket.svelte:46`, `Radar.svelte:75-77`); a bucket the search empties is dropped by `filledBuckets`, and its fold is lost when it comes back.
9. Reveal into a folded group. Reading: a closed bucket unmounts its cards (`Bucket.svelte:58`), so a palette reveal of one of its papers cannot scroll; `revealState` opens Expired and Dismissed (`page-entry.ts:103-108`); Settings has no folds.
10. Find-in-page in a folded group. Reading: Lanes and Band fold with `hidden="until-found"` and `onbeforematch` (`Lanes.svelte:274-275`, `Band.svelte:166`); Venues and Projects fold with `{#if}` (`Venues.svelte:138`, `Projects.svelte:432`), so a match inside a folded section is not found.
11. A deck dropped on a folded Slides group. Reading: the group's `section` is the drop target (`Slides.svelte:259-266`); groups do not fold.
12. Dismissed, Expired, run log, Triaged, Muted. Reading: `ToolButton` headings with a rule above (`Radar.svelte:145-151` and `:205-208`, `Leads.svelte:224-231`, `:257-264`, `:319-322`, `Inbox.svelte:226-233`, `:293-296`) and `Disclosure` for Muted (`Audit.svelte:211-216`).
13. Career, Command center, Tasks. `git diff --stat` over FoldHead and its three users printed nothing.
14. A long label. Reading: `GroupHead.svelte:75-80`, `.label` with `overflow: hidden; white-space: nowrap; text-overflow: ellipsis`.
15. Keyboard. Reading: `FoldControl.svelte:21-27` is a `ToolButton` named `t('focus.fold', name)` or `t('focus.unfold', name)` ("Fold {0}", "Unfold {0}", `config/text/views/boards/focus.yml:120`, `:153`) with `expanded={open}`.
16. Card grids. Reading: 320 px `auto-fill` in Projects (`:469-474`, stretch), Collection (`:505-519`), Data (`:135-139`, no `align-items`), Venues (`:196-202`, `align-items: start`); 290 px `auto-fit` in Pillars (`:188-193`) and Domains (`:99-104`); 340 px in Bucket, Radar, Leads and LinkedIn.
17. Intros. Reading: Data (`Data.svelte:91-100`), Leads (`Leads.svelte:186-192`), Lit Watch (`Radar.svelte:122`, `RadarIntro.svelte`), Venues, Domains, Pillars (through `RegistryHead`), the Map (`Map.svelte:185-192`) and Slides (`Slides.svelte:252`) each draw one.
18. A hub file still holding `intro:`. Run above: `intro` is in the frame and gives no finding, and `normalise.ts:551` reads it into the collection, which `Collection.svelte:435-436` draws.
19. `lineKinds`. Run above: one argument; the line with no kind and the line of kind `other` are filed under the pillars; a list of kinds is not read.
20. The case 20 row, red, quoted above.
21. Run above: `venue_categories` refuses the empty key with a finding and gives no finding for a repeated key; `pillar_kinds` is not a key a hub takes.
22. The theme. Reading `appearance.svelte.ts:90-95`: `unloaded` is `$state`, so `unloaded.offers === acting` (`:119`) compares a proxy with its target and is never true; `failed` is always `[]`, and Svelte warns `state_proxy_equality_mismatch`.

### The run after the change

The case-run programs live in the scratchpad (`/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/caserun/`), write nothing in either tree, and are run with the worktree's vite config through `o88.config.mts` (the config replaces the test projects with one node project whose only file is `o88-after.case.ts`; its source is in that folder).

`o88-after.case.ts`, the part that computes (the imports are the worktree's `$lib` modules: `foldedWith`, `instanceFolded` and `stateFolds` from `$lib/state/shared/page/folds`, `lineKinds` from `$lib/state/boards/structure/lines`, `fileSchema`, `checkDocument`, `createChecker` and `normalise` from `$lib/data/snapshot/`):

```ts
test('case 7', () => {
    for (const state of [{}, { sort: 'name' }, { folded: ['gone', 'a', 'a', ''] }, { folded: 'a' }, { folded: [3, 'a'] }, 'not a map']) {
        console.log('case 7 instanceFolded', JSON.stringify(state), '->', JSON.stringify(instanceFolded(state)));
    }
    console.log('case 7 foldedWith ["a","b"] fold "" ->', JSON.stringify(foldedWith(['a', 'b'], '', true)));
    console.log('case 7 foldedWith ["a","b"] fold "a" ->', JSON.stringify(foldedWith(['a', 'b'], 'a', true)));
    console.log('case 7 foldedWith ["a","b"] unfold "a" ->', JSON.stringify(foldedWith(['a', 'b'], 'a', false)));
    let held: string[] = ['a'];
    const writes: string[] = [];
    const folds = stateFolds(() => held, (next) => { held = next; writes.push(JSON.stringify(next)); });
    folds.toggle('b');
    folds.toggle('a');
    folds.open('x');
    folds.open(undefined);
    folds.open('b');
    console.log('case 7 stateFolds from ["a"]: toggle b, toggle a, open x, open none, open b -> writes', JSON.stringify(writes));
});
test('case 19', () => {
    const shipped = parse(readFileSync(`${W}/config/catalogs/vocab.yml`, 'utf8')).pillar_kinds;
    const input = [{ id: 'p', kind: 'pillar' }, { id: 'v', kind: 'provisional' }, { id: 'o', kind: 'offpillar' }, { id: 'n' }, { id: 'x', kind: 'other' }];
    console.log('case 19 shipped rows:', JSON.stringify(shipped));
    console.log('case 19 lineKinds shipped:', show(lineKinds(input, { pillar_kinds: shipped })));
    console.log('case 19 lineKinds reordered:', show(lineKinds(input, { pillar_kinds: [shipped[2], shipped[0], shipped[1]] })));
    console.log('case 19 lineKinds no list:', show(lineKinds(input, {})));
});
test('case 18', () => {
    const schema = fileSchema([{ field: 'name', type: 'text' }], { kind: 'entries', list: 'entries', written: [], own: true }, { lists: () => null, problems: [], at: 'schema.' });
    const text = 'title: Demo\nintro: A paragraph.\nschema:\n  - { field: name, type: text }\nentries:\n  - { name: one }\n';
    console.log('case 18 schema check:', JSON.stringify(checkDocument({ name: 'demo', file: '/hub/demo.yml', text }, { demo: JSON.stringify(schema) }, createChecker(), {})));
    // raw: a portfolio with no manifests, empty registries and one collection `demo` whose meta
    // holds { title: 'Demo', intro: 'A paragraph.', schema: [...] }
    const demo = normalise(raw, [], {}).entities.collections.demo;
    console.log('case 18 collection keys:', JSON.stringify(Object.keys(demo).sort()));
    console.log('case 18 collection intro:', JSON.stringify(demo.intro));
});
```

Run: `npx vitest run --config <scratchpad>/caserun/o88.config.mts --silent false --reporter verbose`, which passes its three tests:

```
 <check mark> |caserun| ../../../../../../../private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/caserun/o88-after.case.ts > case 7 2ms
 <check mark> |caserun| ../../../../../../../private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/caserun/o88-after.case.ts > case 19 18ms
 <check mark> |caserun| ../../../../../../../private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/caserun/o88-after.case.ts > case 18 17ms
```

and prints these lines:

```
case 7 instanceFolded {} -> []
case 7 instanceFolded {"sort":"name"} -> []
case 7 instanceFolded {"folded":["gone","a","a",""]} -> ["gone","a",""]
case 7 instanceFolded {"folded":"a"} -> []
case 7 instanceFolded {"folded":[3,"a"]} -> ["a"]
case 7 instanceFolded "not a map" -> []
case 7 foldedWith ["a","b"] fold "" -> ["a","b",""]
case 7 foldedWith ["a","b"] fold "a" -> ["b","a"]
case 7 foldedWith ["a","b"] unfold "a" -> ["b"]
case 7 stateFolds from ["a"]: toggle b, toggle a, open x, open none, open b -> writes ["[\"a\",\"b\"]","[\"b\"]","[]"]
case 19 shipped rows: [{"key":"pillar","label":"Pillar","color":"#2563eb"},{"key":"provisional","label":"Provisional","color":"#d97706"},{"key":"offpillar","label":"Off-pillar","color":"#9ca3af"}]
case 19 lineKinds shipped: [{"key":"pillar","label":"Pillar","color":"#2563eb","lines":["p"]},{"key":"provisional","label":"Provisional","color":"#d97706","lines":["v"]},{"key":"offpillar","label":"Off-pillar","color":"#9ca3af","lines":["o"]},{"key":"","label":"","color":"","lines":["n","x"]}]
case 19 lineKinds reordered: [{"key":"offpillar","label":"Off-pillar","color":"#9ca3af","lines":["o"]},{"key":"pillar","label":"Pillar","color":"#2563eb","lines":["p"]},{"key":"provisional","label":"Provisional","color":"#d97706","lines":["v"]},{"key":"","label":"","color":"","lines":["n","x"]}]
case 19 lineKinds no list: [{"key":"","label":"","color":"","lines":["p","v","o","n","x"]}]
case 18 schema check: [{"file":"/hub/demo.yml","key":"intro","message":"findings.schema.not_declared intro","line":2}]
case 18 collection keys: ["entries","file","id","index","key_fault","schema","title"]
case 18 collection intro: undefined
```

`case21.mts` (source quoted in the hand-back), `node case21.mts <worktree> pillar_kinds`, after the change:

```
"pillar_kinds: [ { key: '', label: Empty }, { key: b, label: B } ]"
  findings: ["/scratch/lab/.oculus/config.yml | pillar_kinds.0.key | pillar_kinds.0.key is not a value this key takes"]
  merged: [{"key":"","label":"Empty"},{"key":"b","label":"B"}]
"pillar_kinds: [ { key: a, label: One }, { key: a, label: Two } ]"
  findings: []
  merged: [{"key":"a","label":"One"},{"key":"a","label":"Two"}]
```

Each case, first run then after the change:

1. Projects without a wallpaper. First run: the heading wrapped in the view's `div.heading`, no rounding. After: `Projects.svelte` draws `GroupHead` with nothing of its own around it; the strip's `.strip` rule in `src/lib/ui/controls/heads/GroupHead.svelte:146-160` has `margin: 0 0 8px`, `border-radius: var(--input-radius)`, `background: var(--panel)`. Look on landing: a Projects board, no wallpaper; one strip per category, 8 px from the strip to the first card, `--panel` with `--input-radius` corners.
2. Over a wallpaper. After: `GroupHead.svelte:164-167`, `:global(body.wall) .strip { background: var(--panel-on-wall); backdrop-filter: blur(var(--wall-blur)) }`. Look on landing: wallpaper on; the strip is the one layer at `--panel-on-wall` with the blur.
3. Tinted views and a free float. After: inside a tinted pane `--panel-on-wall` is the pane's own share (`Pane.svelte`), so the same rule paints the pane's fill; inside a free float `GroupHead.svelte:170-173` paints `color-mix(in srgb, var(--panel) var(--wall-popover), transparent)` with no blur; the Update tray sets `--panel-on-wall` to its own fill under `body.wall` (`UpdateTray.svelte:264-268`). Look on landing: Audit, Slides, Catalogue and a view in a free float, wallpaper on, scrolled; the strip hides what scrolls under it, one layer over the picture.
4. Sticky headings. After: `.strip { position: sticky; top: 0; z-index: 2 }` inside the group's own `section`. Look on landing on Projects, Lit Watch, Audit and Settings, scrolled.
5. The headings side by side. After: every view of item 6 draws `GroupHead` (grep 7 below lists every heading left and why). Look on landing: the sixteen views named, without and with a wallpaper.
6. Fold and reload. After: Lit Watch buckets write `folded` (`state/feeds/radar.ts` reads it), the Audit's writes keep it (`toggleFold` and the search and Muted writes through `withInstanceKey`), Slides keeps it (`state/life/slides.ts` `parseSlidesState`, every write `{ ...held, ... }`), the Inbox's sections write `folded` (`state/feeds/inbox.ts`), Settings' groups through `usePaneFold` (`views/shared/card/pane-fold.ts`). Lit Watch, the Inbox, LinkedIn, Venues and Pillars write their folds through `stateFolds` (`state/shared/page/folds.ts`), which reads the view's `folded` and writes it back with the rest of the view's state. Look on landing: fold one of each, reload, each stays folded.
7. The reader of `folded`. First run: no helper existed; Venues' parser kept a duplicate twice. After (run above): no `folded`, a non-list and a non-map read as none; a duplicate reads once (`["gone","a","a",""] -> ["gone","a",""]`); an unknown key is kept and changes nothing; the empty key is kept, so the Other group (key `''`) folds under it; a mixed list keeps its strings. `stateFolds` folds and unfolds by a toggle and unfolds a revealed group only while it is folded: from `["a"]`, toggle `b`, toggle `a`, open `x`, open none and open `b` write `["a","b"]`, `["b"]` and `[]`, and the two opens of a group that is not folded write nothing.
8. A search with a bucket folded. After: the fold is in the pane state and no search write touches `folded`; `Bucket.svelte` heads with `count={entries.length}` of the searched entries; `filledBuckets` still drops a bucket the search empties, and its fold comes back with it since the key stays in `folded`. Look on landing.
9. Reveal into a folded group. After: Radar (`Radar.svelte:106-113`), Venues (`Venues.svelte:87-93`), Pillars (`Pillars.svelte:101-107`), LinkedIn (`Linkedin.svelte:112-119`), the Inbox, Projects and the collections take the revealed card's group out of `folded` before the scroll; a folded group's cards are mounted (`hidden="until-found"`), so the card exists to scroll to. `revealState` still opens Expired and Dismissed (`page-entry.ts`, comment rewritten). Settings: `scrollTo` awaits `List`'s exported `unfold(id)` (`Settings.svelte`, `List.svelte`), which opens the group holding the group, section or row id. Look on landing.
10. Find-in-page in a folded group. After: `GroupHead.svelte:129-136`, the body `hidden={open ? false : 'until-found'}` with `onbeforematch={found}`, and `found` calls `ontoggle` when the group is folded. Look on landing on Venues.
11. A deck dropped on a folded Slides group. After: the drop target attributes go on `GroupHead`'s `section` (`ondragover`, `ondrop` through its rest attributes), which holds the strip, so the heading is a drop target while the body is hidden. Look on landing.
12. Dismissed, Expired, the run log, Triaged, Muted. After: each a `GroupHead` folded by its flag (Radar `dismissedOpen`, Leads `expiredOpen` and `runlogOpen`, Inbox `triagedOpen`, Audit `showMuted`), no rule above. Look on landing.
13. Career, Command center, Tasks. Under R1 their files change only by moved imports: `git diff --stat` prints `src/lib/views/boards/focus/CommandCenterView.svelte  | 2 +-`, `src/lib/views/boards/focus/Tasks.svelte              | 2 +-`, `src/lib/views/boards/focus/career/CareerPanel.svelte | 6 +++---` (the FoldHead import line; in CareerPanel also the Confirm import line and the comment lines that name FoldHead's path, rewrapped). `diff` of the base `views/shared/card/heads/FoldHead.svelte` against `src/lib/ui/controls/heads/FoldHead.svelte` differs only in line 2 of the head comment ("view partial of the Focus board" became "primitive, drawn by the Focus board"). What the three boxes draw is unchanged.
14. A long label. `GroupHead.svelte:118` draws the label in `span.name`, and `:184-189` gives `.name` `overflow: hidden; white-space: nowrap; text-overflow: ellipsis`. Look on landing.
15. Keyboard. `src/lib/ui/controls/heads/FoldControl.svelte` unchanged but for line 2 of its head comment: a `ToolButton` named `t('focus.fold', name)` or `t('focus.unfold', name)` with `expanded={open}`. Look on landing.
16. Card grids. After: `src/lib/views/shared/card/record/CardGrid.svelte` (`repeat(auto-fill, minmax(min(320px, 100%), 1fr))`, gap 10 px, `align-items: stretch`, the `[data-reveal]` box stretched with the card); grep 9 below shows no other card-list grid. Look on landing on the nine views.
17. Intros. After: none drawn in Data, Venues, Domains, Pillars, the Map, Leads, Lit Watch (`RadarIntro.svelte` deleted) and Slides; Data's bar ends with `data.count` ("{0} datasets ({1})"), Leads' with `leads.count` ("{0} live"), Lit Watch's with `radar.tracked` ("{0} tracked, last sweep {1}"). Look on landing.
18. A hub file still holding `intro:`. After (run above, as R2 rules): the schema check gives `findings.schema.not_declared intro` and the collection the snapshot reads has no `intro`.
19. `lineKinds`. After (run above): the shipped rows give Pillar, Provisional, Off-pillar in that order and Other (key `''`) holding the line with no kind and the line of kind `other`; a reordered list gives the sections in its order. `Pillars.svelte` draws a section with a line or with the Orphans or Archival card, and the Other section's empty-list case is the one `lineKinds no list` shows. Look on landing: Pillar, Provisional, Off-pillar with counts, Orphans in Pillar, Archival in Off-pillar.
20. A hub's `pillar_kinds` replaces oculus's whole. The new row, `npx vitest run tests/data/sources/config/layers/hub-vocab.test.ts -t "pillar kinds" --reporter=verbose`: red on the unchanged tree (`AssertionError: expected [ Array(1) ] to deeply equal []`, `Tests  1 failed | 16 skipped (17)`, quoted in the hand-back), green after: ` <check mark> |unit| tests/data/sources/config/layers/hub-vocab.test.ts > the vocabulary a hub lays over oculus's > replaces oculus's pillar kinds whole 211ms`, `Tests  1 passed | 16 skipped (17)`.
21. An empty key and two rows with one key. After (run above): the empty key is refused as `venue_categories` refuses it (`pillar_kinds.0.key is not a value this key takes`); two rows with one key give no finding and are merged as written, and `lineKinds` reads the key once from its first row (`lines.ts:262-264`, `if (named.has(row.key)) continue;`). R3 settles the duplicate at landing.
22. The theme. After: `appearance.svelte.ts` declares `let unloaded = $state.raw({...})`, with the comment saying it is raw state replaced whole, so `unloaded.offers === acting` compares the array with itself while the offers are unchanged and the theme whose file failed is passed over. Look on landing: the scratch page's console on load shows no `state_proxy_equality_mismatch`.

### The changed tests on the unchanged tree

Run with the changed test files copied into a scratchpad tree whose `src`, `config`, `utils` and `tests/fixtures` link to the base copy (`caserun/o88-base-tree/`, config `caserun/o88-base.config.mts`, its vite cache in the scratchpad):

- `normalise.test.ts`, `collections.test.ts`, `registries.test.ts`, `page-entry.test.ts`: `Test Files  1 failed | 4 passed (5)`, `Tests  50 passed (50)`; the one failed file is `config-folder.test.ts`, which did not load in that first run (`TypeError: Unknown file extension ".svelte"` for a bits-ui component, a harness setting), run alone below. These four changes take out an `intro` input the code no longer reads or rename a test's title; no assertion changed, so none has a failing line on the unchanged tree.
- `config-folder.test.ts`, with the svelte libraries inlined: `Tests  3 failed | 25 passed | 2 skipped (30)`. Its two failing lines are the key lists the step extends: `AssertionError: expected [ 'agents', 'app_theme', ...(101) ] to deeply equal [ 'agents', 'app_theme', ...(102) ]` at `tests/checks/config/config-folder.test.ts:387:44` and `AssertionError: expected [ 'categories', 'chips', ...(19) ] to deeply equal [ 'categories', 'chips', ...(20) ]` at `:820:48`. The third, "names a glyph only where the source or another config file reads it", is `Error: Test timed out in 5000ms.` after `16977ms`: that harness runs it under vitest's default 5 s limit, which `npm run test:checks` does not set; it is no failing line of the change.

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| 1 GroupHead draws the whole group | done | `src/lib/ui/controls/heads/GroupHead.svelte`, cases 1-4, 10, 14 |
| 2 one fold state | done | `instanceFolded`, `foldedWith` and `stateFolds` in `src/lib/state/shared/page/folds.ts:18-51`, case 7 run |
| 3 a reveal opens its group | done | case 9 reading; card cursor by `checkVisibility()` (`workbench-keys.svelte.ts:394`) |
| 4 no view frames it | done | grep 7 and the diff of each view |
| 5 SubHead | done | `src/lib/ui/controls/heads/SubHead.svelte`, drawn in List, Gallery, Catalogue |
| 6 where GroupHead is drawn | done | every view listed, grep 7 |
| 7 what stays | done | grep 7 and grep 8 below |
| 8 the theme | done | case 22 reading |
| 9 ruling 488 heads kept | done | grep 8 below |
| 10 one card grid | done | `CardGrid.svelte`, grep 9 |
| 11 intros leave | done | grep 10, case 18 run |
| 12 pillar_kinds | done | case 19, 20, 21 runs |
| 13 words | done | catalog diffs; the final run's catalog checks |
| 14 Doc text and Hub text | done in this report | sections below |
| Verify 1 final run | not done: one red | `html-sites.test.ts:242` floor, 33 against 34; the timed-out unchanged files pass alone; the final run section |
| Verify 2 line counts | done | `wc -l` table below; largest component `Settings.svelte` 516, largest source file `tests/checks/config/config-folder.test.ts` 833 |
| Verify 3 case 20 red then green, changed tests before and after | done | cases section |
| Verify 4 unused exports | done | `sh utils/unused-exports.sh > o88-unused.txt` exit 0; `diff ../O88-base/unused-exports.txt o88-unused.txt` prints nothing, exit 0 |
| Verify 5 history-word grep | done | prints nothing, `history-grep exit 1` (grep's no-match status) |
| Verify 6 ASCII gate | done | the spec's perl form over `$(find src tests bin config -type f ! -name local.yml)` prints nothing (find also prints `bfs: error: bin: No such file or directory.`, the tree has no `bin/`), exit 0; the same perl over `docs/templates.md` prints nothing, exit 0; `LC_ALL=C grep -n '[^ -~]'` over this report prints nothing, exit 1 |
| Verify 7 headings grep | done | below |
| Verify 8 fold controls grep | done | below |
| Verify 9 grids grep | done | below |
| Verify 10 intro grep | done | below |
| Verify 11 Doc text read against the standards | done | each new line read against `spec.md`'s prose rules; one sentence per fact, no list item over one paragraph |

### Grep 7: `grep -rn "<h2\|<h3\|<h4" src/lib/views src/lib/shell --include='*.svelte'`

Every hit is a heading item 7 keeps:

- `Calendar.svelte:223` the Calendar's period title.
- `Presenter.svelte:102`, `:117` the presenter's captions; `present/parts/Summary.svelte:68`, `Title.svelte:26`, `Section.svelte:23`, `Plain.svelte:21`, `Project.svelte:52`, `Grid.svelte:33` the Present slides' headlines.
- `Timeline.svelte:137` the transcript's turn heads.
- `ApprovalPanel.svelte:61`, `:62` the app approval panel.
- `NoticeCentre.svelte:67` the notice centre's title.
- `ScheduleDialog.svelte:74` the schedule dialog's heading.
- `UpdateTray.svelte:155` the Update tray's own title.

Over `src/lib/ui` the same grep gives `frame/Pane.svelte:76` (a pane's title, no grouping heading), `controls/heads/GroupHead.svelte:112` and `controls/heads/SubHead.svelte:20`.

### Grep 8: `grep -rn "expanded=\|<Disclosure\|collapse_glyph\|expand_glyph" src/lib/views src/lib/shell --include='*.svelte'`

Against the base the hits of `Inbox.svelte` (1), `Leads.svelte` (2), `Audit.svelte` (2) and `views/shared/card/heads/FoldControl.svelte` (2) are gone (FoldControl is at `ui/controls/heads/FoldControl.svelte:25`). Every hit left is a control item 7 or item 9 keeps:

- Item 9 (ruling 488): `explorer/tree/FileRow.svelte:189`, `explorer/sections/Section.svelte:68`, `latex/Symbols.svelte:114`, `latex/Structure.svelte:124`, `:153`, `latex/Commands.svelte:67`, `session-list/Customizations.svelte:177`, `repositories/changes/Changes.svelte:299`, `graph/CommitRow.svelte:185`, `graph/CommitFiles.svelte:212`, `diff/FileHeader.svelte:70`, `apps/AppSourceGroup.svelte:103`, `:151`, `changes/FolderRow.svelte:78`, `graph/GraphHead.svelte:63`, `search/Problems.svelte:365`, `files/sections/Notes.svelte:68`, `search/References.svelte:331`, `:379`, `files/header/WorkspaceHeader.svelte:106`, `clangd/MemoryUsage.svelte:103`, `apps/tree/AppTreeRows.svelte:68`, `terminal/start/AttachPicker.svelte:96`.
- Item 7: `links/CrossLinks.svelte:72`, `:75` and `history/History.svelte:300`, `:305` (Disclosure for link groups in a card or row); `literature/LiteratureCard.svelte:226` (a fold inside a card); `settings/Header.svelte:57` (the Settings header's toggle); `settings/Contents.svelte:76` (its table of contents); `editors/Fold.svelte:61` (a Settings row's fold); `focus/FocusFilter.svelte:210` (a menu); `notices/Bell.svelte:77` (the bell); `search/Query.svelte:87` (the replace toggle of Search, no heading).
- `focus/lanes/LaneCard.svelte:227` is a CSS selector on `aria-expanded`, no control; `panes/leaf/FoldedPane.svelte:58` is a folded pane's expand glyph, no heading.

### Grep 9: `grep -rn "grid-template-columns: repeat(auto" src/lib/views`

`card/record/CardGrid.svelte:34` is the shared grid. The rest are no card lists of ruling 483: `card/project/CardDetails.svelte:126` (the two columns of fields inside a project card), `present/Overview.svelte:68` and `present/parts/Section.svelte:65`, `Grid.svelte:72`, `Project.svelte:184`, `Plain.svelte:80` (the Present slides), `gallery/Gallery.svelte:434` (the Gallery's sample cards), `hpc/Capacity.svelte:111`, `hpc/Quota.svelte:41`, `usage/Usage.svelte:330` (the meters), `focus/Band.svelte:205`, `focus/lanes/Lanes.svelte:313`, `:372` (the Focus lanes).

### Grep 10: `grep -rn "intro" src/lib config/text docs/templates.md tests --exclude=local.yml`

No hit reads the hub's `intro:` or a removed key:

- `ui/frame/Surface.svelte:3` and `shared/prose/Intro.svelte:6`, `:34`, `:60`: the Intro component and its class, which stays for Account setup, Search and LinkedIn's cadence line (`AccountSetup.svelte:86` `accounts.setup_intro`, `config/text/views/personal/account-setup.yml:91`).
- `server/machine/lsp/*` `introduce`, `introduceMarkdown`: a language-server request, another word.
- `shell/keys/palette-page.ts:117-175` and `config/text/palette-page.yml:15-38`: the palette page's own intro keys.
- `option-findings.ts:9`, `languages.ts:5`, `nesting.ts:4`: the verb "introduce".
- `tests/checks/source/html-sites.test.ts:155-267`: `introTags` and the G5 sample strings `t('venues.intro')`, `t('domains.intro')`, `t('leads.intro', ...)`, `data.intro`, which the HTML-site check classifies as source text with no catalog read (the brief's "What is on the tree").
- `deck-acts.test.ts:222`, `changes.test.ts`, `hub-writes.test.ts`, `deck-slides.test.ts`, `write-fixture.ts`, `undo.test.ts`, `latex-approvals.test.ts`, `terminal-actions.test.ts`, `markdown-created.test.ts`, `mitdb.body`: file names (`intro.md`, `intro.tex`, `intro.htm`) and an anchor.

### The grep after the renames (`spec.md:71`)

`grep -rn "card/heads\|frame/heads\|frame/floating\|controls/Confirm\.svelte\|controls/CloseQuestion\|RadarIntro\|radar\.count\b\|'radar.count'\|slides\.count\|provisional_h\|offpillar_h\|provisional_note\|offpillar_note\|map\.head\|'map.head'\|leads\.intro\|exp_note\|msg_intro_marker\|intro_one\|lineKinds(lines)" src tests config docs README.md --exclude=local.yml` prints three lines: `src/lib/data/sources/config/catalog/options.ts:389` (`str(map.heading)`, a variable) and `tests/checks/source/html-sites.test.ts:259`, `:265` (the G5 sample strings above). `grep -rn "foldedWith\|instanceFolded" src tests docs` names `state/workbench/layout/` only in `tree.ts:134-152` and `:486`, whose `foldedWith(folded: number[] | undefined, at: number)` is the pane tree's own folded panes, another function; every reader of a group's folds imports `state/shared/page/folds`.

### The final run

`npm run diagrams && npm run docs:palette && npm run test:quick -- --base 85a826ca6`, run once after the last change, output in `<scratchpad>/o88-final-2.out`, `final exit 1`. `npm run diagrams` wrote the 18 `.dot` and `.svg` files under `docs/diagrams/`; `git status --short docs` shows 12 of them changed (`layer-shell`, `layer-state`, `layer-ui`, `layer-views`, `layers`, `writes`, each `.dot` and `.svg`), which carry the moves and the new files. `npm run docs:palette` wrote `docs/palette.md`, unchanged. `docs/templates.md` is the step's own edit.

```
test:quick: 147 changed file(s), from git since 85a826ca6
test:quick: 241 test file(s)
ok      ASCII gate (1.1 s)
ok      svelte-kit sync (3.0 s)
ok      prettier (5.3 s): All matched files use Prettier code style!
ok      svelte-check (467.2 s): 1793068351186 COMPLETED 550 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (530.9 s)
FAILED  vitest checks (775.2 s)
 FAIL  |unit| tests/checks/source/html-sites.test.ts > every {@html} site > is one of the sites this file knows about
AssertionError: expected 33 to be greater than or equal to 34
 > tests/checks/source/html-sites.test.ts:242:32
 Test Files  1 failed | 14 passed (15)
      Tests  1 failed | 251 passed | 9 skipped (261)
FAILED  vitest (837.4 s)
 Test Files  10 failed | 172 passed | 43 skipped (225)
      Tests  17 failed | 2184 passed | 601 skipped (2802)
     Errors  1 error
FAILED  vitest slow (892.5 s)
 Test Files  5 failed | 54 passed (59)
      Tests  21 failed | 564 passed | 228 skipped (813)
test:quick: 896.9 s; failed: vitest checks, vitest, vitest slow
```

The red line of `vitest checks` is the html-sites floor, the one finding of this run; it is under "What in the brief was wrong or impossible".

Every red of `vitest` and `vitest slow` is a time limit in a file the step does not change (`git status --short tests` names none of them): "Test timed out in 5000ms" or "in 20000ms", "Hook timed out in 10000ms" in `tests/server/desktop/app-theme-start.test.ts`, and "[vitest-pool]: Failed to start forks worker for test files .../tests/ui/html.dom.test.ts ... Timeout waiting for worker to respond". Each of those files run alone after the final run, with the tier's own flags (`node node_modules/vitest/vitest.mjs run <file> --tagsFilter '!slow' --reporter=dot --configLoader runner`, and for the slow ones `--tagsFilter slow --testTimeout 20000`), output in `<scratchpad>/o88-rerun.out`:

```
tests/server/desktop/app-theme-start.test.ts        Tests  16 passed | 5 skipped (21)
tests/data/snapshot/references.test.ts              Tests  34 passed | 6 skipped (40)
tests/data/snapshot/rename.test.ts                  Tests  29 passed | 2 skipped (31)
tests/data/snapshot/schema-rules.test.ts            Tests  52 passed (52)
tests/routes/files/file-undo.test.ts                Tests  8 passed (8)
tests/state/sources/clone-after.test.ts             Tests  11 passed (11)
tests/data/sources/manifests/manifests.test.ts      Tests  36 passed (36)
tests/server/machine/apps/host-manager.test.ts      Tests  36 passed (36)
tests/state/system/settings/theme-groups.test.ts    Tests  24 passed (24)
tests/data/sources/config/layers/manifest-fields.test.ts  Tests  6 passed (6)
tests/ui/html.dom.test.ts                           Tests  8 passed (8)
slow tests/data/hubs/hub-portfolio.test.ts          Tests  16 passed (16)
slow tests/routes/edit/config-key.test.ts           Tests  14 passed (14)
slow tests/routes/git/clone.test.ts                 Tests  23 passed (23)
slow tests/server/edit/config-value.test.ts         Tests  23 passed (23)
slow tests/routes/edit/undo/undo.test.ts            Tests  56 passed (56)
```

Each line is that file's `Tests` summary line; every one printed `Test Files  1 passed (1)`. The run does not cover, in its own words, "tests that reach no changed file within the import depth, other than the checks under tests/checks/source and tests/checks/tree, ... the build, the lint of unchanged files".

## Commands that wrote a file other than through Edit or Write

- `npm run format` (`prettier --write .`): rewrote only files of the step's own changes to Prettier's form (19 files in the first run, its output in `<scratchpad>/o88-format.txt`; the last run changed `src/lib/views/boards/project/Project.svelte`, the folds import split from the instance import).
- `npm run diagrams` and `npm run docs:palette` in the final run: the files they wrote are listed in the final run section.
- `mv` for the moves of R1: `FoldControl.svelte`, `FoldHead.svelte` and `GroupHead.svelte` from `src/lib/views/shared/card/heads/` to `src/lib/ui/controls/heads/` (SubHead is new there), and `Confirm.svelte` and `CloseQuestion.svelte` from `src/lib/ui/controls/` to `src/lib/ui/controls/confirm/`; `rm` of `src/lib/views/feeds/radar/RadarIntro.svelte`, as the dispatch allows.
- In the scratchpad only: `mkdir`, `ln -s` and `cp` building `caserun/o88-base-tree/` for the run of the changed tests on the base, and the redirects of command output into scratchpad files (`o88-unused.txt`, `precheck.out`, `o88-final-2.out`, `o88-rerun.out`, `caserun/o88-after-final.out`).

## Terms

The tree has no glossary (`ls docs` prints `apps.md`, `data-map.md`, `diagrams`, `HELP.md`, `palette.md`, `templates.md`; the configuration names none).

## Files with line counts

`wc -l` of every changed source and test file (fixtures, `.yml` and `.md` left out; components at or under 520, other files at or under 880):

| Lines | File |
|---|---|
| 27 | src/lib/ui/controls/heads/FoldControl.svelte |
| 32 | src/lib/shell/keys/rows/approve/ApprovalAsk.svelte |
| 32 | src/lib/ui/controls/heads/SubHead.svelte |
| 33 | src/lib/shell/commands/AppAsk.svelte |
| 34 | src/lib/views/shared/explorer/Questions.svelte |
| 37 | src/lib/views/shared/forms/registry/RegistryHead.svelte |
| 38 | src/lib/views/shared/writes/AskConfirm.svelte |
| 41 | src/lib/views/shared/card/feed/FeedFile.svelte |
| 41 | src/lib/views/shared/forms/accounts/RemoveAccount.svelte |
| 44 | src/lib/views/system/machine/hpc/Quota.svelte |
| 48 | src/lib/views/shared/card/pane-fold.ts |
| 50 | src/lib/shell/commands/CommandAsk.svelte |
| 50 | src/lib/ui/controls/confirm/CloseQuestion.svelte |
| 51 | src/lib/state/shared/page/folds.ts |
| 53 | src/lib/views/shared/card/record/CardGrid.svelte |
| 55 | src/lib/data/shapes/hub-keys.ts |
| 59 | src/lib/views/shared/forms/entry/DeleteAsk.svelte |
| 65 | src/lib/views/boards/project/Latex.svelte |
| 75 | src/lib/ui/tabs/CloseQuestions.svelte |
| 91 | src/lib/data/snapshot/schema/hub.ts |
| 91 | src/lib/shell/commands/LatexAsk.svelte |
| 92 | src/lib/views/feeds/radar/Bucket.svelte |
| 95 | src/lib/views/system/status/Hooks.svelte |
| 96 | src/lib/shell/commands/debug/DebugAsk.svelte |
| 98 | src/lib/views/structure/domains/Domains.svelte |
| 115 | src/lib/views/shared/forms/entry/Referrers.svelte |
| 116 | src/lib/ui/controls/heads/FoldHead.svelte |
| 122 | src/lib/shell/commands/CloneAsk.svelte |
| 127 | src/lib/views/system/status/Status.svelte |
| 129 | src/lib/views/shared/explorer/RootedTree.svelte |
| 133 | src/lib/views/system/machine/processes/Processes.svelte |
| 141 | src/lib/views/shared/links/FolderFiles.svelte |
| 142 | src/lib/views/sources/data/Data.svelte |
| 146 | src/lib/views/academic/slides/Order.svelte |
| 147 | src/lib/views/boards/entry/EntryFolder.svelte |
| 155 | src/lib/state/feeds/linkedin.ts |
| 155 | src/lib/views/personal/account-setup/AccountSetup.svelte |
| 155 | src/lib/views/system/machine/hpc/Jobs.svelte |
| 157 | src/lib/views/boards/focus/Tasks.svelte |
| 158 | src/lib/ui/forms/Prompt.svelte |
| 161 | src/lib/state/feeds/radar.ts |
| 164 | src/lib/views/system/machine/hpc/Login.svelte |
| 167 | src/lib/views/system/machine/hpc/Hpc.svelte |
| 172 | src/lib/state/feeds/inbox.ts |
| 178 | src/lib/views/structure/pillars/Pillars.svelte |
| 183 | tests/data/sources/registries.test.ts |
| 186 | src/lib/views/system/machine/processes/AppHosts.svelte |
| 187 | src/lib/shell/window/appearance.svelte.ts |
| 187 | src/lib/views/system/status/LineCounts.svelte |
| 194 | src/lib/ui/controls/confirm/Confirm.svelte |
| 194 | src/lib/views/sources/venues/Venues.svelte |
| 201 | src/lib/views/system/help/keys/Keys.svelte |
| 204 | src/lib/ui/controls/heads/GroupHead.svelte |
| 205 | src/lib/ui/display/table/Table.svelte |
| 217 | src/lib/views/structure/map/Map.svelte |
| 223 | src/lib/views/sessions/session-list/TerminalRows.svelte |
| 227 | src/lib/state/life/slides.ts |
| 230 | src/lib/views/feeds/radar/Radar.svelte |
| 241 | src/lib/shell/rail/ScheduleList.svelte |
| 247 | src/lib/views/boards/project/Project.svelte |
| 248 | src/lib/views/boards/focus/career/CareerPanel.svelte |
| 261 | tests/state/forms/page-entry.test.ts |
| 265 | src/lib/views/system/workbench/settings/List.svelte |
| 267 | src/lib/views/sources/search/RefactorPreview.svelte |
| 286 | src/lib/shell/status/RepoItems.svelte |
| 303 | src/lib/state/boards/structure/lines.ts |
| 311 | src/lib/data/sources/config/merge/in-place.ts |
| 313 | src/lib/shell/rail/UpdateTray.svelte |
| 314 | src/lib/views/boards/focus/Band.svelte |
| 316 | src/lib/views/feeds/inbox/Inbox.svelte |
| 316 | src/lib/views/feeds/leads/Leads.svelte |
| 317 | src/lib/views/boards/focus/CommandCenterView.svelte |
| 324 | src/lib/views/boards/editor/Editor.svelte |
| 325 | src/lib/views/sources/repositories/merge/Merge.svelte |
| 333 | src/lib/data/shapes/vocab-keys.ts |
| 339 | src/lib/views/sessions/session-list/SessionWorkspace.svelte |
| 343 | src/lib/views/sources/files/sections/OpenEditors.svelte |
| 343 | tests/data/snapshot/normalise.test.ts |
| 353 | tests/data/sources/config/layers/hub-vocab.test.ts |
| 358 | src/lib/views/feeds/linkedin/Linkedin.svelte |
| 358 | src/lib/views/system/audit/Audit.svelte |
| 374 | src/lib/views/feeds/inbox/InboxCard.svelte |
| 375 | src/lib/views/boards/focus/lanes/Lanes.svelte |
| 394 | src/lib/state/forms/page-entry.ts |
| 394 | src/lib/views/boards/entry/Entry.svelte |
| 401 | src/lib/views/system/machine/usage/Usage.svelte |
| 412 | src/lib/views/shared/card/feed/LeadCard.svelte |
| 423 | src/lib/views/system/workbench/Catalogue.svelte |
| 448 | src/lib/views/academic/slides/Slides.svelte |
| 452 | src/lib/views/system/gallery/Gallery.svelte |
| 453 | src/lib/views/boards/projects/Projects.svelte |
| 472 | src/lib/views/boards/person/Person.svelte |
| 473 | src/lib/views/sessions/terminal/start/Composer.svelte |
| 491 | tests/data/sources/collections.test.ts |
| 493 | src/lib/views/boards/collection/Collection.svelte |
| 504 | src/lib/data/model/model-collections.ts |
| 513 | src/lib/shell/panes/PaneView.svelte |
| 516 | src/lib/views/system/workbench/Settings.svelte |
| 520 | src/lib/views/sessions/terminal/grid/TerminalGrid.svelte |
| 520 | src/lib/views/sources/repositories/diff/Diff.svelte |
| 522 | src/lib/data/shapes/catalog-files/vocab.ts |
| 590 | src/lib/server/content/audit/projects.ts |
| 607 | src/lib/shell/keys/workbench-keys.svelte.ts |
| 664 | src/lib/data/snapshot/normalise.ts |
| 711 | src/lib/ui/html.ts |
| 741 | src/lib/data/model/model-entities.ts |
| 829 | src/lib/data/helpers/hub-names.ts |
| 833 | tests/checks/config/config-folder.test.ts |

`TerminalGrid.svelte` and `Diff.svelte` are at 520 at the base too; this step changes one import line in each. `vocab.ts` (522) is a source file, under 880.

Folders with a new item, each by `ls <folder> | wc -l`: `src/lib/ui/controls` 10, `src/lib/ui/controls/heads` 4, `src/lib/ui/controls/confirm` 2, `src/lib/views/shared/card` 10, `src/lib/views/shared/card/feed` 8, `src/lib/views/shared/card/record` 4, `src/lib/state/shared/page` 5; `src/lib/ui/frame` 10, as at the base.

## Files written outside "Paths this step writes", each with why

`diff -rq` of `src`, `tests`, `utils` and `config` against `.agents/worktrees/O88-base/` prints 126 lines (`src` 102, `tests` 12, `utils` 0, `config` 12), which agree with `git status --short -uall` over the same folders, 132 lines: `diff -rq` gives a whole new or removed folder one line, so the four files of `ui/controls/heads/`, the two of `ui/controls/confirm/` and the three of the old `views/shared/card/heads/` take three lines there and nine in `git status`. The `Only in` lines are the moves, the deletion of `RadarIntro.svelte` and the new `folds.ts`, `FeedFile.svelte`, `CardGrid.svelte` and `pane-fold.ts`. The paths outside the brief's list:

- `src/lib/ui/controls/heads/FoldControl.svelte`, `FoldHead.svelte`, `GroupHead.svelte`, `SubHead.svelte` (moved and new): R1.
- `src/lib/ui/controls/confirm/Confirm.svelte` and `CloseQuestion.svelte` (moved; Confirm's one change is its import of `../../frame/Modal.svelte`) and every importer, each by its import line and, where a comment names the path, that comment rewrapped: `ui/tabs/CloseQuestions.svelte`, `ui/forms/Prompt.svelte` (comment only), `shell/status/RepoItems.svelte`, `shell/panes/PaneView.svelte`, `shell/rail/UpdateTray.svelte`, `shell/commands/AppAsk.svelte`, `LatexAsk.svelte`, `CloneAsk.svelte`, `CommandAsk.svelte`, `debug/DebugAsk.svelte`, `shell/keys/rows/approve/ApprovalAsk.svelte`, `views/shared/card/feed/LeadCard.svelte`, `views/shared/explorer/Questions.svelte`, `RootedTree.svelte`, `views/shared/forms/entry/DeleteAsk.svelte`, `views/shared/forms/accounts/RemoveAccount.svelte`, `views/shared/writes/AskConfirm.svelte`, `views/feeds/inbox/InboxCard.svelte`, `views/system/gallery/Gallery.svelte`, `views/system/machine/hpc/Login.svelte`, `Jobs.svelte`, `views/sessions/terminal/start/Composer.svelte`, `views/sessions/terminal/grid/TerminalGrid.svelte`, `views/boards/focus/career/CareerPanel.svelte`, `views/sources/repositories/merge/Merge.svelte`, `diff/Diff.svelte`, `views/sources/search/RefactorPreview.svelte`, `views/sources/files/sections/OpenEditors.svelte`. Why: R1's folder of fewer than 10 items. The import-order check allows the heads only in `ui/controls` or a folder above it, and each of those held 10 items at the base (How R1 was built, above); the two dialogs moving into a folder of their own is what frees the slot in `ui/controls`.
- `views/boards/focus/CommandCenterView.svelte`, `Tasks.svelte`, `career/CareerPanel.svelte`: FoldHead's importers following R1.
- `views/shared/card/pane-fold.ts` (new): the approved pane-fold file. It sits in `views/shared/card/` and not beside the heads in `ui/controls/heads/`, because it reads the pane's instance through `$lib/state/client/use` and `$lib/state/client/instance-context`, which the ui layer may not import (`boundaries.test.ts`, the ui row).
- `src/lib/state/shared/page/folds.ts` (new): `instanceFolded`, `foldedWith` (item 2) and `stateFolds`. They are read by the parsers of `state/feeds/inbox.ts`, `linkedin.ts`, `radar.ts`, `state/life/slides.ts` and `state/boards/structure/lines.ts`, and the state order check (`tests/checks/imports/order.ts`, top down client, workbench, feeds, life, sessions, system, boards, sources, forms, shared) lets those folders import `state/shared` and not `state/workbench`, so the helpers cannot sit in `state/workbench/layout/instance.ts`. Inside `state/shared` (answers, page, words, stores, lists) they sit with the page addresses in `page/`, which may import `lists/` below it. `instance.ts` is unchanged from the base.
- `src/lib/views/shared/card/feed/FeedFile.svelte` (new): the states a view drawn from one feed file shows before the file is read (waiting, no file named, the file missing, the file unreadable), each the `Empty` box the three views drew. The duplication check (`tests/checks/tree/duplication.test.ts`, 50 tokens over 8 lines) found Leads and Lit Watch drawing the same chain once Lit Watch's intro left from between its parts; Position Leads, Lit Watch and LinkedIn now draw it through FeedFile, with their own words for the missing file and LinkedIn's for no folder named. What each view draws is unchanged.
- `views/feeds/inbox/Inbox.svelte`, `linkedin/Linkedin.svelte`, `radar/Radar.svelte`, `views/sources/venues/Venues.svelte`, `views/structure/pillars/Pillars.svelte` write their folds through `stateFolds`, since the duplication check found the same toggle and reveal-unfold written in four of them.
- `views/shared/links/FolderFiles.svelte`, `views/system/machine/processes/Processes.svelte`, `views/system/machine/hpc/Hpc.svelte`, `ui/display/table/Table.svelte`, `shell/keys/workbench-keys.svelte.ts`: approved, for the reasons in the hand-back (the heading snippet given the controls and the body; the two state writes that dropped `folded`; the table header under the strip; the card cursor skipping a folded group).
- `views/system/status/Status.svelte`: not in the approved list. LineCounts and Hooks are two groups whose space between them is the view's own (item 4: "the space between one group and the next stays each view's own"), and their parent is Status.svelte, so it wraps them in `div.groups` (flex column, 16 px gap, 16 px above): the wrapper element and its style rule.
- `src/lib/state/feeds/inbox.ts`, `src/lib/state/feeds/linkedin.ts`: the Inbox's and LinkedIn's pane-state parsers read `folded` (item 6: their sections fold by their key in the pane state), as `radar.ts` and `slides.ts` in the brief's list do.
- `src/lib/data/model/model-entities.ts` (a comment at `:161` named `intro` among the meta keys) and `src/lib/ui/html.ts` (the comment of `inlineMarkdown` named "The intro"): comments item 11 made false (`spec.md:71`).
- `src/lib/views/system/workbench/Settings.svelte`: in the list as "the Settings files that hold its pane state and its table of contents press".
- No test outside the list changed.

## Judgment calls the brief left open

- The Slides groups fold under `group:<name>` (`Slides.svelte:128-130`), so a group named `order` cannot fold the Order section.
- The Catalogue's groups fold by their label; two groups with one label fold together.
- The session list's Terminals group folds under `terminals`; a workspace group under its folder path, so the two keys cannot meet.
- GroupHead gained `tip?: string`, drawn as the strip's `title`, so a session workspace group keeps its folder path under the pointer.
- Settings' section `div` keeps `data-toc-target`; on the base the section title `h3` did not carry it, so the brief's premise "both carry `data-toc-target`" held only for the group title (`List.svelte:73` on the base) and the section div.
- Settings opens a folded group through `List`'s exported `unfold(target)`, typed structurally at the `bind:this`, which kept `Settings.svelte` at 516 lines under the 520 limit; the table of contents' follower leaves out headings inside a folded group (`checkVisibility()`).
- The record page's restate on a key move keeps the folds (`withInstanceKey(entryPageState(...), 'folded', instanceFolded(instance.state))`); the project page's `choose` writes through `withInstanceKey`, so it keeps every key, where on the base it wrote `{ doc }` alone.
- The Update tray's folds are two booleans, `let schedulesOpen = $state(true)` and `let tasksOpen = $state(true)` (`UpdateTray.svelte:58-59`), kept while the page lives, so the tray imports no fold helper (the shell's row of `tests/checks/tree/boundaries.test.ts:255` allows `state/workbench/layout` as an exact module, not `layout/instance`, and names no `state/shared/page`); the tray sets `--panel-on-wall` to its own fill over a wallpaper so the strip paints the tray's fill.
- GroupHead draws the label in `span.name` (`GroupHead.svelte:118`, `:184`). A ui primitive's own class is one a view may not style, and `views/shared/links/CrossLinks.svelte` styles `.member :global(.label)` under a HELD line of the boundaries check that names Chip, Tag and TabFace as the primitives owning `.label`; a GroupHead `.label` would add a fourth owner to that line, which R1 says is not changed. No view styles `:global(.name)` (`grep -rn ":global(\.name)" src/lib` prints nothing).
- The toggle and the reveal-unfold of the views that keep `folded` in their own parsed state (Lit Watch, the Inbox, LinkedIn, Venues, Pillars) are `stateFolds` (`folds.ts:28-51`); the views that read `folded` straight from the pane state (Account setup, the Gallery, the Catalogue, Usage, Keys, the project page, the Audit, Projects, Slides) keep their own `toggleFold` over `foldedWith`, each a few lines the duplication check does not flag. `state/sources/repositories/repositories.ts:215` `toggleFolded` and `state/shared/lists/lists.ts` `toggled` compute the same toggle for other lists (the diff view's files, the Focus filter's checklists); this step leaves them as they are.
- Position Leads, Lit Watch and LinkedIn draw their before-the-file states through `FeedFile.svelte`; LinkedIn passes `unnamed`, for a feed whose folder no setting names, and its cadence line reads `data?.cadenceDays`, since the content snippet is drawn only once the feed is read but is typed without that narrowing.
- Usage's Live group under an account folds under `live:<account>`; its 10 px above is `.windows + :global([data-live])`.
- The HPC view draws no Disk quota group while it has no row.
- A pane-fold partial drawn outside a pane draws every group open and its fold writes nothing.
- `pillars.kind_other: Other` is the Other section's label; the Other section has no colour, so its heading is drawn in the muted text colour (`Pillars.svelte:125`, `tone={kind.color === '' ? undefined : toneOf(kind.color)}`).

## Host- and user-visible changes, view by view

- Every grouping heading (all views of item 6): before, five shapes (a GroupHead line in a frame, ToolButton headings, small-capital `h3`, an `h2` at `--fs-xl`, an accent `h3`); after, one rounded strip that stays at the pane's top while its group scrolls, painted on every background, 8 px above its body, with the fold control, glyph, label, count and actions. Every group folds; a reload or a move of the tab keeps the fold (the Update tray: while the page lives).
- Projects, Focus, Venues: the heading loses its frame and sticks; Venues' folded section stays in the page hidden until found, so find-in-page unfolds it.
- Lit Watch: before, an intro paragraph with the bucket legend, a ToolButton per bucket, the fold lost on reload, a 340 px grid; after, no intro, the bar ends "{n} tracked, last sweep {date}", a strip per bucket with glyph, colour and count, the 320 px card grid, the bucket's left border beside its cards, Dismissed a strip with the `dismiss` glyph, no rule above.
- Position Leads: before, an intro "Academic openings ... {n} live | {m} expired (hidden) ..." and disclosures with a rule; after, no intro, the bar ends "{n} live", Expired a strip "Expired / actioned" with the `deadline` glyph and its count, the run log a strip with the `scout` glyph.
- Inbox: the four sections and Triaged are strips with their counts; the labels no longer carry "(n)".
- LinkedIn: Ideas and Posted are strips with glyph and count ("Ideas" and "Posted", the count drawn by the strip).
- Audit: the six sections and Muted are strips; Muted was a Disclosure.
- Slides: no intro paragraph; each group a strip with its deck count (drawn by the strip, no "n slides" words); the Order section a strip.
- Pillars: no intro and no section notes; one section per `pillar_kinds` row (Pillar, Provisional, Off-pillar), then Other; the pillars proper now have a heading "Pillar".
- Data, Domains, the Map: no intro paragraph; Data's bar ends "{n} datasets ({access})".
- Sessions, Catalogue, Keys, Settings, Gallery, the Person page, the record page, the project page, the editor view, Status, Processes, Usage, HPC, Account setup, the Update tray: their headings are strips and fold; Settings' section titles, the Gallery's and the Catalogue's sub-headings are plain SubHead labels; the Catalogue group's chord and the Schedules' Add sit at the strip's right end.
- The Settings table of contents: a press on a folded group or a section inside one opens the group first.
- The card grids of Projects, a collection, Venues, Data, Pillars, Domains, Lit Watch, Position Leads and LinkedIn: 320 px columns that keep their width; Pillars and Domains were 290 px `auto-fit`, Lit Watch, Leads and LinkedIn 340 px.
- A hub file holding `intro:`: before, read and drawn under the view's bar; after, a `not_declared` finding until the line goes (R2), and nothing drawn.
- The page console: no `state_proxy_equality_mismatch` on load; a theme whose file failed is not fetched again.

## Changed lines of existing assertions, allow lists and predicates

From `diff` of each changed test file against the base copy:

| File and line | Before | After |
|---|---|---|
| `tests/checks/config/config-folder.test.ts:241` | (none) | `'pillar_kinds',` added to the key list |
| `tests/state/forms/page-entry.test.ts:123` | `['a lead, whose expired disclosure opens', 'leads', { expiredOpen: true }],` | `['a lead, whose Expired group opens', 'leads', { expiredOpen: true }],` |
| `tests/state/forms/page-entry.test.ts:124` | `['a paper, whose dismissed disclosure opens', 'radar', { dismissedOpen: true }]` | `['a paper, whose Dismissed group opens', 'radar', { dismissedOpen: true }]` |

The page-entry rows change their titles only; the expected states are unchanged. The other test changes are inputs, not assertions: `normalise.test.ts:58` `meta: { title: key.toUpperCase(), intro: 'about it' }` to `meta: { title: key.toUpperCase() }` and `:236` `intro: 'dataset registry',` removed; `collections.test.ts:66`, `:79`, `:93` the `intro:` lines removed and the comments at `:57` and `:100` no longer name an intro; `registries.test.ts:54` `'intro: the local caches',` removed; `hub-vocab.test.ts:213-218` the new row of case 20.

## Head comments of the changed files

Rewritten (the head comment states what the file now does): GroupHead, FoldHead and FoldControl (line 2: "primitive"), SubHead and CardGrid (new), pane-fold.ts (new), Projects, Lanes, Band, Venues, Collection, Data, Domains, Pillars, Map, Bucket, Radar, Leads, Inbox, Linkedin, Audit, Slides, Order, SessionWorkspace, TerminalRows, Catalogue, Keys, List, Settings (one sentence added), Gallery, Person, Entry, EntryFolder, Referrers, Project, Latex, Editor, LineCounts, Hooks, AppHosts, Usage, Quota, AccountSetup, UpdateTray, ScheduleList, FolderFiles, RegistryHead, `schema/hub.ts`, `lines.ts`, `radar.ts`, `slides.ts`, `inbox.ts`, `linkedin.ts`, `state/shared/page/folds.ts` (new), `views/shared/card/feed/FeedFile.svelte` (new), `config/catalogs/vocab.yml` (line 4 names `pillar_kinds` among the lists replaced whole), `config/options/catalogs/vocab.yml` (its head line likewise), CareerPanel (the lines naming FoldHead's path), `ui/forms/Prompt.svelte` and `views/shared/writes/AskConfirm.svelte` (the sentence naming Confirm's path), and the comments named under "outside the paths" (`model-entities.ts:161`, `html.ts:458`, `workbench-keys.svelte.ts:387`, `Table.svelte:105`, `appearance.svelte.ts:87`).

Still true, untouched: Confirm and CloseQuestion (moved, text unchanged), the other importers of Confirm and CloseQuestion (their import line only), `normalise.ts`, `model-collections.ts`, `audit/projects.ts`, `vocab.ts`, `vocab-keys.ts`, `hub-keys.ts`, `in-place.ts`, `hub-names.ts` (the comment at `:686-741` rewrapped to 100 columns, its words unchanged), `page-entry.ts` (the head comment; `revealState`'s own comment rewritten), Tasks, CommandCenterView, Processes, Hpc, Status.

## What in the brief was wrong or impossible

- Item 6's Update tray against the layer rule, case 18 and case 21: raised in the hand-back and ruled (R1 to R3 above).
- "What is on the tree" says Settings' section title (`List.svelte:131`, an `h3`) carries `data-toc-target`; on the base the attribute is on the section's `div` (`grep -n "data-toc-target" ../O88-base/src/lib/views/system/workbench/settings/List.svelte`), and it stays there.
- Case 13's "no file of `FoldHead` or its three users is in the diff" cannot hold under R1, which moves FoldHead; the three users change by their import line only (case 13 above).
- The paths list names `src/lib/views/shared/card/heads/GroupHead.svelte` and `SubHead.svelte` (new); under R1 they are in `src/lib/ui/controls/heads/`.
- The brief removes six `{@html}` sites (the four of `views/feeds/radar/RadarIntro.svelte`, which item 11 deletes, and the two intro sites of `Pillars.svelte`), and `tests/checks/source/html-sites.test.ts:242`, `expect(counted.length).toBeGreaterThanOrEqual(34)`, is a floor on how many sites the scanner finds. On the changed tree it finds 33, so the check is red: `AssertionError: expected 33 to be greater than or equal to 34`. `grep -rho "{@html" <tree>/src/lib --include='*.svelte' | wc -l` prints 40 on the base copy and 34 here, and the per-file count differs only in `views/feeds/radar/RadarIntro.svelte:4` and `views/structure/pillars/Pillars.svelte:2`. Lowering the floor to 33 is a threshold change in a committed check, which the rules leave to the orchestrator, so the line is unchanged; the floor guards the scanner, and the 33 sites it finds all pass the check's first case ("draws the sanitiser, inline Markdown, the catalog, or a named exception").
- Item 14's `data-map.md:82` is line 80 on this tree (`grep -n "may set these" docs/data-map.md` prints `80:`), and its list's `venue_categories` line is 117.

## Doc text

`docs/HELP.md` and `docs/data-map.md` are not changed by this step. Each entry gives the current line as `grep -n` prints it and its replacement, or a new line and where it goes. Line 294 is over 9,000 characters; its entry gives the one sentence that changes, old and new, which is the whole change to the line.

1. New line, inserted as the first item under `292:### Notes on single views` (after the blank line 293):

   `- **Groups.** A view that groups what it draws heads each group with one strip: the fold control, the group's glyph, its label in its colour and its count, and at the right end what acts on the whole group, such as the Schedules' Add or a Views group's key chord. The strip stays at the top of the pane while its group scrolls under it, and the next group's strip takes its place at the end of the group. A press on the fold control, or Enter or Space on it, folds or unfolds the group, and the tab keeps it folded, so a reload or a move of the tab keeps it; the Update tray keeps its folds until the page reloads. A find-in-page match inside a folded group unfolds it, and so does a card revealed from the palette or a press in Settings' table of contents on the group or a section in it. A search never folds or unfolds a group, and a heading's count is what the search leaves. Dismissed, Expired, the run log, Triaged and Muted start folded, and every other group starts open. A heading inside a group, such as a Settings section or a sub-heading of the Gallery or the Views catalogue, is a plain label that does not fold.`

2. Line 294 (Focus). The sentence

   `Each cluster, each such lane section and the Funding | positions | teaching band, headed by its count, folds by the control before its heading, and the tab remembers it, so a reload or a move of the tab keeps it folded; a find-in-page match inside a folded one unfolds it.`

   becomes

   `Each cluster, each such lane section and the Funding | positions | teaching band is a group headed by its count, and folds as every group does (Groups, above).`

3. Line 313 (Map). Current:

   `313:- **Map.** Press a node to fix it, drag to move it; re-tune lays the map out again. The map fills the pane. A link drawn in link mode, a project added or taken away and a pane resized leave the other nodes where they are; a new project is placed beside the nodes it links to. A label with no room on the right of its node sits on its left. A label that would cross another label, a node or a line, or that would be cut by the pane's edge, shows when its node is hovered or focused.`

   Replacement:

   `- **Map.** The pillars and the projects, linked by pillar membership and by directed related edges: a one-way edge has one arrow, from the manifest that lists the other, and a mutual edge, where each manifest lists the other, has two arrowheads and its own colour. The layout is Graphviz's neato. Press a node to fix it, drag to move it; re-tune lays the map out again from another start. A press on a project opens its project page. The map fills the pane. A link drawn in link mode, a project added or taken away and a pane resized leave the other nodes where they are; a new project is placed beside the nodes it links to. A label with no room on the right of its node sits on its left. A label that would cross another label, a node or a line, or that would be cut by the pane's edge, shows when its node is hovered or focused.`

4. Line 314 (Data). Current:

   `314:- **Data.** A card shows the dataset's folder (`path:`), its notes and how it comes back. A set whose sources are all downloads has a Recover control; a library set, a set to ask its owner for and a set built from another show the call, the contact, or the sets and the script instead.`

   Replacement:

   `- **Data.** The datasets of the file the `data` entry of the hub's collections list names, with their provenance and the sources each comes back from. The bar ends with how many datasets there are and their access summary, as in "4 datasets (2 open | 2 credentialed)". A card shows the dataset's folder (`path:`), its notes and how it comes back. A set whose sources are all downloads has a Recover control; a library set, a set to ask its owner for and a set built from another show the call, the contact, or the sets and the script instead.`

5. Line 325 (Venues). Current:

   `325:- **Venues.** The venues are drawn in one section per row of `venue_categories` in `vocab.yml`, in its order, each headed by the row's `label` and its count, then an Other section for the venues whose category no row names; a section with no venue is not drawn. A row with `ribbon: true` draws the month ribbon of its venues' deadlines and meetings over its cards (oculus sets it on Conferences). A press on a heading's fold control folds its section, and the tab keeps it folded; a folded section draws no cards and no ribbon. With several hubs the rows are the union of every hub's, each key once with the first hub's row.`

   Replacement:

   `- **Venues.** The venues of the file the `venues` entry of the hub's collections list names, in one section per row of `venue_categories` in `vocab.yml`, in its order, each headed by the row's `label` and its count, then an Other section for the venues whose category no row names; a section with no venue is not drawn. A row with `ribbon: true` draws the month ribbon of its venues' deadlines and meetings over its cards (oculus sets it on Conferences). The months of a ribbon are approximate, since a call and its dates move from year to year. A section folds as every group does (Groups, above), and a folded section shows no cards and no ribbon. With several hubs the rows are the union of every hub's, each key once with the first hub's row.`

6. New line (Lit Watch), inserted after `328:- **Literature.** ...`:

   `- **Lit Watch.** The new papers that touch the active and the manuscript projects, each in a bucket of `radar_buckets` in `vocab.yml`, one group per bucket under its glyph, its label and its colour: oculus's list is Pre-emption risk, Idea sparks (the cross-pollination tied to the ideas folder), Cite / baseline and Adjacent. The bar ends with how many papers are tracked and the date of the last sweep. Running Lit Watch from the Update tray sweeps again. Dismissed holds the papers dismissed.`

7. New line (Pillars and Domains), inserted after the new Lit Watch line:

   `- **Pillars.** The research lines of the file the `pillars` entry of the hub's collections list names, and the projects on each: a project is on a line when its manifest's `pillars:` names it. The lines are drawn in one section per row of `pillar_kinds` in `vocab.yml`, in its order, each headed by the row's `label` in its colour with its count, then an Other section for the lines whose `kind:` names no row, a line with no `kind:` among them. Oculus's list is Pillar, Provisional (a candidate line not yet promoted to a pillar, drawn apart so it is seen without counting as one) and Off-pillar (work outside the current programme, kept as an explicit marker so it does not read as an orphan). The Orphans card is drawn in the first row's section, and the Archival card, while a project is archived, in the Off-pillar section, or under Other when the list holds no `offpillar` row. An off-pillar line's card is muted and carries no in-flight or venue-tier counts.`

   `- **Domains.** The projects by application domain, the field, in the colour of their cards, from the file the `domains` entry of the hub's collections list names. Pillars group the same projects by method.`

8. Line 330 (Position Leads). Current:

   `330:- **Position Leads.** Applied, in the card's strip and in its menu's Status submenu, opens a new Applications entry filled from the lead and marks the lead applied. When more than one hub holds Applications, Applied opens the menu of those hubs, the primary first, and the entry goes to the Applications file of the hub picked. Decline, in the Status submenu, marks it declined; Reopen undoes that. Each control writes the one status of the hub's `lead_statuses` carrying its flag (`lead_applied`, `lead_declined`, `default_lead`), and is drawn disabled, its tip saying why, while no status carries it or two do (a finding naming both). The declined toggle holds back the leads whose status carries `lead_declined`: `declined` in oculus's words; `dismissed` carries only `lead_closed`, so a dismissed lead is off the radar and the toggle does not hold it back.`

   Replacement:

   `- **Position Leads.** Academic openings, scouted automatically (BE/NL/LU); a card's fit chip is strong, moderate or reach. The bar ends with the count of the live leads, and Expired / actioned, which starts folded, is headed by the count of the expired leads. Applied, in the card's strip and in its menu's Status submenu, opens a new Applications entry filled from the lead and marks the lead applied. When more than one hub holds Applications, Applied opens the menu of those hubs, the primary first, and the entry goes to the Applications file of the hub picked. Decline, in the Status submenu, marks it declined; Reopen undoes that. Each control writes the one status of the hub's `lead_statuses` carrying its flag (`lead_applied`, `lead_declined`, `default_lead`), and is drawn disabled, its tip saying why, while no status carries it or two do (a finding naming both). The declined toggle holds back the leads whose status carries `lead_declined`: `declined` in oculus's words; `dismissed` carries only `lead_closed`, so a dismissed lead is off the radar and the toggle does not hold it back.`

9. Line 326 (Present), for the Slides view. Current:

   `326:- **Present.** A deck is a folder with a `present.yml` and Markdown slides (several per file, split by `---`). The deck menu opens the portfolio deck (`portfolio_deck`), a project's `present/` deck, or one opened from Files. Right-click a slide to edit, add, duplicate or delete it; History undoes each. A dropped image is copied into the deck. Export to PDF writes `<name>.pdf` in the deck's folder (in the app; the print dialog in a browser). Notes come from the slide's `notes:` key.`

   Replacement:

   `- **Present.** A deck is a folder with a `present.yml` and Markdown slides (several per file, split by `---`). The deck menu opens the portfolio deck (`portfolio_deck`), a project's `present/` deck, or one opened from Files. Right-click a slide to edit, add, duplicate or delete it; History undoes each. A dropped image is copied into the deck. Export to PDF writes `<name>.pdf` in the deck's folder (in the app; the print dialog in a browser). Notes come from the slide's `notes:` key. The Slides view of a deck lists its order, what the deck shows entry by entry, and its groups, each listing the decks whose slides it shows in the order it shows them. Drag or step an entry of the order to move it. Tick a deck to add it to a group and untick it to take it out; drag or step a ticked deck to move it, or drag it onto another group, folded or open. A deck marked found is on the group because the group discovers decks.`

10. Inbox (`331:`), LinkedIn (`332:`), Audit (`337:`), Settings (`339:`), the Views catalogue (`54:`), Keys (`128:`) and the Person page (`329:`): each line stays true; what changed for them, the headings that fold and stay at the top, is the new Groups line (1). No replacement.

11. Line 534 (`catalogs/`). Current, as `grep -n` prints it:

   ``534:  - `catalogs/`: the composer's agents, file nesting, glyphs, icons, LaTeX tables, Unicode math, and `vocab.yml` (the palette, `stages`, `forms`, `chips`, `statuses`, `lead_statuses`, `tiers`, `roles`, `categories`, `research_audit`, Focus lanes, venue tiers, radar buckets).``

   Replacement:

   ``  - `catalogs/`: the composer's agents, file nesting, glyphs, icons, LaTeX tables, Unicode math, and `vocab.yml` (the palette, `stages`, `forms`, `chips`, `statuses`, `lead_statuses`, `tiers`, `roles`, `categories`, `research_audit`, Focus lanes, venue tiers, radar buckets, pillar kinds).``

12. Line 538 (vocabulary merge). The phrase `` `focus_clusters`, `focus_lanes`, `fund_stages`, `roles`, `venue_categories`, `venue_tiers` and `radar_buckets` are replaced whole`` becomes `` `focus_clusters`, `focus_lanes`, `fund_stages`, `roles`, `venue_categories`, `pillar_kinds`, `venue_tiers` and `radar_buckets` are replaced whole``; the rest of the line is unchanged.

13. `docs/data-map.md:80`. Two phrases change, the rest of the line unchanged: `may set these 49 keys and no others` becomes `may set these 50 keys and no others`, and `` `focus_clusters`, `focus_lanes`, `fund_stages`, `roles`, `venue_categories`, `venue_tiers` and `radar_buckets` whole`` becomes `` `focus_clusters`, `focus_lanes`, `fund_stages`, `roles`, `venue_categories`, `pillar_kinds`, `venue_tiers` and `radar_buckets` whole``. The count: the list's lines 83 to 131 are 49 keys (`awk 'NR>=83 && NR<=131' docs/data-map.md | wc -l` is 49) and `pillar_kinds` is the 50th.

14. `docs/data-map.md`, after `117:venue_categories:         # the categories of venues, rows { key, label, ribbon? }, in order (whole)`, a new line:

   `pillar_kinds:             # the kinds of pillar lines, rows { key, label, color }, in order (whole)`

15. `docs/data-map.md`, the foreign keys block, after `188:  themes: [an option of the themes field]` (the end of the `venues:` group), two new lines:

   ```
   pillars:
     kind: vocab pillar_kinds
   ```

## Hub text

For the hub commit at landing, since the builder does not read the hub:

- In each of the 11 files `.oculus/data/research/venues.yml`, `data/research/data.yml`, `data/research/statements.yml`, `data/academic/funding.yml`, `data/academic/applications.yml`, `data/academic/education.yml`, `data/academic/joint-work.yml`, `data/academic/events.yml`, `data/pillars/pillars.yml`, `data/pillars/domains.yml`, `data/literature/literature.yml` (under `.oculus/`), the line that starts `intro:` is removed, with any continuation lines of its scalar. Until it is removed the file raises `findings.schema.not_declared intro` (R2).
- In `.oculus/data/pillars/pillars.yml`, the schema line of the field `kind` becomes:

  `  - { field: kind, type: select, foreign_key: vocab.pillar_kinds, help: "The line's kind, a key of pillar_kinds." }`

  No pillar line changes: the lines carry `kind: pillar`, `provisional` or `offpillar`, the keys oculus ships.
