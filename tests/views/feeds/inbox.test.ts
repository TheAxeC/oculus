// The Inbox view rendered over a received `inbox` payload: the four sections, the account rows, the
// head, the card's note and draft editor, and the two confirmations the writes sit behind.
//
// Nothing here reaches a provider or a route: the payload is put on the channel by hand and the two
// writes are asserted through the markup they are pressed from.

import { readFileSync } from 'node:fs';
import { compile } from 'svelte/compiler';
import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import Inbox from '../../../src/lib/views/feeds/inbox/Inbox.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import { archiveConfirm, recipientOf, sendConfirm } from '../../../src/lib/state/feeds/inbox.ts';
import type { InboxPayload, InboxThread } from '../../../src/lib/data/model/index.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';
import { barOf, headerOf } from '../shared/pane-parts.ts';

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
        // a triaged thread sits under the triaged section, which is closed
        expect(body).not.toContain('data-inbox="google-work-done"');
    });

    it('draws one card with its note, its snippet, its age and its two controls', () => {
        serve();
        const reply = card(draw('inbox-card'), 'reply');
        // The sender is plain text: the Markdown of a From line is drawn as its own characters.
        expect(reply).toContain('**Ada**');
        // A mail header is not Markdown, so its asterisks are never turned into bold.
        expect(reply).not.toContain('<strong>Ada</strong>');
        expect(reply).toContain('reply subject');
        expect(reply).toContain('Reply <strong>needed</strong>');
        expect(reply).toContain('the snippet of reply');
        // the draft editor is closed, so the draft's own text is not drawn
        expect(reply).not.toContain('Beste Ada');
        expect(hasAction(reply, catalog['inbox.show_draft'])).toBe(true);
        expect(hasAction(reply, catalog['inbox.open_provider'])).toBe(true);
        expect(hasAction(reply, catalog['inbox.triaged'])).toBe(true);
        expect(reply).toContain(catalog['inbox.triage_tip']);
    });

    it('says how many messages an unsorted thread holds', () => {
        serve();
        const unsorted = card(draw('inbox-unsorted'), 'unsorted');
        expect(unsorted).toContain(catalog['inbox.messages'].replace('{0}', '3'));
    });

    it('opens one thread draft editor over the note, with Save, Send and Archive', () => {
        serve();
        const closed = draw('inbox-draft-closed');
        expect(closed).toContain(catalog['inbox.show_draft']);
        // the draft editor is closed, so the draft's own text is not drawn
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
        // and the archive confirmation is drawn only once it has been asked for too
        expect(open).not.toContain(catalog['inbox.archive_confirm'].split('{0}')[0]);
        // The card's other editors stay closed, so one open editor is one thread's.
        expect(card(open, 'action')).not.toContain(catalog['inbox.draft_label']);
    });

    it('audits that names the address a reply reaches in the confirmation, not the sender it came from', () => {
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
        // the card is the one outside the editor, so the draft label is not on it
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
                { provider: 'google', label: 'work', status: 'not-connected' },
                { provider: 'microsoft', label: 'uni', status: 'not-connected', needsSetup: true }
            ],
            threads: []
        });
        const body = draw('inbox-accounts');
        expect(body).toContain('data-mail-account="google-work"');
        expect(body).toContain(catalog['accounts.not_connected']);
        expect(hasAction(body, catalog['accounts.connect'])).toBe(true);
        // The account whose provider has no client half points at the setup page instead, naming
        // the provider as the setup page does, while its row keeps the mail word for it.
        expect(body).toContain(catalog['accounts.needs_setup'].replace('{0}', 'Microsoft'));
        expect(hasAction(body, catalog['accounts.open_setup'].replace('{0}', 'Microsoft'))).toBe(
            true
        );
        expect(body).toContain(catalog['inbox.provider_microsoft']);
        expect(body).toContain(catalog['inbox.clear']);
    });

    it('says a machine with no mail account is unconfigured, offers Add and draws no section', () => {
        serve({ status: 'unconfigured', accounts: [], threads: [] });
        const body = draw('inbox-none');
        expect(body).toContain(catalog['accounts.empty_mail']);
        expect(body).toContain(catalog['inbox.unconfigured']);
        // The head carries the state word and the body the sentence, so the sentence is drawn once.
        expect(body.split(catalog['accounts.empty_mail']).length).toBe(2);
        // Add account is the header's icon, named by its words, and the empty state's action.
        const header = body.slice(body.indexOf('<header'), body.indexOf('</header>'));
        expect(header).toContain(`aria-label="${catalog['accounts.add']}"`);
        expect(body).toMatch(
            new RegExp(
                `<button[^>]*class="tool[^"]*\\bsmall\\b[^"]*"[^>]*>(?:(?!</button>)[\\s\\S])*${catalog['accounts.add']}`
            )
        );
        // no account is configured, so there is no thread to put in a section
        expect(body).not.toContain(catalog['inbox.sec_reply']);
    });

    it('opens the triaged section with restore, and filters every section by the search', () => {
        serve();
        const open = draw('inbox-open', true);
        const done = card(open, 'done');
        expect(hasAction(done, catalog['inbox.restore'])).toBe(true);
        expect(done).toContain('data-glyph="refresh"');
        expect(done).toContain(catalog['inbox.restore_tip']);

        const searched = draw('inbox-search', true, 'upload bob');
        expect(searched).toContain('data-inbox="google-work-action"');
        // the search holds the cards whose words it matches, and this thread's do not
        expect(searched).not.toContain('data-inbox="google-work-reply"');
        // nor the card of the second thread, whose words the search does not match either
        expect(searched).not.toContain('data-inbox="google-work-info"');
        // nor the card of the triaged thread, for the same reason
        expect(searched).not.toContain('data-inbox="google-work-done"');
    });

    it('omits an empty section and says the plate is clear when nothing is on it', () => {
        serve({ threads: [THREADS[0]] });
        const body = draw('inbox-one-kind');
        expect(body).toContain(`${catalog['inbox.sec_reply']} (1)`);
        // only one kind of thread is on the plate, so the other sections are not drawn
        expect(body).not.toContain(catalog['inbox.sec_action']);
        // and the plate is not clear either, since that one thread is on it
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
        // the plate is read from the mail account rather than from a file, so there is no source to
        // open
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

/** The markup of one card's heading, which is where the title and the sender's address are. */
function heading(markup: string): string {
    return /<h3[^>]*class="title[^"]*"[^>]*>[\s\S]*?<\/h3>/.exec(markup)?.[0] ?? '';
}

/** Whether a card draws a tag whose words are exactly these. */
function hasTag(markup: string, words: string): boolean {
    return new RegExp(
        `class="tag[^"]*"[^>]*>(?:<!--[^>]*-->|\\s)*<span class="label[^"]*">${words}</span>`
    ).test(markup);
}

/** The markup of a card's control row, the meta row under its title. */
function controlRow(markup: string): string {
    const at = markup.search(/class="meta[ "]/);
    expect(at).toBeGreaterThan(-1);
    const body = markup.slice(at).search(/class="body[ "]/);
    return markup.slice(at, body < 0 ? markup.length : at + body);
}

