// Layer 2, client-state tests. The appearance store's load over a storage holding values of the
// wrong type: each field falls back to its own default, the version decides whether anything is
// read, the older field name `unicode` is written back under `icons`, and the instance records come
// back as the map the storage held. Every case reads a hand-written envelope through a fake Storage
// and states what the store reads and what the save that follows it writes. Nothing here touches
// localStorage or the DOM.

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import {
    crtDefault,
    defaultTheme,
    setAppearance
} from '../../../src/lib/state/shared/words/appearance.ts';
import { UI_KEY, UI_VERSION } from '../../../src/lib/state/workbench/ui.svelte.ts';
import { createClientState } from '../../fixtures/client.ts';

setAppearance(loadConfig(engineDir()).config);

const DEFAULT_THEME = defaultTheme();

/** A fake Storage holding raw text under the one key, with the texts the store wrote to it. */
function rawStorage(text: string | null) {
    const held: Record<string, string> = text === null ? {} : { [UI_KEY]: text };
    const writes: string[] = [];
    return {
        held,
        writes,
        getItem: (key: string): string | null => held[key] ?? null,
        setItem: (key: string, value: string): void => {
            writes.push(value);
            held[key] = value;
        }
    };
}

/** The text of an envelope of the version the store writes, with the fields handed in. */
const envelopeText = (over: Record<string, unknown>): string =>
    JSON.stringify({ version: UI_VERSION, ...over });

/** The text of an envelope of the version the store writes, holding one field. */
const withField = (name: string, value: unknown): string => envelopeText({ [name]: value });

/** The text of an envelope written out by hand, for the values JSON.stringify drops. */
const rawEnvelope = (fields: string): string => `{"version":${UI_VERSION},${fields}}`;

/** The envelope a store that read nothing writes, with the default theme and overlay named. */
const UNREAD = {
    version: UI_VERSION,
    theme: 'default',
    crt: 'default',
    wallpaper: null,
    icons: false,
    textScale: null,
    terminalFont: null,
    codeTheme: null,
    statusHidden: [],
    statusQuiet: false,
    instances: {}
};

/** What the three records read from a store that holds none answer. */
const NO_RECORDS = [undefined, undefined, 'Object.prototype'];

/** JSON with `undefined` written out, so an absent record differs from a null one. */
const written = (value: unknown): string =>
    JSON.stringify(value, (_key, held: unknown) => (held === undefined ? '<undefined>' : held));

/**
 * What a fresh store makes of the text a storage holds, as one line: whether loadUi read a saved
 * value, how many texts the load itself wrote back, the fields of the envelope the following save
 * writes that differ from UNREAD, and, where they differ from NO_RECORDS, the records `a`, `x` and
 * `__proto__` read after the load and after that save. The default theme and the configured
 * overlay are named, so the rows do not repeat config/appearance.yml.
 */
function loadedFrom(text: string | null): string {
    const storage = rawStorage(text);
    const { ui } = createClientState();
    const read = ui.loadUi(storage);
    const records = (): unknown[] =>
        ['a', 'x', '__proto__'].map((id) => {
            const held = ui.instanceState(id);
            return held === Object.prototype ? 'Object.prototype' : held;
        });
    const afterLoad = records();
    const writtenByLoad = storage.writes.length;
    ui.setStatusQuiet(ui.statusQuiet());
    const envelope = JSON.parse(storage.writes[storage.writes.length - 1]) as Record<
        string,
        unknown
    >;
    const saved: Record<string, unknown> = {
        ...envelope,
        theme: envelope.theme === DEFAULT_THEME ? 'default' : envelope.theme,
        crt: envelope.crt === crtDefault() ? 'default' : envelope.crt
    };
    const differs = Object.fromEntries(
        Object.entries(saved).filter(
            ([key, value]) => written(value) !== written(UNREAD[key as keyof typeof UNREAD])
        )
    );
    const afterSave = records();
    const moved =
        written(afterLoad) !== written(NO_RECORDS) || written(afterSave) !== written(NO_RECORDS);
    const heldRecords = moved ? ` records ${written({ afterLoad, afterSave })}` : '';
    return `${read ? 'read' : 'unread'} wrote ${writtenByLoad} ${written(differs)}${heldRecords}`;
}

