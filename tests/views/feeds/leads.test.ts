// The Position Leads view rendered over a received feed with live, expired, undated, and run-log
// rows.

import { scalar } from '../../../src/lib/data/helpers/guards.ts';
import { render } from 'svelte/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Leads from '../../../src/lib/views/feeds/leads/Leads.svelte';
import { addFromForm } from '../../../src/lib/views/shared/forms/entry-form.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { feedsFixture } from '../../fixtures/feeds-fixture.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import { noop } from '../../fixtures/doubles.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;
let receive: ClientState['entities']['receive'];
let loadUi: ClientState['ui']['loadUi'];
let setInstanceState: ClientState['ui']['setInstanceState'];
let addLead: ClientState['writes']['addLead'];

beforeEach(() => {
    client = createClientState();
    ({ receive } = client.entities);
    ({ loadUi, setInstanceState } = client.ui);
    ({ addLead } = client.writes);
    installFixture();
});

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
const glyphs = glyphCatalog(config);
setCatalog(catalog);
setGlyphs(glyphs);
/** What every case here starts from, installed into the case's own client. */
function installFixture(): void {
    receive({ channel: 'config', version: 401, payload: { config, text: catalog, findings: [] } });
}

const schema = [
    { field: 'title', type: 'text', label: 'Title' },
    { field: 'inst', type: 'text', label: 'Institution' },
    { field: 'country', type: 'text', label: 'Country' },
    { field: 'typ', type: 'text', label: 'Type' },
    { field: 'focus', type: 'textarea', label: 'Focus' },
    { field: 'fit', type: 'textarea', label: 'Fit' },
    {
        field: 'status',
        type: 'select',
        options: ['open', 'applied', 'declined', 'dismissed'],
        label: 'Status'
    },
    { field: 'date', type: 'date', label: 'Date' },
    { field: 'deadline', type: 'text', label: 'Deadline' },
    { field: 'url', type: 'text', label: 'URL' }
];

const entries = [
    {
        title: '**Strong** role',
        inst: 'University One',
        country: 'Belgium',
        typ: 'postdoc',
        focus: 'Clinical **AI**',
        fit: 'strong because methods align',
        status: 'open',
        deadline: 'apply by 2099-01-02',
        url: 'jobs.example.org/strong'
    },
    {
        title: 'Undated role',
        inst: 'University Two',
        country: 'Netherlands',
        typ: 'faculty',
        focus: 'Machine learning',
        fit: '',
        status: 'open',
        url: 'ftp://example.org/not-shown'
    },
    {
        title: 'Applied role',
        inst: 'University Three',
        country: 'Luxembourg',
        typ: 'postdoc',
        focus: 'Imaging',
        fit: 'moderate fit',
        status: 'applied',
        deadline: '2099-12-20'
    },
    {
        title: 'Past role',
        inst: 'University Four',
        country: 'Belgium',
        typ: 'faculty',
        focus: 'Health data',
        fit: 'reach',
        status: 'open',
        deadline: '2000-01-01'
    },
    {
        title: 'Declined role',
        inst: 'University Five',
        country: 'Germany',
        typ: 'postdoc',
        focus: 'Signal processing',
        fit: 'strong on paper',
        status: 'declined',
        deadline: '2099-06-30'
    },
    {
        title: 'Dismissed role',
        inst: 'University Six',
        country: 'Belgium',
        typ: 'postdoc',
        focus: 'Wearables',
        fit: 'reach',
        status: 'dismissed',
        deadline: '2099-11-30'
    }
];

function instance(
    id: string,
    expiredOpen = false,
    runlogOpen = false,
    search = '',
    adding = false,
    showDismissed = false
): Instance {
    const value: Instance = { id, view: 'leads', state: {} };
    setInstanceState(id, { search, expiredOpen, runlogOpen, adding, showDismissed });
    return value;
}

function card(body: string, title: string): string {
    const marker = `data-lead="${title}"`;
    const at = body.indexOf(marker);
    expect(at).toBeGreaterThan(-1);
    const start = body.lastIndexOf('<div', at);
    const next = body.indexOf('data-lead=', at + marker.length);
    return body.slice(start, next < 0 ? body.length : next);
}

function hasAction(body: string, label: string): boolean {
    const buttons = body.match(/<button[\s\S]*?<\/button>/g) ?? [];
    return buttons.some((button) => button.includes(`>${label}</span>`));
}

