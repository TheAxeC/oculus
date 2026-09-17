// Layer 4, view test. The Memories wall: a tile per picture of the folder, each addressed at the
// route rather than inlined, the empty line when the folder holds none, and the control that adds
// one.
//
// The store is handed its list by hand, since a server rendering makes no fetch; the cases over the
// answer the store reads stub the one fetch it makes and read the store back. What this does NOT
// cover: the overlay opening and closing, and the box a tile's shape actually draws, which need a
// browser and are tests/browser/memories.spec.ts.

import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Memories, { registration } from '../../src/lib/views/Memories.svelte';
import type { ViewRegistration } from '../../src/lib/views/registry.ts';
import { engineDir, loadConfig, textCatalog } from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import { glyphCatalog } from '../../src/lib/data/sources/config.ts';
import type { Instance } from '../../src/lib/state/layout/index.ts';
import type { Picture } from '../../src/lib/data/model.ts';
import { TILE_BOUND, type Wall } from '../../src/lib/state/memories.svelte.ts';
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

/** A picture of the wall with no size, which is what the server answers for an unread header. */
function unsized(name: string): Picture {
    return { name, width: null, height: null };
}

/** The view over a wall the store was handed. */
function drawn(images: Picture[]): string {
    client.memories.hold(images);
    return render(Memories, { context: clientContext(client), props: { instance } }).body;
}

/** The opening tag of the tile of one name, as the rendering wrote it. */
function tile(body: string, name: string): string {
    const found = new RegExp(`<button[^>]*data-tile="${name}"[^>]*>`).exec(body);
    expect(found).not.toBeNull();
    return found?.[0] ?? '';
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
        const body = drawn([unsized('mem-01.png'), unsized('mem-02.jpg')]);
        expect([...body.matchAll(/data-tile="([^"]+)"/g)].map((one) => one[1])).toEqual([
            'mem-01.png',
            'mem-02.jpg'
        ]);
    });

    it('addresses every picture at the route and inlines none of them', () => {
        const body = drawn([unsized('mem-01.png')]);
        expect(body).toContain('src="/api/memories?file=mem-01.png"');
        expect(body).not.toContain('data:image');
    });

    it('escapes a name that would otherwise be read as part of the address', () => {
        expect(drawn([unsized('a b&c.png')])).toContain('src="/api/memories?file=a%20b%26c.png"');
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
        expect(drawn([unsized('mem-01.png')])).not.toContain('role="dialog"');
    });

    it('gives a tile with a size the width over the height of its picture as its aspect ratio', () => {
        const body = drawn([
            { name: 'wide.png', width: 870, height: 691 },
            { name: 'tall.jpg', width: 777, height: 1200 }
        ]);
        expect(tile(body, 'wide.png')).toContain('style="aspect-ratio: 870 / 691;"');
        expect(tile(body, 'tall.jpg')).toContain('style="aspect-ratio: 777 / 1200;"');
    });

    it('leaves a tile without a size to the box of the stylesheet', () => {
        const body = drawn([
            unsized('unread.webp'),
            { name: 'half.png', width: 870, height: null }
        ]);
        expect(tile(body, 'unread.webp')).not.toContain('aspect-ratio');
        expect(tile(body, 'half.png')).not.toContain('aspect-ratio');
    });

    it('holds a very wide and a very tall picture at the bound, and one at the bound as it is', () => {
        const body = drawn([
            { name: 'panorama.jpg', width: 8000, height: 1000 },
            { name: 'scroll.png', width: 500, height: 4000 },
            { name: 'edge.png', width: 300 * TILE_BOUND, height: 300 }
        ]);
        expect(tile(body, 'panorama.jpg')).toContain(`style="aspect-ratio: ${TILE_BOUND} / 1;"`);
        expect(tile(body, 'scroll.png')).toContain(`style="aspect-ratio: 1 / ${TILE_BOUND};"`);
        expect(tile(body, 'edge.png')).toContain(
            `style="aspect-ratio: ${300 * TILE_BOUND} / 300;"`
        );
    });
});

describe('the answer the wall reads', () => {
    afterEach(() => vi.unstubAllGlobals());

    /** The wall once the store has read one answer of GET /api/memories carrying `images`. */
    async function answered(images: unknown): Promise<Wall> {
        vi.stubGlobal('window', {});
        vi.stubGlobal('fetch', () =>
            Promise.resolve(new Response(JSON.stringify({ images }), { status: 200 }))
        );
        expect(client.memories.wall().loading).toBe(true);
        await vi.waitFor(() => expect(client.memories.wall().loading).toBe(false));
        return client.memories.wall();
    }

    it('holds each record with its size, in the order of the answer', async () => {
        expect(
            await answered([
                { name: 'b.png', width: 777, height: 1200 },
                { name: 'a.jpg', width: null, height: null }
            ])
        ).toEqual({
            images: [
                { name: 'b.png', width: 777, height: 1200 },
                { name: 'a.jpg', width: null, height: null }
            ],
            error: '',
            loading: false
        });
    });

    it('reads a size that is not two whole positive numbers as none', async () => {
        expect(
            await answered([
                { name: 'text.png', width: '870', height: 691 },
                { name: 'zero.png', width: 0, height: 691 },
                { name: 'part.png', width: 870.5, height: 691 },
                { name: 'half.png', width: 870 },
                { name: 'style.png', width: 'calc(1px)', height: '1; color: red' }
            ])
        ).toEqual({
            images: ['text.png', 'zero.png', 'part.png', 'half.png', 'style.png'].map((name) =>
                unsized(name)
            ),
            error: '',
            loading: false
        });
    });

    it('reads an item with no name as a failed read, not as a wall without it', async () => {
        const failed = { images: [], error: 'image_without_name', loading: false };
        expect(await answered(['names.png', { name: 'one.png', width: 10, height: 20 }])).toEqual(
            failed
        );
        client = createClientState();
        expect(await answered([{ name: 'one.png', width: 10, height: 20 }, { width: 1 }])).toEqual(
            failed
        );
    });

    it('reads a name given twice as a failed read, not as one tile', async () => {
        expect(
            await answered([
                { name: 'one.png', width: 10, height: 20 },
                { name: 'two.png', width: 10, height: 20 },
                { name: 'one.png', width: 30, height: 40 }
            ])
        ).toEqual({ images: [], error: 'image_name_repeated', loading: false });
    });

    it('reads an answer whose pictures are not a list as a failed read, not as an empty wall', async () => {
        expect(await answered('mem-01.png')).toEqual({
            images: [],
            error: 'images_not_a_list',
            loading: false
        });
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
        expect(source).toContain(
            "import { readMessage, tooLarge, uploadMessage } from '$lib/state/memories'"
        );
        expect(source).toContain('uploadMessage(answer)');
        expect(source).not.toContain('answer.error');
    });

    // Revert: in views/Memories.svelte, draw the empty-wall message whatever `held.error` holds.
    it('says a read of the wall that failed, with the reason, in place of the empty message', () => {
        client.memories.hold([], 'images_not_a_list');
        const body = render(Memories, { context: clientContext(client), props: { instance } }).body;
        expect(body).toContain(
            catalog['memories.read_failed'].replace('{0}', catalog['memories.read_not_a_list'])
        );
        expect(body).not.toContain(catalog['memories.empty']);
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
