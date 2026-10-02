// Layer 2, client state, pure. What the Timeline section asks of the server and how it reads the
// answers: the addresses of a file's local-history copies and of the commits that touched it, and
// the copies and commits an answer lists. An entry that is not well formed is left out, so a
// server answering in a shape this version does not know draws a shorter list and never a row with
// a hole in it.

import { z } from 'zod';
import { readAs, survivorsShape, unchanged } from '../../../../data/shapes/shapes.ts';
import type { GitCommit } from '../../../../data/model/index.ts';
import type { SavedCopy } from './timeline.ts';

/** The address of the copies of one file, or with `id` the text of one copy. */
export function historyUrl(root: string, path: string, id?: string): string {
    const parameters = new URLSearchParams({ root, path });
    if (id !== undefined) parameters.set('id', id);
    return `/api/history?${parameters.toString()}`;
}

/** The address of the commits that touched a file of a repository, newest first. */
export function logUrl(repository: string, path: string): string {
    return `/api/git?${new URLSearchParams({ log: repository, path }).toString()}`;
}

const copyShape = unchanged(
    z.object({
        id: z.string().min(1),
        at: z.number(),
        size: z.number(),
        kind: z.enum(['save', 'delete'])
    })
) satisfies z.ZodType<SavedCopy>;

const commitShape = unchanged(
    z.object({ hash: z.string(), short: z.string(), subject: z.string(), when: z.string() })
) satisfies z.ZodType<GitCommit>;

/** The copies an answer of the history route lists, newest first as the server sent them. */
export function copiesOf(body: unknown): SavedCopy[] {
    return readAs(z.object({ saves: survivorsShape(copyShape).catch([]) }), body)?.saves ?? [];
}

/** The commits an answer of the git log read lists. */
export function commitsOf(body: unknown): GitCommit[] {
    return (
        readAs(z.object({ commits: survivorsShape(commitShape).catch([]) }), body)?.commits ?? []
    );
}

/** The text of one copy an answer of the history route carries, or null for any other answer. */
export function copyTextOf(body: unknown): string | null {
    return readAs(z.object({ content: z.string() }), body)?.content ?? null;
}
