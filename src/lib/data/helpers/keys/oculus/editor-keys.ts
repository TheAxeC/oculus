// Layer 1, data. The keys the editor takes for the workbench: the first presses of the LaTeX tab's
// actions and chords (views/sources/source/latex/latex-tab.svelte.ts), and the second presses of
// its chords, its own on each platform and the configured ones. The tab binds exactly these, the
// audit of an app's keybindings reads the first presses as keys oculus takes, the Keyboard
// Shortcuts view lists them all, and the reader of the configured chords
// (data/sources/config/catalog/latex-tables.ts) leaves out one that would take a second press of
// the tab's own. A press is written as the page's key tables write one (page-keys.ts), where the
// save key is.

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

/**
 * The kinds of file a LaTeX tab shows, as LaTeX Workshop tells them apart: a TeX file, a `.bib`
 * file, and a class or a package (`.cls`, `.sty`).
 */
export type LatexFileKind = 'tex' | 'bib' | 'style';

/** The files a LaTeX key is bound in: TeX files alone, TeX and `.bib` files, or TeX and styles. */
export type LatexScope = 'tex' | 'texOrBib' | 'texOrStyle';

/**
 * The files each of the LaTeX tab's keys is bound in, as LaTeX Workshop v10.19.0's package.json
 * binds it: Build, Clean and View in TeX files, classes and packages; SyncTeX, Math Preview, the
 * sectioning keys, `\item`, Surround and the editor's two commands under Cmd+L in TeX files; the
 * configured text and math chords in TeX and `.bib` files. A file outside a key's scope leaves the
 * press to the editor, and the tab lists the command with no key.
 */
export const LATEX_SCOPES = {
    build: 'texOrStyle',
    clean: 'texOrStyle',
    view: 'texOrStyle',
    synctex: 'tex',
    mathPreview: 'tex',
    promote: 'tex',
    demote: 'tex',
    item: 'tex',
    surround: 'tex',
    selectLine: 'tex',
    tabFocus: 'tex',
    text: 'texOrBib',
    math: 'texOrBib'
} as const satisfies Record<string, LatexScope>;

/** Whether a kind of file takes the keys of a scope. */
export function inLatexScope(scope: LatexScope, kind: LatexFileKind): boolean {
    if (scope === 'tex') return kind === 'tex';
    if (scope === 'texOrBib') return kind !== 'style';
    return kind !== 'bib';
}

/** The first press of the LaTeX tab's two-press chords for text commands and surrounding. */
export const LATEX_CHORD_FIRST = { code: 'KeyL', cmd: true } as const satisfies Press;

/**
 * The second presses after `LATEX_CHORD_FIRST` that run a command of the LaTeX tab's own rather
 * than a configured one, as LaTeX Workshop binds them on macOS: a new `\item`, Surround, and two
 * of the editor's own commands whose key the chords take in a LaTeX file, the line's selection
 * (Cmd+L again) and tab focus mode (Ctrl+Shift+M, which is also the math chords' first press).
 */
const SECONDS_MAC = {
    item: { code: 'Enter', cmd: true },
    surround: { code: 'KeyW', cmd: true },
    selectLine: { code: 'KeyL', cmd: true },
    tabFocus: { code: 'KeyM', ctrl: true, shift: true }
} as const satisfies Record<string, Press>;

/** The same off macOS, where tab focus mode is Ctrl+M, also the math chords' first press. */
const SECONDS_ELSEWHERE = {
    ...SECONDS_MAC,
    tabFocus: { code: 'KeyM', cmd: true }
} as const satisfies Record<string, Press>;

/** The LaTeX tab's own second presses after `LATEX_CHORD_FIRST` on a platform. */
export function latexChordSeconds(mac: boolean): typeof SECONDS_MAC | typeof SECONDS_ELSEWHERE {
    return mac ? SECONDS_MAC : SECONDS_ELSEWHERE;
}

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

/** Whether two presses are the same keys. */
function samePress(one: Press, other: Press): boolean {
    return (
        one.code === other.code &&
        one.cmd === other.cmd &&
        one.ctrl === other.ctrl &&
        one.shift === other.shift &&
        one.alt === other.alt
    );
}

/**
 * Whether a configured text chord on `character` would take one of the tab's own second presses
 * on either platform (`l` and `w`, and `m` off macOS), which the catalog's reader leaves out, since
 * one catalog serves every platform.
 */
export function takesChordSecond(character: string): boolean {
    const second = latexChordSecond(character);
    return [true, false].some((mac) =>
        Object.values<Press>(latexChordSeconds(mac)).some((own) => samePress(own, second))
    );
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
