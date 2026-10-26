// Layer 2, server tests. Save to Literature (server/edit/feeds/literature.ts) over a Literature
// file in a temporary hub, never the hub's own: the citation key it makes from the authors, the
// year and the title, the paper it refuses as one the file holds already, and the file it leaves,
// which is the file as it was with one entry added under `entries:` (G8).

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { parse } from 'yaml';
import { describe, expect } from 'vitest';
import { saveLiterature } from '../../../src/lib/server/edit/feeds/literature.ts';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { words } from '../../../src/lib/server/core/words.ts';
import type { PortfolioConfig } from '../../../src/lib/data/model/index.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

/** The head of the Literature file every case starts from, its schema the hub's. */
const HEAD = `title: Literature
schema:
  - { field: key,      type: text,     primary_key: true, required: true }
  - { field: title,    type: text,     display: 1, required: true }
  - { field: authors,  type: tags }
  - { field: venue,    type: text }
  - { field: year,     type: text }
  - { field: doi,      type: text }
  - { field: url,      type: text }
  - { field: abstract, type: textarea }
  - { field: source,   type: select,   options: [search, lit-watch, hand] }
  - { field: added,    type: date }
`;

/** The paper most cases save. */
const PAPER = {
    title: 'Block-term tensor regression for ECoG',
    authors: ['John Smith', 'Marc M. Van Hulle'],
    year: 2024,
    doi: '10.1016/j.neucom.2024.127654'
};

/** The checkout's configuration, read once: its `collections:` names the Literature file. */
let base: PortfolioConfig | undefined;

/** A hub holding a Literature file with the given entries, the file under the hub. */
function fixture(entries = 'entries: []\n'): {
    hub: string;
    config: PortfolioConfig;
    file: string;
} {
    base ??= portfolioConfigFrom(loadConfig(engineDir()).config);
    const hub = scratchDir('oculus-literature-');
    const file = join(hub, '.oculus', 'data', 'literature', 'literature.yml');
    expect(resolve(file).startsWith(resolve(hub) + sep)).toBe(true);
    mkdirSync(join(file, '..'), { recursive: true });
    writeFileSync(file, HEAD + entries);
    return { hub, config: base, file };
}

/** The entries of the file as it reads now. */
function entriesOf(file: string): Record<string, unknown>[] {
    return (parse(readFileSync(file, 'utf8')) as { entries: Record<string, unknown>[] }).entries;
}

/** The title of the rows whose first author is written with "et al.". */
const CERTIFIED = 'Certified robustness of tensor networks';

/**
 * The key rule: the authors, the year and the title a paper carries, and the key it gets. Authors
 * are a list or one line of names, as a feed sends them (G110).
 */
const KEY_ROWS: { authors: string | string[]; year?: number; title: string; key: string }[] = [
    {
        authors: ['John Smith', 'Marc M. Van Hulle'],
        year: 2024,
        title: PAPER.title,
        key: 'smith2024blockterm'
    },
    { authors: ['Faes A'], year: 2024, title: PAPER.title, key: 'faes2024blockterm' },
    { authors: ['Smith, John'], year: 2024, title: PAPER.title, key: 'smith2024blockterm' },
    { authors: ['Marc M. Van Hulle'], year: 2023, title: 'Tensor', key: 'vanhulle2023tensor' },
    { authors: ['Van Hulle MM'], year: 2023, title: 'Tensor', key: 'vanhulle2023tensor' },
    { authors: ['Khanh Dao Duc'], year: 2026, title: 'Optimal', key: 'duc2026optimal' },
    {
        authors: ['J\u00fcrgen M\u00fcller'],
        year: 2025,
        title: '\u00dcber tensors',
        key: 'muller2025uber'
    },
    { authors: [], title: 'Tensor', key: 'anonndtensor' },
    { authors: 'M. Osei et al.', year: 2026, title: CERTIFIED, key: 'osei2026certified' },
    { authors: 'M. Osei et al', year: 2026, title: CERTIFIED, key: 'osei2026certified' },
    { authors: 'M. Osei ET AL.', year: 2026, title: CERTIFIED, key: 'osei2026certified' },
    { authors: ['Osei M.', 'et al.'], year: 2026, title: CERTIFIED, key: 'osei2026certified' },
    { authors: ['Osei M.'], year: 2026, title: CERTIFIED, key: 'osei2026certified' },
    { authors: ['Van Hulle M.M.'], year: 2023, title: 'Tensor', key: 'vanhulle2023tensor' },
    { authors: ['et al.'], year: 2026, title: CERTIFIED, key: 'anon2026certified' },
    { authors: 'Osei, M., et al.', year: 2026, title: CERTIFIED, key: 'osei2026certified' },
    { authors: 'Marc M. Van Hulle', year: 2023, title: 'Tensor', key: 'vanhulle2023tensor' }
];

