# O146 report: a deck's frame size and the slide findings

Everything in the brief is done. Two decisions this report names in "Judgment calls" change how the brief said a thing is reached, and the orchestrator may reverse them. Decision J1: the frame reaches the deck reader from `frameSetting(config.merged)` where the reader's context is made, and is not a `PortfolioConfig` field. Decision J2: `--slide-reading` follows the brief literally and widens the reading column of a 1280 deck.

## Open items of the state file

`.scratch/migration/orchestrator-state.md` lines 165-167, "## Open items", hold no entry: the section has only its heading and the sentence "An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own."

## The cases' first run (unchanged tree) and the run after

Case program: `node case-run.ts <tree> <scratch>/tmp`. Its source is quoted at the end of this section. On the unchanged tree it read each planted deck through `createReader` from `src/lib/data/sources/deck/read.ts`. Runs of the browser and desktop functions went through a vitest file in the scratchpad, `features.case.ts`, quoted below, run with `npx vitest run --config <scratch>/o146/vitest.config.mjs`. Both programs and their folders have been deleted from the scratchpad.

- C1. The first run printed `C1 no deck.frame, shipped settings: frame undefined`, with no findings. After the change it prints `C1 no deck.frame, shipped settings: frame {"width":1280,"height":720}`. Reading confirms that the pane (`Present.svelte` through `screen/Framed.svelte`), both presenter slides, the tiles, the show route (`<Stage bare={full} frame={deck.frame}>`) and the print route (`style:width`/`style:height` of `.page` and the head `@page` rule) all draw at `deck.frame`.
- C2. The first run printed `C2 deck.frame 1024 by 768: frame undefined`. On the base, `audiencePlace({x:100,y:100,w:1200,h:800},[{x:0,y:0,w:2560,h:1440}],'popup,width=1024,height=768')` printed `{"kind":"beside","rect":{"x":1300,"y":100,"w":960,"h":540}}`. After the change:
  - `C2 deck.frame 1024 by 768: frame {"width":1024,"height":768}`
  - `C2 audienceFeatures({"width":1024,"height":768}) = "popup,width=1024,height=768"; one display: {"kind":"beside","rect":{"x":1300,"y":100,"w":960,"h":720}}`
  - `C2 audienceFeatures({"width":1280,"height":720}) = "popup,width=1280,height=720"; one display: {"kind":"beside","rect":{"x":1300,"y":100,"w":960,"h":540}}`
  - `C2 audienceFeatures(null) = "popup"; one display: {"kind":"beside","rect":{"x":1300,"y":100,"w":960,"h":540}}`
  - `C2 features "popup,width=1024.5,height=768"; one display: {"kind":"beside","rect":{"x":1300,"y":100,"w":960,"h":540}}`
  - `C2 features "popup,width=0,height=768"; one display: {"kind":"beside","rect":{"x":1300,"y":100,"w":960,"h":540}}`
  - `C2 features "popup,width=x"; one display: {"kind":"beside","rect":{"x":1300,"y":100,"w":960,"h":540}}`
  - `C2 features ""; one display: {"kind":"beside","rect":{"x":1300,"y":100,"w":960,"h":540}}`
  - `C2 two displays: {"kind":"display","area":{"x":2560,"y":0,"w":1920,"h":1080}}`
  - `fit(640, 360, 1280x720) = 0.5; fit(640, 360, 1024x768) = 0.46875`
  - By reading: the tile's `.shot` and the presenter's `.preview` take `style:aspect-ratio="{frame.width} / {frame.height}"`, and the print route writes `@page { size: 1024px 768px; margin: 0; }` from `deck.frame`.
- C3. In the first run all eight printed `frame undefined`, with no findings. After the change, each prints `frame {"width":1280,"height":720}` and one finding on `deck/present.yml key=deck.frame`:
  - `{ width: 1024 }`: `deck.frame has no height; the frame of the setting defaults.frame, 1280 by 720 px, is used`
  - `{ width: 100, height: 768 }`, `{ width: 1024.5, height: 768 }`, `{ width: -1024, height: 768 }`: `deck.frame.width must be a whole number from 320 to 3840; the frame of the setting defaults.frame, 1280 by 720 px, is used`
  - `{ width: '1024', height: 768 }`: `deck.frame.width must be a number; the frame of the setting defaults.frame, 1280 by 720 px, is used`
  - `{ width: 1024, height: 768, depth: 1 }`: `deck.frame holds depth, which is neither width nor height; the frame of the setting defaults.frame, 1280 by 720 px, is used`
  - `null` and `wide`: `deck.frame is not a map of a width and a height in px; the frame of the setting defaults.frame, 1280 by 720 px, is used`
- C4. The tests live in `tests/data/sources/config/settings/settings.test.ts`, describe 'frameSetting', with the case 'reads the frame a workspace sets' and the table 'answers the default for a wrong defaults.frame.%s and names the key' (4 rows). Their first run on the unchanged tree was at their old path, `tests/data/sources/config/settings.test.ts`, with the same import from `config.ts`. They failed:
  - `TypeError: frameSetting is not a function` at `tests/data/sources/config/settings.test.ts:900:16` (the case 'reads the frame a workspace sets').
  - Four rows: `AssertionError: expected { Object (threw) } ... "threw": "(0 , __vite_ssr_import_2__.frameSetting) is not a function"` at line 917. The problems they expected were `defaults.frame.width: range`, `defaults.frame.width: whole`, `defaults.frame.height: number` and `defaults.frame.height: range`.
  - Now `npx vitest run tests/data/sources/present.test.ts tests/data/sources/config/settings` prints `Test Files  3 passed (3)` and `Tests  101 passed (101)`. The base file ran `Tests  92 passed (92)`; the two files from the split hold those 92 plus the case and the 4 rows.
  - Reader run: `C4 no deck.frame under a 1920 by 1080 setting: frame {"width":1920,"height":1080}`. In the first run this printed `frame undefined`.
- C5. By reading on the base: nothing measured, and the frame had `overflow-y: auto`. As built:
  - `Stage.svelte` measures `scrollHeight - clientHeight` with a ResizeObserver on the frame and its children.
  - `Framed.svelte` hands the measure to `present.measured`.
  - `present.findings()` gives `{file, key, line, message}`.
  - `Findings.svelte` lists `[...registry.refused(), ...present.findings()]`.
  - `findingsCount` counts the same list.
  - `Tile.svelte` draws the Too tall chip with the message as its tooltip.
  - A measure of 1 px or less deletes the entry.
  - The look at landing checks the forty-item and five-item slides.
