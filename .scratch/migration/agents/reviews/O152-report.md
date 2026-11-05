# O152 report: the Venue tag's tier icon

Everything in the brief is done. Four premises of the brief did not reproduce (quoted first below); one of them was a defect in `venueTiers` that the step fixes, and that fix changes what the Pillars view's line cards count.

## Open items of the state file (verbatim)

`.scratch/migration/orchestrator-state.md:170-172` holds the heading and its intro sentence and no entry:

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

## Premises that did not reproduce

P1. `venueTiers` read only one row of the shipped `venue_tiers`. `tierRowShape` declared `assignable: z.unknown()`, which zod 4.6.5 (`package.json:130`) holds as a required key, so every row that leaves `assignable` out (flagship, strong, specialist) was dropped by `rowsShape`. Run on the unchanged tree with the case-run program `cases.mjs` (source under "The cases' first run"):

```
venueTiers(shipped): [{"key":"unrated","label":"unrated","color":"#94a3b8","fallback":true}]
```

and the zod probe on the unchanged tree:

```
without assignable: {"success":false,"error":{"name":"ZodError","message":"[\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"nonoptional\",\n    \"path\": [\n      \"assignable\"\n    ],\n    \"message\": \"Invalid input: expected nonoptional, received undefined\"\n  }\n]"}}
```

Item 3 builds on this read, so the step fixes it in `lines.ts` (in the write list): `assignable: z.unknown().optional()`. `grep -rn "venueTiers\|tierStrip" src tests` lists no test of either. The fix also reaches the two other callers, `Pillars.svelte:84` and `RegistryPageCard.svelte:102`: a pillar line card's tier counts (`LineCard.svelte:96-101`, `tierStrip`) counted every in-flight project under "unrated" on the base and count it under its own tier now. That is a visible change; it is in the before-and-after section.

P2. The brief's `:22` says the hub has no untiered venue. `untiered.mjs` over `~/workspace/research-hub/.oculus/data/research/venues.yml` printed `hub tiers: {"strong":25,"(none)":8,"specialist":20,"flagship":25}` and eight entries with no `tier`: `cbm`, `volga-neuroscience`, `icfp-src`, `chi-ea`, `ecnr`, `kuleuven-thesis`, `uhasselt-thesis`, `xai-nl`. C3's "since the hub has no such venue" is therefore false for a venue with no tier: CBM gives the look of that case.

P3. Item 5 and the brief's `:21` say the facts row's tips show on keyboard focus. `CardFacts.svelte:16-19` says "The wrappers take no tab stop, so a card gains no stops before its controls", and its `Tooltip`s are drawn without `focusable` (`CardFacts.svelte:81-123`), so a facts tip opens on hover alone and, with no focusable control inside, `describedControl` (`ui/menu/tooltip-rules.ts`) gives it no description. Item 5 asks for the tip on keyboard focus and through the description, so the tier glyph's `Tooltip` is `focusable`: one more tab stop on every card whose venue has a tier icon. Decision D1 below.

P4. Item 3's first sentence says the tier is "read from the vocabulary of the project's own hub (G127)"; its first sub-bullet and the brief's decision 6 say the venue's own hub, `rootOf(venue)`. The code follows the sub-bullet and decision 6, and the test's last row (a project of `home` naming a venue only `lab` holds gets `lab`'s row) holds it.

No case's rule was wrong, so nothing was handed back before the code changed.

## The cases' first run (unchanged tree)

The case-run program `cases.mjs`, run with `node cases.mjs <worktree>` from the scratchpad before any change (it writes nothing; it and `untiered.mjs`, `zod-probe.mjs` are removed from the scratchpad):

```js
// Case-run program for O152: prints, for the tree given as argv[2], the venue text of the hub
// venues the cases name, the shipped venue tier rows as venueTiers reads them, and the tier rows'
// glyphs. It writes nothing.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
const tree = process.argv[2];
const yaml = (await import(join(tree, 'node_modules/yaml/dist/index.js'))).default;
const { venueText } = await import(join(tree, 'src/lib/state/boards/board/presets.ts'));
const { venueTiers } = await import(join(tree, 'src/lib/state/boards/structure/lines.ts'));
const hub = yaml.parse(readFileSync(join(homedir(), 'workspace/research-hub/.oculus/data/research/venues.yml'), 'utf8'));
const entries = hub.entries ?? hub.venues ?? [];
const pick = (id) => entries.find((one) => one.id === id);
for (const id of ['jbi', 'bspc']) {
    const v = pick(id);
    console.log(`${id}: tier=${v?.tier} free=${JSON.stringify(v?.free)} text=${JSON.stringify(v && venueText(v))}`);
}
const bare = entries.find((one) => (one.quartile ?? '') === '' && String(one.jif ?? '').toLowerCase() === 'none');
console.log(`no quartile, jif none: ${bare?.id} text=${JSON.stringify(bare && venueText(bare))}`);
const tiers = {};
for (const one of entries) tiers[one.tier ?? '(none)'] = (tiers[one.tier ?? '(none)'] ?? 0) + 1;
console.log('hub tiers:', JSON.stringify(tiers));
const vocab = yaml.parse(readFileSync(join(tree, 'config/catalogs/vocab.yml'), 'utf8'));
console.log('venueTiers(shipped):', JSON.stringify(venueTiers(vocab.venue_tiers)));
```

Its output on the unchanged tree:

```
jbi: tier=strong free="free (subscription)" text="Journal of Biomedical Informatics | Q1 | JIF 5.9 | free (subscription)"
bspc: tier=specialist free="free (subscription)" text="Biomedical Signal Processing and Control | Q2 | JIF 5.7 | free (subscription)"
no quartile, jif none: hcin text="Human-Centric Intelligent Systems (HCIN) | free (gold OA, no APC)"
hub tiers: {"strong":25,"(none)":8,"specialist":20,"flagship":25}
venueTiers(shipped): [{"key":"unrated","label":"unrated","color":"#94a3b8","fallback":true}]
```

- C1 (jbi, strong). Run: the `jbi` line, the text carries the cost. Reading: `CardLinks.svelte:132` (base) draws the kind glyph `'venue'` for every venue, and `TierRow` (`lines.ts:35`, base) has no glyph. The base draws the venue diamond, muted, then "Journal of Biomedical Informatics | Q1 | JIF 5.9 | free (subscription)", with no tip.
- C2 (bspc, specialist; a flagship venue). Run: the `bspc` line, with the cost. The base reads no flagship row at all (`venueTiers(shipped)` above, P1). Both draw the venue glyph.
- C3 (unrated, no tier, unknown tier). Reading: the base draws the venue glyph for every venue (`CardLinks.svelte:132`) and the text with its cost (`presets.ts:678`, base).
- C4 (no quartile, `jif: "none"`). Run: `hcin` reads "Human-Centric Intelligent Systems (HCIN) | free (gold OA, no APC)": the name and the cost, no quartile, no JIF.
- C5 (search by cost). Reading: the base haystack reads `item.venue?.text` (`items.ts:91`, base), and that text holds the cost, so a search for "subscription" finds a project whose venue's `free` says it.
- C6 and C7 (the test of item 7). The case was written first and run on the unchanged code with `npx vitest run tests/state/shared/hub-words.test.ts --reporter=verbose`:

