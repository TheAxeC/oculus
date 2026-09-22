// Layer 4, test. An assertion that something is absent, with nothing saying what makes the absence
// right, is how a defect gets written down as the expected result.
//
// Every case under tests/views/ and tests/browser/ is read for the four shapes an absence is
// asserted in: `.not.toContain(`, `.not.toHaveAttribute(`, `.not.toBeVisible(` and
// `toHaveCount(0)`. Each one needs a comment directly above it saying why the thing is not there,
// so that a reader meets the reason beside the assertion rather than reconstructing it from the
// view; a comment of several lines is read as one reason.
//
// A comment that restates the assertion is refused: it may not carry the literal the assertion
// names, counting a literal of eight characters or more, since that is a selector, an attribute or
// a catalog key rather than an English word, and it is at least four words long. What it cannot
// tell is a sentence that reads as a reason and says nothing about the fixture; that is the
// reader's.
//
// Every file under those two folders carries a reason above each absence it asserts. The entries in
// allow-negatives.ts are the exception, the absences of two files another step is holding open;
// each entry stands for one absence and is keyed on what that absence asserts, so explaining one
// buys no room for another, and an entry goes when its absence gains its reason.

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { NEGATIVES } from './allow-negatives.ts';
import { isReason, literalsIn } from '../../fixtures/reason.ts';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

afterAll(sweepScratch);

const TESTS = resolve(fileURLToPath(import.meta.url), '..', '..', '..');