describe('loadUi over a storage holding values of the wrong type', () => {
    const rows: [string, () => unknown, unknown][] = [
        ['nothing held', () => loadedFrom(null), 'unread wrote 0 {}'],
        ['text that is not JSON', () => loadedFrom('not json'), 'unread wrote 0 {}'],
        ['an array', () => loadedFrom('[]'), 'unread wrote 0 {}'],
        ['a map with no version', () => loadedFrom('{"theme":"mocha"}'), 'unread wrote 0 {}'],
        [
            'a map with another version',
            () => loadedFrom('{"version":3,"theme":"mocha"}'),
            'unread wrote 0 {}'
        ],
        [
            'the earlier version with a wallpaper',
            () => loadedFrom('{"version":1,"theme":"mocha","wallpaper":true}'),
            'read wrote 0 {"theme":"mocha"}'
        ],
        [
            'the earlier version with a wallpaper and instances',
            () => loadedFrom('{"version":1,"wallpaper":false,"instances":{"a":1}}'),
            'read wrote 0 {"instances":{"a":1}} records {"afterLoad":[1,"<undefined>","Object.prototype"],"afterSave":[1,"<undefined>","Object.prototype"]}'
        ],
        ['the version alone', () => loadedFrom(envelopeText({})), 'read wrote 0 {}'],
        [
            'every field of the wrong type',
            () =>
                loadedFrom(
                    envelopeText({
                        theme: 3,
                        crt: 'yes',
                        wallpaper: 'no',
                        icons: null,
                        unicode: true,
                        textScale: '1.2',
                        terminalFont: 100,
                        codeTheme: 'nope',
                        statusHidden: ['a', 'a', '', 3],
                        statusQuiet: 1,
                        instances: []
                    })
                ),
            'read wrote 1 {"icons":true,"terminalFont":40,"statusHidden":["a"]}'
        ],
        [
            'every field right',
            () =>
                loadedFrom(
                    envelopeText({
                        theme: 'mocha',
                        crt: true,
                        wallpaper: false,
                        icons: true,
                        textScale: 1.3,
                        terminalFont: 14.5,
                        codeTheme: 'nord',
                        statusHidden: ['a', 'b'],
                        statusQuiet: true,
                        instances: { a: { s: 1 } }
                    })
                ),
            'read wrote 0 {"theme":"mocha","crt":true,"wallpaper":false,"icons":true,"textScale":1.3,"terminalFont":14.5,"codeTheme":"nord","statusHidden":["a","b"],"statusQuiet":true,"instances":{"a":{"s":1}}} records {"afterLoad":[{"s":1},"<undefined>","Object.prototype"],"afterSave":[{"s":1},"<undefined>","Object.prototype"]}'
        ],
        [
            'a theme the list does not hold',
            () => loadedFrom(withField('theme', 'chartreuse')),
            'read wrote 0 {}'
        ],
        ['an overlay that is a number', () => loadedFrom(withField('crt', 1)), 'read wrote 0 {}'],
        [
            'an overlay that is true',
            () => loadedFrom(withField('crt', true)),
            'read wrote 0 {"crt":true}'
        ],
        [
            'a wallpaper that is a string',
            () => loadedFrom(withField('wallpaper', 'true')),
            'read wrote 0 {}'
        ],
        [
            'a wallpaper that is true',
            () => loadedFrom(withField('wallpaper', true)),
            'read wrote 0 {"wallpaper":true}'
        ],
        [
            'a wallpaper that is false',
            () => loadedFrom(withField('wallpaper', false)),
            'read wrote 0 {"wallpaper":false}'
        ],
        ['icons that are a string', () => loadedFrom(withField('icons', 'yes')), 'read wrote 0 {}'],
        [
            'icons that are true',
            () => loadedFrom(withField('icons', true)),
            'read wrote 0 {"icons":true}'
        ],
        [
            'icons that are absent beside unicode false',
            () => loadedFrom(withField('unicode', false)),
            'read wrote 1 {}'
        ],
        [
            'icons that are absent beside unicode true',
            () => loadedFrom(withField('unicode', true)),
            'read wrote 1 {"icons":true}'
        ],
        [
            'icons that are false beside unicode true',
            () => loadedFrom(envelopeText({ icons: false, unicode: true })),
            'read wrote 0 {}'
        ],
        [
            'a text scale that is a string',
            () => loadedFrom(withField('textScale', '1.2')),
            'read wrote 0 {}'
        ],
        [
            'a text scale of 1.24',
            () => loadedFrom(withField('textScale', 1.24)),
            'read wrote 0 {"textScale":1.2}'
        ],
        [
            'a text scale of 1.25',
            () => loadedFrom(withField('textScale', 1.25)),
            'read wrote 0 {"textScale":1.3}'
        ],
        [
            'a text scale under the bound',
            () => loadedFrom(withField('textScale', 0.1)),
            'read wrote 0 {"textScale":0.7}'
        ],
        [
            'a text scale over the bound',
            () => loadedFrom(withField('textScale', 5)),
            'read wrote 0 {"textScale":1.6}'
        ],
        [
            'a text scale that is 1.04',
            () => loadedFrom(withField('textScale', 1.04)),
            'read wrote 0 {}'
        ],
        [
            'a text scale of infinity',
            () => loadedFrom(rawEnvelope('"textScale":1e999')),
            'read wrote 0 {}'
        ],
        [
            'a terminal size that is a string',
            () => loadedFrom(withField('terminalFont', '14')),
            'read wrote 0 {}'
        ],
        [
            'a terminal size that is 14.5',
            () => loadedFrom(withField('terminalFont', 14.5)),
            'read wrote 0 {"terminalFont":14.5}'
        ],
        [
            'a terminal size under the bound',
            () => loadedFrom(withField('terminalFont', 2)),
            'read wrote 0 {"terminalFont":6}'
        ],
        [
            'a terminal size over the bound',
            () => loadedFrom(withField('terminalFont', 100)),
            'read wrote 0 {"terminalFont":40}'
        ],
        [
            'a terminal size of infinity',
            () => loadedFrom(rawEnvelope('"terminalFont":1e999')),
            'read wrote 0 {}'
        ],
        [
            'a code theme the list does not hold',
            () => loadedFrom(withField('codeTheme', 'nope')),
            'read wrote 0 {}'
        ],
        [
            'a code theme that is a number',
            () => loadedFrom(withField('codeTheme', 3)),
            'read wrote 0 {}'
        ],
        [
            'a code theme that is tokens',
            () => loadedFrom(withField('codeTheme', 'tokens')),
            'read wrote 0 {"codeTheme":"tokens"}'
        ],
        [
            'a code theme the list holds',
            () => loadedFrom(withField('codeTheme', 'nord')),
            'read wrote 0 {"codeTheme":"nord"}'
        ],
        [
            'hidden items that are a string',
            () => loadedFrom(withField('statusHidden', 'a')),
            'read wrote 0 {}'
        ],
        [
            'hidden items that repeat and hold empty and non-strings',
            () => loadedFrom(envelopeText({ statusHidden: ['a', 'a', '', 3, null, ['b'], 'c'] })),
            'read wrote 0 {"statusHidden":["a","c"]}'
        ],
        [
            'quiet that is a number',
            () => loadedFrom(withField('statusQuiet', 1)),
            'read wrote 0 {}'
        ],
        [
            'quiet that is true',
            () => loadedFrom(withField('statusQuiet', true)),
            'read wrote 0 {"statusQuiet":true}'
        ],
        [
            'instances that are an array',
            () => loadedFrom(withField('instances', [])),
            'read wrote 0 {}'
        ],
        [
            'instances that are a string',
            () => loadedFrom(withField('instances', 'none')),
            'read wrote 0 {}'
        ],
        [
            'instances of every type',
            () =>
                loadedFrom(
                    envelopeText({
                        instances: { a: 1, b: null, x: [1], c: 'text', d: { e: { f: 1 } } }
                    })
                ),
            'read wrote 0 {"instances":{"a":1,"b":null,"x":[1],"c":"text","d":{"e":{"f":1}}}} records {"afterLoad":[1,[1],"Object.prototype"],"afterSave":[1,[1],"Object.prototype"]}'
        ],
        [
            'instances with an own __proto__ key holding a map',
            () => loadedFrom(rawEnvelope('"instances":{"__proto__":{"x":1},"a":{"search":"s"}}')),
            'read wrote 0 {"instances":{"a":{"search":"s"}}} records {"afterLoad":[{"search":"s"},"<undefined>",{"x":1}],"afterSave":[{"search":"s"},"<undefined>","Object.prototype"]}'
        ],
        [
            'instances with an own __proto__ key holding a string',
            () => loadedFrom(rawEnvelope('"instances":{"__proto__":"y","a":{"search":"s"}}')),
            'read wrote 0 {"instances":{"a":{"search":"s"}}} records {"afterLoad":[{"search":"s"},"<undefined>","y"],"afterSave":[{"search":"s"},"<undefined>","Object.prototype"]}'
        ]
    ];

    it.each(rows)('%s', (_name, run, expected) => {
        expect(run()).toStrictEqual(expected);
    });
});

describe('the numbers a viewer sets', () => {
    it.each([Number.NaN, Infinity, -Infinity])('reads %s as no terminal size', (size) => {
        const { ui } = createClientState();
        ui.loadUi(rawStorage(null));
        ui.setTerminalFont(14);
        ui.setTerminalFont(size);
        expect(ui.terminalFont()).toBe(null);
    });
});

describe('a storage the store cannot use', () => {
    it('is read as nothing saved when it refuses to be read', () => {
        const { ui } = createClientState();
        const refusing = {
            getItem: (): string | null => {
                throw new Error('refused');
            },
            setItem: (): void => undefined
        };
        expect(ui.loadUi(refusing)).toBe(false);
        expect(ui.theme()).toBe(DEFAULT_THEME);
    });

    it('keeps the choices in memory when it refuses to be written', () => {
        const { ui } = createClientState();
        const refusing = {
            getItem: (): string | null => null,
            setItem: (): void => {
                throw new Error('full');
            }
        };
        ui.loadUi(refusing);
        ui.setCrt(true);
        ui.setInstanceState('a', { search: 's' });
        expect(ui.crt()).toBe(true);
        expect(ui.instanceState('a')).toStrictEqual({ search: 's' });
    });
});
