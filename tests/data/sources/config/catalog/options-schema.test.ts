// Layer 1, data tests. The schema the options catalog gives the `collections:` list, as the schema
// check reads a file against it: oculus's config/defaults/sources.yml and a hub's
// .oculus/config.yml each a list of entries, and an entry's `ticker:` one record of a category word
// of `ticker_categories` and an undated toggle (`holds: record` in config/options/sources.yml). A
// ticker that is a text, names a word that is no category, or holds an undated that is no toggle
// is a problem on the line that writes it, in the engine's file and in the hub's alike. Oculus's
// own sources.yml passes, which config-folder.test.ts holds for every file of the folder, and so
// does the .oculus/config.yml Make Folder a Hub writes from docs/templates.md (`hubConfigText`).
// A reader row's constant `value`, a scalar (`control: scalar` in config/options/behavior.yml),
// takes a text with holes, a number and a flag and refuses a record and a list, in oculus's
// behavior.yml and in a hub's .oculus/config.yml alike.

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