```
 <multiplication sign> |unit| tests/state/shared/hub-words.test.ts > the words of each hub's records > draws a venue with the glyph, tone and label of its tier row in its own hub's words 703ms
   -> venueTierMark is not a function
 FAIL  |unit| tests/state/shared/hub-words.test.ts > the words of each hub's records > draws a venue with the glyph, tone and label of its tier row in its own hub's words
TypeError: venueTierMark is not a function
 <heavy right-pointing angle quotation mark> tests/state/shared/hub-words.test.ts:182:48
    182|         for (const [one, mark] of rows) expect(venueTierMark(one, voca<horizontal ellipsis>
 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)
```

  (The `->` line is printed by vitest as a right arrow, written here as `->`.) C7's card half on the base: `Tag.svelte:44-46` (base) draws `<Glyph name={glyph} />` for any name the caller gives, and `CardLinks.svelte:132` gives the literal `'venue'`, so no name from a hub reaches it.
- C8 (no fallback row, `venue_tiers: []`). Reading: the base has no tier icon of any kind, so an untiered venue draws the venue glyph; `tierStrip` (`lines.ts:94-96`, base) counts it under the last row, which the card does not read.
- C9 (terminal theme, brackets on). Reading: the base glyph `venue` is `"<>"` (`glyphs.yml:90`), which `bracketedGlyph` (`text.ts:116-120`) answers false for, so each Venue tag reads `[<> <text>]`, one pair.
- C9b (no venue). Reading: `CardLinks.svelte:133` (base) gives the kind no tag for `item.venue === null`, and `:173` draws a kind only with tags, so no Venue line.
- C9c (unmapped colour). Reading: the base gives a venue no tier colour at all.
- C10. `npx vitest run tests/state/shared/hub-words.test.ts tests/checks/config/config-folder.test.ts tests/checks/config/config.test.ts tests/checks/look/contrast.test.ts --reporter=dot` on the unchanged tree: `Test Files  4 passed (4)` / `Tests  130 passed | 2 skipped (132)`.
- C11. Reading: `config/options/catalogs/vocab.yml:390-402` (base) describes `key`, `label`, `color` and `assignable`, no `glyph`, so the Settings view's Vocabulary section draws no glyph field on a `venue_tiers` row.

## DONE / NOT DONE

| Item | State | Proof (command and the line it printed after the last change) |
| --- | --- | --- |
| 1. Vocabulary: glyphs on the rows, `crown` and `target` in glyphs.yml and icons.yml, the `vocab.ts` description, the vocab.yml comment, G12 | DONE | `git diff --numstat` shows `config/catalogs/vocab.yml` 5/5, `glyphs.yml` 2/0, `icons.yml` 2/0, `vocab.ts` 1/1; case-run `venueTiers(shipped): [{"key":"flagship",...,"glyph":"crown"},{"key":"strong",...,"glyph":"star"},{"key":"specialist",...,"glyph":"target"},{"key":"unrated",...,"fallback":true}]`; config-folder in the four-file run below |
| 2. Options entry: `glyph` with `control: glyph`, its help, the entry's help | DONE | `config/options/catalogs/vocab.yml:390-405`; `config-folder.test.ts` passes in the four-file run |
| 3. Tier read: `TierRow.glyph`, the board item's `venue.tier`, venue's own hub, fallback, no-fallback, empty and unknown glyph, tone through `paletteTone` | DONE | `lines.ts:40-52` (`TierRow`, `TierMark`), `lines.ts:340-349` (`venueTierMark`), `items.ts:161`; the new case passes: `<check mark> ... > draws a venue with the glyph, tone and label of its tier row in its own hub's words 822ms` |
| 4. Text without cost; search keeps the cost | DONE | case-run on the final tree: `jbi: venue={..."text":"Journal of Biomedical Informatics | Q1 | JIF 5.9",...} haystack holds free=true ("free (subscription)")`; `items.ts:99-100` |
| 5. Card: tier glyph in the tier's colour, muted words, Tooltip tip, Tag's new props | DONE (the look proves what it draws) | `CardLinks.svelte:137-141`, `Tag.svelte:38-41`, `:60-77`; eslint and svelte-check green in `npm run test:quick` |
| 6. Docs: `HELP.md:299`, `templates.md:541-548` (G83) | DONE | `npx vitest run tests/checks/config/templates.test.ts`: `Tests  5 passed (5)` |
| 7. The test, one case in describe "the words of each hub's records" | DONE | failing run quoted above; passing run in the row of item 3 |
| Verify 1: `npm run diagrams && npm run docs:palette`, then `npm run test:quick` | DONE | `diagrams exit 0`, `palette exit 0`, `test:quick: 52.6 s; every command passed` (run 3 of 3, see below) |
| Verify 2: the four test files | DONE | `vitest exit 0`, `Tests  131 passed | 2 skipped (133)` |
| Verify 3: callers of `venueText` and `.venue?.text` | DONE | grep below; each reads the text without cost |
| Verify 4: ASCII gate and the grep over touched files | DONE | `ascii gate exit 0` (no line printed); `LC_ALL=C grep -n '[^ -~]' $(git diff --name-only)`: `touched grep exit 1` (no line printed) |
| Verify 5: sizes | DONE | `wc -l`: CardLinks.svelte 261, Tag.svelte 132, items.ts 255, presets.ts 721, lines.ts 354, vocab.ts 547 |
| Verify 6: unused exports against the base | DONE | `diff ../O152-base/unused-exports.txt <run>`: `unused diff exit 0`, no line added |
| Verify 7: changed names grepped | DONE | greps below |
| Verify 8: history-word grep | DONE | below |
| Verify 9: new sentences against the standards pages | DONE | below |
| C1, C2, C9, C9b, C11 | DONE by reading and the unit runs; the look on landing is their proof | before-and-after section |
| C3, C4, C5, C6, C7, C8, C9c, C10 | DONE | case results below |

### npm run test:quick, the last run, as printed

