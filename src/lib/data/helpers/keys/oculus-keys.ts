// Layer 1, data. The keys oculus takes, which no app's keybinding may bind. Each is read from the
// code that takes it, so no list of keys is kept here:
//
// - the workbench's keys, by resolving the press with the workbench's own resolver
//   (oculus/resolve.ts) in the context where the most keys answer, with the rail's chord letters
//   of the configuration as its chords;
// - the palette's keys, by asking the functions the workbench opens the palette with
//   (oculus/palette-keys.ts);
// - the editor's keys, from the presses the LaTeX tab binds (oculus/editor-keys.ts);
// - the accelerators of the desktop app's menu on macOS, where the menu is drawn
//   (oculus/desktop-keys.ts).
//
// The manifest reader leaves a binding whose first chord is one of these out of the app's keys,
// with a finding that names the key and what takes it.

import { eventOfChord, parseKeybinding, sameChord, type Chord, type KeyPlatform } from './keys.ts';
import { menuKeys } from './oculus/desktop-keys.ts';
import { latexPresses, pressText } from './oculus/editor-keys.ts';
import { opensCommandLine, paletteKeyOf, togglesPalette } from './oculus/palette-keys.ts';
import { initialKeyState, resolveKey, type KeyContext } from './oculus/resolve.ts';

/** What takes a key. */
export type TakenBy = 'workbench' | 'palette' | 'editor' | 'desktop';

/**
 * The context the workbench resolves in where the most keys answer: the desktop app, a card under
 * the cursor, and no field typed in and no overlay open.
 */
const WIDEST = {
    cursorActive: true,
    typing: false,
    paletteOpen: false,
    trayOpen: false,
    confirmOpen: false,
    app: true,
    debugging: false,
    breakpointFocus: false
} satisfies KeyContext;

/** The chords of the keys a list of keybinding texts spells. */
function chordsOf(texts: readonly string[]): Chord[] {
    return texts.flatMap((text) => {
        const chords = parseKeybinding(text);
        return chords === null ? [] : [chords[0]];
    });
}

/** Whether any of the chords is the chord. */
function holds(chords: readonly Chord[], chord: Chord): boolean {
    return chords.some((one) => sameChord(one, chord));
}

/**
 * What takes the chord on the platform, or null for a chord oculus leaves to apps. `letters` are
 * the rail's chord letters, which the workbench holds as the start of a chord.
 */
export function takenBy(
    chord: Chord,
    platform: KeyPlatform,
    letters: readonly string[]
): TakenBy | null {
    const event = eventOfChord(chord);
    if (event === null) return null;
    const mac = platform === 'mac';
    const answer = resolveKey(
        event,
        { chords: Object.fromEntries(letters.map((letter) => [letter, []])) },
        { ...WIDEST, mac },
        initialKeyState(),
        1000
    );
    const start = initialKeyState();
    if (
        answer.action !== null ||
        answer.swallow === true ||
        answer.state.chord !== start.chord ||
        answer.state.lastG !== start.lastG
    ) {
        return 'workbench';
    }
    if (paletteKeyOf(event, mac) !== null || togglesPalette(event) || opensCommandLine(event)) {
        return 'palette';
    }
    const editor = latexPresses(mac).map((press) => pressText(press, platform));
    if (holds(chordsOf(editor), chord)) return 'editor';
    if (mac && holds(chordsOf(menuKeys()), chord)) return 'desktop';
    return null;
}
