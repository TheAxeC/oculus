// Layer 3, view test. The three sections under the Files tree as the server renders them: Open
// Editors over a page of two panes, Outline over the active source tab, and Timeline over the
// copies the server lists for a file. The reads are pure (tests/state/sources/explorer/sections/
// sections.test.ts); this is what is drawn from them.
//
// `fetch` and `window` are stubs; nothing reaches a server. Every row of the five sections is drawn
// with the button that Enter presses (ui/tree/tree-keys.ts, tests/ui/tree/item-keys.test.ts), and
// the close of the tabs Close and Close All name is called directly (control/editor-closing.ts).
// What this does NOT cover: the pointer or key event that reaches a row or its Close control, that
// each section's tree takes no keymap for Enter (markup no render shows), the close question's
// dialog, and a restore (a press; the text a restore writes and the copy it keeps are
// tests/routes/files/history.test.ts).

import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import Bookmarks from '../../../../../src/lib/views/sources/files/sections/Bookmarks.svelte';
import Notes from '../../../../../src/lib/views/sources/files/sections/Notes.svelte';
import OpenEditors from '../../../../../src/lib/views/sources/files/sections/OpenEditors.svelte';
import Outline from '../../../../../src/lib/views/sources/files/sections/Outline.svelte';
import Timeline from '../../../../../src/lib/views/sources/files/sections/Timeline.svelte';
import { closingEditors } from '../../../../../src/lib/views/sources/files/control/editor-closing.ts';
import type { Instance, Layout } from '../../../../../src/lib/state/workbench/layout/index.ts';
import { installRealText } from '../../../shared/real-text.ts';
import { bench, fakeStorage, split } from '../../../../state/workbench/layout/layout-fixture.ts';
import { clientContext, createClientState, type ClientState } from '../../../../fixtures/client.ts';

installRealText();

afterEach(() => {
    vi.unstubAllGlobals();
});

const tab = (id: string, view: string, state: unknown): Instance => ({ id, view, state });
const sourceTab = (id: string, path: string): Instance => tab(id, 'source', { root: 'hub', path });
const pane = (active: string, ...tabs: Instance[]): Layout => ({ kind: 'pane', tabs, active });

/** Let the stores' scheduled requests run and their answers land. */
async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
}

function json(body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'content-type': 'application/json' }
    });
}

/** The rows a rendering names by one attribute, in the order they are drawn. */
function marked(body: string, attribute: string): string[] {
    return [...body.matchAll(new RegExp(`${attribute}="([^"]*)"`, 'g'))].map((one) => one[1]);
}

/**
 * The rows a rendering names by one attribute whose line carries the button a row presses to open
 * what it stands for, which is the button Enter presses on the row.
 */
function pressable(body: string, attribute: string): string[] {
    return body
        .split(`${attribute}="`)
        .slice(1)
        .filter((row) =>
            row.slice(0, row.indexOf('</li>')).includes('<button type="button" class="main')
        )
        .map((row) => row.slice(0, row.indexOf('"')));
}

/** The visible names of a rendering's tree items. */
function namesOf(body: string): string[] {
    return [...body.replace(/<!--.*?-->/g, '').matchAll(/class="name[^"]*">([^<]*)</g)].map(
        (one) => one[1]
    );
}

/** An Outline section over the client, as the server draws it. */
const outlineDrawn = (client: ClientState): string =>
    render(Outline, {
        context: clientContext(client),
        props: { open: true, ontoggle: () => undefined }
    }).body;

/** A Timeline section over the client, for the file selected in the tree or none. */
const timelineDrawn = (
    client: ClientState,
    selected: { root: string; path: string } | null
): string =>
    render(Timeline, {
        context: clientContext(client),
        props: { open: true, ontoggle: () => undefined, selected }
    }).body;