- C6. By reading: the ResizeObserver watches the frame element and its children. `.reading` has `min-height: 100%` and grows with its content, so a late image changes the child's size and fires the callback. A change of `deck.frame` changes the frame's `style:width`/`style:height`, which fires the observer on the frame.
- C7. By reading: `DeckSlideSource` (model-deck.ts:104-112) gives a summary or a grid the deck's `present.yml` as `path` and its `order:` entry's line as `line` (read.ts:435). The finding takes `joinPath(rootDir(source.root), source.path)` and `source.line`, and the tile's mark is keyed by the slide's key like any slide's.
- C8. In the first run all five printed `frame undefined`, with no findings. After the change:
  - `C8 a file of two slides, the second with no heading`: `finding deck/two.md key=title line=7: slide 2 of two.md has no title of its own; give it a level-1 heading, or a title: in its front matter for a project or an idea slide`
  - `C8 a section slide with no heading`: `finding deck/one.md key=title line=1: slide 1 of one.md has no title of its own; ...` (the same sentence, with `1` and `one.md`)
  - `C8 a project slide with no title: in a project deck`: no finding
  - `C8 the same with the project's short ''`: `finding projects/alpha/present/main.md key=title line=1: slide 1 of main.md has no title of its own; give it a level-1 heading, or a title: in its front matter for a project or an idea slide`
  - `C8 an idea slide with no project and no title:`: `finding deck/idea.md key=title line=1: slide 1 of idea.md has no title of its own; give it a level-1 heading, or a title: in its front matter for a project or an idea slide`
- C9. In the first run `OCULUS_TEST_HUB=$HOME/workspace/research-hub node tests/data/real-hub.probe.ts` printed `snapshot findings: 0`, and the integrity test with `OCULUS_TEST_HUB` set printed `Tests  14 passed (14)`. After the change the same probe prints `manifest findings: 0`, `registry findings: 0`, `collection findings: 0`, `config findings: 0` and `snapshot findings: 0` (exit 0). `OCULUS_TEST_HUB=$HOME/workspace/research-hub npx vitest run tests/checks/config/integrity.test.ts` prints `Test Files  1 passed (1)` and `Tests  14 passed (14)`. Deck findings enter the snapshot findings through `...deck.findings` at `src/lib/data/index.ts:474`.
- C10. By reading on the base: the handler took `address` only. As built, `bridge.ts` reads `wholeFrame(frame)` and answers `PRINT_REFUSED` before `print` is called, so no window is opened when the frame check fails. Run of the check (`place.ts` `wholeFrame`):
  - `C10 wholeFrame({"width":0,"height":720}) = null`
  - `C10 wholeFrame({"width":"1280","height":720}) = null`
  - `C10 wholeFrame({"width":1280.5,"height":720}) = null`
  - `C10 wholeFrame(undefined) = null`
  - `C10 wholeFrame(null) = null`
  - `C10 wholeFrame({"width":1280,"height":720}) = {"width":1280,"height":720}`
  - The page's wire shape: `wire deckShape frame {"width":1280,"height":720}: taken`. `{"width":1280.5,...}`, `{"width":0,...}`, `{"width":"1280",...}`, `{...,"depth":1}` and `undefined` each print `refused`.
- C11. By reading: `answered()` calls `kept(held)` on every deck answer. `kept` deletes each entry of `tall` with the deck's root and path whose key the new answer's slides do not hold. `findings()` and `findingsCount` are derived from `tall`.
- C12. By reading: the key is `JSON.stringify([deck.root, deck.path, slideKey])`. Two Stages of one slide of one deck write one entry. The same slide in the portfolio deck and in its project's deck has two decks' paths, so it gives two entries.
- C13. By reading: a hidden tab's frame has `clientHeight === 0`, so `measure` returns before reporting, and the store is unchanged. The show route's Stage gets no `onmeasure`, so its `$effect` returns before it creates an observer.
- No case of the first run was one the brief's rules got wrong.

Source of `case-run.ts` (deleted):

```ts
// Case-run program for O146: prints, for each deck case, the frame the deck reader answers and the
// findings it raises. It writes only into temporary folders under the scratchpad.
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
const TREE = process.argv[2];
const SCRATCH = process.argv[3];
const config = await import(`${TREE}/src/lib/data/sources/config.ts`);
const read = await import(`${TREE}/src/lib/data/sources/deck/read.ts`);
const index = await import(`${TREE}/src/lib/data/index.ts`);
const loaded = config.loadConfig(config.engineDir());

function plant(files: Record<string, string>): string {
    const dir = mkdtempSync(join(SCRATCH, 'deck-'));
    for (const [path, text] of Object.entries(files)) {
        mkdirSync(dirname(join(dir, path)), { recursive: true });
        writeFileSync(join(dir, path), text);
    }
    return dir;
}

function run(name: string, merged: Record<string, unknown>, files: Record<string, string>, projects: unknown[] = [], at = 'deck') {
    const dir = plant(files);
    const portfolio = index.portfolioConfigFrom(merged);
    const root = { key: 'hub', dir };
    const reader = read.createReader({
        hub: root,
        projects,
        domains: [],
        tagTones: portfolio.tagTones,
        frame: config.frameSetting(merged),
        catalog: config.textCatalog(merged)
    });
    const deck = reader.read(root, at);
    console.log(`${name}: frame ${JSON.stringify(deck.frame)}`);
    for (const one of deck.findings) {
        console.log(`    finding ${one.file.slice(dir.length + 1)} key=${one.key} line=${one.line ?? '-'}: ${one.message}`);
    }
}

const yml = (frame: string) => `deck: { title: T${frame === '' ? '' : `, frame: ${frame}`} }\norder: [one.md]\n`;
const one = '# One\n\nText.\n';
run('C1 no deck.frame, shipped settings', loaded.config, { 'deck/present.yml': yml(''), 'deck/one.md': one });
run('C2 deck.frame 1024 by 768', loaded.config, { 'deck/present.yml': yml('{ width: 1024, height: 768 }'), 'deck/one.md': one });
for (const frame of ['{ width: 1024 }', '{ width: 100, height: 768 }', '{ width: 1024.5, height: 768 }', "{ width: '1024', height: 768 }", '{ width: -1024, height: 768 }', '{ width: 1024, height: 768, depth: 1 }', 'null', 'wide']) {
    run(`C3 deck.frame ${frame}`, loaded.config, { 'deck/present.yml': yml(frame), 'deck/one.md': one });
}
const wide = { ...loaded.config, defaults: { ...(loaded.config.defaults as object), frame: { width: 1920, height: 1080 } } };
run('C4 no deck.frame under a 1920 by 1080 setting', wide, { 'deck/present.yml': yml(''), 'deck/one.md': one });
run('C8 a file of two slides, the second with no heading', loaded.config, {
    'deck/present.yml': 'order: [two.md]\n',
    'deck/two.md': '# First\n\nText.\n\n---\n\n---\nkind: text\n---\nNo heading here.\n'
});
run('C8 a section slide with no heading', loaded.config, {
    'deck/present.yml': 'order: [one.md]\n',
    'deck/one.md': '---\nkind: section\n---\nWords.\n'
});
const project = (short: string) => ({ id: 'alpha', file: '/x/projects/alpha/project.yml', folder: 'projects/alpha', chips: [], short, title: 'Alpha title' });
run('C8 a project slide with no title: in a project deck', loaded.config, {
    'projects/alpha/present/present.yml': 'order: [main.md]\n',
    'projects/alpha/present/main.md': '---\nkind: project\nmechanism: M\n---\n'
}, [project('Alpha')], 'projects/alpha/present');
run("C8 the same with the project's short ''", loaded.config, {
    'projects/alpha/present/present.yml': 'order: [main.md]\n',
    'projects/alpha/present/main.md': '---\nkind: project\nmechanism: M\n---\n'
}, [project('')], 'projects/alpha/present');
run('C8 an idea slide with no project and no title:', loaded.config, {
    'deck/present.yml': 'order: [idea.md]\n',
    'deck/idea.md': '---\nkind: idea\ndesc: An idea\n---\n'
});
```

