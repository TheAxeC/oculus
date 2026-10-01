// Layer 4, test. The selector `languages()` read from an effect, in Svelte's client runtime
// (tests/ui/frame/client-runtime.ts): the map is made once per config the page holds, so every view
// reading it in one config sees the same Map, and an effect that read it runs again when a config
// with another `languages:` lands.
//
// It does not cover what a view does with the map (tests/views/sources/) or the map's content
// (tests/data/helpers/files/languages.test.ts).

import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { createClientState } from '../../../../src/lib/state/client/context.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import { watch } from '../explorer/watch.svelte.ts';

const CONFIG = loadConfig(engineDir()).config;
setCatalog(textCatalog(CONFIG));

beforeEach(() => vi.stubGlobal('window', {}));
afterEach(() => vi.unstubAllGlobals());

function speak(
    client: ReturnType<typeof createClientState>,
    config: Record<string, unknown>,
    version: number
) {
    client.entities.receive({
        channel: 'config',
        version,
        payload: { config, text: textCatalog(CONFIG), findings: [] }
    });
}

describe('a read of the language map from an effect', () => {
    it('gives every reader of one config the same map, and a new one when the config changes', () => {
        const client = createClientState();
        speak(client, CONFIG, 1);
        const first = watch(() => client.selectors.languages());
        const second = watch(() => client.selectors.languages());
        flushSync();
        expect(first.seen).toHaveLength(1);
        expect(second.seen[0]).toBe(first.seen[0]);

        speak(client, { ...CONFIG, languages: { python: ['.py'] } }, 2);
        flushSync();
        first.stop();
        second.stop();
        expect(first.seen).toHaveLength(2);
        expect([...first.seen[1]]).toEqual([['.py', 'python']]);
        expect(second.seen[1]).toBe(first.seen[1]);
    });
});