describe('Open Editors', () => {
    async function twoPanes(): Promise<ClientState> {
        vi.stubGlobal('window', {});
        vi.stubGlobal('fetch', () => Promise.resolve(new Response('on disk\n')));
        const client = createClientState();
        client.layout.loadLayout(fakeStorage());
        client.layout.apply(
            bench(
                split(
                    'row',
                    [0.5, 0.5],
                    [
                        pane('t1', sourceTab('t1', 'notes/a.md'), sourceTab('t2', 'b.md')),
                        pane('t3', sourceTab('t3', 'c.md'))
                    ]
                )
            )
        );
        await client.source.loadSourceDraft('t2', 'hub', 'b.md');
        client.source.editSourceDraft('t2', 'typed\n');
        await settle();
        return client;
    }

    // Revert: draw one list for all the panes, or the dot on every row.
    it('draws a group per pane, a row per tab, and the dot on the tab holding unsaved text', async () => {
        const client = await twoPanes();
        const { body } = render(OpenEditors, {
            context: clientContext(client),
            props: { open: true, ontoggle: () => undefined }
        });

        expect(marked(body, 'data-fs-editor-group')).toEqual(['0', '1']);
        expect(marked(body, 'data-fs-editor')).toEqual(['t1', 't2', 't3']);
        expect(namesOf(body)).toEqual(
            expect.arrayContaining(['Group 1', 'Group 2', 'a.md', 'b.md', 'c.md'])
        );
        const rows = body.split('data-fs-editor=').slice(1);
        const dotted = rows.filter((row) => row.includes('aria-label="Unsaved changes"'));
        expect(dotted).toHaveLength(1);
        expect(dotted[0]).toContain('"t2"');
    });

    // Revert: draw Save All enabled with nothing to save.
    it('enables Save All only while a tab holds unsaved text', async () => {
        const client = await twoPanes();
        const drawn = (c: ClientState): string =>
            render(OpenEditors, {
                context: clientContext(c),
                props: { open: true, ontoggle: () => undefined }
            }).body;
        const button = (body: string): string =>
            /<button[^>]*aria-label="save all"[^>]*>/.exec(body)?.[0] ?? '';

        // a tab holds unsaved text, so Save All is enabled
        expect(button(drawn(client))).not.toContain('disabled');

        client.source.revertSourceDraft('t2');
        expect(button(drawn(client))).toContain('disabled');
    });

    // Revert: leave the button or the Close control out of a row of OpenEditors.svelte.
    it('audits that every row carries the button Enter presses and a Close control', async () => {
        const client = await twoPanes();
        const { body } = render(OpenEditors, {
            context: clientContext(client),
            props: { open: true, ontoggle: () => undefined }
        });

        expect(pressable(body, 'data-fs-editor')).toEqual(['t1', 't2', 't3']);
        const rows = body.split('data-fs-editor=').slice(1);
        expect(rows.filter((row) => row.includes('aria-label="close"'))).toHaveLength(3);
    });

    // Revert: close at once whatever the tab holds, or ask for a tab that holds nothing.
    it('audits that Close on a row closes a saved tab at once and asks before it closes a tab with unsaved text', async () => {
        const client = await twoPanes();
        const closed: string[] = [];
        const deps = {
            unsaved: client.ui.unsaved,
            nameOf: (id: string) => id,
            close: (id: string) => closed.push(id)
        };

        expect(closingEditors(['t1'], deps)).toBeNull();
        expect(closed).toEqual(['t1']);

        const asked = closingEditors(['t2'], deps);
        expect(asked?.message).toContain('unsaved');
        expect(closed).toEqual(['t1']);
        asked?.act();
        expect(closed).toEqual(['t1', 't2']);
    });

    // Revert: name no tab, or ask nothing, when Close All spans several tabs.
    it('audits that Close All asks how many tabs go and names the one holding unsaved text', async () => {
        const client = await twoPanes();
        const closed: string[] = [];
        const asked = closingEditors(['t1', 't2', 't3'], {
            unsaved: client.ui.unsaved,
            nameOf: (id) => `name-${id}`,
            close: (id) => closed.push(id)
        });

        expect(closed).toEqual([]);
        expect(asked?.message).toContain('3');
        expect(asked?.message).toContain('name-t2');
        // the saved tab loses nothing, so the question does not name it
        expect(asked?.message).not.toContain('name-t1');
        asked?.act();
        expect(closed).toEqual(['t1', 't2', 't3']);
    });

    // Revert: leave out the empty line.
    it('says no editor is open on a page with none', () => {
        const client = createClientState();
        client.layout.loadLayout(fakeStorage());
        client.layout.apply(bench(pane('x', tab('x', 'status', null))));
        const { body } = render(OpenEditors, {
            context: clientContext(client),
            props: { open: true, ontoggle: () => undefined }
        });

        expect(namesOf(body)).toContain('No editor is open.');
        expect(marked(body, 'data-fs-editor')).toEqual([]);
    });
});

