// The Position Leads view rendered over a received feed with live, expired, undated, and run-log rows.

import { readFileSync } from 'node:fs';
import { scalar } from '../../src/lib/data/guards.ts';
import { render } from 'svelte/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Leads from '../../src/lib/views/Leads.svelte';
import { addFromForm } from '../../src/lib/views/shared/entry-form.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../src/lib/data/sources/config.ts';
import { receive } from '../../src/lib/state/entities.svelte.ts';
import { feedsFixture } from '../feeds-fixture.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import { loadUi, setInstanceState, setLeadDismissed } from '../../src/lib/state/ui.svelte.ts';
import { leadId } from '../../src/lib/state/leads.ts';
import { addLead } from '../../src/lib/state/writes.svelte.ts';
import type { Instance } from '../../src/lib/state/layout/index.ts';
import { noop } from '../doubles.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
const glyphs = glyphCatalog(config);
setCatalog(catalog);
setGlyphs(glyphs);
receive({ channel: 'config', version: 401, payload: { config, text: catalog, findings: [] } });

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
        options: ['open', 'applied', 'declined'],
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
        url: 'https://example.org/strong'
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

function expectHideControl(body: string, label: string): void {
    const start = body.indexOf(`aria-label="${label}"`);
    expect(start).toBeGreaterThanOrEqual(0);
    const tooltip = /<span\b[^>]*role="tooltip"[^>]*>([^<]*)<\/span>/.exec(body.slice(start));
    expect(tooltip?.[1]).toBe(label);
}

let feedVersion = 0;

function serve(body: Record<string, unknown>, _status = 200): void {
    receive({ channel: 'feeds', version: ++feedVersion, payload: feedsFixture('leads', body) });
}

beforeEach(() => loadUi({ getItem: () => null, setItem: noop }));
afterEach(() => vi.unstubAllGlobals());

describe('the Position Leads view', () => {
    it('passes both hide states through the control title prop', () => {
        const source = readFileSync(
            new URL('../../src/lib/views/leads/LeadCard.svelte', import.meta.url),
            'utf8'
        );
        expect(source).toMatch(
            /title=\{dismissed\s*\?\s*t\('leads\.action\.show_lead'\)\s*:\s*t\('leads\.action\.hide_lead'\)\}/
        );
    });

    it('hides dismissed cards, shows their count, and restores their card action under the toggle', () => {
        const dismissed = entries[0];
        setLeadDismissed(leadId(dismissed), true);
        setLeadDismissed('no-longer-in-the-feed', true);
        serve({
            ok: true,
            kind: 'leads',
            file: 'feeds/position-leads.yml',
            meta: {},
            schema,
            entries
        });

        const hidden = render(Leads, { props: { instance: instance('leads-hidden') } }).body;
        expect(hidden).not.toContain('data-lead="**Strong** role"');
        expect(hidden).toContain(catalog['leads.show_dismissed'].replace('{0}', '2'));

        const shown = render(Leads, {
            props: { instance: instance('leads-shown', false, false, '', false, true) }
        }).body;
        expect(shown).toContain('data-lead="**Strong** role"');
        expect(shown).toContain(catalog['leads.hide_dismissed'].replace('{0}', '2'));
        expectHideControl(card(shown, '**Strong** role'), catalog['leads.action.show_lead']);
    });

    it('keeps the live grid without the no-live message when every live card is dismissed', () => {
        const entry = entries[0];
        setLeadDismissed(leadId(entry), true);
        serve({
            ok: true,
            kind: 'leads',
            file: 'feeds/position-leads.yml',
            meta: {},
            schema,
            entries: [entry]
        });
        const body = render(Leads, { props: { instance: instance('all-dismissed') } }).body;
        expect(body).toMatch(/class="cards(?:\s|")/);
        expect(body).not.toContain('data-lead=');
        expect(body).not.toContain(catalog['leads.empty']);
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
        const body = render(Leads, { props: { instance: instance('leads-one') } }).body;
        expect(body).not.toContain('data-edit-source');
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
        expect(body).not.toContain('ftp://example.org/not-shown');
        expect(body).toContain(catalog['leads.action.applied']);
        expect(body).toContain(catalog['leads.action.decline']);
        expect(body).toContain(catalog['leads.expired_sec'].replace('{0}', '3'));
        expect(body).toContain(catalog['leads.runlog']);
        expect(body).not.toContain('Applied role');
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
            props: { instance: instance('leads-open', true, true) }
        }).body;
        expect(body.indexOf('Applied role')).toBeLessThan(body.indexOf('Past role'));
        expect(body).toContain('2099-12-20');
        expect(body).toContain(catalog['project.action.reopen']);
        expect(body).toContain('log <strong>1</strong>');
        expect(body).toContain('log <strong>6</strong>');
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
            props: { instance: instance('leads-cards', true) }
        }).body;
        const open = card(body, '**Strong** role');
        const undated = card(body, 'Undated role');
        const applied = card(body, 'Applied role');

        expect(hasAction(open, catalog['leads.action.applied'])).toBe(true);
        expect(hasAction(open, catalog['leads.action.decline'])).toBe(true);
        expect(hasAction(open, catalog['project.action.reopen'])).toBe(false);
        expectHideControl(open, catalog['leads.action.hide_lead']);
        expect(hasAction(open, catalog['project.action.del'])).toBe(true);
        expect(open).toContain(glyphs.deadline);
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
        expect(hasAction(applied, catalog['project.action.reopen'])).toBe(true);

        const declined = card(body, 'Declined role');
        expect(declined).toContain('>declined</span>');
        expect(hasAction(declined, catalog['leads.action.applied'])).toBe(true);
        expect(hasAction(declined, catalog['leads.action.decline'])).toBe(false);
        expect(hasAction(declined, catalog['project.action.reopen'])).toBe(true);
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
            props: { instance: instance('leads-add', false, false, '', true) }
        }).body;
        const positions = schema.map((field) => body.indexOf(`aria-label="${field.label}"`));
        expect(positions.every((at) => at >= 0)).toBe(true);
        expect(positions).toEqual([...positions].sort((left, right) => left - right));
    });

    it('uses the dedicated add callback for a new lead form', async () => {
        let request: Record<string, unknown> | null = null;
        vi.stubGlobal('fetch', (_url: string, init: RequestInit) => {
            request = JSON.parse(scalar(init.body)) as Record<string, unknown>;
            return Promise.resolve(
                new Response(JSON.stringify({ ok: true, changed: ['entries'], refused: [] }))
            );
        });
        await addFromForm('leads', { title: 'New lead' }, addLead);
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
        const body = render(Leads, { props: { instance: instance('leads-live-only') } }).body;
        expect(body).toContain('2 live');
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
            props: { instance: instance('leads-zero-search', false, false, 'does-not-match') }
        }).body;
        expect(body).not.toContain('data-lead=');
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
        const empty = render(Leads, { props: { instance: instance('leads-empty') } }).body;
        expect(empty).toContain('<code>/research-cockpit scout</code>');
        expect(empty).not.toContain('&lt;code>');

        serve({
            ok: true,
            kind: 'leads',
            file: 'feeds/position-leads.yml',
            missing: true
        });
        expect(render(Leads, { props: { instance: instance('leads-missing') } }).body).toContain(
            catalog['leads.no_file']
        );
    });
});
