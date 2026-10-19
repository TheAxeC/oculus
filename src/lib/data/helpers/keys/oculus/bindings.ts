// Layer 1, data. The keys oculus binds, as the Keyboard Shortcuts view (views/system/help/keys/)
// lists them, each read from the code that binds it, as the keys oculus takes are
// (../oculus-keys.ts). The workbench's keys come from resolving every press of every key with the
// workbench's own resolver (resolve.ts), the rail's chords counted into the configuration's lists;
// a press that leaves the resolver waiting (a chord's letter, the first `g`) is followed by every
// press, and a second press counts where it runs something other than it runs alone. A press that
// runs what the same key with fewer modifiers runs (Ctrl+Alt+1 beside Ctrl+1, which the resolver
// reads alike) is left out. The keys of the palette's table and of the page's tables are turned
// into the same chords, and every chord is written one way (`chordLabel`).

import { KeyCodeUtils } from 'monaco-editor/base/common/keyCodes';
import { KeyCode } from 'monaco-editor/editor/common/standalone/standaloneEnums';
import {
    eventOfChord,
    nameOfCode,
    parseKeybinding,
    type Chord,
    type KeyEventKey
} from '../keys.ts';
import { MAC_ROLE_ITEMS, OWN_ACCELERATORS } from './desktop-keys.ts';
import type { Press } from './page-keys.ts';
import type { Press as PalettePress } from './palette-table.ts';
import { initialKeyState, resolveKey, type ChordOrder, type KeyAction } from './resolve.ts';

// The chord a key is held as, and how two are compared, for the editor's and the view's keys,
// which reach the key code through this folder.
export { sameChord, type Chord } from '../keys.ts';

/** A key the workbench answers: its presses in order, and the action the last one runs. */
export type Binding = { chords: Chord[]; action: KeyAction };

/** One of the desktop menu's own items. */
export type MenuItem = keyof typeof OWN_ACCELERATORS;

/** The four modifiers of a chord. */
const MODIFIERS = ['ctrl', 'shift', 'alt', 'meta'] as const;

/** The moment of the first press the walk resolves; the second comes one millisecond later. */
const PRESSED = 1000;

/** The number past Monaco's last key code. */
const KEY_CODES: number = KeyCode.MAX_VALUE;

/** One press the walk tries: its chord and the keyboard event it stands for. */
type Tried = { chord: Chord; event: Required<KeyEventKey> };

/** Every chord of every key code, held with each of the sixteen sets of modifiers, as an event. */
function everyPress(): Tried[] {
    const tried: Tried[] = [];
    for (let key = 1; key < KEY_CODES; key += 1) {
        for (let bits = 0; bits < 16; bits += 1) {
            const chord: Chord = {
                ctrl: (bits & 1) !== 0,
                shift: (bits & 2) !== 0,
                alt: (bits & 4) !== 0,
                meta: (bits & 8) !== 0,
                key
            };
            const event = eventOfChord(chord);
            if (event !== null) tried.push({ chord, event });
        }
    }
    return tried;
}

/** The action as one text, which compares equal for equal actions. */
function actionText(action: KeyAction | null): string {
    return action === null ? '' : JSON.stringify(action);
}

/**
 * Whether a chord is the other's key held with every modifier of the other and at least one more.
 */
function wider(one: Chord, than: Chord): boolean {
    return (
        one.key === than.key &&
        MODIFIERS.every((held) => !than[held] || one[held]) &&
        MODIFIERS.some((held) => one[held] && !than[held])
    );
}

/** The bindings without those a binding of the same action reaches with fewer modifiers. */
function narrowest(found: Binding[]): Binding[] {
    return found.filter(
        (one) =>
            !found.some(
                (other) =>
                    actionText(other.action) === actionText(one.action) &&
                    other.chords.length === one.chords.length &&
                    other.chords.slice(0, -1).every((chord, at) => chord === one.chords[at]) &&
                    wider(one.chords[one.chords.length - 1], other.chords[other.chords.length - 1])
            )
    );
}

