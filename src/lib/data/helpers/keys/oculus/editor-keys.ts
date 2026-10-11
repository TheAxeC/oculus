// Layer 1, data. The keys the editor takes for the workbench: the save key, which the shell
// resolves (resolve.ts) and a Save control's tooltip shows, and the first presses of the LaTeX
// tab's actions and chords (views/sources/source/latex/latex-tab.svelte.ts). The tab binds exactly
// these, and the audit of an app's keybindings reads them as keys oculus takes.

import { nameOfCode, type KeyPlatform } from '../keys.ts';

/**
 * One key press: the physical key's name (`KeyB`, `BracketLeft`, `F8`), which is also Monaco's, and
 * the modifiers held with it.
 */
export type Press = {
    code: string;
    /** Cmd on macOS and Ctrl elsewhere, Monaco's CtrlCmd. */
    cmd?: true;
    /** The Ctrl key on macOS, Monaco's WinCtrl. */
    ctrl?: true;
    shift?: true;
    /** The Alt key, Option on macOS, Monaco's Alt. */
    alt?: true;
};

/** The save key: Cmd+S, Ctrl+S off macOS. */
export const SAVE_PRESS = { code: 'KeyS', cmd: true } as const satisfies Press;

/** The keys of the LaTeX tab's actions that have one press. */
export const LATEX_PRESSES = {
    build: { code: 'KeyB', cmd: true, alt: true },
    clean: { code: 'KeyC', cmd: true, alt: true },
    view: { code: 'KeyV', cmd: true, alt: true },
    synctex: { code: 'KeyJ', cmd: true, alt: true },
    mathPreview: { code: 'KeyM', cmd: true, alt: true },
    promote: { code: 'BracketLeft', cmd: true, alt: true },
    demote: { code: 'BracketRight', cmd: true, alt: true }
} as const satisfies Record<string, Press>;

/** The first press of the LaTeX tab's two-press chords for text commands and surrounding. */
export const LATEX_CHORD_FIRST = { code: 'KeyL', cmd: true } as const satisfies Press;

/** The first press of the LaTeX tab's chords for math commands: Ctrl+Shift+M on macOS. */
export function latexMathFirst(
    mac: boolean
): { code: 'KeyM'; ctrl: true; shift: true } | { code: 'KeyM'; cmd: true } {
    return mac ? { code: 'KeyM', ctrl: true, shift: true } : { code: 'KeyM', cmd: true };
}

/** Every first press the LaTeX tab binds on a platform. */
export function latexPresses(mac: boolean): Press[] {
    return [...Object.values(LATEX_PRESSES), LATEX_CHORD_FIRST, latexMathFirst(mac)];
}

/** A press in the syntax of an app's keybinding on a platform: `cmd+alt+b` on macOS. */
export function pressText(press: Press, platform: KeyPlatform): string {
    const words = [
        press.ctrl === true || (press.cmd === true && platform !== 'mac') ? 'ctrl' : '',
        press.shift === true ? 'shift' : '',
        press.alt === true ? 'alt' : '',
        press.cmd === true && platform === 'mac' ? 'cmd' : ''
    ].filter((word) => word !== '');
    return [...words, nameOfCode(press.code)].join('+');
}
