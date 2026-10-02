// Layer 3, view helper of views/sources/repositories/diff/Diff.svelte. The reads a diff is made of:
// the one address of a file's, a commit's, a stash's or a worktree's diff, or several reads joined
// into one answer. A group of changes is one read per path, and a comparison of a ref with a commit
// is one read of the files the two differ in and then one per file, each holding the file's two
// sides. Reads of the same diff run a few at a time.

import { readJson } from '$lib/data/shapes/shapes';
import {
    commitFilesOf,
    diffAnswerOf,
    type DiffAnswer
} from '$lib/state/sources/repositories/answers';
import { joinAnswers, refCompareUrl } from '$lib/state/sources/repositories/diff/compare';
import {
    diffUrl,
    fileDiffUrl,
    groupPaths,
    readAll,
    type DiffState
} from '$lib/state/sources/repositories/repositories';

/** How many files of a group's or a comparison's diff are read at once. */
const GROUP_READS = 6;

type Git = Parameters<typeof groupPaths>[0];

/** What one address answered: whether the server took the request, and what its body held. */
async function answer(url: string): Promise<DiffAnswer> {
    const response = await fetch(url);
    return diffAnswerOf(response.ok, await readJson(response));
}

/**
 * What a diff pane shows for `state`: the one address, the files of a comparison, or one read per
 * path of a group of the repository `repo`.
 */
export async function readPaneDiff(state: DiffState, repo: Git | null): Promise<DiffAnswer> {
    const { group, compare } = state;
    const url = diffUrl(state);
    if (compare !== undefined) {
        const listing = await fetch(url);
        const listed = commitFilesOf(listing.ok, await readJson(listing));
        if (!listing.ok || listed.files === null) {
            return {
                ok: false,
                files: null,
                attributes: null,
                conflicted: false,
                error: listed.failure
            };
        }
        const files = listed.files.map((one) => one.path);
        return joinAnswers(
            await readAll(files, GROUP_READS, (path) =>
                answer(refCompareUrl(state.root, compare.from, compare.to, path))
            )
        );
    }
    if (group === undefined) return answer(url);
    const paths = repo === null ? [] : groupPaths(repo, group);
    return joinAnswers(
        await readAll(paths, GROUP_READS, (path) =>
            answer(fileDiffUrl(state.root, path, group === 'staged'))
        )
    );
}