describe('Outline', () => {
    async function withText(path: string, language: string, text: string): Promise<ClientState> {
        vi.stubGlobal('window', {});
        vi.stubGlobal('fetch', () => Promise.resolve(new Response(text)));
        const client = createClientState();
        client.layout.loadLayout(fakeStorage());
        client.layout.apply(bench(pane('t1', sourceTab('t1', path))));
        await client.source.loadSourceDraft('t1', 'hub', path);
        client.source.setSourceLanguage('t1', language);
        await settle();
        return client;
    }

    // Revert: read a heading out of a fenced block.
    it('audits that draws the headings of a Markdown file in order and not the one in a fenced block', async () => {
        const body = outlineDrawn(
            await withText('a.md', 'markdown', '# A\n\n## B\n\n```\n# not\n```\n\n### C\n')
        );

        expect(marked(body, 'data-fs-symbol')).toEqual(['1', '3', '9']);
        expect(namesOf(body)).toEqual(expect.arrayContaining(['A', 'B', 'C']));
        // the line inside the fenced block is code, not a heading
        expect(namesOf(body)).not.toContain('not');
    });

    // Revert: leave the onclick out of a symbol row of Outline.svelte.
    it('audits that every symbol row carries the button Enter presses', async () => {
        const body = outlineDrawn(await withText('a.md', 'markdown', '# A\n\n## B\n'));

        expect(pressable(body, 'data-fs-symbol')).toEqual(['1', '3']);
    });

    // Revert: read a commented sectioning command.
    it('audits that draws the sectioning commands of a LaTeX file outside comments', async () => {
        const body = outlineDrawn(
            await withText('m.tex', 'latex', '\\section{S}\n% \\section{X}\n\\subsection*{T}\n')
        );

        expect(namesOf(body)).toEqual(expect.arrayContaining(['S', 'T']));
        // the section command after the percent sign is a comment
        expect(namesOf(body)).not.toContain('X');
    });

    // Revert: give every language a list.
    it('audits that says a Python file has no symbols yet', async () => {
        const body = outlineDrawn(await withText('run.py', 'python', 'def f():\n    pass\n'));

        expect(namesOf(body)).toContain('No symbols for this file yet.');
        expect(marked(body, 'data-fs-symbol')).toEqual([]);
    });

    // Revert: draw the no-symbols line for a tab that shows no file.
    it('audits that says there is nothing to outline when the active tab shows no file', () => {
        const client = createClientState();
        client.layout.loadLayout(fakeStorage());
        client.layout.apply(bench(pane('x', tab('x', 'status', null))));

        expect(namesOf(outlineDrawn(client))).toContain(
            'The active editor cannot provide outline information.'
        );
    });
});

