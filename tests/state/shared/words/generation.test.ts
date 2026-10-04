// Layer 2, client-state tests. A config push draws the page again. The text catalog, the tone
// vocabulary and the appearance are plain module variables, so what makes a component that drew one
// of them draw it again is the configuration's generation, which the push raises once, after every
// store took its part.
//
// The redraw itself is a browser fact: vitest runs this suite in node, where Svelte is compiled for
// the server and an $effect never runs, so a rune here is a plain value and a memo over it is
// recomputed on every read whether or not it depends on anything. What is checked here is that the
// push installs all four stores and raises the generation once, after the last of them.

import { beforeEach, describe, expect, it } from 'vitest';
import { configGeneration } from '../../../../src/lib/state/shared/words/generation.svelte.ts';
import { defaultTheme } from '../../../../src/lib/state/shared/words/appearance.ts';
import { t } from '../../../../src/lib/state/shared/words/text.ts';
import { toneOf } from '../../../../src/lib/state/shared/words/tones.ts';
import type { ConfigPayload } from '../../../../src/lib/data/model/index.ts';
import { createClientState, type ClientState } from '../../../fixtures/client.ts';

let client: ClientState;
let installConfig: ClientState['socket']['installConfig'];

beforeEach(() => {
    client = createClientState();
    ({ installConfig } = client.socket);
});

/** The hex every push below carries, under whichever palette token that push names. */
const HEX = '#7c5cff';

/** A push holding one catalog key, one palette entry and one theme. */
function push(title: string, token: string, theme: string): ConfigPayload {
    return {
        config: {
            palette: { [HEX]: token },
            themes: [{ name: theme, class: '', label: theme }]
        },
        text: { 'app.title': title },
        icons: {},
        host: { name: 'test-machine', address: 'http://127.0.0.1:8799' },
        findings: []
    };
}

describe('a config push', () => {
    it('installs the string, the tone and the appearance value it carries', () => {
        installConfig(push('first', 'c-violet', 'light'));
        expect([t('app.title'), toneOf(HEX), defaultTheme()]).toEqual(['first', 'violet', 'light']);

        installConfig(push('second', 'c-amber', 'dark'));
        expect([t('app.title'), toneOf(HEX), defaultTheme()]).toEqual(['second', 'amber', 'dark']);
    });

    it('raises the generation once, after every setter has run', () => {
        const before = configGeneration();
        // Every read of a key is the setter about to run with it, so the generation recorded here
        // is the generation each store was installed at.
        const seen: number[] = [];
        const payload: ConfigPayload = {
            get text() {
                seen.push(configGeneration());
                return { 'app.title': 'third' };
            },
            get config() {
                seen.push(configGeneration());
                return { palette: {}, themes: [{ name: 'amber', class: '', label: 'amber' }] };
            },
            get icons() {
                seen.push(configGeneration());
                return {};
            },
            host: { name: 'test-machine', address: 'http://127.0.0.1:8799' },
            findings: []
        };

        installConfig(payload);

        expect(seen.length).toBeGreaterThan(1);
        expect(seen.every((generation) => generation === before)).toBe(true);
        expect(configGeneration()).toBe(before + 1);
        expect([t('app.title'), defaultTheme()]).toEqual(['third', 'amber']);
    });

    it('raises nothing when there is no payload', () => {
        const before = configGeneration();
        installConfig(null);
        expect(configGeneration()).toBe(before);
    });
});
