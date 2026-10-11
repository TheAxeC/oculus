// Layer 1, data. Which keybindings of the apps are bound on a platform. An app's binding is bound
// when its first chord is no key oculus takes (oculus-keys.ts, over the rail's chord letters) and
// no app before it in the Views list's order binds the same chords under the same `when`. The
// page resolves only the bound bindings, and the apps watcher gives a finding for each one that is
// not, so the two cannot disagree about which bindings are left out.

import type { AppKeybinding } from '../../model/index.ts';
import { takenBy, type TakenBy } from './oculus-keys.ts';
import {
    chordsText,
    keybindingText,
    parseKeybinding,
    type Chord,
    type KeyPlatform
} from './keys.ts';

/** The bindings of one active app, as the Views list orders the apps. */
export type KeyApp = { id: string; title: string; keybindings: AppKeybinding[] };

/** A binding that is bound: its app, the chords it is pressed with and the clause it needs. */
export type BoundKey = { app: string; binding: AppKeybinding; chords: Chord[] };

/** Why a binding is not bound: oculus takes its key, or an earlier app binds it. */
export type KeyNote = {
    app: string;
    appTitle: string;
    binding: AppKeybinding;
    /** The key as the binding writes it on the platform. */
    text: string;
    by: TakenBy | { app: string; title: string };
};

/** The bindings bound on a platform, in the apps' order, and a note for each one that is not. */
export function boundKeys(
    apps: readonly KeyApp[],
    platform: KeyPlatform,
    letters: readonly string[]
): { bound: BoundKey[]; notes: KeyNote[] } {
    const bound: BoundKey[] = [];
    const notes: KeyNote[] = [];
    const owner = new Map<string, { app: string; title: string }>();
    for (const app of apps) {
        for (const binding of app.keybindings) {
            const text = keybindingText(binding, platform);
            const chords = parseKeybinding(text);
            if (chords === null) continue;
            const note = (by: KeyNote['by']): void => {
                notes.push({ app: app.id, appTitle: app.title, binding, text, by });
            };
            const taken = takenBy(chords[0], platform, letters);
            if (taken !== null) {
                note(taken);
                continue;
            }
            const same = `${chordsText(chords)}\n${binding.when.trim()}`;
            const first = owner.get(same);
            if (first !== undefined && first.app !== app.id) {
                note(first);
                continue;
            }
            owner.set(same, first ?? { app: app.id, title: app.title });
            bound.push({ app: app.id, binding, chords });
        }
    }
    return { bound, notes };
}
