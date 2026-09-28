// Layer 4, test. Every comment line of the tree ends by the hundredth column, the width the
// formatter holds code to (.prettierrc's printWidth). The formatter leaves comments as they are
// written, so a comment written past the width, or rewrapped after an edit, stays past it unless
// this finds it.
//
// Two kinds of line are left as they are, since no wrap can make them fit or a wrap would break
// them: a line holding a word too long to fit beside its own comment marker (a path, an address),
// and a line a tool reads as one line: an `eslint-disable` or `eslint-enable`, a `prettier-ignore`,
// a `svelte-ignore`, a `@ts-expect-error`.

import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { commentLines } from './code.ts';

const ENGINE = resolve(fileURLToPath(import.meta.url), '..', '..', '..', '..');

/** The width a line may reach. */
export const WIDTH = 100;

/** The source files whose comments are read. */
const SOURCE = /\.(ts|js|mjs|svelte|sh|css)$/;

/** A line a tool reads whole, which a wrap would cut. */
const WHOLE = /eslint-disable|eslint-enable|prettier-ignore|svelte-ignore|@ts-expect-error/;

/** Whether a long line can be wrapped: no word of it is too long to fit beside its marker. */
export function wrappable(line: string): boolean {
    const marker = /^\s*(\/\/|\/\*\*?|\*|#|<!--)?\s*/.exec(line)?.[0].length ?? 0;
    return line
        .slice(marker)
        .split(/\s+/)
        .every((word) => marker + word.length <= WIDTH);
}

/** Every comment line of one file past the width that a wrap could bring inside it. */
export function tooWide(name: string, text: string): number[] {
    const lines = text.split('\n');
    return commentLines(name, text).filter((at) => {
        const line = lines[at - 1];
        return line.length > WIDTH && !WHOLE.test(line) && wrappable(line);
    });
}

function walk(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) return walk(path);
        return SOURCE.test(entry.name) ? [path] : [];
    });
}

describe('a comment line', () => {
    it('ends by the hundredth column everywhere under src, tests and bin', () => {
        const found = ['src', 'tests', 'bin'].flatMap((top) =>
            walk(join(ENGINE, top)).flatMap((file) =>
                tooWide(file, readFileSync(file, 'utf8')).map(
                    (at) => `${relative(ENGINE, file)}:${at}`
                )
            )
        );
        expect(found).toEqual([]);
    });

    it('is found in each language the tree is written in', () => {
        const long = `${'word '.repeat(22)}end`;
        expect(tooWide('a.ts', `const a = 1;\n// ${long}\n`)).toEqual([2]);
        expect(tooWide('a.ts', `/**\n * ${long}\n */\n`)).toEqual([2]);
        expect(tooWide('a.css', `a {\n    /* ${long} */\n}\n`)).toEqual([2]);
        expect(tooWide('a.sh', `x=1\n# ${long}\n`)).toEqual([2]);
        expect(
            tooWide('a.svelte', `<!-- ${long} -->\n<script>\n    // ${long}\n</script>\n`)
        ).toEqual([1, 3]);
        // A string as long is code, and a word that could not fit is no fault of the wrap.
        expect(tooWide('a.ts', `const a = '${long}';\n`)).toEqual([]);
        expect(tooWide('a.ts', `// ${'x'.repeat(120)}\n`)).toEqual([]);
    });
});