On the unchanged tree the `frame:` line of the context did not exist, since the context had no frame.

Source of `features.case.ts` (deleted). Its config file `vitest.config.mjs` sets `root` to the worktree, uses `@sveltejs/vite-plugin-svelte` with runes, and has `include: ['features.case.ts']`.

```ts
// Case-run file of O146 (C2, C10, the wire shape): prints what each case gives and asserts nothing.
import { it } from 'vitest';
const tree = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O146/src';
const place = await import(`${tree}/desktop/decide/place.ts`);
const present = await import(`${tree}/lib/state/life/present.ts`);

it('cases', () => {
    const from = { x: 100, y: 100, w: 1200, h: 800 };
    const display = [{ x: 0, y: 0, w: 2560, h: 1440 }];
    for (const frame of [{ width: 1024, height: 768 }, { width: 1280, height: 720 }, null]) {
        const features = present.audienceFeatures(frame);
        console.log(`C2 audienceFeatures(${JSON.stringify(frame)}) = ${JSON.stringify(features)}; one display: ${JSON.stringify(place.audiencePlace(from, display, features))}`);
    }
    for (const features of ['popup,width=1024.5,height=768', 'popup,width=0,height=768', 'popup,width=x', '']) {
        console.log(`C2 features ${JSON.stringify(features)}; one display: ${JSON.stringify(place.audiencePlace(from, display, features))}`);
    }
    console.log(`C2 two displays: ${JSON.stringify(place.audiencePlace(from, [...display, { x: 2560, y: 0, w: 1920, h: 1080 }], present.audienceFeatures({ width: 1024, height: 768 })))}`);
    for (const frame of [{ width: 0, height: 720 }, { width: '1280', height: 720 }, { width: 1280.5, height: 720 }, undefined, null, { width: 1280, height: 720 }]) {
        console.log(`C10 wholeFrame(${JSON.stringify(frame)}) = ${JSON.stringify(place.wholeFrame(frame))}`);
    }
    const deck = { root: 'hub', hub: 'hub', path: 'deck', name: 'deck', title: 'T', state: 'ok', slides: [], groups: [], tagTones: {}, findings: [] };
    for (const frame of [{ width: 1280, height: 720 }, { width: 1280.5, height: 720 }, { width: 0, height: 720 }, { width: '1280', height: 720 }, { width: 1280, height: 720, depth: 1 }, undefined]) {
        console.log(`wire deckShape frame ${JSON.stringify(frame)}: ${present.deckShape.safeParse({ ...deck, frame }).success ? 'taken' : 'refused'}`);
    }
    console.log(`fit(640, 360, 1280x720) = ${present.fit(640, 360, { width: 1280, height: 720 })}; fit(640, 360, 1024x768) = ${present.fit(640, 360, { width: 1024, height: 768 })}`);
});
```

## DONE / NOT DONE

| Check | State | Output |
| --- | --- | --- |
| 1. `npm run diagrams && npm run docs:palette && npm run test:quick` | DONE, run twice | Second run: `test:quick: 83 changed file(s), from git since HEAD`, `test:quick: 360 test file(s)`, `ok      prettier (1.4 s): All matched files use Prettier code style!`, `ok      ASCII gate (1.4 s)`, `ok      svelte-kit sync (2.6 s)`, `ok      eslint (13.1 s)`, `ok      svelte-check (55.0 s): 1793899641309 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok      vitest checks (208.5 s): Duration  190.47s (transform 132.76s, setup 0ms, import 264.13s, tests 429.47s, environment 6ms)`, `ok      vitest (304.1 s): Duration  288.00s (transform 301.40s, setup 0ms, import 553.71s, tests 557.08s, environment 15.78s)`, `ok      vitest slow (446.1 s): Duration  430.32s (transform 29.97s, setup 0ms, import 189.87s, tests 1517.17s, environment 23ms)`, `test:quick: 448.9 s; every command passed` |
| 1a. Why the list ran twice | - | The first run printed `FAILED  vitest checks (250.7 s)` with `tests/checks/imports/order.test.ts > the folder order of each layer > holds the data folders`: `"data/model/index.ts:5 imports data/sources/config/settings/present.ts (data/sources, above data/model)"`. It also printed `FAILED  vitest (324.7 s)` with 4 failures in `tests/routes/docs/docs.test.ts` and `tests/server/root/process/config-cache.test.ts`: `Error: config/options/present.yml holds no entry, or no default that reads, for defaults.frame.width, so defaults.frame.width cannot be read` from `frameSetting` called by `portfolioConfigFrom` over a map with no present.yml catalog (`portfolioConfigFrom({})` in docs.test.ts:42). The step's own files were fixed (J1), the three files were rerun alone (`npx vitest run tests/checks/imports/order.test.ts tests/routes/docs/docs.test.ts tests/server/root/process/config-cache.test.ts tests/checks/config/integrity.test.ts tests/data/sources/present.test.ts`: `Test Files  5 passed (5)`, `Tests  39 passed \| 7 skipped (46)`), and the list ran once more. No whole-suite command was run. |
| 2. `npx vitest run tests/data/sources/present.test.ts tests/data/sources/config/settings tests/checks/config/config-folder.test.ts tests/checks/config/integrity.test.ts tests/server/desktop/window-guard.test.ts` | DONE | The brief's path `tests/data/sources/config/settings.test.ts` is now the folder `tests/data/sources/config/settings/`. The run with `tests/checks/config/config.test.ts`, `tests/state/workbench/count-row.test.ts` and `tests/checks/tree` added printed `Test Files  11 passed (11)`, `Tests  245 passed \| 9 skipped (254)`. These files are inside test:quick's second green run. |
| 3. Frame-size grep | DONE | The first grep prints only `src/desktop/decide/place.ts:75:const AUDIENCE_SIZE = { w: 960, h: 540 } as const;`. `grep -rn "1280\|\b720\b" src --include='*.ts' --include='*.svelte'` prints only `src/desktop/decide/place.ts:18:const DEFAULT_SIZE = { w: 1280, h: 800 } as const;`, the main window's default size, which the brief keeps. |
| 4. ASCII gate and touched-file grep | DONE | The perl gate over `src tests config` prints nothing, `gate exit 0` (`bin` does not exist: `find: bin: No such file or directory`). `LC_ALL=C grep -n '[^ -~]'` over the 68 touched files prints nothing (exit 1). |
| 5. Sizes and folders | DONE | Largest: `src/lib/state/client/context.ts` 878, `src/lib/data/index.ts` 862, `src/lib/state/sessions/latex/builds.ts` 850, `src/lib/data/model/index.ts` 836, `tests/data/sources/config/settings/settings.test.ts` 615. Components: `Present.svelte` 519, `Findings.svelte` 296, `show/+page.svelte` 291, `Presenter.svelte` 231, `Tile.svelte` 184, `print/+page.svelte` 161, `Stage.svelte` 126, `Framed.svelte` 33. Folders (`ls \| wc -l`): `src/lib/data/sources/config/settings` 10, `settings/writing` 2, `src/lib/views/academic/present/screen` 4, `tests/data/sources/config` 10, `tests/data/sources/config/settings` 3. |
| 6. Unused exports | DONE | `sh utils/unused-exports.sh` compared with `diff` against `O146-base/unused-exports.txt` prints nothing (`unused diff 0`). |
| 7. Rename grep | DONE | `settings/latex`, `settings/lint` (with `settings/writing/` lines left out) and `config/settings.test` over `src tests config docs README.md`: no hits. `FRAME_WIDTH\|FRAME_HEIGHT`: no hits. `fit(`: the only importer of present.ts's `fit` is `Stage.svelte:21`. The other hits are other functions (`ui/frame/toolbar/fit.ts`, `zones.ts:58`, `output.ts:40`, a local `fit` in `forces.ts:631`). `AUDIENCE_SIZE`: `place.ts:75,118,119,149,150`, all in place.ts. `Printer`: `bridge.ts:50,124`. `printPdf`: `preload.cjs:33`, `app.ts:37,151`, `print.ts:46`, `stores/desktop.ts:91`, `export.ts:94`, all carried to the frame argument. The `.scratch/migration/agents/guarded.md:254` G13 lines that name `tests/data/sources/config/settings.test.ts` are ledger text, which this step does not touch (see "Anything wrong"). |
| 8. History-word grep | DONE | Over the 339 added comment and test-title lines of `diff -ruN` of `src tests config` against the base, the words of spec.md:44 and package ids or dates print nothing (`history grep exit 1`). |
| 9. List items and sentence length | DONE | spec.md:72 asks for short bullets in `docs/HELP.md`. The three sentences added to the Present bullet at HELP.md:331 make a bullet that was already a paragraph longer. The brief puts these facts in that bullet. Splitting it into new bullets would change lines outside 331. |

