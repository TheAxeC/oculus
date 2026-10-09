// Layer 3, primitive. The look an editor reads off the page when it is built and whenever the
// theme, the code theme or the text size changes: a token's computed value on the body, where the
// theme's class sets it, and the font the code window draws in. Monaco takes both as values and
// reads no CSS, so the text editor and the diff editor read them here, one frame after the look
// they are handed changes, and hand the code theme in force and the body's class string to the
// page's paint with them.

import type * as Monaco from 'monaco-editor';
import type { EditorKit } from './load';

/** The line height the code window draws in, as a share of the font size. */
const LINE_HEIGHT = 1.45;

/** The font size an editor falls back to while its host has no computed size. */
const FALLBACK_SIZE = 12;

/** A token's value on the body, where the theme's class sets it. */
export function token(name: string): string {
    return getComputedStyle(document.body).getPropertyValue(name).trim();
}

/** The font the code window draws in: the monospace token, the host's size, its line height. */
export function font(host: HTMLElement | undefined): Monaco.editor.IEditorOptions {
    const size = host === undefined ? 0 : Number.parseFloat(getComputedStyle(host).fontSize);
    const fontSize = Number.isFinite(size) && size > 0 ? size : FALLBACK_SIZE;
    return {
        fontFamily: token('--font-mono'),
        fontSize,
        lineHeight: Math.round(fontSize * LINE_HEIGHT)
    };
}

/**
 * Paint the page's theme under the code theme `code` and the body's class string. A paint that
 * fails (a code theme whose file did not load) leaves the theme before it in force and is not an
 * error of the editor: `failed` is told, so the editor forgets what it painted and the next change
 * of the look or of the code theme paints again (a second pick of the same theme changes neither),
 * and the answer always resolves.
 */
export async function paintCode(kit: EditorKit, code: string, failed: () => void): Promise<void> {
    try {
        await kit.paint(token, code, document.body.className);
    } catch {
        failed();
    }
}

/**
 * Paint the page's theme again under the code theme `code` and give an editor the font in force,
 * on the next frame, once the body carries the new theme's tokens; `done(true)` is told first and
 * `done(false)` if the paint fails. Answers the frame's cancel.
 */
export function repaint(
    kit: EditorKit,
    editor: Pick<Monaco.editor.ICodeEditor, 'updateOptions'>,
    host: HTMLElement | undefined,
    code: string,
    done: (painted: boolean) => void
): () => void {
    const frame = requestAnimationFrame(() => {
        done(true);
        void paintCode(kit, code, () => done(false));
        editor.updateOptions(font(host));
    });
    return () => cancelAnimationFrame(frame);
}
