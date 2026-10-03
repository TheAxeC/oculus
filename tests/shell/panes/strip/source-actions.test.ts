// Layer 3, shell test. The source tab's controls in the strip of the real pane: the workbench
// drawn with a source tab in it, and the markup of the strip read for Save, Revert, the star, Open
// in Program, Preview and Blame. No stand-in hands the strip anything: the pane, the source view
// and the strip are the app's own.
//
// A server render draws a pane's strip before the view under it, so the view's hand-up lands after
// the strip was drawn. The case renders twice over one store of tab actions, as the browser's
// update does once the view has mounted, and reads the strip of the second.
//
// What this does NOT cover: where the controls stand and how they fit in a narrow strip, which
// are seen at the look.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import Workbench from '../../../../src/lib/shell/Workbench.svelte';
import Source, { registration } from '../../../../src/lib/views/sources/source/Source.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../../src/lib/data/sources/config.ts';
import { setAppearance } from '../../../../src/lib/state/shared/words/appearance.ts';
import { setCatalog, setGlyphs } from '../../../../src/lib/state/shared/words/text.ts';
import { serialiseLayout } from '../../../../src/lib/state/workbench/layout/index.ts';
import type { ViewRegistration } from '../../../../src/lib/state/workbench/navigation/registry.ts';
import { sourceTabState } from '../../../../src/lib/state/sessions/source.svelte.ts';
import { TAB_ACTIONS, TabActions } from '../../../../src/lib/ui/tabs/tab-actions.svelte.ts';
import { clientContext, createClientState, json, settle } from '../../../fixtures/client.ts';
import { git } from '../../../fixtures/sessions-fixture.ts';
import {
    fakeStorage,
    heldPages,
    pageAround
} from '../../../state/workbench/layout/layout-fixture.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));

const HUB_DIR = '/home/reader/hub';

beforeEach(() => {
    vi.stubGlobal('window', {});
    vi.stubGlobal('fetch', (url: string) =>
        Promise.resolve(
            url === '/api/fs'
                ? json({
                      home: '/home/reader',
                      current: 'main',
                      workspaces: [
                          { name: 'main', roots: [{ key: 'hub', dir: HUB_DIR, fixed: true }] }
                      ],
                      dropped: []
                  })
                : new Response('# notes')
        )
    );
    setAppearance({});
});
afterEach(() => vi.unstubAllGlobals());

/** The markup of the strip of a pane holding one source tab on this file, in a repository. */
async function stripOf(path: string): Promise<string> {
    const client = createClientState();
    client.entities.receive({
        channel: 'config',
        version: 1,
        payload: { config, text: catalog, findings: [] }
    });
    client.entities.receive({ channel: 'git', version: 1, payload: { [HUB_DIR]: git() } });
    client.registry.registerView({ ...(registration as ViewRegistration), component: Source });
    const pane = {
        kind: 'pane' as const,
        tabs: [{ id: 'tab', view: 'source', state: sourceTabState('hub', path) }],
        active: 'tab'
    };
    client.layout.loadLayout(
        fakeStorage(serialiseLayout(heldPages([pageAround('main', pane)], [])))
    );
    await client.source.loadSourceDraft('tab', 'hub', path);
    const context = new Map([...clientContext(client), [TAB_ACTIONS, new TabActions()]]);
    const drawn = (): string => render(Workbench, { context, props: {} }).body;
    drawn();
    await settle();
    const body = drawn();
    return body.slice(body.indexOf('data-tab-strip'), body.indexOf('data-instance="tab"'));
}

describe('the source tab in the strip of the pane', () => {
    it("draws the file tab's controls at the end of the strip of its pane", async () => {
        const strip = await stripOf('notes.md');
        for (const words of [
            catalog['editor.save'],
            catalog['editor.revert'],
            catalog['file.bookmark']
        ]) {
            expect(strip).toContain(`aria-label="${words}"`);
        }
        expect(strip).toContain(`>${catalog['source.preview']}</span>`);
        expect(strip).toContain(`>${catalog['source.blame']}</span>`);
        const program = await stripOf('letters/cover.rtf');
        expect(program).toContain(`aria-label="${catalog['file.open_program']}"`);
    });
});
