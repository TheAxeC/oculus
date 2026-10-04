// Layer 2, route tests. The page's two load functions: the one that installs what the server
// shipped, and the server's, which ships the host and the configuration seed; and the collection
// keys a pushed configuration names. What the page does with them in the browser is seen at the
// look, since vitest runs this suite in node, where Svelte is compiled for the server and no
// $effect runs.

import { describe, expect, it } from 'vitest';
import { load } from '../../src/routes/+page.ts';
import { load as serverLoad } from '../../src/routes/+page.server.ts';
import { pushedCollections } from '../../src/routes/views.ts';
import { Hub } from '../../src/lib/server/core/channels.ts';
import { configGeneration } from '../../src/lib/state/shared/words/generation.svelte.ts';
import { defaultTheme } from '../../src/lib/state/shared/words/appearance.ts';
import { glyph, t } from '../../src/lib/state/shared/words/text.ts';
import { toneOf } from '../../src/lib/state/shared/words/tones.ts';

/** The hex the palette below writes as a tone. */
const HEX = '#7c5cff';

/** What +page.server.ts ships, in the one shape the load function reads. */
function pageData() {
    return {
        text: { 'app.title': 'from the load' },
        glyphs: { dot: 'O' },
        vocab: {
            palette: { [HEX]: 'c-violet' },
            themes: [{ name: 'dusk', class: '', label: 'dusk' }]
        },
        collections: ['funding'],
        seed: { through: 3 },
        token: 'a-token'
    };
}

describe('the page load', () => {
    it('installs the catalogs the server shipped and raises the generation once', () => {
        const before = configGeneration();
        const result = load({ data: pageData() } as unknown as Parameters<typeof load>[0]);

        // The collection keys, the config seed and the write token are handed to the page rather
        // than installed: they belong to the client the page builds, and the catalogs are what is
        // module-level.
        expect(result).toEqual({
            collections: ['funding'],
            seed: { through: 3 },
            token: 'a-token'
        });
        expect(t('app.title')).toBe('from the load');
        expect(glyph('dot')).toBe('O');
        expect(toneOf(HEX)).toBe('violet');
        expect(defaultTheme()).toBe('dusk');
        expect(configGeneration()).toBe(before + 1);
    });
});

describe('the page server load', () => {
    it('ships the host the server context holds on locals', () => {
        const hub = new Hub();
        // A held push of another configuration is what makes the seed carry the read and its host.
        hub.publish('config', { config: { older: true }, findings: [] });
        const host = { name: 'the-machine', address: 'http://127.0.0.1:4321' };
        const read = { config: { newer: true }, findings: [] };
        const locals = {
            config: () => read,
            server: { hub, host, icons: { set: {} } },
            token: 't'
        };
        const data = serverLoad({ locals } as unknown as Parameters<typeof serverLoad>[0]) as {
            seed: { payload?: { host: unknown } };
        };
        expect(data.seed.payload?.host).toBe(host);
    });
});

describe('the collections a pushed configuration names', () => {
    it('are none to register for a configuration without a list of them', () => {
        expect(pushedCollections(undefined)).toBeNull();
        expect(pushedCollections({})).toBeNull();
        expect(pushedCollections({ collections: 'x' })).toBeNull();
        expect(pushedCollections([])).toBeNull();
    });

    it('are an empty list for an empty list, which registers none', () => {
        expect(pushedCollections({ collections: [] })).toStrictEqual([]);
    });

    it('are the keys of the rows the list holds', () => {
        const collections = [{ key: 'events' }, { key: 'grants' }];
        expect(pushedCollections({ collections })).toStrictEqual(['events', 'grants']);
    });
});
