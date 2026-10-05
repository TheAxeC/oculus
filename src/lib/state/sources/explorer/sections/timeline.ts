// Layer 2, client state, pure. The Timeline section's rows for one file: the local-history copies
// the server keeps before a save, a replace or a delete (GET /api/history) and the commits that
// touched the file (GET /api/git?log=), merged newest first.
//
// A copy is made before the change, so its time is when the file was changed, and a row of kind
// `save` reads "File Saved", `replace` "File Replaced" and `delete` "File Deleted"; the words come
// from the catalog where the row is drawn. A commit row carries its subject, its author, both of
// its dates and the file's path in that commit, and its time is the committer date, which is the
// order git lists commits in. The commits are read a page at a time, so while older commits remain
// the copies older than the oldest commit read wait for the page that reaches their time.

import type { GitFileCommit } from '../../../../data/model/index.ts';

/** What a copy of a file in the local history was made before. */
type CopyKind = 'save' | 'replace' | 'delete';

/** One copy of a file in the local history, as GET /api/history lists it. */
export type SavedCopy = { id: string; at: number; size: number; kind: CopyKind };

/** One row of the timeline. `key` is the copy's id or the commit's hash. */
export type TimelineEntry =
    | { kind: CopyKind; key: string; at: number; size: number }
    | {
          kind: 'commit';
          key: string;
          at: number;
          short: string;
          subject: string;
          author: string;
          email: string;
          /** The author date and the committer date, as git wrote them. */
          authored: string;
          committed: string;
          /** The file's path in that commit, which the diff the row opens is read at. */
          path: string;
      };

/** The time of an ISO date in milliseconds, or 0 when git wrote a date that does not read. */
function timeOf(iso: string): number {
    const at = Date.parse(iso);
    return Number.isNaN(at) ? 0 : at;
}

/**
 * The timeline of one file: every copy and every commit, newest first. Two rows of the same time
 * keep the copies before the commits, since a copy is made just before the change a commit later
 * records. With `more`, the commits read stop short of the file's oldest, and a copy older than the
 * oldest of them is left out until a later page reaches it.
 */
export function timelineOf(
    copies: SavedCopy[],
    commits: GitFileCommit[],
    more = false
): TimelineEntry[] {
    const committed: TimelineEntry[] = commits.map((one) => ({
        kind: 'commit',
        key: one.hash,
        at: timeOf(one.committed),
        short: one.short,
        subject: one.subject,
        author: one.author,
        email: one.email,
        authored: one.when,
        committed: one.committed,
        path: one.path
    }));
    const oldest = more && committed.length > 0 ? Math.min(...committed.map((one) => one.at)) : 0;
    const saved: TimelineEntry[] = copies
        .filter((one) => one.at >= oldest)
        .map((one) => ({ kind: one.kind, key: one.id, at: one.at, size: one.size }));
    return [...saved, ...committed].sort((a, b) => b.at - a.at);
}
