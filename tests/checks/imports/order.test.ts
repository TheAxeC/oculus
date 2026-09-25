// Layer 4, test. Inside each layer every module imports only its own folder or a folder below it
// in the order tests/checks/imports/order.ts declares, and every folder of a layer is placed.
//
// One case per layer holds that layer of the tree to its order; each names, as its revert, the
// import that a move of this order ended or, where no move was needed, the order put back the
// other way round, and goes red under it. The last cases plant an upward import and an unplaced
// folder in a scratch tree and show the check names both.

import { tmpdir } from 'node:os';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { ORDER, findUpward } from './order.ts';
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

    // revert: tests/checks/imports/order.ts:65 => 'views/shared', 'views/academic',
    it('holds the views folders', () => {
        // Every view group imports only views/shared, and views/shared imports no group.
        expect(brokenIn('views')).toEqual([]);
    });
});

describe('the order check', () => {
    // revert: tests/checks/imports/order.ts:124 => if (listed.indexOf(to) !== listed.indexOf(from)) continue;
    // revert: tests/checks/imports/order.ts:117 => for (const [fileRel, imports] of importGraph(libRoot)) {
    it('names a planted upward import and a type-only one with their lines, and passes a downward one', () => {
        const dir = plant({
            'state/words/text.ts': 'export const t = 1;\n',
            'state/client/context.ts':
                "import { t } from '../words/text.ts';\nexport const c = t;\n",
            'state/words/bad.ts':
                "export const x = 1;\nimport { c } from '../client/context.ts';\nimport type { T } from '$lib/state/client/context';\n"
        });
        const order = { state: ['state/client', 'state/words'] };
        expect(findUpward(dir, order)).toEqual([
            'state/words/bad.ts:2 imports state/client/context.ts (state/client, above state/words)',
            'state/words/bad.ts:3 imports state/client/context.ts (state/client, above state/words)'
        ]);
    });

    // revert: tests/checks/imports/graph.ts:86 => for (const match of text.matchAll(/(?!)/g)) {
    it('names a declare module block that augments a module of a folder above, and passes one below', () => {
        const dir = plant({
            'state/words/text.ts': 'export interface Words {}\n',
            'state/client/context.ts': 'export interface Client {}\n',
            'state/words/merge.ts':
                "export {};\ndeclare module '../client/context.ts' {\n    interface Client { x: 1 }\n}\n",
            'state/client/merge.ts':
                "export {};\ndeclare module '$lib/state/words/text' {\n    interface Words { y: 1 }\n}\n",
            'state/client/outside.d.ts': "declare module 'some-package' {}\n"
        });
        const order = { state: ['state/client', 'state/words'] };
        expect(findUpward(dir, order)).toEqual([
            'state/words/merge.ts:2 augments state/client/context.ts (state/client, above state/words)'
        ]);
    });

    // revert: tests/checks/imports/order.ts:109 => if (false)
    it('names a folder the order does not place and one the tree no longer holds', () => {
        const dir = plant({ 'ui/new/One.svelte': '<span></span>\n' });
        expect(findUpward(dir, { ui: ['ui/gone'] })).toEqual([
            'ui/gone is placed but the tree holds none',
            'ui/new is not placed in the ui order'
        ]);
    });

    it('places every folder of every layer the tree holds', () => {
        // revert: tests/checks/imports/order.ts:60 => 'ui/tabs',
        expect(findUpward(LIB).filter((line) => line.includes(' placed'))).toEqual([]);
        expect(Object.keys(ORDER)).toEqual(['data', 'server', 'state', 'ui', 'shell', 'views']);
    });
});

describe('the module an import names', () => {
    // revert: tests/checks/imports/graph.ts:102 => if (ending === null) return id;
    it('is the file a specifier names with its own ending, never a folder index of that name', () => {
        const dir = plant({
            'data/model/index.ts': 'export type T = number;\n',
            'data/sources/a.ts': "import type { T } from '../model.ts';\n"
        });
        const order = { data: ['data', 'data/sources', 'data/model'] };
        // data/model.ts is not there, so the import names the folder `data` itself, above sources.
        expect(findUpward(dir, order)).toEqual([
            'data is placed but the tree holds none',
            'data/sources/a.ts:1 imports data/model.ts (data, above data/sources)'
        ]);
    });
});