/** A glyph-only control is named by its label and says more in its tooltip; assert both. */
function expectCompactControl(body: string, label: string, tip: string): void {
    const start = body.indexOf(`aria-label="${label}"`);
    expect(start).toBeGreaterThanOrEqual(0);
    const tooltip = /<span\b[^>]*role="tooltip"[^>]*>([^<]*)<\/span>/.exec(body.slice(start));
    expect(tooltip?.[1]).toBe(tip);
}

let feedVersion = 0;

function serve(body: Record<string, unknown>, _status = 200): void {
    receive({ channel: 'feeds', version: ++feedVersion, payload: feedsFixture('leads', body) });
}

beforeEach(() => loadUi({ getItem: () => null, setItem: noop }));
afterEach(() => vi.unstubAllGlobals());

describe('the Position Leads view', () => {
    it('hides the dismissed card, counts it on the toggle, and shows it under the toggle', () => {
        serve({
            ok: true,
            kind: 'leads',
            file: 'feeds/position-leads.yml',
            meta: {},
            schema,
            entries
        });

        const hidden = render(Leads, {
            context: clientContext(client),
            props: { instance: instance('leads-hidden', true) }
        }).body;
        // the instance hides the dismissed ones, which is what the count beside the control offers
        // back
        expect(hidden).not.toContain('data-lead="Dismissed role"');
        expect(hidden).toContain(catalog['leads.show_dismissed'].replace('{0}', '1'));

        const shown = render(Leads, {
            context: clientContext(client),
            props: { instance: instance('leads-shown', true, false, '', false, true) }
        }).body;
        expect(shown).toContain('data-lead="Dismissed role"');
        expect(shown).toContain(catalog['leads.hide_dismissed'].replace('{0}', '1'));
    });

    it('draws a dismissed card in the expired list, tagged by its status, with reopen and no dismiss', () => {
        serve({
            ok: true,
            kind: 'leads',
            file: 'feeds/position-leads.yml',
            meta: {},
            schema,
            entries
        });
        const body = render(Leads, {
            context: clientContext(client),
            props: { instance: instance('leads-dismissed', true, false, '', false, true) }
        }).body;
        const dropped = card(body, 'Dismissed role');
        expect(dropped).toMatch(/class="[^"]*expired/);
        expect(dropped).toContain('>dismissed</span>');
        expect(hasAction(dropped, catalog['leads.action.reopen'])).toBe(true);
        expect(body.indexOf('data-lead="Dismissed role"')).toBeGreaterThan(
            body.indexOf(catalog['leads.expired_sec'].replace('{0}', '4'))
        );
        // the lead is already dismissed, so it is offered reopen instead
        expect(dropped).not.toContain(`aria-label="${catalog['leads.action.dismiss']}"`);
    });

    it('draws the intro, controls, ordered live cards, details, and collapsed sections', () => {
        serve({
            ok: true,
            kind: 'leads',
            file: 'feeds/position-leads.yml',
            meta: { log: ['2026-09-12 **first** run', '2026-09-11 second run'] },
            schema,
            entries
        });
        const body = render(Leads, {
            context: clientContext(client),
            props: { instance: instance('leads-one') }
        }).body;
        expect(body).toMatch(/class="intro(?:\s|")/);
        expect(body).toContain('2 live');
        expect(body).toContain('3 expired');
        expect(body).toContain(catalog['leads.search']);
        expect(body).toContain(catalog['leads.add']);
        expect(body).toContain('<strong>Strong</strong> role');
        expect(body.indexOf('<strong>Strong</strong> role')).toBeLessThan(
            body.indexOf('Undated role')
        );
        expect(body).toContain('University One | Belgium');
        expect(body).toContain('Clinical <strong>AI</strong> - strong because methods align');
        expect(body).toContain('2099-01-02');
        expect(body).toContain(catalog['leads.posting']);
        // a posting link is drawn only for a scheme a browser opens, and ftp is not one
        expect(body).not.toContain('ftp://example.org/not-shown');
        // Revert: in posting of views/shared/forms/posting.ts, draw only a value that already
        // carries its scheme, and a posting written as `jobs.example.org/x` draws no link at all.
        expect(body).toContain('href="https://jobs.example.org/strong"');
        expect(body).toContain(catalog['leads.action.applied']);
        expect(body).toContain(catalog['leads.action.decline']);
        expect(body).toContain(catalog['leads.expired_sec'].replace('{0}', '3'));
        expect(body).toContain(catalog['leads.runlog']);
        // the instance keeps the expired section closed, and an applied lead is expired
        expect(body).not.toContain('Applied role');
        // and the run log is closed too, so its lines are not drawn
        expect(body).not.toContain('first</strong> run');
    });

    it('draws actioned and past-deadline cards newest first, and only six log lines', () => {
        serve({
            ok: true,
            kind: 'leads',
            file: 'feeds/position-leads.yml',
            meta: { log: Array.from({ length: 7 }, (_, at) => `log **${at + 1}**`) },
            schema,
            entries
        });
        const body = render(Leads, {
            context: clientContext(client),
            props: { instance: instance('leads-open', true, true) }
        }).body;
        expect(body.indexOf('Applied role')).toBeLessThan(body.indexOf('Past role'));
        expect(body).toContain('2099-12-20');
        expect(body).toContain(catalog['leads.action.reopen']);
        expect(body).toContain('log <strong>1</strong>');
        expect(body).toContain('log <strong>6</strong>');
        // the log is cut to six lines until the control opens the rest
        expect(body).not.toContain('log <strong>7</strong>');
        expect(body).toContain('show all 7 lines');
        expect(body).toContain('expired');
    });

    it('draws each card detail and only the actions allowed by that card status', () => {
        serve({
            ok: true,
            kind: 'leads',
            file: 'feeds/position-leads.yml',
            meta: {},
            schema,
            entries
        });
        const body = render(Leads, {
            context: clientContext(client),
            props: { instance: instance('leads-cards', true) }
        }).body;
        const open = card(body, '**Strong** role');
        const undated = card(body, 'Undated role');
        const applied = card(body, 'Applied role');

        expect(hasAction(open, catalog['leads.action.applied'])).toBe(true);
        expect(hasAction(open, catalog['leads.action.decline'])).toBe(true);
        expect(hasAction(open, catalog['leads.action.reopen'])).toBe(false);
        expectCompactControl(
            open,
            catalog['leads.action.dismiss'],
            catalog['leads.action.dismiss_tip']
        );
        expect(hasAction(open, catalog['project.action.del'])).toBe(true);
        expect(open).toContain('data-glyph="deadline"');
        expect(open).toContain('>Belgium</span>');
        expect(open).toContain('>postdoc</span>');
        expect(open).toContain('target="_blank"');
        expect(open).toContain(`>${catalog['leads.posting']}</span>`);

        expect(undated).toContain('--tone: var(--c-grey)');
        expect(undated).toContain(`>${catalog['leads.fit_none']}</span>`);
        expect(hasAction(undated, catalog['project.action.del'])).toBe(true);

        expect(applied).toMatch(/class="[^"]*expired/);
        expect(applied).toContain('>applied</span>');
        expect(hasAction(applied, catalog['leads.action.applied'])).toBe(false);
        expect(hasAction(applied, catalog['leads.action.decline'])).toBe(true);
        expect(hasAction(applied, catalog['leads.action.reopen'])).toBe(true);

        const declined = card(body, 'Declined role');
        expect(declined).toContain('>declined</span>');
        expect(hasAction(declined, catalog['leads.action.applied'])).toBe(true);
        expect(hasAction(declined, catalog['leads.action.decline'])).toBe(false);
        expect(hasAction(declined, catalog['leads.action.reopen'])).toBe(true);
        for (const title of [
            '**Strong** role',
            'Undated role',
            'Applied role',
            'Past role',
            'Declined role'
        ]) {
            expect(hasAction(card(body, title), catalog['project.action.del'])).toBe(true);
        }
    });

    it('offers the dismiss control on an open lead alone, never on a closed one', () => {
        serve({
            ok: true,
            kind: 'leads',
            file: 'feeds/position-leads.yml',
            meta: {},
            schema,
            entries
        });
        const body = render(Leads, {
            context: clientContext(client),
            props: { instance: instance('leads-dismissable', true, false, '', false, true) }
        }).body;
        const label = catalog['leads.action.dismiss'];
        expect(card(body, '**Strong** role')).toContain(`aria-label="${label}"`);
        for (const title of ['Applied role', 'Declined role', 'Dismissed role']) {
            // each of these is already out of the running, so none of them is offered the dismiss
            // control
            expect(card(body, title)).not.toContain(`aria-label="${label}"`);
        }
    });

    it('draws the ten schema controls in order when the instance holds the form open', () => {
        serve({
            ok: true,
            kind: 'leads',
            file: 'feeds/position-leads.yml',
            meta: {},
            schema,
            entries: []
        });
        const body = render(Leads, {
            context: clientContext(client),
            props: { instance: instance('leads-add', false, false, '', true) }
        }).body;
        const positions = schema.map((field) => body.indexOf(`aria-label="${field.label}"`));
        expect(positions.every((at) => at >= 0)).toBe(true);
        expect(positions).toEqual([...positions].sort((left, right) => left - right));
    });

    it('audits that uses the dedicated add callback for a new lead form', async () => {
        let request: Record<string, unknown> | null = null;
        vi.stubGlobal('fetch', (_url: string, init: RequestInit) => {
            request = JSON.parse(scalar(init.body)) as Record<string, unknown>;
            return Promise.resolve(
                new Response(JSON.stringify({ ok: true, changed: ['entries'], refused: [] }))
            );
        });
        await addFromForm(client.writes, 'leads', { title: 'New lead' }, addLead);
        expect(request).toEqual({ kind: 'lead-add', fields: { title: 'New lead' } });
    });

    it('omits the expired intro note when every lead is live', () => {
        serve({
            ok: true,
            kind: 'leads',
            file: 'feeds/position-leads.yml',
            meta: {},
            schema,
            entries: entries.slice(0, 2)
        });
        const body = render(Leads, {
            context: clientContext(client),
            props: { instance: instance('leads-live-only') }
        }).body;
        expect(body).toContain('2 live');
        // the feed carries live leads alone, so there is no expired section to hide
        expect(body).not.toContain('expired (hidden)');
    });

    it('draws no empty-state message when search alone hides every live card', () => {
        serve({
            ok: true,
            kind: 'leads',
            file: 'feeds/position-leads.yml',
            meta: {},
            schema,
            entries: entries.slice(0, 2)
        });
        const body = render(Leads, {
            context: clientContext(client),
            props: { instance: instance('leads-zero-search', false, false, 'does-not-match') }
        }).body;
        // nothing matches the search, so no card is drawn
        expect(body).not.toContain('data-lead=');
        // and the empty line is the search's own, not the one for a feed with no live lead
        expect(body).not.toContain('No live leads');
    });

    it('draws the empty and missing-file states', () => {
        serve({
            ok: true,
            kind: 'leads',
            file: 'feeds/position-leads.yml',
            meta: {},
            schema,
            entries: [{ title: 'Done', status: 'declined' }]
        });
        const empty = render(Leads, {
            context: clientContext(client),
            props: { instance: instance('leads-empty') }
        }).body;
        expect(empty).toContain('<code>/research-cockpit scout</code>');
        // the code span is drawn as markup, so its angle brackets are not escaped into the text
        expect(empty).not.toContain('&lt;code>');

        serve({
            ok: true,
            kind: 'leads',
            file: 'feeds/position-leads.yml',
            missing: true
        });
        expect(
            render(Leads, {
                context: clientContext(client),
                props: { instance: instance('leads-missing') }
            }).body
        ).toContain(catalog['leads.no_file']);
    });

    it('closes its toolbar, after its own controls, with the control over the feed file', () => {
        serve({
            ok: true,
            kind: 'leads',
            file: 'feeds/position-leads.yml',
            meta: { log: [] },
            entries: []
        });
        const body = render(Leads, {
            context: clientContext(client),
            props: { instance: instance('leads-source') }
        }).body;
        expect(body).toContain('data-source-root="hub"');
        expect(body).toContain(`data-source-path="${String(config.leads_file)}"`);
        expect(body).toContain(catalog['views.open_source']);
        expect(body).toContain(
            catalog['views.open_source_tip'].replace('{0}', String(config.leads_file))
        );
        // It is the view's way out rather than one of its actions, so it follows the add control.
        expect(body.indexOf('data-source-path')).toBeGreaterThan(
            body.indexOf(catalog['leads.add'])
        );
    });

    it('offers no such control while the feed says the file is not on this machine', () => {
        serve({ ok: true, kind: 'leads', file: 'feeds/position-leads.yml', missing: true });
        const body = render(Leads, {
            context: clientContext(client),
            props: { instance: instance('leads-no-source') }
        }).body;
        // the file is not on this machine, so there is no path for the source control to name
        expect(body).not.toContain('data-source-path');
    });
});
