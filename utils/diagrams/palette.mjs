#!/usr/bin/env node
// Layer 4, tool. Write docs/palette.md: what the palette lists and takes, made from the palette's
// own modules and the text catalog, never from a list kept here. The modules use `$lib` aliases and
// Svelte runes, so plain node cannot load them; the project's Vite server loads them
// (`createServer` with vite.config.ts, in middleware mode so it binds no port and watches nothing,
// and `ssrLoadModule`), the same loading Vitest does. The registry handed to the page function
// (src/lib/shell/keys/palette-page.ts) holds:
//
//   views     every view the build registers, as src/routes/views.ts registers them into a
//             registry (the modules' views, the collection views and the project boards of
//             `boards:`), in the words the catalog gives them;
//   commands  commands() of src/lib/state/workbench/palette.ts, with every source tab and server
//             assumed so that every command is listed;
//   editor    the chords of Monaco's that the palette lists (chords.ts editorChords) with the chord
//             that runs each in the editor, and the Pin Editor and Unpin Editor items;
//   present   the acts of a slide (SLIDE_ACTS) in the words of the Present menu, and Export to PDF;
//   prefixes, keys  the rows of the palette table (data/helpers/keys/oculus/palette-table.ts), the
//             table the palette's query and key readers run on.
//
// tests/checks/diagrams/palette.test.ts runs paletteText() and fails when the committed page
// differs from it. Usage:
//
//     npm run docs:palette

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

/** Where the page is written, relative to the engine directory. */
export const PAGE = 'docs/palette.md';

/**
 * A plugin that leaves the loading server with no file watcher. Vite merges an inline config over
 * vite.config.ts and skips a null value, so `server.watch: null` given to createServer never
 * arrives; the config hook sets it on the merged config. A watcher would invalidate the loaded
 * modules on any write in the tree during a load, and a module imported after that is evaluated
 * again: the text module palette.ts imports would then be a second one, with no catalog set.
 *
 * @type {import('vite').Plugin}
 */
const UNWATCHED = {
    name: 'palette-page-unwatched',
    config(config) {
        config.server = { ...config.server, watch: null };
    }
};

/**
 * The page the palette's modules give now, as text. Vite's server is started for the loading and
 * closed again whatever the loading does.
 *
 * @param {string} engine The engine directory, where vite.config.ts is.
 * @returns {Promise<string>}
 */
export async function paletteText(engine) {
    const server = await createServer({
        root: engine,
        configFile: join(engine, 'vite.config.ts'),
        appType: 'custom',
        logLevel: 'error',
        server: { middlewareMode: true, hmr: false, ws: false },
        plugins: [UNWATCHED]
    });
    try {
        const load = (/** @type {string} */ path) => server.ssrLoadModule(path);
        const [
            source,
            words,
            choices,
            views,
            registryMod,
            palette,
            chords,
            life,
            menu,
            page,
            boards
        ] = await Promise.all([
            load('/src/lib/data/sources/config.ts'),
            load('/src/lib/state/shared/words/text.ts'),
            load('/src/lib/data/helpers/files/apps/choices.ts'),
            load('/src/routes/views.ts'),
            load('/src/lib/state/workbench/navigation/registry.ts'),
            load('/src/lib/state/workbench/palette.ts'),
            load('/src/lib/ui/controls/editor/chords.ts'),
            load('/src/lib/state/life/present.ts'),
            load('/src/lib/views/academic/present/acts/menu.ts'),
            load('/src/lib/shell/keys/palette-page.ts'),
            load('/src/lib/state/boards/board/index.ts')
        ]);
        const { config } = source.loadConfig(source.engineDir());
        const catalog = source.textCatalog(config);
        words.setCatalog(catalog);
        words.setGlyphs(config.glyphs ?? {});

        const registry = registryMod.createRegistry({ closeInstancesOfView: () => undefined });
        views.registerAll(registry);
        const collections = source.collectionViews(config, source.unplacedGroup(config));
        views.registerCollections(registry, collections);
        views.registerBoards(
            registry,
            views.pageBoards(
                boards.boardsSource(config, () => ''),
                catalog,
                collections
            )
        );

        const pinItems = [false, true].flatMap((pinned) =>
            palette.pinItems(
                { id: 'tab', pinned },
                chords.chordHint(chords.PIN_KEYS, true),
                words.t
            )
        );

        return page.palettePage(
            {
                views: registry.views().map((/** @type {{ id: string }} */ view) => ({
                    id: view.id,
                    label: registryMod.registrationLabel(view)
                })),
                commands: palette
                    .commands(config, choices.NO_OFFERS, true, 'python', false)
                    .map(
                        (
                            /** @type {{ name: string, hint: string, description: string }} */ one
                        ) => ({ name: one.name, hint: one.hint, description: one.description })
                    ),
                editor: chords
                    .editorChords(true)
                    .filter((/** @type {{ command?: true }} */ one) => one.command !== true)
                    .map((/** @type {{ id: string, keys: unknown }} */ one) => ({
                        id: one.id,
                        chord: chords.chordHint(one.keys, true)
                    })),
                pin: {
                    labels: pinItems.map((/** @type {{ label: string }} */ one) => one.label),
                    chord: pinItems[0].hint
                },
                present: [
                    ...life.SLIDE_ACTS.map((/** @type {string} */ act) => menu.actLabel(act)),
                    words.t('present.export')
                ],
                prefixes: page.prefixInputs(),
                keys: page.keyInputs()
            },
            catalog
        );
    } finally {
        await server.close();
    }
}

/**
 * Whether the committed page differs from the page the modules give now.
 *
 * @param {string} engine
 * @returns {Promise<boolean>}
 */
export async function pageIsStale(engine) {
    const path = join(engine, PAGE);
    return !existsSync(path) || readFileSync(path, 'utf8') !== (await paletteText(engine));
}

/** Write docs/palette.md. */
async function main() {
    const engine = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
    const path = join(engine, PAGE);
    if (!existsSync(dirname(path))) mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, await paletteText(engine));
    process.stdout.write(`${PAGE}\n`);
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    await main();
}
