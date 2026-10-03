// The file browser rendered to HTML over a stubbed server: what it draws when a read is refused,
// and the reader's own bookmarks and notes beside the tree with the controls that add to them.
// `fetch` and `window` are stubs answered per case; nothing here reaches a server.
//
// The catalog and the glyphs are the real config. What this does NOT cover: the fetches
// state/sources/fs.svelte.ts makes against a server, and pressing a control or a key, which no
// server rendering runs.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import Files from '../../../../src/lib/views/sources/files/Files.svelte';
import Bookmarks from '../../../../src/lib/views/sources/files/sections/Bookmarks.svelte';
import EntryForm from '../../../../src/lib/views/shared/forms/EntryForm.svelte';
import { BOOKMARK_COLLECTION } from '../../../../src/lib/state/sources/fs.svelte.ts';
import { installRealText } from '../../shared/real-text.ts';
import { t } from '../../../../src/lib/state/shared/words/text.ts';
import { instance } from './files-instance.ts';
import { noop } from '../../../fixtures/doubles.ts';
import { clientContext, createClientState, type ClientState } from '../../../fixtures/client.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

installRealText();

// What the view draws when the server refuses a read. `fetch` and `window` are stubs; nothing here
// reaches a server. What this does NOT cover: the refusals themselves, which are
// tests/routes/files/fs.test.ts.
describe('a read the server refused', () => {
    /** Let the store's scheduled request run and its answer land. */
    async function settle(): Promise<void> {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }

    function answering(answer: (url: string) => Response): ClientState {
        vi.stubGlobal('window', {});
        vi.stubGlobal('fetch', (url: string) => Promise.resolve(answer(url)));
        return createClientState();
    }

    function refused(error: string, status: number): Response {
        return new Response(JSON.stringify({ error }), {
            status,
            headers: { 'content-type': 'application/json' }
        });
    }

    const ROOTS = JSON.stringify({
        current: '',
        workspaces: [{ name: '', roots: [{ key: 'hub', dir: '/hub', fixed: true }] }],
        dropped: ['cathedra']
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('says why the roots could not be read, instead of saying there are none', async () => {
        const fresh = answering(() => refused('origin', 403));
        fresh.fs.workspaces();
        await settle();

        const { body } = render(Files, {
            context: clientContext(fresh),
            props: { instance: instance() }
        });

        expect(body).toContain(`The roots could not be read: ${t('ui.answer_refused', 403)}`);
        // the roots could not be read, which is said in its own words rather than as an empty list
        expect(body).not.toContain('No roots yet');
    });

    it('says why an open folder could not be listed, instead of drawing it empty', async () => {
        const fresh = answering((url) =>
            url === '/api/fs'
                ? new Response(ROOTS, {
                      status: 200,
                      headers: { 'content-type': 'application/json' }
                  })
                : refused('missing', 404)
        );
        // The open folders live in the instance's own ui state, which is where toggle() writes
        // them.
        fresh.ui.setInstanceState('files-one', { expanded: ['hub:'] });
        fresh.fs.workspaces();
        fresh.fs.listing('hub', '');
        await settle();

        const { body } = render(Files, {
            context: clientContext(fresh),
            props: { instance: instance() }
        });

        expect(body).toContain(`hub could not be read: ${t('files.refused_missing')}`);
        expect(body).toContain('aria-expanded="true"');
    });

    it('says nothing about a folder remembered open under a root the workspace no longer has', async () => {
        const fresh = answering((url) =>
            url === '/api/fs'
                ? new Response(ROOTS, {
                      status: 200,
                      headers: { 'content-type': 'application/json' }
                  })
                : refused('outside', 404)
        );
        // The instance still remembers a folder of a root that was since taken out of the
        // workspace.
        fresh.ui.setInstanceState('files-one', { expanded: ['gone:', 'gone:sub'] });
        fresh.fs.workspaces();
        await settle();

        const { body } = render(Files, {
            context: clientContext(fresh),
            props: { instance: instance() }
        });

        // the roots read, and the folder the instance remembers of a root that is gone is dropped
        // without a word
        expect(body).not.toContain('could not be read');
        expect(body).toContain('data-fs-row="hub:"');
    });

    it('names a saved root the configuration reserved', async () => {
        const fresh = answering((url) =>
            url === '/api/fs'
                ? new Response(ROOTS, {
                      status: 200,
                      headers: { 'content-type': 'application/json' }
                  })
                : refused('missing', 404)
        );
        fresh.fs.workspaces();
        await settle();

        const { body } = render(Files, {
            context: clientContext(fresh),
            props: { instance: instance() }
        });

        expect(body).toContain('the configuration owns the name: cathedra');
    });
});

// The two lists the reader keeps beside the tree, and the controls that add to them. The store is
// answered by a stub, as above; nothing here reaches a server.
describe("the reader's own bookmarks and notes", () => {
    /** Let the store's scheduled requests run and their answers land. */
    async function settle(): Promise<void> {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }

    const ROOTS = JSON.stringify({
        current: '',
        workspaces: [{ name: '', roots: [{ key: 'hub', dir: '/hub', fixed: true }] }],
        dropped: []
    });

    const MARKS = JSON.stringify({
        entries: [
            {
                id: 'the manual',
                title: 'the manual',
                fields: { label: 'the manual', root: 'hub', path: 'docs/manual.md' },
                file: '',
                index: 0
            }
        ],
        schema: [
            { field: 'label', type: 'text', label: 'Label', required: true },
            { field: 'root', type: 'select', label: 'Root' },
            { field: 'path', type: 'text', label: 'Path' }
        ]
    });

    const NOTES = JSON.stringify({
        notes: [{ id: '20260915-120000-001', title: 'a note title', modified: 1_757_000_000_000 }]
    });

    function json(body: string): Response {
        return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
    }

    /** A client whose fs store is answered from the fixtures above. */
    async function loaded(): Promise<ClientState> {
        vi.stubGlobal('window', {});
        vi.stubGlobal('fetch', (url: string) => {
            if (url.includes('bookmarks=1')) return Promise.resolve(json(MARKS));
            if (url.includes('notes=1')) return Promise.resolve(json(NOTES));
            return Promise.resolve(json(ROOTS));
        });
        const fresh = createClientState();
        fresh.fs.workspaces();
        fresh.fs.bookmarks();
        fresh.fs.notes();
        await settle();
        return fresh;
    }

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    // Revert: label the head control of Notes.svelte with the section's name instead of its own.
    it('offers the bookmark and the note controls on the heads of their sections', () => {
        const { body } = render(Files, {
            context: clientContext(client),
            props: { instance: instance() }
        });
        const head = (attribute: string): string =>
            body.slice(body.indexOf(attribute), body.indexOf('</button>', body.indexOf(attribute)));

        expect(body).toContain('aria-label="+ bookmark"');
        expect(body).toContain('aria-label="+ note"');
        expect(head('data-fs-bookmarks')).toContain('aria-label="Bookmarks"');
        expect(head('data-fs-notes')).toContain('aria-label="Notes"');
    });

    it('lists the bookmarks under the tree, each with a control that changes it', async () => {
        const fresh = await loaded();
        const { body } = render(Files, {
            context: clientContext(fresh),
            props: { instance: instance() }
        });

        expect(body).toContain('data-fs-bookmarks');
        expect(body).toContain('data-fs-bookmark="the manual"');
        expect(body).toContain('the manual');
        expect(body).toContain('Change the bookmark the manual');
    });

    it('lists the notes under them, each with its time and its removal', async () => {
        const fresh = await loaded();
        const { body } = render(Files, {
            context: clientContext(fresh),
            props: { instance: instance() }
        });

        expect(body).toContain('data-fs-notes');
        expect(body).toContain('data-fs-note="20260915-120000-001"');
        expect(body).toContain('a note title');
        expect(body).toContain('Delete the note a note title');
    });

    // Revert: drop the empty row of views/sources/files/sections/Bookmarks.svelte.
    it('draws both heads with a count of none on a machine that has no bookmarks and no notes', async () => {
        vi.stubGlobal('window', {});
        vi.stubGlobal('fetch', (url: string) => {
            if (url.includes('bookmarks=1')) {
                return Promise.resolve(json(JSON.stringify({ entries: [], schema: [] })));
            }
            if (url.includes('notes=1'))
                return Promise.resolve(json(JSON.stringify({ notes: [] })));
            return Promise.resolve(json(ROOTS));
        });
        const fresh = createClientState();
        fresh.fs.bookmarks();
        fresh.fs.notes();
        await settle();
        const { body } = render(Files, {
            context: clientContext(fresh),
            props: { instance: instance() }
        });

        expect(body).toContain('data-fs-bookmarks');
        expect(body).toContain('data-fs-notes');
        // neither section holds an entry yet, so the heads are drawn and no row under them
        expect(body).not.toContain('data-fs-bookmark=');
        // and the notes section holds none either
        expect(body).not.toContain('data-fs-note=');
        // Open Editors, Outline and Timeline draw a count of none above these two heads
        expect(body.slice(body.indexOf('data-fs-bookmarks')).split('>0</span>').length - 1).toBe(2);
        expect(body).toContain('No bookmark yet.');
        expect(body).toContain('No note yet.');
    });

    // Revert: draw the bookmarks' error as a paragraph in place of Bookmarks in
    // views/sources/files/Files.svelte.
    it('says why the two lists could not be read, and keeps both heads and their add controls', async () => {
        vi.stubGlobal('window', {});
        vi.stubGlobal('fetch', (url: string) =>
            Promise.resolve(
                url.includes('bookmarks=1') || url.includes('notes=1')
                    ? new Response(JSON.stringify({ error: 'origin' }), {
                          status: 403,
                          headers: { 'content-type': 'application/json' }
                      })
                    : json(ROOTS)
            )
        );
        const fresh = createClientState();
        fresh.fs.bookmarks();
        fresh.fs.notes();
        await settle();
        const { body } = render(Files, {
            context: clientContext(fresh),
            props: { instance: instance() }
        });

        expect(body).toContain(`The bookmarks could not be read: ${t('ui.answer_refused', 403)}`);
        expect(body).toContain(`The notes could not be read: ${t('ui.answer_refused', 403)}`);
        const marks = body.slice(body.indexOf('data-fs-bookmarks'), body.indexOf('data-fs-notes'));
        const held = body.slice(body.indexOf('data-fs-notes'), body.indexOf('data-fs-workspaces'));
        expect(marks).toContain('aria-label="+ bookmark"');
        expect(marks).toContain(`The bookmarks could not be read: ${t('ui.answer_refused', 403)}`);
        expect(held).toContain('aria-label="+ note"');
        expect(held).toContain(`The notes could not be read: ${t('ui.answer_refused', 403)}`);
    });

    it('carries the control that reads it again on the line that says a read failed', async () => {
        vi.stubGlobal('window', {});
        vi.stubGlobal('fetch', (url: string) =>
            Promise.resolve(
                url.includes('bookmarks=1') || url.includes('notes=1')
                    ? new Response(JSON.stringify({ error: 'origin' }), {
                          status: 403,
                          headers: { 'content-type': 'application/json' }
                      })
                    : json(ROOTS)
            )
        );
        const fresh = createClientState();
        fresh.fs.bookmarks();
        fresh.fs.notes();
        await settle();
        const { body } = render(Files, {
            context: clientContext(fresh),
            props: { instance: instance() }
        });

        const marks = body.slice(body.indexOf('data-fs-bookmarks'), body.indexOf('data-fs-notes'));
        const held = body.slice(body.indexOf('data-fs-notes'), body.indexOf('data-fs-workspaces'));
        expect(marks).toContain('aria-label="read again"');
        expect(marks).toContain('Read the bookmarks again');
        expect(held).toContain('aria-label="read again"');
        expect(held).toContain('Read the notes again');
    });

    // Revert: give a bookmark row the bookmark's title rather than its place as its tooltip.
    it('says where each bookmark points, so two labels on one path are told apart', async () => {
        const fresh = await loaded();
        const { body } = render(Bookmarks, {
            context: clientContext(fresh),
            props: {
                rows: fresh.fs.bookmarks().entries,
                error: '',
                open: true,
                editing: '',
                adding: false,
                ontoggle: noop,
                onadd: noop,
                onopen: noop,
                onedit: noop,
                onretry: noop
            }
        });

        expect(body).toContain('aria-label="Bookmarks"');
        expect(body).toContain('Open hub/docs/manual.md');
    });

    // Revert: in `markForm` of views/sources/files/Files.svelte, test a component `$state('')` for
    // 'bookmark' instead of `view.form`, or draw the form whenever `view.form` is 'bookmark'.
    it('draws the bookmark form open when the instance state says it is, over the bookmark it names', async () => {
        const fresh = await loaded();
        const drawn = (state: unknown): string => {
            fresh.ui.setInstanceState('files-one', state);
            return render(Files, {
                context: clientContext(fresh),
                props: { instance: instance() }
            }).body;
        };

        // the instance holds no form, so no form is drawn
        expect(drawn({})).not.toContain('data-form=');
        const adding = drawn({ form: 'bookmark' });
        expect(adding).toContain('data-form="add"');
        expect(adding).toContain('aria-label="Label"');
        const editing = drawn({ form: 'bookmark', editing: 'the manual' });
        expect(editing).toContain('data-form="edit"');
        expect(editing).toContain('value="the manual"');
        // An edit form whose bookmark is not in the list, as before the bookmarks are read after a
        // reload, draws no form: drawn, it would be an add form where the edit form belongs, whose
        // Save adds a new bookmark and under which what was typed into the edit form is hidden.
        client.ui.setInstanceState('files-one', { form: 'bookmark', editing: 'the manual' });
        const unread = render(Files, {
            context: clientContext(client),
            props: { instance: instance() }
        }).body;
        // the bookmarks have not been read, so the bookmark the form names is not there to edit
        expect(unread).not.toContain('data-form=');
        // and a form naming an entry the read list does not hold draws none either
        expect(drawn({ form: 'bookmark', editing: 'no such bookmark' })).not.toContain(
            'data-form='
        );
    });

    it("draws the add form over the bookmarks file's own schema, with the roots in force", async () => {
        const fresh = await loaded();
        const schema = fresh.fs
            .bookmarks()
            .schema.map((field) =>
                field.field === 'root' ? { ...field, options: ['hub', 'notes'] } : field
            );
        const { body } = render(EntryForm, {
            context: clientContext(fresh),
            props: {
                collection: BOOKMARK_COLLECTION,
                schema,
                entry: null,
                initial: { root: 'hub' },
                onadd: () => Promise.resolve({ ok: true, changed: [], refused: [] }),
                onclose: noop,
                onsaid: noop
            }
        });

        // The file's three fields, in the file's own order, each as the control its type names.
        expect(body).toContain('data-form="add"');
        expect(body).toContain('aria-label="Label"');
        expect(body).toContain('aria-label="Root"');
        expect(body).toContain('aria-label="Path"');
        expect(body).toContain('<select');
        // The roots of the workspace in force are the choices, and the open one is selected.
        expect(body).toContain('>hub<');
        expect(body).toContain('>notes<');
        expect(/<option[^>]*selected[^>]*>\s*hub/.test(body)).toBe(true);
    });

    it('offers the same three controls before any bookmark has been written', async () => {
        vi.stubGlobal('window', {});
        vi.stubGlobal('fetch', (url: string) =>
            Promise.resolve(
                url.includes('bookmarks=1')
                    ? json(
                          JSON.stringify({
                              entries: [],
                              schema: [
                                  { field: 'label', type: 'text', label: 'Label', required: true },
                                  { field: 'root', type: 'select', label: 'Root' },
                                  { field: 'path', type: 'text', label: 'Path' }
                              ]
                          })
                      )
                    : json(ROOTS)
            )
        );
        const fresh = createClientState();
        fresh.fs.bookmarks();
        await settle();
        const { body } = render(EntryForm, {
            context: clientContext(fresh),
            props: {
                collection: BOOKMARK_COLLECTION,
                schema: fresh.fs.bookmarks().schema,
                entry: null,
                onadd: () => Promise.resolve({ ok: true, changed: [], refused: [] }),
                onclose: noop,
                onsaid: noop
            }
        });

        expect(fresh.fs.bookmarks().entries).toEqual([]);
        expect(body).toContain('aria-label="Label"');
        expect(body).toContain('aria-label="Root"');
        expect(body).toContain('aria-label="Path"');
    });
});
