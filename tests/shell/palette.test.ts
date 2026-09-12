// The shell palette rendered closed, as search results, and as its command list. The test installs
// the same state stores and view registry production reads, without a socket or browser.

import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Palette from '../../src/lib/shell/Palette.svelte';
import UpdateTray from '../../src/lib/shell/UpdateTray.svelte';
import Status from '../../src/lib/views/Status.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import { receive } from '../../src/lib/state/entities.svelte.ts';
import { registerView } from '../../src/lib/views/registry.ts';
import type { Snapshot } from '../../src/lib/data/model.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));

receive({ channel: 'config', version: 8001, payload: { config, text: catalog, findings: [] } });
registerView({ id: 'focus', label: 'views.focus', glyph: 'views.focus_glyph', component: Status });
registerView({
    id: 'status',
    label: 'views.status',
    glyph: 'views.status_glyph',
    component: Status
});

receive({
    channel: 'portfolio',
    version: 8001,
    payload: {
        entities: {
            projects: {},
            venues: {},
            datasets: {},
            programs: {},
            domains: {},
            funding: {},
            collections: {},
            career: null,
            feeds: {
                radar: { lastRun: '2026-09-01' },
                scout: { lastRun: '2026-09-02' },
                linkedin: { lastPost: '2026-09-03' },
                inbox: { run: '2026-09-04', actionable: 2 },
                leads: null
            }
        }
    } as unknown as Snapshot
});

const props = { onclose: () => {}, onupdate: () => {} };

describe('Palette', () => {
    it('renders nothing while closed', () => {
        expect(render(Palette, { props: { ...props, open: false } }).body).not.toContain(
            'role="dialog"'
        );
    });

    it('renders open with the view matches and configured placeholder', () => {
        const body = render(Palette, { props: { ...props, open: true } }).body;
        expect(body).toContain(catalog['js.leads.cmdk_placeholder']);
        expect(body).toContain('Focus');
        expect(body).toContain('Status');
    });

    it('renders command names, argument hints and unavailable labels in command mode', () => {
        const body = render(Palette, { props: { ...props, open: true, prefill: ':' } }).body;
        expect(body).toContain('theme');
        expect(body).toContain('accent');
        expect(body).toContain('view id');
        expect(body).toContain(catalog['app.palette_unavailable']);
    });
});

describe('UpdateTray', () => {
    it('draws the four tasks, their last runs and the inbox note', () => {
        const body = render(UpdateTray, {
            props: { open: true, onclose: () => {} }
        }).body;
        for (const kind of ['litwatch', 'scout', 'linkedin', 'inbox']) {
            expect(body).toContain(`data-task="${kind}"`);
        }
        for (const date of ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04']) {
            expect(body).toContain(date);
        }
        expect(body).toContain(catalog['js.tasks.inbox_note']);
    });

    it('opens on a full-window ground with a dialog inside it', () => {
        const body = render(UpdateTray, {
            props: { open: true, onclose: () => {} }
        }).body;
        expect(body).toMatch(/class="[^"]*ground[^"]*"[^>]*role="presentation"/);
        expect(body).toMatch(/class="[^"]*tray[^"]*"[^>]*role="dialog"/);
    });
});
