// Layer 4, view test. The Memories wall: a tile per picture of the folder, each addressed at the
// route rather than inlined, the empty line when the folder holds none, and the control that adds
// one.
//
// The store is handed its list by hand, since a server rendering makes no fetch. What this does NOT
// cover: the overlay opening and closing, which needs a browser and is
// tests/browser/memories.spec.ts.

import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import Memories, { registration } from '../../src/lib/views/Memories.svelte';
import type { ViewRegistration } from '../../src/lib/views/registry.ts';
import { engineDir, loadConfig, textCatalog } from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import { glyphCatalog } from '../../src/lib/data/sources/config.ts';
import type { Instance } from '../../src/lib/state/layout/index.ts';
import { clientContext, createClientState, type ClientState } from '../client.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

const config = loadConfig(engineDir()).config;
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));

const instance: Instance = { id: 'memories-one', view: 'memories', state: {} };

/** The view over a wall the store was handed. */
function drawn(images: string[]): string {
    client.memories.hold(images);
    return render(Memories, { context: clientContext(client), props: { instance } }).body;
}

/** The module's own registration, under the type every view module exports. */
const registered = registration as ViewRegistration;

describe('the Memories registration', () => {
    it('sits in the Personal group and is offered in the rail', () => {
        expect(registered).toMatchObject({
            id: 'memories',
            label: 'views.memories',
            glyph: 'views.memories_glyph',
            group: 'personal',
            order: 0
        });
        expect(registered.listed).toBeUndefined();
    });
});

describe('the wall', () => {
    it('draws one tile per picture, in the order the folder gave them', () => {
        const body = drawn(['mem-01.png', 'mem-02.jpg']);
        expect([...body.matchAll(/data-tile="([^"]+)"/g)].map((one) => one[1])).toEqual([
            'mem-01.png',
            'mem-02.jpg'
        ]);
    });

    it('addresses every picture at the route and inlines none of them', () => {
        const body = drawn(['mem-01.png']);
        expect(body).toContain('src="/api/memories?file=mem-01.png"');
        expect(body).not.toContain('data:image');
    });

    it('escapes a name that would otherwise be read as part of the address', () => {
        expect(drawn(['a b&c.png'])).toContain('src="/api/memories?file=a%20b%26c.png"');
    });

    it('says the wall is empty when the folder holds no picture', () => {
        const body = drawn([]);
        expect(body).toContain(catalog['memories.empty']);
        expect(body).not.toContain('data-tile=');
    });

    it('carries the add control with its words and the hidden input it presses', () => {
        const body = drawn([]);
        expect(body).toContain(catalog['memories.add']);
        expect(body).toContain('type="file"');
        expect(body).toContain('accept="image/jpeg,image/png"');
    });

    it('draws no overlay until a tile is pressed', () => {
        expect(drawn(['mem-01.png'])).not.toContain('role="dialog"');
    });
});

const source = readFileSync('src/lib/views/Memories.svelte', 'utf8');

describe('the wall as it is written', () => {
    it('posts one picture through the writes store rather than its own fetch', () => {
        expect(source).toContain('writes: { addMemory }');
        expect(source).not.toContain('fetch(');
    });

    it('asks the folder again after a picture has been added', () => {
        expect(source).toContain('reload();');
    });

    it('lays the wall out in CSS columns, with no library measuring anything', () => {
        expect(source).toContain('column-width:');
        expect(source).not.toContain('ResizeObserver');
    });

    it('draws a sentence of its own per refusal and never the endpoint word', () => {
        expect(source).toContain("import { tooLarge, uploadMessage } from '$lib/state/memories'");
        expect(source).toContain('uploadMessage(answer)');
        expect(source).not.toContain('answer.error');
    });

    it('keeps every failed file of one add rather than only the last', () => {
        expect(source).toContain('refused.push(');
        expect(source).toContain("t('memories.failed_many', failed.length)");
    });

    it('refuses a file larger than the wall takes before it reads one', () => {
        expect(source).toContain('tooLarge(file.size)');
        expect(source.indexOf('tooLarge(file.size)')).toBeLessThan(
            source.indexOf('await encoded(file)')
        );
    });

    it('looks for the tile to refocus inside its own pane', () => {
        expect(source).toContain('box?.querySelector(');
        expect(source).not.toContain('document.querySelector(');
    });
});
