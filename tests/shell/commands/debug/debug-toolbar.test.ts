// Layer 4, shell test. The debug toolbar for a session of an app's adapter that declared nothing:
// Pause is drawn while a thread runs, drawn off while the program is paused, and pressing it posts
// the `pause` action of the debug route, which the server sends to the adapter with the thread's
// id (tests/server/machine/apps/tools/debug-adapters.test.ts reads that side). The toolbar is
// drawn on the server and the press is the store's `pause` call that the button runs.
//
// It does not cover the strip's dragging, which interactjs does in a browser.

import { render } from 'svelte/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DebugPayload } from '../../../../src/lib/data/model/index.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../../src/lib/data/sources/config.ts';
import DebugToolbar from '../../../../src/lib/shell/commands/debug/DebugToolbar.svelte';
import { setCatalog, setGlyphs, t } from '../../../../src/lib/state/shared/words/text.ts';
import { clientContext, emptyClient, json, type ClientState } from '../../../fixtures/client.ts';
import { serveInto, type Asked } from '../../../state/sessions/terminal/commands-fixture.ts';

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

const SESSION = {
    repo: '/hub',
    name: 'run',
    program: '/hub/a.note',
    cwd: '/hub',
    pid: 0,
    number: 1
};

/** The payload of a session of the adapter `notes.dbg`, which declared nothing. */
function sessionOf(status: DebugPayload['status']): DebugPayload {
    return {
        status,
        session: SESSION,
        pause: null,
        frames: [],
        frame: null,
        thread: 1,
        scopes: [],
        watch: [],
        breakpoints: [],
        functions: [],
        ended: '',
        adapter: { type: 'notes.dbg', label: 'Notes', app: 'notes' },
        exceptions: [],
        declared: {}
    };
}

let client: ClientState;
beforeEach(() => {
    client = emptyClient();
    // A session that starts brings the window forward.
    vi.stubGlobal('window', { focus: () => undefined });
});
afterEach(() => vi.unstubAllGlobals());

/** The toolbar's markup while the server holds a debug session of this status. */
function drawn(status: DebugPayload['status']): string {
    client.entities.receive({ channel: 'debug', version: 1, payload: sessionOf(status) });
    const { body } = render(DebugToolbar, { context: clientContext(client) });
    return body;
}

/** The opening tag of the button labelled `label`. */
function buttonOf(markup: string, label: string): string {
    const found = new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`).exec(markup);
    if (found === null) throw new Error(`no button labelled ${label} in ${markup}`);
    return found[0];
}

describe('the debug toolbar of an adapter that declared nothing', () => {
    it('draws Pause on while a thread runs and off while the program is paused', () => {
        const label = t('debug.pause');
        expect(buttonOf(drawn('running'), label)).not.toMatch(/\sdisabled/);
        expect(buttonOf(drawn('paused'), label)).toMatch(/\sdisabled/);
    });

    it('posts the pause action when Pause is pressed', async () => {
        client.entities.receive({ channel: 'debug', version: 1, payload: sessionOf('running') });
        const asked: Asked[] = [];
        serveInto(asked, () => json({ ok: true }));
        const pressed = await client.debug.pause();
        expect([
            pressed,
            asked.filter((one) => one.url === '/api/debug').map((one) => one.body)
        ]).toEqual([true, [{ action: 'pause' }]]);
    });
});
