// Layer 2, client state, pure. The field of a diff pane's saved state that makes it the diff of one
// file of the pending Refactor Preview (state/system/machine/refactor/preview.svelte.ts): the file
// as it is against the file with the edits the preview has checked. The pane is a diff pane
// (../repositories.ts) whose subject carries one more field, `refactor`, beside the Replace
// Preview's `replace`.
//
// The field names the preview and nothing else. The two texts are the preview's own, and both move
// as a check is changed, so the key a pane reads under (`refactorKey`) holds the preview's
// revision, and a check changed in the view is a new read of the open pane. A pane restored after a
// reload names a preview the page no longer holds, and says so.

import { z } from 'zod';

/** The field of a diff pane's subject that names a pending Refactor Preview. */
export type RefactorSubject = { id: string };

/** The field as a saved state reads it. */
export const refactorShape = z.object({
    id: z.string().min(1)
}) satisfies z.ZodType<RefactorSubject>;

/**
 * What a diff pane's refactor field adds to the key its read is made under: nothing for a pane that
 * is no Refactor Preview's, and the preview with its revision for one that is.
 */
export function refactorKey(refactor: RefactorSubject | undefined, revision: number): string {
    return refactor === undefined ? '' : `refactor:${refactor.id}@${String(revision)}`;
}
