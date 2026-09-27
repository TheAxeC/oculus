// Layer 4, test. Inside each layer every module imports only its own folder or a folder below it
// in the order tests/checks/imports/order.ts declares, and every folder of a layer is placed.
//
// One case per layer holds that layer of the tree to its order; each names, as its revert, the
// import that a move of this order ended or, where no move was needed, the order put back the
// other way round, and goes red under it. The cases after them plant an upward import, one that
// climbs the inner order of state/shared, and an unplaced folder in a scratch tree and show the
// check names each.

import { tmpdir } from 'node:os';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { moduleOf } from './graph.ts';
import { INNER, ORDER, findUpward } from './order.ts';
import { plantScratch, sweepScratch } from '../../fixtures/scratch.ts';

afterAll(sweepScratch);

const LIB = resolve(fileURLToPath(import.meta.url), '..', '..', '..', '..', 'src', 'lib');

/** What the tree breaks of one layer's order: its own lines of findUpward's answer. */
function brokenIn(layer: string): string[] {
    return findUpward(LIB).filter((line) => line.split(/[/ :]/)[0] === layer);
}

/** A scratch tree of the given files, checked to be inside the temporary directory. */
function plant(files: Record<string, string>): string {
    const dir = plantScratch('oculus-order-', files);
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    return dir;
}

describe('the folder order of each layer', () => {
    // revert: src/lib/data/sources/career.ts:12 => import type { Finding } from '../model.ts';
    it('holds the data folders', () => {
        // The model's facade is data/model/index.ts, under every data folder that reads it.
        expect(brokenIn('data')).toEqual([]);
    });

    // The revert points the mail poller at a file-poll.ts in server/root, above server/accounts. It
    // is written type-only because vite.config.ts loads the server, and so poll.ts, before any case
    // runs: a runtime import of the gone file stops the run, while this check reads type imports.
    // revert: src/lib/server/accounts/mail/poll.ts:38 => import type { POLL, pollFile, systemClock, Clock, FilePoll } from '../../root/watch/file-poll.ts';
    it('holds the server folders', () => {
        // The composition root heads the order and file-poll.ts sits in server/core at its foot.
        expect(brokenIn('server')).toEqual([]);
    });

    // revert: src/lib/state/boards/focus-lanes.ts:6 => import { numericSetting } from '../workbench/rail-badges.ts';
    it('holds the state folders', () => {
        // The helpers two folders shared moved below both, so each pair imports one way.
        expect(brokenIn('state')).toEqual([]);
    });

    // revert: src/lib/ui/menu/MenuList.svelte:18 => import Glyph from '../controls/Glyph.svelte';
    it('holds the ui folders', () => {
        // Glyph moved to ui/display, under both the controls and the menus that draw it.
        expect(brokenIn('ui')).toEqual([]);
    });

    // revert: src/lib/shell/panes/FoldedPane.svelte:12 => import { activeLabel } from '$lib/shell/workbench-title';
    it('holds the shell folders', () => {
        // The workbench title moved into shell/panes, the folder beside Workbench that reads it.
        expect(brokenIn('shell')).toEqual([]);
    });

    // revert: tests/checks/imports/order.ts:80 => 'views/shared', 'views/academic',
    it('holds the views folders', () => {
        // Every view group imports only views/shared, and views/shared imports no group.
        expect(brokenIn('views')).toEqual([]);
    });
});