## Files (from `diff -rq` against the base copy, over `src tests config docs`), with line counts

M = changed, A = added, D = removed (moved). `*` marks a path outside the write list, with the reason.

- M 393 `src/desktop/app.ts`
- M 168 `src/desktop/decide/place.ts`
- M 53 `src/desktop/preload.cjs`
- M 304 `src/desktop/windows/bridge.ts`
- M 86 `src/desktop/windows/print.ts`
- M 152 `src/desktop/windows/show.ts`
- M 544 `src/desktop/windows/windows.ts`
- M 862 `src/lib/data/index.ts`
- M 836 `src/lib/data/model/index.ts`: re-exports `DeckFrame` only
- M 281 `src/lib/data/model/model-deck.ts`
- D `src/lib/data/sources/config/settings/latex.ts`, D `.../settings/lint.ts`: moved with `mv`
- A 89 `src/lib/data/sources/config/settings/present.ts`
- M 85 `src/lib/data/sources/config/settings/problems.ts`
- A 53 `src/lib/data/sources/config/settings/writing/lint.ts`, A 251 `.../writing/latex.ts`
- M 116 `src/lib/data/sources/config.ts`: an importer of the moved files, and the `frameSetting` re-export
- M 368 `src/lib/data/sources/deck/kinds.ts`
- M 675 `src/lib/data/sources/deck/read.ts`
- M 226 `src/lib/data/sources/deck/spec.ts`
- M 106 `src/lib/server/content/deck/read.ts`
- Importers of the moved files, in the write list as "every file importing a moved file":
  - M 619 `src/lib/server/content/latex/endpoint.ts`
  - M 272 `.../latex/recipes.ts`
  - M 280 `src/lib/server/machine/lsp/adapters/entry.ts`
  - M 79 `.../texlab/adapter.ts`
  - M 52 `.../texlab/settings.ts`
  - M 65 `src/lib/server/machine/lsp/relay/relay-options.ts`
  - M 228 `src/lib/server/machine/pty/latex/approval.ts`
  - M 487 `.../pty/latex/latex.ts`
  - M 850 `src/lib/state/sessions/latex/builds.ts`
  - M 734 `.../latex.svelte.ts`
  - M 158 `.../saves.ts`
  - M 14 `src/lib/state/sources/explorer/acts/writing-fix.ts`
- M 878 `src/lib/state/client/context.ts`
- M 547 `src/lib/state/life/present.svelte.ts`
- M 592 `src/lib/state/life/present.ts`
- M 145 `src/lib/state/shared/stores/desktop.ts`
- M 669 `src/lib/state/workbench/navigation/status.ts`
- M 413 `src/lib/state/workbench/rail-badges/rail-badges.svelte.ts`
- M 39 `src/lib/themes/slide.css`
- M 519 `src/lib/views/academic/present/Present.svelte`
- M 97 `src/lib/views/academic/present/Slide.svelte`: the brief names `screen/Slide.svelte`, but the file is `present/Slide.svelte`; only its head comment changed.
- * M 138 `src/lib/views/academic/present/acts/acts.svelte.ts`: outside the write list. It needs `saved: () => Deck \| null` in `Reads`, so that `exportDeck` hands `export.ts` the saved deck's frame (item 3, decision 10). `export.ts` gets its deps only from this file.
- M 108 `src/lib/views/academic/present/acts/export.ts`
- M 184 `src/lib/views/academic/present/arrange/Tile.svelte`
- M 231 `src/lib/views/academic/present/presenter/Presenter.svelte`
- A 33 `src/lib/views/academic/present/screen/Framed.svelte`: a new file for code the step builds (the measured Stage the workbench draws), so that `Present.svelte` stays at 519. The folder holds 4 items.
- M 126 `src/lib/views/academic/present/screen/Stage.svelte`
- M 296 `src/lib/views/system/findings/Findings.svelte`
- M 161 `src/routes/present/print/+page.svelte`
- M 291 `src/routes/present/show/+page.svelte`
- M 347 `tests/checks/config/integrity.test.ts`: lines 102-109 and 329-335, plus * line 26, the import of `frameSetting`, which the two context literals need.
- * M 368 `tests/checks/tree/layer-rows.ts`: lines 344-345 name the moved modules (`data/sources/config/settings/latex` and `/lint`). The size check's layer rows have to know the new paths.
- D `tests/data/sources/config/settings.test.ts`, with A 615 `tests/data/sources/config/settings/settings.test.ts`, A 201 `.../settings/writing.test.ts` and A 141 `.../settings/synthetic.ts`. The write list names `settings.test.ts` for C4. With C4 added it reached 920 lines, above the 880 module limit, and its folder holds 10 items, so it was split into a folder of its own. `settings.test.ts` was moved with `mv`. The latexFormatting, lintSettings and latexBuild describes went to `writing.test.ts`. `DEFAULTS`, `mapWith` and `outcome`, which both files read, went to `synthetic.ts`. A `diff` of the moved text against the base printed WRITING-SAME and DEFAULTS-SAME; `mapWith` and `outcome` differ only in their `export`.
- M 307 `tests/data/sources/present.test.ts`: lines 166-175 (the context), plus * line 6, the import of `frameSetting`, which the context needs.
- Importers of the moved files:
  - M 94 `tests/routes/sessions/latex.test.ts`
  - M 368 `tests/server/machine/apps/world/language-app.ts`
  - M 395 `tests/server/machine/lsp/lsp-fixture.ts`
  - M 248 `tests/server/root/context-fixture.ts`
  - M 90 `tests/server/root/eslint-switch.test.ts`
  - M 69 `tests/state/sessions/terminal/latex-fast-failure.test.ts`