describe('Save to Literature', () => {
    it.each(KEY_ROWS)('keys the paper of $authors as $key', (row) => {
        const { hub, config, file } = fixture();
        const paper = {
            title: row.title,
            authors: row.authors,
            ...(row.year === undefined ? {} : { year: row.year })
        };
        const outcome = saveLiterature(hub, config, undefined, 'search', paper);
        expect(outcome.refused).toEqual([]);
        expect(outcome.id).toBe(row.key);
        expect(entriesOf(file).map((one) => one.key)).toEqual([row.key]);
    });

    it('adds the entry under entries and leaves every byte before it as it was', () => {
        const { hub, config, file } = fixture();
        const outcome = saveLiterature(hub, config, undefined, 'search', PAPER);
        expect(outcome.changed).toEqual(['entries']);
        const text = readFileSync(file, 'utf8');
        expect(text.startsWith(HEAD)).toBe(true);
        expect(entriesOf(file)).toEqual([
            expect.objectContaining({
                key: 'smith2024blockterm',
                title: PAPER.title,
                authors: PAPER.authors,
                year: 2024,
                doi: PAPER.doi,
                url: `https://doi.org/${PAPER.doi}`,
                source: 'search'
            })
        ]);
    });

    it('adds b and then c to a key the file holds', () => {
        const { hub, config, file } = fixture();
        for (const doi of ['10.1000/one', '10.1000/two', '10.1000/three']) {
            saveLiterature(hub, config, undefined, 'search', { ...PAPER, doi });
        }
        expect(entriesOf(file).map((one) => one.key)).toEqual([
            'smith2024blockterm',
            'smith2024blocktermb',
            'smith2024blocktermc'
        ]);
    });

    it.each([
        ['in capitals', '10.1016/J.NEUCOM.2024.127654'],
        ['as a doi.org address', 'https://doi.org/10.1016/j.neucom.2024.127654'],
        ['as a dx.doi.org address', 'http://dx.doi.org/10.1016/j.neucom.2024.127654']
    ])('refuses a paper whose DOI the file holds, written %s, and writes nothing', (_name, doi) => {
        const { hub, config, file } = fixture();
        saveLiterature(hub, config, undefined, 'search', PAPER);
        const held = readFileSync(file, 'utf8');
        const outcome = saveLiterature(hub, config, undefined, 'lit-watch', {
            ...PAPER,
            title: 'Another',
            doi
        });
        expect(outcome.changed).toEqual([]);
        expect(outcome.refused).toEqual([
            { field: 'title', reason: words(config.text, 'server.literature.paper_in_file') }
        ]);
        expect(readFileSync(file, 'utf8')).toBe(held);
    });

    it('refuses a paper with no DOI whose title the file holds, compared by its letters and digits', () => {
        const { hub, config, file } = fixture();
        saveLiterature(hub, config, undefined, 'search', PAPER);
        const held = readFileSync(file, 'utf8');
        const outcome = saveLiterature(hub, config, undefined, 'lit-watch', {
            title: 'Block-Term Tensor Regression, for ECoG.',
            authors: ['John Smith']
        });
        expect(outcome.refused).toEqual([
            { field: 'title', reason: words(config.text, 'server.literature.paper_in_file') }
        ]);
        expect(readFileSync(file, 'utf8')).toBe(held);
    });

    it('takes a paper whose DOI differs though its title is the same, as a second paper', () => {
        const { hub, config, file } = fixture();
        saveLiterature(hub, config, undefined, 'search', PAPER);
        const outcome = saveLiterature(hub, config, undefined, 'search', {
            ...PAPER,
            doi: '10.1000/other'
        });
        expect(outcome.refused).toEqual([]);
        expect(entriesOf(file).map((one) => one.key)).toEqual([
            'smith2024blockterm',
            'smith2024blocktermb'
        ]);
    });
});
