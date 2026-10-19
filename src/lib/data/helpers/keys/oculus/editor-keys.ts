// Layer 1, data. The keys the editor takes for the workbench: the first presses of the LaTeX tab's
// actions and chords (views/sources/source/latex/latex-tab.svelte.ts), and the second presses of
// its chords. The tab binds exactly these, the audit of an app's keybindings reads the first
// presses as keys oculus takes, and the Keyboard Shortcuts view lists them all. A press is written
// as the page's key tables write one (page-keys.ts), where the save key is.

import { nameOfCode, type KeyPlatform } from '../keys.ts';
import type { Press } from './page-keys.ts';

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

/**
 * The second presses after `LATEX_CHORD_FIRST` that run a command of the LaTeX tab's own rather
 * than a configured one: a new `\item` and Surround.
 */
export const LATEX_CHORD_SECONDS = {
    item: { code: 'Enter', cmd: true },
    surround: { code: 'KeyW', cmd: true }
} as const satisfies Record<string, Press>;

/**
 * The second press of a configured chord of the LaTeX tab (`chords` of config/catalogs/latex.yml):
 * Cmd with the character's key, and Shift for a capital.
 */
export function latexChordSecond(character: string): Press {
    const code =
        character === '-'
            ? 'Minus'
            : /^[0-9]$/.test(character)
              ? `Digit${character}`
              : `Key${character.toUpperCase()}`;
    return character === character.toLowerCase()
        ? { code, cmd: true }
        : { code, cmd: true, shift: true };
}

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
