// The source editor rendered on the server: escaped highlight mirror, editable and read-only
// controls, the save status words from the catalog, and the rendered half a Markdown tab draws
// beside the editor.
//
// What this does NOT cover: what the sanitiser does to markup a file carries. The suite runs in
// node, where DOMPurify has no document and ui/html.ts hands the text back, which its own head
// comment says; the filtering is exercised in Chrome, by the preview case of
// tests/browser/source.spec.ts and by tests/browser/sanitise.spec.ts.

import { render } from 'svelte/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Editor from '../../src/lib/views/source/Editor.svelte';
import Source from '../../src/lib/views/Source.svelte';
import { sourceTabState } from '../../src/lib/state/source.svelte.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import { noop } from '../doubles.ts';
import { clientContext, createClientState, type ClientState } from '../client.ts';

let client: ClientState;
let receive: ClientState['entities']['receive'];
let loadUi: ClientState['ui']['loadUi'];
let instanceState: ClientState['ui']['instanceState'];
let revertSourceDraft: ClientState['source']['revertSourceDraft'];
let editSourceDraft: ClientState['source']['editSourceDraft'];
let loadSourceDraft: ClientState['source']['loadSourceDraft'];
let saveSourceDraft: ClientState['source']['saveSourceDraft'];
let toggleSourcePreview: ClientState['source']['toggleSourcePreview'];
let setToken: ClientState['writes']['setToken'];

beforeEach(() => {
    client = createClientState();
    ({ receive } = client.entities);
    ({ loadUi, instanceState } = client.ui);
    ({ revertSourceDraft, editSourceDraft, loadSourceDraft, saveSourceDraft, toggleSourcePreview } =
        client.source);
    ({ setToken } = client.writes);
    installFixture();
});

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));
/** What every case here starts from, installed into the case's own client. */
function installFixture(): void {
    receive({ channel: 'config', version: 1, payload: { config, text: catalog, findings: [] } });
}

beforeEach(() => loadUi({ getItem: () => null, setItem: noop }));
afterEach(() => vi.unstubAllGlobals());

const actions = { oninput: noop, onsave: noop, onrevert: noop, onpreview: noop };

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
        expect(
            render(Source, { context: clientContext(client), props: { instance } }).body
        ).toContain('saved original');
        editSourceDraft(instance.id, 'unsaved working copy');
        const other = {
            id: 'source-two',
            view: 'source',
            state: sourceTabState('hub', 'other.md')
        };
        await loadSourceDraft(other.id, 'hub', 'other.md');
        render(Source, { context: clientContext(client), props: { instance: other } });
        await loadSourceDraft(instance.id, 'hub', 'notes.md');
        const restored = render(Source, {
            context: clientContext(client),
            props: { instance }
        }).body;
        expect(restored).toContain('unsaved working copy');
        expect(restored).not.toContain('saved original');
        expect(instanceState(instance.id)).toMatchObject({
            text: 'unsaved working copy',
            saved: 'saved original'
        });
        expect(fetcher).toHaveBeenCalledTimes(2);
        revertSourceDraft(instance.id);
        expect(
            render(Source, { context: clientContext(client), props: { instance } }).body
        ).toContain('saved original');
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
        const editable = render(Source, {
            context: clientContext(client),
            props: { instance }
        }).body;
        expect(editable).toMatch(/class="mirror(?:\s|")/);
        expect(editable).toContain(`>${catalog['editor.save']}</span>`);
        expect(editable).toContain(catalog['source.saved']);
        const readonly = {
            id: 'source-read',
            view: 'source',
            state: sourceTabState('hub', 'program.py')
        };
        await loadSourceDraft(readonly.id, 'hub', 'program.py');
        const body = render(Source, {
            context: clientContext(client),
            props: { instance: readonly }
        }).body;
        expect(body).toContain('readonly');
        expect(body).not.toContain(`>${catalog['editor.save']}</span>`);
    });

    it('draws the highlight mirror, editable textarea, Save, Revert, and saved word', () => {
        const { body } = render(Editor, {
            context: clientContext(client),
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

    it('draws the rendered half beside a Markdown file and nothing beside a YAML one', () => {
        const drawn = (path: string): string =>
            render(Editor, {
                context: clientContext(client),
                props: { path, text: '# A heading\n\ntext of it\n', editable: true, ...actions }
            }).body;

        const markdown = drawn('notes.md');
        expect(markdown).toContain('data-source-preview="notes.md"');
        expect(markdown).toContain('<h1>A heading</h1>');
        expect(markdown).toContain(`>${catalog['source.preview']}</span>`);

        const yaml = drawn('notes.yml');
        expect(yaml).not.toContain('data-source-preview');
        expect(yaml).not.toContain(`>${catalog['source.preview']}</span>`);
    });

    it('leaves a front matter block out of the rendered half and a relative image as written', () => {
        const body = render(Editor, {
            context: clientContext(client),
            props: {
                path: 'PRESENT.md',
                text: '---\ntitle: A deck\nlevel: 2\n---\n\n# Prose\n\n![fig](figures/a.png)\n',
                editable: true,
                ...actions
            }
        }).body;
        const preview = body.slice(body.indexOf('data-source-preview'));
        expect(preview).toContain('<h1>Prose</h1>');
        expect(preview).not.toContain('title: A deck');
        expect(preview).not.toContain('<hr');
        expect(preview).toContain('src="figures/a.png"');
    });

    it('takes the rendered half away when the instance state says the toggle is off', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve(new Response('# A heading\n')))
        );
        const instance = {
            id: 'source-preview',
            view: 'source',
            state: sourceTabState('hub', 'notes.md')
        };
        await loadSourceDraft(instance.id, 'hub', 'notes.md');
        const shown = render(Source, { context: clientContext(client), props: { instance } }).body;
        expect(shown).toContain('<h1>A heading</h1>');

        toggleSourcePreview(instance.id);
        expect(instanceState(instance.id)).toMatchObject({ preview: false });
        const hidden = render(Source, { context: clientContext(client), props: { instance } }).body;
        expect(hidden).not.toContain('data-source-preview');
        expect(hidden).toContain(catalog['source.preview']);
    });

    it('draws a read-only textarea without Save', () => {
        const { body } = render(Editor, {
            context: clientContext(client),
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