- M 12 `config/defaults/present.yml`
- M 37 `config/options/present.yml`
- M 33 `config/schemas/deck-schema.yml`
- M 503 `config/text/findings.yml`: the six strings follow `folder_missing`, at the end of the range 108-135
- M 150 `config/text/views/academic/present.yml`
- M 632 `docs/HELP.md`: lines 331 and 570
- M 1930 `docs/templates.md`: one line in 1910-1929
- `docs/diagrams/`, regenerated by `npm run diagrams`:
  - M `layer-data.dot`/`.svg`
  - M `layer-server.dot`/`.svg`
  - M `layer-state.dot`/`.svg`
  - M `layer-views.dot`/`.svg`
  - M `layers.dot`/`.svg`
  - M `writes.dot`/`.svg`
- Unchanged: `config/catalogs/glyphs.yml` and `icons.yml` (the existing glyph `warn` fits), `Group.svelte`, `Overview.svelte` and `tests/server/desktop/window-guard.test.ts`.

## Edits to existing test assertions and context literals

No existing assertion was edited. Each changed line, from `diff` against the base copy:

| File | Before | After |
| --- | --- | --- |
| `tests/checks/config/integrity.test.ts:26` | `import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';` | the same import, multi-line, with `frameSetting` |
| `tests/checks/config/integrity.test.ts:112` | (none) | `        frame: frameSetting(read.merged),` |
| `tests/checks/config/integrity.test.ts:340` | (none) | `            frame: frameSetting(loadConfig(engine).config),` |
| `tests/data/sources/present.test.ts:6` | `import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';` | the same import, multi-line, with `frameSetting` |
| `tests/data/sources/present.test.ts:180` | (none) | `            frame: frameSetting(loadConfig(engineDir()).config),` |
| `tests/checks/tree/layer-rows.ts:344` | `'data/sources/config/settings/latex',` | `'data/sources/config/settings/writing/latex',` |
| `tests/checks/tree/layer-rows.ts:345` | `'data/sources/config/settings/lint',` | `'data/sources/config/settings/writing/lint',` |
| `tests/routes/sessions/latex.test.ts:19` | `} from '../../../src/lib/data/sources/config/settings/latex.ts';` | `} from '../../../src/lib/data/sources/config/settings/writing/latex.ts';` |
| `tests/server/machine/apps/world/language-app.ts:17` | `.../config/settings/latex.ts` | `.../config/settings/writing/latex.ts` |
| `tests/server/machine/lsp/lsp-fixture.ts:28` | `.../config/settings/latex.ts` | `.../config/settings/writing/latex.ts` |
| `tests/server/root/context-fixture.ts:6` | `.../config/settings/latex.ts` | `.../config/settings/writing/latex.ts` |
| `tests/server/root/eslint-switch.test.ts:20` | `.../config/settings/lint.ts` | `.../config/settings/writing/lint.ts` |
| `tests/state/sessions/terminal/latex-fast-failure.test.ts:13` | `.../config/settings/latex.ts` | `.../config/settings/writing/latex.ts` |
| `tests/data/sources/config/settings/settings.test.ts` | the base file's head comment, its imports, and lines 36-171 (types, `SHIPPED`, `SOURCES`, `SCAN_DEPTH`, `DEFAULTS`, `mapWith`, `outcome`), with the writing describes at 379-566 | the head comment, rewritten for the split. The imports are one folder deeper and come from `./synthetic.ts`. The 'frameSetting' describe is added. No assertion was changed. |

## Judgment calls

- **J1 (reverse it if the orchestrator wants it the other way): where the frame is read.** The brief has the frame reach the reader "the way tagTones does", which is a `PortfolioConfig` field set in `portfolioConfigFrom`. As built, `DeckContext.frame` is `frameSetting(config.merged)`, called where each reader context is made: `src/lib/data/index.ts` `decks()` and `src/lib/server/content/deck/read.ts` `readDeck`. Both take a hub other than the primary from that hub's own config, as tagTones does. The reason is the first test:quick run:
  - `PortfolioConfig` lives in `data/model`, the lowest data folder (`tests/checks/imports/order.test.ts`), and cannot name the rule's type (`CatalogEntry`, in `data/sources/config/catalog/options.ts`).
  - `portfolioConfigFrom` takes partial maps (`portfolioConfigFrom({})` in `tests/routes/docs/docs.test.ts:42`, and a scratch engine with no `config/options` in `tests/server/root/process/config-cache.test.ts`). The setting reader throws by design when the catalog holds no entry.
  - Reversing it means a structural rule type in `data/model` and an engine fallback in `portfolioConfigFrom`.
  - The read is still the one setting reader, and the ranges still come only from the options entries.