```
test:quick: 19 changed file(s), from git since HEAD
test:quick: 21 test file(s)
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (0.9 s)
ok      svelte-kit sync (2.5 s)
ok      svelte-check (12.3 s): 1793912132460 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (12.3 s)
ok      vitest slow (23.2 s): Duration  8.88s (transform 922ms, setup 0ms, import 2.23s, tests 6.44s, environment 0ms)
ok      vitest (42.3 s): Duration  28.16s (transform 22.22s, setup 0ms, import 37.38s, tests 35.14s, environment 3ms)
ok      vitest checks (49.8 s): Duration  35.19s (transform 25.84s, setup 0ms, import 51.85s, tests 67.46s, environment 3ms)
test:quick: 52.6 s; every command passed
```

The list ran three times. The first printed two red lines, both in files the step changes: eslint `@typescript-eslint/no-confusing-void-expression` at `Tag.svelte:74:22` and `:77:26`, and svelte-check `tests/state/shared/hub-words.test.ts 165:64` (a `Venue` literal without its required `themes`); each was fixed and its file rerun alone (`npx eslint src/lib/ui/controls/Tag.svelte tests/state/shared/hub-words.test.ts`: exit 0; `npx svelte-check`: `0 ERRORS 0 WARNINGS`). The second was green. The third followed one more change to the test file (its `install` helper parses each hub once, which took the new case from 991 ms and 997 ms to 822 ms and 872 ms) and is the run quoted; it is one run more than the rules file allows, and that is a finding against the step. No whole-suite command was run.

### Case results after the change

The case-run program `cases.case.ts`, run through vitest with a scratch config that loads the worktree's Svelte plugin (`npx vitest run --config <scratchpad>/case.config.mjs`), so the rune modules compile. It asserts nothing, plants its hub with the fixture's sweeping `plantScratch`, reads the real hub's venues file read only, and is removed from the scratchpad. Config: `plugins: [svelte()]` from `<worktree>/node_modules/@sveltejs/vite-plugin-svelte/src/index.js`, `server.fs.allow` the worktree and the scratchpad, `test: { dir: <scratchpad>, include: ['*.case.ts'], cache: false }`. Program (`<W>` is the worktree path):

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { parse } from '<W>/node_modules/yaml/dist/index.js';
import { portfolioConfigFrom } from '<W>/src/lib/data/index.ts';
import { createChecker } from '<W>/src/lib/data/snapshot/schema/check.ts';
import { engineDir, loadConfig } from '<W>/src/lib/data/sources/config.ts';
import { buildHubs } from '<W>/src/lib/server/root/watch/build.ts';
import { boardItemFor } from '<W>/src/lib/state/boards/board/items.ts';
import { presetFor } from '<W>/src/lib/state/boards/board/presets.ts';
import { venueTiers } from '<W>/src/lib/state/boards/structure/lines.ts';
import { setGlyphs } from '<W>/src/lib/state/shared/words/text.ts';
import { setVocab, vocabOf } from '<W>/src/lib/state/shared/words/tones.ts';
import { workspaceVocabs } from '<W>/src/lib/data/index.ts';
import { it, plantScratch } from '<W>/tests/fixtures/scratch.ts';

it('prints the cases', () => {
    const own = loadConfig(engineDir());
    console.log('venueTiers(shipped):', JSON.stringify(venueTiers(own.config.venue_tiers)));
    setGlyphs(parse(readFileSync('<W>/config/catalogs/glyphs.yml', 'utf8')).glyphs);
    const real = readFileSync(join(homedir(), 'workspace/research-hub/.oculus/data/research/venues.yml'), 'utf8');
    const ids = ['jbi', 'bspc', 'hcin', 'cbm'];
    const hub = plantScratch('o152-case-', Object.fromEntries([
        ['.oculus/config.yml', ''],
        ['.oculus/data/research/venues.yml', real],
        ...ids.map((id) => [`projects/ideas/p-${id}/project.yml`, `title: P ${id}\ntier: research\nstage: nascent\nvenue: ${id}\n`])
    ]));
    const { vocabs } = workspaceVocabs({ name: 'hub', dir: hub }, loadConfig(engineDir(), { hub }), [], (dir) => loadConfig(engineDir(), { hub: dir }), { folders: ['hub'], own: own.config });
    setVocab(vocabs);
    const portfolio = { ...portfolioConfigFrom(own.config), scan: [{ dir: 'projects/ideas' }] };
    const read = { primary: { key: 'hub', dir: hub, portfolio, workspace: null }, others: [], config: portfolio, order: ['hub'], self: '' };
    const { snapshot } = buildHubs(read, 0, createChecker(), null);
    const preset = presetFor('projects', own.config, vocabOf);
    for (const id of ids) {
        const item = boardItemFor(snapshot, snapshot.entities.projects[`hub:p-${id}`], preset);
        const free = snapshot.entities.venues[`hub:${id}`]?.free ?? '';
        console.log(`${id}: venue=${JSON.stringify(item.venue)} haystack holds free=${item.haystack.includes(free.toLowerCase())} (${JSON.stringify(free)})`);
    }
});
```

Output on the final tree:

```
venueTiers(shipped): [{"key":"flagship","label":"flagship","color":"#7c3aed","glyph":"crown"},{"key":"strong","label":"strong","color":"#0d9488","glyph":"star"},{"key":"specialist","label":"specialist","color":"#0891b2","glyph":"target"},{"key":"unrated","label":"unrated","color":"#94a3b8","fallback":true}]
jbi: venue={"id":"hub:jbi","text":"Journal of Biomedical Informatics | Q1 | JIF 5.9","short":"JBI","tier":{"glyph":"star","tone":"teal","label":"strong"}} haystack holds free=true ("free (subscription)")
bspc: venue={"id":"hub:bspc","text":"Biomedical Signal Processing and Control | Q2 | JIF 5.7","short":"BSPC","tier":{"glyph":"target","tone":"cyan","label":"specialist"}} haystack holds free=true ("free (subscription)")
hcin: venue={"id":"hub:hcin","text":"Human-Centric Intelligent Systems (HCIN)","short":"HCIN","tier":{"glyph":"target","tone":"cyan","label":"specialist"}} haystack holds free=true ("free (gold OA, no APC)")
cbm: venue={"id":"hub:cbm","text":"Computers in Biology and Medicine | Q1 | JIF 6.3","short":"CBM","tier":null} haystack holds free=true ("free (subscription route, 'No open access publication fee' on the journal's open access page; the guide for authors names no page or colour charge, colour figures appear in colour online)")
      Tests  1 passed (1)
