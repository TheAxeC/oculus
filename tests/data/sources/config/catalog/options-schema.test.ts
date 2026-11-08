// Layer 1, data tests. The schema the options catalog gives the `collections:` list, as the schema
// check reads a file against it: oculus's config/defaults/sources.yml and a hub's
// .oculus/config.yml each a list of entries, and an entry's `ticker:` one record of a category word
// of `ticker_categories` and an undated toggle (`holds: record` in config/options/sources.yml). A
// ticker that is a text, names a word that is no category, or holds an undated that is no toggle is
// a problem on the line that writes it, in the engine's file and in the hub's alike. Oculus's own
// sources.yml passes, which config-folder.test.ts holds for every file of the folder, and so does
// the .oculus/config.yml Make Folder a Hub writes from docs/templates.md (`hubConfigText`). A
// reader row's constant `value`, a scalar (`control: scalar` in config/options/behavior.yml), takes
// a text with holes, a number and a flag and refuses a record and a list, in oculus's behavior.yml
// and in a hub's .oculus/config.yml alike. A multi whose words the schema holds (a category row's
// `sort` and a `research_audit` value in a hub's .oculus/config.yml, a board's `tier` in oculus's
// layout.yml) takes one of its words alone or a list of them, and a word outside them, alone or in
// a list, is a problem on the line that writes it, as is a text of two words, which the value rule
// reads as one word. A theme's `joined` class in a workspace file's `settings:` takes words
// separated by single spaces, and a doubled space is a problem on its line. A keyed family takes
// the one form its reader takes, in oculus's layout.yml and behavior.yml, a hub's
// .oculus/config.yml and a workspace file's `settings:` alike: one written as a list of rows where
// the file takes a map, or as a map where it takes a list, a reader row's `params` among them, is
// one problem on the line of its first row or key, whose message names the form. A family written
// in the form its reader takes, a hub's word set to null and a hub's row marked `removed: true`
// give no problem. A key/value family with no default (`leads_fit`, `text`) is held to a map: a
// value of it written as a list gives the problem of its value, a text where a list is written, and
// no form problem, and the family written as a list gives the form problem.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { portfolioConfigFrom } from '../../../../../src/lib/data/index.ts';
import { HUB_FILE } from '../../../../../src/lib/data/helpers/hub-names.ts';
import { checkDocument, createChecker } from '../../../../../src/lib/data/snapshot/schema/check.ts';
import { schemaFor } from '../../../../../src/lib/data/snapshot/schema/set.ts';
import { engineDir, loadConfig } from '../../../../../src/lib/data/sources/config.ts';
import {
    collectionTemplates,
    hubConfigText
} from '../../../../../src/lib/data/sources/documents/templates.ts';
import { withOwnSchemas } from '../../../../../src/lib/server/root/watch/build.ts';
import { buildOneHub } from '../../../../fixtures/hubs/hub-build.ts';
import { DEMO_HUB } from '../../../../fixtures/hubs/real-hub.ts';

const { config } = loadConfig(engineDir(), { hub: DEMO_HUB });
const portfolio = portfolioConfigFrom(config);
const checker = createChecker();
const dir = join(engineDir(), 'config');
const { schemas } = buildOneHub(
    DEMO_HUB,
    portfolio,
    1,
    [],
    checker,
    { dir, held: [{ root: 'config', path: '' }] },
    'hub'
);
/** The set the server serves a hub's own files with. */
const hubSchemas = withOwnSchemas(schemas);

/** The problems of a text read against the schema matched to `rel` under `root`, by line. */
function problemsOf(set: typeof schemas, root: string, rel: string, text: string): string[] {
    const name = schemaFor(set, root, rel);
    expect(name).toBeDefined();
    return checkDocument(
        { name: name ?? '', file: rel, text },
        set.texts,
        checker,
        portfolio.text
    ).map((one) => `${one.line ?? 0}: ${one.message}`);
}

/** A `collections:` list of one good entry and, on line 3, the entry whose ticker is `ticker`. */
function listWith(ticker: string): string {
    return [
        'collections:',
        '  - { key: notes, file: .oculus/data/notes.yml, ticker: { category: task, undated: true } }',
        `  - { key: talks, file: .oculus/data/talks.yml, ticker: ${ticker} }`,
        ''
    ].join('\n');
}

const READERS: [string, (text: string) => string[]][] = [
    [
        'config/defaults/sources.yml',
        (text) => problemsOf(schemas, 'config', 'defaults/sources.yml', text)
    ],
    ['a hub .oculus/config.yml', (text) => problemsOf(hubSchemas, 'hub', HUB_FILE, text)]
];

