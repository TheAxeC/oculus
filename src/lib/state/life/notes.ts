// Layer 2, client state. The wait between the last keystroke in a note and its save: a note is a
// Markdown file of a hub's notes folder, open in a source tab, and it is written after this wait
// whatever `editor.autosave` says (state/sessions/source/autosave.svelte.ts), so a note is never
// lost to a closed tab or a reload.

import { z } from 'zod';
import { readAs } from '../../data/shapes/shapes.ts';

/** The `notes:` map of the merged config, read for the wait: a finite number from zero up. */
const notesShape = z.object({ autosave_ms: z.number().min(0) });

/**
 * The wait between the last keystroke and the save, `notes.autosave_ms` of the merged config, and
 * null before the first configuration push lands or when the key holds no such number; a note is
 * then saved as any other file of its tab is, by `editor.autosave`.
 */
export function autosaveMs(config: Record<string, unknown>): number | null {
    return readAs(notesShape, config.notes)?.autosave_ms ?? null;
}
