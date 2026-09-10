// One local HTML file as its own tab, rendered to HTML on the server: the frame the document sits in,
// and the address api/file answers for it.
//
// The catalog and the glyphs are the real config; the bookmark is synthetic. What this does NOT cover:
// the browser loading the document, its relative assets and its own scripts inside the frame, which is
// what the sandbox attribute governs and no server rendering exercises; the route the frame addresses
// is covered by tests/routes/file.test.ts.

import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Document, { fileUrl } from '../../src/lib/views/Document.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import type { Instance } from '../../src/lib/state/layout.ts';

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

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
    it('frames the file the bookmark names, with the pane titled by its label', () => {
        const { body } = render(Document, { props: { instance: instance(MANUAL) } });
        expect(body).toContain('src="/api/file/cathedra/docs/user/manual.html"');
        expect(body).toContain('cathedra manual');
        expect(body).toContain('data-root="cathedra"');
    });

    it('sandboxes the frame to its own origin and its own scripts, and no more', () => {
        const { body } = render(Document, { props: { instance: instance(MANUAL) } });
        const found = /<iframe[^>]*\ssandbox="([^"]*)"/.exec(body);
        expect(found?.[1]).toBe('allow-same-origin allow-scripts');
    });

    it('offers the control that opens the same address in a browser tab', () => {
        const { body } = render(Document, { props: { instance: instance(MANUAL) } });
        expect(body).toContain('Open in a browser tab');
    });

    it('frames nothing and says so when the instance names no file', () => {
        const { body } = render(Document, { props: { instance: instance({}) } });
        expect(body).not.toContain('<iframe');
        expect(body).toContain('No document chosen.');
    });
});
