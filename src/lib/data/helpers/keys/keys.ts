// Layer 1, data. The key syntax of an app's keybinding (`ctrl+shift+p`, `cmd+k`, a two-part chord
// `ctrl+k ctrl+c`) and the key of a keyboard event, read to one form so that the manifest reader
// refuses a key that spells nothing and the page finds the binding a press stands for. The key
// names are monaco-editor's `KeyCodeUtils`, which VS Code's key syntax is; the modifiers are read
// here: `cmd`, `meta`, `win` and `super` name one key, the Command key on macOS and the Super or
// Windows key elsewhere.

import { KeyCodeUtils } from 'monaco-editor/base/common/keyCodes';
import type { AppKeybinding } from '../../model/index.ts';

/** The platform a binding is chosen for: `mac`, `linux` or `win`. */
export type KeyPlatform = 'mac' | 'linux' | 'win';

/** One press: the modifiers held and the key code of the key. */
export type Chord = { ctrl: boolean; shift: boolean; alt: boolean; meta: boolean; key: number };

/** The modifier each word of the syntax names. */
const MODIFIERS: Record<string, 'ctrl' | 'shift' | 'alt' | 'meta'> = {
    ctrl: 'ctrl',
    shift: 'shift',
    alt: 'alt',
    cmd: 'meta',
    meta: 'meta',
    win: 'meta',
    super: 'meta'
};

/** The key codes of the modifier keys, which are no key to press on their own. */
const MODIFIER_CODES = new Set([4, 5, 6, 57]);

/**
 * The name `KeyCodeUtils` knows for the `code` of a keyboard event whose name is not its letter.
 */
const CODE_NAMES: Record<string, string> = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
    ArrowDown: 'down',
    Minus: '-',
    Equal: '=',
    BracketLeft: '[',
    BracketRight: ']',
    Backslash: '\\',
    Semicolon: ';',
    Quote: "'",
    Comma: ',',
    Period: '.',
    Slash: '/',
    Backquote: '`'
};

/** The name the syntax gives the key whose physical `code` it is: `KeyB` is `b`, `F8` is `f8`. */
export function nameOfCode(code: string): string {
    if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase();
    if (/^Digit[0-9]$/.test(code)) return code.slice(5);
    return Object.hasOwn(CODE_NAMES, code) ? CODE_NAMES[code] : code.toLowerCase();
}

/** The chord one part of a binding spells, or null when a word of it is no modifier and no key. */
function chordOf(part: string): Chord | null {
    const words = part.toLowerCase().split('+');
    const name = words.pop();
    if (name === undefined || name === '') return null;
    const chord: Chord = { ctrl: false, shift: false, alt: false, meta: false, key: 0 };
    for (const word of words) {
        if (!Object.hasOwn(MODIFIERS, word)) return null;
        chord[MODIFIERS[word]] = true;
    }
    chord.key = KeyCodeUtils.fromUserSettings(name);
    return chord.key === 0 || MODIFIER_CODES.has(chord.key) ? null : chord;
}

/** The one or two chords a binding text spells, or null when it spells none or a part is wrong. */
export function parseKeybinding(text: string): Chord[] | null {
    const parts = text.trim().split(/\s+/);
    if (parts.length > 2 || parts[0] === '') return null;
    const chords = parts.map(chordOf);
    return chords.every((chord) => chord !== null) ? chords : null;
}

/** The text of a binding on a platform: the platform's own key when it has one, else `key`. */
export function keybindingText(binding: AppKeybinding, platform: KeyPlatform): string {
    const own =
        platform === 'mac' ? binding.mac : platform === 'linux' ? binding.linux : binding.win;
    return own === '' ? binding.key : own;
}

/** The fields of a keyboard event that name a chord. */
export type KeyEventKey = {
    code?: string;
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
};

/**
 * The chord a keyboard event stands for, or null for a key that has no code in the syntax or a
 * modifier alone. The key is read from the physical `code` when the event has one, since Option on
 * macOS turns a letter into another character.
 */
export function chordOfEvent(event: KeyEventKey): Chord | null {
    const code = event.code ?? '';
    const name = code === '' ? event.key.toLowerCase() : nameOfCode(code);
    const key = KeyCodeUtils.fromUserSettings(name);
    if (key === 0 || MODIFIER_CODES.has(key)) return null;
    return {
        ctrl: event.ctrlKey === true,
        shift: event.shiftKey === true,
        alt: event.altKey === true,
        meta: event.metaKey === true,
        key
    };
}

/** The character the US layout types for a key held with Shift, where it is not the capital. */
const SHIFTED: Record<string, string> = {
    '1': '!',
    '2': '@',
    '3': '#',
    '4': '$',
    '5': '%',
    '6': '^',
    '7': '&',
    '8': '*',
    '9': '(',
    '0': ')',
    '-': '_',
    '=': '+',
    '[': '{',
    ']': '}',
    '\\': '|',
    ';': ':',
    "'": '"',
    ',': '<',
    '.': '>',
    '/': '?',
    '`': '~'
};

/** The `code` of the keys whose name in the syntax is not their letter, by that name. */
const NAME_CODES = new Map(Object.entries(CODE_NAMES).map(([code, name]) => [name, code]));

/**
 * The keyboard event a chord stands for, the inverse of `chordOfEvent`: the `key` is the character
 * the US layout types for the key with the chord's Shift, and the `code` is the physical key.
 * Null for a chord whose key has no name in the syntax.
 */
export function eventOfChord(chord: Chord): Required<KeyEventKey> | null {
    const shown = KeyCodeUtils.toString(chord.key).toLowerCase();
    const name = shown === 'del' ? 'delete' : shown.replace(/arrow$/, '');
    if (name === '' || name.startsWith('unknown')) return null;
    const held = {
        ctrlKey: chord.ctrl,
        shiftKey: chord.shift,
        altKey: chord.alt,
        metaKey: chord.meta
    };
    if (/^[a-z]$/.test(name)) {
        return {
            key: chord.shift ? name.toUpperCase() : name,
            code: `Key${name.toUpperCase()}`,
            ...held
        };
    }
    if (/^[0-9]$/.test(name)) {
        return { key: chord.shift ? SHIFTED[name] : name, code: `Digit${name}`, ...held };
    }
    const code = NAME_CODES.get(name);
    if (code !== undefined && !code.startsWith('Arrow')) {
        return { key: chord.shift ? (SHIFTED[name] ?? name) : name, code, ...held };
    }
    const named = code ?? name.charAt(0).toUpperCase() + name.slice(1);
    return { key: named, code: named, ...held };
}

/** Whether two chords are the same press. */
export function sameChord(a: Chord, b: Chord): boolean {
    return (
        a.key === b.key &&
        a.ctrl === b.ctrl &&
        a.shift === b.shift &&
        a.alt === b.alt &&
        a.meta === b.meta
    );
}

/** The chords of a binding written as one text that compares equal for equal bindings. */
export function chordsText(chords: readonly Chord[]): string {
    return chords
        .map(
            (chord) =>
                `${chord.ctrl ? 'c' : ''}${chord.shift ? 's' : ''}${chord.alt ? 'a' : ''}${chord.meta ? 'm' : ''}-${chord.key}`
        )
        .join(' ');
}
