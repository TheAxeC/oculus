// A config push draws the page again. The text catalog, the tone vocabulary and the appearance are
// plain module variables, so what makes a component that drew one of them draw it again is that
// every reader of the three reads the configuration's generation, which the push raises once, after
// every store took its part.
//
// The redraw itself is a browser fact: vitest runs this suite in node, where Svelte is compiled for
// the server and an $effect never runs, so a rune here is a plain value and a memo over it is
// recomputed on every read whether or not it depends on anything. The two halves that can be
// checked here are checked: that the push installs all four stores and raises the generation once
// after the last of them, and that every exported reader of the three reads that generation, which
// is the dependency the browser then redraws on.

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import { configGeneration } from '../../../src/lib/state/client/generation.svelte.ts';
import { defaultTheme } from '../../../src/lib/state/words/appearance.ts';
import { t } from '../../../src/lib/state/words/text.ts';
import { toneOf } from '../../../src/lib/state/words/tones.ts';
import type { ConfigPayload } from '../../../src/lib/data/model.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';

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

/** The three plain stores a push replaces, whose readers must depend on the generation. */
const STORES = ['text.ts', 'tones.ts', 'appearance.ts'];

const STATE = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    '..',
    'src',
    'lib',
    'state',
    'words'
);

/** One function of a store: where it is written, whether it is exported, and its body. */
type Fn = { file: string; name: string; exported: boolean; body: string };

/**
 * Every function of the three stores. A top-level function ends at the closing brace in the first
 * column, which is what four-space indentation throughout makes true.
 */
function functions(): Fn[] {
    const found: Fn[] = [];
    for (const file of STORES) {
        const source = readFileSync(join(STATE, file), 'utf8');
        for (const match of source.matchAll(/^(export )?function (\w+)\b([\s\S]*?)^\}/gm)) {
            found.push({
                file,
                name: match[2],
                exported: match.at(1) !== undefined,
                body: match[3]
            });
        }
    }
    return found;
}

/** Whether a body calls a function by that name, and not a method or a longer name ending in it. */
function calls(body: string, name: string): boolean {
    return new RegExp(`(?<![\\w.$])${name}\\s*\\(`).test(body);
}

/** The functions that read the generation, and every function that reaches one of them. */
function dependent(all: Fn[]): Set<string> {
    const covered = new Set(
        all.filter((fn) => calls(fn.body, 'configGeneration')).map((fn) => fn.name)
    );
    for (let grew = true; grew;) {
        grew = false;
        for (const fn of all) {
            if (covered.has(fn.name)) continue;
            if (![...covered].some((name) => calls(fn.body, name))) continue;
            covered.add(fn.name);
            grew = true;
        }
    }
    return covered;
}

describe('the readers of the three plain stores', () => {
    const all = functions();
    const covered = dependent(all);

    it('are all found by the parse', () => {
        const names = all.filter((fn) => fn.exported).map((fn) => fn.name);
        for (const reader of ['t', 'lookup', 'glyph', 'asciiOf', 'resolveGlyphTokens', 'toneOf']) {
            expect(names).toContain(reader);
        }
    });

    it('every one reads the configuration generation, itself or through what it calls', () => {
        const missing = all.filter(
            (fn) => fn.exported && !fn.name.startsWith('set') && !covered.has(fn.name)
        );
        expect(missing.map((fn) => `${fn.file}: ${fn.name}`)).toEqual([]);
    });
});
