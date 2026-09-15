// One Markdown document of the hub as its own tab, rendered to HTML on the server: what the tab is
// titled, what it says when it was opened for nothing, and what the shared Markdown partial draws
// for each state of a fetched document.
//
// The catalog and the glyphs are the real config; the instance state and the document are synthetic.
// What this does NOT cover: the fetch state/docs.svelte.ts makes, which needs a server and is
// exercised by tests/browser/system.spec.ts, and the sanitiser, which needs a DOM and passes the
// markup through unchanged here.

import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Doc from '../../src/lib/views/Doc.svelte';
import Markdown from '../../src/lib/views/shared/Markdown.svelte';
import { docState, type DocEntry } from '../../src/lib/shell/rail.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import type { DocState } from '../../src/lib/state/docs.svelte.ts';
import type { Instance } from '../../src/lib/state/layout/index.ts';
import { clientContext, createClientState, type ClientState } from '../client.ts';

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

/** The view with a doubled document store, so a case draws a document without a server. */
function drawn(state: unknown, doc: DocState): string {
    const context = clientContext({ ...client, docs: { ...client.docs, hubDocument: () => doc } });
    return render(Doc, { context, props: { instance: instance(state) } }).body;
}

const READY: DocState = {
    html: '<h1>Approach</h1>',
    frontmatter: null,
    error: '',
    loading: false
};

describe('the state a document tab is opened with', () => {
    it('is the path, so one entry is one tab and another entry is another', () => {
        expect(docState(ENTRY)).toEqual({
            id: 'RESEARCH-APPROACH.md',
            path: 'RESEARCH-APPROACH.md',
            label: 'Research approach'
        });
    });
});

describe('a hub document as its own tab', () => {
    it('draws the document under the entry label, with its path on the box', () => {
        const body = drawn(docState(ENTRY), READY);

        expect(body).toContain('Research approach');
        expect(body).toContain('data-path="RESEARCH-APPROACH.md"');
        expect(body).toContain('<h1>Approach</h1>');
    });

    it('draws nothing and says so when the instance names no document', () => {
        const body = drawn({}, READY);

        expect(body).toContain('No document chosen.');
        expect(body).not.toContain('<h1>Approach</h1>');
    });

    it('says the document is being read while the first answer is still to come', () => {
        const body = drawn(docState(ENTRY), {
            html: '',
            frontmatter: null,
            error: '',
            loading: true
        });

        expect(body).toContain('Reading the document...');
    });

    it('says what the read failed with, and draws no document', () => {
        const body = drawn(docState(ENTRY), {
            html: '<h1>Approach</h1>',
            frontmatter: null,
            error: 'document does not exist',
            loading: false
        });

        expect(body).toContain('The document could not be read: document does not exist');
        expect(body).not.toContain('<h1>Approach</h1>');
    });
});

describe('the shared Markdown partial', () => {
    it('draws headings, lists, tables and figures as the server rendered them', () => {
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
