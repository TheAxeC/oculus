// Layer 4, test. A case that asserts over source text, a label or a constant is an audit, and a
// case that never draws the component is counted as coverage of nothing.
//
// Every case under tests/views/ is read. A case is coverage when its body reaches a render: either
// it calls render() itself, or it uses a name the file binds to a render, whether that is a helper
// function, a helper's helper, or the variable a beforeEach fills by calling one. Anything else is
// an audit and says so in its name, which is what makes the distinction readable in a run's output.
//
// The scan reads the text of a case; it cannot tell a rendered body that is asserted over from one
// that is fetched and dropped, so it says which cases never render, not which assertions are worth
// making.

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, describe, expect, it } from 'vitest';

import { isReason } from '../../fixtures/reason.ts';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

afterAll(sweepScratch);

const VIEWS = resolve(fileURLToPath(import.meta.url), '..', '..', '..', 'views');

/** A case on the floor list, with the reason it is there. */
export type Audit = { line: string; why: string };

/** The floor: the cases the tree already held, read from the list beside this file. */
export function readAudits(text: string): Audit[] {
    const found: Audit[] = [];
    for (const line of text.split('\n')) {
        if (line.startsWith('#') || line.trim() === '') continue;
        const at = line.indexOf(' | ');
        if (at === -1) {
            found.push({ line: line.trim(), why: '' });
            continue;
        }
        found.push({ line: line.slice(0, at).trim(), why: line.slice(at + 3).trim() });
    }
    return found;
}

const AUDITS = readAudits(
    readFileSync(resolve(fileURLToPath(import.meta.url), '..', 'allow-audits.txt'), 'utf8')
).map((one) => one.line);

const AUDIT_ENTRIES = readAudits(
    readFileSync(resolve(fileURLToPath(import.meta.url), '..', 'allow-audits.txt'), 'utf8')
);

/**
 * A case opens with it( or test(, and its name is the string that follows, on that line or on the
 * one after it, since a long name is written on its own line and a case is not invisible for it.
 */
