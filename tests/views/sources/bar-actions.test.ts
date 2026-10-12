// Layer 4, view tests. That a file tab of each view kind hands its actions to the breadcrumb bar of
// its pane (ui/tabs/tab-actions.svelte.ts) when one applies, and hands none for a tab that names no
// file. Each view is rendered on the server inside a host that provides the tab actions as PaneView
// does, which runs the view's own `handUp` as the component starts. The client serves the one
// folder `hub`, the workspace's primary, which the star and Open in Program act on, and a source
// tab's draft is held in the client's ui store as its read left it.
//
// It does not cover the buttons the bar draws, which the look does.

import type { Component } from 'svelte';
import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import Doc from '../../../src/lib/views/sources/doc/Doc.svelte';
import Document from '../../../src/lib/views/sources/document/Document.svelte';
import File from '../../../src/lib/views/sources/file/File.svelte';
import MarkdownPreview from '../../../src/lib/views/sources/doc/MarkdownPreview.svelte';
import Source from '../../../src/lib/views/sources/source/Source.svelte';
import type { TabActions } from '../../../src/lib/ui/tabs/tab-actions.svelte.ts';
import { clientContext, emptyClient, type ClientState } from '../../fixtures/client.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout';
import ActionsHost from './ActionsHost.svelte';

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

let client: ClientState;
beforeEach(() => {
    client = emptyClient();
    client.fs.roots = () => [{ key: 'hub', dir: '/hub', hub: true }];
    client.fs.primary = () => 'hub';
});

/** Draw one view for a tab and answer the actions store the host provided. */
function drawn(
    view: Component<{ instance: Instance }>,
    id: string,
    state: Record<string, unknown>
): TabActions {
    let provided: TabActions | undefined;
    // The render runs when its body is read.
    const { body } = render(ActionsHost, {
        props: {
            view,
            instance: { id, view: 'x', state },
            onprovided: (actions: TabActions) => (provided = actions)
        },
        context: clientContext(client)
    });
    if (typeof body !== 'string') throw new Error('the view drew nothing');
    if (provided === undefined) throw new Error('the host provided no tab actions');
    return provided;
}

/** A source tab's draft after a read of `notes/a.py`, and after a later read the server refused. */
const READ = { file: 'hub/notes/a.py', text: 'x', saved: 'x', loaded: true };
const REFUSED = { ...READ, error: 'Cannot open: The server refused the request (HTTP 404).' };

const VIEWS = [
    { row: 'a source tab', view: Source, state: { root: 'hub', path: 'notes/a.py' } },
    { row: 'a picture or a download tab', view: File, state: { root: 'hub', path: 'a.png' } },
    { row: 'a PDF tab', view: File, state: { root: 'hub', path: 'a.pdf' } },
    { row: 'a document tab', view: Document, state: { root: 'hub', path: 'a.html' } },
    { row: 'a Doc tab', view: Doc, state: { path: 'docs/a.md' } },
    { row: 'a Markdown preview tab', view: MarkdownPreview, state: { root: 'hub', path: 'a.md' } }
];

describe('the place a file tab hands its actions to', () => {
    it.each(VIEWS)('hands $row its actions for the bar', ({ view, state }) => {
        client.ui.setInstanceState('tab-1', READ);
        expect(drawn(view, 'tab-1', state).of('tab-1')).toBeDefined();
    });

    it('hands a source tab whose file a later read refused nothing', () => {
        client.ui.setInstanceState('tab-1', REFUSED);
        expect(drawn(Source, 'tab-1', { root: 'hub', path: 'notes/a.py' }).of('tab-1')).toBe(
            undefined
        );
    });

    it.each([
        { row: 'a picture tab', view: File },
        { row: 'a document tab', view: Document },
        { row: 'a Doc tab', view: Doc },
        { row: 'a Markdown preview tab', view: MarkdownPreview }
    ])('hands $row that names no file nothing', ({ view }) => {
        expect(drawn(view, 'tab-1', {}).of('tab-1')).toBeUndefined();
    });
});
