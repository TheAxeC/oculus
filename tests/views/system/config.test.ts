// The Config view: which files it cards, what each card says, and what its controls address.
//
// The listing and the file text are synthetic, handed in through a doubled file-browser store, so
// no case reads the engine's own folder through a server. The catalog is the real config, which is
// what holds the descriptions the cards draw. What this does NOT cover: the fetch
// state/sources/fs.svelte.ts makes and the click that opens a file, both exercised by
// tests/browser/workbench/system.spec.ts.
//
// The refresh the view asks for on a config push is recorded by the double rather than followed:
// what the store does with it is tests/state/sources/fs.test.ts's.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Config from '../../../src/lib/views/system/config/Config.svelte';
import Source from '../../../src/lib/views/sources/source/Source.svelte';
import { descriptionKey } from '../../../src/lib/views/system/config/files.ts';
import { ENGINE_ROOT, type FsEntry } from '../../../src/lib/state/sources/fs.ts';
import { sourceTabState } from '../../../src/lib/state/sessions/source.svelte.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/words/text.ts';
import type { FileText } from '../../../src/lib/state/sources/fs.svelte.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));

function file(name: string): FsEntry {
    return { name, kind: 'file', size: 100, mtime: 0 };
}

function directory(name: string): FsEntry {
    return { name, kind: 'dir', size: 0, mtime: 0 };
}

const LAYOUT = 'nav_groups:\n  boards: { label: "Boards" }\n';

function text(body: string): FileText {
    return { text: body, truncated: false, error: '', loading: false };
}

const instance: Instance = { id: 'config-one', view: 'config', state: {} };

/** What the view asked the file browser's store to read again, in order. */
let refreshed: { root: string; version: number }[] = [];

/** The view over a synthetic listing, with the same text answered for every file. */
function drawn(entries: FsEntry[], held: FileText = text(LAYOUT)): string {
    refreshed = [];
    const context = clientContext({
        ...client,
        fs: {
            ...client.fs,
            entries: () => entries,
            fileText: () => held,
            refresh: (root: string, version: number) => refreshed.push({ root, version })
        }
    });
    return render(Config, { context, props: { instance } }).body;
}

describe('which files the view cards', () => {
    it('keys a description by the file name, with a hyphen written as an underscore', () => {
        expect(descriptionKey('layout.yml')).toBe('config.desc_layout');
        expect(descriptionKey('manifest-schema.yml')).toBe('config.desc_manifest_schema');
    });
});

