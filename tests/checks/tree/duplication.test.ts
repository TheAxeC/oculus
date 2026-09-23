// Layer 4, test. A rule, a parser or a fold written a second time instead of reused.
//
// Every file under src/lib is read against every other, and every file under tests against every
// other. Comments, blank lines, import statements and a component's style block are dropped and
// whitespace is normalised, so a copy survives a reflow and a renamed comment while a shared import
// list and a repeated CSS rule, neither of which is a rule written twice, are not counted; a window
// of eight or more of the lines that are left, identical in two files, is a copy one of the two
// should be importing.
//
// The two groups are kept apart because a helper a test shares with the code it covers is not a
// copy: the test reaches the module. DELIBERATE names the pairs that share on purpose, each with
// its reason; HELD is what the tree already shared when the check landed, so that a pair added from
// now on fails.

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { readFileSync as readAllow } from 'node:fs';
import { createHash } from 'node:crypto';
import { isReason } from '../../fixtures/reason.ts';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

afterAll(sweepScratch);

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..', '..', '..');

/**
 * A clone two files share: the pair, the mark of the lines themselves, and the reason it is listed.
 *
 * The mark is what makes an entry stand for one clone rather than for the pair: two files already
 * on the list cannot grow a second copy under the first one's entry.
 */
export type Pair = { a: string; b: string; mark: string; why: string };

/** The mark of one window: the shortest reading of its lines that two windows cannot share. */
export function markOf(window: string): string {
    return createHash('sha256').update(window).digest('hex').slice(0, 12);
}

/**
 * The pairs that share on purpose, each with the reason the copy belongs where it is.
 *
 * A pair moves here from the floor when the two are meant to hold the same lines; an entry is a
 * decision, and the case over the reasons refuses one written without it.
 */
export const DELIBERATE: Pair[] = [];

/** The floor: the pairs the tree already shared, read from the list beside this file. */
export function readHeld(text: string): Pair[] {
    const found: Pair[] = [];
    for (const line of text.split('\n')) {
        if (line.startsWith('#') || line.trim() === '') continue;
        const part = line.trim().split(/\s+/);
        found.push({
            a: part[0],
            b: part[1] ?? '',
            mark: part[2] ?? '',
            why: part.slice(3).join(' ')
        });
    }
    return found;
}

export const HELD = readHeld(
    readAllow(join(ROOT, 'tests', 'checks', 'tree', 'allow-duplication.txt'), 'utf8')
);

/** The least run of identical lines that is a copy rather than a coincidence of shape. */
const WINDOW = 8;

/** One file's lines that carry code, each with the line number the file holds it at. */
export function meaningful(text: string, dropStyle = false): { at: number; code: string }[] {
    const found: { at: number; code: string }[] = [];
    let inBlock = false;
    let inStyle = false;
    let inImport = false;
    const lines = text.split('\n');
    for (let at = 0; at < lines.length; at += 1) {
        let line = lines[at];
        if (dropStyle) {
            if (line.startsWith('<style')) inStyle = true;
            else if (inStyle && line.startsWith('</style>')) inStyle = false;
            else if (inStyle) continue;
            if (/^<\/?style/.test(line)) continue;
        }
        if (inImport) {
            if (/;\s*$/.test(line)) inImport = false;
            continue;
        }
        if (/^\s*import\b/.test(line)) {
            if (!/;\s*$/.test(line)) inImport = true;
            continue;
        }
        if (inBlock) {
            const ends = line.indexOf('*/');
            if (ends === -1) continue;
            line = line.slice(ends + 2);
            inBlock = false;
        }
        const opens = line.indexOf('/*');
        if (opens !== -1 && !line.includes('*/', opens)) {
            line = line.slice(0, opens);
            inBlock = true;
        }
        const code = line
            .replace(/\/\/.*$/, '')
            .replace(/\s+/g, ' ')
            .trim();
        if (code === '') continue;
        found.push({ at: at + 1, code });
    }
    return found;
}

/** Every file of the given extensions under a root, as paths relative to it. */
export function filesUnder(root: string, prefix = ''): string[] {
    const found: string[] = [];
    for (const entry of readdirSync(join(root, prefix), { withFileTypes: true })) {
        const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
        if (entry.isDirectory()) found.push(...filesUnder(root, rel));
        else if (/\.(ts|svelte)$/.test(entry.name)) found.push(rel);
    }
    return found;
}

/** Whether this clone of this pair is on the allow list, in either order. */
function deliberate(allow: Pair[], a: string, b: string, mark: string): boolean {
    return allow.some(
        (one) => one.mark === mark && ((one.a === a && one.b === b) || (one.a === b && one.b === a))
    );
}

/**
 * Every window of WINDOW lines two files of one group share.
 *
 * A clone longer than the window matches at every offset inside it; only the first offset of a run
 * is reported, so a thirty-line copy is one line of output rather than twenty-three.
 */
