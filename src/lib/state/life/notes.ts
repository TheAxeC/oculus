// Layer 2, client state. The wait between the last keystroke in a note and its save: a note is a
// Markdown file of a hub's notes folder, open in a source tab, and it is written after this wait
// whatever `editor.autosave` says (state/sessions/source/autosave.svelte.ts), so a note is never
// lost to a closed tab or a reload.

import { z } from 'zod';
import { readAs } from '../../data/shapes/shapes.ts';

/**
 * The wait between the last keystroke and the save. It is `notes.autosave_ms` of
 * the merged config; the number here is what a page uses before the first configuration push
 * lands, since there is nothing to read until it does.
 */
const AUTOSAVE_MS = 800;

/** The `notes:` map of the merged config, read for the wait: a finite number from zero up. */
const notesShape = z.object({ autosave_ms: z.number().min(0) });

export function autosaveMs(config: Record<string, unknown>): number {
    return readAs(notesShape, config.notes)?.autosave_ms ?? AUTOSAVE_MS;
}
