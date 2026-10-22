// Source audit. A comment says what the code does and why, never when it was written, which package
// or session wrote it, what bug came before it or what was reverted, and a document says what the
// tool is and does. Every comment line under src, tests, utils and config, every line of a text
// file there, and every line of the documents (docs/HELP.md, README.md and the Apps guide,
// docs/apps.md) is read and matched against the migration plan's id vocabulary, a date and the
// session phrases below; every hit is printed with its file and line, so a failure names the lines
// to rewrite rather than only the count of them.
//
// This file holds the vocabulary it searches for, so it excludes itself by the marker below rather
// than by its name: a rename keeps the audit working and keeps it from reporting its own data.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { commentText } from './code.ts';
import { treeFiles } from '../walk.ts';

const ROOTS = ['src', 'tests', 'utils', 'config'];

/**
 * The document at the root, read whole: every line is prose a reader takes as the tool's present.
 */
const DOCS = ['README.md'];

/** The folder holding the Apps guide and any other Markdown document, each read whole as well. */
const GUIDES = 'docs';

/**
 * The folder of the answers the Recover source readers' tests replay: data a server sent, read as
 * no prose by its path.
 */
const ANSWERS = 'tests/server/machine/runs/recover/answers/';

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
 * The prose of each line of a file, by line: every line of a text file whole (a list, a Markdown
 * page or a LaTeX source of a fixture hub), the comment of a YAML line (a `#` opening the line or
 * following a space), for a file of code the comment text the code reader finds on the line,
 * trailing comments included and code and strings left out, and nothing for a recorded web answer
 * (a `.body` or `.headers` file under ANSWERS), which is data a server sent and holds no prose of
 * the tree. `file` is the path from the tree's root.
 */
function proseLines(file: string, source: string): string[] {
    const lines = source.split('\n');
    if (/\.(txt|md|tex)$/.test(file)) return lines;
    if (file.split(sep).join('/').startsWith(ANSWERS) && /\.(body|headers)$/.test(file)) {
        return lines.map(() => '');
    }
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

/** The documents of a tree: the README at its root and every Markdown file under its `docs/`. */
function documentsOf(base: string): string[] {
    const folder = join(base, GUIDES);
    const guides = existsSync(folder)
        ? readdirSync(folder)
              .filter((name) => name.endsWith('.md'))
              .sort()
              .map((name) => join(GUIDES, name))
        : [];
    return [...DOCS, ...guides];
}

/** Every line of the documents naming a package id, a date or a session. */
function documentHits(base = '.'): string[] {
    const found: string[] = [];
    for (const doc of documentsOf(base)) {
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

    // The planted tree tells apart a code line read whole from one read only for its comment: the
    // trailing comments of src/trail.ts and utils/trail.sh are hits, while the url of src/url.ts
    // and the code `const Q1` of src/quartile.ts are not (its block comment is a hit). A Markdown
    // page under tests/ is read whole like a list. A recorded web answer under tests/ is data and
    // no hit, whatever it holds. A document under docs/ holding an id is a hit of the documents.
    it('reads every line of a text file, every document and every comment of code', () => {
        const dir = scratchDir('oculus-history-');
        const plant = (rel: string, body: string): void => {
            const full = join(dir, rel);
            expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
            mkdirSync(dirname(full), { recursive: true });
            writeFileSync(full, body, 'utf8');
        };
        plant('tests/list.txt', 'a.ts b.ts the clone the split of Q51 made\n');
        plant('tests/hub/README.md', 'A hub of synthetic data, set up for D22.\n');
        plant('utils/run.sh', '#!/bin/sh\n# written for D22\necho "#D22 is data"\n');
        plant('config/keys.yml', 'key: 1 # kept since 2026-09-10\n');
        plant('src/url.ts', "const url = 'http://x/Q12';\n");
        plant('src/trail.ts', 'const a = 1; // written for Q12\n');
        plant('src/quartile.ts', 'const Q1 = 1;\n/*\n * kept until\n * the split of Q51\n */\n');
        plant('src/Page.svelte', '<!-- drawn for O17 -->\n<p>{x /* since Q3 */}</p>\n');
        plant('src/app.html', '<html>\n<!-- the page of D19c -->\n</html>\n');
        plant('utils/trail.sh', 'x=1 # Q12\n');
        plant('docs/x.md', 'the guide kept for Q51\n');
        plant(`${ANSWERS}zenodo/x.body`, '{"updated": "2026-01-01", "id": "Q12"}\n');
        plant(`${ANSWERS}zenodo/x.headers`, 'HTTP/2 200\nlast-modified: 2026-01-01\n');
        expect(commentHits(dir)).toEqual([
            'src/Page.svelte:1: <!-- drawn for O17 -->',
            'src/Page.svelte:2: <p>{x /* since Q3 */}</p>',
            'src/app.html:2: <!-- the page of D19c -->',
            'src/quartile.ts:4: * the split of Q51',
            'src/trail.ts:1: const a = 1; // written for Q12',
            'tests/hub/README.md:1: A hub of synthetic data, set up for D22.',
            'tests/list.txt:1: a.ts b.ts the clone the split of Q51 made',
            'utils/run.sh:2: # written for D22',
            'utils/trail.sh:1: x=1 # Q12',
            'config/keys.yml:1: key: 1 # kept since 2026-09-10'
        ]);
        expect(documentHits(dir)).toEqual(['docs/x.md:1: the guide kept for Q51']);
    });

    // Only the folder of the recorded answers is read as data. A `.body` or `.headers` file
    // anywhere else has no reader, so the audit stops on it rather than passing it unread.
    it.each(['tests/answers/x.body', 'tests/answers/x.headers', 'src/x.body'])(
        'stops on a recorded answer outside the answers folder: %s',
        (rel) => {
            const dir = scratchDir('oculus-history-');
            const full = join(dir, rel);
            expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
            mkdirSync(dirname(full), { recursive: true });
            writeFileSync(full, 'HTTP/2 200\n', 'utf8');
            expect(() => commentHits(dir)).toThrow('no reader is known for its language');
        }
    );
});
