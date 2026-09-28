// Layer 4, test. No module under src augments a module of the tree, by a `declare module` block or
// a `/// <reference path>` directive, in whichever direction the augmentation runs.
//
// The first case holds the tree to none. The cases after it plant each form in a scratch tree laid
// out as src is (the modules under lib/, `$lib/` standing for it): a block adding to a module above
// its own folder, a block filling an empty interface a module below declares, a block across two
// layers, a reference directive, a block named only in comments, and a package's own augmentation;
// each shows what the check names.

import { tmpdir } from 'node:os';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { findAugments } from './augments.ts';
import { plantScratch, sweepScratch } from '../../fixtures/scratch.ts';

afterAll(sweepScratch);

const SRC = resolve(fileURLToPath(import.meta.url), '..', '..', '..', '..', 'src');

/** A scratch src of the given files, checked to be inside the temporary directory. */
function plant(files: Record<string, string>): string {
    const dir = plantScratch('oculus-augments-', files);
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    return dir;
}

/** The modules every planted tree holds: a store low in the state order and one at its head. */
const BASE = {
    'lib/state/client/context.ts': 'export interface Client {}\n',
    'lib/state/shared/stores/slots.ts': 'export interface Slots {}\n'
};

describe('augmentation of a module of the tree', () => {
    it('is refused across src, and src holds none', () => {
        // Every module that needs another's declarations imports them; the one block src holds
        // adds to a package.
        expect(findAugments(SRC, 'lib/')).toEqual([]);
    });

    it('is named for a block that adds to a module of a folder above its own', () => {
        const dir = plant({
            ...BASE,
            'lib/state/shared/stores/merge.ts':
                "export {};\ndeclare module '../../client/context.ts' {\n    interface Client { x: 1 }\n}\n"
        });
        expect(findAugments(dir, 'lib/')).toEqual([
            'lib/state/shared/stores/merge.ts:2 augments lib/state/client/context'
        ]);
    });

    it('is named for a block that fills an empty interface a module below declares', () => {
        const dir = plant({
            ...BASE,
            'lib/state/client/fill.ts':
                "export {};\ndeclare module '../shared/stores/slots.ts' {\n    interface Slots { y: 1 }\n}\n"
        });
        expect(findAugments(dir, 'lib/')).toEqual([
            'lib/state/client/fill.ts:2 augments lib/state/shared/stores/slots'
        ]);
    });

    it('is named for a block across layers, in a component as in a module', () => {
        const dir = plant({
            ...BASE,
            'lib/views/a/one/One.svelte':
                '<script lang="ts">\n    declare module \'$lib/state/client/context\' {\n        interface Client { z: 1 }\n    }\n</script>\n',
            'lib/ui/two.d.ts': "declare module '../state/shared/stores/slots' {}\n"
        });
        expect(findAugments(dir, 'lib/')).toEqual([
            'lib/ui/two.d.ts:1 augments lib/state/shared/stores/slots',
            'lib/views/a/one/One.svelte:2 augments lib/state/client/context'
        ]);
    });

    it('is named for a reference directive to a module of the tree', () => {
        const dir = plant({
            ...BASE,
            'lib/state/client/refer.ts':
                '/// <reference path="../shared/stores/slots.ts" />\nexport const r = 1;\n',
            'lib/ui/bare.d.ts': "///<reference path='../state/client/context.ts'/>\n"
        });
        expect(findAugments(dir, 'lib/')).toEqual([
            'lib/state/client/refer.ts:1 augments lib/state/shared/stores/slots',
            'lib/ui/bare.d.ts:1 augments lib/state/client/context'
        ]);
    });

    it('is named for a reference directive with preserve before its path', () => {
        const dir = plant({
            ...BASE,
            'lib/state/client/kept.ts':
                '/// <reference preserve="true" path="../shared/stores/slots.ts" />\nexport const k = 1;\n'
        });
        expect(findAugments(dir, 'lib/')).toEqual([
            'lib/state/client/kept.ts:1 augments lib/state/shared/stores/slots'
        ]);
    });

    it('is named for a reference directive with resolution-mode before its path', () => {
        const dir = plant({
            ...BASE,
            'lib/ui/mode.d.ts':
                '/// <reference resolution-mode="import" path="../state/client/context.ts" />\n'
        });
        expect(findAugments(dir, 'lib/')).toEqual([
            'lib/ui/mode.d.ts:1 augments lib/state/client/context'
        ]);
    });

    it('is not read in a comment that names a block', () => {
        const dir = plant({
            ...BASE,
            'lib/state/client/said.ts':
                "// declare module '../shared/stores/slots.ts' { interface Slots {} }\n/* declare module '$lib/state/client/context' */\nexport const s = 1;\n"
        });
        // A comment adds nothing to any module, so there is nothing to name.
        expect(findAugments(dir, 'lib/')).toEqual([]);
    });

    it('leaves a block that adds to a package', () => {
        const dir = plant({
            ...BASE,
            'lib/languages.d.ts':
                "declare module 'highlight.js/lib/languages/*' {\n    const language: unknown;\n    export default language;\n}\n",
            'lib/state/client/pkg.ts': "export {};\ndeclare module 'some-package' {}\n"
        });
        // A package is no module of the tree, and augmenting one ties no two modules of it.
        expect(findAugments(dir, 'lib/')).toEqual([]);
    });
});
