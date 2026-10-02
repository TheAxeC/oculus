// The page's two pieces of wiring around the configuration: the load function that installs what
// the server shipped, and the effect that keeps the collection views following the pushed config.
//
// The redraw itself is a browser fact and is not asserted here: vitest runs this suite in node,
// where Svelte is compiled for the server and an $effect never runs, so the effect in +page.svelte
// is read as source and its wiring is what is checked. What it does on screen needs a DOM and is
// not run here.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { load } from '../../src/routes/+page.ts';
import { load as serverLoad } from '../../src/routes/+page.server.ts';
import { pushedCollections } from '../../src/routes/views.ts';
import { Hub } from '../../src/lib/server/core/channels.ts';
import { configGeneration } from '../../src/lib/state/shared/words/generation.svelte.ts';
import { defaultTheme } from '../../src/lib/state/shared/words/appearance.ts';
import { glyph, t } from '../../src/lib/state/shared/words/text.ts';
import { toneOf } from '../../src/lib/state/shared/words/tones.ts';
const ROUTES = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'routes');

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

/** The body of every $effect of the page, to the closing brace at the script's own indentation. */
function effects(source: string): string[] {
    return source
        .split('$effect(')
        .slice(1)
        .map((rest) => rest.split('\n    });')[0]);
}

describe('the page subscription', () => {
    const source = readFileSync(join(ROUTES, '+page.svelte'), 'utf8');

    /** The channel names of the one connect call, in the order the page names them. */
    function subscribed(): string[] {
        const inside = source.split('connect([')[1]?.split('])')[0] ?? '';
        return [...inside.matchAll(/'([^']+)'/g)].map((found) => found[1]);
    }

    it('carries files beside the other channels, so an open listing follows a write', () => {
        expect(subscribed()).toContain('files');
    });

    it('carries every channel the page reads', () => {
        expect(subscribed()).toEqual([
            'portfolio',
            'config',
            'sessions',
            'git',
            'files',
            'hpc',
            'calendar',
            'inbox',
            'usage',
            'feeds',
            'audit'
        ]);
    });
});

describe('the page that arrives after a move of its server', () => {
    const source = readFileSync(join(ROUTES, '+page.svelte'), 'utf8');

    // An audit: the page's mount runs in a browser, so its wiring is read as source, as above.
    it('takes what the previous address carried before it reads its saved workbench', () => {
        const mount = source.split('onMount(')[1] ?? '';
        const taken = mount.indexOf('takeCarried(localStorage, window, location.origin)');

        expect(taken).toBeGreaterThan(-1);
        expect(taken).toBeLessThan(mount.indexOf('loadUi(localStorage, window)'));
        expect(taken).toBeLessThan(mount.indexOf('loadLayout(localStorage, window)'));
    });
});

describe('the page effect that follows a config push', () => {
    const source = readFileSync(join(ROUTES, '+page.svelte'), 'utf8');

    it('registers the collections in one effect that reads the configuration generation', () => {
        const wired = effects(source).filter((body) => body.includes('registerCollections('));
        expect(wired).toHaveLength(1);
        expect(wired[0]).toContain('configGeneration()');
        expect(wired[0]).toContain('config()');
    });

    it('follows a push only when it carries a real collections list, so a malformed one closes no tab', () => {
        const wired = effects(source).filter((body) => body.includes('registerCollections('));
        expect(wired[0]).toContain('pushedCollections(');
        expect(wired[0]).toContain('if (keys !== null) registerCollections(');
    });

    it('leaves the first frame to the untracked call in the script body', () => {
        const untracked = source.split('untrack(() => {')[1]?.split('    });')[0] ?? '';
        expect(untracked).toContain('registerCollections(client.registry, data.collections);');
    });

    it('installs the write token the load handed on, and follows a later load', () => {
        const untracked = source.split('untrack(() => {')[1]?.split('    });')[0] ?? '';
        expect(untracked).toContain('setToken(data.token);');
        const wired = effects(source).filter((body) => body.includes('setToken('));
        expect(wired).toHaveLength(1);
        expect(wired[0]).toContain('data.token');
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