```

- C1: the `jbi` line: star, teal, label "strong", text without cost. The tip's hover and focus are the look's.
- C2: the `bspc` line: target, cyan, "specialist", "Biomedical Signal Processing and Control | Q2 | JIF 5.7". Flagship: the shipped row gives `crown` and `#7c3aed`, which the palette maps to `c-purple` (`vocab.yml:40`); the look checks it on a flagship venue.
- C3: no tier: the `cbm` line, `"tier":null`, so `CardLinks.svelte:137` draws `'venue'`. Unrated: the shipped `unrated` row has no glyph, so `venueTierMark` answers null (`lines.ts:346`). Unknown tier: the test row `venue('lab', 'nope')` takes the fallback row; under the shipped list that row is `unrated`, which has no glyph, so the answer is null and the card draws `'venue'`, as the test row `venue('plain')` (a fallback with no glyph) shows.
- C4: the `hcin` line: the name alone after the target.
- C5: `haystack holds free=true` for all four venues; `items.ts:99-100` reads `item.venue?.text` and `venue?.free`.
- C6 and C7: the new case passes (`<check mark> |unit| tests/state/shared/hub-words.test.ts > the words of each hub's records > draws a venue with the glyph, tone and label of its tier row in its own hub's words 822ms`); its rows: `lab` strong star teal Strong, `home` strong crown purple Top, `plain` strong and untiered null, `lab` blank glyph null, `lab` glyph `stra` null, `lab` untiered and `nope` the fallback crown with no tone, `home` untiered null, and the board item of `home:paper` naming `bspc`, which only `lab` holds, given `lab`'s star, teal, Strong. C7's card half: a null mark keeps `'venue'` (`CardLinks.svelte:137`), and `venueTierMark` returns a glyph only after `hasGlyph` (`lines.ts:346`), so `Glyph` never gets a hub's unknown name.
- C8: no fallback row: the test row `venue('home')` is null (`home` writes one row, no `assignable: false`). `venue_tiers: []`: by reading, `venueTiers([])` is `[]`, both `find`s give undefined, and `row?.glyph === undefined` answers null (`lines.ts:342-346`).
- C9: by reading: `crown` is `"[^]"` and `star` `"[*]"`, both bracketed, so `bracketed` (`Tag.svelte:58`) drops the tag's own pair: `[^] <text>`, `[*] <text>`; `target` is `"(+)"`, not bracketed, so the tag's `::before`/`::after` pair wraps it: `[(+) <text>]`. The look confirms.
- C9b: unchanged code path, `CardLinks.svelte:138`; the look confirms.
- C9c: the test rows `venue('lab')` and `venue('lab', 'nope')` give `{ glyph: 'crown', label: 'Unrated' }` with no tone (`#123456` is in no palette); `Tag.svelte:49-51` then gives no `--mark-txt`, and `.mark`'s `color: var(--mark-txt, inherit)` (`Tag.svelte:97-100`) inherits the tag's muted colour.
- C10: the four-file run: `Tests  131 passed | 2 skipped (133)`; `crown` and `target` each have their row in `icons.yml` and a use in `vocab.yml`'s values, which `config-folder.test.ts` checks.
- C11: the options entry now describes `glyph` with `control: glyph`; the look confirms the field.

### Verify 3 grep, as printed

```
src/lib/state/boards/board/items.ts:32:    venueText,
src/lib/state/boards/board/items.ts:99:        item.venue?.text ?? '',
src/lib/state/boards/board/items.ts:156:                      text: venueText(venue),
src/lib/state/boards/board/presets.ts:678:export function venueText(venue: Venue): string {
src/lib/state/boards/board/index.ts:22:    venueText
src/lib/views/shared/card/project/CardLinks.svelte:29:    // text (its name, its quartile and its JIF, presets.ts `venueText`) as one tag with no press,
src/lib/views/shared/card/project/CardLinks.svelte:138:            tags: item.venue === null ? [] : [{ id: item.venue.id, label: item.venue.text }],
```

Each reads the text without cost: `items.ts:99` is the haystack, which reads the cost from the venue at `:100`; `CardLinks.svelte:138` is the tag; `index.ts:22` is the re-export.

### Verify 7, the changed names

`grep -rn "TierRow\b" src tests config docs README.md --exclude=local.yml`: `lines.ts:40`, `:53`, `:107`, `:311`, `:326` and `LineCard.svelte:27`, `:39`. `LineCard` takes the rows from `venueTiers` and reads `key`, `label`, `color` and `count`; the added optional `glyph` needs nothing there. `grep -rn "TierMark\|venueTierMark" src tests config docs README.md --exclude=local.yml`: `items.ts:24`, `:161`, `presets.ts:37`, `:139`, `lines.ts:52`, `:340`, `CardLinks.svelte:31`, `hub-words.test.ts:9`, `:20`, `:172`, `:183`. The board item's venue type (`presets.ts:139`): its readers are `items.ts:99`, `state.ts:55` (`id`), `facets.ts:60-62` (`id`, `short`), `stats.ts:49` (`id`), `BoardList.svelte:73` (`short`), `CardLinks.svelte:137-141` (`tier`, `text`, `id`); the one place that builds it is `items.ts:151-162`, and `tests/state/boards/board/hub-facets.test.ts:28` writes `venue: null`, which the type takes. No doc names the type.

### Verify 8, the history-word grep

The added comment lines and test titles of `src` and `tests` (58 lines, from `git diff -U0 src tests`) grepped for the package-id pattern, a date and the words of the rules file: `history grep exit 1`, no hit; the same over the test file after its last change: `history exit 1`. The added lines of `config`, `docs/HELP.md` and `docs/templates.md`: the one hit is `HELP.md:299`, whose words "still open" and "before an empty terminals pane" are the paragraph's existing text, not this step's.

### Verify 9, the standards pages

`.agents/plan.yaml:6` names one standards page, `.scratch/migration/agents/spec.md`, and it states no rule on list items or sentence length; its prose rule (plain, ASCII, no em dashes, no 'not X but Y') was read against each new sentence and none departs from it. The new sentences of `HELP.md:299` and the `venueTierMark` doc comment are long; each holds the rule's cases in one place, as the paragraph and doc comments around them do.

## Files (from `diff -rq` against `.agents/worktrees/O152-base` over `src tests config utils`, and `git diff --numstat` for `docs`, which the base copy does not hold)

