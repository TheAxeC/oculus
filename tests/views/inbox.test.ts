// The Inbox view rendered over a received `inbox` payload: the four sections, the account rows, the
// head, the card's note and draft editor, and the two confirmations the writes sit behind.
//
// Nothing here reaches a provider or a route: the payload is put on the channel by hand and the two
// writes are asserted through the markup they are pressed from.

import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import Inbox from '../../src/lib/views/Inbox.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import { archiveConfirm, recipientOf, sendConfirm } from '../../src/lib/state/inbox.ts';
import type { InboxPayload, InboxThread } from '../../src/lib/data/model.ts';
import type { Instance } from '../../src/lib/state/layout/index.ts';
import { clientContext, createClientState, type ClientState } from '../client.ts';

let client: ClientState;
let receive: ClientState['entities']['receive'];
let setInstanceState: ClientState['ui']['setInstanceState'];

beforeEach(() => {
    client = createClientState();
    ({ receive } = client.entities);
    ({ setInstanceState } = client.ui);
    installFixture();
});

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
const glyphs = glyphCatalog(config);
setCatalog(catalog);
setGlyphs(glyphs);

/** What every case here starts from, installed into the case's own client. */
function installFixture(): void {
    receive({ channel: 'config', version: 501, payload: { config, text: catalog, findings: [] } });
}

function thread(
    id: string,
    fields: Omit<Partial<InboxThread>, 'triage'> & {
        triage?: Partial<InboxThread['triage']>;
    } = {}
): InboxThread {
    return {
        id: `google-work-${id}`,
        account: 'google-work',
        provider: 'google',
        sender: 'Someone',
        replyTo: 'Someone',
        subject: `${id} subject`,
        received: '2026-09-15T12:00:00.000Z',
        snippet: `the snippet of ${id}`,
        messages: 1,
        ...fields,
        triage: { triaged: false, ...(fields.triage ?? {}) }
    };
}

const THREADS: InboxThread[] = [
    thread('reply', {
        sender: '**Ada**',
        replyTo: '**Ada**',
        url: 'https://mail.google.com/mail/u/0/#inbox/reply',
        triage: { kind: 'reply', what: 'Reply **needed**', draft: 'Beste Ada,\n\nGraag.' }
    }),
    thread('action', { sender: 'Bob', triage: { kind: 'action', what: 'Upload form' } }),
    thread('info', { sender: 'Cara', triage: { kind: 'info', what: 'For awareness' } }),
    thread('unsorted', { sender: 'Eve', messages: 3 }),
    thread('done', { sender: 'Dan', triage: { kind: 'reply', triaged: true } })
];

let version = 0;

function serve(body: Partial<InboxPayload> = {}): void {
    const payload: InboxPayload = {
        status: 'ok',
        accounts: [{ provider: 'google', label: 'work', status: 'connected' }],
        threads: THREADS,
        updated: '2026-09-16T12:00:00.000Z',
        pollMin: 10,
        retryMin: 2,
        notesRun: '2026-09-15',
        ...body
    };
    receive({ channel: 'inbox', version: ++version, payload });
}

function instance(id: string, triagedOpen = false, search = '', drafts: string[] = []): Instance {
    const value: Instance = { id, view: 'inbox', state: {} };
    setInstanceState(id, { search, triagedOpen, drafts });
    return value;
}

function draw(id: string, triagedOpen = false, search = '', drafts: string[] = []): string {
    return render(Inbox, {
        context: clientContext(client),
        props: { instance: instance(id, triagedOpen, search, drafts) }
    }).body;
}

