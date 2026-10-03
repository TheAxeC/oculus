// Layer 3, view helper of views/sources/repositories/diff/Diff.svelte. The reads a diff is made of:
// the one request of a file's, a commit's, a stash's, a worktree's or a Replace Preview's diff (the
// last a POST, answers.ts's diffRequest), or several reads joined
// into one answer. A group of changes is one read per path, and a comparison of a ref with a commit
// is one read of the files the two differ in and then one per file, each holding the file's two
// sides. Reads of the same diff run a few at a time.

import { readJson } from '$lib/data/shapes/shapes';
import {
    commitFilesOf,
    diffAnswerOf,
    diffRequest,
    type DiffAnswer,
    type DiffRequest
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

/** What one request answered: whether the server took it, and what its body held. */
async function answer(request: DiffRequest): Promise<DiffAnswer> {
    const response = await fetch(request.url, request.init);
    return diffAnswerOf(response.ok, await readJson(response));
}

/**
 * What a diff pane shows for `state`: the one request (a Replace Preview's is a POST carrying the
 * page's write `token`), the files of a comparison, or one read per path of a group of the
 * repository `repo`.
 */
export async function readPaneDiff(
    state: DiffState,
    repo: Git | null,
    token: string
): Promise<DiffAnswer> {
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
                answer({ url: refCompareUrl(state.root, compare.from, compare.to, path) })
            )
        );
    }
    if (group === undefined) return answer(diffRequest(state, token));
    const paths = repo === null ? [] : groupPaths(repo, group);
    return joinAnswers(
        await readAll(paths, GROUP_READS, (path) =>
            answer({ url: fileDiffUrl(state.root, path, group === 'staged') })
        )
    );
}
