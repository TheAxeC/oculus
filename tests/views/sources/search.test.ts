// The Search view rendered on the server: the query row, the count line with the time and the cap
// word, the hits grouped by file with their line numbers, and the emboldened match.
//
// Nothing here reaches the endpoint. The answer is put into the instance's own state, which is
// where a run leaves it, so the view is drawn over a fixture exactly as it is drawn over a real
// answer.

import { render } from 'svelte/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Search from '../../../src/lib/views/sources/search/Search.svelte';
import { hitParts, type SearchAnswer } from '../../../src/lib/state/sources/search/search.ts';
import { createWalk } from '../../../src/lib/state/sources/search/walk.ts';
import { boxKey } from '../../../src/lib/views/sources/search/box-keys.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import { noop } from '../../fixtures/doubles.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';
import { between } from '../shared/pane-parts.ts';

let client: ClientState;

afterEach(() => vi.unstubAllGlobals());

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
                { line: 12, column: 5, length: 6, text: 'the needle here', at: 4 },
                { line: 40, column: 1, length: 6, text: 'needle again', at: 0 }
            ]
        },
        {
            root: 'engine',
            path: 'config/two.yml',
            hits: [{ line: 7, column: 3, length: 6, text: '  needle: yes', at: 2 }]
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
    // An answer is held with the query it was found by; the view draws none without it.
    const ran = { q: 'needle', word: false, case: false, regex: false, under: '' };
    client.ui.setInstanceState(instance.id, state.answer === undefined ? state : { ran, ...state });
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

describe('where the search view puts its controls', () => {
    it('keeps the one icon action, Search, in the header', () => {
        const header = between(drawn({ q: 'needle' }), '<header', '</header>');
        const tools = header.match(/<button[^>]*class="tool[^"]*"[^>]*>/g) ?? [];
        expect(tools.length).toBe(1);
        expect(tools[0]).toMatch(/\bbare\b/);
        expect(tools[0]).toContain('aria-label="Search"');
        expect(header).toContain('data-glyph="search"');
        // the query box is a control of the bar and the header holds icon actions only
        expect(header).not.toContain('class="search');
    });

    it('puts the query box, the root picker and the three options as pressable chips in the bar', () => {
        const bar = between(
            drawn({ q: 'needle', word: true }),
            '<div class="viewbar',
            '<div class="body'
        );
        expect(bar).toContain('class="search');
        expect(bar).toContain('Every root');
        const chips = bar.match(/<button[^>]*class="chip[^"]*pressable[^"]*"[^>]*>/g) ?? [];
        expect(chips.length).toBe(3);
        expect(chips[0]).toContain('aria-pressed="true"');
        expect(chips[1]).toContain('aria-pressed="false"');
        expect(chips[2]).toContain('aria-pressed="false"');
        // the toggles are chips, so the bar draws no bordered text button for them; its one tool
        // button is the one that shows the replace row
        const tools = bar.match(/<button[^>]*class="tool[^"]*"[^>]*>/g) ?? [];
        expect(tools).toHaveLength(1);
        expect(tools[0]).toContain('aria-label="Toggle Replace"');
    });

    it('lets the query box fill the bar', () => {
        const bar = between(drawn(), '<div class="viewbar', '<div class="body');
        expect(bar).toMatch(/class="search[^"]*\bfill\b/);
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
        expect(body).toMatch(
            /the (<!--\[-1-->)?<strong class="match[^"]*">needle<\/strong>(<!--\]-->)? here/
        );
        expect(body).toMatch(/<strong class="match[^"]*">needle<\/strong>(<!--\]-->)? again/);
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

    it('draws what the last run failed with as the message box, with a control that runs the same query again', () => {
        const body = drawn({ q: 'fo(', error: 'error: unclosed group', answer: null });
        const box =
            /<p class="empty[^"]*\berror\b[^"]*"[^>]*role="alert"[^>]*>[\s\S]*?<\/p>/.exec(
                body
            )?.[0] ?? '';
        expect(box).toContain('error: unclosed group');
        expect(box).toMatch(/<button[^>]*class="tool[^"]*\bsmall\b/);
        expect(box).toContain('<span class="label">Search again</span>');
        // a run that failed has no results to draw
        expect(body).not.toContain('data-search-file');
    });

    it('draws no retry control when the run did not fail', () => {
        // the message box and its control belong to a failed run
        expect(drawn({ q: 'needle', answer: ANSWER })).not.toContain('Search again');
    });

    it('draws each file heading and each hit as one pressable row of the tree', () => {
        const body = drawn({ q: 'needle', answer: ANSWER });
        const rows = body.match(/<div class="item[^"]*" role="treeitem"[^>]*>/g) ?? [];
        expect(rows.filter((one) => one.includes('aria-level="1"'))).toHaveLength(2);
        expect(rows.filter((one) => one.includes('aria-level="2"'))).toHaveLength(3);
        const presses = body.match(/<button[^>]*class="main[^"]*"/g) ?? [];
        expect(presses).toHaveLength(5);
    });
});

describe('the keys of the two boxes', () => {
    const press = (init: Partial<KeyboardEvent>): KeyboardEvent =>
        ({
            key: '',
            code: '',
            isComposing: false,
            altKey: false,
            metaKey: false,
            ctrlKey: false,
            shiftKey: false,
            ...init
        }) as KeyboardEvent;

    function keys(): { box: Parameters<typeof boxKey>[1]; set: string[]; alls: number } {
        const held = { set: [] as string[], alls: 0 };
        const box: Parameters<typeof boxKey>[1] = {
            walk: createWalk(),
            texts: ['newer', 'older'],
            text: 'typed',
            set: (text) => held.set.push(text),
            all: () => (held.alls += 1)
        };
        return Object.assign(held, { box });
    }

    it('audits that Up and Down walk the texts and take the press', () => {
        const held = keys();
        expect(boxKey(press({ key: 'ArrowUp' }), held.box)).toBe(true);
        expect(boxKey(press({ key: 'ArrowUp' }), held.box)).toBe(true);
        expect(boxKey(press({ key: 'ArrowDown' }), held.box)).toBe(true);
        expect(held.set).toEqual(['newer', 'older', 'newer']);
    });

    it('audits that Replace All is asked on Cmd+Alt+Enter and Ctrl+Alt+Enter, not with Shift or without Alt', () => {
        const held = keys();
        expect(boxKey(press({ code: 'Enter', altKey: true, metaKey: true }), held.box)).toBe(true);
        expect(boxKey(press({ code: 'NumpadEnter', altKey: true, ctrlKey: true }), held.box)).toBe(
            true
        );
        expect(held.alls).toBe(2);
        expect(
            boxKey(press({ code: 'Enter', altKey: true, metaKey: true, shiftKey: true }), held.box)
        ).toBe(false);
        expect(boxKey(press({ code: 'Enter', metaKey: true }), held.box)).toBe(false);
        expect(held.alls).toBe(2);
    });

    it('audits that every other key, a modified arrow and a press inside a composition are left to the box', () => {
        const held = keys();
        expect(boxKey(press({ key: 'a' }), held.box)).toBe(false);
        expect(boxKey(press({ key: 'ArrowUp', shiftKey: true }), held.box)).toBe(false);
        expect(boxKey(press({ key: 'ArrowDown', metaKey: true }), held.box)).toBe(false);
        expect(boxKey(press({ key: 'ArrowUp', isComposing: true }), held.box)).toBe(false);
        expect(boxKey(press({ key: 'ArrowDown' }), held.box)).toBe(false);
        expect(held.set).toEqual([]);
    });
});

describe('the replace row and the hits with it', () => {
    it('draws no replace row, no Replace and no struck-through match while Toggle Replace is off', () => {
        const body = drawn({ q: 'needle', answer: ANSWER });
        // the row belongs to the tab state that Toggle Replace sets, which this case leaves off
        expect(body).not.toContain('data-search-replace');
        // a match is struck through only where a replacement follows it, and none is shown
        expect(body).not.toContain('data-search-struck');
        // with the row hidden no hit has a replacement to draw after its match
        expect(body).not.toContain('data-search-with');
        // the button over a whole file or a whole answer waits for the row
        expect(body).not.toContain('Replace All');
        expect(body).toMatch(/<strong class="match[^"]*">needle<\/strong>/);
        expect(body).toContain('3 hits in 2 files');
    });

    it('draws the replace box, Preserve Case and Replace All once the row is shown', () => {
        const body = drawn({ q: 'needle', replacing: true, replace: 'pin', answer: ANSWER });
        const row = between(body, 'data-search-replace', 'class="body');
        expect(row).toContain('aria-label="Replace"');
        expect(row).toContain('value="pin"');
        expect(row).toContain('>AB<');
        expect(row).toContain('Replace All');
    });

    it('marks Preserve Case as pressed only when it is on', () => {
        const chip = (preserve: boolean): string => {
            const body = drawn({ q: 'needle', replacing: true, preserve, answer: ANSWER });
            const row = between(body, 'data-search-replace', 'class="body');
            return (row.match(/<button[^>]*class="chip[^"]*"[^>]*>/g) ?? [])[0] ?? '';
        };
        expect(chip(true)).toContain('aria-pressed="true"');
        expect(chip(false)).toContain('aria-pressed="false"');
    });

    it('strikes the match of every hit through and follows it with the text that replaces it', () => {
        const body = drawn({ q: 'needle', replacing: true, replace: 'pin', answer: ANSWER });
        expect(body.match(/data-search-struck/g)).toHaveLength(3);
        expect(body.match(/data-search-with="">pin</g)).toHaveLength(3);
        // the emphasis a plain result draws is replaced by the strike while the row is shown
        expect(body).not.toContain('<strong class="match');
    });

    it('follows the replace text as it changes, and draws no text after a match an empty one deletes', () => {
        const typed = drawn({ q: 'needle', replacing: true, replace: 'nail', answer: ANSWER });
        expect(typed).toContain('data-search-with="">nail<');
        const empty = drawn({ q: 'needle', replacing: true, replace: '', answer: ANSWER });
        expect(empty.match(/data-search-struck/g)).toHaveLength(3);
        // the box is empty now, so the earlier typed word is not drawn after any match
        expect(empty).not.toContain('data-search-with="">nail<');
    });

    it('draws Replace on every hit and Replace All on every file heading, with Dismiss beside them', () => {
        const body = drawn({ q: 'needle', replacing: true, replace: 'pin', answer: ANSWER });
        // the box has the label "Replace" too: one for the box and one per hit
        expect(body.match(/aria-label="Replace"/g)).toHaveLength(1 + 3);
        // the row's own Replace All and one per file heading
        expect(body.match(/aria-label="Replace All"/g)).toHaveLength(1 + 2);
        expect(body.match(/aria-label="Dismiss"/g)).toHaveLength(2 + 3);
    });

    it('says how many hits would be replaced instead of how many were found', () => {
        const body = drawn({ q: 'needle', replacing: true, answer: ANSWER });
        expect(between(body, 'data-search-count', '</p>')).toContain(
            '3 hits would be replaced in 2 files'
        );
    });

    it('says what a Replace All came to in place of the count line, with no paragraph of its own', async () => {
        client.writes.setToken('token');
        vi.stubGlobal('fetch', () =>
            Promise.resolve(
                new Response(
                    JSON.stringify({ ok: true, paths: ['hub/src/one.ts', 'engine/config/two.yml'] })
                )
            )
        );
        drawn({ q: 'needle', replacing: true, replace: 'pin', answer: ANSWER });
        await client.search.replaceHits(instance.id, { kind: 'all' });
        const body = render(Search, { context: clientContext(client), props: { instance } }).body;
        expect(between(body, 'data-search-count', '</p>')).toContain(
            "Replaced 3 occurrences across 2 files with 'pin'."
        );
        // the sentence has no paragraph of its own above the results
        expect(body).not.toContain('data-search-said');
        expect(body.match(/data-search-count/g)).toHaveLength(1);
        // every hit is out of the answer, and the sentence stands where the empty message would
        expect(body).not.toContain('Nothing in these files carries that.');
    });

    it('titles a hit by its Replace Preview while the row is shown', () => {
        const off = drawn({ q: 'needle', answer: ANSWER });
        const on = drawn({ q: 'needle', replacing: true, answer: ANSWER });
        expect(on).not.toBe(off);
        expect(on).toContain('Open the Replace Preview of src/one.ts at line 12');
        // opening a hit goes to its file while the row is hidden, so the title names the file only
        expect(off).not.toContain('Replace Preview');
    });
});
