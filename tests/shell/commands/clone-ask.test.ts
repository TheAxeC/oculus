// Layer 4, shell test. The question after a repository was cloned (shell/commands/CloneAsk.svelte),
// drawn on the server for each step of the clone-after store: the first step offers Open and Add to
// Workspace and Cancel, with no third answer such as an Open in New Window, the second Save and
// Don't Save and Cancel, the third the name of the workspace file. It does not cover the look.

import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { createCloneAfter } from '../../../src/lib/state/sources/clone/clone-after.svelte.ts';
import type { WorkspacesState } from '../../../src/lib/state/sources/fs-transport.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import CloneAsk from '../../../src/lib/shell/commands/CloneAsk.svelte';
import { clientContext, emptyClient } from '../../fixtures/client.ts';

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

const ANSWER = { ok: true, changed: [], refused: [] };

/** An unsaved workspace holding one folder, which Open has to ask about. */
const HOLDING = { open: null, folders: [{ name: 'notes', path: '/work/notes' }] };

/** The words on the buttons of the question as drawn for a store in this state. */
async function drawn(steps: (after: ReturnType<typeof createCloneAfter>) => void | Promise<void>) {
    const after = createCloneAfter(
        {
            addRoot: () => Promise.resolve(ANSWER),
            closeWorkspace: () => Promise.resolve(ANSWER),
            saveWorkspace: () => Promise.resolve(ANSWER),
            workspacesNow: () => Promise.resolve(HOLDING as unknown as WorkspacesState)
        },
        { post: () => 0 }
    );
    const client = emptyClient();
    await steps(after);
    const { body } = render(CloneAsk, {
        context: clientContext({ ...client, clone: { ...client.clone, after } })
    });
    const html = body;
    return {
        html,
        buttons: [...html.matchAll(/<button[^>]*>(.*?)<\/button>/gs)].map((one) =>
            one[1].replace(/<[^>]*>/g, '').trim()
        )
    };
}

describe('the question after a clone', () => {
    it('draws nothing while no question is asked', async () => {
        const { buttons } = await drawn(() => undefined);
        expect(buttons).toEqual([]);
    });

    it('offers Open and Add to Workspace and Cancel and no third answer', async () => {
        const { buttons, html } = await drawn((after) => after.ask('/work/repo'));
        expect([...buttons].sort()).toEqual(['Add to Workspace', 'Cancel', 'Open']);
        expect(html).not.toMatch(/new window/i);
        expect(html).toContain('/work/repo');
    });

    it("offers Save and Don't Save and Cancel when Open would leave unsaved folders", async () => {
        const { buttons } = await drawn(async (after) => {
            after.ask('/work/repo');
            await after.open();
        });
        expect([...buttons].sort()).toEqual(['Cancel', "Don't Save", 'Save']);
    });

    it('asks for the name of the workspace file after Save', async () => {
        const { html, buttons } = await drawn(async (after) => {
            after.ask('/work/repo');
            await after.open();
            after.save();
        });
        expect(html).toContain('Name of the workspace file');
        expect(buttons).toContain('Save');
        expect(buttons).toContain('Cancel');
    });
});
