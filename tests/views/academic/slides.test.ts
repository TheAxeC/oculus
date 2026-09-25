// Layer 4, view test. The slide catalog rendered over the real deck of config/present.yml and one
// synthetic project: one row per slide the deck could hold, the tick each row carries, and the
// controls that move it.
//
// The deck is the shipped one on purpose, as tests/views/academic/present.test.ts's is: the catalog
// is what the deck write checks a save against, so a key renamed in config/present.yml fails here
// rather than on screen. The pane's own state is the instance's, so a case hands it the state a
// press would have left and reads what the reader would then see.
//
// What this does NOT cover: pressing anything. The environment is node and the render is the
// server's, so the answers behind each state are covered by tests/state/life/slides.test.ts
// as plain calls, and the presses themselves by tests/browser/workbench/present.spec.ts in a
// browser.

import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import Slides from '../../../src/lib/views/academic/slides/Slides.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import { setVocab } from '../../../src/lib/state/shared/words/tones.ts';
import { deckCatalogKeys, deckFrom } from '../../../src/lib/state/life/present.ts';
import { catalogSignature } from '../../../src/lib/state/life/slides.ts';
import type { Project, Snapshot } from '../../../src/lib/data/model/index.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));
setVocab(vocabCatalog(config));

const PROJECT: Project = {
    id: 'alpha',
    tier: 'active',
    ghost: false,
    type: 'active',
    title: 'The alpha project',
    chips: [],
    results: [],
    ideas: [],
    waitingOn: [],
    followups: [],
    subtasks: [],
    relatedIds: [],
    fundingIds: [],
    datasetIds: [],
    pillarIds: [],
    domainIds: ['heart'],
    collaborators: [],
    docs: [],
    present: [
        {
            id: 'alpha',
            projectId: 'alpha',
            title: 'A headline for the slide',
            specs: [],
            panels: [],
            method: [],
            results: []
        }
    ],
    folder: 'projects/active/alpha',
    file: 'projects/active/alpha/project.yml'
};

const instance: Instance = { id: 'slides-one', view: 'slides', state: {} };

let client: ClientState;

function snapshot(projects: Project[]): Snapshot {
    return {
        version: 1,
        entities: { projects: Object.fromEntries(projects.map((one) => [one.id, one])) },
        relations: {},
        findings: []
    } as unknown as Snapshot;
}

/** A client over the real config, with `deck:` and the projects a case wants instead. */
function install(deck: Record<string, unknown>, projects: Project[] = [PROJECT]): void {
    client = createClientState();
    client.entities.receive({
        channel: 'config',
        version: 1,
        payload: { config: { ...config, deck }, text: catalog, findings: [] }
    });
    client.entities.receive({ channel: 'portfolio', version: 1, payload: snapshot(projects) });
}

/**
 * The `deck:` map of the real config, which is what the view draws over unless a case says more.
 */
const DECK = config.deck as Record<string, unknown>;

/** Every key the catalog offers over that deck and that one project. */
const KEYS = deckCatalogKeys(deckFrom({ deck: DECK }), [PROJECT]);

beforeEach(() => {
    install(DECK);
});

function body(state: Record<string, unknown> | null = null): string {
    if (state !== null) client.ui.setInstanceState(instance.id, state);
    return render(Slides, { context: clientContext(client), props: { instance } }).body;
}

/** The markup of one row alone, so an assertion about it is about that row. */
function rowOf(html: string, key: string): string {
    const at = html.indexOf(`data-slide-row="${key}"`);
    expect(at).toBeGreaterThan(0);
    const next = html.indexOf('data-slide-row="', at + 1);
    return html.slice(at, next === -1 ? html.length : next);
}

/** Which of one row's two move controls cannot be pressed. */
function steps(html: string, key: string): { up: boolean; down: boolean } {
    const row = rowOf(html, key);
    const at = row.indexOf('data-step="up"');
    expect(at).toBeGreaterThan(0);
    const buttons = [...row.slice(at).matchAll(/<button[^>]*>/g)].map((found) => found[0]);
    return { up: buttons[0].includes('disabled'), down: buttons[1].includes('disabled') };
}

/** The status region's own words. */
function status(html: string): string {
    const found = /role="status"[^>]*>([^<]*)</.exec(html);
    return found === null ? '' : found[1];
}

/** The rows the view drew, in the order it drew them. */
function drawn(html: string): string[] {
    return [...html.matchAll(/data-slide-row="([^"]+)"/g)].map((match) => match[1]);
}