| File | Added / removed | In the write list |
| --- | --- | --- |
| `config/catalogs/glyphs.yml` | 2 / 0 | yes |
| `config/catalogs/icons.yml` | 2 / 0 | yes |
| `config/catalogs/vocab.yml` | 5 / 5 (lines 300-305) | yes |
| `config/options/catalogs/vocab.yml` | 4 / 1 (lines 390-405; the entry grew by three lines) | yes |
| `src/lib/data/shapes/catalog-files/vocab.ts` | 1 / 1 | yes |
| `src/lib/state/boards/structure/lines.ts` | 53 / 11 | yes |
| `src/lib/state/boards/board/presets.ts` | 8 / 4 | yes |
| `src/lib/state/boards/board/items.ts` | 17 / 5 | yes |
| `src/lib/views/shared/card/project/CardLinks.svelte` | 15 / 6 | yes |
| `src/lib/ui/controls/Tag.svelte` | 37 / 2 | yes |
| `docs/HELP.md` | 1 / 1 (line 299) | yes |
| `docs/templates.md` | 4 / 2 (lines 541-548; the comment grew by two lines) | yes |
| `docs/diagrams/layer-state.dot`, `.svg` | 2 / 2 each | yes, by `npm run diagrams` |
| `docs/diagrams/layer-ui.dot`, `.svg` | 1 / 1 each | yes, by `npm run diagrams` |
| `docs/diagrams/layers.dot`, `.svg` | 1 / 1 each | yes, by `npm run diagrams` |
| `tests/state/shared/hub-words.test.ts` | 81 / 7 | yes |
| `.scratch/migration/agents/reviews/O152-report.md` | this file | yes |

`diff -rq` over `utils` printed nothing; `git status --short` shows no untracked file but this report. The diagrams' import counts change: `state/boards to state/shared` 20 to 22, `state/boards to layer data` 96 to 97, `ui/controls to ui/menu` 4 to 5, `state to data` 545 to 546.

## Edits to existing assertions and context literals in tests

No assertion and no expected value changed. The changed existing lines of `tests/state/shared/hub-words.test.ts`, from `diff ../O152-base/tests/state/shared/hub-words.test.ts tests/state/shared/hub-words.test.ts`:

| Before | After |
| --- | --- |
| `// \`stages\` (\`stageLabel\`), also where a hub's \`chips\` list the same word. The hubs are planted in` / `// scratch folders.` | the head paragraph rewrapped with one more sentence on `venueTierMark` |
| `import { workspaceVocabs } from '../../../src/lib/data/index.ts';` | `import { portfolioConfigFrom, readOtherHub, workspaceVocabs } from '../../../src/lib/data/index.ts';` |
| ` * folder that is no hub (\`dir: null\`), with the primary \`primary\` or none.` | the same sentence, then "Answers the parse of a hub's folder under its settings, each folder parsed once, ..." |
| `function install(folders: { name: string; dir: string \| null }[], primary: string \| null): void {` | `function install(` ... `): (dir: string) => ReturnType<typeof settingsOf> {`, with a `parse` that holds each folder's parse in a map local to the call |
| `    const read = primaryDir === null ? OWN : settingsOf(primaryDir);` | `    const read = primaryDir === null ? OWN : parse(primaryDir);` |
| `        settingsOf,` | `        parse,` |

The four existing cases call `install` as before and ignore its answer; they pass in the last run.

## Judgment calls the brief left open, each the orchestrator may reverse

- D1, the tip's tab stop (P3). The tier glyph's `Tooltip` is `focusable`, so every card whose venue has a tier icon gains one tab stop, on the tier glyph inside the VENUE line; the tip shows on Tab and reaches a screen reader through `aria-describedby` on the wrapper (`tooltip-rules.ts`, `describedControl`). Without it the tip is hover only and a screen reader gets no tier, since `Glyph` is `aria-hidden`.
- D2, item 3's tone: `venueTierMark` takes the row's `color` through `paletteTone(row.color, rootOf(venue))` and leaves `tone` out when that is undefined (a hex the palette does not map, or `muted`), per decision 7.
- D3, item 5's place: `Tag` gains `glyphTone?: string` and `glyphTip?: string` (`Tag.svelte:38-41`). A tag given neither draws `<Glyph name={glyph} />` as on the base, with no wrapper (`Tag.svelte:73-74`); a tone alone wraps the glyph in a `.mark` span carrying `--mark-txt: var(--c-<tone>-txt)`; a tip wraps that span in `Tooltip`. The three branches are written out, since a local snippet rendered with an argument trips `@typescript-eslint/no-confusing-void-expression`, which the tree answers with an eslint-disable line (`TreeItem.svelte:204`, `Modal.svelte:137`) and this file does not need. `CardLinks` passes the two props only on its plain branch, since a tab stop inside the cross-link's button would nest a focus stop in a control; the Venue kind is never a cross-link (`card.ts:89-93`).
- D4, where the join lives: `venueTierMark` and `TierMark` are in `lines.ts`, beside `venueTiers` and `tierStrip`, since `ls src/lib/state/boards/board` lists ten items and the folder can take no new file. `lines.ts` now imports `hasGlyph` (`text.ts`) and `paletteTone` (`tones.ts`); `grep -rn "structure/lines" src tests utils` lists only client and test importers, so no Node-run server module reaches the rune modules this pulls in. Greps before adding: `grep -rn "venueMark\|TierMark\|tierMark\|VenueMark" src tests` printed nothing (exit 1); `grep -rn "glyphTone\|glyphTip" src tests` printed nothing (exit 1).
- D5, the words the join reads: `venueTierMark(venue, wordsOf)` takes the words reader as a parameter and calls it with `rootOf(venue)`; `items.ts:161` passes `(root) => preset.words(root).config`, the preset's own reader, and the test passes `vocabOf`.
- D6, the search: `haystack` takes the venue record as a fourth parameter and reads `venue?.free` beside `item.venue?.text` (`items.ts:79-100`), so the board item carries no field for search alone.
- D7, the test's cross-hub row builds a real two-hub snapshot with `buildHubs` and `readOtherHub` over planted folders, so the row reaches `resolveKey` and `itemOf` as the page does.
- D8, the vocab.yml rows are aligned with the `glyph:` column and the `unrated` row padded to keep `color:` in its column; prettier leaves the file alone.

## Before and after, for the look

