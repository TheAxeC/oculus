// Source audit. A comment says what the code does and why, never when it was written, which package
// or session wrote it, what bug came before it or what was reverted, and a document says what the
// tool is and does. Every comment line under src, tests, utils and config, every line of a text
// file there, and every line of the three documents, is read and matched against the migration
// plan's id vocabulary, a date and the session phrases below; every hit is printed with its file
// and line, so a failure names the lines to rewrite rather than only the count of them.
//
// This file holds the vocabulary it searches for, so it excludes itself by the marker below rather
// than by its name: a rename keeps the audit working and keeps it from reporting its own data.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { commentText } from './code.ts';
import { treeFiles } from '../walk.ts';

const ROOTS = ['src', 'tests', 'utils', 'config'];

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

/** Every file under a folder, as paths from where the folder was named, in name order. */
function files(at: string): string[] {
    return treeFiles(at).map((rel) => join(at, rel));
}

/**
 * The prose of each line of a file, by line: every line of a text file whole, the comment of a YAML
 * line (a `#` opening the line or following a space), and for a file of code the comment text the
 * code reader finds on the line, trailing comments included and code and strings left out.
 */
function proseLines(file: string, source: string): string[] {
    const lines = source.split('\n');
    if (file.endsWith('.txt')) return lines;
    if (file.endsWith('.yml')) {
        return lines.map((line) =>
            line.trimStart().startsWith('#') || line.includes(' # ') ? line : ''
        );
    }
    return commentText(file, source).split('\n');
}

/**
 * Every comment line under the roots naming a package id, a date or a session, as
 * `file:line: text`.
 */
function commentHits(base = '.'): string[] {
    const found: string[] = [];
    for (const root of ROOTS) {
        if (!existsSync(join(base, root))) continue;
        for (const full of files(join(base, root))) {
            const file = relative(base, full);
            const source = readFileSync(full, 'utf8');
            if (source.includes(MARKER)) continue;
            const lines = source.split('\n');
            proseLines(file, source).forEach((prose, index) => {
                if (HISTORY.test(prose)) found.push(`${file}:${index + 1}: ${lines[index].trim()}`);
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
    // Every file under the four roots is parsed, which takes longer than a case's default limit.
    it('names no package id, date or session in any comment', { timeout: 30000 }, () => {
        expect(commentHits().join('\n')).toBe('');
    });

    it('names no package id, date or session in any document', () => {
        expect(documentHits().join('\n')).toBe('');
    });

    // Revert: in proseLines of tests/checks/source/history.test.ts, read a code line only when it
    // opens with its comment (commentLines), and the trailing comments of src/trail.ts and
    // utils/trail.sh go unread; read a code line whole, and src/url.ts and
    // src/quartile.ts are hits.
    it('reads every line of a text file and every comment of code, trailing ones included', () => {
        const dir = scratchDir('oculus-history-');
        const plant = (rel: string, body: string): void => {
            const full = join(dir, rel);
            expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
            mkdirSync(dirname(full), { recursive: true });
            writeFileSync(full, body, 'utf8');
        };
        plant('tests/list.txt', 'a.ts b.ts the clone the split of Q51 made\n');
        plant('utils/run.sh', '#!/bin/sh\n# written for D22\necho "#D22 is data"\n');
        plant('config/keys.yml', 'key: 1 # kept since 2026-09-10\n');
        plant('src/url.ts', "const url = 'http://x/Q12';\n");
        plant('src/trail.ts', 'const a = 1; // written for Q12\n');
        plant('src/quartile.ts', 'const Q1 = 1;\n/*\n * kept until\n * the split of Q51\n */\n');
        plant('src/Page.svelte', '<!-- drawn for O17 -->\n<p>{x /* since Q3 */}</p>\n');
        plant('src/app.html', '<html>\n<!-- the page of D19c -->\n</html>\n');
        plant('utils/trail.sh', 'x=1 # Q12\n');
        expect(commentHits(dir)).toEqual([
            'src/Page.svelte:1: <!-- drawn for O17 -->',
            'src/Page.svelte:2: <p>{x /* since Q3 */}</p>',
            'src/app.html:2: <!-- the page of D19c -->',
            'src/quartile.ts:4: * the split of Q51',
            'src/trail.ts:1: const a = 1; // written for Q12',
            'tests/list.txt:1: a.ts b.ts the clone the split of Q51 made',
            'utils/run.sh:2: # written for D22',
            'utils/trail.sh:1: x=1 # Q12',
            'config/keys.yml:1: key: 1 # kept since 2026-09-10'
        ]);
    });
});
