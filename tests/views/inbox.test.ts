// The Inbox view rendered over a feed fixture with every kind, one triaged card, and a draft.

import { render } from 'svelte/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Inbox from '../../src/lib/views/Inbox.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../src/lib/data/sources/config.ts';
import { receive } from '../../src/lib/state/entities.svelte.ts';
import { refetch } from '../../src/lib/state/feeds.svelte.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import { setInstanceState } from '../../src/lib/state/ui.svelte.ts';
import type { Instance } from '../../src/lib/state/layout.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
const glyphs = glyphCatalog(config);
setCatalog(catalog);
setGlyphs(glyphs);
receive({ channel: 'config', version: 501, payload: { config, text: catalog, findings: [] } });

const entries = [
    {
        id: 'reply',
        sender: '**Ada**',
        subject: 'Reply subject',
        kind: 'reply',
        age: '1d',
        what: 'Reply **needed**',
        draft: 'Dear Ada,\n\nDraft reply.',
        url: 'https://mail.google.com/reply'
    },
    {
        id: 'action',
        sender: 'Bob',
        subject: 'Action subject',
        kind: 'action',
        age: '2d',
        what: 'Upload form'
    },
    {
        id: 'info',
        sender: '',
        subject: 'Info subject',
        kind: 'unknown',
        what: 'For awareness'
    },
    {
        id: 'done',
        sender: 'Cara',
        subject: 'Done subject',
        kind: 'reply',
        triaged: true
    }
];

function instance(id: string, triagedOpen = false, search = ''): Instance {
    const value: Instance = { id, view: 'inbox', state: {} };
    setInstanceState(id, { search, triagedOpen });
    return value;
}

function card(body: string, id: string): string {
    const marker = `data-inbox="${id}"`;
    const at = body.indexOf(marker);
    expect(at).toBeGreaterThan(-1);
    const start = body.lastIndexOf('<div', at);
    const next = body.indexOf('data-inbox=', at + marker.length);
    return body.slice(start, next < 0 ? body.length : next);
}

function hasAction(body: string, label: string): boolean {
    const buttons = body.match(/<button[\s\S]*?<\/button>/g) ?? [];
    return buttons.some((button) => button.includes(label));
}

function serve(body: Record<string, unknown>, status = 200): void {
    vi.stubGlobal('fetch', () =>
        Promise.resolve(
            new Response(JSON.stringify(body), {
                status,
                headers: { 'content-type': 'application/json' }
            })
        )
    );
}

afterEach(() => vi.unstubAllGlobals());

