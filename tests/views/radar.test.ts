// The Lit Watch view rendered over a received feed message with every section and card marker.

import { render } from 'svelte/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Radar from '../../src/lib/views/Radar.svelte';
import { openSourceFile } from '../../src/lib/views/shared/edit-bar.ts';
import { findInstance } from '../../src/lib/state/instance.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../src/lib/data/sources/config.ts';
import { feedsFixture } from '../feeds-fixture.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import { setVocab } from '../../src/lib/state/tones.ts';
import type { Snapshot } from '../../src/lib/data/model.ts';
import type { Instance } from '../../src/lib/state/layout/index.ts';
import { noop } from '../doubles.ts';
import { clientContext, createClientState, type ClientState } from '../client.ts';

let client: ClientState;
let layout: ClientState['layout']['layout'];
let loadLayout: ClientState['layout']['loadLayout'];
let receive: ClientState['entities']['receive'];
let setInstanceState: ClientState['ui']['setInstanceState'];

beforeEach(() => {
    client = createClientState();
    ({ layout, loadLayout } = client.layout);
    ({ receive } = client.entities);
    ({ setInstanceState } = client.ui);
    receive({ channel: 'config', version: 1, payload: { config, text: catalog, findings: [] } });
});

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));
setVocab(vocabCatalog(config));

const entries = [
    {
        title: '**Risk** paper',
        authors: 'Ada',
        venue: 'Nature',
        year: 2026,
        url: 'https://example.org/risk',
        bucket: 'preemption',
        project: 'alpha',
        relevance: 'high',
        why: 'Direct **overlap**',
        threatens: 'main claim',
        found: '2026-09-11'
    },
    {
        title: 'Idea paper',
        bucket: 'idea',
        motif: 'Useful Motif',
        maps_to: 'new-idea-candidate',
        relevance: 'med',
        idea_spark: 'A clear seed',
        found: '2026-09-10'
    },
    { title: 'Baseline paper', bucket: 'cite_baseline', relevance: 'low', found: '2026-09-09' },
    { title: 'Adjacent paper', bucket: 'adjacent', found: '2026-09-08' },
    { title: 'Dismissed paper', bucket: 'adjacent', dismissed: true, found: '2026-09-07' }
];

function instance(id: string, dismissedOpen = false): Instance {
    const value: Instance = { id, view: 'radar', state: {} };
    setInstanceState(id, { search: '', dismissedOpen });
    return value;
}

let feedVersion = 0;

function serve(body: Record<string, unknown>, _status = 200): void {
    receive({ channel: 'feeds', version: ++feedVersion, payload: feedsFixture('radar', body) });
}

afterEach(() => vi.unstubAllGlobals());

describe('the Lit Watch view', () => {
    it('opens the bar file as a source tab and reuses the same file instance', () => {
        loadLayout({ getItem: () => null, setItem: noop });
        const file = { root: 'hub', path: 'feeds/literature-radar.yml' };
        const id = openSourceFile(client, file);
        expect(findInstance(layout(), id)?.instance).toEqual({
            id,
            view: 'source',
            state: {
                ...file,
                label: 'literature-radar.yml'
            }
        });
        expect(openSourceFile(client, file)).toBe(id);
    });

    it('draws its intro, search, ordered sections, card details, actions, and collapsed dismissed section', () => {
        const snapshot = {
            version: 301,
            entities: { projects: { alpha: { id: 'alpha', title: 'Alpha project' } } }
        } as unknown as Snapshot;
        receive({
            channel: 'config',
            version: 301,
            payload: { config, text: catalog, findings: [] }
        });
        receive({ channel: 'portfolio', version: 301, payload: snapshot });
        serve({
            ok: true,
            kind: 'radar',
            file: 'feeds/literature-radar.yml',
            meta: { last_run: '2026-09-11' },
            entries
        });
        const body = render(Radar, {
            context: clientContext(client),
            props: { instance: instance('radar-one') }
        }).body;
        expect(body).toContain('data-edit-source');
        expect(body).toContain('data-source-root="hub"');
        expect(body).toContain('data-source-path="feeds/literature-radar.yml"');
        expect(body).toMatch(/class="intro(?:\s|")/);
        expect(body).toContain('New-paper radar');
        expect(body).toContain('4 tracked');
        expect(body).not.toContain('{G.');
        expect(body).toContain(catalog['radar.search']);
        for (const label of ['Pre-emption risk', 'Idea sparks', 'Cite / baseline', 'Adjacent'])
            expect(body).toContain(label);
        expect(body).toContain('<strong>Risk</strong> paper');
        expect(body).toContain('Ada | Nature | 2026');
        expect(body).toContain(catalog['radar.new']);
        expect(body).toContain('main claim');
        expect(body).toContain('Alpha project');
        expect(body).toContain(catalog['radar.new_idea_candidate']);
        expect(body).toContain(catalog['radar.paper']);
        expect(body).toContain(catalog['radar.dismiss']);
        expect(body).toContain(catalog['radar.idea']);
        expect(body).toContain(`${catalog['radar.dismissed_sec']} (1)`);
        expect(body).not.toContain('Dismissed paper');
    });

    it('draws the empty and missing-file states', () => {
        serve({
            ok: true,
            kind: 'radar',
            file: 'feeds/literature-radar.yml',
            meta: {},
            entries: []
        });
        expect(
            render(Radar, {
                context: clientContext(client),
                props: { instance: instance('radar-empty') }
            }).body
        ).toContain(catalog['radar.empty']);

        serve({
            ok: true,
            kind: 'radar',
            file: 'feeds/literature-radar.yml',
            missing: true
        });
        const missing = render(Radar, {
            context: clientContext(client),
            props: { instance: instance('radar-missing') }
        }).body;
        expect(missing).toContain('No radar file yet');
        expect(missing).toContain('feeds/literature-radar.yml');
    });

    it('draws dismissed string and boolean values open, newest first, with restore actions', () => {
        serve({
            ok: true,
            kind: 'radar',
            file: 'feeds/literature-radar.yml',
            meta: {},
            entries: [
                { title: 'Older dismissed', dismissed: true, found: '2026-09-01' },
                { title: 'Newer dismissed', dismissed: 'true', found: '2026-09-02' }
            ]
        });
        const body = render(Radar, {
            context: clientContext(client),
            props: { instance: instance('radar-dismissed', true) }
        }).body;
        expect(body).toContain(catalog['radar.restore']);
        expect(body.indexOf('Newer dismissed')).toBeLessThan(body.indexOf('Older dismissed'));
    });

    it('draws no write action for an untitled entry', () => {
        serve({
            ok: true,
            kind: 'radar',
            file: 'feeds/literature-radar.yml',
            meta: {},
            entries: [{ bucket: 'idea', maps_to: 'new-idea-candidate' }]
        });
        const body = render(Radar, {
            context: clientContext(client),
            props: { instance: instance('radar-untitled') }
        }).body;
        expect(body).toContain(catalog['radar.untitled']);
        expect(body).not.toContain(catalog['radar.dismiss_tip']);
        expect(body).not.toContain(catalog['radar.idea_tip']);
    });

    it('draws a parse error with its configured path and reason', () => {
        serve(
            {
                error: 'bad YAML',
                kind: 'radar',
                file: 'feeds/literature-radar.yml'
            },
            500
        );
        const body = render(Radar, {
            context: clientContext(client),
            props: { instance: instance('radar-error') }
        }).body;
        expect(body).toContain('Could not read feeds/literature-radar.yml: bad YAML');
        expect(body).not.toContain('No radar file yet');
    });
});