describe('the schema of a collections entry', () => {
    it("passes oculus's own sources.yml", () => {
        const text = readFileSync(join(dir, 'defaults', 'sources.yml'), 'utf8');
        expect(problemsOf(schemas, 'config', 'defaults/sources.yml', text)).toEqual([]);
    });

    it('passes the .oculus/config.yml Make Folder a Hub writes with every collection ticked', () => {
        const page = readFileSync(join(engineDir(), 'docs', 'templates.md'), 'utf8');
        const chosen = collectionTemplates(page);
        expect(chosen.some((one) => one.ticker !== undefined)).toBe(true);
        const text = hubConfigText(page, chosen);
        expect(problemsOf(hubSchemas, 'hub', HUB_FILE, text)).toEqual([]);
    });

    it.each(READERS)('passes a ticker of a category and an undated toggle in %s', (_file, read) => {
        expect(read(listWith('{ category: event }'))).toEqual([]);
    });

    it.each(READERS)(
        'refuses a ticker that is a text, a category no word names and an undated no toggle, each on its line, in %s',
        (_file, read) => {
            const found = ['report', '{ category: nonesuch }', '{ undated: 3 }'].map((ticker) =>
                read(listWith(ticker))
            );
            expect(found).toEqual([
                ['3: collections[1].ticker must be a map, not a string'],
                [
                    '3: collections[1].ticker.category is nonesuch, which is not a key of ticker_categories'
                ],
                ['3: collections[1].ticker.undated must be true or false, not a number']
            ]);
        }
    );
});

/** A `literature.sources` list of one source whose field `oa` is the constant `value`, line 3. */
function sourceWith(value: string): string {
    return [
        'literature:',
        '  sources:',
        `    - { key: mine, name: Mine, format: json, address: 'https://example.org/works', records: items, fields: { oa: { value: ${value} } } }`,
        ''
    ].join('\n');
}

const SOURCE_READERS: [string, (text: string) => string[]][] = [
    [
        'config/defaults/behavior.yml',
        (text) => problemsOf(schemas, 'config', 'defaults/behavior.yml', text)
    ],
    ['a hub .oculus/config.yml', (text) => problemsOf(hubSchemas, 'hub', HUB_FILE, text)]
];

describe("the schema of a reader row's constant value, a scalar", () => {
    it.each(SOURCE_READERS)('takes a text with holes, a number and a flag in %s', (_file, read) => {
        const found = ["'{id} preprint'", '3', '2.5', 'true'].map((value) =>
            read(sourceWith(value))
        );
        expect(found).toEqual([[], [], [], []]);
    });

    it.each(SOURCE_READERS)(
        'refuses a record and a list, each on its line, in %s',
        (_file, read) => {
            const found = ['{ a: 1 }', '[1, 2]'].map((value) =>
                read(sourceWith(value)).map((line) => line.split(' ')[0])
            );
            expect(found).toEqual([['3:'], ['3:']]);
        }
    );
});

/** A hub's `categories:` list of one row whose `sort`, on line 5, is `sort`. */
function categoryWith(sort: string): string {
    return `categories:\n  - key: drafts\n    label: { other: Drafts }\n    color: '#888888'\n    sort: ${sort}\n`;
}

/** A `boards:` map of one board, `mine`, whose `tier`, on line 4, is `tier`. */
function boardWith(tier: string): string {
    return `boards:\n  mine:\n    label: Mine\n    tier: ${tier}\n`;
}

/** A hub's `research_audit:` map whose `skip_tiers`, on line 2, is `tiers`. */
function auditWith(tiers: string): string {
    return `research_audit:\n  skip_tiers: ${tiers}\n`;
}

/** A workspace file whose `settings:` holds one theme whose `class`, on line 7, is `classes`. */
function themeWith(classes: string): string {
    return `folders:\n  - { name: hub, path: . }\nprimary: hub\nsettings:\n  themes:\n    - name: mine\n      class: ${classes}\n`;
}

const inHub = (text: string) => problemsOf(hubSchemas, 'hub', HUB_FILE, text);
const inLayout = (text: string) => problemsOf(schemas, 'config', 'defaults/layout.yml', text);
const inWorkspace = (text: string) =>
    problemsOf(schemas, 'hub', '.oculus/workspaces/mine.yml', text);

/** Each value, the text it is written into and the lines its problems are on, in order. */
const MULTIS: [string, (text: string) => string[], [string, string[]][]][] = [
    ['a list with a word outside the words', inHub, [[categoryWith('[stage, nonsense]'), ['5:']]]],
    ['one text of a word outside the words', inHub, [[categoryWith('nonsense'), ['5:']]]],
    ['one text of one of the words', inHub, [[categoryWith('year'), []]]],
    ['one text of two words', inHub, [[categoryWith("'stage year'"), ['5:']]]],
    ['a list of the words', inHub, [[categoryWith('[year, title]'), []]]],
    [
        "a board's tier in layout.yml",
        inLayout,
        [
            [boardWith('nonsense'), ['4:']],
            [boardWith('research'), []]
        ]
    ],
    [
        'a research_audit value in a hub',
        inHub,
        [
            [auditWith('nonsense'), ['2:']],
            [auditWith('[research, nonsense]'), ['2:']],
            [auditWith('research'), []]
        ]
    ],
    [
        "a theme's joined class in a workspace file",
        inWorkspace,
        [
            [themeWith("'dark contrast'"), []],
            [themeWith("'dark  contrast'"), ['7:']]
        ]
    ]
];