- C1. Projects board, cards mode, the card of a project whose `venue:` names `jbi`. Before: VENUE line, the muted diamond, then "Journal of Biomedical Informatics | Q1 | JIF 5.9 | free (subscription)". After: a teal star, then "Journal of Biomedical Informatics | Q1 | JIF 5.9" in the muted colour; the pointer resting on the star, and Tab reaching it, shows the bubble "strong".
- C2. The card of a project naming `bspc`: a cyan target, "Biomedical Signal Processing and Control | Q2 | JIF 5.7", tip "specialist". The card of a project naming any flagship venue: a purple crown, tip "flagship".
- C3. The card of a project naming `cbm` (no tier): the muted diamond, no tip, "Computers in Biology and Medicine | Q1 | JIF 6.3", and no extra tab stop.
- C4. The card of a project naming `hcin` (no quartile, `jif: none`): a cyan target, then "Human-Centric Intelligent Systems (HCIN)".
- C9. The Projects board under the terminal (rice) theme with the Settings option `rice.brackets` on: the flagship tag reads `[^] <text>`, strong `[*] <text>`, specialist `[(+) <text>]`, CBM `[<> <text>]`, each one bracket pair.
- C9b. The card of a project with no `venue:`: no VENUE line, as before.
- C11. Settings, Vocabulary section, `venue_tiers`: each row shows a Glyph field (the glyph picker; the options entry lists it after `key`), filled `crown`, `star`, `target`, and empty for `unrated`; the section's help names the glyph.
- Tab order: on a card with a tiered venue, Tab stops once on the tier glyph inside the VENUE line.
- Pillars view, a pillar line card's metrics row (P1): before, its tier tags read only "<n> unrated"; after, "<n> flagship", "<n> strong", "<n> specialist" and "<n> unrated" by the venues of its in-flight projects, each in its tier's colour through `toneOf` (`unrated`'s `muted` reads grey); the same rows reach the pillar's page card.

## Head comments, doc comments and docs paragraphs

- `CardLinks.svelte` head, the venue paragraph: rewritten; the `Kind` doc: rewritten.
- `Tag.svelte` head: rewritten (a paragraph on the glyph's hue, tip and tab stop); the `Props` docs of the two new props: new.
- `lines.ts` head: rewritten; `TierRow`, `tierRowShape` and `venueTiers` docs: rewritten; `TierMark`, `venueTierMark` docs: new; `tierStrip` doc: true as it stands.
- `presets.ts` head: true as it stands; `BoardItem.venue` doc: rewritten; `venueText` doc: rewritten.
- `items.ts` head: true as it stands; `haystack` doc: rewritten; `itemOf` doc: true as it stands.
- `catalog-files/vocab.ts` head: true as it stands; the `venue_tiers` description: rewritten.
- `config/catalogs/vocab.yml`, the comment above `venue_tiers`: rewritten; the file head: true as it stands.
- `config/options/catalogs/vocab.yml`, the `venue_tiers` help and the new `glyph` field: rewritten.
- `glyphs.yml` and `icons.yml` heads: true as they stand.
- `ui/menu/Tooltip.svelte` and `ui/menu/tooltip-rules.ts`: unchanged, true as they stand.
- `CardFacts.svelte` head: true as it stands (its tips stay hover only).
- `docs/HELP.md:299`: rewritten; `HELP.md:343` ("An off-pillar line's card is muted and carries no in-flight or venue-tier counts."): true as it stands; `HELP.md:572`, `:576`: true as they stand.
- `docs/templates.md:541-548`: rewritten; `docs/data-map.md:82`, `:123`, `:206`: true as they stand.
- `tests/state/shared/hub-words.test.ts` head and the `install` doc: rewritten.

## Wrong or impossible in the brief

- `venueTiers` dropped every shipped row but `unrated` (P1), so item 3's premise that it reads the tier rows was false; fixed in the step.
- The hub has eight venues with no tier (P2), so `:22` and C3's reason are false.
- The facts row's tips do not show on keyboard focus (P3); the step made the tier tip focusable to meet item 5, which adds a tab stop (D1).
- Item 3's "project's own hub" contradicts its sub-bullet and decision 6 (P4); built per the sub-bullet.

## Limitations and sharp edges

- The new case takes 822 ms and 872 ms in its last two runs (the file's other cases 219 ms to 529 ms). Three hubs each cost one `loadConfig` of the engine's folder, which the case needs; it is under a second and not tagged slow, so it runs in `npm test`.
- `crown`'s stand-in `[^]` is also `publish`'s and `scout`'s (`glyphs.yml:57`, `:103`), and `target`'s `(+)` is also `green`'s (`:149`); in the ASCII mode the tier marks read like those glyphs. These are the brief's decision 2.
- Zod 4 holds an object key declared `z.unknown()` without `.optional()` as required (the probe in P1). `grep` lists such keys in request-body shapes (`src/lib/server/edit/writes/bodies.ts:470`, `:565`, `:589-590`, `src/lib/server/machine/runs/commands/routes.ts:63-73`, `src/lib/server/machine/debug/routes.ts:79-135`, `src/lib/server/machine/apps/routes/host.ts:33-79`, `src/lib/server/machine/runs/schedules/routes.ts:109`, `src/lib/server/machine/lsp/adapters/clangd/cpp-write.ts:110`, `src/lib/server/root/watch/autofetch.ts:91`), where a required key may be what is meant; they were not read and are a different concern than this tag.
- A tier glyph inside a cross-link would get no tone and no tip, since `CardLinks` passes them on the plain branch alone; no cross-link kind sets them.
- A hub row whose glyph names a glyph the vocabulary lacks draws the venue glyph and raises no finding (the brief's decision 4).
- The Venues view's card draws the cost (`VenueCard.svelte:258-259`, unchanged), as the brief says.
- One file was changed by a command other than the Edit and Write tools: this report, where `sed -i ''` replaced one citation (`Tag.svelte:38-41`, `:60-77`). No file of the diff was changed that way; prettier's `--write` formatted `items.ts` and `Tag.svelte`, as the rules file asks.

## Repair round 1

Every item of `briefs/O152-round-1.md` is done. One file of the diff was changed in this round by a command other than the Edit and Write tools: `tests/state/shared/hub-words.test.ts`, where a `python3` program replaced five exact strings (each asserted to occur once) to move the board-item row to one parsed hub (item 5); the result is the file as the diff shows it. `tones.ts` is outside the step's write list and is changed because item 4 asks for it.

1. **The tier tip's tab stop has a name.** `Tag.svelte:65-70`: the `Tooltip` is drawn `presentational` instead of `focusable`, and the stop is the `.mark` span itself, `tabindex="0"`, `role="img"`, `aria-label={glyphTip}`, under `<!-- svelte-ignore a11y_no_noninteractive_tabindex -->` as `Tooltip.svelte:232` and `:253` write it. Tooltip.svelte is unchanged: its `focused` (`Tooltip.svelte:142-149`) runs on the wrapper's `focusin`, which the span's focus bubbles to, so Tab to the span opens the tip when the span matches `:focus-visible`, and `left` (`:152-156`) puts it away. `presentational` makes `describedBy` (`tooltip-rules.ts:34-36`) give no description, which `Tooltip.svelte:48-51` says is for a tooltip that only repeats the control's own name: the stop's name is the tier's label, so a screen reader reads "strong" once rather than as both the name and the description. This departs from the original brief's item 5 wording ("reaches a screen reader through the Tooltip's description"): the words now reach it as the stop's name. Every other caller of `Tag` passes no `glyphTip` and draws the two other branches, unchanged. The `Tag.svelte` head comment (`:16-23`) says the stop is an image named by the tip's words and that the tooltip is presentational. Check: the server render of `tag.case.ts` (source and output under item 6), whose stop reads `<span class="mark svelte-138vb85" style="--mark-txt: var(--c-teal-txt)" tabindex="0" role="img" aria-label="strong">` inside `<span ... class="tip svelte-17l0wfn" role="presentation">`, with no `aria-describedby` on either and the glyph `aria-hidden="true"`.
2. **`docs/HELP.md:299`.** The Venue sentence reads: "and Venue, which reads the icon of the venue's tier in the tier's colour, the tier its tip on hover and, since the icon takes a tab stop of its own, on keyboard focus as well, then the venue's name, quartile and JIF; the venue's cost is on the Venues view." Check: `git diff -U0 docs/HELP.md` shows one hunk, `@@ -299 +299 @@`.
3. **The head comment of `lines.ts`.** `lines.ts:1-12` now says it holds the joins for the Pillars and Domains views and the venue tier a project card draws (`venueTierMark`); that the Pillars and Domains joins are pure over what they are given while the tier join reads the installed glyph vocabulary (`hasGlyph` of `state/shared/words/text.ts`), which keeps this module out of a module Node runs unbuilt; and that a venue is read under the words of its own hub, its rows and its hue alike. The palette is not read from the installed words any more than the rows are: after item 4 the hue comes from the words the caller gives, so the comment names the glyph vocabulary as the one installed read. Check: `sed -n 1,22p src/lib/state/boards/structure/lines.ts`.
4. **One source for a tier's row and its tone.** `tones.ts:214-238`: the hex-to-hue step is the private `hueIn(palette, hex)`; `paletteTone(hex, hub)` reads it over the installed palette as before for its two callers (`facets.ts:71`, `LineCard.svelte:68`), and the new export `wordsTone(hex, words)` reads it over `words.palette` through the file's own `stringMap` and `hexShape`. `venueTierMark` (`lines.ts:335-355`) reads the row from `words.venue_tiers` and the tone from `wordsTone(row.color, words)` of the same `words`, and its doc comment says so. Check: `grep -rn "paletteTone\|wordsTone" src tests` lists `facets.ts:27`, `:71`, `LineCard.svelte:30`, `:68` and `lines.ts:36`, `:353`; the case holds every row (item 5).
5. **The case runs well under a second, every row kept.** The nine rows of `venueTierMark` read each hub's words as a plain `wordsOf` (oculus's parsed `palette` with the hub's own `venue_tiers`, the same three hubs and the same rows), so they cost no parse. The board-item row reads one planted hub, `lab`, through `loadConfig`, `readOtherHub` and `buildHubs`; the project's folder `home` is installed as a folder that is no hub (`dir: null`), so it reads oculus's own words, whose strong row is star, teal, "strong", and `lab`'s strong row is crown, `#7c3aed`, "Top", so the item's `{ glyph: 'crown', tone: 'purple', label: 'Top' }` can only come from the venue's hub. What the rows no longer exercise is the server's parse of the blank and mistyped glyph rows; the board-item row exercises that parse for a row with a glyph. Check: `npx vitest run tests/state/shared/hub-words.test.ts --reporter=verbose`, last run: `<check mark> |unit| tests/state/shared/hub-words.test.ts > the words of each hub's records > draws a venue with the glyph, tone and label of its tier row in its own hub's words 317ms`, `Tests  5 passed (5)` (earlier runs of the same file this round: 349 ms, 347 ms, 459 ms). The case is not tagged slow.
6. **The case-run programs.** Each lives in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o152/r1/`, outside the worktree, and is kept there; `git status --short` after the runs lists only the two untracked ledger files (`briefs/O152-round-1.md`, `reviews/O152-report.md`), and `ls -d $TMPDIR/o152-case-*` printed no folder before or after, the fixture's `it` sweeping the planted hub. The programs named earlier without source are replaced by these runs on the final tree: `zod-probe.mjs`, `untiered.mjs`, `case.config.mjs`, and `cases.case.ts` (the same program as the one quoted above, with `<W>` written out), plus `tag.case.ts` for item 1.

`zod-probe.mjs`, run with `node zod-probe.mjs <worktree>` (zod 4.6.5):

```js
// Case-run program for O152: whether zod, as the tree given as argv[2] installs it, holds a key
// typed z.unknown() as required, and whether .optional() makes it optional. It writes nothing.
import { join } from 'node:path';
const tree = process.argv[2];
const { z } = await import(join(tree, 'node_modules/zod/index.js'));
const required = z.object({ key: z.string(), assignable: z.unknown() });
const optional = z.object({ key: z.string(), assignable: z.unknown().optional() });
console.log('without assignable, z.unknown():', required.safeParse({ key: 'a' }).success);
console.log('without assignable, z.unknown().optional():', optional.safeParse({ key: 'a' }).success);
console.log('with assignable: false, z.unknown():', required.safeParse({ key: 'a', assignable: false }).success);
```

```
without assignable, z.unknown(): false
without assignable, z.unknown().optional(): true
with assignable: false, z.unknown(): true
```

`untiered.mjs`, run with `node untiered.mjs <worktree>`:

```js
// Case-run program for O152: counts the `tier` values of the hub's venues and lists the entries
// with none. Reads the hub's venues file read only, with the yaml parser of the tree given as
// argv[2]. It writes nothing.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
const tree = process.argv[2];
const yaml = (await import(join(tree, 'node_modules/yaml/dist/index.js'))).default;
const file = join(homedir(), 'workspace/research-hub/.oculus/data/research/venues.yml');
const entries = yaml.parse(readFileSync(file, 'utf8')).entries;
const counts = {};
for (const one of entries) {
    const tier = one.tier ?? '(none)';
    counts[tier] = (counts[tier] ?? 0) + 1;
}
console.log('hub tiers:', JSON.stringify(counts));
console.log('no tier:', entries.filter((one) => one.tier === undefined).map((one) => one.id).join(', '));
```

```
hub tiers: {"strong":25,"(none)":8,"specialist":20,"flagship":25}
no tier: cbm, volga-neuroscience, icfp-src, chi-ea, ecnr, kuleuven-thesis, uhasselt-thesis, xai-nl
```

`case.config.mjs`, the config both vitest programs run under (`npx vitest run --config <scratch>/case.config.mjs --silent=false --reporter=verbose <file>`, from the worktree's root):

```js
// Scratch vitest config for O152's case-run programs: loads the worktree's Svelte plugin so the
// rune modules and components compile, resolves `$lib` to the worktree's src/lib, and runs only the
// *.case.ts files of this folder, with no cache.
import { svelte } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O152/node_modules/@sveltejs/vite-plugin-svelte/src/index.js';

const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O152';
const HERE = '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o152/r1';

export default {
    plugins: [svelte()],
    resolve: { alias: { $lib: `${W}/src/lib` } },
    server: { fs: { allow: [W, HERE] } },
    test: { dir: HERE, include: ['*.case.ts'], cache: false, environment: 'node' }
};
```

`tag.case.ts` (`<W>` is the worktree path, written out in the file):

```ts
// Case-run program for O152 item 1: renders a Venue tag with a tier glyph and tip on the server, as
// tests/shell/rail/schedule-dialog.test.ts renders a component under the page's tooltip group, and
// prints the markup. It asserts nothing and writes nothing.
import { render } from 'svelte/server';
import { it } from '<W>/tests/fixtures/scratch.ts';
import { clientContext, emptyClient } from '<W>/tests/fixtures/client.ts';
import { setGlyphs } from '<W>/src/lib/state/shared/words/text.ts';
import Tag from '<W>/src/lib/ui/controls/Tag.svelte';

it('prints the tag', () => {
    setGlyphs({ star: '[*]', venue: '<>' });
    const context = clientContext(emptyClient());
    const tipped = render(Tag, {
        props: { label: 'JBI', glyph: 'star', glyphTone: 'teal', glyphTip: 'strong' },
        context
    });
    console.log('with tip:', tipped.body);
    const plain = render(Tag, { props: { label: 'CBM', glyph: 'venue' }, context });
    console.log('no tip:', plain.body);
});
```

```
with tip: <!--[--><span class="tag svelte-138vb85"><!--[0--><!--[0--><!--[-1--><!--[--><!--[--><!--$s1--><!--[0--><span id="bits-s1" data-state="closed" data-delay-duration="150" data-tooltip-trigger="" class="tip svelte-17l0wfn" role="presentation"><span class="mark svelte-138vb85" style="--mark-txt: var(--c-teal-txt)" tabindex="0" role="img" aria-label="strong"><!--[0--><span class="glyph svelte-1ecfycl" data-glyph="star" aria-hidden="true"></span><!--]--><!----></span><!----> <span id="tip-1" class="words" hidden="">strong</span></span><!----><!--]--><!--]--><!--[--><!--[-1--><!--]--><!--]--><!----><!----><!--]--><!--]--><!--]--><!--]--> <span class="label svelte-138vb85">JBI</span></span><!--]-->
no tip: <!--[--><span class="tag svelte-138vb85"><!--[0--><!--[-1--><!--[0--><span class="glyph svelte-1ecfycl" data-glyph="venue" aria-hidden="true"></span><!--]--><!--]--><!--]--> <span class="label svelte-138vb85">CBM</span></span><!--]-->
 <check mark> ../../../../../../../private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o152/r1/tag.case.ts > prints the tag 35ms
```

A server render runs no effect, so `aria-describedby`, which `Tooltip.svelte:215-225` sets on mount, is absent here by construction; on the page `describedBy` gives the empty string for a presentational wrapper and the effect removes the attribute (`:219-221`), so it stays absent there too, by reading.

`cases.case.ts`, the program quoted under "Case results after the change" with `<W>` written out, its imports grouped, and `workspaceVocabs` imported with `portfolioConfigFrom`; its output on the tree after this round:

```
venueTiers(shipped): [{"key":"flagship","label":"flagship","color":"#7c3aed","glyph":"crown"},{"key":"strong","label":"strong","color":"#0d9488","glyph":"star"},{"key":"specialist","label":"specialist","color":"#0891b2","glyph":"target"},{"key":"unrated","label":"unrated","color":"#94a3b8","fallback":true}]
jbi: venue={"id":"hub:jbi","text":"Journal of Biomedical Informatics | Q1 | JIF 5.9","short":"JBI","tier":{"glyph":"star","tone":"teal","label":"strong"}} haystack holds free=true ("free (subscription)")
bspc: venue={"id":"hub:bspc","text":"Biomedical Signal Processing and Control | Q2 | JIF 5.7","short":"BSPC","tier":{"glyph":"target","tone":"cyan","label":"specialist"}} haystack holds free=true ("free (subscription)")
hcin: venue={"id":"hub:hcin","text":"Human-Centric Intelligent Systems (HCIN)","short":"HCIN","tier":{"glyph":"target","tone":"cyan","label":"specialist"}} haystack holds free=true ("free (gold OA, no APC)")
cbm: venue={"id":"hub:cbm","text":"Computers in Biology and Medicine | Q1 | JIF 6.3","short":"CBM","tier":null} haystack holds free=true ("free (subscription route, 'No open access publication fee' on the journal's open access page; the guide for authors names no page or colour charge, colour figures appear in colour online)")
      Tests  1 passed (1)
```

The output equals the phase-1 output line for line, so the tones read from the words (item 4) give the same marks on the hub's venues.

### Round checks

| Check | Result |
|---|---|
| `npx eslint` over `Tag.svelte`, `tones.ts`, `lines.ts`, `hub-words.test.ts` | exit 0 |
| `npx svelte-check --tsconfig ./tsconfig.json --threshold error` | `0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npx vitest run` over the brief's four test files | `Test Files  4 passed (4)`, `Tests  131 passed \| 2 skipped (133)` |
| ASCII gate of the rules file over `src tests config` (`bin` does not exist: `find: bin: No such file or directory`) | prints nothing |
| `LC_ALL=C grep -n '[^ -~]'` over the round's five files | prints nothing |
| `sh utils/unused-exports.sh` against `../O152-base/unused-exports.txt` | `diff` exit 0, no line added (`wordsTone` is used by `lines.ts`) |
| `wc -l` | `Tag.svelte` 134, `tones.ts` 402, `lines.ts` 360, `hub-words.test.ts` 227 |
| History-word grep over the added lines of `src`, `tests`, `docs/HELP.md` | one hit, `HELP.md:299`, on its existing words "still open" and "before an empty terminals pane", which are no history; no hit in a comment line or a test title |
| `npm run diagrams && npm run docs:palette` | both exit 0 |
| `npm run test:quick`, run once this round | below |

```
ok      prettier (1.1 s): All matched files use Prettier code style!
ok      ASCII gate (1.2 s)
ok      svelte-kit sync (3.0 s)
ok      eslint (17.1 s)
ok      svelte-check (24.0 s): 1793914283128 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest slow (36.8 s): Duration  17.08s (transform 1.69s, setup 0ms, import 4.56s, tests 11.93s, environment 3ms)
ok      vitest (63.5 s): Duration  44.04s (transform 31.94s, setup 0ms, import 59.83s, tests 73.78s, environment 3ms)
ok      vitest checks (70.3 s): Duration  50.67s (transform 39.32s, setup 0ms, import 75.86s, tests 100.60s, environment 6ms)
test:quick: 73.4 s; every command passed
```

No whole-suite command was run. The keyboard focus that opens the tip and the screen reader's reading of the stop are by reading of `Tooltip.svelte` and the rendered markup; the look confirms them on the page.