/** The four ways a case says a thing is not there. */
const ABSENCE = /\.not\.toContain\(|\.not\.toHaveAttribute\(|\.not\.toBeVisible\(|toHaveCount\(0\)/;

/** Whether a line is a comment line, in either comment shape. */
function commentLine(line: string): boolean {
    const text = line.trim();
    return text.startsWith('//') || text.startsWith('*') || text.startsWith('/*');
}

/** Whether the comment above an absence carries a reason for it, by the rule in reason.ts. */
export function explains(comment: string, assertion = ''): boolean {
    const lines = comment.split('\n');
    if (!lines.every(commentLine)) return false;
    const text = lines
        .map((line) =>
            line
                .trim()
                .replace(/^\/\*+|^\/\/|^\*/, '')
                .replace(/\*\/$/, '')
                .trim()
        )
        .join(' ');
    return isReason(text, assertion);
}

/**
 * The comment directly above a line, its lines in order, so a reason written over two lines is read
 * whole; the empty string when the line above is no comment.
 */
export function commentAbove(lines: string[], at: number): string {
    let from = at;
    while (from > 0 && commentLine(lines[from - 1])) from -= 1;
    return lines.slice(from, at).join('\n');
}

/** Every test file under a folder, as paths relative to the root the folder sits in. */
function testFiles(root: string, folder: string): string[] {
    const found: string[] = [];
    for (const entry of readdirSync(join(root, folder), { withFileTypes: true })) {
        const rel = `${folder}/${entry.name}`;
        if (entry.isDirectory()) found.push(...testFiles(root, rel));
        else if (/\.(test|spec)\.ts$/.test(entry.name)) found.push(rel);
    }
    return found;
}

/**
 * The key one absence stands under: the literals it names, or the assertion's own text for one that
 * names none, so that no two absences of a file share a key and explaining one frees nothing.
 */
export function absenceKey(line: string): string {
    const named = literalsIn(line).join(' | ');
    return named === '' ? line.trim().replace(/\s+/g, ' ') : named;
}

/** The absences a file asserts with no reason above them, each under the key it stands on. */
export function bareAbsences(root: string, folders: string[]): Record<string, string[]> {
    const found: Record<string, string[]> = {};
    for (const folder of folders) {
        for (const rel of testFiles(root, folder)) {
            const lines = readFileSync(join(root, rel), 'utf8').split('\n');
            for (let at = 0; at < lines.length; at += 1) {
                if (!ABSENCE.test(lines[at])) continue;
                if (explains(commentAbove(lines, at), lines[at])) continue;
                found[rel] = [...(found[rel] ?? []), absenceKey(lines[at])];
            }
        }
    }
    return found;
}

/**
 * Every absence the allow list does not already hold an entry for.
 *
 * An entry stands for one absence and is keyed on what that absence asserts, so explaining one does
 * not leave room for a new one and a brand-new absence has nothing to stand under. An assertion
 * naming no literal long enough to key on stands under its own text, so two such absences of one
 * file are still told apart.
 */
export function findGrowth(
    root: string,
    folders: string[],
    allow: Record<string, string[]> = NEGATIVES
): string[] {
    const found: string[] = [];
    for (const [rel, keys] of Object.entries(bareAbsences(root, folders))) {
        const left = [...(allow[rel] ?? [])];
        for (const key of keys) {
            const at = left.indexOf(key);
            if (at === -1) {
                found.push(`${rel} asserts an absence with no reason: ${key}`);
                continue;
            }
            left.splice(at, 1);
        }
        for (const stale of left) {
            found.push(`${rel} lists an absence that is not there any more: ${stale}`);
        }
    }
    const held = bareAbsences(root, folders);
    for (const rel of Object.keys(allow)) {
        if (!(rel in held)) {
            found.push(`${rel} carries no bare absence at all, so it comes off the list`);
        }
    }
    return found.sort();
}

const made: string[] = [];

afterEach(() => {
    for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** A scratch tree holding one spec file, checked to be inside the temporary directory. */
function scratch(body: string): string {
    const dir = scratchDir('oculus-negatives-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    made.push(dir);
    mkdirSync(join(dir, 'views'), { recursive: true });
    writeFileSync(join(dir, 'views', 'planted.test.ts'), body, 'utf8');
    return dir;
}

describe('an absence asserted with no reason', () => {
    it('is held to the counts the tree had when the check landed', () => {
        // revert: tests/checks/tree/allow-negatives.ts:13 => delete
        expect(findGrowth(TESTS, ['views', 'browser'])).toEqual([]);
    });

    it('catches each of the four shapes', () => {
        // revert: tests/checks/tree/negatives.test.ts:35 => const ABSENCE = /\.not\.toContain\(/;
        const dir = scratch(
            [
                "it('draws none of it', () => {",
                "    expect(body).not.toContain('data-open');",
                "    expect(row).not.toHaveAttribute('aria-current');",
                '    expect(page.locator(".card")).not.toBeVisible();',
                '    expect(page.locator(".row")).toHaveCount(0);',
                '});'
            ].join('\n')
        );
        expect(findGrowth(dir, ['views'], {})).toEqual([
            'views/planted.test.ts asserts an absence with no reason: aria-current',
            'views/planted.test.ts asserts an absence with no reason: data-open',
            'views/planted.test.ts asserts an absence with no reason: expect(page.locator(".card")).not.toBeVisible();',
            'views/planted.test.ts asserts an absence with no reason: expect(page.locator(".row")).toHaveCount(0);'
        ]);
    });

    it('passes an absence whose reason stands above it, in either comment shape', () => {
        // revert: tests/checks/tree/negatives.test.ts:46 => return false;
        const dir = scratch(
            [
                "it('draws none of it', () => {",
                '    // the control is drawn only for a project with a deposit',
                "    expect(body).not.toContain('data-open');",
                '    /* the row is current only while the pane holds focus */',
                "    expect(row).not.toHaveAttribute('aria-current');",
                '});'
            ].join('\n')
        );
        expect(findGrowth(dir, ['views'], {})).toEqual([]);
    });

    it('refuses a comment that restates the assertion, and one too short to say anything', () => {
        // revert: tests/fixtures/reason.ts:50 => if (words.length < 0) return false;
        const dir = scratch(
            [
                "it('draws none of it', () => {",
                '    // no data-open here',
                "    expect(body).not.toContain('data-open');",
                '    // nor here',
                "    expect(row).not.toHaveAttribute('aria-current');",
                '});'
            ].join('\n')
        );
        expect(findGrowth(dir, ['views'], {})).toEqual([
            'views/planted.test.ts asserts an absence with no reason: aria-current',
            'views/planted.test.ts asserts an absence with no reason: data-open'
        ]);
        expect(
            explains(
                '// the control is drawn for a project with a deposit',
                "not.toContain('data-open')"
            )
        ).toBe(true);
        expect(explains('// no data-open is drawn at all here', "not.toContain('data-open')")).toBe(
            false
        );
        expect(explains('// it is closed', "not.toContain('data-open')")).toBe(false);
        expect(literalsIn("not.toContain('data-open')")).toEqual(['data-open']);
        expect(literalsIn("not.toContain('tab')")).toEqual([]);
    });

    it('reads the literals of a line holding two strings, and not the gap between them', () => {
        // revert: tests/fixtures/reason.ts:31 => if (held.length >= 8) found.push(text.slice(at + 1, end - 1));
        const line =
            "await expect(page.getByRole('tab', { name: 'literature-radar.yml' })).toHaveCount(0);";
        expect(literalsIn(line)).toEqual(['literature-radar.yml']);
        expect(explains('// literature-radar.yml is not open here', line)).toBe(false);
        expect(explains('// the tab was closed before this ran', line)).toBe(true);
        const dir = scratch(
            [
                "it('draws none of it', () => {",
                '    // literature-radar.yml is not open here',
                `    ${line}`,
                '});'
            ].join('\n')
        );
        expect(findGrowth(dir, ['views'], {})).toEqual([
            'views/planted.test.ts asserts an absence with no reason: literature-radar.yml'
        ]);
    });

    it('holds one entry for one absence, so explaining one buys no room for another', () => {
        // revert: tests/checks/tree/negatives.test.ts:127 => left.push(key);
        const dir = scratch(
            [
                "it('draws none of it', () => {",
                "    expect(body).not.toContain('data-first');",
                "    expect(body).not.toContain('data-second');",
                '});'
            ].join('\n')
        );
        const listed = { 'views/planted.test.ts': ['data-first', 'data-second'] };
        expect(findGrowth(dir, ['views'], listed)).toEqual([]);
        expect(findGrowth(dir, ['views'], { 'views/planted.test.ts': ['data-first'] })).toEqual([
            'views/planted.test.ts asserts an absence with no reason: data-second'
        ]);
        // The same absence twice needs two entries: one explained does not leave room for a new
        // one.
        const twice = scratch(
            [
                "it('draws none of it', () => {",
                "    expect(body).not.toContain('data-first');",
                "    expect(body).not.toContain('data-first');",
                '});'
            ].join('\n')
        );
        expect(findGrowth(twice, ['views'], { 'views/planted.test.ts': ['data-first'] })).toEqual([
            'views/planted.test.ts asserts an absence with no reason: data-first'
        ]);
    });

    // revert: tests/checks/tree/negatives.test.ts:75 => found[rel] = [...(found[rel] ?? []), literalsIn(lines[at]).join(' | ')];
    // Revert: in bareAbsences of tests/checks/tree/negatives.test.ts, key an absence naming no
    // literal on the empty string, and two of them in one file become interchangeable: explaining
    // one frees the slot the other new one fills.
    it('tells two absences apart when neither names a literal to key on', () => {
        // revert: tests/checks/tree/negatives.test.ts:98 => found[rel] = [...(found[rel] ?? []), ''];
        const dir = scratch(
            [
                "it('draws none of it', () => {",
                '    expect(page.locator(".row")).toHaveCount(0);',
                '    expect(page.locator(".card")).not.toBeVisible();',
                '});'
            ].join('\n')
        );
        const both = {
            'views/planted.test.ts': [
                'expect(page.locator(".row")).toHaveCount(0);',
                'expect(page.locator(".card")).not.toBeVisible();'
            ]
        };
        expect(findGrowth(dir, ['views'], both)).toEqual([]);
        // The reader explains the row one and asserts a new card one: the list must not absorb it.
        const one = { 'views/planted.test.ts': ['expect(page.locator(".row")).toHaveCount(0);'] };
        expect(findGrowth(dir, ['views'], one)).toEqual([
            'views/planted.test.ts asserts an absence with no reason: expect(page.locator(".card")).not.toBeVisible();'
        ]);
    });

    // Revert: in findGrowth of tests/checks/tree/negatives.test.ts, say nothing about an entry no
    // absence stands under, and the list keeps a line for an absence that gained its reason long
    // ago.
    it('says when an entry stands for an absence that is not there any more', () => {
        // revert: tests/checks/tree/negatives.test.ts:130 => found.push('');
        const dir = scratch(
            [
                "it('draws none of it', () => {",
                '    // the control is drawn only for a project with a deposit',
                "    expect(body).not.toContain('data-first');",
                "    expect(body).not.toContain('data-second');",
                '});'
            ].join('\n')
        );
        expect(
            findGrowth(dir, ['views'], { 'views/planted.test.ts': ['data-first', 'data-second'] })
        ).toEqual([
            'views/planted.test.ts lists an absence that is not there any more: data-first'
        ]);
    });

    it('holds the allow list to files the tree still has', () => {
        // revert: tests/checks/tree/negatives.test.ts:75 => delete
        const held = new Set([...testFiles(TESTS, 'views'), ...testFiles(TESTS, 'browser')]);
        expect(Object.keys(NEGATIVES).filter((rel) => !held.has(rel))).toEqual([]);
    });

    it('reads a reason written over two lines as one', () => {
        // revert: tests/checks/tree/negatives.test.ts:65 => delete
        const lines = [
            '    // the tab was closed before this ran, so what it drew',
            '    // is gone',
            "    expect(body).not.toContain('data-open');"
        ];
        expect(explains(commentAbove(lines, 2), lines[2])).toBe(true);
        // A reason cut to its last line says too little to count.
        expect(explains(lines[1], lines[2])).toBe(false);
    });
});