describe('the Inbox view', () => {
    it('draws meta, search, ordered live sections, card details, and collapsed triaged cards', async () => {
        serve({
            ok: true,
            kind: 'inbox',
            file: 'feeds/inbox.yml',
            meta: { run: '2026-09-12' },
            entries
        });
        await refetch('inbox');
        const body = render(Inbox, { props: { instance: instance('inbox-one') } }).body;
        expect(body).toContain('2026-09-12');
        expect(body).toContain(catalog['sf.inbox_triaged_suffix'].replace('{0}', '1'));
        expect(body).toContain(catalog['sf.inbox_search']);
        const headings = [
            `${catalog['sf.inbox_sec_reply']} (1)`,
            `${catalog['sf.inbox_sec_action']} (1)`,
            `${catalog['sf.inbox_sec_info']} (1)`
        ];
        const headingIndexes = headings.map((heading) => body.indexOf(heading));
        expect(headingIndexes.every((at) => at >= 0)).toBe(true);
        expect(headingIndexes).toEqual([...headingIndexes].sort((a, b) => a - b));
        const reply = card(body, 'reply');
        expect(reply).toContain('<strong>Ada</strong>');
        expect(reply).toContain('Reply subject');
        expect(reply).toContain('Reply <strong>needed</strong>');
        expect(reply).toContain('1d');
        expect(reply).toContain(catalog['sf.inbox_reply']);
        expect(reply).toContain(catalog['sf.show_draft']);
        expect(reply).not.toContain('Dear Ada');
        expect(reply).toContain('target="_blank"');
        expect(reply).toContain(catalog['sf.open_gmail']);
        expect(reply).toContain('href="https://mail.google.com/reply"');
        expect(hasAction(reply, catalog['sf.inbox_triaged'])).toBe(true);
        expect(reply).toContain(String(glyphs.done));
        expect(reply).toContain(catalog['sf.inbox_triage_tip']);
        expect(card(body, 'action')).toContain(catalog['sf.inbox_action']);
        expect(card(body, 'info')).toContain(catalog['sf.inbox_info']);
        expect(card(body, 'info')).toContain('Info subject');
        expect(body).toContain(`${catalog['sf.inbox_triaged_sec']} (1)`);
        expect(body).not.toContain('data-inbox="done"');
    });

    it('draws the open triaged section with restore and filters all cards', async () => {
        serve({
            ok: true,
            kind: 'inbox',
            file: 'feeds/inbox.yml',
            meta: { run: '2026-09-12' },
            entries
        });
        await refetch('inbox');
        const open = render(Inbox, {
            props: { instance: instance('inbox-open', true) }
        }).body;
        const done = card(open, 'done');
        expect(hasAction(done, catalog['sf.inbox_restore'])).toBe(true);
        expect(done).toContain(String(glyphs.refresh));
        expect(done).toContain(catalog['sf.inbox_restore_tip']);

        const searched = render(Inbox, {
            props: { instance: instance('inbox-search', true, 'upload bob') }
        }).body;
        expect(searched).toContain('data-inbox="action"');
        expect(searched).not.toContain('data-inbox="reply"');
        expect(searched).not.toContain('data-inbox="info"');
        expect(searched).not.toContain('data-inbox="done"');
    });

    it('omits an empty kind section', async () => {
        serve({
            ok: true,
            kind: 'inbox',
            file: 'feeds/inbox.yml',
            meta: { run: '2026-09-12' },
            entries: [entries[0], entries[2]]
        });
        await refetch('inbox');
        const body = render(Inbox, { props: { instance: instance('inbox-no-action') } }).body;
        expect(body).toContain(`${catalog['sf.inbox_sec_reply']} (1)`);
        expect(body).not.toContain(catalog['sf.inbox_sec_action']);
        expect(body).toContain(`${catalog['sf.inbox_sec_info']} (1)`);
    });

    it('uses the subject and then the catalog thread label when the sender is empty', async () => {
        serve({
            ok: true,
            kind: 'inbox',
            file: 'feeds/inbox.yml',
            meta: { run: '2026-09-12' },
            entries: [
                entries[2],
                { id: 'thread', sender: '', subject: '', kind: 'info', what: 'No names' },
                { id: 'unsafe', sender: 'S', kind: 'info', url: 'javascript:alert(1)' }
            ]
        });
        await refetch('inbox');
        const body = render(Inbox, { props: { instance: instance('inbox-fallbacks') } }).body;
        expect(card(body, 'info')).toMatch(/<h3[^>]*>[\s\S]*?Info subject[\s\S]*?<\/h3>/);
        expect(card(body, 'thread')).toContain(catalog['sf.inbox_thread']);
        expect(card(body, 'unsafe')).not.toContain('javascript:');
        expect(card(body, 'unsafe')).not.toContain(catalog['sf.open_gmail']);
    });

    it('draws the clear, missing-file, and feed-error states', async () => {
        serve({
            ok: true,
            kind: 'inbox',
            file: 'feeds/inbox.yml',
            meta: { run: '2026-09-12' },
            entries: [{ ...entries[3] }]
        });
        await refetch('inbox');
        const clear = render(Inbox, { props: { instance: instance('inbox-clear') } }).body;
        expect(clear).toContain(catalog['sf.inbox_clear']);
        expect(clear).toContain(String(glyphs.done));

        serve({ ok: true, kind: 'inbox', file: 'feeds/inbox.yml', missing: true });
        await refetch('inbox');
        const missing = render(Inbox, {
            props: { instance: instance('inbox-missing') }
        }).body;
        expect(missing).toContain('No inbox file');
        expect(missing).toContain('<code>');
        expect(missing).not.toContain('&lt;code');
        expect(missing).toContain('/research-cockpit inbox');

        serve({ ok: false, kind: 'inbox', file: 'feeds/inbox.yml', error: 'bad YAML' }, 500);
        await refetch('inbox');
        const error = render(Inbox, { props: { instance: instance('inbox-error') } }).body;
        expect(error).toContain('Could not read feeds/inbox.yml: bad YAML');
        expect(error).not.toContain(catalog['sf.inbox_no_file']);
    });
});
