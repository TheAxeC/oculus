// Layer 2, client state. What the Career view (views/academic/career/Career.svelte) draws for the
// career file of the primary hub: the line saying the hub holds no career file, the line saying the
// file has no schema, or the editor of the file's page, which draws the fields of the file's own
// `schema:` in its order (EntryEditor.svelte, through page-entry.ts `pageFields` and
// record-values.ts `toEdit`).

import type { Career } from '../../data/model/index.ts';
import type { PageEntry } from './page-entry.ts';

/** What the Career view draws. */
export type CareerShown =
    { state: 'none' } | { state: 'no_schema' } | { state: 'editor'; page: PageEntry };

/** What the Career view draws for the career file and its page (page-entry.ts `pageNamed`). */
export function careerShown(career: Career | null, page: PageEntry | null): CareerShown {
    if (career === null) return { state: 'none' };
    if (page === null) return { state: 'no_schema' };
    return { state: 'editor', page };
}
