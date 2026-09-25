// Layer 4, test. No module under src imports itself through a chain of other modules at run time.
//
// A cycle of runtime imports makes the order the modules load in depend on which one is asked for
// first, and a module whose value another reads during its own load then reads it before it is
// set. graph.ts reads every module of src and every runtime import it makes; the first case holds
// the tree to none, and the case after it plants a cycle in a scratch tree and shows the check
// names its modules in the order the imports run.

import { tmpdir } from 'node:os';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { findCycles, importGraph } from './graph.ts';
import { plantScratch, sweepScratch } from '../../fixtures/scratch.ts';

afterAll(sweepScratch);

const SRC = resolve(fileURLToPath(import.meta.url), '..', '..', '..', '..', 'src');

/** A scratch tree of the given files, checked to be inside the temporary directory. */
function plant(files: Record<string, string>): string {
    const dir = plantScratch('oculus-cycles-', files);
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    return dir;
}

describe('the runtime import graph of src', () => {
    // revert: src/lib/data/sources/config/local.ts:15 => import { configDir } from './folder.ts'; import './merge.ts';
    // revert: src/lib/state/boards/focus-lanes.ts:6 => import { numericSetting } from '../workbench/rail-badges.ts';
    it('holds no cycle', () => {
        // Every cycle the tree had was broken by moving what its two sides shared to a module
        // both may import, so the list of cycles is empty, and a new one is named here.
        expect(findCycles(importGraph(SRC, 'lib/'))).toEqual([]);
    });

    // revert: tests/checks/imports/graph.ts:80 => if (false) continue;
    // revert: tests/checks/imports/graph.ts:184 => for (const to of [...next(module)].reverse()) {
    it('names the modules of a planted cycle in order, and passes a type-only import back', () => {
        // A component importing itself draws itself recursively and is no cycle between modules.
        // The first module of the cycle imports two modules that both lead back to it, and the walk
        // takes the first by name, so the same tree always names the cycle the same way.
        const dir = plant({
            'lib/a.ts':
                "import { b } from './b.ts';\nimport { g } from './g.ts';\nexport const a = b + g;\n",
            'lib/g.ts': "import { a } from './a.ts';\nexport const g = 1;\n",
            'lib/b.ts': "import { c } from '$lib/c';\nexport const b = c;\n",
            'lib/c.ts': "import { a } from './a.ts';\nexport const c = 1;\n",
            'lib/d.ts': "import { e } from './e.ts';\nexport const d = e;\n",
            'lib/e.ts': "import type { d } from './d.ts';\nexport const e = 1;\n",
            'lib/f.svelte': "<script>\n    import { f } from './f.svelte';\n</script>\n"
        });
        expect(findCycles(importGraph(dir, 'lib/'))).toEqual([
            'lib/a.ts -> lib/b.ts -> lib/c.ts -> lib/a.ts'
        ]);
    });
});
