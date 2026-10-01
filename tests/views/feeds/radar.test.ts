// The Lit Watch view rendered over a received feed message with every section and card marker.

import { render } from 'svelte/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Radar from '../../../src/lib/views/feeds/radar/Radar.svelte';
import { openSourceFile } from '../../../src/lib/views/shared/links/source-file.ts';
import { findInstance } from '../../../src/lib/state/workbench/layout/instance.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../../src/lib/data/sources/config.ts';
import { feedsFixture } from '../../fixtures/feeds-fixture.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import { setVocab, toneOf } from '../../../src/lib/state/shared/words/tones.ts';
import type { Snapshot } from '../../../src/lib/data/model/index.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import { noop } from '../../fixtures/doubles.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';
import { barOf, headerOf } from '../shared/pane-parts.ts';

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
        url: 'papers.example.org/risk',
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
    it('opens its own feed file as a source tab and reuses the same file instance', () => {
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
        expect(body).toContain('data-source-root="hub"');
        expect(body).toContain(`data-source-path="${String(config.radar_file)}"`);
        expect(body).toContain(catalog['views.open_source']);
        expect(body).toContain(
            catalog['views.open_source_tip'].replace('{0}', String(config.radar_file))
        );
        expect(body).toMatch(/class="intro(?:\s|")/);
        expect(body).toContain('New-paper radar');
        expect(body).toContain('4 tracked');
        // every glyph is filled in from the catalog, so no placeholder is left in the words
        expect(body).not.toContain('{G.');
        expect(body).toContain(catalog['radar.search']);
        // Revert: in posting of views/shared/forms/posting.ts, draw only a value that already
        // carries its scheme, and a paper written as `papers.example.org/x` draws no link at all.
        expect(body).toContain('href="https://papers.example.org/risk"');
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
        // the dismissed section is closed, so the papers in it are not drawn
        expect(body).not.toContain('Dismissed paper');
    });

    it('draws a linked project with its whole title as the tooltip, its label in a capped box', () => {
        const long =
            'Private Coupled Descent: Dimension-Free Privacy for Vertical Federated Learning';
        const snapshot = {
            version: 302,
            entities: { projects: { pcd: { id: 'pcd', title: long } } }
        } as unknown as Snapshot;
        receive({ channel: 'portfolio', version: 302, payload: snapshot });
        serve({
            ok: true,
            kind: 'radar',
            file: 'feeds/literature-radar.yml',
            meta: {},
            entries: [{ title: 'Linked paper', bucket: 'adjacent', project: 'pcd' }]
        });
        const body = render(Radar, {
            context: clientContext(client),
            props: { instance: instance('radar-link') }
        }).body.replace(/<!--[\s\S]*?-->/g, '');
        const at = body.indexOf('<span class="link');
        expect(at).toBeGreaterThan(-1);
        // The link's box holds the button with the title as its label and the tooltip's words
        // after it, in place and hidden until the bubble draws them on the body.
        const link = body.slice(at, body.indexOf('class="words"', at) + 400);
        expect(link).toMatch(/<button type="button" class="tool [^"]*\bcut\b/);
        expect(link).toMatch(new RegExp(`<span class="label">${long}</span>`));
        expect(link).toMatch(new RegExp(`class="words"[^>]*hidden[^>]*>${long}</span>`));
    });

    it('draws the intro legend as bucket glyphs in their hues beside the catalog words', () => {
        receive({
            channel: 'portfolio',
            version: 303,
            payload: { version: 303, entities: {} }
        });
        serve({
            ok: true,
            kind: 'radar',
            file: 'feeds/literature-radar.yml',
            meta: { last_run: '2026-09-11' },
            entries
        });
        const body = render(Radar, {
            context: clientContext(client),
            props: { instance: instance('radar-intro') }
        }).body;
        const from = body.indexOf('data-radar-intro');
        const intro = body.slice(from, body.indexOf('</p>', from));
        const names = [...intro.matchAll(/data-glyph="([a-z_]+)"/g)].map((found) => found[1]);
        expect(names).toEqual([catalog['views.radar_glyph'], 'red', 'green', 'white', 'purple']);
        const buckets = config.radar_buckets as { glyph: string; color: string }[];
        for (const name of ['red', 'green', 'white', 'purple']) {
            const hue = toneOf(buckets.find((bucket) => bucket.glyph === name)?.color ?? '');
            expect(intro, name).toMatch(
                new RegExp(
                    `style="color: var\\(--c-${hue}-txt\\)">(?:<!--[^>]*-->)*<span class="glyph[^"]*" data-glyph="${name}"`
                )
            );
        }
        for (const key of ['intro_preempt', 'intro_cite', 'intro_adjacent', 'intro_cross']) {
            expect(intro, key).toContain(catalog[`radar.${key}`]);
        }
        expect(intro).toContain('4 tracked');
        expect(intro).toContain('<b>New-paper radar</b>');
        expect(intro).toContain('<b>idea sparks</b>');
        expect(intro).toContain('<b>2026-09-11</b>');
        // the catalog lines are words alone, so no token is left to fill
        expect(intro).not.toContain('{G.');
        expect(intro).not.toMatch(/[^\t\n\r\x20-\x7E]/);
    });

    it('draws the intro separators from its markup, so every intro line holds words alone', () => {
        receive({ channel: 'portfolio', version: 304, payload: { version: 304, entities: {} } });
        serve({
            ok: true,
            kind: 'radar',
            file: 'feeds/literature-radar.yml',
            meta: { last_run: '2026-09-11' },
            entries
        });
        const body = render(Radar, {
            context: clientContext(client),
            props: { instance: instance('radar-words') }
        }).body;
        expect(body).toMatch(/class="legend[^"]*"/);
        expect([...body.matchAll(/class="item[ "]/g)]).toHaveLength(6);
        // The markup draws the separators, hidden from a screen reader: the legend's brackets and
        // a bar between two items.
        const seps = [
            ...body.matchAll(/<span class="sep[^"]*" aria-hidden="true">([^<]*)<\/span>/g)
        ];
        expect(seps.map((one) => one[1])).toEqual(['(', '|', '|', ')', '|', '|']);
        const lines = Object.entries(catalog).filter(([key]) => key.startsWith('radar.intro_'));
        expect(lines.length).toBeGreaterThanOrEqual(9);
        // a separator stored in a line would be drawn twice beside the markup's own
        const loose = lines.filter(([, line]) => /\||^\s*-|-\s*$/.test(line));
        expect(loose.map(([key]) => key)).toEqual([]);
    });

    // The bucket glyphs are colour names in the vocabulary, and a line icon carries no colour, so
    // each heading's mark is drawn in the bucket's own hue instead.
    it('draws each bucket heading mark in the bucket colour, one hue per bucket', () => {
        const snapshot = {
            version: 302,
            entities: { projects: {} }
        } as unknown as Snapshot;
        receive({ channel: 'portfolio', version: 302, payload: snapshot });
        serve({
            ok: true,
            kind: 'radar',
            file: 'feeds/literature-radar.yml',
            meta: { last_run: '2026-09-11' },
            entries
        });
        const body = render(Radar, {
            context: clientContext(client),
            props: { instance: instance('radar-tones') }
        }).body;

        const marks = [...body.matchAll(/--bucket-txt: var\(--c-([a-z-]+)-txt\)/g)].map(
            (found) => found[1]
        );
        const buckets = config.radar_buckets as { color: string }[];
        expect(marks).toEqual(buckets.map((bucket) => toneOf(bucket.color)));
        expect(new Set(marks).size).toBe(marks.length);
        // The mark is the heading control's own child, a span the view paints in the section's
        // hue, so the colour reaches the icon without a rule over the button's classes.
        expect(body).toMatch(
            /<section[^>]*--bucket-txt[^>]*>(?:<!--[^>]*-->)*\s*<span class="tip[^"]*"><button[^>]*class="tool[^"]*"[^>]*>(?:<!--[^>]*-->)*[\s\S]*?<span class="label"><span class="heading[^"]*"><span class="mark[^"]*">(?:<!--[^>]*-->)*<span class="glyph/
        );
    });

    it('puts the search in the bar and only the source icon in the header', () => {
        serve({
            ok: true,
            kind: 'radar',
            file: 'feeds/literature-radar.yml',
            meta: {},
            entries
        });
        const body = render(Radar, {
            context: clientContext(client),
            props: { instance: instance('radar-bar') }
        }).body;
        const header = headerOf(body);
        const bar = barOf(body);
        expect(bar).toMatch(/<input class="search[^"]*\bfill\b/);
        // a search box is a control of the bar, and the header holds icon actions only
        expect(header).not.toContain('class="search');
        const tools = header.match(/<button[^>]*class="tool[^"]*"/g) ?? [];
        expect(tools.length).toBe(1);
        for (const tool of tools) expect(tool).toMatch(/\bbare\b/);
    });

    it('draws no header toolbar while the feed file is not on this machine', () => {
        serve({ ok: true, kind: 'radar', file: 'feeds/literature-radar.yml', missing: true });
        const body = render(Radar, {
            context: clientContext(client),
            props: { instance: instance('radar-bar-missing') }
        }).body;
        const header = body.slice(body.indexOf('<header'), body.indexOf('</header>'));
        // the feed file is missing, so no source icon is left and the header draws no strip
        expect(header).not.toContain('role="toolbar"');
        expect(body.slice(body.indexOf('<div class="viewbar'))).toMatch(/<input class="search/);
    });

    it('draws the actions of a card inside the control box that the card reveals', () => {
        serve({
            ok: true,
            kind: 'radar',
            file: 'feeds/literature-radar.yml',
            meta: {},
            entries: [
                { title: 'Idea paper', bucket: 'idea', maps_to: 'new-idea-candidate' },
                { title: 'Gone paper', bucket: 'adjacent', dismissed: true }
            ]
        });
        const body = render(Radar, {
            context: clientContext(client),
            props: { instance: instance('radar-controls', true) }
        }).body;
        // the control box is the last child of the card's meta row, which its div closes
        const boxes = body
            .split('class="controls')
            .slice(1)
            .map((part) => part.slice(0, part.indexOf('</div>')));
        expect(boxes.length).toBe(2);
        const labels = boxes.map((box) =>
            [...box.matchAll(/aria-label="([^"]*)"/g)].map((found) => found[1])
        );
        expect(labels).toEqual([
            [catalog['radar.idea'], catalog['radar.dismiss']],
            [catalog['radar.restore']]
        ]);
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
        // the file is not on this machine, so there is no path for the source control to name
        expect(missing).not.toContain('data-source-path');
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
        // the entry carries no title, so there is nothing to act on and no control is offered
        expect(body).not.toContain(catalog['radar.dismiss_tip']);
        // nor the tooltip of the other one
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
        // the read failed, which is said with its reason rather than as a file that is not there
        expect(body).not.toContain('No radar file yet');
    });
});