const CASE =
    /^(\s*)(?:it|test)(?:\.\w+)?\s*\(\s*$|^(\s*)(?:it|test)(?:\.\w+)?\s*\(\s*(['"`])((?:[^'"`\\]|\\.)*)\3/;

/** The name a case written over two lines opens its second line with. */
const NAME = /^\s*(['"`])((?:[^'"`\\]|\\.)*)\1/;

/** A binding the file declares: a function, a const, or a variable a hook assigns. */
const DECLARES = [
    /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
    /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=/,
    /^\s*(\w+)\s*=\s*\S/
];

/** The block a line opens, read to the line its braces and parentheses close on. */
function block(lines: string[], from: number): string[] {
    let depth = 0;
    for (let at = from; at < lines.length; at += 1) {
        for (const ch of lines[at]) {
            if (ch === '{' || ch === '(') depth += 1;
            if (ch === '}' || ch === ')') depth -= 1;
        }
        if (depth <= 0) return lines.slice(from, at + 1);
    }
    return lines.slice(from);
}

/**
 * Whether a body reaches a render, directly or through one of the names already known to.
 *
 * It reads the body as written, so a name inside a string or a comment counts, and a name that is an
 * ordinary word counts wherever the word appears. What that costs is said in the head comment above.
 */
function reaches(body: string, names: Set<string>): boolean {
    if (/\brender\(/.test(body)) return true;
    for (const name of names) {
        if (new RegExp(`\\b${name}\\b`).test(body)) return true;
    }
    return false;
}

/**
 * Every name in a file that stands for a render, starting from the names it already knows do.
 *
 * A helper that renders, a helper that calls such a helper, and the variable a beforeEach fills from
 * one are all the same thing to a case: reading the name is reading a rendering. The passes repeat
 * until nothing new is found, so a chain of helpers is followed however long it is.
 */
export function renderNames(text: string, known: string[] = []): Set<string> {
    const lines = text.split('\n');
    const names = new Set<string>(known);
    for (let pass = 0; pass < 6; pass += 1) {
        const before = names.size;
        for (let at = 0; at < lines.length; at += 1) {
            if (CASE.test(lines[at])) continue;
            for (const pattern of DECLARES) {
                const found = pattern.exec(lines[at]);
                if (found === null) continue;
                if (names.has(found[1])) break;
                if (reaches(block(lines, at).join('\n'), names)) names.add(found[1]);
                break;
            }
        }
        if (names.size === before) break;
    }
    return names;
}

/** Every case in a file, with the lines of its body. */
export function cases(text: string): { name: string; at: number; body: string }[] {
    const lines = text.split('\n');
    const found: { name: string; at: number; body: string }[] = [];
    for (let at = 0; at < lines.length; at += 1) {
        const opens = CASE.exec(lines[at]);
        if (opens === null) continue;
        // A case whose name sits on the next line matched the first arm, which captures no name;
        // the name is then the string that line opens with.
        const next = at + 1 < lines.length ? NAME.exec(lines[at + 1]) : null;
        const named = (opens[4] as string | undefined) ?? next?.[2] ?? '';
        found.push({ name: named, at: at + 1, body: block(lines, at).join('\n') });
    }
    return found;
}

/**
 * The names a file imports from a test helper beside it that stand for a render there. A suite
 * split by concern keeps its render helper in a fixture module the parts share, and a case that
 * calls it reaches a render as surely as one that calls a helper written in its own file.
 */
function importedRenders(root: string, rel: string, text: string): string[] {
    const found: string[] = [];
    for (const one of text.matchAll(/import\s*\{([^}]*)\}\s*from\s*'(\.[^']+\.ts)'/g)) {
        const target = normalize(join(dirname(rel), one[2]));
        if (target.startsWith('..')) continue;
        let helper: string;
        try {
            helper = readFileSync(join(root, target), 'utf8');
        } catch {
            continue;
        }
        const renders = renderNames(helper);
        for (const name of one[1].split(',')) {
            const local =
                name
                    .trim()
                    .split(/\s+as\s+/)
                    .pop() ?? '';
            const own = name
                .trim()
                .split(/\s+as\s+/)[0]
                .replace(/^type\s+/, '');
            if (renders.has(own)) found.push(local);
        }
    }
    return found;
}

/** Every case under a folder and the folders under it, with the file it sits in. */
export function everyCase(
    root: string,
    prefix = ''
): { file: string; name: string; body: string; names: Set<string> }[] {
    const found: { file: string; name: string; body: string; names: Set<string> }[] = [];
    for (const entry of readdirSync(join(root, prefix), { withFileTypes: true })) {
        const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
        if (entry.isDirectory()) {
            found.push(...everyCase(root, rel));
            continue;
        }
        if (!entry.name.endsWith('.test.ts')) continue;
        const text = readFileSync(join(root, rel), 'utf8');
        const names = renderNames(text, importedRenders(root, rel, text));
        for (const one of cases(text))
            found.push({ file: rel, name: one.name, body: one.body, names });
    }
    return found;
}

/** Every case under a folder that never reaches a render and does not say it is an audit. */
export function findAudits(root: string, allow: string[] = AUDITS): string[] {
    const found: string[] = [];
    for (const one of everyCase(root)) {
        if (one.name.startsWith('audits')) continue;
        if (reaches(one.body, one.names)) continue;
        const line = `tests/views/${one.file} :: ${one.name}`;
        if (allow.includes(line)) continue;
        found.push(line);
    }
    return found.sort();
}

const made: string[] = [];

afterEach(() => {
    for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** A scratch folder with the one file a case plants, inside the temporary directory. */
function scratch(body: string, rel = 'planted.test.ts'): string {
    const dir = scratchDir('oculus-audits-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    made.push(dir);
    const full = join(dir, rel);
    expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body, 'utf8');
    return dir;
}

describe('a case that never draws anything', () => {
    it('is named an audit everywhere under tests/views', () => {
        // revert: tests/checks/tree/allow-audits.txt:11 => delete
        expect(findAudits(VIEWS)).toEqual([]);
    });

    it('catches a case that asserts over source text alone', () => {
        // revert: tests/checks/tree/audits.test.ts:201 => delete
        const dir = scratch(
            [
                "const source = readFileSync('src/lib/views/sources/files/Files.svelte', 'utf8');",
                "it('names the control in the markup', () => {",
                "    expect(source).toContain('data-open');",
                '});'
            ].join('\n')
        );
        expect(findAudits(dir, [])).toEqual([
            'tests/views/planted.test.ts :: names the control in the markup'
        ]);
    });

    it('passes a case that renders, one that uses a helper, and one that says it audits', () => {
        // revert: tests/checks/tree/audits.test.ts:66 => delete
        const dir = scratch(
            [
                'function drawn(state) {',
                '    return render(Files, { props: { state } }).body;',
                '}',
                'function withOne(state) {',
                '    return drawn({ ...state, one: true });',
                '}',
                'let body;',
                'beforeEach(() => {',
                '    body = withOne({});',
                '});',
                "it('draws the row', () => {",
                "    expect(body).toContain('row');",
                '});',
                "it('draws the pane', () => {",
                "    expect(render(Files, { props: {} }).body).toContain('pane');",
                '});',
                "it('draws the control', () => {",
                "    expect(withOne({})).toContain('control');",
                '});',
                "it('audits the catalog key the view names', () => {",
                "    expect(catalog['files.open']).toBe('Open');",
                '});'
            ].join('\n')
        );
        expect(findAudits(dir, [])).toEqual([]);
    });

    it('walks a folder under tests/views as well as the files beside it', () => {
        // revert: tests/checks/tree/audits.test.ts:181 => delete
        const dir = scratch(
            [
                "it('names the control in the markup', () => {",
                "    expect(source).toContain('data-open');",
                '});'
            ].join('\n'),
            'under/planted.test.ts'
        );
        expect(findAudits(dir, [])).toEqual([
            'tests/views/under/planted.test.ts :: names the control in the markup'
        ]);
    });

    it('follows a render helper into the fixture beside the file, and only a helper that renders', () => {
        // revert: tests/checks/tree/audits.test.ts:186 => const names = renderNames(text);
        const dir = scratch(
            [
                "import { drawn, labelOf } from './planted-fixture.ts';",
                "it('draws the row', () => {",
                "    expect(drawn({})).toContain('row');",
                '});',
                "it('names the row', () => {",
                "    expect(labelOf('row')).toBe('Row');",
                '});'
            ].join('\n')
        );
        writeFileSync(
            join(dir, 'planted-fixture.ts'),
            [
                'export function drawn(state) {',
                '    return render(Files, { props: { state } }).body;',
                '}',
                'export function labelOf(key) {',
                "    return catalog[key] ?? '';",
                '}'
            ].join('\n'),
            'utf8'
        );
        expect(findAudits(dir, [])).toEqual(['tests/views/planted.test.ts :: names the row']);
    });

    it('holds the allow list to cases the tree still has', () => {
        // revert: tests/checks/tree/audits.test.ts:188 => found.push({ file: rel, name: '', body: one.body, names });
        const held = new Set(
            everyCase(VIEWS).map((one) => `tests/views/${one.file} :: ${one.name}`)
        );
        expect(AUDITS.filter((one) => !held.has(one))).toEqual([]);
    });

    it('holds every entry of the list to a reason', () => {
        // revert: tests/checks/tree/audits.test.ts:36 => found.push({ line: line.trim(), why: 'a reason of four words here' });
        expect(AUDIT_ENTRIES.filter((one) => !isReason(one.why)).map((one) => one.line)).toEqual(
            []
        );
        expect(readAudits('tests/views/one.test.ts :: a case\n')[0].why).toBe('');
        expect(readAudits('one :: a case | asserts over held\n')[0].why).toBe('asserts over held');
        expect(isReason('x')).toBe(false);
    });
});