function card(body: string, id: string): string {
    const marker = `data-inbox="google-work-${id}"`;
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

describe('the Inbox view', () => {
    it('draws the head, the search and the four sections in order', () => {
        serve();
        const body = draw('inbox-one');
        expect(body).toContain(catalog['inbox.live']);
        expect(body).toContain(catalog['inbox.every'].replace('{0}', '10'));
        expect(hasAction(body, catalog['inbox.refresh_now'])).toBe(true);
        expect(body).toContain(catalog['inbox.search']);
        const headings = [
            `${catalog['inbox.sec_unsorted']} (1)`,
            `${catalog['inbox.sec_reply']} (1)`,
            `${catalog['inbox.sec_action']} (1)`,
            `${catalog['inbox.sec_info']} (1)`
        ];
        const at = headings.map((heading) => body.indexOf(heading));
        expect(at.every((one) => one >= 0)).toBe(true);
        expect(at).toEqual([...at].sort((one, two) => one - two));
        expect(body).toContain(`${catalog['inbox.triaged_sec']} (1)`);
        expect(body).not.toContain('data-inbox="google-work-done"');
    });

    it('draws one card with its note, its snippet, its age, its account and its link', () => {
        serve();
        const reply = card(draw('inbox-card'), 'reply');
        expect(reply).toContain('<strong>Ada</strong>');
        expect(reply).toContain('reply subject');
        expect(reply).toContain('Reply <strong>needed</strong>');
        expect(reply).toContain('the snippet of reply');
        expect(reply).toContain(catalog['inbox.reply']);
        expect(reply).toContain('work');
        expect(reply).toContain(catalog['inbox.show_draft']);
        expect(reply).not.toContain('Beste Ada');
        expect(reply).toContain('target="_blank"');
        expect(reply).toContain(catalog['inbox.open_provider']);
        expect(reply).toContain('href="https://mail.google.com/mail/u/0/#inbox/reply"');
        expect(hasAction(reply, catalog['inbox.triaged'])).toBe(true);
        expect(reply).toContain(catalog['inbox.triage_tip']);
    });

    it('marks an unsorted thread as unsorted and says how many messages it holds', () => {
        serve();
        const unsorted = card(draw('inbox-unsorted'), 'unsorted');
        expect(unsorted).toContain(catalog['inbox.unsorted']);
        expect(unsorted).toContain(catalog['inbox.messages'].replace('{0}', '3'));
    });

    it('opens one thread draft editor over the note, with Save, Send and Archive', () => {
        serve();
        const closed = draw('inbox-draft-closed');
        expect(closed).toContain(catalog['inbox.show_draft']);
        expect(closed).not.toContain('Beste Ada');

        const open = draw('inbox-draft', false, '', ['google-work-reply']);
        const reply = card(open, 'reply');
        expect(reply).toContain('Beste Ada');
        expect(reply).toContain(catalog['inbox.draft_label']);
        for (const label of [
            catalog['inbox.save_draft'],
            catalog['inbox.send'],
            catalog['inbox.archive']
        ]) {
            expect(hasAction(reply, label)).toBe(true);
        }
        // Neither write happens on a press of its control: each opens a confirmation, which is
        // drawn only once it has been asked for, so the card carries neither confirmation's words.
        expect(open).not.toContain(catalog['inbox.send_confirm'].split('{0}')[0]);
        expect(open).not.toContain(catalog['inbox.archive_confirm'].split('{0}')[0]);
        // The card's other editors stay closed, so one open editor is one thread's.
        expect(card(open, 'action')).not.toContain(catalog['inbox.draft_label']);
    });

    it('names the address a reply reaches in the confirmation, not the sender it came from', () => {
        const desk = thread('desk', {
            sender: 'Ada <ada@example.invalid>',
            replyTo: 'Journal desk <desk@example.invalid>'
        });
        expect(sendConfirm(desk, 'work')).toBe(
            catalog['inbox.send_confirm']
                .replace('{0}', 'Journal desk <desk@example.invalid>')
                .replace('{1}', 'work')
        );
        expect(archiveConfirm(desk, 'work')).toContain('Journal desk <desk@example.invalid>');
        // A thread whose newest message names no reply address falls back to its sender.
        expect(
            recipientOf(thread('plain', { sender: 'Ada <ada@example.invalid>', replyTo: '' }))
        ).toBe('Ada <ada@example.invalid>');
        expect(recipientOf(thread('bare', { sender: '', replyTo: '' }))).toBe(
            catalog['inbox.thread']
        );
    });

    it('offers Archive on the card itself, outside the draft editor', () => {
        serve();
        const closed = card(draw('inbox-archive'), 'action');
        expect(closed).not.toContain(catalog['inbox.draft_label']);
        expect(hasAction(closed, catalog['inbox.archive'])).toBe(true);
        expect(closed).toContain(catalog['inbox.archive_tip']);
        // Send stays with the draft it sends, so a closed card offers it nowhere.
        expect(hasAction(closed, catalog['inbox.send'])).toBe(false);
    });

    it('draws the account rows with the Connect control while an account is not connected', () => {
        serve({
            status: 'ok',
            accounts: [
                {
                    provider: 'google',
                    label: 'work',
                    status: 'not-connected',
                    hint: '/fixture/mail/google-work.json'
                }
            ],
            threads: []
        });
        const body = draw('inbox-accounts');
        expect(body).toContain('data-mail-account="google-work"');
        expect(body).toContain(catalog['inbox.not_connected']);
        expect(hasAction(body, catalog['inbox.connect'])).toBe(true);
        expect(body).toContain(
            catalog['inbox.needs_file'].replace('{0}', '/fixture/mail/google-work.json')
        );
        expect(body).toContain(catalog['inbox.clear']);
    });

    it('says a machine with no mail account is unconfigured and draws no section', () => {
        serve({ status: 'unconfigured', accounts: [], threads: [] });
        const body = draw('inbox-none');
        expect(body).toContain(catalog['inbox.no_accounts']);
        expect(body).not.toContain(catalog['inbox.sec_reply']);
    });

    it('opens the triaged section with restore, and filters every section by the search', () => {
        serve();
        const open = draw('inbox-open', true);
        const done = card(open, 'done');
        expect(hasAction(done, catalog['inbox.restore'])).toBe(true);
        expect(done).toContain(glyphs.refresh);
        expect(done).toContain(catalog['inbox.restore_tip']);

        const searched = draw('inbox-search', true, 'upload bob');
        expect(searched).toContain('data-inbox="google-work-action"');
        expect(searched).not.toContain('data-inbox="google-work-reply"');
        expect(searched).not.toContain('data-inbox="google-work-info"');
        expect(searched).not.toContain('data-inbox="google-work-done"');
    });

    it('omits an empty section and says the plate is clear when nothing is on it', () => {
        serve({ threads: [THREADS[0]] });
        const body = draw('inbox-one-kind');
        expect(body).toContain(`${catalog['inbox.sec_reply']} (1)`);
        expect(body).not.toContain(catalog['inbox.sec_action']);
        expect(body).not.toContain(catalog['inbox.clear']);

        serve({ threads: [THREADS[4]] });
        const clear = draw('inbox-clear');
        expect(clear).toContain(catalog['inbox.clear']);
    });

    it('falls back to the subject and then to the catalog thread label for an empty sender', () => {
        serve({
            threads: [
                thread('named', { sender: '', subject: 'The subject alone' }),
                thread('bare', { sender: '', subject: '' })
            ]
        });
        const body = draw('inbox-fallbacks');
        expect(card(body, 'named')).toMatch(/<h3[^>]*>[\s\S]*?The subject alone[\s\S]*?<\/h3>/);
        expect(card(body, 'bare')).toContain(catalog['inbox.thread']);
    });

    it('offers no control over a feed file, since the plate is not read from one', () => {
        serve();
        const body = draw('inbox-no-source');
        expect(body).not.toContain('data-source-path');
    });

    it('says on the head why the triage notes could not be read', () => {
        serve({ notesError: '/fixture/mail/triage.json is not JSON' });
        const body = draw('inbox-notes-error');
        expect(body).toContain(
            catalog['inbox.notes_error'].replace('{0}', '/fixture/mail/triage.json is not JSON')
        );
    });

    it('draws the state word and the shortened cadence while a provider is refusing', () => {
        serve({
            status: 'error',
            accounts: [
                {
                    provider: 'google',
                    label: 'work',
                    status: 'error',
                    hint: 'google: 401 invalid_grant'
                }
            ]
        });
        const body = draw('inbox-error');
        expect(body).toContain(catalog['inbox.error']);
        expect(body).toContain(catalog['inbox.retrying'].replace('{0}', '2'));
        expect(body).toContain('google: 401 invalid_grant');
    });
});
