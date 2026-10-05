// Layer 2, client state. The armed keep: the preview tab that a double click's second press keeps.
//
// In one pane the first press of a double click on a file row replaces the tree with the file, so
// the second press lands on the opened tab (an editor, a PDF frame) and never on the row. The
// tree arms a keep for the instance it opened; while it is armed the pane showing that instance
// draws a layer over its body (shell/panes/PaneBody.svelte), and the next press on the layer keeps
// the tab. At most one keep is armed at a time, since only the newest press can have a second
// press coming.
//
// The keep holds the instance it was armed for. A pane draws the layer only over a tab that is
// still that instance (`stillPreview` of preview.ts): same id, same view, same state and still a
// preview tab, so keeping, retargeting or restating the tab ends the keep's hold on it. The keep
// ends at the first of: the press that uses it, the end of the window, `disarm` (called for any
// press elsewhere, any key, the tab leaving the pane's front and the owner closing), and a new
// arm.
//
// The store also holds the kept tab that asked for the keyboard: a tab a double click kept, either
// by the press on the layer or, when the file was read only after both presses reached the row,
// by the row. The pane showing that tab puts the keyboard in its editor or frame once it has drawn
// one, and the ask ends then, at a newer ask, or when the pane shows another tab.

import type { Instance } from '../model.ts';
import { isPreview } from './preview.ts';

/**
 * How long after a press the second press of a double click still counts: 500 ms, the double-click
 * interval macOS and Windows ship with.
 */
const KEEP_WINDOW_MS = 500;

/** A keep: the preview tab it is armed for and the owner (the Files tab) that armed it. */
export type ArmedKeep = { instance: Instance; owner: string };

export type ArmedKeeps = {
    /** The keep in force, or null when none is armed. */
    armed: () => ArmedKeep | null;
    /**
     * Arm a keep for a preview tab opened by a press made at `pressedAt` (the timeline of
     * `performance.now()`). A tab that is not a preview tab, and a press already older than the
     * window, arm nothing.
     */
    arm: (id: string, owner: string, pressedAt: number) => void;
    /** End the keep; with an owner, only a keep that owner armed. */
    disarm: (owner?: string) => void;
    /** The kept tab that takes the keyboard once its pane draws it, or null. */
    focusAsked: () => string | null;
    /** Ask that the kept tab `id` take the keyboard; a newer ask replaces it. */
    askFocus: (id: string) => void;
    /** The pane gave the keyboard to `id`, or the ask is dropped: it ends the ask for `id`. */
    focusGiven: (id: string) => void;
};

/** The armed keeps of one layout, `find` answering the instance with an id. */
export function createArmedKeeps(
    find: (id: string) => Instance | null,
    now: () => number = () => performance.now()
): ArmedKeeps {
    let held = $state.raw<ArmedKeep | null>(null);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let asked = $state.raw<string | null>(null);

    function disarm(owner?: string): void {
        if (owner !== undefined && held?.owner !== owner) return;
        clearTimeout(timer);
        timer = undefined;
        held = null;
    }

    function arm(id: string, owner: string, pressedAt: number): void {
        const instance = find(id);
        const left = KEEP_WINDOW_MS - (now() - pressedAt);
        disarm();
        if (instance === null || !isPreview(instance) || left <= 0) return;
        held = { instance, owner };
        timer = setTimeout(() => disarm(), left);
    }

    return {
        armed: () => held,
        arm,
        disarm,
        focusAsked: () => asked,
        askFocus: (id) => {
            asked = id;
        },
        focusGiven: (id) => {
            if (asked === id) asked = null;
        }
    };
}
