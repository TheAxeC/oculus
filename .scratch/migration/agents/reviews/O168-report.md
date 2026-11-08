Superseded by the section "Round 1" below: this first line, the "Hand-backs" section and the file table's `repositories.ts` row describe the first run; round 1 folded the dirty-tab pair, gave the nested scrollers their padding and split `repositories.ts`.

NOT done: (1) `npm run test:quick` does not print "every command passed": with `TMPDIR` set to `.agents/scratch/tmp` as the rules require, the 17 rows of `tests/server/machine/lsp/library.test.ts` fail (the library rule closes every path holding a dot segment, and `.agents` is one), and they fail the same way with the unchanged source; in its slow tier the rows that start a private tmux server fail with "File name too long" (the socket path under that `TMPDIR` is 116 characters) and the rows that start an app's host, debugger or language server fail or time out, a row of each failing the same way with the unchanged source (see "Every whole-suite command"); (2) `ui.tab_close_dirty` and `ui.tabs_close_dirty` are not folded into one plural key, because their other reader `src/lib/shell/panes/strip/close-question.svelte.ts:82` is outside the path list; (3) item 1 shifts every sticky group strip and table header up by the pane's top padding, so the strips inside the nested scrollers of `src/lib/views/system/workbench/Settings.svelte` (`.list`, top padding 0) and `src/lib/views/system/help/keys/Keys.svelte` (`.view`, top padding 8px) are clipped by 10px and 2px while stuck; the fix (`--pane-pad-top: 0px` and `8px` on those scrollers) is in files outside the path list; (4) item 9 leaves `PARTS` exported and unused in `src/lib/state/system/machine/lsp/clangd/cpp-form.ts:26` and `src/lib/state/system/machine/debug/launch-form.ts:33`, whose fix is in those two files, outside the path list; (5) three paths outside the list were written: `tests/checks/source/catalog-reads.ts` (new, the split spec.md:48 requires of `keys.test.ts`), `src/lib/server/content/audit/rules.ts` (the audit collector, which `projects.ts`'s counted findings need) and `tests/data/sources/config/catalog/options-schema.test.ts` (one fixture made false by the category label's new shape, carried as brief line 78 asks), see "Paths written outside the list". Every other item of the brief is built.

# O168 report: the boards and record lists drawn whole

## Open items of the state file, verbatim

`.scratch/migration/orchestrator-state.md:198-200`:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

The list holds no entry.

## Hand-backs (the brief: "a fix that needs another file is handed back with the reason")

1. `ui.tab_close_dirty` / `ui.tabs_close_dirty` (brief, "Pairs picked by hand"). `src/lib/state/workbench/navigation/pages.ts:133` still reads `count === 1 ? t('ui.tab_close_dirty') : t('ui.tabs_close_dirty', count)`. The singular key is also read alone by `src/lib/shell/panes/strip/close-question.svelte.ts:82` (`askAndClose(..., t('ui.tab_close_dirty'), ...)`), and by `tests/shell/panes/strip/tab-menu.test.ts:146,157,168,224` and `tests/shell/panes/strip/app-editor-close.test.ts:124` (both in the list). Folding the pair renames the key that file reads. The brief also leaves a question open here: the singular is "Do you want to save the changes to this tab before it closes?" (`config/text/ui.yml:96`), a sentence that names the tab in place of a number, which is the shape Decision 5 keeps as two sentences. Ruling needed: fold it (add `close-question.svelte.ts` to the paths) or keep it under Decision 5.
2. Item 1, nested scrollers. `src/lib/ui/frame/Pane.svelte:238` sets `--pane-pad-top: 10px` on the body and `:248` `0px` on a flush body; `GroupHead.svelte:224` and `Table.svelte:114` subtract it. A view whose own box scrolls inside a non-flush Pane inherits 10px and its strips stick that far above its own top. Read: `Settings.svelte` (`<Pane ... tinted>` at :397, `.list { overflow: auto }` at :486-490, no top padding; its comment at :471-472 names the list's sticky group strips) and `Keys.svelte` (`<Pane ... tinted>` at :118, `.view { height: 100%; overflow: auto; padding: 8px 16px 16px }` at :155-163, GroupHead at :134). The fix is `--pane-pad-top: 0px` on Settings' `.list` and `--pane-pad-top: 8px` on Keys' `.view`. Of the 38 views and shell parts that import GroupHead or Table (`grep -rlE "import GroupHead|import Table from" src/lib/views src/lib/shell | wc -l`), five have a scroller of their own: Keys, `Catalogue.svelte` (`.view`, padding-top 8px, scrolls only if its body gives it a bounded height, not settled by reading), `Hooks.svelte` and `AppHosts.svelte` (the scroller is a `<pre>`, no strip inside), `UpdateTray.svelte` (a tray outside every Pane, so it inherits no `--pane-pad-top`). Settings draws its strips through `src/lib/views/system/workbench/settings/List.svelte` (`grep -rln GroupHead src/lib/views/system/workbench/settings`), one level below. The second level was enumerated too: of the files that import a component which imports GroupHead or Table, those with a scroller of their own and inside a Pane (MathPreview, Present, SessionList, Diff, References, Help, History, Pages) import no child that draws a GroupHead or Table (a loop over each file's `.svelte` imports, grepping each for `import GroupHead|import Table from`, printed `none` for all eight); the rest of that list are overlays outside every Pane (Palette, RailList, NoticeCentre, FloatingList, UpdateTray) or draw no strip. Deeper nesting than two levels was not enumerated. The look should check Settings, Keys and Catalogue scrolled.
3. `PARTS` unused exports (item 9): see "Unused exports" below.

## Paths written outside the list

