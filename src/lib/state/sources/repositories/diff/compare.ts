// Layer 2, client state. The addresses and the read bookkeeping of the diff panes that compare two
// things and are not one file's own diff: a ref against a commit (Compare with Remote, Compare with
// Merge Base, Compare with...) and a linked worktree's file against the main worktree's (Compare
// with Workspace). The pane reads them like any diff; what differs is the address, and that a
// compare pane can be re-read while an older read of it is still out.
//
// Nothing here fetches, and nothing imports repositories.ts, which builds the other addresses and
// imports these.

import type { DiffAnswer } from '../answers.ts';

/** An address on /api/git, from its parameters in order. */
function gitUrl(parameters: Record<string, string>): string {
    return `/api/git?${new URLSearchParams(parameters).toString()}`;
}

/**
 * The endpoint a comparison is read from: the files `git diff <from> <to>` lists, or with `path`
 * that one file's two sides. `from` is any ref and `to` a commit hash.
 */
export function refCompareUrl(root: string, from: string, to: string, path = ''): string {
    const parameters = { compare: root, from, to };
    return gitUrl(path === '' ? parameters : { ...parameters, path });
}

/** The endpoint a linked worktree's file is read from against the main worktree's. */
export function workspaceUrl(root: string, path: string): string {
    return gitUrl({ workspace: root, path });
}

/**
 * The bookkeeping of a pane that may be re-read before an older read has answered. Each call takes
 * the next read and hands back its check, which says whether that read is still the newest; a read
 * that is no longer the newest writes nothing.
 */
export function latestRead(): () => () => boolean {
    let newest = 0;
    return () => {
        newest += 1;
        const mine = newest;
        return () => mine === newest;
    };
}

/**
 * The answer of a diff made of several reads, one file each: the first read that failed, or every
 * file of every read in order.
 */
export function joinAnswers(answers: readonly DiffAnswer[]): DiffAnswer {
    const bad = answers.find((one) => !one.ok || one.files === null);
    if (bad !== undefined) return bad;
    return {
        ok: true,
        files: answers.flatMap((one) => one.files ?? []),
        attributes: null,
        conflicted: false,
        error: undefined
    };
}
