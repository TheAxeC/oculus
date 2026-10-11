// Layer 2, client state. The resolver of the apps' keybindings: which bound binding a press (or the
// second press of a chord) stands for. The bindings are the ones bound on the platform
// (data/helpers/files/apps/bound-keys.ts), so a key oculus takes never reaches here. A chord of two
// presses waits for its second press for `CHORD_MS`; a press that is no start of a binding drops
// the wait. The resolver judges the `when` of a binding against the context the caller hands it and
// knows nothing of the DOM.

import type { BoundKey } from '../../../../data/helpers/keys/bound-keys.ts';
import {
    chordOfEvent,
    sameChord,
    type Chord,
    type KeyEventKey,
    type KeyPlatform
} from '../../../../data/helpers/keys/keys.ts';
import { mentions, type IContext } from '../../../../data/helpers/files/apps/when.ts';
import { holds } from './context.ts';

/** How long the second press of a chord may take. */
const CHORD_MS = 1500;

/** What a press came to. */
export type KeyOutcome =
    | { kind: 'none' }
    /** The first press of a chord: the press is kept from the browser and the second is awaited. */
    | { kind: 'waiting' }
    | { kind: 'run'; app: string; command: string; args: unknown[] };

/** The pending first press of a chord, with the time it was made. */
type Pending = { chord: Chord; at: number };

/** The words of a binding as a hint reads it: `Ctrl+Alt+J Ctrl+Alt+C`. */
export function keyLabel(text: string, platform: KeyPlatform): string {
    const names: Record<string, string> = {
        ctrl: 'Ctrl',
        shift: 'Shift',
        alt: 'Alt',
        cmd: platform === 'mac' ? 'Cmd' : 'Super',
        meta: platform === 'mac' ? 'Cmd' : 'Super',
        win: 'Win',
        super: 'Super'
    };
    return text
        .trim()
        .split(/\s+/)
        .map((part) =>
            part
                .split('+')
                .map(
                    (word) =>
                        names[word.toLowerCase()] ?? word.charAt(0).toUpperCase() + word.slice(1)
                )
                .join('+')
        )
        .join(' ');
}

/** A resolver over the bindings bound now; `bound` is read at each press. */
export function createKeyResolver(bound: () => readonly BoundKey[], now: () => number = Date.now) {
    let pending: Pending | null = null;

    /**
     * Resolve one press. `context` is the context of the place the press is made in, and
     * `textual` says that a text field or an editor holds the keyboard: such a press is resolved
     * only by a binding whose `when` names `editorTextFocus` (the clause holding is the proof).
     */
    function press(event: KeyEventKey, context: IContext, textual: boolean): KeyOutcome {
        const chord = chordOfEvent(event);
        const waiting = pending !== null && now() - pending.at < CHORD_MS ? pending : null;
        pending = null;
        if (chord === null) return { kind: 'none' };
        const candidates = bound().filter(
            (one) =>
                holds(one.binding.when, context) &&
                (!textual || mentions(one.binding.when, 'editorTextFocus'))
        );
        if (waiting !== null) {
            const done = candidates.find(
                (one) =>
                    one.chords.length === 2 &&
                    sameChord(one.chords[0], waiting.chord) &&
                    sameChord(one.chords[1], chord)
            );
            if (done !== undefined) {
                return {
                    kind: 'run',
                    app: done.app,
                    command: done.binding.command,
                    args: argsOf(done.binding.args)
                };
            }
        }
        const single = candidates.find(
            (one) => one.chords.length === 1 && sameChord(one.chords[0], chord)
        );
        if (single !== undefined) {
            return {
                kind: 'run',
                app: single.app,
                command: single.binding.command,
                args: argsOf(single.binding.args)
            };
        }
        const starts = candidates.some(
            (one) => one.chords.length === 2 && sameChord(one.chords[0], chord)
        );
        if (!starts) return { kind: 'none' };
        pending = { chord, at: now() };
        return { kind: 'waiting' };
    }

    return {
        press,
        reset: (): void => {
            pending = null;
        }
    };
}

/** The arguments a binding runs its command with: its `args`, one value or none. */
function argsOf(args: unknown): unknown[] {
    return args === undefined || args === null ? [] : [args];
}
