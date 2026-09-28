// The reader every diagram parses a source file through, bin/diagrams/parsed.mjs's parseReader().
//
// The parsers it calls, importsOf() and codeOf(), are wrapped in counters that call the real ones,
// so a case sees how often a file was parsed as well as what the parse gave. The cases show that a
// path asked twice with the same text is computed once and gives the same result object, that a new
// text for the path is parsed again and gives the new file's result, that two readers over one
// cache share their parses, and that a reader made without a cache keeps one of its own. Those
// texts are small modules held here. That the generator reads every diagram through one reader is
// shown over the engine by tests/checks/diagrams/diagrams.test.ts.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { codeOf } from '../../../bin/diagrams/code.mjs';
import { importsOf } from '../../../bin/diagrams/imports.mjs';
import { parseReader } from '../../../bin/diagrams/parsed.mjs';

vi.mock('../../../bin/diagrams/imports.mjs', async (original) =>
    (await import('./counted.ts')).counted(await original<Record<string, unknown>>(), 'importsOf')
);

vi.mock('../../../bin/diagrams/code.mjs', async (original) =>
    (await import('./counted.ts')).counted(await original<Record<string, unknown>>(), 'codeOf')
);

const PATH = 'lib/ui/one.ts';
const FIRST = "import { a } from './a.ts'; // the first\nexport const one = a;\n";
const SECOND = "import { b } from './b.ts'; // the second\nexport const one = b;\n";

beforeEach(() => {
    vi.mocked(importsOf).mockClear();
    vi.mocked(codeOf).mockClear();
});

describe('the parse reader', () => {
    it('parses a path asked twice with the same text once, and gives the same result', () => {
        const read = parseReader();
        const imports = read.imports(PATH, FIRST);
        const code = read.code(PATH, FIRST);
        expect(imports.map((one) => one.spec)).toEqual(['./a.ts']);
        expect(code).not.toContain('the first');
        expect(read.imports(PATH, FIRST)).toBe(imports);
        expect(read.code(PATH, FIRST)).toBe(code);
        expect(importsOf).toHaveBeenCalledTimes(1);
        expect(codeOf).toHaveBeenCalledTimes(1);
    });

    it('parses a path again when the text given differs, and gives the new file', () => {
        const read = parseReader();
        read.imports(PATH, FIRST);
        read.code(PATH, FIRST);
        expect(read.imports(PATH, SECOND).map((one) => one.spec)).toEqual(['./b.ts']);
        expect(read.code(PATH, SECOND)).toBe(codeOf(PATH, SECOND));
        expect(read.code(PATH, SECOND)).toContain('export const one = b;');
        expect(importsOf).toHaveBeenCalledTimes(2);
    });

    it('shares its parses with another reader over the same cache', () => {
        const cache = new Map();
        const first = parseReader(cache);
        const imports = first.imports(PATH, FIRST);
        const code = first.code(PATH, FIRST);
        const second = parseReader(cache);
        expect(second.imports(PATH, FIRST)).toBe(imports);
        expect(second.code(PATH, FIRST)).toBe(code);
        expect(importsOf).toHaveBeenCalledTimes(1);
        expect(codeOf).toHaveBeenCalledTimes(1);
        expect([...cache.keys()]).toEqual([PATH]);
    });

    it('keeps a cache of its own when it is given none', () => {
        const first = parseReader();
        const imports = first.imports(PATH, FIRST);
        const second = parseReader();
        expect(second.imports(PATH, FIRST)).not.toBe(imports);
        expect(second.imports(PATH, FIRST)).toEqual(imports);
        expect(first.imports(PATH, FIRST)).toBe(imports);
        expect(importsOf).toHaveBeenCalledTimes(2);
    });
});
