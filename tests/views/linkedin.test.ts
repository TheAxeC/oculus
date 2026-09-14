// The LinkedIn view rendered over received folder feeds covering cadence, controls, and card scope.

import { render } from 'svelte/server';
import { scalar } from '../../src/lib/data/guards.ts';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import Linkedin from '../../src/lib/views/Linkedin.svelte';
import { openLinkedinSource } from '../../src/lib/views/linkedin/post-card.ts';
import { findInstance } from '../../src/lib/state/instance.ts';
import { addFromForm } from '../../src/lib/views/shared/entry-form.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../src/lib/data/sources/config.ts';
import { feedsFixture } from '../feeds-fixture.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import type { Instance } from '../../src/lib/state/layout/index.ts';
import { noop } from '../doubles.ts';
import { clientContext, createClientState, type ClientState } from '../client.ts';

let client: ClientState;
let layout: ClientState['layout']['layout'];
let loadLayout: ClientState['layout']['loadLayout'];
let receive: ClientState['entities']['receive'];
let setInstanceState: ClientState['ui']['setInstanceState'];
let addLinkedinIdea: ClientState['writes']['addLinkedinIdea'];
let markPosted: ClientState['writes']['markPosted'];

beforeEach(() => {
    client = createClientState();
    ({ layout, loadLayout } = client.layout);
    ({ receive } = client.entities);
    ({ setInstanceState } = client.ui);
    ({ addLinkedinIdea, markPosted } = client.writes);
});

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));

const entries = [
    {
        file: 'xx-zeta.md',
        title: 'Zeta idea',
        date: '2026-09-12',
        category: 'research',
        body: 'A tensor hook for the next milestone.',
        idea: true
    },
    {
        file: '02-new.md',
        title: 'New post',
        date: '2026-09-10',
        category: 'reflection',
        body: 'The newest posted body.',
        idea: false
    },
    {
        file: 'xx-alpha.md',
        title: 'Alpha idea',
        date: '',
        category: 'mentorship',
        body: 'Teaching lessons for a future post.',
        idea: true
    },
    {
        file: '01-old.md',
        title: 'Old post',
        date: '2026-08-01',
        category: 'research',
        body: 'The older posted body.',
        idea: false
    }
];

function instance(id: string, search = '', adding = false): Instance {
    const value: Instance = { id, view: 'linkedin', state: {} };
    setInstanceState(id, { search, adding });
    return value;
}

let feedVersion = 0;

function serve(body: Record<string, unknown>, _status = 200): void {
    receive({ channel: 'feeds', version: ++feedVersion, payload: feedsFixture('linkedin', body) });
}

function draw(
    id: string,
    feedEntries: Record<string, unknown>[] = entries,
    search = '',
    adding = false
): string {
    serve({
        ok: true,
        kind: 'linkedin',
        file: 'theaxec.github.io/_linkedin',
        entries: feedEntries,
        cadenceDays: 30
    });
    return render(Linkedin, {
        context: clientContext(client),
        props: { instance: instance(id, search, adding) }
    }).body;
}

function card(body: string, file: string): string {
    const marker = `data-linkedin-card="${file}"`;
    const at = body.indexOf(marker);
    expect(at).toBeGreaterThan(-1);
    const start = body.lastIndexOf('<div', at);
    const next = body.indexOf('data-linkedin-card=', at + marker.length);
    return body.slice(start, next < 0 ? body.length : next);
}

function hasAction(body: string, label: string): boolean {
    const buttons = body.match(/<button[\s\S]*?<\/button>/g) ?? [];
    return buttons.some((button) => button.includes(`>${label}</span>`));
}

beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 12, 12));
});

afterEach(() => vi.unstubAllGlobals());
afterAll(() => vi.useRealTimers());

