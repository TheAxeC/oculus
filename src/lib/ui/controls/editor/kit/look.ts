// Layer 3, primitive. The look an editor reads off the page when it is built and whenever the theme
// or the text size changes: a token's computed value on the body, where the theme's class sets it,
// and the font the code window draws in. Monaco takes both as values and reads no CSS, so the text
// editor and the diff editor read them here, one frame after the look they are handed changes.

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
 * Paint the page's theme again and give an editor the font in force, on the next frame, once the
 * body carries the new theme's tokens; `painted` is told first. Answers the frame's cancel.
 */
export function repaint(
    kit: EditorKit,
    editor: Pick<Monaco.editor.ICodeEditor, 'updateOptions'>,
    host: HTMLElement | undefined,
    painted: () => void
): () => void {
    const frame = requestAnimationFrame(() => {
        painted();
        void kit.paint(token);
        editor.updateOptions(font(host));
    });
    return () => cancelAnimationFrame(frame);
}
