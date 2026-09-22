// One scratch note as its own tab, rendered to HTML on the server: the two controls, the title the
// pane draws, and what the toolbar says about the last save.
//
// The catalog and the glyphs are the real config; the note's own text comes from the fs store, whose
// `fetch` is a stub. The typing itself is a DOM event no server render fires, so what one keystroke
// does is read off the view's own source at the foot of this file; the wait it starts is
// tests/state/life/notes.test.ts and the typing end to end is tests/browser/sources/files.spec.ts.

import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import Note from '../../../src/lib/views/sources/note/Note.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/words/text.ts';
import { findView, type Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

afterEach(() => {
    vi.unstubAllGlobals();
});

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

function instance(state: unknown): Instance {
    return { id: 'note-one', view: 'note', state };
}

async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
}

/** A client whose store answers one note read with this body. */
async function answering(body: unknown, status = 200): Promise<ClientState> {
    vi.stubGlobal('window', {});
    vi.stubGlobal('fetch', () =>
        Promise.resolve(
            new Response(JSON.stringify(body), {
                status,
                headers: { 'content-type': 'application/json' }
            })
        )
    );
    const fresh = createClientState();
    fresh.fs.note('20260915-120000-001');
    await settle();
    return fresh;
}

function drawn(fresh: ClientState, state: unknown): string {
    return render(Note, { context: clientContext(fresh), props: { instance: instance(state) } })
        .body;
}

describe('one note as its own tab', () => {
    it('says so and draws no controls when the instance names no note', () => {
        const body = drawn(client, {});

        expect(body).toContain('No note chosen.');
        // the instance names no note, so there is nothing to type into
        expect(body).not.toContain('<textarea');
    });

    it('draws the title line and the text area for a note it names', () => {
        const body = drawn(client, { id: '20260915-120000-001' });

        expect(body).toContain('data-note="20260915-120000-001"');
        expect(body).toContain('aria-label="Title"');
        expect(body).toContain('aria-label="Note"');
        expect(body).toContain('<textarea');
    });

    it('says the note has not been saved yet before anything has been written', () => {
        expect(drawn(client, { id: '20260915-120000-001' })).toContain('Not saved yet');
    });

    it('draws an empty note for a tab whose note has no file yet, asking the server for nothing', async () => {
        let asked = 0;
        vi.stubGlobal('window', {});
        vi.stubGlobal('fetch', () => {
            asked += 1;
            return Promise.resolve(
                new Response('{}', { headers: { 'content-type': 'application/json' } })
            );
        });
        const made = createClientState();

        const body = drawn(made, { id: '20260915-120000-001', fresh: true });
        await settle();

        expect(body).toContain('<textarea');
        expect(body).toContain('Untitled note');
        expect(asked).toBe(0);

        // The same tab without the flag reads the file, which is what the flag is taking away.
        drawn(createClientState(), { id: '20260915-120000-001' });
        await settle();
        expect(asked).toBeGreaterThan(0);
    });

    it('says nothing has been saved for a note whose file is not written yet', () => {
        const body = drawn(client, { id: '20260915-120000-001', fresh: true });

        expect(body).toContain('Not saved yet');
        // the file is not written yet, so there is no save to name a time for
        expect(body).not.toContain('Saved 20');
    });

    it('says why the note could not be read rather than offering an empty one', async () => {
        const fresh = await answering({ error: 'no-such-note' }, 404);
        const body = drawn(fresh, { id: '20260915-120000-001' });

        expect(body).toContain('The note could not be read: no-such-note');
        // the note could not be read, so there is nothing to type into
        expect(body).not.toContain('<textarea');
    });

    it('is one instance per note, so opening the same note twice is one tab', () => {
        const { openView } = client.layout;
        const first = openView('note', { id: '20260915-120000-001' });
        const again = openView('note', { id: '20260915-120000-001' });
        const other = openView('note', { id: '20260915-120000-002' });

        expect(first).not.toBe('');
        expect(again).toBe(first);
        expect(other).not.toBe(first);
    });

    it('names the pane for the note, which is what a tab with no label of its own draws', () => {
        const body = drawn(client, { id: '20260915-120000-001' });

        // Nothing is typed and nothing has been read, so it is the words for a note with no title.
        expect(body).toContain('Untitled note');
    });
});

// What the removal of a note does to the tab drawing it. The layout store is this case's own, so
// nothing here renders: the rule is that the instance opened for one note goes with that note.
describe("a deleted note's tab", () => {
    it('is closed by the removal, so no tab is left drawing a note that is gone', () => {
        const { closeRecord, layout, openView } = client.layout;
        const first = openView('note', { id: '20260915-120000-001' });
        const second = openView('note', { id: '20260915-120000-002' });
        expect(first).not.toBe('');

        closeRecord('note', '20260915-120000-001');

        const open = findView(layout(), 'note', '20260915-120000-001');
        expect(open).toBe(null);
        expect(findView(layout(), 'note', '20260915-120000-002')?.id).toBe(second);
    });

    it('leaves every other view alone, including one opened for another record', () => {
        const { closeRecord, layout, openView } = client.layout;
        const file = openView('file', { root: 'hub', path: 'code/run.py', label: 'run.py' });

        closeRecord('note', '20260915-120000-001');

        expect(findView(layout(), 'file')?.id).toBe(file);
    });
});

// One keystroke is a DOM event no server render fires, so what it does is read off the source: the
// first one into a note with no file writes it at once, and leaving a note writes nothing away.
describe('what one keystroke does', () => {
    const source = readFileSync('src/lib/views/sources/note/Note.svelte', 'utf8');

    /** The body of one function of the view, up to the line that closes it. */
    function fn(name: string): string {
        const from = source.slice(source.indexOf(`function ${name}(`));
        return from.slice(0, from.indexOf('\n    }'));
    }

    it('writes the note at once on the first one and waits on the ones after it', () => {
        const typed = fn('typed');

        expect(typed).toContain('const first = writesNow(fresh, touched);');
        expect(typed).toContain('void save(true);');
        expect(typed).toContain('autosave.poke();');
        expect(typed.indexOf('void save(true);')).toBeLessThan(typed.indexOf('autosave.poke();'));
    });

    it('takes the fresh flag off once the file is written, so a reload reads the file', () => {
        const save = fn('save');

        expect(fn('typed')).toContain('void save(true);');
        // A retry after a failed first write lands with the flag still on and the title maybe
        // still empty, so the flag decides the restate as much as the label does.
        expect(save).toContain('if (!made && !fresh && named === written) return;');
        expect(save).toContain('restateInstance(tab, { id: draft.id, label: written });');
    });

    it('names the tab it was typed into, not whichever tab the pane moved on to', () => {
        // `instance` is a live prop, so a save landing after the pane switched would read the tab
        // the pane switched to. The id and the label are taken while the reader is typing here.
        const save = fn('save');

        expect(fn('typed')).toContain('tab = instance.id;');
        // the id and the label are taken while the reader types, so the save reads no live prop
        expect(save).not.toContain('instance.');
    });

    it('deletes no note and closes no tab when one is left', () => {
        expect(fn('leave')).toContain('autosave.flush();');
        // the note is left rather than deleted, so no delete is reached from here
        expect(source).not.toContain('deleteNote');
        // and the tab is left open too
        expect(source).not.toContain('closeRecord');
    });
});
