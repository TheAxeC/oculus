// The one control every view drawn from a file of the hub closes its toolbar with: what it says,
// what its tooltip names, and the source tab pressing it opens.

import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import SourceButton from '../../src/lib/views/shared/SourceButton.svelte';
import { openSourceFile } from '../../src/lib/views/shared/source-file.ts';
import { findInstance } from '../../src/lib/state/instance.ts';
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

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));

beforeEach(() => {
    client = createClientState();
});

describe("the control over a view's own file", () => {
    it('carries the shared word, the root and path it was given, and the path in its tooltip', () => {
        const body = render(SourceButton, {
            context: clientContext(client),
            props: { file: { root: 'hub', path: 'feeds/literature-radar.yml' } }
        }).body;
        expect(body).toContain('data-source-root="hub"');
        expect(body).toContain('data-source-path="feeds/literature-radar.yml"');
        expect(body).toContain(catalog['views.open_source']);
        expect(body).toContain(
            catalog['views.open_source_tip'].replace('{0}', 'feeds/literature-radar.yml')
        );
        expect(body).not.toContain('{G.');
    });

    it('opens the file as a source tab and a second press reuses the same one', () => {
        client.layout.loadLayout({ getItem: () => null, setItem: noop });
        const file = { root: 'hub', path: 'funding/funding.yml' };
        const id = openSourceFile(client, file);
        expect(findInstance(client.layout.layout(), id)?.instance).toEqual({
            id,
            view: 'source',
            state: { ...file, label: 'funding.yml' }
        });
        expect(openSourceFile(client, file)).toBe(id);
    });

    it('carries the line a caller named into the tab it opens', () => {
        client.layout.loadLayout({ getItem: () => null, setItem: noop });
        const id = openSourceFile(client, { root: 'hub', path: 'src/a.ts', line: 12 });
        expect(findInstance(client.layout.layout(), id)?.instance.state).toEqual({
            root: 'hub',
            path: 'src/a.ts',
            label: 'a.ts',
            line: 12
        });
    });
});
