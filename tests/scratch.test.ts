// Layer 4, test. The scratch helper hands back a directory inside the system temporary directory and
// the sweep takes it away, no test file makes one any other way, and every suite that reaches the
// helper registers the sweep with its own runner.
//
// The last two are what keep a run from leaving directories behind: a file that calls mkdtempSync
// itself, or one that takes a directory from the helper and registers no sweep, has nothing to
// remove what it made, and the count over the temporary directory only says so after both suites
// have run, which is minutes. These say so in a second.
//
// Both read code and not prose: comments and string literals are blanked before a registration or a
// call is looked for, and the helper, which declares the sweep without registering one, never counts
// as a file's registration.

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { scratchDir, scratchMade, sweepScratch } from './scratch.ts';

afterAll(sweepScratch);

const TESTS = resolve(fileURLToPath(import.meta.url), '..');

/** The two files that may call mkdtempSync, and why each one may. */
const OWN = [
    'scratch.ts',
    // The browser layer's server is a process of its own, with no vitest hook to sweep in; it
    // removes its copy through removeOnExit and sweeps an older run's copies before it starts.
    'browser/serve.ts'
];

/** Every file under a tests root, as a path relative to it. */
function testFiles(root = TESTS, prefix = ''): string[] {
    const found: string[] = [];
    for (const entry of readdirSync(join(root, prefix), { withFileTypes: true })) {
        const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
        if (entry.isDirectory()) found.push(...testFiles(root, rel));
        else if (entry.name.endsWith('.ts')) found.push(rel);
    }
    return found;
}

/**
 * The calls this looks for, built rather than written out.
 *
 * Written out they would be in this file too, and the scan would name the file doing the scanning.
 * A directory is taken by `mkdtempSync`, by its promise form, or by making one at a path built from
 * the system temporary directory, and all three leave one behind.
 */
const CALLS = [
    ['mkdtempSync', '('].join(''),
    ['mkdtemp', '('].join(''),
    ['mkdirSync', '('].join('')
];

/** What names the system temporary directory, which a path made under it is built from. */
const TEMP = ['tmpdir', '('].join('');

/** A file that takes a directory from the helper, with what it imports and what it registers. */
type Held = { imports: string[]; registers: boolean; registersAt: number; callsAt: number };

/**
 * The text with its comments blanked, line for line.
 *
 * A rule read from a file is read from its code: a comment naming `afterAll(sweepScratch)` is prose
 * about the sweep, not a sweep, and counting it makes the guard answer true for every file.
 */
