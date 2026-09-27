// One Markdown document of the hub as its own tab, rendered to HTML on the server: what the tab is
// titled, what it says when it was opened for nothing, and what the shared Markdown partial draws
// for each state of a fetched document.
//
// The catalog and the glyphs are the real config; the instance state, the `docs:` list pushed on
// the config channel and the document are synthetic. What this does NOT cover: the fetch
// state/system/docs.svelte.ts makes, which needs a server; the tab of a moved entry writing the
// entry's path into the saved layout, which is an effect and runs only in a browser; and the
// sanitiser, which needs a DOM and passes the markup through unchanged here. All three are
// tests/browser/workbench/system.spec.ts.

import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Doc from '../../../src/lib/views/sources/doc/Doc.svelte';
import Markdown from '../../../src/lib/views/shared/prose/Markdown.svelte';
import { docState, type DocEntry } from '../../../src/lib/state/workbench/navigation/catalogue.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import type { DocState } from '../../../src/lib/state/system/docs.svelte.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

const ENTRY: DocEntry = {
    label: 'Research approach',
    path: 'RESEARCH-APPROACH.md',
    group: 'personal'
};

function instance(state: unknown): Instance {
    return { id: 'doc-one', view: 'doc', state };
}

/** The paths the doubled store was asked for, in order. */
let asked: string[] = [];

/** The view with a doubled document store, so a case draws a document without a server. */
function drawn(state: unknown, doc: DocState): string {
    asked = [];
    const hubDocument = (path: string): DocState => {
        asked.push(path);
        return doc;
    };
    const context = clientContext({ ...client, docs: { ...client.docs, hubDocument } });
    return render(Doc, { context, props: { instance: instance(state) } }).body;
}

/** Push a config whose `docs:` list is the entries given, as the server's config channel does. */
function listing(docs: DocEntry[]): void {
    client.entities.receive({
        channel: 'config',
        version: 1,
        payload: { config: { ...config, docs }, text: textCatalog(config), findings: [] }
    });
}

const READY: DocState = {
    html: '<h1>Approach</h1>',
    frontmatter: null,
    error: '',
    loading: false
};

describe('the state a document tab is opened with', () => {
    it('is the path, so one entry is one tab and another entry is another', () => {
        // revert: src/lib/state/workbench/navigation/catalogue.ts "return { id: entry.path, path: entry.path, label: entry.label };" => return { id: entry.label, path: entry.path, label: entry.label };
        expect(docState(ENTRY)).toEqual({
            id: 'RESEARCH-APPROACH.md',
            path: 'RESEARCH-APPROACH.md',
            label: 'Research approach'
        });
    });
});

describe('a hub document as its own tab', () => {
    it('draws the document under the entry label, with its path on the box', () => {
        // revert: src/lib/views/sources/doc/Doc.svelte "<div class=\"view\" data-instance={instance.id} data-path={reading === '' ? path : reading}>" => <div class="view" data-instance={instance.id}>
        const body = drawn(docState(ENTRY), READY);

        expect(body).toContain('Research approach');
        expect(body).toContain('data-path="RESEARCH-APPROACH.md"');
        expect(body).toContain('<h1>Approach</h1>');
    });

    it('draws nothing and says so when the instance names no document', () => {
        // revert: src/lib/views/sources/doc/Doc.svelte "<Empty message={t('doc.none')} glyph={t('doc.none_glyph')} />" => <Empty message={t('doc.unlisted', path)} glyph={t('doc.none_glyph')} />
        const body = drawn({}, READY);

        expect(body).toContain('No document chosen.');
        // the instance names no document, so there is nothing to draw
        expect(body).not.toContain('<h1>Approach</h1>');
    });

    it('says the document is being read while the first answer is still to come', () => {
        // revert: src/lib/views/shared/prose/Markdown.svelte "{:else if doc.loading}" => {:else if false}
        const body = drawn(docState(ENTRY), {
            html: '',
            frontmatter: null,
            error: '',
            loading: true
        });

        expect(body).toContain('Reading the document...');
    });

    it('says what the read failed with and which path it read, and draws no document', () => {
        // revert: src/lib/views/sources/doc/Doc.svelte "failed={t('doc.failed', reading, shown.error)}" => failed={t('doc.failed', '', shown.error)}
        const body = drawn(docState(ENTRY), {
            html: '<h1>Approach</h1>',
            frontmatter: null,
            error: 'document does not exist',
            loading: false
        });

        expect(body).toContain(
            'The document RESEARCH-APPROACH.md could not be read: document does not exist'
        );
        // the read failed, so there is no document to draw
        expect(body).not.toContain('<h1>Approach</h1>');
    });
});

describe('a tab whose path the documents list no longer holds', () => {
    const MOVED: DocEntry = { ...ENTRY, path: 'docs/RESEARCH-APPROACH.md' };

    it('reads the path it holds while the list has not been pushed yet', () => {
        // revert: src/lib/views/sources/doc/Doc.svelte "const reading = $derived(followed === null ? path : (followed.entry?.path ?? ''));" => const reading = $derived(followed === null ? '' : (followed.entry?.path ?? ''));
        const body = drawn(docState(ENTRY), READY);
        expect(asked.at(-1)).toBe('RESEARCH-APPROACH.md');
        expect(body).toContain('<h1>Approach</h1>');
    });

    it('draws the entry carrying its label, at the entry path', () => {
        // revert: src/lib/views/sources/doc/Doc.svelte "const reading = $derived(followed === null ? path : (followed.entry?.path ?? ''));" => const reading = $derived(path);
        listing([MOVED]);
        const body = drawn(docState(ENTRY), READY);

        expect(asked.at(-1)).toBe('docs/RESEARCH-APPROACH.md');
        expect(body).toContain('data-path="docs/RESEARCH-APPROACH.md"');
        expect(body).toContain('<h1>Approach</h1>');
    });

    it('names the path it asked for when no entry carries its path or its label', () => {
        // revert: src/lib/views/sources/doc/Doc.svelte "<Empty message={t('doc.unlisted', path)} glyph={t('doc.none_glyph')} />" => <Empty message={t('doc.none')} glyph={t('doc.none_glyph')} />
        listing([MOVED]);
        const body = drawn({ id: 'GONE.md', path: 'GONE.md', label: 'Gone' }, READY);

        expect(body).toContain('GONE.md is not in the documents list of config/layout.yml');
        // No entry matched, so no document was asked for.
        expect(asked).toEqual([]);
        // Nothing was asked for, so no document is drawn.
        expect(body).not.toContain('<h1>Approach</h1>');
    });
});

describe('the shared Markdown partial', () => {
    it('draws headings, lists, tables and figures as the server rendered them', () => {
        // revert: src/lib/views/shared/prose/Markdown.svelte "{@html sanitise(doc.html)}" => {doc.html}
        const html =
            '<h2>Two</h2><ul><li>one</li></ul><table><tr><td>a</td></tr></table>' +
            '<img src="/api/file/hub/notes/one.png" alt="one">';
        const body = render(Markdown, {
            props: {
                doc: { html, frontmatter: null, error: '', loading: false },
                loading: 'reading',
                failed: 'failed'
            }
        }).body;

        expect(body).toContain('<h2>Two</h2>');
        expect(body).toContain('<li>one</li>');
        expect(body).toContain('<td>a</td>');
        expect(body).toContain('src="/api/file/hub/notes/one.png"');
    });
});