- **J2: `--slide-reading`.** It is `calc(var(--slide-width) - 2 * var(--slide-pad))`, with `--slide-pad: 64px` and `--slide-width` set on the frame by Stage and the print route, as item 3 asks. At 1280 the reading column is 1152 px, against 1040 px on the base, so every 16:9 deck's text column is 112 px wider. The brief's reason, "so a 1024-wide frame's text column fits inside it", already held on the base, because `.reading` has `width: 100%` with the max-width. Keeping 1040 px for 1280 decks would need a reading width that is a ratio of the frame width, or no change at all.
- The new folder is named `settings/writing/` (latex and lint), as the brief suggests.
- The new component is named `screen/Framed.svelte`.
- The tile's mark is a `Chip` from `ui/controls` with `label=t('present.too_tall')`, `glyph=t('present.too_tall_glyph')` (`warn`) and `tone="amber"` (the same tone `ProjectCard.svelte:359` uses), inside `Tooltip text={tall}` from `ui/menu`. It is a mark and not a control, so it takes no focus.
- The setting reader reads each side on its own: a wrong `defaults.frame.width` gives the default width and keeps a valid height. That matches every other two-key setting. Decision 3 (replace the whole frame) is for `deck.frame` and is built that way (`deckFrame` returns one fault, and `frameOf` returns the setting's whole frame).
- A too-tall measure of a slide with no `source` gives no finding, and its tile mark still shows.
- While no saved deck answer is held, the browser's audience features are `popup` with no size, and the desktop window opens at 960 by 540. Export to PDF needs the saved deck (`reads.saved()`): with none held it does nothing, as it already does with no deck.
- `TOO_TALL_PX = 1` (decision 4) is in `present.svelte.ts`.
- `audiencePlace` takes `features` as a required third parameter. `windows.ts` `route(from, url, features = '')` defaults it for navigations, which carry no features.
- `wholeFrame` and the type `Frame` are exported from `src/desktop/decide/place.ts`. The bridge's check uses `wholeFrame`, and `print.ts` uses `Frame`.
- Greps made before adding a helper or type:
  - `grep -rn "audiencePlace\|AUDIENCE_SIZE" src tests` (only `show.ts:23,90` outside place.ts)
  - `grep -n "export type CatalogEntry" src/lib/data/sources/config/catalog/options.ts` (line 159, in `data/sources`)
  - `grep -rn "createRailBadges" src tests` (only `rail-badges.svelte.ts` and `context.ts`)
  - `grep -rn "withQueries" src/lib/state/client/queries/tab-scope.ts`: one store per client, and the tab wrappers share it

## Ids and keys, and asynchronous paths

- `defaults.frame`: new under `defaults:`. `grep -rn "defaults.frame\|deck.frame" O146-base/src O146-base/config` printed nothing on the base.
- `deck.frame`: new in `deck-schema.yml`.
- The new findings keys: `findings.deck.frame_not_a_map`, `frame_key_unknown`, `frame_side_missing`, `frame_side`, `untitled` and `too_tall`, and `present.too_tall` and `present.too_tall_glyph`. Each count was taken with `grep -rnw <key> config/text` on the base and after the change. Each key is new in its map. `untitled` also exists under `literature`, `radar` and `venues`, which are other maps with no collision.
- The store's key is `JSON.stringify([deck.root, deck.path, slide.key])`. An empty slide key cannot clash with another deck's key, because JSON keeps the parts apart.
- A measure in flight when its Stage goes away: the `$effect` cleanup calls `observer.disconnect()`, so no callback reaches the store after that. A measure already taken stays in the map (item 4).
- A deck answer arriving after a measure: `kept()` removes the measures of slides the answer does not hold. A slide still held keeps its entry until its Stage measures again. A changed `deck.frame` changes the frame's size, and a changed title or row changes the `onmeasure` prop, which re-runs Stage's effect. Either way the slide is measured again.
- A print request after its pane closed: `exportPdf` still awaits the bridge and writes through `deps.upload`, as on the base. The `said` it sets belongs to the closed pane and is not shown.
- A frame the bridge refuses: `PRINT_REFUSED`, the answer `{ ok: false, error: 'refused' }`, which `export.ts` says as `desktop.print.failed`.

## Host- and user-visible changes, for the look

- C1: open the portfolio deck in Present. The pane, Presenter (P), the Overview (O) tiles, the audience window and Export to PDF look as on the base, except that the reading column of text slides is 1152 px wide instead of 1040 (J2).
- C2: in a scratch deck, set `deck: { title: T, frame: { width: 1024, height: 768 } }` in `present.yml`:
  - The pane draws a 4:3 frame.
  - The Overview tiles and the presenter's next-slide room are 4:3.
  - The browser's audience window opens at 1024 by 768.
  - The desktop audience window with one display opens at 960 by 720.
  - Export to PDF gives 1024 by 768 px pages.
- C5: a text slide with forty list items shows "slide too tall: <title> runs <n> px past its frame of 1280 by 720 px" in Findings, with the slide's file and line. The rail's Findings count goes up by one. Its Overview tile shows an amber "Too tall" chip with the warn glyph, and the message as its tooltip. At five items the row, the count and the chip go.
- C7: a summary or grid slide too tall gives the same chip, and a finding at the deck's `present.yml`, on the line of its `order:` entry.
- C13: open the deck in a background tab. Nothing new appears in Findings until the tab is shown. The audience window has no chip and adds nothing to Findings.

## Head comments, doc comments and docs

Rewritten:
- the head comments of `Stage.svelte`, `Tile.svelte`, `Presenter.svelte` (lines 9-13 and the `.preview` CSS comment), `Present.svelte` (lines 20-23), `show/+page.svelte`, `print/+page.svelte`, `slide.css`, `Slide.svelte`, `export.ts`, `place.ts`, `show.ts`, `print.ts`, `Findings.svelte`, `read.ts` (a new paragraph on the frame and the untitled finding) and `spec.ts`
- the head comments of `writing/latex.ts` and `writing/lint.ts` (the reader's path)
- the head comment of `settings.test.ts`
- doc comments:
  - `bridge.ts` `PRINT_REFUSED` and `Printer`
  - `stores/desktop.ts` `PrintAnswer` and `printPdf`
  - `rail-badges.svelte.ts` `findingsCount`
  - `status.ts` `allFindings`
  - `present.ts` `fit`
  - `windows.ts` `route`
  - `kinds.ts` `Built`
  - `Tile.svelte` `.shot` CSS
- `docs/HELP.md:331` and `:570`, and `docs/templates.md` (the `present.yml` template)
- New head comments: `settings/present.ts`, `screen/Framed.svelte`, `settings/synthetic.ts` and `settings/writing.test.ts`

Still true as they stand:
- the head of `bridge.ts` ("The arguments are read before they are used")
- the head of `problems.ts` ("each reader of this folder"; `writing/` and `present.ts` are inside it)
- the heads of `data/index.ts`, `server/content/deck/read.ts`, `preload.cjs`, `windows.ts` (line 7), `acts.svelte.ts` and `context.ts`
- `docs/apps.md` (`grep -rn "1280\|16 by 9\|16:9\|print-pdf\|printPdf\|audience window\|tag_tones" docs README.md` finds nothing there)

## Anything in the brief that was wrong or impossible

- The brief's path `src/lib/views/academic/present/screen/Slide.svelte` is `src/lib/views/academic/present/Slide.svelte` (`ls src/lib/views/academic/present/screen` lists `Framed.svelte`, `Stage.svelte`, `fullscreen.svelte.ts` and `keys.ts`).
- Verify item 2 names `tests/data/sources/config/settings.test.ts`, which is now `tests/data/sources/config/settings/settings.test.ts` (C4) and `writing.test.ts`. For the orchestrator: G13 at `.scratch/migration/agents/guarded.md:254` names `tests/data/sources/config/settings.test.ts` four times. One of these is "the `latex.texlab_path`, `latex.unimath_symbols` and `latex.includegraphics_preview` rows of 'answers the default for a wrong %s and names the key'", which is now in `tests/data/sources/config/settings/writing.test.ts`. The others (one case per setting reader, `literature.*`, 'appsSettings', 'slurmSettings') are now in `tests/data/sources/config/settings/settings.test.ts`. C4's tests to record under G13: describe 'frameSetting', 'reads the frame a workspace sets', and the table 'answers the default for a wrong defaults.frame.%s and names the key'. The ledger is outside this step's write list, so these lines are unchanged.
- "the way tagTones does" for the frame's route to the reader is not possible with the frame's rule in `PortfolioConfig` (J1).

# Repair round 1

The eight items of `.scratch/migration/agents/briefs/O146-round-1.md` are made as ruled. One check is red: the single run of `npm run diagrams && npm run docs:palette && npm run test:quick` failed 5 tests in `vitest` and `vitest slow`. Each of the 4 failing files passes when run alone (see "Verify"). Item 3 leaves one case open that the orchestrator should decide on ("Open point").

## Items

1. **Reading column.**
   - Change: `src/lib/themes/slide.css:16` now reads `--slide-reading: min(1040px, calc(var(--slide-width) - 2 * var(--slide-pad)));`. The head of `slide.css` (lines 1-7) and `Slide.svelte:4-8` now say the column is at most 1040 px, and in a frame too narrow for that it is the frame's width less the padding (896 px in a 1024 frame).
   - Check: `grep -n "1040" src/lib/themes/slide.css src/lib/views/academic/present/Slide.svelte` prints `slide.css:4`, `slide.css:16` and `Slide.svelte:5`. By the arithmetic: at 1280, min(1040, 1152) = 1040; at 1024, min(1040, 896) = 896.
   - Look: see the "For the look" list at the end of this section.
2. **A newly shown slide is measured.**
   - Change:
     - `screen/Stage.svelte` takes a new prop, `drawing?: string`, which defaults to `''`. Its measuring effect reads `drawing` with `$state.snapshot(drawing)`, the idiom `ui/tabs/Tabs.svelte:154` uses, so the effect runs again, observes the frame again and measures again when `drawing` changes.
     - `screen/Framed.svelte` computes `const drawing = $derived(JSON.stringify([deck.root, deck.path, row.key, row.title]))` and passes it to the Stage. A pane or presenter Stage moved to another slide, or showing a retitled slide, measures again. The `onmeasure` closure reads the current `row` when it is called, so the finding carries the new title.
     - Nothing is remounted. The head comments of Stage and Framed say this.
   - Check: the compile program `compile.mjs` (source below) compiles each file with `svelte/compiler` (`generate: 'client', runes: true`) and prints the matching lines. For `node compile.mjs src/lib/views/academic/present/screen/Framed.svelte 'drawing|onmeasure'`:
     ```
     25:     const drawing = $.derived(() => JSON.stringify([
     41:         get drawing() {
     42:             return $.get(drawing);
     44:         onmeasure: (over) => measured($$props.deck, $$props.row, over),
     ```
     For `node compile.mjs src/lib/views/academic/present/screen/Stage.svelte 'user_effect|drawing|snapshot|report|key-hint'`, the code lines:
     ```
     36:         drawing = $.prop($$props, 'drawing', 3, '');
     45:     $.user_effect(() => {
     47:         const report = $$props.onmeasure;
     50:         $.snapshot(drawing());
     52:         if (element === null || report === undefined) return;
     57:             const hint = element.querySelector('[data-key-hint]')?.offsetHeight ?? 0;
     59:             report(Math.max(0, element.scrollHeight - element.clientHeight - hint));
     ```
     The compiler indents with tabs. They are written here as four spaces each, and the vitest output's ellipsis below is written as `...`, so the report stays ASCII.
     The effect reads the prop signal `drawing()`, and Framed passes the prop as a getter over a derived value. A new key or title therefore re-runs the effect, and the new ResizeObserver's first callback measures the slide now drawn.
3. **A superseded answer leaves the measures alone.**
   - Change in `src/lib/state/life/present.svelte.ts`:
     - `answered()` no longer calls `kept`.
     - `load()`, the saved deck's query, calls `kept(answer.deck)` when the answer holds a deck (lines 278-286).
     - The store exposes `kept: (deck: Deck) => void` (type at 150-155, returned at 398). The doc comments of `measured` and `drawn` say which answers are kept.
   - Change in `src/lib/views/academic/present/acts/live.svelte.ts`:
     - It reads `present: { drawn, kept }` from `useState()`, as `views/sources/source/save/tab-save.svelte.ts:25` reads its stores.
     - It hands the answer to `kept` only inside `if (current)`, the branch where the pane takes it (lines 46-50).
     - Its `Reads` type no longer has `drawn`. `Present.svelte` drops `drawn` from its destructure and from the `createLive` call, and is now 518 lines.
   - The asynchronous path in the case the review names:
     - The answer to the drafts `[one.md, tw]` arrives after the next keystroke has cleared the timer's `current`.
     - `live.svelte.ts` returns before `kept`, so the store keeps `two.md`'s measure.
     - The answer to the drafts that were not typed over is taken and passed to `kept`, and the deck it holds removes only the slides it does not hold.
     - The saved deck's answer passes to `kept` when it arrives.
   - Check: `grep -n "kept" src/lib/state/life/present.svelte.ts src/lib/views/academic/present/acts/live.svelte.ts` prints `present.svelte.ts:147,155,171,284,317,318,398` and `live.svelte.ts:5,32,49`. `answered()` (lines 296-300) holds no call.
4. **One slide, one measure.**
   - Change: Stage's measure subtracts the height of the element marked `data-key-hint` (`Slide.svelte:76`), when there is one, from `scrollHeight - clientHeight`, and keeps the result at 0 or above (compiled lines 57 and 59 above).
     - When the slide overflows, the hint's `margin-top: auto` resolves to 0, so the hint adds exactly its own `offsetHeight` (padding included) to the overflow.
     - When the slide fits without the hint, the subtraction gives 0 or less, and so 0.
     - `offsetHeight`, `scrollHeight` and `clientHeight` are all layout sizes that ignore the scale transform.
   - Nothing drawn changes. The pane, the tile, the presenter, the audience window and the PDF measure the first slide alike.
   - Check: by reading only, since no browser may be driven. The look at landing settles it with a first slide that fits with 20 px to spare: no finding in the pane, and no flip on opening and closing the Overview.
5. **The page's own findings in one place.**
   - Change: a new `pageFindings(registry: Pick<RegistryStore, 'refused'>, present: Pick<PresentStore, 'findings'>): Finding[]` in `src/lib/state/workbench/navigation/status.ts`, beside `allFindings`. `Findings.svelte:93` and `rail-badges.svelte.ts:224` both read `{ findings: pageFindings(registry, present) }`.
   - Check: `grep -rn "pageFindings" src` prints `rail-badges.svelte.ts:22,224`, `status.ts:493`, `Findings.svelte:59,93`. `grep -rn "registry.refused(), ...present" src` prints nothing.
6. **The defaults file says where a deck sets its frame.**
   - Change: `config/defaults/present.yml:1` now says "its own present.yml changes `defaults.tag_tones` in its own `defaults:` block, and the frame in `deck.frame`". The `groups:` line of `config/options/present.yml:36` is now `defaults: "What oculus carries for every deck the Present view draws. A deck's own present.yml changes defaults.tag_tones in its own defaults: block, and the frame in deck.frame."`. It is quoted because of the `: ` inside it.
   - Check: `python3 -c "import yaml;[yaml.safe_load(open(f)) for f in ['config/defaults/present.yml','config/options/present.yml']];print('yaml ok')"` prints `yaml ok`. The config tests in the related run below pass.
7. **The unreachable branch goes.**
   - Change in `src/lib/data/sources/config/settings/present.ts`:
     - `sides` is `Record<Side, number>`.
     - After `valueProblem` passes a side, it is narrowed once with `sides[side] = held as number;`, under the comment "Both entries are number controls, and valueProblem refuses what is no finite number."
     - The function returns `{ frame: sides }`.
     - The `not-a-map` fallback after the loop is gone. `not-a-map` stays for the value that is no map (line 67). The file is 87 lines.
   - Check: the settings folder passes (verify item 2 below). The C3 rows are in `deckFrame`'s tests, through `present.test.ts`.
8. **Report.** The new visible changes are in "For the look" below.

## Verify

- `npm run diagrams && npm run docs:palette && npm run test:quick`, run once after the last change, printed:
  ```
  test:quick: 86 changed file(s), from git since HEAD
  test:quick: 360 test file(s)
  ok      prettier (1.7 s): All matched files use Prettier code style!
  ok      ASCII gate (1.8 s)
  ok      svelte-kit sync (3.4 s)
  ok      eslint (4.0 s)
  ok      svelte-check (57.3 s): 1793902675370 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok      vitest checks (247.5 s): Duration  223.59s (transform 133.88s, setup 0ms, import 293.90s, tests 536.17s, environment 7ms)
  FAILED  vitest (399.3 s)
   FAIL  |unit| tests/data/hubs/website-files.test.ts [ tests/data/hubs/website-files.test.ts ]
  Error: Hook timed out in 10000ms.
   FAIL  |unit| tests/routes/git/zenodo.test.ts > the review copy For review sends > refuses two paths that become one, naming both, before any request
   FAIL  |unit| tests/routes/git/zenodo.test.ts > the review copy For review sends > refuses a Latin-1 file holding a term in its one-byte form, naming it
  Error: Test timed out in 5000ms.
   FAIL  |unit| tests/state/sessions/terminal/latex-fast-failure.test.ts > posts the failure notice of a build whose terminal ended while its list was read
  AssertionError: expected [ [Function], [Function], ...(12) ] to have a length of 2 but got 14
  FAILED  vitest slow (579.2 s)
   FAIL  |unit| tests/server/edit/config-key.test.ts > a write that names a hub > writes the primary alike for a body naming it and a body naming no hub
  Error: Test timed out in 20000ms.
  test:quick: 582.8 s; failed: vitest, vitest slow
  ```
  - The run's output also printed `svelte-kit types: waiting for .../.svelte-kit/oculus-types.lock, held by process 60789`.
  - Each failing file was then run alone, `npx vitest run <file>`:
    - `website-files.test.ts`: `Tests  41 passed (41)`
    - `zenodo.test.ts`: `Tests  51 passed (51)`
    - `latex-fast-failure.test.ts`: `Tests  1 passed (1)`
    - `config-key.test.ts`: `Tests  36 passed (36)`
  - The failures are 4 timeouts and one count:
    - The count is `latex-fast-failure.test.ts:65`, `vi.waitFor(() => expect(reads).toHaveLength(2))`. It saw 14 reads, so the list was read 12 more times before the poll looked. The test counts reads against wall time, so it depends on load. The round changes nothing it imports.
    - The timeouts are in files the round does not touch.
  - The list was not run a second time, since the round says once. The orchestrator's run at landing settles it.
- Verify item 2, with the settings folder in place of the moved file: `npx vitest run tests/data/sources/present.test.ts tests/data/sources/config/settings tests/checks/config/config-folder.test.ts tests/checks/config/integrity.test.ts tests/server/desktop/window-guard.test.ts` prints `Test Files  6 passed (6)` and `Tests  163 passed | 9 skipped (172)`.
- `tests/checks/imports/order.test.ts` alone (status.ts gains two type imports): `Test Files  1 passed (1)`, `Tests  13 passed (13)`. In the wider related run, its 'holds the ui folders' test timed out at 5000 ms.
- "Verify before you report" over the 13 files the round changes:
  - `slide.css`
  - `Slide.svelte`
  - `Stage.svelte`
  - `Framed.svelte`
  - `present.svelte.ts`
  - `live.svelte.ts`
  - `Present.svelte`
  - `status.ts`
  - `rail-badges.svelte.ts`
  - `Findings.svelte`
  - both config YAML files
  - `settings/present.ts`

  Checks over them:
  - `npx prettier --check` prints `All matched files use Prettier code style!`.
  - `npx eslint` reports no errors (only "File ignored" warnings for the css and yml files).
  - `LC_ALL=C grep -n '[^ -~]'` prints nothing (exit 1).
  - The frame-size grep prints only the `place.ts` lines 18, 75, 118, 119, 149 and 150 that the first report names (exit 1 with those filtered out).
  - The history-word grep of spec.md:44 over the added comment lines prints nothing (exit 1).
  - `awk 'length > 100'` finds `Slide.svelte:74` and `Present.svelte:438`, both code lines with the same length on the base copy (`Slide.svelte:71` 134 columns, `Present.svelte:438` 105 columns there).
  - `sh utils/unused-exports.sh` diffed against `O146-base/unused-exports.txt` prints nothing (exit 0).
  - Line counts:
    - `present.svelte.ts` 556
    - `status.ts` 684
    - `rail-badges.svelte.ts` 413
    - `Present.svelte` 518
    - `Findings.svelte` 296
    - `Stage.svelte` 134
    - `Framed.svelte` 37
    - `live.svelte.ts` 59
    - `settings/present.ts` 87
  - `npm run diagrams` ran as the first command of the list. The folder edge from `state/workbench` to `state/life` in `layer-state.dot` has label 1, the same as on the base copy, since the new imports are type-only.
- `docs/HELP.md:331` stays true as it stands: it names no column width, no key hint and no answer order.

Paths outside the round's write list: none. `acts/live.svelte.ts` is named by item 3. The changes to `Present.svelte` are the two lines that drop `drawn`, which `live.svelte.ts` now reads itself, and `Present.svelte` is in the step's write list.

Source of `compile.mjs` (in the scratchpad, deleted after this report):

```js
// Compiles a Svelte component (client, runes) and prints the compiled lines that match a pattern.
import { readFileSync } from 'node:fs';
import { compile } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O146/node_modules/svelte/src/compiler/index.js';
const [file, pattern] = process.argv.slice(2);
const out = compile(readFileSync(file, 'utf8'), { generate: 'client', runes: true, filename: file }).js.code;
out.split('\n').forEach((line, i) => { if (new RegExp(pattern).test(line)) console.log(`${i + 1}: ${line}`); });
```

## Open point for the orchestrator (item 3)

The ruling counts the saved deck's answer as kept. That leaves one case in which a measure goes while its slide is still drawn too tall:

1. The pane draws a live deck whose drafts add slide X, and X is not on disk. X is measured too tall.
2. A `files` or `config` push then re-reads the saved deck.
3. `load()` calls `kept` with the saved deck, which lacks X, and X's entry leaves.
4. The pane still draws X from the live deck, with the same `drawing` text and the same size, so no Stage measures it again until X is moved to or resized.

A fix that ends this would have the pane hand `kept` the deck it draws, saved or live, and `load()` call nothing. Only a pane's Stages measure, so the deck a pane draws is the one whose measures are true. This is not built, because it changes what the ruling names as kept.

## For the look (items 1 and 8, with the first report's list)

- Item 1: open the portfolio deck. A text slide's reading column is 1040 px wide, as on the base. A 1024 by 768 deck's text column is 896 px.
- Item 2: in a deck with A, which fits, and B, which is too tall, mark B too tall on its tile. Shorten B in an editor while the pane shows A, then press the right arrow. The finding for B goes.
- Item 2, retitled: retitle a too-tall slide that is shown. The finding's message names the new title.
- Item 3: type `order: [one.md, two.md]` over a too-tall `two.md`. The finding and the chip stay.
- Item 4: a first slide that fits without the key hint gives no finding in the pane, and opening and closing the Overview does not change Findings.
- Item 8, Settings: the Settings view's heading `presentation` holds a section `Slides` beside `Status chips`. It has two number controls, `defaults.frame.width` (320 to 3840, whole) and `defaults.frame.height` (240 to 2160, whole), each with the help line of `config/options/present.yml:10` and `:18`. On the base, the heading held only `Status chips`.
- Item 8, editor: in the YAML editor on a deck's `present.yml`, completion under `deck:` offers `frame` beside `title`, with the help line of `config/schemas/deck-schema.yml:18`. On the base, it offered `title` only.