describe('the Config view', () => {
    it('draws one card per file, with its description from the catalog', () => {
        const body = drawn([file('layout.yml'), file('vocab.yml'), directory('text')]);

        expect(body).toContain('layout.yml');
        expect(body).toContain('vocab.yml');
        expect(body).toContain(catalog['config.desc_layout']);
        expect(body).toContain(catalog['config.desc_vocab']);
    });

    it('says how many lines the file holds on the control that shows it', () => {
        const body = drawn([file('layout.yml')], text('one\ntwo\nthree\n'));

        expect(body).toContain('>3</strong>');
        expect(body).toContain('lines');
    });

    it('shows the raw text only for a file the tab was left open on', () => {
        const closed = drawn([file('layout.yml')], text(LAYOUT));
        // the tab was left closed on this file, so its raw text is not drawn
        expect(closed).not.toContain('data-file="layout.yml"');

        client.ui.setInstanceState(instance.id, { open: ['layout.yml'] });
        const open = drawn([file('layout.yml')], text(LAYOUT));
        expect(open).toContain('data-file="layout.yml"');
        expect(open).toContain('nav_groups');
    });

    // The word is the one every view drawn from a file carries over its own file, not a word of the
    // Config view's own, so a card reads the same as the control closing a feed view's toolbar.
    it('offers the shared control naming the file it opens', () => {
        const body = drawn([file('layout.yml')]);

        expect(body).toContain('Open file');
        expect(body).toContain('Open layout.yml in a source tab');
    });

    it('opens that file in a source tab over the engine root', () => {
        expect(sourceTabState(ENGINE_ROOT, 'layout.yml')).toEqual({
            root: 'engine',
            path: 'layout.yml',
            label: 'layout.yml'
        });
        // The tab that state opens is the source view, on the file the card named.
        const body = render(Source, {
            context: clientContext(client),
            props: {
                instance: {
                    id: 'source-one',
                    view: 'source',
                    state: sourceTabState(ENGINE_ROOT, 'layout.yml')
                }
            }
        }).body;
        expect(body).toContain('data-root="engine"');
        expect(body).toContain('data-path="layout.yml"');
        expect(body).toContain('layout.yml');
    });

    it('draws the config version its cards were read at', () => {
        expect(drawn([file('layout.yml')])).toContain('data-config="0"');
        client.entities.receive({ channel: 'config', version: 9, payload: { config: {} } });
        expect(drawn([file('layout.yml')])).toContain('data-config="9"');
    });

    it('hands that version to the file browser store, for the engine root and no other', () => {
        // The effect runs in a browser and this suite has no DOM, so what the effect does is
        // pinned by its source; what the store does with it is tests/state/sources/fs.test.ts.
        const source = readFileSync(
            join(engineDir(), 'src', 'lib', 'views', 'system', 'config', 'Config.svelte'),
            'utf8'
        );
        expect(source).toContain("const pushed = $derived(message('config')?.version ?? 0);");
        expect(source).toContain('refresh(ENGINE_ROOT, pushed);');
        expect(refreshed).toEqual([]);
    });

    it('says the preview is cut, and counts the lines it holds, for a file over the limit', () => {
        const body = drawn([file('layout.yml')], {
            text: 'one\ntwo\n',
            truncated: true,
            error: '',
            loading: false
        });

        expect(body).toContain('data-cut="layout.yml"');
        expect(body).toContain(catalog['file.truncated']);
        expect(body).toContain('>2</strong>');
    });

    it('says nothing about a cut for a file the window holds whole', () => {
        // the window holds the file whole, so nothing says it was cut
        expect(drawn([file('layout.yml')])).not.toContain('data-cut=');
    });

    it('says the file is being read, and says what a failed read failed with', () => {
        expect(
            drawn([file('layout.yml')], { text: '', truncated: false, error: '', loading: true })
        ).toContain('Reading...');
        expect(
            drawn([file('layout.yml')], {
                text: '',
                truncated: false,
                error: 'the file is not there',
                loading: false
            })
        ).toContain('This file could not be read: the file is not there');
    });

    it('says so when the folder answered nothing', () => {
        expect(drawn([])).toContain('No configuration file was read.');
    });

    it('draws the intro naming the machine-local file, where it sits and whose it is', () => {
        const body = drawn([file('layout.yml')]);
        expect(body).toContain('local.yml');
        // The words themselves, so an intro that goes back to saying the file is not served fails.
        expect(body).toContain('in local.yml of the same folder');
        expect(body).toContain("which is this machine's own");
        // the intro names the machine-local file and where it sits, rather than saying it is not
        // served
        expect(body).not.toContain('not served here');
    });

    it('cards the machine own file with its tag and its line, and nothing when it is not there', () => {
        const body = drawn([file('layout.yml'), file('local.yml')]);

        expect(body).toContain('data-card="local.yml"');
        expect(body).toContain(catalog['config.local_tag']);
        expect(body).toContain(catalog['config.desc_local']);
        // The tag marks that one card and no other, and a folder without the file draws neither.
        expect(body.indexOf('data-card="layout.yml"')).toBeLessThan(
            body.indexOf('data-card="local.yml"')
        );
        const without = drawn([file('layout.yml')]);
        // this folder holds no local.yml, so there is no card for it
        expect(without).not.toContain('data-card="local.yml"');
        // and no tag marking one either
        expect(without).not.toContain(catalog['config.local_tag']);
        // and the words describing that file are not drawn either, since the folder holds none
        expect(without).not.toContain(catalog['config.desc_local']);
    });
});