describe('the LinkedIn view', () => {
    it('opens Edit in a source tab using the hub-relative folder and post file', () => {
        loadLayout({ getItem: () => null, setItem: noop });
        const folder = 'theaxec.github.io/_linkedin';
        const id = openLinkedinSource(client.layout, folder, 'xx-zeta.md');
        expect(findInstance(layout(), id)?.instance).toEqual({
            id,
            view: 'source',
            state: {
                root: 'hub',
                path: `${folder}/xx-zeta.md`,
                label: 'xx-zeta.md'
            }
        });
        expect(openLinkedinSource(client.layout, `${folder}/`, 'xx-zeta.md')).toBe(id);
    });

    it('draws search, add form, ordered sections, metadata, snippets, and card-scoped actions', () => {
        const body = draw('linkedin-all', entries, '', true);
        expect(body).toContain(catalog['linkedin.search'].replace('&', '&amp;'));
        expect(body).toContain(catalog['linkedin.addidea']);
        expect(body).toContain(catalog['linkedin.ideas_hdr'].replace('{0}', '2'));
        expect(body).toContain(catalog['linkedin.posted_hdr'].replace('{0}', '2'));
        expect(body.indexOf('Alpha idea')).toBeLessThan(body.indexOf('Zeta idea'));
        expect(body.indexOf('New post')).toBeLessThan(body.indexOf('Old post'));

        const idea = card(body, 'xx-alpha.md');
        expect(idea).toContain(catalog['linkedin.idea_tag']);
        expect(idea).toContain('mentorship');
        expect(idea).toContain('Teaching lessons for a future post....');
        expect(hasAction(idea, catalog['linkedin.markpost'])).toBe(true);
        expect(hasAction(idea, catalog['linkedin.edit'])).toBe(true);
        expect(idea).toContain('data-editor-path="theaxec.github.io/_linkedin/xx-alpha.md"');
        expect(idea).toContain('data-editor-view="source"');
        expect(idea).toContain('data-editor-root="hub"');

        const post = card(body, '02-new.md');
        expect(post).toContain('>02</span>');
        expect(post).toContain('2026-09-10');
        expect(hasAction(post, catalog['linkedin.markpost'])).toBe(false);
        expect(hasAction(post, catalog['linkedin.edit'])).toBe(true);
        expect(body).toContain(`aria-label="${catalog['linkedin.form_title']}"`);
        expect(body).toContain(`aria-label="${catalog['linkedin.form_category']}"`);
        expect(body).toContain(catalog['linkedin.form_category_help']);
    });

    it('draws neither a category chip nor a date on a post whose front matter names neither', () => {
        const bare = [
            {
                file: '03-bare.md',
                title: 'Bare post',
                date: '',
                category: '',
                body: 'A body and nothing else.',
                idea: false
            }
        ];
        const drawn = card(draw('linkedin-bare', bare), '03-bare.md');
        expect(drawn).toContain('Bare post');
        expect(drawn).not.toContain('class="date"');
        // The number chip is the only one left; a card with a category draws a second one.
        expect(drawn.match(/class="chip/g)?.length ?? 0).toBe(1);
        const withCategory = card(draw('linkedin-category-chip', entries), 'xx-alpha.md');
        expect(withCategory.match(/class="chip/g)?.length ?? 0).toBe(2);
    });

    it('searches title, category, and body without drawing an unrelated card', () => {
        const category = draw('linkedin-category', entries, 'mentorship');
        expect(category).toContain('Alpha idea');
        expect(category).not.toContain('Zeta idea');
        const body = draw('linkedin-body', entries, 'tensor milestone');
        expect(body).toContain('Zeta idea');
        expect(body).not.toContain('Alpha idea');
    });

    it('draws on-track, overdue with nudge, and no-date cadence states', () => {
        const ontrack = draw('linkedin-ontrack');
        expect(ontrack).toMatch(/class="intro(?:\s|")/);
        expect(ontrack).toContain('data-cadence="ontrack"');
        expect(ontrack).toContain(catalog['linkedin.ontrack'].replace('{0}', '2'));

        const overdueEntries = entries.map((entry) =>
            entry.idea ? entry : { ...entry, date: '2026-07-01' }
        );
        const overdue = draw('linkedin-overdue', overdueEntries);
        expect(overdue).toContain('data-cadence="overdue"');
        expect(overdue).toContain(
            catalog['linkedin.overdue'].replace('{0}', '73').replace('{1}', '30')
        );
        expect(overdue).toContain(catalog['linkedin.postdue']);
        expect(overdue).toContain(catalog['linkedin.nudge']);
        expect(overdue).toContain('Zeta idea');

        const defaultPick = draw(
            'linkedin-default-pick',
            overdueEntries.filter((entry) => !entry.idea)
        );
        expect(defaultPick).toContain(catalog['linkedin.default_pick']);

        const undated = draw(
            'linkedin-undated',
            entries.map((entry) => (entry.idea ? entry : { ...entry, date: '' }))
        );
        expect(undated).toContain('data-cadence="no-dates"');
        expect(undated).toContain(catalog['linkedin.no_dates']);
    });

    it('draws the empty, missing-folder, and feed-error states', () => {
        const empty = draw('linkedin-empty', []);
        expect(empty).toContain(catalog['linkedin.no_ideas']);
        expect(empty).toContain(catalog['linkedin.no_posts']);

        serve({
            ok: true,
            kind: 'linkedin',
            file: 'theaxec.github.io/_linkedin',
            missing: true,
            entries: [],
            cadenceDays: 30
        });
        expect(
            render(Linkedin, {
                context: clientContext(client),
                props: { instance: instance('linkedin-missing') }
            }).body
        ).toContain(catalog['linkedin.no_folder']);

        serve(
            {
                error: 'cannot read folder',
                kind: 'linkedin',
                file: 'theaxec.github.io/_linkedin'
            },
            500
        );
        const failed = render(Linkedin, {
            context: clientContext(client),
            props: { instance: instance('linkedin-error') }
        }).body;
        expect(failed).toContain('cannot read folder');
        expect(failed).toContain('theaxec.github.io/_linkedin');
    });

    it('sends the two LinkedIn write bodies through the state helpers', async () => {
        const requests: Record<string, unknown>[] = [];
        vi.stubGlobal('fetch', (_url: string, init: RequestInit) => {
            requests.push(JSON.parse(scalar(init.body)) as Record<string, unknown>);
            return Promise.resolve(
                new Response(JSON.stringify({ ok: true, changed: ['file'], refused: [] }))
            );
        });
        await addFromForm(
            client.writes,
            'linkedin',
            { title: 'New idea', category: 'research' },
            addLinkedinIdea
        );
        await addFromForm(client.writes, 'linkedin', { title: 'Uncategorised' }, addLinkedinIdea);
        await markPosted('xx-new-idea.md');
        expect(requests).toEqual([
            { kind: 'linkedin-idea', title: 'New idea', category: 'research' },
            { kind: 'linkedin-idea', title: 'Uncategorised', category: '' },
            { kind: 'linkedin-post', file: 'xx-new-idea.md' }
        ]);
    });
});
