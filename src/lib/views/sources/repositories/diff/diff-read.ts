// Layer 3, view helper of views/sources/repositories/diff/Diff.svelte. The reads a diff is made of:
// the one address of a file's, a commit's, a stash's, a worktree's or a comparison's diff, or one
// address per path of the staged or changed group, a few at a time. Each answer is mapped to the
// pane's `DiffAnswer`; a group is the first answer that failed, or all its files together.

import { readJson } from '$lib/data/shapes/shapes';
import { diffAnswerOf, type DiffAnswer } from '$lib/state/sources/repositories/answers';
import {
    diffUrl,
    fileDiffUrl,
    groupPaths,
    readAll,
    type DiffState
} from '$lib/state/sources/repositories/repositories';

/** How many files of a group's diff are read at once. */
const GROUP_READS = 6;

type Git = Parameters<typeof groupPaths>[0];

/** What one address answered: whether the server took the request, and what its body held. */
async function answer(url: string): Promise<DiffAnswer> {
    const response = await fetch(url);
    return diffAnswerOf(response.ok, await readJson(response));
}

/** The reads a diff is made of: the one address, or one per path of a group of the repository. */
export async function readPaneDiff(state: DiffState, repo: Git | null): Promise<DiffAnswer> {
    const group = state.group;
    if (group === undefined) return answer(diffUrl(state));
    const paths = repo === null ? [] : groupPaths(repo, group);
    const answers = await readAll(paths, GROUP_READS, (path) =>
        answer(fileDiffUrl(state.root, path, group === 'staged'))
    );
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
