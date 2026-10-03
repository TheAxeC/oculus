// Layer 2, client state, pure. The Replace Preview of the Search view: a diff pane over one file,
// the file as it is on the left and the file with this Search tab's replacements on the right.
//
// The pane is a diff pane (repositories.ts) whose subject carries one more field, `replace`: the
// query the hits were found by, the replace text, Preserve Case and the hits to replace, each named
// by its line and place. The field is part of the pane's saved state, so a restored pane reads the
// same preview again, and it is not part of the pane's id, so a second preview of the same file
// with another query or replace text is the same pane taking the new field. `previewKey` is what
// tells the pane to read again when the field changed.

import { z } from 'zod';
import type { ReplacePreview, ReplaceQuery } from '../../../data/file-ops.ts';
import { anyNumberShape } from '../../../data/shapes/shapes.ts';
import type { DiffSubject } from './repositories.ts';

/** The field of a diff pane's saved state that makes it a Replace Preview. */
export const replacePreviewShape = z.object({
    query: z.object({
        q: z.string(),
        word: z.boolean().catch(false),
        case: z.boolean().catch(false),
        regex: z.boolean().catch(false),
        under: z.string().catch('')
    }),
    replace: z.string().catch(''),
    preserveCase: z.boolean().catch(false),
    hits: z.array(z.object({ line: anyNumberShape, at: anyNumberShape })).catch([])
}) satisfies z.ZodType<ReplacePreview>;

/** What a preview of one file is told: where the file is and the hits of it to replace. */
type PreviewFile = {
    root: string;
    path: string;
    hits: { line: number; at: number }[];
};

/** How the replace text is read for a preview. */
type PreviewSettings = {
    query: ReplaceQuery;
    replace: string;
    preserve: boolean;
};

/**
 * The subject of the diff pane that previews a file's replacements, opened at the line of the hit
 * that was pressed.
 */
export function previewSubject(
    file: PreviewFile,
    settings: PreviewSettings,
    line: number
): DiffSubject {
    return {
        root: file.root,
        path: file.path,
        staged: false,
        worktree: false,
        line,
        replace: {
            query: settings.query,
            replace: settings.replace,
            preserveCase: settings.preserve,
            hits: file.hits.map((hit) => ({ line: hit.line, at: hit.at }))
        }
    };
}

/**
 * What a diff pane's replace field adds to the key its read is made under: nothing for a pane that
 * is no preview, and the whole field for one that is, so another query, replace text or set of
 * hits is a new read of the same pane.
 */
export function previewKey(replace: ReplacePreview | undefined): string {
    return replace === undefined ? '' : JSON.stringify(replace);
}