- `tests/checks/source/catalog-reads.ts` (new, 104 lines). `keys.test.ts` passed 880 lines with the G24 rows of C7 (the size check printed 951); spec.md:48 has a file that would pass 880 split by concern in the step. The file holds the source reads the gate scans by (`sources`, `codeOf`) and the plural-read rules (`PLURAL_READERS`, `formsOf`, `orphansOf`, `namesKey`, `sentenceBase`, `afterFirstArgument`). `keys.test.ts` is now 867 lines.
- `src/lib/server/content/audit/rules.ts` (353 to 367 lines). `src/lib/server/content/audit/projects.ts` (in the list) picked by hand between two finding sentences on a count. A finding reaches its words only through the collector in `rules.ts`, which words a `sentence(key, ...args)` with `findingText` (one key, no count). The change adds `pluralSentence(key, count, ...args)` and a `count` on `Sentence`, and the collector words a sentence with a count by `pluralFindingText` (`rules.ts:228-245`, `:273-283`). The signature still reads the key and the arguments, so a mute keeps matching within the new key (see Judgment calls on the key change).
- `tests/data/sources/config/catalog/options-schema.test.ts:162`: the fixture row `categoryWith` wrote `label: Drafts`; it is now `label: { other: Drafts }`. The Settings form's `label` field of `categories` is now a map of the six forms (`config/options/catalogs/vocab.yml`, `control: records` with a `key` choice of the six forms and a `value`), so the editor's schema refuses a text label on line 3 and the five multi rows read `['3:', '5:']` where they expect `['5:']`. The brief's grep of candidate tests did not find this file; brief line 78 has a fixture made false by the label's new shape carried with no row added. No expectation changed. 43/43 pass.
- `.scratch/migration/agents/briefs/O168-cases.md`, `.scratch/migration/agents/guarded.md`, `.scratch/migration/agents/spec.md` are printed by `outside-paths.mjs` because they differ from HEAD; they are the orchestrator's edits in the worktree's ledger copy (the coordinator's message names spec.md:34 and the cases file; the cases file names guarded.md:204). This step did not edit them.
- `src/lib/ui/frame/Pane.svelte`, `src/lib/data/sources/config/merge/language.ts`, `src/lib/data/sources/config/merge/workspace-layer.ts`, `tests/data/sources/config/layers/language.test.ts` are the paths the rulings add.

`node utils/outside-paths.mjs .scratch/migration/agents/briefs/O168.md HEAD` (the base argument `.agents/worktrees/O168-base` is refused: "git does not know the base"; the worktree's HEAD `abebbb552 Prepare O168` is the base the step started from) printed:

```
.scratch/migration/agents/briefs/O168-cases.md
.scratch/migration/agents/guarded.md
.scratch/migration/agents/spec.md
src/lib/data/sources/config/merge/language.ts
src/lib/data/sources/config/merge/workspace-layer.ts
src/lib/server/content/audit/rules.ts
src/lib/ui/frame/Pane.svelte
tests/checks/source/catalog-reads.ts
tests/data/sources/config/catalog/options-schema.test.ts
tests/data/sources/config/layers/language.test.ts
```

## The cases' first run, on the unchanged tree, inside the worktree

Every program ran with `TMPDIR` and `GIT_CEILING_DIRECTORIES` set to `.agents/scratch` paths:

```
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O168 && export PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH TMPDIR=$PWD/.agents/scratch/tmp GIT_CEILING_DIRECTORIES=$PWD/.agents/scratch && ...
```

The unchanged tree is `O168-base/src/lib`, reached through `.agents/scratch/base.config.mjs`, which sends every import of `src/lib` (relative or `$lib`) to the base copy. Source of the config:

```js
// O168 case-run config, first run: the worktree's test files and the case program run against the
// unchanged tree in O168-base. Every import of the worktree's src/lib, relative or through $lib, is
// sent to O168-base/src/lib. CASE_ENV names the environment: node, or jsdom for a *.dom.test.ts.
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const worktree = fileURLToPath(new URL('../..', import.meta.url));
const base = fileURLToPath(new URL('../../../O168-base/src/lib', import.meta.url));

export default defineConfig({
    plugins: [svelte()],
    resolve: {
        alias: [
            { find: /^\$lib\//, replacement: `${base}/` },
            { find: /^(?:\.\.\/)+src\/lib\//, replacement: `${base}/` }
        ]
    },
    test: {
        root: worktree,
        include: (process.env.CASE_FILES ?? '').split(' ').filter((one) => one !== ''),
        environment: process.env.CASE_ENV ?? 'node',
        tags: [{ name: 'slow' }],
        css: { include: [/seti-ui\/.*\.less/] },
        testTimeout: 60000,
        server: { deps: { inline: [/svelte/] } }
    }
});
```

### The case program `.agents/scratch/tests/first-run.test.ts` (C2, C3, C5, C6)

Command: `CASE_FILES=".agents/scratch/tests/first-run.test.ts" npx vitest run --config .agents/scratch/base.config.mjs --reporter=dot`

```ts
// O168 case-run program, first run on the unchanged tree (O168-base, through base.config.mjs):
// prints each case's result, asserts nothing.
import { it } from 'vitest';
import { mkdtempSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { hubVocabOf, portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { categoriesOf } from '../../../src/lib/data/shapes/boards/categories.ts';
import { newProjectFolder } from '../../../src/lib/state/boards/board/new-project.ts';
import { fittedColumns } from '../../../src/lib/ui/display/table/table-rows.ts';
import { entryColumns } from '../../../src/lib/state/boards/collection/index.ts';
import { setCatalog, t } from '../../../src/lib/state/shared/words/text.ts';
import { noticeWords } from '../../../src/lib/state/system/machine/refactor/notice-words.ts';

const W = join(import.meta.dirname, '..', '..', '..', '..', 'O168-base');
const own = loadConfig(engineDir()).config;
setCatalog(textCatalog(own));

it('engine', () => {
    console.log('engineDir:', engineDir());
});

it('C2', () => {
    const second = {
        ...own,
        scan: [{ dir: 'projects' }],
        new_project_dir: { research: 'projects/research' }
    };
    const dir = mkdtempSync(join(tmpdir(), 'hub-'));
    const vocab = hubVocabOf(dir, portfolioConfigFrom(second)) as Record<string, unknown>;
    console.log('C2 HubVocab keys:', Object.keys(vocab).join(','));
    console.log('C2 HubVocab new_project_dir:', JSON.stringify(vocab.new_project_dir));
    console.log('C2 primary reader, research:', JSON.stringify(newProjectFolder(second, 'research')));
});

it('C3', () => {
    const least = (key: string) => (key === 'title' ? 160 : 90);
    const listed = ['title', 'funder', 'status', 'award', 'deadline'].map((key) => ({
        key,
        label: key,
        shown: true
    }));
    for (const width of [420, 1200]) {
        const drawn = fittedColumns(listed, width, least, 'title');
        console.log('C3 width', width, JSON.stringify(drawn.map((one) => [one.key, one.width])));
    }
    const schema = [
        { field: 'key', type: 'text', primary_key: true },
        { field: 'name', type: 'text', display: 1 },
        { field: 'funder', type: 'text', filter: true },
        { field: 'status', type: 'select', options: ['open'] },
        { field: 'award', type: 'text', filter: true },
        { field: 'deadline', type: 'date', filter: true }
    ];
    const shown = entryColumns([schema as never], undefined).filter((one) => one.shown);
    console.log('C3 headers', JSON.stringify(shown.map((one) => one.label)));
});

it('C5', () => {
    for (const count of [0, 1, 2]) {
        const said = count === 1 ? t('literature.cites_one') : t('literature.cites', count);
        console.log('C5 literature.cites by hand', count, said);
    }
    console.log('C5 search 1 hit 1 file:', t('search.count_1_1', 1, 1, 5));
    console.log('C5 search 1 hit 3 files:', t('search.count_1_n', 1, 3, 5));
    console.log('C5 search 4 hits 2 files:', t('search.count', 4, 2, 5));
    console.log('C5 noticeWords lsp_edit_partial_one:', noticeWords('lsp_edit_partial_one', ['a.md']));
    for (const locale of ['en', 'pl', 'en_US', '']) {
        try {
            const form = new Intl.PluralRules(locale).select(3);
            console.log('C5 Intl.PluralRules', JSON.stringify(locale), 'select(3):', form);
        } catch (error) {
            console.log('C5 Intl.PluralRules', JSON.stringify(locale), 'throws', (error as Error).name);
        }
    }
});

it('C6', () => {
    const vocab = readFileSync(join(W, 'config/catalogs/vocab.yml'), 'utf8');
    const row = vocab.split('\n').find((line) => line.includes('label: idea,')) ?? '';
    console.log('C6 the categories row changed:', JSON.stringify(row));
    const rows: [string, string][] = [
        ['text label (as shipped)', row],
        ['label map no other', row.replace('label: idea,', 'label: { one: idea },')],
        ['label map with several', row.replace('label: idea,', 'label: { one: idea, several: x, other: y },')],
        ['no label', row.replace(/label: idea, */, '')]
    ];
    for (const [name, line] of rows) {
        const instead = { name: 'catalogs/vocab.yml', text: vocab.replace(row, line), layer: 'engine' };
        const { config, findings } = loadConfig(engineDir(), { instead } as never);
        const mine = findings.filter((one) => one.file.endsWith('vocab.yml'));
        const label = categoriesOf(config).find((one) => one.key === 'idea')?.label;
        console.log('C6 vocab', name, '| findings:', JSON.stringify(mine.map((one) => `${one.key} | ${one.message}`)), '| label:', JSON.stringify(label));
    }
    const collection = readFileSync(join(W, 'config/text/views/boards/collection.yml'), 'utf8');
    const file = 'text/views/boards/collection.yml';
    const text = collection.replace('count_one: 1 entry', "count_map: { one: '1 entry' }");
    const { findings } = loadConfig(engineDir(), { instead: { name: file, text, layer: 'engine' } } as never);
    console.log('C6 text map no other | findings:', JSON.stringify(findings.filter((one) => one.file.endsWith(file)).map((one) => `${one.key} | ${one.message}`)));
});
```

Output:

```
engineDir: /Users/axelfaes/workspace/oculus
C2 HubVocab keys: domains,venue_themes,data_themes,collections,list,words
C2 HubVocab new_project_dir: undefined
C2 primary reader, research: "projects/research"
C3 width 420 [["title","47.059%"],["funder","26.471%"],["status","26.471%"]]
C3 width 1200 [["title","30.769%"],["funder","17.308%"],["status","17.308%"],["award","17.308%"],["deadline","17.308%"]]
C3 headers ["Title","funder","status","award","deadline"]
C5 literature.cites by hand 0 0 citations
C5 literature.cites by hand 1 1 citation
C5 literature.cites by hand 2 2 citations
C5 search 1 hit 1 file: 1 hit in 1 file, 5 ms
C5 search 1 hit 3 files: 1 hit in 3 files, 5 ms
C5 search 4 hits 2 files: 4 hits in 2 files, 5 ms
C5 noticeWords lsp_edit_partial_one: The language server's edit stopped at a.md after 1 file was written. History undoes it.
C5 Intl.PluralRules "en" select(3): other
C5 Intl.PluralRules "pl" select(3): few
C5 Intl.PluralRules "en_US" throws RangeError
C5 Intl.PluralRules "" throws RangeError
C6 the categories row changed: "  - { key: idea,          label: idea,            stages: { words: [nascent, scoping] }, color: \"#7c5cff\" }"
C6 vocab text label (as shipped) | findings: [] | label: "idea"
C6 vocab label map no other | findings: ["categories.2.label | categories.2.label must be a text"] | label: "idea"
C6 vocab label map with several | findings: ["categories.2.label | categories.2.label must be a text"] | label: "idea"
C6 vocab no label | findings: [] | label: "idea"
C6 text map no other | findings: []
 Test Files  1 passed (1)
      Tests  5 passed (5)
```

Results per case on the unchanged tree: C2, a second hub's per-hub data has no `new_project_dir` (the form starts it empty); C3, at 420 px the award and deadline columns go and the headers read the raw keys; C5, the words are picked by hand per site and two locales throw; C6, a label map is refused as "must be a text", a text label draws no finding, and a text-catalogue map with no `other` draws no finding.

### C9, `.agents/scratch/tests/first-run-c9.dom.test.ts`

Command: `CASE_ENV=jsdom CASE_FILES=".agents/scratch/tests/first-run-c9.dom.test.ts" npx vitest run --config .agents/scratch/base.config.mjs --reporter=dot`

```ts
// O168 case-run program, C9: a card's Markdown field through inlineMarkdown, in jsdom. Run against
// O168-base for the first run and against the worktree after the change; prints, asserts nothing.
import { it } from 'vitest';
import { inlineMarkdown } from '../../../src/lib/ui/html.ts';

it('C9', () => {
    const fields = [
        'ssh from the UT network or EduVPN; compute only through sbatch, never on the login node; job I/O on /local/<jobid>',
        'a **bold** note with [a link](https://example.org)',
        'a field holding <script>alert(1)</script> and <name>',
        'a <job-id> placeholder and <b>kept</b> markup'
    ];
    for (const one of fields) console.log('C9', JSON.stringify(one), '=>', JSON.stringify(inlineMarkdown(one)));
});
```

Output:

```
C9 "ssh from the UT network or EduVPN; compute only through sbatch, never on the login node; job I/O on /local/<jobid>" => "ssh from the UT network or EduVPN; compute only through sbatch, never on the login node; job I/O on /local/"
C9 "a **bold** note with [a link](https://example.org)" => "a <strong>bold</strong> note with <a href=\"https://example.org\" target=\"_blank\" rel=\"noopener noreferrer\">a link</a>"
C9 "a field holding <script>alert(1)</script> and <name>" => "a field holding  and "
C9 "a <job-id> placeholder and <b>kept</b> markup" => "a  placeholder and <b>kept</b> markup"
 Test Files  1 passed (1)
```

### C6, C7 and the C5 language rows: the step's test rows run against the unchanged source

Command: `CASE_FILES="tests/checks/config/config-folder.test.ts tests/data/shapes/catalog-files/vocab.test.ts tests/data/sources/config/layers/language.test.ts" npx vitest run --config .agents/scratch/base.config.mjs --reporter=dot`, then the same with `tests/checks/config/config-folder.test.ts tests/checks/source/keys.test.ts`. Failing output as printed (assertion blocks):

```
 FAIL  tests/data/shapes/catalog-files/vocab.test.ts > the vocabulary's words past its shape > words a category whose label holds no other form, and draws it by its key
-   "/scratch/lab/.oculus/config.yml | categories[2].label | categories[2].label is a map of plural forms with no other form, which every such map holds",
+   "/scratch/lab/.oculus/config.yml | categories.2.label | categories.2.label must be a text",
 FAIL  tests/data/shapes/catalog-files/vocab.test.ts > the vocabulary's words past its shape > words a form of a category label outside the six plural forms, and reads the others
-   "/scratch/lab/.oculus/config.yml | categories[2].label.several | categories[2].label.several is not a plural form: the forms are zero, one, two, few, many and other",
+   "/scratch/lab/.oculus/config.yml | categories.2.label | categories.2.label must be a text",
 FAIL  tests/data/shapes/catalog-files/vocab.test.ts > the vocabulary words of a hub that is not the primary > gives the findings of a category row naming no color beside two tiers carrying default, each naming its settings file
+     "categories.7.label",
+     "categories.7.label must be a text",
 FAIL  tests/data/sources/config/layers/language.test.ts > the display language > draws the language's words for its keys, English for the rest, and words a key oculus lacks
-   undefined,
 FAIL  tests/data/sources/config/layers/language.test.ts > the display language > lays a plural form oculus lacks of a plural key over the catalogue, and 3 draws it
+   "text.literature.cites.few | text.literature.cites.few is not a key of oculus's text catalog; the display language pl of the app Polish words does not use it",
 FAIL  tests/data/sources/config/layers/language.test.ts > the display language > lays the workspace's own plural form over the catalogue
+   "settings.text.literature.cites.few | settings.text.literature.cites.few is not a key of oculus's text catalog; it is not applied",
 Test Files  3 failed (3)
      Tests  6 failed | 33 passed (39)

 FAIL  tests/checks/config/config-folder.test.ts > oculus's own config directory > words a part of catalogs/vocab.yml its shape refuses
-     "categories.0.label",
-     "categories.0.label must be a map",
+ []
 FAIL  tests/checks/config/config-folder.test.ts > oculus's own config directory > words a part of text/views/system/status.yml its shape refuses
-     "text.status.count",
-     "text.status.count is a map of plural forms with no other form, which every such map holds",
+ []
 FAIL  tests/checks/config/config-folder.test.ts > oculus's own config directory > words a part of text/views/system/status.yml its shape refuses
-     "text.status.count.several",
-     "text.status.count.several is not a plural form: the forms are zero, one, two, few, many and other",
+ []
 FAIL  tests/checks/source/keys.test.ts > text keys > names a catalog key in every literal read
AssertionError: expected [ <ellipsis>(118) ] to deeply equal []
 FAIL  tests/checks/source/keys.test.ts > text keys > has a reader for every catalog key
TypeError: Cannot convert undefined or null to object
 FAIL  tests/checks/source/keys.test.ts > text keys > reaches every form of a plural key read only by a count, and reports a plural key read by nothing
TypeError: Cannot read properties of undefined (reading 'map')
 FAIL  tests/checks/source/keys.test.ts > text keys > holds every findings. literal of the source to config/text/findings.yml, both ways
TypeError: Cannot read properties of undefined (reading 'includes')
 Test Files  2 failed (2)
      Tests  7 failed | 35 passed | 2 skipped (44)
```

The language row "draws the language's words ..." fails on the base because its edited assertion names `LOCALE_ENTRY` (undefined in the base's `finding-text.ts`). The keys rows fail on the base with a TypeError, since `PLURAL_FORMS` and `LSP_COUNTED_NOTICES` do not exist there; the C7 row's assertion was therefore not reached on the base, only its absence of the plural reader.

### C1, C4, C8, C10, C11, read on the unchanged tree

- C1: `BoardList.svelte:96-104` gives `.list` `overflow: hidden` and the header row sticks at `top: var(--group-strip, 0)` (`Table.svelte:107-111`), so it sticks to the clipping box and is drawn again under the strip; `Pane.svelte`'s body has `padding: 10px 12px`, the band above a stuck strip the orchestrator measured.
- C4: `RecordCounts.svelte` drew a Tag in a plain ToolButton in PressBox, words `board.record_count` "{0} {1}" with the row's one label ("1 publications").
- C8: `EntryFields.svelte` drew every field `drawnFields` gave, the key included, RELATED as ids, then the Website group.
- C10: `git-routes.ts:512-523` answered a failed fetch with git's one line.
- C11: `app.yml:91,96` and `debug.yml:44` filled `{0}` with `PARTS = ','`.

### C12

`npx vitest run tests/state/sessions/source/source.test.ts` passes alone, as the brief says it does (27/27 after the change, quoted below). The failure under a load of 12 to 16 is not reproducible by a single run; the first run on the unchanged tree was not rerun with the base's own fixture, because the fixture `source-server.ts` is a file this step writes and the base copy holds no runnable vitest setup (`ls ../O168-base`: `config src tests unused-exports.txt utils`).

## Rulings (`O168-cases.md`), what changed and the check

1. C1, the band at its cause.
   - `src/lib/ui/frame/Pane.svelte:232-249`: the body publishes `--pane-pad-top: 10px` (`:238`) and pads by it (`:243`); a flush body sets `0px` (`:248`); the comment at `:232-236` names the property and its readers.
   - `src/lib/ui/controls/heads/GroupHead.svelte:224`: `top: calc(var(--group-above) - var(--pane-pad-top, 0px))`; head comment `:27-31` names the property.
   - `src/lib/ui/display/table/Table.svelte:104-114`: every `th` sticks at `calc(var(--group-strip, 0px) - var(--pane-pad-top, 0px))`.
   - `src/lib/views/boards/projects/BoardList.svelte:107` and `src/lib/views/boards/collection/EntryList.svelte:155`: `.list { --group-strip: 0px }`, so in the `overflow: hidden` box the header's `top` lies above its place and the row scrolls with its rows (item 1).
   - Check: by reading, and the orchestrator's look (list mode, card mode, Focus). See hand-back 2 for the nested scrollers this reaches.
2. C5, the forms a language may give.
   - `src/lib/data/sources/config/merge/language.ts:18-22,96-97,125,144`: a pack key `<key>.<form>` is accepted when `<key>.other` is in the catalogue and `<form>` is one of the six; the locale is put into the catalogue's `LOCALE_ENTRY`.
   - `src/lib/data/sources/config/merge/workspace-layer.ts:117-120,135,138`: `settings.text` takes a form of a plural key the catalogue holds the same way.
   - `tests/data/sources/config/layers/language.test.ts:195-233`: the four rows (the `few` form laid over and drawn for 3, `several` a finding, `views.settings.few` on a plain key a finding, `settings.text` giving `literature.cites.few` laid over). Seen failing on the base above; passing after (`npx vitest run tests/data/sources/config/layers/language.test.ts`, in the covering runs below).

## DONE / NOT DONE

| Item | State | Check |
|---|---|---|
| 1 List mode | Done; nested scrollers in Settings and Keys handed back | reading, `Pane.svelte:238,248`, `GroupHead.svelte:224`, `Table.svelte:114`, `BoardList.svelte:107`, `EntryList.svelte:155`; the look |
| 2 New project in another hub | Done | C2 program after, below; `board-new-project.test.ts`, `hub-names.test.ts`, `hub-vocab.test.ts` pass |
| 3 Funding list | Done | C3 program after, below |
| 4 Count row as pills | Done | reading `RecordCounts.svelte`, `Disclosure.svelte`; the look |
| 5 Plural mechanism | Done except `ui.tab_close_dirty` (hand-back 1) | C5 program after; greps below; keys, config-folder, vocab, language tests; the Settings form shows and writes a category's `label` as a map of forms (`config/options/catalogs/vocab.yml:325-333`, the `label` field of `categories`: `control: records`, `key` a choice of the six forms, `value` the words), checked by `tests/server/edit/config-value.test.ts` (the lab row writes `{ one: Idea, other: Ideas }`) and `options-schema.test.ts` |
| 6 Entry pages | Done | reading `EntryFields.svelte`, `collection/index.ts`; the look |
| 7 Angle brackets | Done | C9 after; `tests/ui/html.dom.test.ts` 8/8 |
| 8 Fetch toast | Done | reading `git-routes.ts`; git route tests pass; the look |
| 9 Separator words | Done; `PARTS` exports handed back | reading `app.yml`, `debug.yml`; unused-exports |
| 10 Source row | Done | C12 run below |

### The cases after the change

Program `.agents/scratch/tests/after.test.ts`, run with `.agents/scratch/vitest.config.mjs` (the worktree's own `src/lib`):

```js
// O168 case-run config, after the change: the case program over the worktree's own src/lib, $lib
// resolved there. CASE_FILES names the files to run and CASE_ENV the environment (node or jsdom).
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const lib = fileURLToPath(new URL('../../src/lib', import.meta.url));

export default defineConfig({
    plugins: [svelte()],
    resolve: { alias: { $lib: lib } },
    test: {
        root: here,
        include: (process.env.CASE_FILES ?? '').split(' ').filter((one) => one !== ''),
        environment: process.env.CASE_ENV ?? 'node',
        server: { deps: { inline: [/svelte/] } }
    }
});
```

```ts
// O168 case-run program, after the change, over the worktree's src/lib: prints each case's result,
// asserts nothing.
import { it } from 'vitest';
import { mkdtempSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { hubVocabOf, portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { newProjectFolder } from '../../../src/lib/state/boards/board/new-project.ts';
import { fittedColumns } from '../../../src/lib/ui/display/table/table-rows.ts';
import { entryColumns } from '../../../src/lib/state/boards/collection/index.ts';
import { plural, setCatalog } from '../../../src/lib/state/shared/words/text.ts';
import { pluralText, type TextCatalog } from '../../../src/lib/data/helpers/finding-text.ts';
import { pluralWords } from '../../../src/lib/server/core/words.ts';
import { countLine } from '../../../src/lib/state/sources/search/words.ts';
import { noticeWords } from '../../../src/lib/state/system/machine/refactor/notice-words.ts';

const W = join(import.meta.dirname, '..', '..', '..');
const own = loadConfig(engineDir()).config;
const catalog = textCatalog(own);
setCatalog(catalog);

it('C2', () => {
    const scan = [{ dir: 'projects' }];
    const hubs: [string, Record<string, unknown>][] = [
        ['second hub, research named', { ...own, scan, new_project_dir: { research: 'projects/research' } }],
        ['second hub, wrong shape', { ...own, scan, new_project_dir: 'projects/research' }],
        ['second hub, none for the tier', { ...own, scan, new_project_dir: { personal: 'projects' } }]
    ];
    const primary = { ...own, scan, new_project_dir: { research: 'projects/primary' } };
    for (const [name, config] of hubs) {
        const vocab = hubVocabOf(mkdtempSync(join(tmpdir(), 'hub-')), portfolioConfigFrom(config));
        const vocabs = { lists: { lab: vocab } } as never;
        const where = { hub: 'lab', primary: 'main', vocabs };
        console.log('C2', name, '| new_project_dir:', JSON.stringify(vocab.new_project_dir), '| research starts at:', JSON.stringify(newProjectFolder(primary, 'research', where)));
    }
    const where = { primary: 'main', vocabs: null };
    console.log('C2 primary, research starts at:', JSON.stringify(newProjectFolder(primary, 'research', where)));
    console.log('C2 primary named as hub, research starts at:', JSON.stringify(newProjectFolder(primary, 'research', { ...where, hub: 'main' })));
});

it('C3', () => {
    const least = (key: string) => (key === 'title' ? 160 : 90);
    const listed = ['title', 'funder', 'status', 'award', 'deadline'].map((key) => ({
        key,
        label: key,
        shown: true
    }));
    for (const width of [420, 1200]) {
        const drawn = fittedColumns(listed, width, least, 'title', new Set(['award']));
        const widths = drawn.map((one) => [one.key, one.width, `${((Number.parseFloat(one.width ?? '0') * width) / 100).toFixed(1)}px`]);
        console.log('C3 width', width, JSON.stringify(widths));
    }
    const schema = [
        { field: 'key', type: 'text', primary_key: true },
        { field: 'name', type: 'text', display: 1 },
        { field: 'funder', type: 'text', filter: true },
        { field: 'status', type: 'select', options: ['open'] },
        { field: 'award', type: 'text', filter: true },
        { field: 'deadline', type: 'date', filter: true },
        { field: 'cv_section', type: 'text', label: 'CV section', filter: true }
    ];
    const shown = entryColumns([schema as never], undefined).filter((one) => one.shown);
    console.log('C3 headers', JSON.stringify(shown.map((one) => one.label)));
});

it('C5', () => {
    const cites: TextCatalog = { 'cites.one': '1 citation', 'cites.other': '{0} citations' };
    for (const count of [0, 1, 2]) console.log('C5 helper en', count, pluralText(cites, 'cites', count, count));
    const polish = { ...cites, locale: 'pl' } as TextCatalog;
    console.log('C5 helper pl, 3 with no few form:', pluralText(polish, 'cites', 3, 3));
    const fewer = { ...polish, 'cites.few': '{0} cytowania' } as TextCatalog;
    console.log('C5 helper pl, 3 with a few form:', pluralText(fewer, 'cites', 3, 3));
    for (const locale of ['en_US', '']) {
        const odd = { ...cites, locale } as TextCatalog;
        console.log('C5 helper locale', JSON.stringify(locale), 1, pluralText(odd, 'cites', 1, 1), '|', 2, pluralText(odd, 'cites', 2, 2));
    }
    for (const count of [0, 1, 2]) console.log('C5 literature.cites through plural()', count, plural('literature.cites', count, count));
    for (const [hits, files] of [[1, 1], [1, 3], [4, 2]]) console.log('C5 search', hits, 'in', files, ':', countLine(hits, files, 5, false));
    console.log('C5 noticeWords lsp_edit_partial, 1:', noticeWords('lsp_edit_partial', ['a.md', '1']));
    console.log('C5 noticeWords lsp_edit_partial, 3:', noticeWords('lsp_edit_partial', ['a.md', '3']));
    console.log('C5 server pluralWords pl, 3:', pluralWords(fewer as Record<string, string>, 'cites', 3, 3));
    const pack = 'text:\n  literature:\n    cites:\n      few: "{0} cytowania"\n';
    const language = (locale: string) => (locale === 'pl' ? { app: 'Polski', files: [{ file: '/apps/pl/text.yml', text: pack }] } : null);
    const appearance = readFileSync(join(W, 'config/defaults/appearance.yml'), 'utf8').replace('locale: en', 'locale: pl');
    const instead = { name: 'defaults/appearance.yml', text: appearance, layer: 'engine' };
    const { config, findings } = loadConfig(engineDir(), { language, instead } as never);
    const laid = textCatalog(config);
    console.log('C5 pack under pl, findings on the pack:', JSON.stringify(findings.filter((one) => one.file.includes('/apps/pl/')).map((one) => one.message)));
    console.log('C5 pack under pl, 3 citations:', pluralText(laid, 'literature.cites', 3, 3), '| 1:', pluralText(laid, 'literature.cites', 1, 1));
});
```

Command: `CASE_FILES="tests/after.test.ts" npx vitest run --config .agents/scratch/vitest.config.mjs --reporter=dot`

```
C2 second hub, research named | new_project_dir: {"research":"projects/research"} | research starts at: "projects/research"
C2 second hub, wrong shape | new_project_dir: {} | research starts at: ""
C2 second hub, none for the tier | new_project_dir: {"personal":"projects"} | research starts at: ""
C2 primary, research starts at: "projects/primary"
C2 primary named as hub, research starts at: "projects/primary"
C3 width 420 [["title","47.059%","197.6px"],["funder","26.471%","111.2px"],["status","26.471%","111.2px"]]
C3 width 1200 [["title","30.769%","369.2px"],["funder","17.308%","207.7px"],["status","17.308%","207.7px"],["award","17.308%","207.7px"],["deadline","17.308%","207.7px"]]
C3 headers ["Title","Funder","Status","Award","Deadline","CV section"]
C5 helper en 0 0 citations
C5 helper en 1 1 citation
C5 helper en 2 2 citations
C5 helper pl, 3 with no few form: 3 citations
C5 helper pl, 3 with a few form: 3 cytowania
C5 helper locale "en_US" 1 1 citation | 2 2 citations
C5 helper locale "" 1 1 citation | 2 2 citations
C5 literature.cites through plural() 0 0 citations
C5 literature.cites through plural() 1 1 citation
C5 literature.cites through plural() 2 2 citations
C5 search 1 in 1 : 1 hit in 1 file, 5 ms
C5 search 1 in 3 : 1 hit in 3 files, 5 ms
C5 search 4 in 2 : 4 hits in 2 files, 5 ms
C5 noticeWords lsp_edit_partial, 1: The language server's edit stopped at a.md after 1 file was written. History undoes it.
C5 noticeWords lsp_edit_partial, 3: The language server's edit stopped at a.md after 3 files were written. History undoes them.
C5 server pluralWords pl, 3: 3 cytowania
C5 pack under pl, findings on the pack: []
C5 pack under pl, 3 citations: 3 cytowania | 1: 1 citation
 Test Files  1 passed (1)
      Tests  3 passed (3)
```

C2: a wrong-shaped `new_project_dir` is the reader's `{}` after its G13 finding (`newProjectDirs`, `src/lib/data/sources/config/settings/scan.ts:113-115`), and the server then refuses a write with no folder (`src/lib/server/edit/writes/manifest.ts:698-704`), so the form starts empty, which is what the server would write by. C3: at 420 px the empty award column and then deadline are dropped and Title gets 197.6 px (at least 160); at 1200 px every column is drawn.

C9 after: `CASE_ENV=jsdom CASE_FILES="tests/first-run-c9.dom.test.ts" npx vitest run --config .agents/scratch/vitest.config.mjs --reporter=dot`

```
C9 "ssh from the UT network or EduVPN; compute only through sbatch, never on the login node; job I/O on /local/<jobid>" => "ssh from the UT network or EduVPN; compute only through sbatch, never on the login node; job I/O on /local/&lt;jobid&gt;"
C9 "a **bold** note with [a link](https://example.org)" => "a <strong>bold</strong> note with <a href=\"https://example.org\" target=\"_blank\" rel=\"noopener noreferrer\">a link</a>"
C9 "a field holding <script>alert(1)</script> and <name>" => "a field holding  and &lt;name&gt;"
C9 "a <job-id> placeholder and <b>kept</b> markup" => "a &lt;job-id&gt; placeholder and <b>kept</b> markup"
 Test Files  1 passed (1)
```

C12 after: `npx vitest run tests/state/sessions/source/source.test.ts --reporter=dot` printed `Test Files  1 passed (1)` / `Tests  27 passed (27)`; the row alone (`-t "reads a cut file again" --reporter=verbose`) printed `<check mark> |unit| tests/state/sessions/source/source.test.ts > a source tab over a file that changes on disk > 'reads a cut file again for a message <ellipsis>' 29ms` and `Tests  1 passed | 26 skipped (27)`. The row's expectations are unchanged (`git diff HEAD -- tests/state/sessions/source/source.test.ts` prints nothing). In the final `npm run test:quick` the file is in the unit tier, which failed only on `library.test.ts`.

### The looks (orchestrator, at landing, on the scratch server)

- C1: Projects board, list mode, scrolled until the second section's heading is stuck: one header row directly above its first row, no row above the strip; the same in card mode, in Focus and in Funding's list mode; also Settings, Keys and Catalogue scrolled (hand-back 2).
- C3: Funding in a 420 px pane: no Award column, Title wide, headers "Title", "Funder", "Status", "Deadline".
- C4: a person's page with 1 in review, 2 publications, 1 dead-end: pills "1 in review", "2 publications", "1 dead-end", "4 projects", toned, no marker; University of Twente: "1 publication"; the Pillars strip pills keep their marker.
- C8: the MSc supervision Education entry's page: no KEY, META as "Students" with 7, the note as prose, RELATED as named presses, an unknown id muted with its tooltip, no CV SECTION or CV PLACE; its card on the Education board; a person's and a task's page.
- C9: the UTwente HPC card on Resources reads "job I/O on /local/<jobid>".
- C10: a failed fetch through the fake ssh: the toast and the status line say the ssh line and git's line, as Changes does.
- C11: the compile database form and the launch configuration form say "commas".

## Verify list

1. `npm run diagrams` changed `docs/diagrams/{layer-data,layer-state,layer-views,layers,writes}.{dot,svg}`. `npm run test:quick` (final run, `quick4.log`) does not print "every command passed": the ASCII gate, prettier, svelte-kit sync, svelte-check, eslint and vitest checks print `ok`; vitest fails on `library.test.ts` (17 rows) and vitest slow on 53 rows in 8 files under `src/lib/server/machine` tests; the output and the evidence that these come from the required `TMPDIR` are under "Every whole-suite command", item 4.
2. ASCII gate over every changed file except the SVGs: `printf` list of `git diff HEAD --name-only` plus untracked through `perl -ne 'print ... if /[^\x00-\x7F]/'` printed one line, `.scratch/migration/agents/spec.md:103` (the orchestrator's text, which quotes "Linkoping" with its accent as the example of the config exception). The quick run's ASCII gate printed `ok`.
3. `npx vitest run tests/checks/config/config-folder.test.ts tests/data/shapes/catalog-files/vocab.test.ts tests/checks/source/keys.test.ts tests/state/sessions/source/source.test.ts tests/ui/html.dom.test.ts` and every other test file written pass in the final quick run (all in its passing tiers; `library.test.ts` is not a file this step writes). Covering runs during the work: `boards.test.ts keys.test.ts` 57/57; `board-new-project.test.ts hub-names.test.ts hub-vocab.test.ts comment-width.test.ts html-sites.test.ts size.test.ts` 129/129; `zenodo.test.ts writes-collection.test.ts` alone 74/74 (they timed out in a quick run that shared the machine with a svelte-check and a knip run).
4. Greps:
   - `grep -rn --exclude=local.yml -E '^\s+[a-z_]+_one:' config/text` prints `config/text/views/academic/present.yml:37:        drop_one: Drop one image at a time.` only.
   - `git grep -n -E "_one['\"]" -- src` prints `src/lib/state/life/present.ts:569:    if (files.length !== 1) return t('present.drop_one');` only.
   - `git grep -n '=== 1 ?' -- src`: 46 hits. Each is a choice of a value, not of catalogue words (an array's lone item, a name or path suffix, a key's case, a direction `by === 1`, a YAML chomp), except: `src/lib/state/workbench/navigation/pages.ts:133` (hand-back 1); `src/lib/state/boards/board/filter-menu.ts:278` (the singular names the picked item, `board.group_picked_more` counts the rest); `src/lib/views/shared/explorer/tree/menu/row-ops.ts:346` (the move question's detail, Decision 5); `src/lib/views/shared/changes/groups/change-menu.ts:187` (names the one file, Decision 5); `src/lib/views/system/help/keys/rows.ts:98,124` (next or previous, `by` is a direction); `src/lib/data/sources/deck/spec.ts:66` and `src/lib/state/system/audit.ts:73` (name suffixes, as the brief says).
   - `git grep -n -E '(count|length|size|total) === 1\)' -- src`: 37 hits, each a branch on a lone item (`if (x.length === 1) return x[0]` and the like), none a choice of words; `src/lib/views/shared/changes/groups/change-menu.ts:263` names the one file (Decision 5).
   - The pairs under "Pairs picked by hand", each now read through the helper: `pillars.projects` at `src/lib/views/shared/card/card.ts:245` and `src/lib/views/shared/card/record/RecordCounts.svelte:66`; `repositories.ago_*` at `src/lib/state/sources/repositories/file-git.ts:127-132`; `latex.problem_pill` at `src/lib/views/shared/latex/Main.svelte:122`; `focus.command.manifests` at `src/lib/views/boards/focus/CommandCenterView.svelte:97`; `settings.fold_fields` and `fold_entries` at `src/lib/views/system/workbench/editors/Fold.svelte:49-50`; `files.problems_title` at `src/lib/state/sources/explorer/rows/decorations.ts:179`; the search sentences at `src/lib/state/sources/search/words.ts:18-43` (`search.hits`, `search.files`, `search.occurrences` filled into `search.count`, `count_replacing`, `replace_ask`, `replace_ask_empty`); `ui.tab_close_dirty` not done (hand-back 1).
5. Unused exports, below.
6. Outside paths, above.
7. `sh utils/folder-check.sh` printed nothing (exit 0).
8. Prose of the new strings: each new catalogue string was read against the prose rule. `collection.open_record` "Open this record as its own tab" and `collection.no_record` "No record has the id {0}" are tooltip sentences, so they carry no full stop, as the neighbouring tooltips in `collection.yml` do. The plural `one` forms say `{0}` in place of a written 1, so a language whose `one` form covers other numbers (Russian 21) reads right.

## Unused exports

`sh utils/unused-exports.sh` compared with `../O168-base/unused-exports.txt` (`diff`):

```
1c1
< Unused exports (225)
---
> Unused exports (227)
125c125
< src/lib/state/boards/collection/index.ts: kindOf, hasStatusField, statusValues
---
> src/lib/state/boards/collection/index.ts: hasStatusField, statusValues
177a178,179
> src/lib/state/system/machine/debug/launch-form.ts: PARTS
> src/lib/state/system/machine/lsp/clangd/cpp-form.ts: PARTS
```

- `collection/index.ts: hasStatusField, statusValues`: in the base list already; the line changed because `kindOf` is now module-private.
- `launch-form.ts: PARTS` and `cpp-form.ts: PARTS`: item 9 removed their only outside readers (`LaunchEdit.svelte:79`, `CppRows.svelte:86,122`); each is still read inside its own file (`launch-form.ts:37,106,114,150,155`, `cpp-form.ts:65,86,97`), so the fix is to drop `export`, in two files outside the path list (hand-back 3).

## Files with line counts (`diff -rq` against `../O168-base`, base / now)

| File | Base | Now |
|---|---|---|
| config/catalogs/vocab.yml | 315 | 315 |
| config/options/catalogs/vocab.yml | 425 | 433 |
| config/text/app.yml | 338 | 338 |
| config/text/findings.yml | 505 | 508 |
| config/text/server.yml | 633 | 635 |
| config/text/statusbar.yml | 248 | 258 |
| config/text/views/academic/latex.yml | 223 | 227 |
| config/text/views/apps/apps.yml | 202 | 212 |
| config/text/views/boards/collection.yml | 79 | 80 |
| config/text/views/boards/deposit.yml | 94 | 95 |
| config/text/views/boards/focus.yml | 147 | 149 |
| config/text/views/boards/projects.yml | 118 | 119 |
| config/text/views/feeds/literature.yml | 108 | 111 |
| config/text/views/personal/calendar.yml | 47 | 48 |
| config/text/views/sessions/agents.yml | 17 | 19 |
| config/text/views/sessions/changes.yml | 115 | 121 |
| config/text/views/sessions/session-detail.yml | 43 | 44 |
| config/text/views/sessions/session-list.yml | 73 | 76 |
| config/text/views/sessions/terminal.yml | 131 | 132 |
| config/text/views/sessions/timeline.yml | 14 | 15 |
| config/text/views/sources/data.yml | 133 | 139 |
| config/text/views/sources/files.yml | 339 | 344 |
| config/text/views/sources/repositories.yml | 339 | 357 |
| config/text/views/sources/search.yml | 190 | 184 |
| config/text/views/sources/source.yml | 239 | 242 |
| config/text/views/structure/pillars.yml | 23 | 24 |
| config/text/views/system/audit.yml | 73 | 75 |
| config/text/views/system/history.yml | 114 | 120 |
| config/text/views/system/machine/debug.yml | 113 | 113 |
| config/text/views/system/machine/hpc.yml | 126 | 128 |
| config/text/views/system/machine/processes.yml | 54 | 57 |
| config/text/views/system/workbench.yml | 305 | 311 |
| src/lib/data/helpers/finding-text.ts | 47 | 176 |
| src/lib/data/index.ts | 840 | 842 |
| src/lib/data/model/model-collections.ts | 559 | 562 |
| src/lib/data/prose/text-edits.ts | 345 | 352 |
| src/lib/data/shapes/boards/categories.ts | 159 | 187 |
| src/lib/data/shapes/catalog-files/vocab.ts | 553 | 558 |
| src/lib/data/sources/config/catalog/value-words.ts | 135 | 138 |
| src/lib/data/sources/config/merge/language.ts | 137 | 145 |
| src/lib/data/sources/config/merge/text.ts | 164 | 216 |
| src/lib/data/sources/config/merge/workspace-layer.ts | 353 | 356 |
| src/lib/data/sources/config/sections/boards.ts | 262 | 284 |
| src/lib/server/content/audit/projects.ts | 591 | 592 |
| src/lib/server/content/audit/rules.ts | 353 | 367 |
| src/lib/server/core/git/failure.ts | 49 | 48 |
| src/lib/server/core/words.ts | 26 | 44 |
| src/lib/server/edit/writes/config/config-fit.ts | 568 | 567 |
| src/lib/server/git/git-routes.ts | 526 | 529 |
| src/lib/server/machine/processes/failure.ts | 54 | 57 |
| src/lib/shell/keys/rows/approve/CppRows.svelte | 190 | 189 |
| src/lib/shell/status/LanguageItems.svelte | 354 | 359 |
| src/lib/shell/status/LatexItem.svelte | 144 | 140 |
| src/lib/shell/status/notices/Bell.svelte | 112 | 110 |
| src/lib/shell/status/RepoItems.svelte | 302 | 294 |
| src/lib/shell/status/StatusBar.svelte | 453 | 441 |
| src/lib/state/boards/board/filter-menu.ts | 417 | 415 |
| src/lib/state/boards/board/new-project.ts | 154 | 172 |
| src/lib/state/boards/collection/bar.ts | 563 | 563 |
| src/lib/state/boards/collection/index.ts | 782 | 779 |
| src/lib/state/boards/record-board.ts | 277 | 279 |
| src/lib/state/boards/structure/cross-links.ts | 395 | 395 |
| src/lib/state/client/selectors.svelte.ts | 871 | 877 |
| src/lib/state/sessions/latex/actions.ts | 392 | 388 |
| src/lib/state/shared/words/text.ts | 120 | 156 |
| src/lib/state/sources/explorer/rows/decorations.ts | 182 | 181 |
| src/lib/state/sources/repositories/file-git.ts | 232 | 222 |
| src/lib/state/sources/repositories/repositories.ts | 888 | 885 |
| src/lib/state/sources/search/words.ts | 104 | 72 |
| src/lib/state/system/apps/flows.ts | 242 | 245 |
| src/lib/state/system/apps/words.ts | 151 | 128 |
| src/lib/state/system/machine/hpc/hpc.svelte.ts | 180 | 180 |
| src/lib/state/system/machine/lsp/edits.ts | 509 | 506 |
| src/lib/state/system/machine/processes/processes.ts | 149 | 149 |
| src/lib/state/system/machine/refactor/notice-words.ts | 20 | 25 |
| src/lib/state/workbench/rail-badges/rail-badges.svelte.ts | 413 | 413 |
| src/lib/ui/controls/heads/GroupHead.svelte | 272 | 275 |
| src/lib/ui/display/table/table-rows.ts | 83 | 88 |
| src/lib/ui/display/table/Table.svelte | 203 | 207 |
| src/lib/ui/frame/Pane.svelte | 261 | 267 |
| src/lib/ui/html.ts | 804 | 838 |
| src/lib/ui/tree/Disclosure.svelte | 84 | 97 |
| src/lib/views/apps/frame/ApprovalPanel.svelte | 217 | 215 |
| src/lib/views/boards/collection/EntryList.svelte | 159 | 176 |
| src/lib/views/boards/deposit/Deposit.svelte | 468 | 466 |
| src/lib/views/boards/focus/CommandCenterView.svelte | 286 | 278 |
| src/lib/views/boards/projects/BoardList.svelte | 119 | 123 |
| src/lib/views/feeds/literature/Literature.svelte | 329 | 327 |
| src/lib/views/feeds/literature/LiteratureCard.svelte | 280 | 276 |
| src/lib/views/personal/calendar/Calendar.svelte | 425 | 425 |
| src/lib/views/sessions/session-list/session-list.ts | 223 | 221 |
| src/lib/views/sessions/terminal/grid/TerminalGrid.svelte | 517 | 515 |
| src/lib/views/shared/card/card.ts | 255 | 257 |
| src/lib/views/shared/card/feed/literature-card.ts | 61 | 58 |
| src/lib/views/shared/card/project/CardSessions.svelte | 125 | 121 |
| src/lib/views/shared/card/record/RecordCounts.svelte | 103 | 88 |
| src/lib/views/shared/changes/CommitBox.svelte | 316 | 307 |
| src/lib/views/shared/changes/groups/change-menu.ts | 303 | 300 |
| src/lib/views/shared/changes/groups/GroupList.svelte | 366 | 365 |
| src/lib/views/shared/explorer/tree/control/fixing.svelte.ts | 180 | 174 |
| src/lib/views/shared/explorer/WritingFixDialog.svelte | 159 | 159 |
| src/lib/views/shared/forms/entry/card/EntryCard.svelte | 347 | 347 |
| src/lib/views/shared/forms/entry/card/EntryFields.svelte | 433 | 475 |
| src/lib/views/shared/forms/NewIdeaForm.svelte | 215 | 216 |
| src/lib/views/shared/latex/Main.svelte | 175 | 165 |
| src/lib/views/shared/links/CrossLinks.svelte | 203 | 207 |
| src/lib/views/shared/sessions/sections/AgentRows.svelte | 173 | 167 |
| src/lib/views/shared/sessions/sections/details/detail-facts.ts | 271 | 269 |
| src/lib/views/shared/sessions/sections/TimelineTurns.svelte | 208 | 206 |
| src/lib/views/shared/writes/undo-said.ts | 54 | 55 |
| src/lib/views/sources/data/Data.svelte | 142 | 145 |
| src/lib/views/sources/data/recover/RecoverPlan.svelte | 178 | 175 |
| src/lib/views/sources/data/recover/RecoverProgress.svelte | 88 | 86 |
| src/lib/views/sources/repositories/apps/AppSourceItem.svelte | 78 | 76 |
| src/lib/views/sources/repositories/diff/hunk-acts.svelte.ts | 75 | 73 |
| src/lib/views/sources/repositories/diff/HunkBar.svelte | 258 | 252 |
| src/lib/views/sources/repositories/merge/Merge.svelte | 325 | 323 |
| src/lib/views/sources/repositories/repo/Repo.svelte | 391 | 387 |
| src/lib/views/sources/repositories/RepoList.svelte | 363 | 361 |
| src/lib/views/sources/search/References.svelte | 494 | 495 |
| src/lib/views/sources/source/actions/submit-job.svelte.ts | 242 | 240 |
| src/lib/views/system/history/History.svelte | 492 | 490 |
| src/lib/views/system/history/rows.ts | 114 | 108 |
| src/lib/views/system/machine/debug/LaunchEdit.svelte | 114 | 113 |
| src/lib/views/system/machine/hpc/Capacity.svelte | 168 | 168 |
| src/lib/views/system/workbench/editors/Editor.svelte | 305 | 303 |
| src/lib/views/system/workbench/editors/Fold.svelte | 87 | 83 |
| src/lib/views/system/workbench/settings/Header.svelte | 113 | 111 |
| src/lib/views/system/workbench/settings/said.ts | 35 | 34 |
| src/lib/views/system/workbench/settings/scopes/ScopeBar.svelte | 229 | 227 |
| tests/checks/config/config-folder.test.ts | 850 | 868 |
| tests/checks/source/catalog-reads.ts | new | 104 |
| tests/checks/source/keys.test.ts | 866 | 867 |
| tests/data/helpers/hub-names.test.ts | 385 | 386 |
| tests/data/shapes/catalog-files/vocab.test.ts | 363 | 390 |
| tests/data/sources/config/boards.test.ts | 417 | 421 |
| tests/data/sources/config/catalog/options-schema.test.ts | 368 | 368 |
| tests/data/sources/config/layers/hub-vocab.test.ts | 546 | 550 |
| tests/data/sources/config/layers/language.test.ts | 180 | 243 |
| tests/server/edit/config-value.test.ts | 503 | 505 |
| tests/state/sessions/source/source-server.ts | 209 | 238 |
| tests/state/system/apps/flows.test.ts | 254 | 254 |
| tests/state/system/lsp/edits.test.ts | 377 | 377 |

The step's new-project.ts and selectors.svelte.ts counts are from after the last edit (`wc -l`: 172 and 877).

Outside the base copy's folders: `docs/apps.md` (+14 lines, the plural forms paragraph and its YAML example) and the generated diagrams above.

## Every test assertion or fixture edited, before and after

- `tests/data/helpers/hub-names.test.ts:278-281`: the `HubVocab` literal gains `new_project_dir: {}` (the type's new field).
- `tests/data/sources/config/layers/hub-vocab.test.ts`: `:112` and `:191` `label: 'idea'` to `label: { one: 'idea', other: 'ideas' }`; `:135` hub text `label: idea` to `label: { other: idea }` and `:142` `label: 'idea'` to `label: { other: 'idea' }`; `:376-377` `label: ideas` / `label: grants` to `label: { other: ideas }` / `label: { other: grants }`; `:391` `expect(idea).toEqual({ key: 'idea', label: 'ideas', ... })` to `label: { other: 'ideas' }`.
- `tests/data/sources/config/boards.test.ts`: `:210` `label: 'x'` to `label: { other: 'x' }`; `:222,:226` `label: 'y'` to `label: { other: 'y' }`; `:242` `label: 'z'` to `label: { other: 'z' }`; the hub-file rows at `:270-320` `label: X` (and `Y`) to `label: { other: X }` (and `Y`), seven rows. No expectation changed.
- `tests/data/shapes/catalog-files/vocab.test.ts:366`: `label: X` to `label: { other: X }` in the other-hub row.
- `tests/data/sources/config/layers/language.test.ts:114`: `toEqual(Object.keys(ENGLISH).sort())` to `toEqual([...Object.keys(ENGLISH), LOCALE_ENTRY].sort())` (the catalogue now carries the reserved locale entry).
- `tests/server/edit/config-value.test.ts:232-237`: `expect(idea).toEqual({ key: 'idea', label: 'idea', ... })` to `label: { one: 'idea', other: 'ideas' }` (the shipped row's label). `:390-401`, the lab row "a changed row of categories, by its key": the value written was `{ ...one, label: 'Ideas' }` and `holds` checked `label: 'Ideas'`; both now use `label: { one: 'Idea', other: 'Ideas' }`, since a text label is refused by the Settings form's rule ("Entry 3, field label: This option takes text" before the options change, "categories.2.label must be a map" from the merge).
- `tests/data/sources/config/catalog/options-schema.test.ts:162`: the fixture `label: Drafts` to `label: { other: Drafts }`.
- `tests/state/system/apps/flows.test.ts:172`: `t('apps.remove_secrets', '/apps/notes', '2')` to `plural('apps.remove_secrets', 2, '/apps/notes', '2')`.
- `tests/state/system/lsp/edits.test.ts:280-281`: `notice: 'lsp_edit_typed_one', words: ['hub/a.py']` to `notice: 'lsp_edit_typed', words: ['hub/a.py', '1']`.
- `tests/checks/source/keys.test.ts`: `expect(orphaned).toEqual([])` to `expect(orphansOf(found, keys, allowed)).toEqual([])`; `expect(SENTENCE_KEYS.filter(...))` to `expect(bases.filter(...))` (the findings keys with a plural form named once).
- Rows added under the entries the brief allows: C6 (G13) `config-folder.test.ts:379-396` (three rows) and `vocab.test.ts:72-93` (three rows); C7 (G24) `keys.test.ts` "reaches every form of a plural key read only by a count, and reports a plural key read by nothing"; G130 `language.test.ts:195-233` (four rows); item 10 (G28) the fixture `source-server.ts` (`digestInTurn`).

## Sentences of docs/HELP.md and docs/data-map.md the change makes false

None found: `docs/HELP.md:124` (New project and `new_project_dir`), `:130` (the row of count buttons) and `:396` (an entry's page laid out as a project's) hold, and `docs/data-map.md:71` (`categories`) names no label shape.

## Judgment calls

- `LOCALE_ENTRY = 'locale'` is a reserved entry of the flattened catalogue that carries `settings.locale`, so `t()`, the server's `words` and `findingText` pick by one catalogue argument.
- The audit's counted findings now have the folded key, so a mute stored against the old `_one` key's signature stops matching for those findings.
- The page's `plural`/`pluralOf`, the server's `pluralWords` and the audit's `pluralSentence` are separate readers over the one pick `pluralText` in `finding-text.ts`.
- `LSP_COUNTED_NOTICES` carries the count in the notice's words, so `noticeWords` reads the folded key by that count.
- Key names chosen in the fold: `settings.scope_unsaved_changes` (from `scope_unsaved_one` and `scope_unsaved_many`, since `scope_unsaved` is an unrelated sentence, `config/text/views/system/workbench.yml:105`); `recover.fetch_one` ("Fetch", a button that fetches one file, no count) renamed `recover.fetch_file` (`config/text/views/sources/data.yml:45`, read at `RecoverPlan.svelte:90`), so no `_one` key is left that is no plural.
- Category labels: a section heading and a bar slice read the `other` form, so the idea category's heading reads "ideas" where it read "idea"; the other rows' shipped labels were already their plural or have one form.
- RecordCounts: the waiting count's glyph is dropped (Disclosure draws a count and words); `board.record_count` is removed and `board.record_waiting` reworded to "waiting on {0}" beside the bold count.
- Item 7 (`src/lib/ui/html.ts`, `placeholderTag`): a tag the sanitiser does not keep is shown as text only when its name has a hyphen or `document.createElement(name)` is an `HTMLUnknownElement`; any other tag goes to the sanitiser as before, so `<script>` is still dropped (C9 after) and HTML comments pass to the sanitiser untouched. By reading, not by a case: `<svg>` and `<math>` created in the HTML namespace are `HTMLUnknownElement`, so in a field they now show as text where they were dropped, and a name the browser knows but the sanitiser drops (`<video>`) is still dropped.
- Item 1: the `th` subtraction applies to every table, not only a `stays` header, so a table header under a strip leaves no gap.
- CommandCenterView: `{@html plural(...)}` became `<span>{plural(...)}</span>`, since the strings hold no markup.
- Item 6: the page body is drawn whole (no clamp); a records field opens `pageView(targets[0], id, label)` for a non-project target and the project view for a project; an unnamed field whose value equals the entry's key is skipped; `tick_yes`/`tick_no` went with the Website group; `kindOf` is module-private.
- `NewProjectWhere` in `new-project.ts` is module-private (an object type of the exported `newProjectFolder`'s parameter).

## User-visible changes, before and after

- List mode: the header row was drawn again under each strip and a 10px band of rows showed above a stuck strip; now the header stands once above the first row and nothing shows above a strip, in every view that sticks a strip in the pane body.
- New project in another hub: the folder started empty; now it starts at that hub's `new_project_dir` for the tier.
- Collection lists: raw keys "funder", "status" as headers; now "Funder", "Status"; an empty column is dropped before the Title shrinks.
- Record page counts: bare coloured words "1 publications"; now pills "1 publication" with the count in bold.
- Every counted phrase: "1 publications", "1 projects" and similar forms became the singular for 1; the search line keeps its words.
- Entry pages: KEY, raw ids, the Website group gone; records as named presses; unknown ids muted with a tooltip.
- A card's Markdown field: `<jobid>` was dropped; now shown as text.
- A failed fetch: the toast said git's line only; now the ssh line too.
- The compile database and launch forms: "split by ,." to "split by commas."
- The idea category's section heading and bar slice read "ideas" (the label's `other` form) where they read "idea".
- `<svg>` or `<math>` written in a card's Markdown field shows as text where it was dropped.
- Settings, Vocabulary, Categories: a row's `label` was one text box; it is now a list of form and words pairs (form a choice of zero, one, two, few, many, other).

## Program-made file changes

- `npm run diagrams`: `docs/diagrams/layer-data.dot`, `layer-data.svg`, `layer-state.dot`, `layer-state.svg`, `layer-views.dot`, `layer-views.svg`, `layers.dot`, `layers.svg`, `writes.dot`, `writes.svg`.
- `npm run test:quick` and vitest: `.svelte-kit/` and `node_modules/.vite` caches (git-ignored), temporary folders under `.agents/scratch/tmp`.
- Shell redirects, all inside `.agents/scratch/` and removed with it: `quick.log`, `quick2.log`, `quick3.log`, `quick4.log`, `b.txt`, `unused-base.txt`, `unused-now.txt`, `first-run.out`, `red-rows.out`, `red-rows2.out`, `after.out`, `slow-probe.log`, `old-block.txt` (deleted the moment it was written).
- No file of the step's diff was changed by a program other than `npm run diagrams`; every edit was made with Edit or Write.
- `.agents/scratch/` is removed (`rm -rf .agents/scratch`; `ls -a .agents` prints `.`, `..`, `plan.yaml`). The case programs' and configs' source is quoted above, so they can be written again to rerun the cases.

## Every whole-suite command

All with `PATH`, `TMPDIR=$PWD/.agents/scratch/tmp` and `GIT_CEILING_DIRECTORIES=$PWD/.agents/scratch`:

1. `npm run test:quick` (log `quick.log`): FAILED comment-width (7 lines), html-sites (the CommandCenterView `{@html}`), size (`keys.test.ts` 951 lines), `boards.test.ts` (5 rows made false by the label map), `library.test.ts` (17 rows); stopped during the slow tier. Each failure in a changed file was fixed and its file rerun alone.
2. `npm run test:quick` (log `quick2.log`): FAILED svelte-check (`selectors.svelte.ts:822`, `string | null` into `string`, fixed in `new-project.ts`), `library.test.ts` (17), and `zenodo.test.ts`/`writes-collection.test.ts` timeouts under the extra load (74/74 alone); stopped in the slow tier at `debug-adapters.test.ts`.
3. `npm run test:quick` (log `quick3.log`): every tier `ok` up to vitest; vitest FAILED on `library.test.ts` (17); vitest slow FAILED with 56 rows in 10 files, of which `tests/server/edit/config-value.test.ts` (2 rows, made false by the label map, carried; fixed by the `label` control of the Settings form) and `tests/data/hubs/hub-portfolio.test.ts` (1 row, a 20 s timeout) were not environmental. `config-value.test.ts` with `config-folder.test.ts` then passed alone (54 passed, 2 skipped), as did `hub-portfolio.test.ts` and the tests that name categories or read the options schema (`options-schema.test.ts`, `hub-scope.test.ts`, `collection-fields.test.ts`, `templates.test.ts`, `sparse-card.test.ts`, `board-rules.test.ts`, `hub-facets.test.ts`, `normalise.test.ts`, `collections.test.ts`).
4. `npm run test:quick` (log `quick4.log`), the final run, after `npm run diagrams`:

```
ok      ASCII gate (1.5 s)
ok      prettier (2.4 s): All matched files use Prettier code style!
ok      svelte-kit sync (3.0 s)
ok      svelte-check (11.9 s): 1794107807050 COMPLETED 589 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (12.1 s)
ok      vitest checks (132.0 s): Duration  116.76s (transform 56.66s, setup 0ms, import 120.19s, tests 245.23s, environment 5ms)
FAILED  vitest (158.7 s)
 Test Files  1 failed | 226 passed | 67 skipped (294)
      Tests  17 failed | 3323 passed | 851 skipped (4191)
FAILED  vitest slow (981.8 s)
 Test Files  8 failed | 77 passed (85)
      Tests  53 failed | 798 passed | 342 skipped (1193)
test:quick: 985.0 s; failed: vitest, vitest slow
exit 1
```

   The failing files and rows: `tests/server/machine/lsp/library.test.ts` 17 (unit tier); slow tier `tests/server/machine/apps/tools/debug-adapters.test.ts` 16, `languages.test.ts` 12, `language-features.test.ts` 10, `tasks.test.ts` 4, `tests/server/machine/debug/channel.test.ts` 4, `tests/server/machine/pty/agent-pane.test.ts` 4, `pane-screen.test.ts` 2, `sessions.test.ts` 1. None of them is a file this step writes, and the step changes no file under `src/lib/server/machine/` other than `processes/failure.ts`, nor any under `src/lib/server/core/` other than `git/failure.ts` and `words.ts` (`git diff HEAD --name-only -- src/lib/server/machine src/lib/server/core`). Causes, read from the output and the code: the tmux rows fail with "error connecting to .../.agents/scratch/tmp/oculus-tmux-.../server.sock (File name too long)" (a 116-character socket path); the library rows by the rule at `src/lib/server/machine/lsp/library/rules.ts:1-3` ("a path with a segment that starts with a dot" is never named), since every scratch folder is under `.agents`. A row of each kind run against the unchanged source through `base.config.mjs` fails the same way: `library.test.ts` (17 failed | 19 passed, as in the worktree), `languages.test.ts -t "starts with the first document"` (`AssertionError: expected [ 'null', [] ] to deeply equal [ <ellipsis>(2) ]`), `sessions.test.ts -t "starts, lists, feeds"` (File name too long), `debug-adapters.test.ts -t "executable descriptor"` (2 failed, timed out in 60000ms). The spawned hosts and servers of the apps rows run the worktree's code even in those base runs, since only the test process's imports are redirected, so for the app-host rows this comparison shows the failure does not come from the test process's code, and the diff above shows no changed file on their path. These rows cannot pass under the `TMPDIR` the rules set; the coordinator's correction names this `TMPDIR` for every program, `npm run test:quick` included.
5. `npx svelte-check --output machine`: `COMPLETED 4638 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
6. `sh utils/unused-exports.sh`, above.

## History-word grep

`git diff HEAD -U0 | grep "^+" | grep -niE "\b(before|used to|no longer|still|previously)\b"` over the added lines:

- `.scratch/migration/agents/spec.md` (two lines): the orchestrator's text.
- `config/text/views/sessions/changes.yml` "{0} file is still in conflict ..." / "{0} files are still in conflict ..." and `config/text/views/sources/repositories.yml` "{0} conflict is still open ..." / "{0} conflicts are still open ...": interface words about the present state of a merge, carried from the folded pairs.
- "the key before it holding an `other` form" (`finding-text.ts`), "ssh's cause before git's" (`git-routes.ts`), "goes before any column that holds one" (`table-rows.ts`), "dropped before one that holds" (`EntryList.svelte`), "labels inline before their values" (`EntryFields.svelte`): order, not time.

No comment or test title says what the code was.

## Line widths

`tests/checks/source/comment-width.test.ts` passed in the final quick run's checks tier. Added lines over 100 columns are strings, YAML rows of the one-line-per-row `categories:` table and a one-line YAML comment (`config/catalogs/vocab.yml`, the file's own form), and eslint comments in markup.

# Round 1

Everything in the round is done. Two things stand: `npm run test:quick` does not print "every command passed", because 70 rows fail under the `TMPDIR` of `.agents/scratch/` alone (each named below with its line), and four unit rows and three slow rows that timed out in the full run pass when their files run alone; and `src/lib/shell/rail/UpdateTray.svelte`, a scroller ruling 2's survey found outside any `Pane` with the same band above its stuck strip, is handed back unchanged (below).

## Hand-back

`src/lib/shell/rail/UpdateTray.svelte` is not changed. Ruling 2's survey (every Svelte file whose style scrolls, and whether it reaches `GroupHead.svelte` or `Table.svelte` through its imports) found its `.tray` (`overflow: auto`, `padding: 12px`, `UpdateTray.svelte:247-258`) holding a `GroupHead` (`:170`). The tray is drawn in a `Modal` of `src/lib/shell/Workbench.svelte:57`, under no `Pane`, so `--pane-pad-top` is unset there and the strip's `top` falls back to `0px`: the stuck strip stands 12px below the tray's top edge and the tray's rows scroll through that band, on the base (`top: var(--group-above)`, `O168-base/src/lib/ui/controls/heads/GroupHead.svelte:221`) and after this round alike. The fix is `--pane-pad-top: 12px` on `.tray`. The round lists scrollers under a `Pane`, and this file is not in any path list, so it is handed back for a ruling.

## Rulings, what changed and the check

1. **Dirty-tab pair folded.** `config/text/ui.yml:114-116` holds `tabs_close_dirty: { one: Do you want to save the changes to this tab before it closes?, other: Do you want to save the changes to {0} tabs before they close? }`; `tab_close_dirty` is gone (`grep -rn "tab_close_dirty" src tests config` prints nothing). `src/lib/state/workbench/navigation/pages.ts:133` is `return plural('ui.tabs_close_dirty', count, count);` (import at `:40`), and `src/lib/shell/panes/strip/close-question.svelte.ts:82` is `plural('ui.tabs_close_dirty', 1, 1)` (import at `:15`). The tests read the folded key with the same sentences: `tests/shell/panes/strip/tab-menu.test.ts:146,157,168,224` read `catalog('ui.tabs_close_dirty.one')` and `:179` reads `catalog('ui.tabs_close_dirty.other', 3)`; `tests/shell/panes/strip/app-editor-close.test.ts:124,133,142` read `t('ui.tabs_close_dirty.one')`. `tests/state/workbench/navigation/pages.test.ts:51,97,110,174` read the old key too and read `t('ui.tabs_close_dirty.one')` now; that file is on the brief's own list (`O168.md:226`). Check: `npx vitest run tests/shell/panes/strip/tab-menu.test.ts tests/shell/panes/strip/app-editor-close.test.ts tests/state/workbench/navigation/pages.test.ts tests/checks/source/keys.test.ts --reporter=dot` printed `Test Files  4 passed (4)` / `Tests  36 passed (36)`. `grep -rn "count === 1 ?" src` printed only `src/lib/state/system/audit.ts:73` and `src/lib/data/sources/deck/spec.ts:66`.
2. **Nested scrollers.** `src/lib/views/system/workbench/Settings.svelte:490` gives `.list` `--pane-pad-top: 0px`, and `src/lib/views/system/help/keys/Keys.svelte:158` gives `.view` `--pane-pad-top: 8px`, each with a comment naming the property's reader. The survey read every Svelte file under `src` whose style holds `overflow: auto` or `scroll` (46 files) and followed its Svelte imports to `GroupHead.svelte` or `Table.svelte`. Eight reach one; each was read:
   - `Settings.svelte`: `.list` scrolls (`flex: 1 1 auto`, `overflow: auto`) and holds `settings/List.svelte`'s GroupHeads with padding 0 against the Pane body's 10px: line added. Its `.contents` scroller holds `settings/Contents.svelte` (a TreeView, no GroupHead): unchanged.
   - `Keys.svelte`: `.view` is the scroller (`height: 100%`, `overflow: auto`, `padding: 8px 16px 16px`) holding its GroupHeads: line added.
   - `src/lib/views/system/workbench/Catalogue.svelte`: `.view` had `overflow: auto` with no height inside the Pane body, which is a block box, so it is as tall as what it holds and never scrolls; being a scroll container it held the group strips, so they never stuck, on the base and in round 0. `overflow: auto` and `min-height: 0` are removed from `.view` (`Catalogue.svelte:376-382`, with a comment), so the Pane body scrolls the view and its strips stick at the body's top edge with the body's own `--pane-pad-top`. This is a change a user sees, listed under ruling 11.
   - `src/lib/views/system/status/Hooks.svelte`: the only scroller is a `pre` (`:72-74`) holding text: unchanged.
   - `src/lib/views/system/machine/processes/AppHosts.svelte`: the only scroller is `pre.output` (`:132`, `:171-174`) holding text: unchanged.
   - `src/lib/views/academic/present/Present.svelte`: `.present` scrolls only in full screen (`:446-450`, `padding: 10px 12px`), the same top padding as the Pane body, so the inherited 10px is right: unchanged. Framed, it is `overflow: hidden` and holds a slide, no strip.
   - `src/lib/views/academic/present/presenter/Presenter.svelte`: `.text` (`:232-237`) holds the speaker notes in a `Surface`, no strip; the Table it reaches is in a slide drawn by `Framed`, outside `.text`: unchanged.
   - `src/lib/shell/rail/UpdateTray.svelte`: under no Pane; handed back above.
   C1 by reading, before and after, is under ruling 11.
3. **Unkept tags drawn as written.** `src/lib/ui/html.ts:560-575` (`TAG_NAME` at `:558`): the extension `UNKEPT_TAGS_AS_TEXT` escapes an inline HTML token whenever its element is not in `ALLOWED_TAGS`, and passes a kept tag and a comment (no tag name) to the sanitiser; `placeholderTag` and its `document.createElement` test are gone (`grep -n "placeholderTag\|createElement" src/lib/ui/html.ts` prints nothing). `tests/ui/html.dom.test.ts:45-56` holds the rows for `rsync <source> <target>`, `~/data/<data>`, `done by <time> today`, `the <title> of the page` and `/local/<jobid>`, each expecting the escaped text, and `:39-43` a row for `<script>alert(1)</script>`, expecting `&lt;script&gt;alert(1)&lt;/script&gt;` and no element. Two rows made false by the ruling are carried: `:29` drops `<script>alert(1)</script>` from the loop that compares `inlineMarkdown` with `sanitise(marked.parseInline(...))` (it now draws as text, so it is its own row), and the Literature row (`:105-106`) expects the sent abstract to show `&lt;script&gt;alert(1)&lt;/script&gt;` with no `<script` and no `onerror` (it asked for no `alert` at all; the script's words are text now).
4. **Tip key.** `config/text/views/sources/data.yml:46` is `fetch_file_title: Fetch {0} alone`, read at `src/lib/views/sources/data/recover/RecoverPlan.svelte:91` as `t('recover.fetch_file_title', name)`; `grep -rn "fetch_one_title" src config tests` prints nothing.
5. **`repositories.ts` split.** `src/lib/state/sources/repositories/diff/diff-view.ts` (new, 216 lines) holds `DiffMode`, `DiffView`, `diffViewShape`, `diffViewOf`, `toggleFolded`, `unfolded`, `modeAfter`, `typeWords`, `typeChangeWords`, `fileDeleted`, `fileKeys`, `ViewKeeper`, `viewKeeper`, `sameChanges` and `sameFiles`, with its own head comment. The moved block is the same text: `sed -n 169,371p` of `repositories.ts` before the move compared with lines 14 to the end of `diff-view.ts` printed `IDENTICAL`. The types `DiffMode` and `DiffView` and the shape `diffViewShape` moved with `diffViewOf`, which reads them. `repositories.ts:8-11` names `diff/diff-view.ts` for the diff pane's view state, and its import of `shapes.ts` drops `mapOfShape` and `mapShape`. The importers: `src/lib/views/sources/repositories/diff/Diff.svelte:82-91` (the two reads that stay in `repositories.ts` on two lines, so the component stays at 518 lines, under 520) and `src/lib/views/sources/repositories/diff/DiffSection.svelte:76-81`; no test imports a moved name (`grep -rnw` over `tests` for each name prints no import). `wc -l src/lib/state/sources/repositories/repositories.ts` prints `682`. `diff/` holds seven items. The round-0 sentence about `utils/size-allow.txt` is removed from "Files with line counts".
6. **Rows that pass on the unchanged tree.** Run against `O168-base`'s source through `.agents/scratch/base.config.mjs` (every import of `src/lib` sent to `O168-base/src/lib`): `CASE_FILES="tests/data/sources/config/layers/language.test.ts tests/data/shapes/catalog-files/vocab.test.ts" npx vitest run --config .agents/scratch/base.config.mjs --reporter=verbose -t "words a form outside the six plural forms|words a plural form of a key oculus holds as a plain text|reads a category with no label by its key, with no finding"` printed:
   ```
    <check mark> tests/data/shapes/catalog-files/vocab.test.ts > the vocabulary's words past its shape > reads a category with no label by its key, with no finding 608ms
    <check mark> tests/data/sources/config/layers/language.test.ts > the display language > words a form outside the six plural forms 238ms
    <check mark> tests/data/sources/config/layers/language.test.ts > the display language > words a plural form of a key oculus holds as a plain text 216ms
    Test Files  2 passed (2)
         Tests  3 passed | 36 skipped (39)
   ```
   What each preserves: 'words a form outside the six plural forms' keeps a language pack's `literature.cites.several` a finding (a key oculus's catalog lacks), now that the six forms of a plural key are accepted; 'words a plural form of a key oculus holds as a plain text' keeps `views.settings.few` a finding (a form of a key that is no plural key); 'reads a category with no label by its key, with no finding' keeps a category row with no `label` drawn by its key with no finding, now that `label` is a map of forms.
7. **Fallback sentence.** `docs/apps.md:310` now says: "Where the language does not give that form, the count is drawn in oculus's English words for the form where they give it, else in the language's `other`, else in English `other`, so a language that gives only `other` draws oculus's English `one` for a count of 1." The sentence names the language's `other` because the catalog is merged by dotted key, so a language's `other` replaces English `other`; the ruling's two steps alone would be false for a count whose form neither gives while the language gives `other`. Check, the case program `.agents/scratch/case-r1.test.ts` (an approved app giving Polish with only `literature.cites.other: "{0} cytowan"`, read through `withSettings('  locale: pl\n', ...)` and `pluralText`) printed `pl, only other given, count 1: 1 citation`, `count 3: 3 cytowan`, `count 5: 5 cytowan`, `findings: []`.
8. **Map labels.** `docs/templates.md:462` is `#     - { key: idea, label: { one: early idea, other: early ideas }, color: "#7c5cff", ... }`, and `tests/fixtures/hubs/deck-hub.ts:361` gives `publications` `label: { one: publication, other: publications }`. Check, the case program's row with both rows as a hub's `categories:` (`withHub`, then `findingLines` of the merge and of the readers, filtered to `categories`) printed `category findings: []` and `labels: [["idea","early ideas"],["publications","publications"]]`.
9. **`PARTS`.** `src/lib/state/system/machine/lsp/clangd/cpp-form.ts:26` and `src/lib/state/system/machine/debug/launch-form.ts:33` are `const PARTS = ',';`. Unused exports: see the verify lines.
10. **One locale lookup.** `src/lib/data/helpers/finding-text.ts:85-92` exports `catalogLocale(catalog)`, `byKey(catalog, LOCALE_ENTRY) ?? ENGLISH`; `pluralText` (`:107`) and `pluralOf` in `src/lib/state/shared/words/text.ts:108` read the locale through it, and `text.ts` no longer imports `LOCALE_ENTRY` or holds `'en'` (`grep -n "LOCALE_ENTRY\|'en'" src/lib/state/shared/words/text.ts` prints nothing). Check, the case program printed `en: 1 idea, 3 ideas` and, with the catalog's `locale` set to `pl`, `pl: 1 pomysl, 3 pomysly, 5 pomyslow`.
11. **Before and after for every change a user sees.**
    - Settings strips. Base: the strip's `top` is `var(--group-above)` (`O168-base/src/lib/ui/controls/heads/GroupHead.svelte:221`), so in `.list` (no top padding) a stuck strip stands at the list's top edge. Round 0: `top` less the inherited 10px, so the strip stood 10px above the edge, its top 10px cut off. After round 1: `--pane-pad-top: 0px` on `.list`, so the stuck strip stands at the list's top edge, as on the base. By reading.
    - Keys strips. Base: `top: 0` inside `.view`'s 8px top padding, so the stuck strip stood 8px below the view's top edge, with rows showing in that band (the band C1 ruling (a) removes in every view). Round 0: `top: -10px` against 8px of padding, the strip 2px above the edge and cut. After round 1: `top: -8px`, the stuck strip at the view's top edge with no band. By reading.
    - Catalogue strips. Base and round 0: the strips scroll away with the groups, since `.view` was a scroll container that never scrolls. After round 1: the Pane body scrolls the view, and a group's strip sticks at the body's top edge while its group is in view. By reading.
    - Audit signature of a count-1 marker or provisional finding. Base: the sentence key is `audit.msg_markers_one` or `audit.msg_provisional_one`; after: the folded keys `audit.msg_markers` and `audit.msg_provisional` with the same arguments (`src/lib/server/content/audit/projects.ts:140`, `:213-217`). The signature reads the key, so a mute stored for a count-1 finding no longer matches; for counts of 2 and more the key and the signature are unchanged. The case program's `signatureOf` with sample arguments printed `markers, 1, key audit.msg_markers_one: 9b1de0f56f22`, `markers, 1, key audit.msg_markers: fd12c8b33896`, `markers, 2, key audit.msg_markers (same key on both trees): 47e9d661d45a`, `provisional, 1, key audit.msg_provisional_one: 8a86e68ee9d3`, `provisional, 1, key audit.msg_provisional: 7b209a65c709`.
    - Waiting count. Base: a person's record page drew the waiting button as a `Tag` with the glyph `waiting` and the words "<n> waiting on <name>" (`board.record_waiting: '{0} waiting on {1}'`, `git show HEAD:src/lib/views/shared/card/record/RecordCounts.svelte`); after: `src/lib/views/shared/card/record/RecordCounts.svelte:55-77` draws each button as the `Disclosure` pill, the count in bold beside "waiting on <name>" (`board.record_waiting: 'waiting on {0}'`), with no glyph. By reading.
    - Entry page body. Base: the entry's page drew a body field through the card's `text` snippet, which cut a long body with `Clamp` and its open control when the card was handed `onmore` (`O168-base/src/lib/views/shared/forms/entry/card/EntryFields.svelte:157-167`); after: the page's `pageField` (`EntryFields.svelte:321`, the body at `:349-352`) draws the body whole through `inlineMarkdown`, with no `Clamp` (round 0, item 6). By reading.
    - Dirty-tab question: the same sentences on the base and after, now one key (C5 below).
    - Inline fields: a tag the sanitiser does not keep (`<source>`, `<data>`, `<time>`, `<title>`, `<script>` and any other) shows as written; on the base and in round 0 a known element's tag was removed with nothing in its place (the failing output below).

## The new rows, before and after

Before, on the step's tree before the change to `html.ts` (`npx vitest run tests/ui/html.dom.test.ts`):
```
     <cross> draws the tag in rsync <source> <target> as written, since the sanitiser keeps no such element 3ms
     <cross> draws the tag in ~/data/<data> as written, since the sanitiser keeps no such element 2ms
     <cross> draws the tag in done by <time> today as written, since the sanitiser keeps no such element 1ms
     <cross> draws the tag in the <title> of the page as written, since the sanitiser keeps no such element 1ms
AssertionError: expected 'rsync  &lt;target&gt;' to be 'rsync &lt;source&gt; &lt;target&gt;' // Object.is equality
AssertionError: expected '~/data/' to be '~/data/&lt;data&gt;' // Object.is equality
AssertionError: expected 'done by  today' to be 'done by &lt;time&gt; today' // Object.is equality
AssertionError: expected 'the ' to be 'the &lt;title&gt; of the page' // Object.is equality
      Tests  4 failed | 9 passed (13)
```
The `/local/<jobid>` row passed in that run: round 0 already drew a name the document does not know as written, and the row keeps it so.

The `<script>` row and the carried Literature row were written after the change to `html.ts`, so their failing run is against `O168-base`'s source (`CASE_FILES=tests/ui/html.dom.test.ts CASE_ENV=jsdom npx vitest run --config .agents/scratch/base.config.mjs -t "script|abstract"`), where `<script>` reaches the sanitiser as it did in round 0 (round 0 passed every element HTML knows to the sanitiser):
```
     <cross> draws a script tag as the text it is, with no script element 8ms
     <cross> keeps the words of an abstract that held markup, and its card line holds no element of it 315ms
AssertionError: expected '' to be '&lt;script&gt;alert(1)&lt;/script&gt;' // Object.is equality
AssertionError: expected 'Tested <i>in vivo</i> on <img src="x"<ellipsis>' to contain '&lt;script&gt;alert(1)&lt;/script&gt;'
      Tests  2 failed | 1 passed | 11 skipped (14)
```

After (`npx vitest run tests/ui/html.dom.test.ts --reporter=verbose`): all 14 rows `<check mark>`, among them `draws a script tag as the text it is, with no script element`, the five `draws the tag in ... as written` rows and `keeps the words of an abstract that held markup, and its card line holds no element of it`; `Tests  14 passed (14)`.

## Cases run again

- C1, by reading: Settings, Keys and every scroller ruling 2 read (ruling 2 above), before and after under ruling 11. The look is the orchestrator's at landing.
- C5, the case program `.agents/scratch/case-r1.test.ts` through `.agents/scratch/tree.config.mjs` on the worktree's tree: `C5 count 1: Do you want to save the changes to this tab before it closes?` and `C5 count 3: Do you want to save the changes to 3 tabs before they close?`, the sentences of the base's `tab_close_dirty` and `tabs_close_dirty` (`git show HEAD:config/text/ui.yml | grep close_dirty`). `Tests  4 passed (4)` for its first four rows, and its fifth (ruling 8) `Tests  1 passed | 4 skipped (5)`.
- C9: `tests/ui/html.dom.test.ts` 14 passed, with ruling 3's rows: `/local/<jobid>` as written, `**bold**` and a link the same as the sanitiser over marked, a `<script>` as text with no element.
- No other case was run again; their results stand as in round 0.

## Verify lines, as printed

Every program below ran from the worktree root with `TMPDIR=$PWD/.agents/scratch/tmp` and `GIT_CEILING_DIRECTORIES=$PWD/.agents/scratch`, after this round's last change to a file of the tree.

- `npm run diagrams` printed the files it wrote, ending `docs/diagrams/channels.dot`, `docs/diagrams/channels.svg`, `docs/diagrams/writes.dot`, `docs/diagrams/writes.svg`; `npm run docs:palette` printed `docs/palette.md` and left it unchanged (`git status --short docs/` does not list it).
- `npm run test:quick` (log `.agents/scratch/quick-r1.log`) printed:
  ```
  ok      prettier (1.3 s): All matched files use Prettier code style!
  ok      ASCII gate (1.4 s)
  ok      svelte-kit sync (2.9 s)
  ok      eslint (3.4 s)
  ok      svelte-check (12.1 s): 1794111912139 COMPLETED 589 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok      vitest checks (259.3 s): Duration  238.11s (transform 117.16s, setup 0ms, import 269.53s, tests 533.40s, environment 6ms)
  FAILED  vitest (327.7 s)
  FAILED  vitest slow (1408.7 s)
  ```
  vitest: `Tests  21 failed | 3325 passed | 851 skipped (4197)`: the 17 rows of `library.test.ts` (listed below) and four rows that timed out at 5000ms: `tests/server/edit/app-store.test.ts > writes the store of an app as the app-store kind > a target that holds no apps, answered unwritable`, `tests/routes/git/zenodo.test.ts > what Publish and a new version send, and what a press that stops leaves > deletes nothing and writes nothing when the publish gets no answer and neither the draft nor the record reads`, and two rows of `tests/routes/machine/cpp.test.ts` (`refuses a fault the reader would find, ...` and `refuses a POST without the token ...`), each printing `Error: Test timed out in 5000ms.`. vitest slow: `Tests  56 failed | 795 passed | 342 skipped (1193)`: the 53 rows listed below and three rows of `tests/data/hubs/hub-portfolio.test.ts` (`reads a field of a second-hub entry that names a record as the key its file holds (G32)`, `keeps a primary-hub id that begins with the name of a hub folder and a colon as a record of the primary, with no finding`, `gives a key two hubs hold two records, each project naming its own hub record, each shown by the key (C1)`), each printing `Error: Test timed out in 20000ms.`. The timed-out files run again alone, each `npx vitest run <file> --reporter=dot`: `hub-portfolio.test.ts` `Tests  16 passed (16)`, `zenodo.test.ts` `Tests  51 passed (51)`, `cpp.test.ts` `Tests  5 passed (5)`, `app-store.test.ts` `Tests  15 passed (15)`.
- ASCII gate: `ok      ASCII gate (1.4 s)` above; and `LC_ALL=C grep -nP "[^\x00-\x7F]"` over every file this round changed printed nothing.
- `sh utils/unused-exports.sh` (exit 0), compared with `sort ../O168-base/unused-exports.txt`: both 333 lines; the one differing line is `src/lib/state/boards/collection/index.ts: hasStatusField, statusValues` against the base's `src/lib/state/boards/collection/index.ts: kindOf, hasStatusField, statusValues` (`kindOf` is module-private since round 0). No export is added; the `PARTS` of `cpp-form.ts` and `launch-form.ts` appear on no line.
- `sh utils/folder-check.sh` printed nothing.
- `node utils/outside-paths.mjs .scratch/migration/agents/briefs/O168.md abebbb552` printed `.scratch/migration/agents/briefs/O168-cases.md`, `.scratch/migration/agents/briefs/O168-round1.md`, `.scratch/migration/agents/guarded.md`, `.scratch/migration/agents/spec.md` (the ledger copy's own files), `docs/templates.md`, `src/lib/data/sources/config/merge/language.ts`, `src/lib/data/sources/config/merge/workspace-layer.ts`, `src/lib/server/content/audit/rules.ts`, `src/lib/shell/panes/strip/close-question.svelte.ts`, `src/lib/state/sources/repositories/diff/diff-view.ts`, `src/lib/state/system/machine/debug/launch-form.ts`, `src/lib/state/system/machine/lsp/clangd/cpp-form.ts`, `src/lib/ui/frame/Pane.svelte`, `src/lib/views/sources/repositories/diff/Diff.svelte`, `src/lib/views/sources/repositories/diff/DiffSection.svelte`, `src/lib/views/system/help/keys/Keys.svelte`, `src/lib/views/system/workbench/Catalogue.svelte`, `src/lib/views/system/workbench/Settings.svelte`, `tests/checks/source/catalog-reads.ts`, `tests/data/sources/config/catalog/options-schema.test.ts`, `tests/data/sources/config/layers/language.test.ts`, `tests/ui/html.dom.test.ts`. Each is in the round-0 rulings' list (`Pane.svelte`, `language.ts`, `workspace-layer.ts`, `language.test.ts`), this round's list, or S4; `Catalogue.svelte` is a scroller ruling 2 found.
- `grep -rn "count === 1 ?" src` printed `src/lib/state/system/audit.ts:73:        return count === 1 ? signature : ...` and `src/lib/data/sources/deck/spec.ts:66:        return count === 1 ? name : ...`, nothing else.
- `wc -l src/lib/state/sources/repositories/repositories.ts` printed `682`.
- Also: `npx prettier --check` and `npx eslint` over this round's changed files: `All matched files use Prettier code style!` and no output. The history-word grep over this round's added lines found only "still open" in the comments moved unchanged into `diff-view.ts` (the state of a tab, not history). No added comment line is over 100 columns (`awk` over the changed files printed nothing).

## Rows that fail only under the `TMPDIR` of `.agents/scratch/`

Seventy rows, the same files and counts as round 0. The library rows fail by the rule at `src/lib/server/machine/lsp/library/rules.ts:1-3`, which names no path with a segment starting with a dot (`.agents`); the tmux rows by the 116-character socket path ("File name too long"); the app-host rows time out. Against `O168-base`'s source this round: `CASE_FILES=tests/server/machine/lsp/library.test.ts npx vitest run --config .agents/scratch/base.config.mjs` printed `Tests  17 failed | 19 passed (36)`, and `sessions.test.ts -t "starts, lists, feeds"` printed `Error: error connecting to .../.agents/scratch/tmp/oculus-tmux-RPk8Ab/server.sock (File name too long)`. The step changes no file under `src/lib/server/machine/` but `processes/failure.ts` (`git diff HEAD --name-only -- src/lib/server/machine src/lib/server/core` printed `src/lib/server/core/git/failure.ts`, `src/lib/server/core/words.ts`, `src/lib/server/machine/processes/failure.ts`). Each row with the line vitest printed for it:

- `tests/server/machine/lsp/library.test.ts > a library file > 'names a file outside every root with <ellipsis>'`: `AssertionError: expected [] to have a length of 1 but got +0`
- `tests/server/machine/lsp/library.test.ts > a library file > 'gives the same address to a file name<ellipsis>'`: `AssertionError: expected [ { jsonrpc: '2.0', <ellipsis>(2) } ] to have a length of 2 but got 1`
- `tests/server/machine/lsp/library.test.ts > a library file > 'reads the text of a file a server nam<ellipsis>'`: `TypeError: .toMatch() expects to receive a string, but got undefined`
- `tests/server/machine/lsp/library.test.ts > a library file > 'refuses a token another page was given'`: `TypeError: .toMatch() expects to receive a string, but got undefined`
- `tests/server/machine/lsp/library.test.ts > a library file > 'refuses a read whose root is not the <ellipsis>'`: `TypeError: .toMatch() expects to receive a string, but got undefined`
- `tests/server/machine/lsp/library.test.ts > a library file > 'refuses a read sent on the channel of<ellipsis>'`: `AssertionError: expected undefined to be defined`
- `tests/server/machine/lsp/library.test.ts > a library file > 'answers not_served for a token whose <ellipsis>'`: `TypeError: .toMatch() expects to receive a string, but got undefined`
- `tests/server/machine/lsp/library.test.ts > a library file > 'answers not_file for a file removed s<ellipsis>'`: `TypeError: .toMatch() expects to receive a string, but got undefined`
- `tests/server/machine/lsp/library.test.ts > a library file > 'answers not_file for a path that is a<ellipsis>'`: `TypeError: .toMatch() expects to receive a string, but got undefined`
- `tests/server/machine/lsp/library.test.ts > a library file > 'answers moved for a path whose folder<ellipsis>'`: `TypeError: .toMatch() expects to receive a string, but got undefined`
- `tests/server/machine/lsp/library.test.ts > a library file > 'answers binary for a file that is not<ellipsis>'`: `TypeError: .toMatch() expects to receive a string, but got undefined`
- `tests/server/machine/lsp/library.test.ts > a library file > 'answers too_large for a file over the<ellipsis>'`: `TypeError: .toMatch() expects to receive a string, but got undefined`
- `tests/server/machine/lsp/library.test.ts > a library file > 'reads the file a path through a link <ellipsis>'`: `TypeError: .toMatch() expects to receive a string, but got undefined`
- `tests/server/machine/lsp/library.test.ts > a library file > 'drops from a notification the file no<ellipsis>'`: `TypeError: .toMatch() expects to receive a string, but got undefined`
- `tests/server/machine/lsp/library.test.ts > a library file > 'gives an address to a file named in t<ellipsis>'`: `TypeError: Cannot read properties of undefined (reading 'command')`
- `tests/server/machine/lsp/library.test.ts > a library file > 'passes an edit a server asks the page<ellipsis>'`: `TypeError: .toMatch() expects to receive a string, but got undefined`
- `tests/server/machine/lsp/library.test.ts > a library file > 'gives the server the real address of <ellipsis>'`: `TypeError: .toMatch() expects to receive a string, but got undefined`
- `tests/server/machine/pty/agent-pane.test.ts > an agent in a pane, the output of one pane > forwards the output of its pane and of no other pane of the session`: `Error: error connecting to /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O168/.agents/scratch/tmp/agent-panevmVQvF/server.sock (File name too long)`
- `tests/server/machine/pty/agent-pane.test.ts > an agent in a pane, the output of one pane > leaves the environment of the session as it stood before the attach`: `Error: error connecting to /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O168/.agents/scratch/tmp/agent-panevmVQvF/server.sock (File name too long)`
- `tests/server/machine/pty/agent-pane.test.ts > an agent in a pane, the output of one pane > forwards a pane through the session it moved to`: `Error: error connecting to /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O168/.agents/scratch/tmp/agent-panevmVQvF/server.sock (File name too long)`
- `tests/server/machine/pty/agent-pane.test.ts > an agent in a pane, the output of one pane > reads what the foreground of a real pane runs`: `Error: the processes could not be read: status`
- `tests/server/machine/pty/pane-screen.test.ts > a private tmux server > sends a line the pane wrapped as one line`: `Error: error connecting to /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O168/.agents/scratch/tmp/oculus-screen-gxfP5E/server.sock (File name too long)`
- `tests/server/machine/pty/pane-screen.test.ts > a private tmux server > gives the same screen through the control client as through tmux`: `Error: error connecting to /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O168/.agents/scratch/tmp/oculus-screen-gxfP5E/server.sock (File name too long)`
- `tests/server/machine/pty/sessions.test.ts > a private tmux server > starts, lists, feeds, resizes, captures and stops a terminal`: `Error: error connecting to /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O168/.agents/scratch/tmp/oculus-tmux-owXlQN/server.sock (File name too long)`
- `tests/server/machine/debug/channel.test.ts > the debug channel as the page reads it > shows a session of an app debugger paused on entry with its frame and variables, and hands the same to a page that reloads`: `Error: Test timed out in 60000ms.`
- `tests/server/machine/debug/channel.test.ts > the debug channel as the page reads it > shows a session of an app debugger that declares every capability paused on entry`: `Error: Test timed out in 60000ms.`
- `tests/server/machine/debug/channel.test.ts > the debug channel as the page reads it > shows a session of an app debugger ended by Stop, with the words of its end`: `Error: Test timed out in 60000ms.`
- `tests/server/machine/debug/channel.test.ts > the debug channel as the page reads it > shows a session of oculus's own adapter paused with its frame and variables`: `Error: Test timed out in 60000ms.`
- `tests/server/machine/apps/tools/debug-adapters.test.ts > a session of a debugger an app declares > starts through a executable descriptor with no approval, launches with the file filled in, stops at entry and fills the call stack and the variables`: `Error: Test timed out in 60000ms.`
- `tests/server/machine/apps/tools/debug-adapters.test.ts > a session of a debugger an app declares > starts through a manifest descriptor with no approval, launches with the file filled in, stops at entry and fills the call stack and the variables`: `Error: Test timed out in 60000ms.`
- `tests/server/machine/apps/tools/debug-adapters.test.ts > a session of a debugger an app declares > starts through a server descriptor with no approval, launches with the file filled in, stops at entry and fills the call stack and the variables`: `Error: Test timed out in 60000ms.`
- `tests/server/machine/apps/tools/debug-adapters.test.ts > a session of a debugger an app declares > starts the program the manifest names for an app with no host file, with no approval question`: `Error: Test timed out in 60000ms.`
- `tests/server/machine/apps/tools/debug-adapters.test.ts > a session of a debugger an app declares > ends the session and the adapter when the host is killed while a executable descriptor session is paused`: `Error: Test timed out in 60000ms.`
- `tests/server/machine/apps/tools/debug-adapters.test.ts > a session of a debugger an app declares > ends the session and the adapter when the host is killed while a server descriptor session is paused`: `Error: Test timed out in 60000ms.`
- `tests/server/machine/apps/tools/debug-adapters.test.ts > a session of a debugger an app declares > sends attach for an attach entry, with its own keys`: `Error: Test timed out in 60000ms.`
- `tests/server/machine/apps/tools/debug-adapters.test.ts > a session of a debugger an app declares > asks which end it is when stopped, and ends an adapter that declared terminate with terminate`: `Error: Test timed out in 60000ms.`
- `tests/server/machine/apps/tools/debug-adapters.test.ts > a session of a debugger an app declares > ends an adapter that declared no terminate with disconnect that ends the program`: `Error: Test timed out in 60000ms.`
- `tests/server/machine/apps/tools/debug-adapters.test.ts > a session of a debugger an app declares > refuses a second session while one runs, and a type no app declares`: `Error: Test timed out in 60000ms.`
- `tests/server/machine/apps/tools/debug-adapters.test.ts > what an adapter declares > offers no control and sends no extra request when it declared nothing`: `Error: Test timed out in 60000ms.`
- `tests/server/machine/apps/tools/debug-adapters.test.ts > what an adapter declares > pauses a running thread of an adapter that declared nothing`: `Error: Test timed out in 60000ms.`
- `tests/server/machine/apps/tools/debug-adapters.test.ts > what an adapter declares > pauses the first thread the adapter lists when the program has not stopped yet`: `Error: Test timed out in 60000ms.`
- `tests/server/machine/apps/tools/debug-adapters.test.ts > what an adapter declares > draws each control and sends each request when it declared them`: `Error: Test timed out in 60000ms.`
- `tests/server/machine/apps/tools/debug-adapters.test.ts > the configuration providers of a type > resolves a configuration before and after its placeholders are filled, and aborts the launch of one a provider answers nothing for`: `Error: Test timed out in 60000ms.`
- `tests/server/machine/apps/tools/debug-adapters.test.ts > the host of the debugger > starts a session with startDebugging, is refused a second while one runs, reaches it with customRequest and hears it start and end`: `Error: Test timed out in 60000ms.`
- `tests/server/machine/apps/tools/language-features.test.ts > a feature a server of an app declares > is handed to the page client as a registration, which the transport refuses none of, for a language no oculus server serves`: `Error: Test timed out in 30000ms.`
- `tests/server/machine/apps/tools/language-features.test.ts > a feature a server of an app declares > is handed to the page client for a language oculus serves, when oculus own server does not declare it`: `Error: Test timed out in 30000ms.`
- `tests/server/machine/apps/tools/language-features.test.ts > a feature a server of an app declares > is registered for workspace symbols and the call and type hierarchies, and not for semantic tokens, which the page draws from the legend`: `Error: Test timed out in 30000ms.`
- `tests/server/machine/apps/tools/language-features.test.ts > a feature a server of an app declares > is handed to a second client the page makes on the same socket after its last document closed`: `Error: Test timed out in 30000ms.`
- `tests/server/machine/apps/tools/language-features.test.ts > a feature a server of an app declares > is handed to the client of a page that takes the running server over after a reload`: `Error: Test timed out in 30000ms.`
- `tests/server/machine/apps/tools/language-features.test.ts > a feature a server of an app declares > is withdrawn from the page client when the app stops acting`: `Error: Test timed out in 30000ms.`
- `tests/server/machine/apps/tools/language-features.test.ts > a feature a server of an app declares > is handed to the page client when the server registers it after initialize, and its requests reach the server`: `Error: Test timed out in 30000ms.`
- `tests/server/machine/apps/tools/language-features.test.ts > a request of the page for a feature > that the server of an app did not declare is answered with no result and not sent to it, asked as the document opens and once the server is ready`: `Error: Test timed out in 30000ms.`
- `tests/server/machine/apps/tools/language-features.test.ts > a request of the page for a feature > for the workspace symbols of a root, whose server of an app did not declare them, is answered with no result and not sent to it`: `Error: Test timed out in 30000ms.`
- `tests/server/machine/apps/tools/language-features.test.ts > a request of the page for a feature > that follows a call hierarchy goes to the server that declared the call hierarchy, not to the first server of the document`: `Error: Test timed out in 30000ms.`
- `tests/server/machine/apps/tools/languages.test.ts > a server an app registers > starts with the first document of its language under a served root, and the page gets its answers`: `AssertionError: expected [ 'null', [] ] to deeply equal [ <ellipsis>(2) ]`
- `tests/server/machine/apps/tools/languages.test.ts > a server an app registers > starts from a serverOptions function that answers the program to run`: `Error: Test timed out in 30000ms.`
- `tests/server/machine/apps/tools/languages.test.ts > a server an app registers > is started once for two documents of one root and once more for a second root`: `Error: Test timed out in 30000ms.`
- `tests/server/machine/apps/tools/languages.test.ts > a document outside the folders of the workspace > is given to no server of an app, whether the root is unknown or the path climbs out of its root`: `Error: Test timed out in 30000ms.`
- `tests/server/machine/apps/tools/languages.test.ts > several servers of one language > join their answers the way VS Code joins them: the first declaring server defines, hovers join, a slow one is cancelled after 2 s`: `Error: Test timed out in 40000ms.`
- `tests/server/machine/apps/tools/languages.test.ts > an app that stops acting while its server runs > has its server end, its diagnostics leave the document, its capabilities withdrawn and the page told the server is gone, when the app is disabled`: `Error: Test timed out in 30000ms.`
- `tests/server/machine/apps/tools/languages.test.ts > a server that exits on its own > is started again by a request after each exit, at most 4 times in 3 minutes, and then left failed until Restart`: `Error: Test timed out in 60000ms.`
- `tests/server/machine/apps/tools/languages.test.ts > a root app with a language server in a workspace of two roots > is given only the documents of its own root`: `Error: Test timed out in 30000ms.`
- `tests/server/machine/apps/tools/languages.test.ts > the diagnostics of several servers of one document > show together with the name of each server as the source, and a clear of one leaves the other`: `Error: Test timed out in 30000ms.`
- `tests/server/machine/apps/tools/languages.test.ts > the version a document is sent to a server of an app at > is above every version sent before for the file, after a close and an open again`: `Error: Test timed out in 30000ms.`
- `tests/server/machine/apps/tools/languages.test.ts > a save of a file the page holds > is sent to the server of an app that declared save, with the text when it asked for it`: `Error: Test timed out in 30000ms.`
- `tests/server/machine/apps/tools/languages.test.ts > an app that stops its own client > has its server asked shutdown and then exit, and the page told it is gone`: `Error: Test timed out in 30000ms.`
- `tests/server/machine/apps/tools/tasks.test.ts > the tasks of an app over a private tmux server > runs a shell execution and a process execution in a terminal named after the command, and a custom execution in a stream terminal, and tells the host each exit code`: `Error: error connecting to /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O168/.agents/scratch/tmp/oculus-apptask-3aRpj7/server.sock (File name too long)`
- `tests/server/machine/apps/tools/tasks.test.ts > the tasks of an app over a private tmux server > runs a task again in the terminal that ended, after the host stopped and was started by the listing`: `Error: error connecting to /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O168/.agents/scratch/tmp/oculus-apptask-3aRpj7/server.sock (File name too long)`
- `tests/server/machine/apps/tools/tasks.test.ts > the tasks of an app over a private tmux server > resolves a typed commands.yml entry by the app that defines its type, and drops one whose type no app defines or whose required property is missing, each with a finding`: `Error: error connecting to /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O168/.agents/scratch/tmp/oculus-apptask-3aRpj7/server.sock (File name too long)`
- `tests/server/machine/apps/tools/tasks.test.ts > the tasks of an app over a private tmux server > runs a task of the host with executeTask, which the host ends with terminate`: `Error: Test timed out in 90000ms.`

## Program-made file changes

- `npm run diagrams`: `docs/diagrams/{layer-data,layer-state,layer-views,layers,writes}.{dot,svg}` differ from the base (`git status --short docs/`).
- `npm run docs:palette`: no file changed.
- Every other change of this round was made with the Edit and Write tools.

## Files with line counts (base / now)

| File | Base | Now |
|---|---|---|
| `config/text/ui.yml` | 153 | 154 |
| `config/text/views/sources/data.yml` | 133 | 139 |
| `docs/apps.md` | 847 | 861 |
| `docs/templates.md` | 1941 | 1941 |
| `src/lib/data/helpers/finding-text.ts` | 47 | 185 |
| `src/lib/shell/panes/strip/close-question.svelte.ts` | 139 | 139 |
| `src/lib/state/shared/words/text.ts` | 120 | 155 |
| `src/lib/state/sources/repositories/diff/diff-view.ts` | - | 216 |
| `src/lib/state/sources/repositories/repositories.ts` | 888 | 682 |
| `src/lib/state/system/machine/debug/launch-form.ts` | 193 | 193 |
| `src/lib/state/system/machine/lsp/clangd/cpp-form.ts` | 186 | 186 |
| `src/lib/state/workbench/navigation/pages.ts` | 755 | 755 |
| `src/lib/ui/html.ts` | 804 | 828 |
| `src/lib/views/sources/data/recover/RecoverPlan.svelte` | 178 | 175 |
| `src/lib/views/sources/repositories/diff/Diff.svelte` | 520 | 518 |
| `src/lib/views/sources/repositories/diff/DiffSection.svelte` | 520 | 520 |
| `src/lib/views/system/help/keys/Keys.svelte` | 194 | 197 |
| `src/lib/views/system/workbench/Catalogue.svelte` | 417 | 417 |
| `src/lib/views/system/workbench/Settings.svelte` | 491 | 495 |
| `tests/fixtures/hubs/deck-hub.ts` | 422 | 422 |
| `tests/shell/panes/strip/app-editor-close.test.ts` | 177 | 177 |
| `tests/shell/panes/strip/tab-menu.test.ts` | 228 | 228 |
| `tests/state/workbench/navigation/pages.test.ts` | 240 | 240 |
| `tests/ui/html.dom.test.ts` | 141 | 161 |

Base is `git show HEAD:<file> | wc -l` (HEAD is the base commit `abebbb552`), now is `wc -l`; the counts include round 0's changes to the same files. `src/lib/shell/rail/UpdateTray.svelte` is unchanged (`git diff HEAD --stat` prints nothing for it).