describe('the schema of a multi', () => {
    it.each(MULTIS)('places the problems of %s on their lines', (_case, read, rows) => {
        const found = rows.map(([text]) => read(text).map((line) => line.split(' ')[0]));
        expect(found).toEqual(rows.map(([, lines]) => lines));
    });
});

const inBehavior = (text: string) => problemsOf(schemas, 'config', 'defaults/behavior.yml', text);

/** The line of a problem and the form its message names, "must be a map" or "must be a list". */
function placed(line: string): [string, string | null] {
    return [line.split(' ')[0], /must be a (map|list)/.exec(line)?.[0] ?? null];
}

/** The words of a problem's message for a family that must be a map, or a list. */
const MAP = 'must be a map';
const LIST = 'must be a list';

/**
 * A keyed family as one text writes it, the file it is read in, and the line of each of its
 * problems with the form the problem's message names.
 */
const FAMILIES: [string, (text: string) => string[], string, [string, string | null][]][] = [
    [
        'boards as a list in layout.yml',
        inLayout,
        'boards:\n  - { key: b, label: B }\n',
        [['2:', MAP]]
    ],
    [
        "a reader row's params as a list in behavior.yml",
        inBehavior,
        'literature:\n  sources:\n    - key: x\n      params:\n        - { key: q, value: v }\n',
        [['5:', MAP]]
    ],
    [
        'counts as a list in layout.yml',
        inLayout,
        'counts:\n  - { key: projects, tab: true }\n',
        [['2:', MAP]]
    ],
    [
        'links as a map in behavior.yml',
        inBehavior,
        "links:\n  doi: { address: 'https://doi.org/{id|path}' }\n",
        [['2:', LIST]]
    ],
    [
        'read_limits as a list in behavior.yml',
        inBehavior,
        'read_limits:\n  - { key: next, value: 300 }\n',
        [['2:', MAP]]
    ],
    [
        'collections as a map in a hub',
        inHub,
        'collections:\n  notes: { file: .oculus/data/notes.yml }\n',
        [['2:', LIST]]
    ],
    [
        'counts as a list in a hub',
        inHub,
        'counts:\n  - { key: projects, tab: true }\n',
        [['2:', MAP]]
    ],
    [
        'audit.required_sections as a map in a hub',
        inHub,
        'audit:\n  required_sections:\n    x: { file: README.md, heading: Results, folders: [] }\n',
        [['3:', LIST]]
    ],
    [
        'settings.boards as a list in a workspace file',
        inWorkspace,
        'settings:\n  boards:\n    - { key: b, label: B }\n',
        [['3:', MAP]]
    ],
    ['boards as a map in layout.yml', inLayout, 'boards:\n  b: { label: B }\n', []],
    [
        "a reader row's params as a map in behavior.yml",
        inBehavior,
        'literature:\n  sources:\n    - key: x\n      params: { q: v }\n',
        []
    ],
    ['counts as a map in layout.yml', inLayout, 'counts:\n  projects: { tab: true }\n', []],
    [
        'links as a list in behavior.yml',
        inBehavior,
        "links:\n  - { key: doi, address: 'https://doi.org/{id|path}' }\n",
        []
    ],
    ['read_limits as a map in behavior.yml', inBehavior, 'read_limits:\n  next: 300\n', []],
    [
        'collections as a list in a hub',
        inHub,
        'collections:\n  - { key: notes, file: .oculus/data/notes.yml }\n',
        []
    ],
    ['counts as a map in a hub', inHub, 'counts:\n  projects: { tab: true }\n', []],
    [
        'audit.required_sections as a list in a hub',
        inHub,
        'audit:\n  required_sections:\n    - { file: README.md, heading: Results, key: status.line, folders: [] }\n',
        []
    ],
    [
        'settings.boards as a map in a workspace file',
        inWorkspace,
        'settings:\n  boards:\n    b: { label: B }\n',
        []
    ],
    [
        'stages as a list in a hub',
        inHub,
        'stages:\n  - { key: drafting, label: Drafting }\n',
        [['2:', MAP]]
    ],
    ['categories as a map in a hub', inHub, 'categories:\n  x: { label: X }\n', [['2:', LIST]]],
    [
        'a leads_fit value that is a list in a hub',
        inHub,
        'leads_fit:\n  strong: [a, b]\n',
        [['2:', null]]
    ],
    [
        'leads_fit as a list in a hub',
        inHub,
        'leads_fit:\n  - { key: strong, value: green }\n',
        [['2:', MAP]]
    ],
    [
        'settings.text as a list in a workspace file',
        inWorkspace,
        'settings:\n  text:\n    - { key: a.b, value: x }\n',
        [['3:', MAP]]
    ],
    ["stages taking oculus's word out in a hub", inHub, 'stages:\n  drafting: null\n', []],
    [
        "categories taking oculus's row out in a hub",
        inHub,
        'categories:\n  - { key: x, removed: true }\n',
        []
    ]
];

describe('the schema of a keyed family', () => {
    it.each(FAMILIES)('places the problems of %s on their lines', (_case, read, text, expected) => {
        expect(read(text).map(placed)).toEqual(expected);
    });
});