describe('the Inbox card', () => {
    it("titles a card with the sender's display name as text, the address muted after it", () => {
        serve({ threads: [thread('sparcly', { sender: 'Sparcly.ai <noreply@sparcly.ai>' })] });
        const drawn = card(draw('inbox-sender'), 'sparcly');
        const title = heading(drawn);
        expect(title).toContain('Sparcly.ai');
        // The title is words to read rather than an address to write to, so it links nowhere.
        expect(drawn).not.toContain('mailto:');
        expect(title).toMatch(/<span class="address[^"]*">noreply@sparcly\.ai<\/span>/);
        // The whole From line is the title's tooltip, its words in place until the bubble shows.
        expect(title).toMatch(
            /class="words"[^>]*hidden[^>]*>Sparcly\.ai &lt;noreply@sparcly\.ai><\/span>/
        );
    });

    it('titles a card whose From line has no display name with the address', () => {
        serve({ threads: [thread('bare-from', { sender: 'axel@x.be' })] });
        const title = heading(card(draw('inbox-bare'), 'bare-from'));
        expect(title).toContain('axel@x.be');
        // With no display name the address is the title itself, so it is not repeated beside it.
        expect(title).not.toContain('class="address');
        // and it stays words to read, linking nowhere, as a named sender's title does
        expect(title).not.toContain('mailto:');
    });

    it('draws the subject as the characters it holds, with no emphasis and no link', () => {
        serve({ threads: [thread('marked', { subject: '*Review* [x](y)' })] });
        const drawn = card(draw('inbox-subject'), 'marked');
        expect(drawn).toMatch(/<p class="subject[^"]*">\*Review\* \[x\]\(y\)<\/p>/);
        // A subject is not Markdown, so its asterisks are never turned into emphasis
        expect(drawn).not.toContain('<em>');
        // and its brackets are never turned into a link.
        expect(drawn).not.toContain('<a ');
    });

    it('draws the kind tag on a triaged card alone', () => {
        serve();
        const body = draw('inbox-kinds', true);
        expect(hasTag(card(body, 'reply'), catalog['inbox.reply'])).toBe(false);
        expect(hasTag(card(body, 'unsorted'), catalog['inbox.unsorted'])).toBe(false);
        expect(hasTag(card(body, 'done'), catalog['inbox.reply'])).toBe(true);
    });

    it('draws the account tag only while more than one mail account is configured', () => {
        serve();
        expect(hasTag(card(draw('inbox-one-account'), 'reply'), 'work')).toBe(false);
        serve({
            accounts: [
                { provider: 'google', label: 'work', status: 'connected' },
                { provider: 'microsoft', label: 'uni', status: 'connected' }
            ],
            threads: [
                THREADS[0],
                thread('outlook', { id: 'microsoft-uni-outlook', account: 'microsoft-uni' })
            ]
        });
        const body = draw('inbox-two-accounts');
        expect(hasTag(card(body, 'reply'), 'work')).toBe(true);
        const at = body.indexOf('data-inbox="microsoft-uni-outlook"');
        expect(at).toBeGreaterThan(-1);
        expect(hasTag(body.slice(body.lastIndexOf('<div', at)), 'uni')).toBe(true);
    });

    it('puts Draft reply and the provider control on the control row as compact controls', () => {
        serve();
        const row = controlRow(card(draw('inbox-row'), 'reply'));
        for (const label of [catalog['inbox.show_draft'], catalog['inbox.open_provider']]) {
            expect(row).toMatch(
                new RegExp(`<button[^>]*class="tool[^"]*compact[^"]*"[^>]*aria-label="${label}"`)
            );
        }
        const whole = card(draw('inbox-row-whole'), 'reply');
        // The provider's page is reached from the row's control, so no full-width line is drawn
        // for it under the card's text.
        expect(whole).not.toContain('class="provider');
        // nor a paragraph of its own anywhere on the card
        expect(whole).not.toContain('<p class="provider');
    });

    it('puts the search in the bar and draws no header toolbar', () => {
        serve();
        const body = draw('inbox-bar');
        const header = headerOf(body);
        const bar = barOf(body);
        expect(bar).toMatch(/<input class="search[^"]*\bfill\b/);
        // the header holds the two account actions as bare icons, and nothing else
        const tools = header.match(/<button[^>]*class="(?:tool|opener)[^"]*"[^>]*>/g) ?? [];
        expect(tools.length).toBe(2);
        for (const tool of tools) expect(tool).toMatch(/\bbare\b/);
        // a search box is a control of the bar, and the header holds icon actions only
        expect(header).not.toContain('class="search');
    });

    it('draws the four card controls in one box the card reveals', () => {
        serve();
        const row = controlRow(card(draw('inbox-reveal'), 'reply'));
        const at = row.indexOf('class="controls');
        expect(at).toBeGreaterThan(-1);
        const box = row.slice(at);
        const labels = [...box.matchAll(/aria-label="([^"]*)"/g)].map((found) => found[1]);
        expect(labels).toEqual([
            catalog['inbox.show_draft'],
            catalog['inbox.open_provider'],
            catalog['inbox.archive'],
            catalog['inbox.triaged']
        ]);
        // the age and the tags stay outside the box, so they are drawn at rest
        expect(row.slice(0, at)).toContain('class="age');
    });

    it('audits that the card controls are transparent at rest and follow the card', () => {
        const source = readFileSync('src/lib/views/feeds/inbox/InboxCard.svelte', 'utf8');
        const css =
            compile(source, { filename: 'InboxCard.svelte', css: 'external' }).css?.code ?? '';
        const rule = /\.controls[^{]*\{([^}]*)\}/.exec(css)?.[1] ?? '';
        expect(rule).toContain('opacity: var(--card-reveal)');
        expect(rule).toContain('transition: opacity 120ms ease-out');
        // a hidden control keeps its box, so Tab still reaches it
        expect(rule).not.toContain('display: none');
        // a hidden control keeps its place in the tab order and in the layout
        expect(rule).not.toContain('visibility');
    });

    it('audits that a section heading is an uppercase label of weight 700', () => {
        const source = readFileSync('src/lib/views/feeds/inbox/Inbox.svelte', 'utf8');
        const css = compile(source, { filename: 'Inbox.svelte', css: 'external' }).css?.code ?? '';
        const rule = /\.group[^{]*h3[^{]*\{([^}]*)\}/.exec(css)?.[1] ?? '';
        expect(rule).toContain('font-weight: 700');
        expect(rule).toContain('text-transform: uppercase');
    });

    it('audits that the cards are one column in reading order', () => {
        const source = readFileSync('src/lib/views/feeds/inbox/Inbox.svelte', 'utf8');
        const css = compile(source, { filename: 'Inbox.svelte', css: 'external' }).css?.code ?? '';
        const rule = /\.cards[^{]*\{([^}]*)\}/.exec(css)?.[1] ?? '';
        expect(rule).not.toBe('');
        // One column reads in order, so the rule fills no row with as many cards as fit
        expect(rule).not.toContain('auto-fill');
        // and sets no columns at all.
        expect(rule).not.toContain('grid-template-columns');
    });
});