export function copies(
    root: string,
    group: string,
    allow: Pair[] = [...DELIBERATE, ...HELD]
): { left: string; leftAt: number; right: string; rightAt: number; mark: string }[] {
    const windows = new Map<string, { file: string; at: number; index: number }[]>();
    for (const rel of filesUnder(root, group)) {
        const lines = meaningful(readFileSync(join(root, rel), 'utf8'), rel.endsWith('.svelte'));
        for (let index = 0; index + WINDOW <= lines.length; index += 1) {
            const key = lines
                .slice(index, index + WINDOW)
                .map((one) => one.code)
                .join('\n');
            const held = windows.get(key) ?? [];
            held.push({ file: rel, at: lines[index].at, index });
            windows.set(key, held);
        }
    }
    const pairs = new Map<
        string,
        { left: string; leftAt: number; right: string; rightAt: number; mark: string }
    >();
    for (const [window, held] of windows) {
        if (held.length < 2) continue;
        const mark = markOf(window);
        for (let one = 0; one < held.length; one += 1) {
            for (let two = one + 1; two < held.length; two += 1) {
                const left = held[one];
                const right = held[two];
                if (left.file === right.file) continue;
                pairs.set(`${left.file}:${left.index}|${right.file}:${right.index}`, {
                    left: left.file,
                    leftAt: left.at,
                    right: right.file,
                    rightAt: right.at,
                    mark
                });
            }
        }
    }
    const found: { left: string; leftAt: number; right: string; rightAt: number; mark: string }[] =
        [];
    // The allow list is read after the run suppression, so what a list silences cannot change which
    // offset of a clone is the one reported.
    for (const [key, pair] of pairs) {
        const [leftPart, rightPart] = key.split('|');
        const leftIndex = Number(leftPart.slice(leftPart.lastIndexOf(':') + 1));
        const rightIndex = Number(rightPart.slice(rightPart.lastIndexOf(':') + 1));
        const before = `${pair.left}:${leftIndex - 1}|${pair.right}:${rightIndex - 1}`;
        if (pairs.has(before)) continue;
        if (deliberate(allow, pair.left, pair.right, pair.mark)) continue;
        found.push(pair);
    }
    return found;
}

/** The copies a group holds, one line each, in a fixed order. */
export function findCopies(root: string, group: string, allow?: Pair[]): string[] {
    return copies(root, group, allow)
        .map(
            (one) =>
                `${one.left}:${one.leftAt} and ${one.right}:${one.rightAt} hold the same ${WINDOW} lines (${one.mark})`
        )
        .sort();
}

/** The file pairs a group shares a window in, whatever the allow list says. */
export function sharedPairs(root: string, group: string): Set<string> {
    const found = new Set<string>();
    for (const one of copies(root, group, [])) found.add(`${one.left}|${one.right}|${one.mark}`);
    return found;
}

const made: string[] = [];