describe('Timeline', () => {
    const copies = [
        { id: '20260101T120000000', at: 1_767_268_800_000, size: 4, kind: 'save' },
        { id: '20260101T110000000', at: 1_767_265_200_000, size: 4, kind: 'delete' }
    ];

    async function listed(saves: unknown[]): Promise<ClientState> {
        vi.stubGlobal('window', {});
        vi.stubGlobal('fetch', (url: string) =>
            Promise.resolve(
                url.startsWith('/api/history')
                    ? json({ ok: true, saves })
                    : json({
                          current: '',
                          workspaces: [
                              { name: '', roots: [{ key: 'hub', dir: '/hub', fixed: true }] }
                          ],
                          dropped: []
                      })
            )
        );
        const client = createClientState();
        client.layout.loadLayout(fakeStorage());
        client.layout.apply(bench(pane('t1', sourceTab('t1', 'a.md'))));
        client.fs.workspaces();
        client.fs.copies('hub', 'a.md');
        await settle();
        return client;
    }

    // Revert: leave a copy out of the rows, or name a delete as a save.
    it('audits that draws a row per copy of the selected file, a save as File Saved and a delete as File Deleted', async () => {
        const body = timelineDrawn(await listed(copies), { root: 'hub', path: 'a.md' });

        expect(marked(body, 'data-fs-timeline-row')).toEqual([
            '20260101T120000000',
            '20260101T110000000'
        ]);
        expect(namesOf(body)).toEqual(expect.arrayContaining(['File Saved', 'File Deleted']));
    });

    // Revert: leave the onclick out of a copy row of Timeline.svelte.
    it('audits that every copy row carries the button Enter presses', async () => {
        const body = timelineDrawn(await listed(copies), { root: 'hub', path: 'a.md' });

        expect(pressable(body, 'data-fs-timeline-row')).toEqual([
            '20260101T120000000',
            '20260101T110000000'
        ]);
    });

    // Revert: take the file of the active tab only.
    it('audits that reads the file of the active tab when none is selected in the tree', async () => {
        const body = timelineDrawn(await listed(copies), null);

        expect(marked(body, 'data-fs-timeline-row')).toHaveLength(2);
    });

    // Revert: draw rows for a file with no copies.
    it('audits that says the file has no history yet when the server lists none', async () => {
        const body = timelineDrawn(await listed([]), { root: 'hub', path: 'a.md' });

        expect(marked(body, 'data-fs-timeline-row')).toEqual([]);
        expect(namesOf(body)).toContain('The file has no history yet.');
    });

    // Revert: draw the empty line for a page whose tab shows no file.
    it('audits that says the editor cannot provide a timeline when there is no file', () => {
        const client = createClientState();
        client.layout.loadLayout(fakeStorage());
        client.layout.apply(bench(pane('x', tab('x', 'status', null))));

        expect(namesOf(timelineDrawn(client, null))).toContain(
            'The active editor cannot provide timeline information.'
        );
    });
});

describe('Bookmarks and Notes', () => {
    const client = createClientState();

    // Revert: leave the onclick out of a bookmark row of Bookmarks.svelte.
    it('audits that every bookmark row carries the button Enter presses', () => {
        const { body } = render(Bookmarks, {
            context: clientContext(client),
            props: {
                rows: [
                    {
                        id: 'b1',
                        title: 'plan',
                        fields: { root: 'hub', path: 'plan.md' },
                        file: '',
                        index: 0
                    },
                    {
                        id: 'b2',
                        title: 'src',
                        fields: { root: 'hub', path: 'src' },
                        file: '',
                        index: 1,
                        kind: 'folder'
                    }
                ],
                error: '',
                open: true,
                editing: '',
                adding: false,
                ontoggle: () => undefined,
                onadd: () => undefined,
                onopen: () => undefined,
                onedit: () => undefined,
                onretry: () => undefined
            }
        });

        expect(pressable(body, 'data-fs-bookmark')).toEqual(['b1', 'b2']);
    });

    // Revert: leave the onclick out of a note row of Notes.svelte.
    it('audits that every note row carries the button Enter presses', () => {
        const { body } = render(Notes, {
            context: clientContext(client),
            props: {
                rows: [
                    { id: 'n1', title: 'first', modified: 1 },
                    { id: 'n2', title: '', modified: 2 }
                ],
                error: '',
                open: true,
                ontoggle: () => undefined,
                onadd: () => undefined,
                onopen: () => undefined,
                onremove: () => undefined,
                onretry: () => undefined
            }
        });

        expect(pressable(body, 'data-fs-note')).toEqual(['n1', 'n2']);
    });
});
