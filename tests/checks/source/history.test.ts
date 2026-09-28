// Source audit. A comment says what the code does and why, never when it was written, which package
// or session wrote it, what bug came before it or what was reverted, and a document says what the
// tool is and does. Every comment line under src, tests, bin and config, every line of a text file
// there, and every line of the three documents, is read and matched against the migration plan's id
// vocabulary, a date and the session phrases below; every hit is printed with its file and line, so
// a failure names the lines to rewrite rather than only the count of them.
//
// This file holds the vocabulary it searches for, so it excludes itself by the marker below rather
// than by its name: a rename keeps the audit working and keeps it from reporting its own data.

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { afterAll, describe, expect, it } from 'vitest';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

afterAll(sweepScratch);

const ROOTS = ['src', 'tests', 'bin', 'config'];

/** The documents, read whole: every line of one is prose a reader takes as the tool's present. */
const DOCS = ['HELP.md', 'DESIGN.md', 'README.md'];

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
    'M[0-9]',
    'L[0-9]',
    'K[0-9]',
    'C[0-9]{1,2}',
    'E[0-9]',
    'X[0-9]'
];

/**
 * A date in a comment says when the comment was written. A date that is data (a fixture value, a
 * timestamp a case asserts) sits in code, which this audit does not read; a text file is read
 * whole, so a list under the roots holds no date.
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

/**
 * Whether a line is read as prose: a comment, in the forms the tree writes them in with YAML's and
 * the shell's `#` among them, or any line of a text file, whose every line is a reader's words.
 */
function isComment(line: string, file: string): boolean {
    if (file.endsWith('.txt')) return true;
    if (file.endsWith('.yml') || file.endsWith('.sh')) {
        return line.trimStart().startsWith('#') || line.includes(' # ');
    }
    return (
        line.includes('//') ||
        line.includes('/*') ||
        line.includes('<!--') ||
        line.trimStart().startsWith('*')
    );
}

/**
 * Every comment line under the roots naming a package id, a date or a session, as
 * `file:line: text`. A block comment's continuation lines carry no marker of their own, so the walk
 * keeps whether it is inside a `/*` or `<!--` block and reads those lines as comments too.
 */
function commentHits(base = '.'): string[] {
    const found: string[] = [];
    for (const root of ROOTS) {
        if (!existsSync(join(base, root))) continue;
        for (const full of files(join(base, root))) {
            const file = relative(base, full);
            const source = readFileSync(full, 'utf8');
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
                if ((inside || isComment(line, file)) && HISTORY.test(line)) {
                    found.push(`${file}:${index + 1}: ${line.trim()}`);
                }
            });
        }
    }
    return found;
}

/** Every line of the three documents naming a package id, a date or a session. */
function documentHits(base = '.'): string[] {
    const found: string[] = [];
    for (const doc of DOCS) {
        if (!existsSync(join(base, doc))) continue;
        readFileSync(join(base, doc), 'utf8')
            .split('\n')
            .forEach((line, index) => {
                if (HISTORY.test(line)) found.push(`${doc}:${index + 1}: ${line.trim()}`);
            });
    }
    return found;
}

describe('no history in code', () => {
    it('names no package id, date or session in any comment', () => {
        expect(commentHits().join('\n')).toBe('');
    });

    it('names no package id, date or session in any document', () => {
        expect(documentHits().join('\n')).toBe('');
    });

    it('reads every line of a text file and the comments of a shell script and a YAML file', () => {
        const dir = scratchDir('oculus-history-');
        expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        const plant = (rel: string, body: string): void => {
            const full = join(dir, rel);
            expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
            mkdirSync(dirname(full), { recursive: true });
            writeFileSync(full, body, 'utf8');
        };
        plant('tests/list.txt', 'a.ts b.ts the clone the split of Q51 made\n');
        plant('bin/run.sh', '#!/bin/sh\n# written for D22\necho "#D22 is data"\n');
        plant('config/keys.yml', 'key: 1 # kept since 2026-09-10\n');
        expect(commentHits(dir)).toEqual([
            'tests/list.txt:1: a.ts b.ts the clone the split of Q51 made',
            'bin/run.sh:2: # written for D22',
            'config/keys.yml:1: key: 1 # kept since 2026-09-10'
        ]);
    });
});
