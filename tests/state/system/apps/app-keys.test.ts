// Layer 2, client state test. The keybindings of the apps (data/helpers/keys/ and
// state/system/apps/shell/keys.ts): which bindings are bound on a platform, which press or chord
// of two presses runs which command, and the keys oculus takes that no app binds. These are the
// key resolver's rows of G77.
//
// The keys oculus takes are read from the code that takes them (data/helpers/keys/
// oculus-keys.ts): a row checks a key of each source, the workbench's resolver, the palette, the
// editor's LaTeX presses and the desktop menu's accelerators, and the rail's chord letters come
// from the engine's config/layout.yml. What this does NOT cover: the DOM that feeds a real press to
// the resolver.

import { describe, expect } from 'vitest';
import { boundKeys, type KeyApp } from '../../../../src/lib/data/helpers/keys/bound-keys.ts';
import {
    chordOfEvent,
    eventOfChord,
    parseKeybinding,
    type KeyEventKey,
    type KeyPlatform
} from '../../../../src/lib/data/helpers/keys/keys.ts';
import { takenBy } from '../../../../src/lib/data/helpers/keys/oculus-keys.ts';
import { paletteKeyOf } from '../../../../src/lib/data/helpers/keys/oculus/palette-keys.ts';
import { railChordLetters } from '../../../../src/lib/data/helpers/keys/oculus/rail-letters.ts';
import {
    CHORD_MS,
    initialKeyState,
    resolveKey,
    type KeyContext
} from '../../../../src/lib/data/helpers/keys/oculus/resolve.ts';
import { engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';
import type { AppKeybinding } from '../../../../src/lib/data/model/index.ts';
import { createKeyResolver } from '../../../../src/lib/state/system/apps/shell/keys.ts';
import { contextOf } from '../../../../src/lib/state/system/apps/shell/context.ts';
import { it } from '../../../fixtures/scratch.ts';

/** The chord letters of the engine's config/layout.yml: the keys of the rail's chords. */
const LETTERS = railChordLetters(loadConfig(engineDir()).config);

const binding = (change: Partial<AppKeybinding>): AppKeybinding => ({
    command: 'notes.hello',
    key: '',
    mac: '',
    linux: '',
    win: '',
    when: '',
    args: null,
    ...change
});

const app = (id: string, ...keybindings: AppKeybinding[]): KeyApp => ({
    id,
    title: id,
    keybindings
});

/** The press of a letter with modifiers, as a keyboard event of the page carries it. */
const press = (letter: string, ...held: ('ctrl' | 'alt' | 'shift' | 'meta')[]): KeyEventKey => ({
    key: letter,
    code: `Key${letter.toUpperCase()}`,
    ctrlKey: held.includes('ctrl'),
    altKey: held.includes('alt'),
    shiftKey: held.includes('shift'),
    metaKey: held.includes('meta')
});

/** A resolver over the bindings of the apps bound on a platform, and a clock the case moves. */
function resolver(platform: KeyPlatform, apps: KeyApp[]) {
    const clock = { now: 0 };
    const keys = createKeyResolver(
        () => boundKeys(apps, platform, LETTERS).bound,
        () => clock.now
    );
    const here = (parts: Parameters<typeof contextOf>[0] = {}) => contextOf(parts, platform, {});
    return { keys, clock, here };
}

const HELLO = (extra: Partial<AppKeybinding> = {}): AppKeybinding =>
    binding({
        key: 'ctrl+alt+u ctrl+alt+c',
        mac: 'cmd+alt+u cmd+alt+c',
        ...extra
    });

const RUN = { kind: 'run', app: 'app:notes', command: 'notes.hello', args: [] };

describe('a chord of two presses with a key of each platform', () => {
    it('runs the mac chord on macOS and not when a field holds the keyboard', () => {
        const { keys, here } = resolver('mac', [app('app:notes', HELLO())]);
        expect(keys.press(press('u', 'meta', 'alt'), here(), true)).toEqual({ kind: 'none' });
        expect(keys.press(press('u', 'meta', 'alt'), here(), false)).toEqual({ kind: 'waiting' });
        expect(keys.press(press('c', 'meta', 'alt'), here(), false)).toEqual(RUN);
    });

    it('does not run the key chord on macOS, where the mac chord replaces it', () => {
        const { keys, here } = resolver('mac', [app('app:notes', HELLO())]);
        expect(keys.press(press('u', 'ctrl', 'alt'), here(), false)).toEqual({ kind: 'none' });
    });

    it('runs the key chord on Linux', () => {
        const { keys, here } = resolver('linux', [app('app:notes', HELLO())]);
        expect(keys.press(press('u', 'ctrl', 'alt'), here(), false)).toEqual({ kind: 'waiting' });
        expect(keys.press(press('c', 'ctrl', 'alt'), here(), false)).toEqual(RUN);
    });

    it('runs the linux chord on Linux and no longer the key chord', () => {
        const { keys, here } = resolver('linux', [
            app('app:notes', HELLO({ linux: 'ctrl+alt+l' }))
        ]);
        expect(keys.press(press('l', 'ctrl', 'alt'), here(), false)).toEqual(RUN);
        expect(keys.press(press('u', 'ctrl', 'alt'), here(), false)).toEqual({ kind: 'none' });
    });

    it('drops the wait when the second press is late or is another key', () => {
        const { keys, clock, here } = resolver('linux', [app('app:notes', HELLO())]);
        keys.press(press('u', 'ctrl', 'alt'), here(), false);
        clock.now = CHORD_MS;
        expect(keys.press(press('c', 'ctrl', 'alt'), here(), false)).toEqual({ kind: 'none' });
        clock.now = 0;
        keys.press(press('u', 'ctrl', 'alt'), here(), false);
        expect(keys.press(press('x', 'ctrl', 'alt'), here(), false)).toEqual({ kind: 'none' });
        expect(keys.press(press('c', 'ctrl', 'alt'), here(), false)).toEqual({ kind: 'none' });
    });

    it('passes the binding args to the command as its one argument', () => {
        const { keys, here } = resolver('linux', [
            app('app:notes', binding({ key: 'ctrl+alt+u', args: { size: 2 } }))
        ]);
        expect(keys.press(press('u', 'ctrl', 'alt'), here(), false)).toEqual({
            ...RUN,
            args: [{ size: 2 }]
        });
    });
});

describe('a binding that needs the editor', () => {
    const editor = (): KeyApp[] => [
        app('app:notes', binding({ key: 'ctrl+alt+u', when: 'editorTextFocus' }))
    ];

    it('runs inside the text editor and nowhere else', () => {
        const { keys, here } = resolver('linux', editor());
        expect(
            keys.press(press('u', 'ctrl', 'alt'), here({ editorTextFocus: true }), true)
        ).toEqual(RUN);
        expect(keys.press(press('u', 'ctrl', 'alt'), here({}), true)).toEqual({ kind: 'none' });
        expect(keys.press(press('u', 'ctrl', 'alt'), here({}), false)).toEqual({ kind: 'none' });
    });

    it('does not run a binding without the clause inside a text field', () => {
        const { keys, here } = resolver('linux', [
            app('app:notes', binding({ key: 'ctrl+alt+u', when: 'resourceExtname == .tex' }))
        ]);
        const context = here({
            editorTextFocus: true,
            resource: { root: 'hub', path: 'a.tex', language: 'latex' }
        });
        expect(keys.press(press('u', 'ctrl', 'alt'), context, true)).toEqual({ kind: 'none' });
        expect(keys.press(press('u', 'ctrl', 'alt'), context, false)).toEqual(RUN);
    });
});

/** The bindings of one app bound on a platform with the engine's rail letters. */
const takenOn = (platform: KeyPlatform, key: string, letters: readonly string[] = LETTERS) =>
    boundKeys([app('app:notes', binding({ key }))], platform, letters);

describe('a binding equal to a key oculus takes', () => {
    it.each([
        ['Cmd+S', 'mac', 'cmd+s', 'workbench'],
        ['Ctrl+S', 'linux', 'ctrl+s', 'workbench'],
        ['Ctrl+1, the first tab', 'linux', 'ctrl+1', 'workbench'],
        ['F8, the next problem', 'win', 'f8', 'workbench'],
        ['the bare j, a cursor key', 'linux', 'j', 'workbench'],
        ['the bare question mark, the Keyboard Shortcuts view', 'linux', 'shift+/', 'workbench'],
        ['Cmd+P', 'mac', 'cmd+p', 'palette'],
        ['Cmd+Shift+P', 'mac', 'cmd+shift+p', 'palette'],
        ['Cmd+K', 'mac', 'cmd+k', 'palette'],
        ['Ctrl+K', 'linux', 'ctrl+k', 'palette'],
        ['F1', 'linux', 'f1', 'palette'],
        ['the colon, the palette command line', 'linux', 'shift+;', 'palette'],
        ['a chord that starts with Cmd+K', 'mac', 'cmd+k cmd+c', 'palette'],
        ['Cmd+R', 'mac', 'cmd+r', 'desktop'],
        ['Cmd+Q', 'mac', 'cmd+q', 'desktop'],
        ['Cmd+Alt+H, hide others', 'mac', 'cmd+alt+h', 'desktop'],
        ['the editor chord Ctrl+Alt+J', 'linux', 'ctrl+alt+j ctrl+alt+c', 'editor'],
        ['the LaTeX math chord Ctrl+M off macOS', 'linux', 'ctrl+m', 'editor'],
        ['the LaTeX math chord Ctrl+Shift+M on macOS', 'mac', 'ctrl+shift+m', 'editor']
    ] as [string, KeyPlatform, string, string][])(
        'is not bound, with a note naming what takes it: %s',
        (_label, platform, key, by) => {
            const { bound, notes } = takenOn(platform, key);
            expect([bound.length, notes.map((one) => one.by)]).toEqual([0, [by]]);
        }
    );

    it('keeps Cmd+R free off macOS, where the desktop menu is not drawn', () => {
        expect(takenOn('linux', 'ctrl+r').bound.map((one) => one.app)).toEqual(['app:notes']);
    });

    it('keeps the editor chord Ctrl+Shift+M free of the LaTeX tab off macOS, where the workbench takes it', () => {
        expect(takenOn('linux', 'ctrl+shift+m').notes.map((one) => one.by)).toEqual(['workbench']);
    });

    it('binds a key that no source takes', () => {
        expect(takenOn('mac', 'cmd+alt+u').bound.map((one) => one.app)).toEqual(['app:notes']);
    });

    it('binds both apps when their clauses differ', () => {
        const { bound } = boundKeys(
            [
                app('app:notes', binding({ key: 'ctrl+alt+h', when: 'editorTextFocus' })),
                app('app:other', binding({ key: 'ctrl+alt+h', when: '!editorTextFocus' }))
            ],
            'linux',
            LETTERS
        );
        expect(bound.map((one) => one.app)).toEqual(['app:notes', 'app:other']);
    });

    it('binds the first app of the catalogue order and notes the second for one key and clause', () => {
        const apps = [
            app('app:notes', binding({ key: 'ctrl+alt+h', command: 'notes.hello' })),
            app('app:other', binding({ key: 'ctrl+alt+h', command: 'other.hello' }))
        ];
        const { bound, notes } = boundKeys(apps, 'linux', LETTERS);
        expect(bound.map((one) => one.binding.command)).toEqual(['notes.hello']);
        expect(notes.map((one) => [one.app, one.by])).toEqual([
            ['app:other', { app: 'app:notes', title: 'app:notes' }]
        ]);
    });
});

describe('a binding whose first key starts a chord of the rail', () => {
    it('reads the letters from the engine config, the chord of each group and the direct chord', () => {
        expect(LETTERS).toEqual(expect.arrayContaining(['f', 'p', 'y', 'v']));
    });

    it.each([
        ['f, the Focus group', 'f'],
        ['y, the System group', 'y'],
        ['v, the direct chord', 'v']
    ])('is not bound, with the finding of a key the workbench takes: %s', (_label, letter) => {
        const { bound, notes } = takenOn('linux', letter);
        expect([bound.length, notes.map((one) => one.by)]).toEqual([0, ['workbench']]);
    });

    it('binds the letter when the configuration names no chord with it', () => {
        expect(takenOn('linux', 'f', ['p']).bound.map((one) => one.app)).toEqual(['app:notes']);
    });

    it('binds a letter that no chord and no bare key of the workbench uses', () => {
        expect(LETTERS).not.toContain('q');
        expect(takenOn('linux', 'q').bound.map((one) => one.app)).toEqual(['app:notes']);
    });
});

/** The context the workbench resolves its keys in on a platform, in the desktop app. */
const WORKBENCH = (mac: boolean): KeyContext => ({
    cursorActive: false,
    typing: false,
    paletteOpen: false,
    trayOpen: false,
    confirmOpen: false,
    mac,
    app: true
});

describe('the keys oculus takes are the ones its resolvers act on', () => {
    const ORDER = { chords: Object.fromEntries(LETTERS.map((letter) => [letter, []])) };

    it.each([
        ['Cmd+S on macOS', true, press('s', 'meta')],
        ['Ctrl+S elsewhere', false, press('s', 'ctrl')],
        ['Cmd+Shift+F on macOS', true, press('f', 'meta', 'shift')],
        ['Cmd+Shift+H on macOS', true, press('h', 'meta', 'shift')],
        ['Cmd+Shift+B on macOS', true, press('b', 'meta', 'shift')],
        ['Cmd+Alt+T on macOS', true, press('t', 'meta', 'alt')],
        ['Cmd+Alt+X on macOS', true, press('x', 'meta', 'alt')],
        ['Cmd+Shift+M on macOS', true, press('m', 'meta', 'shift')],
        ['Cmd+W in the desktop app', true, press('w', 'meta')],
        ['Cmd+N in the desktop app', true, press('n', 'meta')],
        ['Cmd+F in the desktop app', true, press('f', 'meta')],
        ['Cmd+T in the desktop app', true, press('t', 'meta')]
    ] as [string, boolean, KeyEventKey][])(
        'resolves %s to an action and gives the key to the workbench',
        (_label, mac, event) => {
            const resolved = resolveKey(event, ORDER, WORKBENCH(mac), initialKeyState(), 0);
            const chord = chordOfEvent(event);
            expect(resolved.action).not.toBeNull();
            expect(chord === null ? null : takenBy(chord, mac ? 'mac' : 'linux', LETTERS)).toBe(
                'workbench'
            );
        }
    );

    it.each([
        ['Cmd+P', press('p', 'meta'), 'files'],
        ['Cmd+Shift+P', press('p', 'meta', 'shift'), 'commands']
    ] as [string, KeyEventKey, string][])(
        'opens the palette on %s and gives the key to the palette',
        (_label, event, mode) => {
            const chord = chordOfEvent(event);
            expect(paletteKeyOf(event, true)).toBe(mode);
            expect(chord === null ? null : takenBy(chord, 'mac', LETTERS)).toBe('palette');
        }
    );

    it('starts a chord on each rail letter, which is why the workbench takes it', () => {
        const states = LETTERS.map(
            (letter) =>
                resolveKey({ key: letter }, ORDER, WORKBENCH(false), initialKeyState(), 1000).state
                    .chord
        );
        expect(states).toEqual(LETTERS);
    });
});

describe('the event a chord stands for', () => {
    it.each([
        'ctrl+s',
        'cmd+shift+f',
        'ctrl+alt+j',
        'f8',
        'shift+f5',
        'escape',
        'enter',
        'tab',
        'left',
        'ctrl+]',
        'cmd+,',
        'cmd+=',
        '1',
        'ctrl+9',
        'shift+;',
        'shift+/',
        'j',
        'shift+g'
    ])('is read back as the same chord: %s', (text) => {
        const chord = parseKeybinding(text)?.[0] ?? null;
        const event = chord === null ? null : eventOfChord(chord);
        expect([chord === null, event === null ? null : chordOfEvent(event)]).toEqual([
            false,
            chord
        ]);
    });
});