export function withoutComments(text: string): string {
    return text
        .replace(/\/\*[\s\S]*?\*\//g, (one) => one.replace(/[^\n]/g, ' '))
        .replace(
            /(^|[^:])\/\/[^\n]*/g,
            (one, head: string) => head + ' '.repeat(one.length - head.length)
        );
}

/** The same with every string literal blanked, for a rule a name inside a string must not satisfy. */
export function codeOnly(text: string): string {
    return withoutComments(text).replace(
        /'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g,
        (one) => one[0] + one.slice(1, -1).replace(/[^\n]/g, ' ') + one[one.length - 1]
    );
}

/** Every import of one file: static or dynamic, single-quoted or double, comments left out. */
function importsIn(rel: string, text: string, known: Set<string>): string[] {
    const folder = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '';
    return [...withoutComments(text).matchAll(/(?:from|import)\s*\(?\s*['"](\.[^'"]+)['"]/g)]
        .flatMap((found) => {
            const held = normalize(join(folder, found[1]));
            // A specifier written without its extension names the same file, so the guard follows it
            // rather than losing the chain at a file that imports `../scratch`.
            return [held, `${held}.ts`, normalize(join(held, 'index.ts'))];
        })
        .filter((one) => known.has(one));
}

/**
 * The line a file registers its sweep on, and the line it first takes a directory at module scope.
 *
 * Read from code alone: a comment or a string holding the words of a registration is not one.
 */
function shapeOf(text: string): { registersAt: number; callsAt: number } {
    const lines = codeOnly(text).split('\n');
    let registersAt = -1;
    let callsAt = -1;
    for (let at = 0; at < lines.length; at += 1) {
        const line = lines[at];
        if (registersAt === -1 && /(afterAll|process\.on)\([^)]*sweepScratch/.test(line)) {
            registersAt = at;
        }
        if (
            callsAt === -1 &&
            /^(?:export )?(?:const|let|var)?\s*\w*\s*=?\s*scratchDir\(/.test(line)
        ) {
            callsAt = at;
        }
    }
    return { registersAt, callsAt };
}

/**
 * Every file under tests/ that takes a directory from the helper and cannot be sure of sweeping it.
 *
 * Three shapes fail. A suite whose own file and whose imports register nothing has nobody to sweep
 * it. A file no suite imports, a probe run by hand, has no runner to sweep it and must register its
 * own. A file that takes a directory at module scope before its registration line leaves it behind
 * when a module-scope statement after the call throws, since the hook was never reached.
 */
export function findUnswept(root = TESTS): string[] {
    const all = testFiles(root);
    const known = new Set(all);
    const held = new Map<string, Held>();
    for (const rel of all) {
        const text = readFileSync(join(root, rel), 'utf8');
        const shape = shapeOf(text);
        held.set(rel, {
            imports: importsIn(rel, text, known),
            registers: shape.registersAt !== -1,
            registersAt: shape.registersAt,
            callsAt: shape.callsAt
        });
    }
    const reaches = new Set(['scratch.ts']);
    for (let pass = 0; pass < 6; pass += 1) {
        for (const rel of all) {
            if (reaches.has(rel)) continue;
            if ((held.get(rel) ?? { imports: [] }).imports.some((one) => reaches.has(one))) {
                reaches.add(rel);
            }
        }
    }
    // The helper declares the sweep and registers none: a file that imports it is not swept by it.
    const swept = (rel: string, seen = new Set<string>()): boolean => {
        if (seen.has(rel) || rel === 'scratch.ts') return false;
        seen.add(rel);
        const one = held.get(rel);
        if (one === undefined) return false;
        if (one.registers) return true;
        return one.imports.some((under) => swept(under, seen));
    };
    const imported = new Set<string>();
    for (const rel of all) {
        if (!/\.(test|spec)\.ts$/.test(rel)) continue;
        const walk = (name: string, seen = new Set<string>()): void => {
            for (const under of held.get(name)?.imports ?? []) {
                if (seen.has(under)) continue;
                seen.add(under);
                imported.add(under);
                walk(under, seen);
            }
        };
        walk(rel);
    }
    const found: string[] = [];
    for (const rel of [...reaches].sort()) {
        if (rel === 'scratch.ts') continue;
        const one = held.get(rel);
        if (one === undefined) continue;
        const suite = /\.(test|spec)\.ts$/.test(rel);
        if (suite && !swept(rel)) {
            found.push(`tests/${rel} takes a scratch directory and registers no sweep`);
            continue;
        }
        if (!suite && !imported.has(rel) && !one.registers) {
            found.push(
                `tests/${rel} takes a scratch directory, no suite imports it, and it sweeps none`
            );
            continue;
        }
        if (one.callsAt !== -1 && one.registersAt > one.callsAt) {
            found.push(
                `tests/${rel} takes a scratch directory at module scope before it registers the sweep`
            );
        }
    }
    return found;
}

/** Every file that makes a temporary directory without the helper that sweeps it. */
export function findOwnScratch(allow: string[] = OWN, root = TESTS): string[] {
    const found: string[] = [];
    for (const rel of testFiles(root)) {
        if (allow.includes(rel)) continue;
        const bare = codeOnly(readFileSync(join(root, rel), 'utf8'));
        // `mkdtempSync` names a scratch directory wherever it is written. The other two name one
        // only where the path is built from the system temporary directory on that same line: a
        // `mkdirSync` under a directory the helper already swept is not a directory of its own.
        const takes =
            bare.includes(CALLS[0]) ||
            bare
                .split('\n')
                .some(
                    (line) =>
                        (line.includes(CALLS[1]) || line.includes(CALLS[2])) && line.includes(TEMP)
                );
        if (!takes) continue;
        found.push(`tests/${rel} makes a temporary directory of its own`);
    }
    return found.sort();
}

describe('a scratch directory', () => {
    it('is made inside the temporary directory and swept away again', () => {
        // revert: tests/scratch.ts:30 => return;
        const dir = scratchDir('oculus-scratch-case-');
        expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        expect(scratchMade()).toContain(dir);
        sweepScratch();
        expect(existsSync(dir)).toBe(false);
        expect(scratchMade()).toEqual([]);
    });

    it('is the only way a test file makes one', () => {
        // revert: tests/scratch.test.ts:205 => if (false) continue;
        expect(findOwnScratch()).toEqual([]);
    });

    it('is swept by every file under tests that takes one', () => {
        // revert: tests/scratch.test.ts:160 => if (one.registers) return false;
        expect(findUnswept()).toEqual([]);
    });

    it('reads a registration from code, never from a comment or a string', () => {
        // revert: tests/scratch.test.ts:105 => const lines = text.split('\\n');
        const dir = scratchDir('oculus-prose-');
        const write = (rel: string, body: string) => {
            const full = join(dir, rel);
            expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
            mkdirSync(dirname(full), { recursive: true });
            writeFileSync(full, body, 'utf8');
        };
        // The helper's own head comment names the registration the suites make, as this tree's does.
        write(
            'scratch.ts',
            [
                '// A suite calls afterAll(sweepScratch) to have its directories taken away.',
                'export function scratchDir() {}',
                'export function sweepScratch() {}',
                ''
            ].join('\n')
        );
        write(
            'quiet.test.ts',
            [
                "import { scratchDir } from './scratch.ts';",
                "const held = 'afterAll(sweepScratch)';",
                "it('takes one and sweeps none', () => {",
                "    scratchDir('x-');",
                '});',
                ''
            ].join('\n')
        );
        expect(findUnswept(dir)).toEqual([
            'tests/quiet.test.ts takes a scratch directory and registers no sweep'
        ]);
        expect(shapeOf('// afterAll(sweepScratch) in prose\n').registersAt).toBe(-1);
        expect(shapeOf("const held = 'afterAll(sweepScratch)';\n").registersAt).toBe(-1);
        expect(shapeOf('afterAll(sweepScratch);\n').registersAt).toBe(0);
    });

    it('catches the three shapes in a tree of its own', () => {
        // revert: tests/scratch.test.ts:182 => if (suite && false) {
        const dir = scratchDir('oculus-unswept-');
        const write = (rel: string, body: string) => {
            const full = join(dir, rel);
            expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
            mkdirSync(dirname(full), { recursive: true });
            writeFileSync(full, body, 'utf8');
        };
        write('scratch.ts', 'export function scratchDir() {}\n');
        write(
            'dynamic.test.ts',
            "const helper = await import('./scratch.ts');\nhelper.scratchDir('x-');\n"
        );
        write('probe.ts', 'import { scratchDir } from "./scratch.ts";\nscratchDir("x-");\n');
        write(
            'late.test.ts',
            [
                "import { scratchDir, sweepScratch } from './scratch.ts';",
                "const held = scratchDir('x-');",
                'afterAll(sweepScratch);',
                ''
            ].join('\n')
        );
        write(
            'early.test.ts',
            [
                "import { scratchDir, sweepScratch } from './scratch.ts';",
                'afterAll(sweepScratch);',
                "const held = scratchDir('x-');",
                ''
            ].join('\n')
        );
        expect(findUnswept(dir)).toEqual([
            'tests/dynamic.test.ts takes a scratch directory and registers no sweep',
            'tests/late.test.ts takes a scratch directory at module scope before it registers the sweep',
            'tests/probe.ts takes a scratch directory, no suite imports it, and it sweeps none'
        ]);
    });

    it('catches a suite, a hand-run file and a module-scope call that sweep nothing', () => {
        // revert: tests/scratch.test.ts:110 => if (registersAt === -1 && false) {
        const plain = "import { scratchDir } from '../scratch.ts';\n";
        expect(shapeOf(plain).registersAt).toBe(-1);
        expect(shapeOf('const held = scratchDir("x-");\n').callsAt).toBe(0);
        expect(shapeOf('afterAll(sweepScratch);\nconst held = scratchDir("x-");\n')).toEqual({
            registersAt: 0,
            callsAt: 1
        });
        expect(shapeOf('const held = scratchDir("x-");\nafterAll(sweepScratch);\n')).toEqual({
            registersAt: 1,
            callsAt: 0
        });
        expect(shapeOf("process.on('exit', sweepScratch);\n").registersAt).toBe(0);
    });

    it('reads a dynamic import and a double-quoted one as reaching the helper', () => {
        // revert: tests/scratch.test.ts:89 => return [...text.matchAll(/from '(\.[^']+)'/g)]
        const known = new Set(['scratch.ts', 'one.test.ts']);
        expect(importsIn('one.test.ts', "import { x } from '../one.test.ts';", known)).toEqual([]);
        expect(importsIn('one.test.ts', "import { x } from './scratch.ts';", known)).toEqual([
            'scratch.ts'
        ]);
        expect(importsIn('one.test.ts', 'import { x } from "./scratch.ts";', known)).toEqual([
            'scratch.ts'
        ]);
        expect(importsIn('one.test.ts', "const x = await import('./scratch.ts');", known)).toEqual([
            'scratch.ts'
        ]);
    });

    it('catches a file that makes one of its own', () => {
        // revert: tests/scratch.test.ts:219 => `tests/${rel} takes a scratch directory, and that is fine`
        expect(findOwnScratch([])).toEqual([
            'tests/browser/serve.ts makes a temporary directory of its own',
            'tests/scratch.ts makes a temporary directory of its own'
        ]);
    });

    // Revert: in findOwnScratch of tests/scratch.test.ts, look for the one call written by name, and
    // a file that takes its directory the promise way, or by making one at a path it builds from the
    // system temporary directory, is not seen at all.
    it('catches a directory taken the promise way and one made at a path built by hand', () => {
        // revert: tests/scratch.test.ts:210 => const takes = bare.includes(CALLS[0]);
        const dir = scratchDir('oculus-scratch-shapes-');
        expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        mkdirSync(join(dir, 'views'), { recursive: true });
        writeFileSync(
            join(dir, 'views', 'promise.test.ts'),
            [
                "import { mkdtemp } from 'node:fs/promises';",
                "import { tmpdir } from 'node:os';",
                "import { join } from 'node:path';",
                '',
                "it('takes one', async () => {",
                "    await mkdtemp(join(tmpdir(), 'oculus-planted-'));",
                '});',
                ''
            ].join('\n'),
            'utf8'
        );
        writeFileSync(
            join(dir, 'views', 'byhand.test.ts'),
            [
                "import { mkdirSync } from 'node:fs';",
                "import { tmpdir } from 'node:os';",
                "import { join } from 'node:path';",
                '',
                "it('takes one', () => {",
                "    mkdirSync(join(tmpdir(), 'oculus-planted-by-hand'), { recursive: true });",
                '});',
                ''
            ].join('\n'),
            'utf8'
        );
        // A directory made under a folder the helper already swept is not one of the file's own.
        writeFileSync(
            join(dir, 'views', 'inside.test.ts'),
            [
                "import { mkdirSync } from 'node:fs';",
                "import { join } from 'node:path';",
                "import { scratchDir } from '../scratch.ts';",
                '',
                "it('makes a folder inside the one it was given', () => {",
                "    mkdirSync(join(scratchDir('oculus-inside-'), 'under'), { recursive: true });",
                '});',
                ''
            ].join('\n'),
            'utf8'
        );
        expect(findOwnScratch([], dir)).toEqual([
            'tests/views/byhand.test.ts makes a temporary directory of its own',
            'tests/views/promise.test.ts makes a temporary directory of its own'
        ]);
    });
});
