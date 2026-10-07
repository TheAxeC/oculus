// Layer 2, server. The git writes that cross to a remote: pull, fetch, sync, publish and the push
// of tags, as VS Code's Source Control offers them. Each reaches git through the one call site
// server/git/git-write.ts exports for its subcommand, so the writing module's gate still sees
// every subcommand at one place.
//
// Pull runs with the repository's own configuration, so a repository set to rebase on pull is
// rebased and one set to merge is merged; nothing here imposes a strategy. A pull that stops on
// conflicts leaves the merge or the rebase in progress, and the answer names the paths, which the
// view then draws under Merge Changes. No push here is forced: publishing a branch sets its
// upstream on a remote the repository already has, and a branch that has one is refused.

import { permitted } from '../core/paths.ts';
import { words } from '../core/words.ts';
import {
    allowedRoots,
    failed,
    fetchIn,
    pullIn,
    pushTo,
    refFormat,
    remoteNames,
    revParse,
    upstream,
    type Outcome
} from './git-write.ts';
import { stoppedOn } from './git-index.ts';

/** Bring the upstream's commits into the checked-out branch, the repository's own way. */
export async function pull(
    root: string,
    text: Record<string, string>,
    roots: string[] = allowedRoots(),
    signal?: AbortSignal
): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(words(text, 'server.git.unknown_directory'));
    const up = await upstream(root);
    if (!up.ok) return failed(words(text, 'server.git.pull_no_upstream'));
    const done = await pullIn(root, signal);
    if (done.ok) return done;
    return stoppedOn(root, done, text, 'pull');
}

/** Read every remote's branches, taking away the ones the remote no longer has. */
export async function fetchAll(
    root: string,
    text: Record<string, string>,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(words(text, 'server.git.unknown_directory'));
    return fetchIn(root);
}

/**
 * VS Code's Sync Changes: pull, then push what the branch holds that the upstream does not. A
 * pull that stops leaves the push unmade, since what would be pushed is not settled yet.
 */
export async function sync(
    root: string,
    text: Record<string, string>,
    roots: string[] = allowedRoots(),
    signal?: AbortSignal
): Promise<Outcome> {
    const pulled = await pull(root, text, roots, signal);
    if (!pulled.ok) return pulled;
    const pushed = await pushTo(root, [], signal);
    if (!pushed.ok) return pushed;
    return { ok: true, output: `${pulled.output}${pushed.output}`, error: '' };
}

/**
 * Publish the checked-out branch: push it to a remote of the repository's own and make that its
 * upstream. A branch that already has an upstream, a detached HEAD, and a remote the repository
 * does not name are refused before anything is sent.
 */
export async function publish(
    root: string,
    remote: string,
    text: Record<string, string>,
    roots: string[] = allowedRoots(),
    signal?: AbortSignal
): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(words(text, 'server.git.unknown_directory'));
    const known = await remoteNames(root);
    if (!known.ok) return known;
    const names = known.output.split('\n').filter((one) => one.trim() !== '');
    if (typeof remote !== 'string' || !names.includes(remote)) {
        return failed(words(text, 'server.git.not_a_remote', remote));
    }
    const head = await revParse(root, ['--abbrev-ref', 'HEAD']);
    if (!head.ok) return head;
    const branch = head.output.trim();
    if (branch === '' || branch === 'HEAD') {
        return failed(words(text, 'server.git.publish_no_branch'));
    }
    const up = await upstream(root);
    if (up.ok) return failed(words(text, 'server.git.already_upstream', up.output.trim()));
    // The branch is git's own name for what is checked out, and git judges it again here, so a
    // name that reads as an option never reaches the push.
    const judged = await refFormat(root, ['--branch', branch]);
    if (!judged.ok || branch.startsWith('-')) {
        return failed(words(text, 'server.git.not_to_publish', branch));
    }
    return pushTo(root, ['--set-upstream', remote, branch], signal);
}

/** Push every tag to the upstream's remote, git's own `push --tags`. */
export async function pushTags(
    root: string,
    text: Record<string, string>,
    roots: string[] = allowedRoots(),
    signal?: AbortSignal
): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(words(text, 'server.git.unknown_directory'));
    const known = await remoteNames(root);
    if (!known.ok) return known;
    if (known.output.trim() === '') return failed(words(text, 'server.git.no_remote_for_tags'));
    return pushTo(root, ['--tags'], signal);
}
