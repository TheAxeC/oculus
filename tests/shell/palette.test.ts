// The shell palette rendered closed, as search results, and as its command list. The test installs
// the same state stores and view registry production reads, without a socket or browser.

import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Palette from '../../src/lib/shell/Palette.svelte';
import UpdateTray from '../../src/lib/shell/UpdateTray.svelte';
import Status from '../../src/lib/views/Status.svelte';
import {
    asciiCatalog,
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../src/lib/data/sources/config.ts';
import { setAscii, setCatalog, setGlyphMode, setGlyphs } from '../../src/lib/state/text.ts';
import { noop } from '../doubles.ts';
import { clientContext, createClientState, type ClientState } from '../client.ts';

let client: ClientState;
let receive: ClientState['entities']['receive'];
let registerView: ClientState['registry']['registerView'];

beforeEach(() => {
    client = createClientState();
    ({ receive } = client.entities);
    ({ registerView } = client.registry);
    installFixture();
});

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));

/** What every case here starts from, installed into the case's own client. */
function installFixture(): void {
    receive({ channel: 'config', version: 8001, payload: { config, text: catalog, findings: [] } });
    registerView({
        id: 'focus',
        label: 'views.focus',
        glyph: 'views.focus_glyph',
        component: Status,
        group: 'probe',
        order: 0
    });
    registerView({
        id: 'status',
        label: 'views.status',
        glyph: 'views.status_glyph',
        component: Status,
        group: 'probe',
        order: 1
    });
    receive({
        channel: 'portfolio',
        version: 8001,
        payload: {
            entities: {
                projects: {},
                venues: {},
                datasets: {},
                pillars: {},
                domains: {},
                funding: {},
                collections: {},
                career: null,
                feeds: {
                    radar: { lastRun: '2026-09-01' },
                    scout: { lastRun: '2026-09-02' },
                    linkedin: { lastPost: '2026-09-03' },
                    leads: null
                }
            }
        }
    });
}

const props = { onclose: noop, onupdate: noop };

describe('Palette', () => {
    it('renders nothing while closed', () => {
        expect(
            render(Palette, { context: clientContext(client), props: { ...props, open: false } })
                .body
        ).not.toContain('role="dialog"');
    });

    it('renders open with the view matches and configured placeholder', () => {
        const body = render(Palette, {
            context: clientContext(client),
            props: { ...props, open: true }
        }).body;
        expect(body).toContain(catalog['app.palette.cmdk_placeholder']);
        expect(body).toContain('Focus');
        expect(body).toContain('Status');
    });

    it('renders command names, argument hints and unavailable labels in command mode', () => {
        const body = render(Palette, {
            context: clientContext(client),
            props: { ...props, open: true, prefill: ':' }
        }).body;
        expect(body).toContain('theme');
        expect(body).toContain('accent');
        expect(body).toContain('view id');
        expect(body).toContain(catalog['app.palette_unavailable']);
    });

    it('draws the command-specific unknown line when no command matches', () => {
        const body = render(Palette, {
            context: clientContext(client),
            props: { ...props, open: true, prefill: ':nonesuch' }
        }).body;
        expect(body).toContain(catalog['app.palette.cmd_unknown']);
        expect(body).not.toContain(catalog['app.palette_empty']);
    });
});

describe('UpdateTray', () => {
    it('draws the four tasks, the portfolio Chat row, their last runs and the inbox note', () => {
        // The inbox task's last run is the triage notes file's, which the `inbox` channel carries.
        receive({
            channel: 'inbox',
            version: 8002,
            payload: {
                status: 'ok',
                accounts: [],
                threads: [],
                updated: '2026-09-04T10:00:00.000Z',
                pollMin: 10,
                retryMin: 2,
                notesRun: '2026-09-04'
            }
        });
        const body = render(UpdateTray, {
            context: clientContext(client),
            props: { open: true, onclose: noop }
        }).body;
        for (const kind of ['litwatch', 'scout', 'linkedin', 'inbox']) {
            expect(body).toContain(`data-task="${kind}"`);
        }
        for (const date of ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04']) {
            expect(body).toContain(date);
        }
        expect(body).toContain(catalog['app.tasks.inbox_note']);
        expect(body).toContain('data-task="chat"');
        expect(body).toContain(`>${catalog['app.chat']}</span>`);
    });

    it('renders the Chat glyph through ASCII mode', () => {
        const ascii = asciiCatalog(config);
        setAscii(ascii);
        setGlyphMode('ascii');
        try {
            const body = render(UpdateTray, {
                context: clientContext(client),
                props: { open: true, onclose: noop }
            }).body;
            const row = body.slice(body.indexOf('data-task="chat"'));
            expect(row).toContain(`>${ascii[glyphCatalog(config).chat]}</span>`);
            expect(row).not.toContain(glyphCatalog(config).chat);
            expect(row).toContain(`>${catalog['app.chat']}</span>`);
        } finally {
            setGlyphMode('unicode');
        }
    });

    it('opens on a full-window ground with a dialog inside it', () => {
        const body = render(UpdateTray, {
            context: clientContext(client),
            props: { open: true, onclose: noop }
        }).body;
        expect(body).toMatch(/class="[^"]*ground[^"]*"[^>]*role="presentation"/);
        expect(body).toMatch(/class="[^"]*tray[^"]*"[^>]*role="dialog"/);
    });

    it('marks no task row as confirming while tasks.skip_permissions is off', () => {
        expect((config as { tasks?: Record<string, unknown> }).tasks?.skip_permissions).toBe(false);
        const body = render(UpdateTray, {
            context: clientContext(client),
            props: { open: true, onclose: noop }
        }).body;
        expect(body).toContain('data-task="litwatch"');
        expect(body).not.toContain('data-confirms');
        expect(body).not.toContain(catalog['app.tasks.skip_confirm_ok']);
    });

    it('marks every task row as confirming while tasks.skip_permissions is on', () => {
        // The setting travels in the merged config the `config` channel carries, so the case turns
        // it on the way the server would: by pushing a config that holds it. A server render cannot
        // press, so what is asserted here is the path a press takes; the press itself is
        // tests/browser/tasks.spec.ts.
        const skipping = { ...config, tasks: { skip_permissions: true } };
        receive({
            channel: 'config',
            version: 8002,
            payload: { config: skipping, text: catalog, findings: [] }
        });
        const body = render(UpdateTray, {
            context: clientContext(client),
            props: { open: true, onclose: noop }
        }).body;
        for (const kind of ['litwatch', 'scout', 'linkedin', 'inbox']) {
            expect(body).toMatch(new RegExp(`data-task="${kind}"[^>]*data-confirms="true"`));
        }
        // The dialog itself is drawn by a press, so the closed tray carries its words nowhere.
        expect(body).not.toContain(catalog['app.tasks.skip_confirm_ok']);
    });
});
