// Layer 3, view helper of views/sources/repositories/diff/Diff.svelte. The reads a diff is made of:
// the one request of a file's, a commit's, a stash's, a worktree's or a Replace Preview's diff (the
// last a POST, answers.ts's diffRequest), a file of the Refactor Preview (read from the preview),
// or several reads joined into one answer. A group of changes is one read per path, and a
// comparison of a ref with a commit is one read of the files the two differ in and then one per
// file, each holding the file's two sides. Reads of the same diff run a few at a time. The
// comparison of a save conflict is one read of the file as the disk holds it, which is the left
// side; the right side is the source tab's own text, which the pane puts in as the tab changes.
// The comparison of an app's quick diff is the file as the disk holds it against the original the
// app's source control gives, asked of the host with a `scm` request of `/api/app-host`.
// `readKeyOf` is the key a pane's read is made under, which tells it when to read again.

import { readJson } from '$lib/data/shapes/shapes';
import { refusedAnswer } from '$lib/state/shared/answers/answers';
import { TEXT_LIMIT } from '$lib/state/sources/fs';
import { readCapped } from '$lib/state/sources/fs.svelte';
import { previewKey } from '$lib/state/sources/repositories/replace-preview';
import type { PreviewSides } from '$lib/state/system/machine/refactor/preview.svelte';
import { refactorKey } from '$lib/state/sources/repositories/diff/refactor-subject';
import {
    commitFilesOf,
    diffAnswerOf,
    diffRequest,
    type DiffAnswer,
    type DiffRequest
} from '$lib/state/sources/repositories/answers';
import { joinAnswers, refCompareUrl } from '$lib/state/sources/repositories/diff/compare';
import { diffUrl, type DiffState } from '$lib/state/sources/repositories/diff/subject';
import { fileDiffUrl, groupPaths, readAll } from '$lib/state/sources/repositories/repositories';

/** How many files of a group's or a comparison's diff are read at once. */
const GROUP_READS = 6;

type Git = Parameters<typeof groupPaths>[0];

/** The two texts of a file of the pending Refactor Preview, by its identity, root and path. */
export type RefactorSides = (id: string, root: string, path: string) => PreviewSides | null;

/** What one request answered: whether the server took it, and what its body held. */
async function answer(request: DiffRequest): Promise<DiffAnswer> {
    const response = await fetch(request.url, request.init);
    return diffAnswerOf(response.ok, await readJson(response));
}

/** The file of a save conflict as the disk holds it; a file that is not there is an empty side. */
async function diskSide(state: DiffState): Promise<DiffAnswer> {
    const response = await fetch(diffUrl(state), { cache: 'no-cache' });
    if (!response.ok && response.status !== 404) {
        return {
            ok: false,
            files: null,
            attributes: null,
            conflicted: false,
            error: refusedAnswer(response.status)
        };
    }
    const original = response.ok ? (await readCapped(response, TEXT_LIMIT)).text : '';
    const sides = {
        oldPath: state.path,
        newPath: state.path,
        head: [],
        binary: false,
        encoded: false,
        original,
        modified: ''
    };
    return { ok: true, files: [sides], attributes: null, conflicted: false, error: undefined };
}

/**
 * The file as the disk holds it against the original an app's source control gives it (the
 * control's quick diff). A control that is gone, or gives no original, is an unread side.
 */
async function sourceSide(state: DiffState, token: string): Promise<DiffAnswer> {
    const { original } = state;
    const gone: DiffAnswer = {
        ok: false,
        files: null,
        attributes: null,
        conflicted: false,
        error: 'gone'
    };
    if (original === undefined) return gone;
    const response = await fetch('/api/app-host', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-oculus-token': token },
        body: JSON.stringify({
            action: 'scm',
            app: original.app,
            id: original.id,
            op: { kind: 'original', root: state.root, path: state.path }
        })
    });
    const asked = (await readJson(response)) as { ok?: unknown; value?: unknown } | undefined;
    if (!response.ok || asked?.ok !== true || typeof asked.value !== 'string') return gone;
    const now = await diskSide(state);
    const sides = {
        oldPath: state.path,
        newPath: state.path,
        head: [],
        binary: false,
        encoded: false,
        original: asked.value,
        modified: now.files?.at(0)?.original ?? ''
    };
    return { ok: true, files: [sides], attributes: null, conflicted: false, error: undefined };
}

/**
 * The file of a Refactor Preview as the preview holds it: the file as it is on the left and the
 * file with the checked edits on the right. A preview that is no longer pending has none.
 */
function refactorSide(state: DiffState, sides: RefactorSides): DiffAnswer {
    const held =
        state.refactor === undefined ? null : sides(state.refactor.id, state.root, state.path);
    if (held === null) {
        return { ok: false, files: null, attributes: null, conflicted: false, error: 'gone' };
    }
    const file = {
        oldPath: state.path,
        newPath: state.path,
        head: [],
        binary: false,
        encoded: false,
        original: held.original,
        modified: held.modified
    };
    return { ok: true, files: [file], attributes: null, conflicted: false, error: undefined };
}

/**
 * What a diff pane shows for `state`: the one request (a Replace Preview's is a POST carrying the
 * page's write `token`), the files of a comparison, or one read per path of a group of the
 * repository `repo`. A file of the pending Refactor Preview is read from the preview (`sides`) and
 * touches no disk.
 */
export async function readPaneDiff(
    state: DiffState,
    repo: Git | null,
    token: string,
    sides: RefactorSides
): Promise<DiffAnswer> {
    const { group, compare } = state;
    if (state.refactor !== undefined) return refactorSide(state, sides);
    if ((state.unsaved ?? '') !== '') return diskSide(state);
    if (state.original !== undefined) return sourceSide(state, token);
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

/**
 * What a diff pane's read is made under: the pane's id, its replace field when it is a Replace
 * Preview, its preview and the revision of that preview (`revision`) when it is the diff of a file
 * of the Refactor Preview, and for the comparison of a save conflict (a pane naming the source tab
 * whose text is its right side) the hash of the file on disk, so the comparison is read again when
 * the file changes. A pane of any other kind is not read again for a change of the file.
 */
export function readKeyOf(
    held: {
        id: string;
        root: string;
        path: string;
        replace?: Parameters<typeof previewKey>[0];
        refactor?: Parameters<typeof refactorKey>[0];
        unsaved?: string | undefined;
    },
    diskHash: (root: string, path: string) => string | null | undefined,
    revision: (id: string) => number = () => 0
): string {
    const disk = held.unsaved === undefined ? '' : (diskHash(held.root, held.path) ?? '');
    const moved = held.refactor === undefined ? 0 : revision(held.refactor.id);
    return `${held.id}${previewKey(held.replace)}${refactorKey(held.refactor, moved)}${disk}`;
}