afterEach(() => {
    for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** A scratch tree with the files a case plants, checked to be inside the temporary directory. */
function scratch(files: Record<string, string>): string {
    const dir = scratchDir('oculus-duplication-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    made.push(dir);
    for (const [rel, body] of Object.entries(files)) {
        const full = join(dir, rel);
        expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
        mkdirSync(join(full, '..'), { recursive: true });
        writeFileSync(full, body, 'utf8');
    }
    return dir;
}

/** The mark the fixture's own eight lines carry, so a case names the clone it planted. */
function markOfBlock(): string {
    return markOf(
        meaningful(block())
            .slice(0, WINDOW)
            .map((one) => one.code)
            .join('\n')
    );
}

/** Eight lines of code, numbered so a caller can make a second copy differ in one of them. */
function block(differs = ''): string {
    return [
        'export function fold(rows: string[]): string {',
        '    let held = 0;',
        '    for (const row of rows) {',
        `        held += row.length;${differs}`,
        '    }',
        '    const out = String(held);',
        '    const trimmed = out.trim();',
        '    return trimmed;',
        '}'
    ].join('\n');
}

describe('a rule written twice', () => {
    it('is not held anywhere under src/lib', () => {
        // revert: tests/checks/tree/allow-duplication.txt:12 => delete
        expect(findCopies(ROOT, 'src/lib')).toEqual([]);
    });

    it('is not held anywhere under tests', () => {
        // revert: tests/checks/tree/allow-duplication.txt:119 => delete
        expect(findCopies(ROOT, 'tests')).toEqual([]);
    });

    it('catches a window of eight lines held in two files', () => {
        // revert: tests/checks/tree/duplication.test.ts:71 => const WINDOW = 999;
        const dir = scratch({ 'group/one.ts': block(), 'group/two.ts': block() });
        expect(findCopies(dir, 'group', [])).toEqual([
            `group/one.ts:1 and group/two.ts:1 hold the same 8 lines (${markOfBlock()})`
        ]);
    });

    it('reports a copy longer than the window once, at the line it starts on', () => {
        // revert: tests/checks/tree/duplication.test.ts:190 => delete
        const long = `${block()}\n${block(' held += 1;')}`;
        const dir = scratch({ 'group/one.ts': long, 'group/two.ts': long });
        expect(findCopies(dir, 'group', [])).toEqual([
            `group/one.ts:1 and group/two.ts:1 hold the same 8 lines (${markOfBlock()})`
        ]);
    });

    it('passes two files that differ inside the window, and a copy of seven lines', () => {
        // revert: tests/checks/tree/duplication.test.ts:71 => const WINDOW = 4;
        const differing = scratch({
            'group/one.ts': block(),
            'group/two.ts': block(' held += 1;')
        });
        expect(findCopies(differing, 'group', [])).toEqual([]);
        const seven = block().split('\n').slice(0, 7).join('\n');
        const short = scratch({ 'group/one.ts': seven, 'group/two.ts': seven });
        expect(findCopies(short, 'group', [])).toEqual([]);
    });

    it('drops an import list and a style block before it compares', () => {
        // revert: tests/checks/tree/duplication.test.ts:92 => if (false) {
        const head = [
            "import { join } from 'node:path';",
            "import { tmpdir } from 'node:os';",
            "import { readFileSync } from 'node:fs';",
            "import { readdirSync } from 'node:fs';",
            "import { writeFileSync } from 'node:fs';",
            "import { mkdirSync } from 'node:fs';",
            "import { rmSync } from 'node:fs';",
            "import { resolve } from 'node:path';"
        ].join('\n');
        const style = [
            '<style>',
            '    .row {',
            '        display: flex;',
            '        gap: 1px;',
            '        margin: 0;',
            '        padding: 0;',
            '        border: 0;',
            '    }',
            '</style>'
        ].join('\n');
        const dir = scratch({
            'group/one.svelte': `${head}\n${style}\n${block()}`,
            'group/two.svelte': `${head}\n${style}\n${block(' held += 1;')}`
        });
        expect(findCopies(dir, 'group', [])).toEqual([]);
    });

    it('drops comments and whitespace before it compares, and the allow list silences a pair', () => {
        // revert: tests/checks/tree/duplication.test.ts:107-110 => const code = line;
        const commented = block().replace('let held = 0;', 'let  held  =  0; // the running sum');
        const dir = scratch({ 'group/one.ts': block(), 'group/two.ts': commented });
        expect(findCopies(dir, 'group', [])).toEqual([
            `group/one.ts:1 and group/two.ts:1 hold the same 8 lines (${markOfBlock()})`
        ]);
        const allowed = [
            {
                a: 'group/one.ts',
                b: 'group/two.ts',
                mark: markOfBlock(),
                why: 'the case over the list'
            }
        ];
        expect(findCopies(dir, 'group', allowed)).toEqual([]);
        // A second clone between the same two files is a clone of its own, with a mark of its own.
        const twice = scratch({
            'group/one.ts': `${block()}\nconst gapOne = 1;\n${block(' held += 1;')}`,
            'group/two.ts': `${commented}\nconst gapTwo = 2;\n${block(' held += 1;')}`
        });
        expect(findCopies(twice, 'group', allowed)).toHaveLength(1);
    });

    it('holds every entry of both lists to a reason', () => {
        // revert: tests/checks/tree/duplication.test.ts:60 => why: 'x'
        const bare = [...DELIBERATE, ...HELD].filter((one) => !isReason(one.why));
        expect(bare.map((one) => `${one.a} and ${one.b}`)).toEqual([]);
        expect(readHeld('a.ts b.ts abc123\n')[0].why).toBe('');
        expect(readHeld('a.ts b.ts abc123 they share the fold\n')[0].why).toBe(
            'they share the fold'
        );
        expect(readHeld('a.ts b.ts abc123\n')[0].mark).toBe('abc123');
        expect(isReason('x')).toBe(false);
        expect(isReason('the two fold the same rule')).toBe(true);
    });

    it('holds the lists to pairs that still share, so a repaired copy takes its entry with it', () => {
        // revert: tests/checks/tree/duplication.test.ts:210 => delete
        const sharing = new Set([...sharedPairs(ROOT, 'src/lib'), ...sharedPairs(ROOT, 'tests')]);
        const stale = [...DELIBERATE, ...HELD]
            .filter(
                (one) =>
                    !sharing.has(`${one.a}|${one.b}|${one.mark}`) &&
                    !sharing.has(`${one.b}|${one.a}|${one.mark}`)
            )
            .map((one) => `${one.a} and ${one.b} (${one.mark})`);
        expect(stale).toEqual([]);
    });
});
