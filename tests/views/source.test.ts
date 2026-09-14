// The source editor rendered on the server: escaped highlight mirror, editable and read-only
// controls, and the save status words from the catalog.

import { render } from 'svelte/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Editor from '../../src/lib/views/source/Editor.svelte';
import Source from '../../src/lib/views/Source.svelte';
import { receive } from '../../src/lib/state/entities.svelte.ts';
import { loadUi, instanceState } from '../../src/lib/state/ui.svelte.ts';
import {
    revertSourceDraft,
    editSourceDraft,
    loadSourceDraft,
    saveSourceDraft,
    sourceTabState
} from '../../src/lib/state/source.svelte.ts';
import { setToken } from '../../src/lib/state/writes.svelte.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));
receive({ channel: 'config', version: 1, payload: { config, text: catalog, findings: [] } });

beforeEach(() => loadUi({ getItem: () => null, setItem: () => {} }));
afterEach(() => vi.unstubAllGlobals());

const actions = { oninput: () => {}, onsave: () => {}, onrevert: () => {} };

describe('the source editor', () => {
    it('restores the working and saved copies when Source is rendered again after another tab', async () => {
        const fetcher = vi.fn(() => Promise.resolve(new Response('saved original')));
        vi.stubGlobal('fetch', fetcher);
        const instance = {
            id: 'source-one',
            view: 'source',
            state: sourceTabState('hub', 'notes.md')
        };
        await loadSourceDraft(instance.id, 'hub', 'notes.md');
        expect(render(Source, { props: { instance } }).body).toContain('saved original');
        editSourceDraft(instance.id, 'unsaved working copy');
        const other = {
            id: 'source-two',
            view: 'source',
            state: sourceTabState('hub', 'other.md')
        };
        await loadSourceDraft(other.id, 'hub', 'other.md');
        render(Source, { props: { instance: other } });
        await loadSourceDraft(instance.id, 'hub', 'notes.md');
        const restored = render(Source, { props: { instance } }).body;
        expect(restored).toContain('unsaved working copy');
        expect(restored).not.toContain('saved original');
        expect(instanceState(instance.id)).toMatchObject({
            text: 'unsaved working copy',
            saved: 'saved original'
        });
        expect(fetcher).toHaveBeenCalledTimes(2);
        revertSourceDraft(instance.id);
        expect(render(Source, { props: { instance } }).body).toContain('saved original');
    });

    it('renders Source with the saved word and controls selected by configured extension', async () => {
        vi.stubGlobal('fetch', (_url: string, init?: RequestInit) =>
            Promise.resolve(
                new Response(init === undefined ? 'complete text' : JSON.stringify({ ok: true }))
            )
        );
        setToken('source-token');
        const instance = {
            id: 'source-edit',
            view: 'source',
            state: sourceTabState('hub', 'notes.md')
        };
        await loadSourceDraft(instance.id, 'hub', 'notes.md');
        await saveSourceDraft(instance.id, 'hub', 'notes.md');
        const editable = render(Source, { props: { instance } }).body;
        expect(editable).toMatch(/class="mirror(?:\s|")/);
        expect(editable).toContain(`>${catalog['editor.save']}</span>`);
        expect(editable).toContain(catalog['source.saved']);
        const readonly = {
            id: 'source-read',
            view: 'source',
            state: sourceTabState('hub', 'program.py')
        };
        await loadSourceDraft(readonly.id, 'hub', 'program.py');
        const body = render(Source, { props: { instance: readonly } }).body;
        expect(body).toContain('readonly');
        expect(body).not.toContain(`>${catalog['editor.save']}</span>`);
    });

    it('draws the highlight mirror, editable textarea, Save, Revert, and saved word', () => {
        const { body } = render(Editor, {
            props: {
                path: 'notes.yml',
                text: 'title: "A < B"',
                editable: true,
                message: catalog['source.saved'],
                ...actions
            }
        });
        expect(body).toMatch(/class="mirror(?:\s|")/);
        expect(body).toContain('source-key');
        expect(body).toContain('&lt; B');
        expect(body).toContain(`>${catalog['editor.save']}</span>`);
        expect(body).toContain(`>${catalog['editor.revert']}</span>`);
        expect(body).toContain(glyphCatalog(config)[catalog['editor.revert_glyph']]);
        expect(body).toContain(catalog['source.saved']);
        expect(body).not.toContain('readonly');
    });

    it('draws a read-only textarea without Save', () => {
        const { body } = render(Editor, {
            props: {
                path: 'program.py',
                text: 'print("hello")',
                editable: false,
                ...actions
            }
        });
        expect(body).toContain('readonly');
        expect(body).not.toContain(`>${catalog['editor.save']}</span>`);
        expect(body).toContain(`>${catalog['editor.revert']}</span>`);
    });
});