/**
 * Every key the workbench answers on a platform, in or out of the desktop app, with the action it
 * runs, in the context where the most keys answer: a card under the cursor, and no field typed in,
 * no overlay open and no debug session.
 */
export function workbenchBindings(order: ChordOrder, mac: boolean, app: boolean): Binding[] {
    const context = {
        cursorActive: true,
        typing: false,
        paletteOpen: false,
        trayOpen: false,
        confirmOpen: false,
        mac,
        app,
        debugging: false,
        breakpointFocus: false
    };
    const start = initialKeyState();
    const presses = everyPress();
    const alone = presses.map((press) =>
        actionText(resolveKey(press.event, order, context, start, PRESSED + 1).action)
    );
    const found: Binding[] = [];
    for (const first of presses) {
        const answer = resolveKey(first.event, order, context, start, PRESSED);
        if (answer.action !== null) {
            found.push({ chords: [first.chord], action: answer.action });
            continue;
        }
        if (answer.state.chord === start.chord && answer.state.lastG === start.lastG) continue;
        presses.forEach((second, at) => {
            const then = resolveKey(second.event, order, context, answer.state, PRESSED + 1);
            if (then.action !== null && actionText(then.action) !== alone[at]) {
                found.push({ chords: [first.chord, second.chord], action: then.action });
            }
        });
    }
    return narrowest(found);
}

/** A press of the page's key tables as a chord: Cmd is the Meta key on macOS and Ctrl elsewhere. */
export function pressChord(press: Press, mac: boolean): Chord {
    return {
        ctrl: press.ctrl === true || (!mac && press.cmd === true),
        shift: press.shift === true,
        alt: press.alt === true,
        meta: mac && press.cmd === true,
        key: KeyCodeUtils.fromUserSettings(nameOfCode(press.code))
    };
}

/** A press of the palette's table as a chord: its command modifier is Cmd on macOS, else Ctrl. */
export function paletteChord(press: PalettePress, mac: boolean): Chord {
    return {
        ctrl: !mac && press.command === true,
        shift: press.shift === true,
        alt: false,
        meta: mac && press.command === true,
        key: KeyCodeUtils.fromUserSettings(nameOfCode(press.key))
    };
}

/**
 * A chord as the Keyboard Shortcuts view writes it: the modifiers in VS Code's order, Ctrl, Shift,
 * Alt, then Cmd on macOS and Super elsewhere, and the key by its `KeyCodeUtils` name, so
 * `Ctrl+Shift+P`, `Cmd+/` and `F5`. A key that types a character, pressed alone or with Shift
 * alone, is written as the character it types on the US layout, as the workbench reads it: `j`,
 * `J`, `?`.
 */
function chordLabel(chord: Chord, mac: boolean): string {
    if (!chord.ctrl && !chord.alt && !chord.meta) {
        const typed = eventOfChord(chord)?.key ?? '';
        if (typed.length === 1) return typed;
    }
    const held = [
        chord.ctrl ? 'Ctrl' : '',
        chord.shift ? 'Shift' : '',
        chord.alt ? 'Alt' : '',
        chord.meta ? (mac ? 'Cmd' : 'Super') : ''
    ].filter((one) => one !== '');
    return [...held, KeyCodeUtils.toString(chord.key)].join('+');
}

/**
 * The desktop menu's own items with the chords of their accelerators; off macOS the roles whose
 * keys Electron chooses itself are left out.
 */
export function menuBindings(mac: boolean): { item: MenuItem; chords: Chord[] }[] {
    const items = Object.keys(OWN_ACCELERATORS) as MenuItem[];
    return items
        .filter((item) => mac || !MAC_ROLE_ITEMS.includes(item))
        .flatMap((item) => {
            const chords = parseKeybinding(OWN_ACCELERATORS[item].toLowerCase());
            return chords === null ? [] : [{ item, chords }];
        });
}

/** The presses of a key one after the other, as the view writes them: `Cmd+K Cmd+C`. */
export function chordsLabel(chords: readonly Chord[], mac: boolean): string {
    return chords.map((chord) => chordLabel(chord, mac)).join(' ');
}