describe('the order check', () => {
    // revert: tests/checks/imports/order.ts:148 => return listed.indexOf(to) > listed.indexOf(from);
    // revert: tests/checks/imports/order.ts:168 => for (const [fileRel, imports] of importGraph(libRoot)) {
    it('names a planted upward import and a type-only one with their lines, and passes a downward one', () => {
        const dir = plant({
            'state/forms/text.ts': 'export const t = 1;\n',
            'state/client/context.ts':
                "import { t } from '../forms/text.ts';\nexport const c = t;\n",
            'state/forms/bad.ts':
                "export const x = 1;\nimport { c } from '../client/context.ts';\nimport type { T } from '$lib/state/client/context';\n"
        });
        const order = { state: ['state/client', 'state/forms'] };
        expect(findUpward(dir, order, {})).toEqual([
            'state/forms/bad.ts:2 imports state/client/context.ts (state/client, above state/forms)',
            'state/forms/bad.ts:3 imports state/client/context.ts (state/client, above state/forms)'
        ]);
    });

    // revert: tests/checks/imports/order.ts:177 => if (true) continue;
    it('names an import that climbs the inner order of a folder, and passes one that descends it', () => {
        const dir = plant({
            'state/shared/words/text.ts':
                "import type { Shape } from '../stores/shapes.ts';\nexport const t = 1;\n",
            'state/shared/stores/shapes.ts':
                "export type Shape = number;\nimport { t } from '$lib/state/shared/words/text';\n",
            'state/client/context.ts': "import { t } from '../shared/words/text.ts';\n"
        });
        const order = { state: ['state/client', 'state/shared'] };
        const inner = { 'state/shared': ['state/shared/words', 'state/shared/stores'] };
        expect(findUpward(dir, order, inner)).toEqual([
            'state/shared/stores/shapes.ts:2 imports state/shared/words/text.ts (state/shared/words, above state/shared/stores)'
        ]);
    });

    // revert: tests/checks/imports/order.ts:134 => .filter(() => false)
    it('names a folder the order does not place and one the tree no longer holds', () => {
        const dir = plant({
            'ui/new/One.svelte': '<span></span>\n',
            'state/shared/odd/One.ts': 'export const one = 1;\n'
        });
        const inner = { 'state/shared': ['state/shared/gone'] };
        expect(findUpward(dir, { ui: ['ui/gone'], state: ['state/shared'] }, inner)).toEqual([
            'state/shared/gone is placed but the tree holds none',
            'state/shared/odd is not placed in the state/shared order',
            'ui/gone is placed but the tree holds none',
            'ui/new is not placed in the ui order'
        ]);
    });

    it('places every folder of every layer the tree holds, and every sub-folder of an inner order', () => {
        // revert: tests/checks/imports/order.ts:75 => 'ui/tabs',
        // revert: tests/checks/imports/order.ts:97 => 'state/shared': ['state/shared/words']
        expect(findUpward(LIB).filter((line) => line.includes(' placed'))).toEqual([]);
        expect(Object.keys(ORDER)).toEqual(['data', 'server', 'state', 'ui', 'shell', 'views']);
        expect(Object.keys(INNER)).toEqual(['state/shared']);
    });
});

describe('the module an import names', () => {
    // revert: tests/checks/imports/graph.ts:95 => const ending = '';
    it('is the file a specifier names with its own ending, never a folder index of that name', () => {
        const dir = plant({
            'data/model/index.ts': 'export type T = number;\n',
            'data/sources/a.ts': "import type { T } from '../model.ts';\n"
        });
        const order = { data: ['data', 'data/sources', 'data/model'] };
        // data/model.ts is not there, so the import names the folder `data` itself, above sources.
        expect(findUpward(dir, order, {})).toEqual([
            'data is placed but the tree holds none',
            'data/sources/a.ts:1 imports data/model.ts (data, above data/sources)'
        ]);
    });

    // revert: bin/diagrams/imports.mjs:346 => return null;
    it('is the .ts file a .js specifier compiles from, as Vite resolves it, or the .js file there is', () => {
        const dir = plant({
            'lib/x.ts': 'export const x = 1;\n',
            'lib/y.js': 'export const y = 1;\n',
            'lib/y.ts': 'export const y = 2;\n'
        });
        expect(moduleOf(dir, 'lib/x', './x.js')).toBe('lib/x.ts');
        expect(moduleOf(dir, 'lib/y', './y.js')).toBe('lib/y.js');
        // Neither file is there, so the specifier names the file it writes.
        expect(moduleOf(dir, 'lib/z', './z.js')).toBe('lib/z.js');
    });

    // revert: bin/diagrams/imports.mjs:328 => ...['.ts', '.mjs', '.js', '.mts', '.jsx', '.tsx', '.json'],
    it('is the first file an extensionless specifier names in the order Vite tries its endings', () => {
        const dir = plant({
            'lib/both.js': 'export const b = 1;\n',
            'lib/both.ts': 'export const b = 2;\n',
            'lib/only.ts': 'export const o = 1;\n',
            'lib/folder/index.ts': 'export const f = 1;\n',
            'lib/one.svelte.ts': 'export const s = 1;\n'
        });
        // Vite tries .mjs, .js, .mts, .ts, .jsx, .tsx and .json, so .js comes before .ts.
        expect(moduleOf(dir, 'lib/both', './both')).toBe('lib/both.js');
        expect(moduleOf(dir, 'lib/only', './only')).toBe('lib/only.ts');
        expect(moduleOf(dir, 'lib/folder', './folder')).toBe('lib/folder/index.ts');
        expect(moduleOf(dir, 'lib/one.svelte', './one.svelte')).toBe('lib/one.svelte.ts');
    });
});
