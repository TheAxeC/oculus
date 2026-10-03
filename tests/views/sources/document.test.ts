// One local HTML file as its own tab, rendered to HTML on the server: the frame the document sits
// in, and the address api/file answers for it.
//
// The catalog and the glyphs are the real config; the bookmark is synthetic. What this does NOT
// cover: the browser loading the document, its relative assets and its own scripts inside the
// frame, which is what the sandbox attribute governs and no server rendering exercises; the route
// the frame addresses is covered by tests/routes/files/file.test.ts.

import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Document from '../../../src/lib/views/sources/document/Document.svelte';
import { fileUrl } from '../../../src/lib/views/shared/links/file-url.ts';
import { installRealText } from '../shared/real-text.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';
import { between } from '../shared/pane-parts.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

installRealText();

/** One instance of the view, opened for the bookmark the rail hands openView. */
function instance(state: unknown): Instance {
    return { id: 'document-one', view: 'document', state };
}

const MANUAL = {
    id: 'cathedra/docs/user/manual.html',
    root: 'cathedra',
    path: 'docs/user/manual.html',
    label: 'cathedra manual'
};

describe('the address of a document', () => {
    it('is the root and the path under api/file', () => {
        expect(fileUrl('cathedra', 'docs/user/manual.html')).toBe(
            '/api/file/cathedra/docs/user/manual.html'
        );
    });

    it('escapes each segment on its own, so a separator stays a separator', () => {
        expect(fileUrl('game-engine', 'docs/a b/read me.html')).toBe(
            '/api/file/game-engine/docs/a%20b/read%20me.html'
        );
    });
});

describe('a document as its own tab', () => {
    // Revert: draw the pane's title row over the frame again.
    it('frames the file the bookmark names, titled by its label, and draws no title row', () => {
        const { body } = render(Document, {
            context: clientContext(client),
            props: { instance: instance(MANUAL) }
        });
        expect(body).toContain('src="/api/file/cathedra/docs/user/manual.html"');
        expect(body).toContain('title="cathedra manual"');
        // the pane draws the file's path as a breadcrumb, so the tab keeps no heading of its own
        expect(body).not.toContain('<h2');
        expect(body).toContain('data-root="cathedra"');
    });

    it('sandboxes the frame to its own origin and its own scripts, and no more', () => {
        const { body } = render(Document, {
            context: clientContext(client),
            props: { instance: instance(MANUAL) }
        });
        const found = /<iframe[^>]*\ssandbox="([^"]*)"/.exec(body);
        expect(found?.[1]).toBe('allow-same-origin allow-scripts');
    });

    it('offers the control that opens the same address in a browser tab', () => {
        const { body } = render(Document, {
            context: clientContext(client),
            props: { instance: instance(MANUAL) }
        });
        expect(body).toContain('Open in a browser tab');
    });

    it('frames nothing and says so when the instance names no file', () => {
        const { body } = render(Document, {
            context: clientContext(client),
            props: { instance: instance({}) }
        });
        // the instance names no file, so there is nothing to frame
        expect(body).not.toContain('<iframe');
        expect(body).toContain('No document chosen.');
    });
});

describe('where the document puts its control', () => {
    it('keeps Open in a browser tab in the header as a bare icon named by its words, and draws no bar', () => {
        const { body } = render(Document, {
            context: clientContext(client),
            props: { instance: instance(MANUAL) }
        });
        const header = between(body, '<header', '</header>');
        const tool = /<button[^>]*class="tool[^"]*"[^>]*>/.exec(header)?.[0] ?? '';
        expect(tool).toMatch(/\bbare\b/);
        expect(tool).toContain('aria-label="Open in a browser tab"');
        expect(header).toContain('data-glyph="launch"');
        // an icon action carries its words as the name and draws none beside the icon
        expect(header).not.toContain('<span class="label">');
        // the one control is an icon, so the pane draws no bar under its header
        expect(body).not.toContain('class="viewbar');
    });
});
