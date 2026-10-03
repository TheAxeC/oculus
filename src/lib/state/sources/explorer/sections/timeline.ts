// Layer 2, client state, pure. The Timeline section's rows for one file: the local-history copies
// the server keeps before a save, a replace or a delete (GET /api/history) and the commits that
// touched the file (GET /api/git?log=), merged newest first.
//
// A copy is made before the change, so its time is when the file was changed, and a row of kind
// `save` reads "File Saved", `replace` "File Replaced" and `delete` "File Deleted"; the words come
// from the catalog where the row is drawn. A commit row carries its subject and its short hash.

import type { GitCommit } from '../../../../data/model/index.ts';

/** What a copy of a file in the local history was made before. */
type CopyKind = 'save' | 'replace' | 'delete';

/** One copy of a file in the local history, as GET /api/history lists it. */
export type SavedCopy = { id: string; at: number; size: number; kind: CopyKind };

/** One row of the timeline. `key` is the copy's id or the commit's hash. */
export type TimelineEntry =
    | { kind: CopyKind; key: string; at: number; size: number }
    | { kind: 'commit'; key: string; at: number; short: string; subject: string };

/** The time of a commit in milliseconds, or 0 when git wrote a date that does not read. */
function commitTime(commit: GitCommit): number {
    const at = Date.parse(commit.when);
    return Number.isNaN(at) ? 0 : at;
}

/**
 * The timeline of one file: every copy and every commit, newest first. Two rows of the same time
 * keep the copies before the commits, since a copy is made just before the change a commit later
 * records.
 */
export function timelineOf(copies: SavedCopy[], commits: GitCommit[]): TimelineEntry[] {
    const saved: TimelineEntry[] = copies.map((one) => ({
        kind: one.kind,
        key: one.id,
        at: one.at,
        size: one.size
    }));
    const committed: TimelineEntry[] = commits.map((one) => ({
        kind: 'commit',
        key: one.hash,
        at: commitTime(one),
        short: one.short,
        subject: one.subject
    }));
    return [...saved, ...committed].sort((a, b) => b.at - a.at);
}
