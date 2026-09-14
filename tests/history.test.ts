// Source audit. A comment says what the code does and why, never when it was written, which package
// or session wrote it, what bug came before it or what was reverted. Every comment line under src,
// tests and bin is read and matched against the migration plan's id vocabulary, a date and the
// session phrases below; every hit is printed with its file and line, so a failure names the
// comments to rewrite rather than only the count of them.
//
// This file holds the vocabulary it searches for, so it excludes itself by the marker below rather
// than by its name: a rename keeps the audit working and keeps it from reporting its own data.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOTS = ['src', 'tests', 'bin'];

/** The one file the vocabulary may appear in is the one carrying this word. */
const MARKER = 'oculus-plan-id-audit';

/**
 * The id families of the migration plan under .scratch/migration. An id is a name for a package of
 * that plan and says nothing to a reader of the code, so a comment names the file or the function
 * instead. A family the plan adds later is added here.
 */
const FAMILIES = [
    'O[0-9]{1,2}[a-g]?',
    'Q[0-9]{1,2}[a-b]?',
    'R[0-9]{1,2}',
    'D[0-9]{1,2}[a-c]?',
    'P[0-9]',
    'F1',
    'W[0-9]',
    'H1',
    'S1',
    'X2'
];

/**
 * A date in a comment says when the comment was written. A date that is data (a fixture value, a
 * timestamp a case asserts) sits in code, which this audit does not read.
 */
const DATE = '[0-9]{4}-[0-9]{2}-[0-9]{2}';

/** A comment that dates itself by the conversation it came from rather than by a calendar. */
const SESSIONS = ['this session', 'earlier session'];

// The `Q` family collides with journal quartiles (`Q1` to `Q4`), which are vocabulary of the venue
// registry: a comment about a Q1 venue fails this audit with nothing wrong, and is reworded to say
// "first-quartile" instead.

const HISTORY = new RegExp(
    [
        `(^|[^A-Za-z])(${FAMILIES.join('|')})([^A-Za-z0-9]|$)`,
        DATE,
        ...SESSIONS.map((phrase) => phrase.replace(' ', '\\s'))
    ].join('|')
);

function files(at: string): string[] {
    return readdirSync(at).flatMap((name) => {
        const path = join(at, name);
        return statSync(path).isDirectory() ? files(path) : [path];
    });
}

/** Whether a line carries a comment, in the four forms the tree writes them in. */
function isComment(line: string): boolean {
    return (
        line.includes('//') ||
        line.includes('/*') ||
        line.includes('<!--') ||
        line.trimStart().startsWith('*')
    );
}

/**
 * Every comment line naming a package id, a date or a session, as `file:line: text`. A block
 * comment's continuation lines carry no marker of their own, so the walk keeps whether it is inside
 * a `/*` or `<!--` block and reads those lines as comments too.
 */
function hits(): string[] {
    const found: string[] = [];
    for (const root of ROOTS) {
        for (const file of files(root)) {
            const source = readFileSync(file, 'utf8');
            if (source.includes(MARKER)) continue;
            let open = false;
            source.split('\n').forEach((line, index) => {
                const inside = open;
                if (open && (line.includes('*/') || line.includes('-->'))) open = false;
                else if (
                    !open &&
                    (line.includes('/*') || line.includes('<!--')) &&
                    !line.includes('*/') &&
                    !line.includes('-->')
                ) {
                    open = true;
                }
                if ((inside || isComment(line)) && HISTORY.test(line)) {
                    found.push(`${file}:${index + 1}: ${line.trim()}`);
                }
            });
        }
    }
    return found;
}

describe('no history in code', () => {
    it('names no package id, date or session in any comment', () => {
        expect(hits().join('\n')).toBe('');
    });
});
