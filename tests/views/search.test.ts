// The Search view rendered on the server: the query row, the count line with the time and the cap
// word, the hits grouped by file with their line numbers, and the emboldened match.
//
// Nothing here reaches the endpoint. The answer is put into the instance's own state, which is where
// a run leaves it, so the view is drawn over a fixture exactly as it is drawn over a real answer.

import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import Search from '../../src/lib/views/Search.svelte';
import { hitParts, type SearchAnswer } from '../../src/lib/state/search.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import { noop } from '../doubles.ts';
import type { Instance } from '../../src/lib/state/layout/index.ts';
import { clientContext, createClientState, type ClientState } from '../client.ts';

let client: ClientState;

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));

const instance: Instance = { id: 'search-one', view: 'search', state: {} };

const ANSWER: SearchAnswer = {
    files: [
        {
            root: 'hub',
            path: 'src/one.ts',
            hits: [
                { line: 12, column: 5, length: 6, text: 'the needle here' },
                { line: 40, column: 1, length: 6, text: 'needle again' }
            ]
        },
        {
            root: 'engine',
            path: 'config/two.yml',
            hits: [{ line: 7, column: 3, length: 6, text: '  needle: yes' }]
        }
    ],
    total: 3,
    truncated: false,
    ms: 42,
    failed: []
};

beforeEach(() => {
    client = createClientState();
    client.ui.loadUi({ getItem: () => null, setItem: noop });
    client.entities.receive({
        channel: 'config',
        version: 1,
        payload: { config, text: catalog, findings: [] }
    });
});

/** The view with whatever this case put into the instance's state. */
function drawn(state: Record<string, unknown> = {}): string {
    client.ui.setInstanceState(instance.id, state);
    return render(Search, { context: clientContext(client), props: { instance } }).body;
}

describe('the query row', () => {
    it('draws the box, the root picker with every root and all, and the three toggles', () => {
        const body = drawn({ q: 'needle' });
        expect(body).toContain('What to find');
        expect(body).toContain('Every root');
        expect(body).toContain('>word<');
        expect(body).toContain('>case<');
        expect(body).toContain('>regex<');
        expect(body).toContain('Run this search over the files of the chosen root');
    });

    it('says what a tab that has run nothing is for', () => {
        expect(drawn()).toContain('Type a pattern and press Enter.');
    });

    it('carries the help sentence about finding every reference', () => {
        expect(drawn()).toContain(
            'Finding every reference to a name is this view with the word toggle on'
        );
    });
});

describe('the results', () => {
    it('groups the hits under one heading per file, with the root when the run was over all', () => {
        const body = drawn({ q: 'needle', answer: ANSWER });
        expect(body).toContain('data-search-file="hub:src/one.ts"');
        expect(body).toContain('data-search-file="engine:config/two.yml"');
        expect(body).toContain('src/one.ts (hub)');
        expect(body).toContain('config/two.yml (engine)');
    });

    it('names the file without its root when the run was over one root', () => {
        const body = drawn({ q: 'needle', root: 'hub', answer: ANSWER });
        expect(body).toContain('>src/one.ts<');
        // the run was over one root, so the file is named without it
        expect(body).not.toContain('src/one.ts (hub)');
    });

    it('draws one row per hit, each with its line number', () => {
        const body = drawn({ q: 'needle', answer: ANSWER });
        expect(body).toContain('data-search-hit="src/one.ts:12"');
        expect(body).toContain('data-search-hit="src/one.ts:40"');
        expect(body).toContain('data-search-hit="config/two.yml:7"');
        expect(body).toContain('Open src/one.ts at line 12');
    });

    it('emboldens the match and leaves the rest of the line as it is', () => {
        const body = drawn({ q: 'needle', answer: ANSWER });
        expect(body).toMatch(/the <strong class="match[^"]*">needle<\/strong> here/);
        expect(body).toMatch(/<strong class="match[^"]*">needle<\/strong> again/);
        expect(hitParts(ANSWER.files[0].hits[0])).toEqual({
            before: 'the ',
            match: 'needle',
            after: ' here'
        });
    });

    it('says how many hits, in how many files, and how long it took', () => {
        expect(drawn({ q: 'needle', answer: ANSWER })).toContain('3 hits in 2 files, 42 ms');
    });

    it('says the answer was cut, and says nothing about a cap when it was not', () => {
        const cut = drawn({ q: 'needle', max: 500, answer: { ...ANSWER, truncated: true } });
        expect(cut).toContain('cut at 500');
        // the answer was not cut, so nothing is said about a cap
        expect(drawn({ q: 'needle', answer: ANSWER })).not.toContain('cut at');
    });

    it('says that nothing was found for a run that answered no file', () => {
        const body = drawn({
            q: 'needle',
            answer: { files: [], total: 0, truncated: false, ms: 3, failed: [] }
        });
        expect(body).toContain('Nothing in these files carries that.');
    });

    it('names the roots that answered nothing under the count', () => {
        const body = drawn({
            q: 'needle',
            answer: {
                ...ANSWER,
                failed: [
                    { root: 'cathedra', reason: 'rg: no such file' },
                    { root: 'engine', reason: 'the search timed out' }
                ]
            }
        });
        expect(body).toContain('data-search-failed');
        expect(body).toContain('No answer from cathedra, engine.');
    });

    it('draws no such line when every root answered', () => {
        // every root answered, so there is no failure to name
        expect(drawn({ q: 'needle', answer: ANSWER })).not.toContain('data-search-failed');
    });

    it('draws what the last run failed with instead of results', () => {
        const body = drawn({ q: 'fo(', error: 'error: unclosed group', answer: null });
        expect(body).toContain('error: unclosed group');
    });
});