/** Whether the row of one key carries a ticked box. */
function ticked(html: string, key: string): boolean {
    return /<input[^>]*type="checkbox"[^>]*checked/.test(rowOf(html, key));
}

describe('the slide catalog', () => {
    it('draws one row per slide the deck could hold, in the catalog order', () => {
        expect(drawn(body())).toEqual(KEYS);
        expect(KEYS.length).toBeGreaterThan(3);
        expect(KEYS).toContain('alpha');
        expect(KEYS[0]).toBe('title');
        expect(KEYS[KEYS.length - 1]).toBe('closing');
    });

    it('numbers the rows from one and names each slide and its kind', () => {
        const html = body();
        expect(html).toContain('>1</span>');
        expect(html).toContain(`>${String(KEYS.length)}</span>`);
        expect(html).toContain('A headline for the slide');
        expect(html).toContain('>project</span>');
        expect(html).toContain('>framing</span>');
    });

    it('ticks every slide when the deck has saved no selection', () => {
        const html = body();
        expect(KEYS.filter((key) => !ticked(html, key))).toEqual([]);
    });

    it('ticks the saved selection alone, and still lists the slides it leaves out', () => {
        install({ ...DECK, selection: ['title', 'alpha'] });
        const html = body();
        expect(drawn(html)).toEqual(KEYS);
        expect(KEYS.filter((key) => ticked(html, key))).toEqual(['title', 'alpha']);
    });

    it('draws the catalog in the saved order when the deck holds one', () => {
        const reversed = [...KEYS].reverse();
        install({ ...DECK, slide_order: reversed });
        expect(drawn(body())).toEqual(reversed);
    });

    it('carries the save control, the status line and the move controls of every row', () => {
        const html = body();
        expect(html).toContain(catalog['slides.save']);
        expect(html).toContain('role="status"');
        expect(html).toContain(catalog['slides.intro']);
        expect(html).toContain(catalog['slides.up']);
        expect(html).toContain(catalog['slides.down']);
    });

    it('disables the move each end row cannot make, and neither move in between', () => {
        const html = body();
        expect(steps(html, KEYS[0])).toEqual({ up: true, down: false });
        expect(steps(html, KEYS[KEYS.length - 1])).toEqual({ up: false, down: true });
        expect(steps(html, KEYS[1])).toEqual({ up: false, down: false });
    });

    it('draws the work the pane is holding rather than the file, while the catalog matches', () => {
        const order = [...KEYS].reverse();
        const html = body({
            at: catalogSignature(KEYS),
            order,
            picked: ['title'],
            said: catalog['slides.saving']
        });
        expect(drawn(html)).toEqual(order);
        expect(KEYS.filter((key) => ticked(html, key))).toEqual(['title']);
        expect(status(html)).toBe(catalog['slides.saving']);
    });

    it('draws each line the status region can show, and never a wire word', () => {
        for (const key of [
            'slides.keep_one',
            'slides.saving',
            'slides.saved',
            'slides.failed_invalid',
            'slides.failed_order',
            'slides.failed_file',
            'slides.failed_network',
            'slides.failed_other'
        ]) {
            const html = body({
                at: catalogSignature(KEYS),
                order: KEYS,
                picked: [],
                said: catalog[key]
            });
            expect(status(html)).toBe(catalog[key]);
            // the words drawn are the catalog sentence for the outcome, never the key it is held
            // under
            expect(html).not.toContain('invalid_order');
        }
    });

    it('says the deck changed under it when a push dropped work made over another catalog', () => {
        const html = body({
            at: 'a catalog this deck no longer has',
            order: ['title'],
            picked: ['title'],
            said: catalog['slides.moved'].replace('{0}', 'x')
        });
        expect(status(html)).toBe(catalog['slides.dropped']);
        // What is drawn is the file again, not the one row the dropped work held.
        expect(drawn(html)).toEqual(KEYS);
        expect(KEYS.filter((key) => !ticked(html, key))).toEqual([]);
    });

    it('says nothing of the kind while the work is the catalog own', () => {
        expect(
            status(body({ at: catalogSignature(KEYS), order: KEYS, picked: KEYS, said: '' }))
        ).toBe('');
    });

    it('says the deck holds nothing to choose from when it places no slide', () => {
        install({}, []);
        const html = body();
        expect(html).toContain(catalog['slides.empty']);
        expect(drawn(html)).toEqual([]);
    });
});
