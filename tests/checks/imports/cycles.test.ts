// Layer 4, test. No module under src imports itself through a chain of other modules at run time.
//
// A cycle of runtime imports makes the order the modules load in depend on which one is asked for
// first, and a module whose value another reads during its own load then reads it before it is
// set. graph.ts reads every module of src and every runtime import it makes; the first case holds
// the tree to none, and the case after it plants a cycle in a scratch tree and shows the check
// names its modules in the order the imports run. The last cases show the reader parses a module
// rather than matching its text: a comment that says "import", above a type-only import or after
// a division a pattern reader would take for a regular expression, makes no import; a script
// inside an HTML comment of a component is no script; and an `import()` in a component's markup
// is read.

import { tmpdir } from 'node:os';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { findCycles, importGraph, runtimeImports } from './graph.ts';
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

    // revert: tests/checks/imports/graph.ts:65 => if (one.spec === null || one.glob === true) continue;
    // revert: tests/checks/imports/graph.ts:174 => for (const to of [...next(module)].reverse()) {
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

describe('the import reader', () => {
    // revert: bin/diagrams/imports.mjs:146 => const source = parsed(name, code.replace(/\/\/ ?|\/\*|\*\//g, ''));
    it('reads no runtime import out of a comment above a type-only import', () => {
        const dir = plant({
            'lib/p.ts':
                "// the shape is read as an import is.\nimport type { Q } from './q.ts';\nexport const p = 1;\n",
            'lib/q.ts':
                "/* import { p } from './p.ts' */\nimport { p } from './p.ts';\nexport type Q = typeof p;\n",
            'lib/r.svelte':
                "<p>The import of './q.ts' is words.</p>\n<script>\n    // import { p } from './p.ts';\n</script>\n"
        });
        // p reads q's type alone, so q's import of p closes no cycle.
        expect(findCycles(importGraph(dir, 'lib/'))).toEqual([]);
        // p's one import is type-only, and the cycle check reads runtime imports alone.
        expect(importGraph(dir, 'lib/').get('lib/p.ts')).toEqual([]);
        // r's one import sits in a line comment of its script.
        expect(importGraph(dir, 'lib/').get('lib/r.svelte')).toEqual([]);
        expect(
            importGraph(dir, 'lib/')
                .get('lib/q.ts')
                ?.map((one) => one.line)
        ).toEqual([2]);
    });

    // revert: bin/diagrams/imports.mjs:146 => const source = parsed(name, code.replace(/\/\/ ?|\/\*|\*\//g, ''));
    it('reads no import out of a comment after a division a pattern reader would take for a regex', () => {
        const text = [
            "let i = 0; i++ / 2; // import { z } from './zz.ts';",
            "const o = { a: 1 }\n/ 2; // import './after-brace.ts';",
            "import { a } from './a.ts';"
        ].join('\n');
        expect(runtimeImports('x.ts', text).map((one) => [one.spec, one.line])).toEqual([
            ['./a.ts', 4]
        ]);
    });

    // revert: bin/diagrams/imports.mjs:146 => const source = parsed(name, code.replace(/\/\/.*$/gm, ''));
    it('reads the imports after a string, a template and a pattern that hold a quote or two slashes', () => {
        const text = [
            'const s = "it\'s // no comment";',
            "const r = /[//'\"]/; const t = `a ${'b'} // c`;",
            "import { a } from './a.ts';",
            "import { b } from './b.ts';"
        ].join('\n');
        expect(runtimeImports('x.ts', text).map((one) => [one.spec, one.line])).toEqual([
            ['./a.ts', 3],
            ['./b.ts', 4]
        ]);
    });

    // revert: bin/diagrams/imports.mjs:216 => const tree = parse(text.replace(/<!--|-->/g, (mark) => ' '.repeat(mark.length)), { modern: true });
    it('reads no script out of an HTML comment of a component', () => {
        const text =
            "<!-- <script>import { h } from './html-comment.ts';</script> -->\n<p>words</p>\n";
        // The only script there is sits inside an HTML comment, which is no script.
        expect(runtimeImports('lib/A.svelte', text, '', true)).toEqual([]);
    });

    // revert: bin/diagrams/imports.mjs:275 => delete
    it('reads an import() written in the markup of a component', () => {
        const text =
            "<script>\n    import { a } from './a.ts';\n</script>\n{#await import('./markup.svelte') then M}\n    <M.default />\n{/await}\n";
        expect(runtimeImports('lib/A.svelte', text).map((one) => [one.spec, one.line])).toEqual([
            ['./a.ts', 2],
            ['./markup.svelte', 4]
        ]);
    });
});
