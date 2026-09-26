// Layer 2, server. The git writes that cross to a remote: pull, fetch, sync, publish and the push
// of tags, as VS Code's Source Control offers them. Each reaches git through the one call site
// server/git/git-write.ts exports for its subcommand, so the writing module's gate still sees
// every subcommand at one place.
//
// Pull runs with the repository's own configuration, so a repository set to rebase on pull is
// rebased and one set to merge is merged; nothing here imposes a strategy. A pull that stops on
// conflicts leaves the merge or the rebase in progress, and the answer names the paths, which the
// view then draws under Merge Changes. Nothing is ever forced: publishing a branch sets its
// upstream on a remote the repository already has, and a branch that has one is refused.

import {
    allowedRoots,
    failed,
    fetchIn,
    permitted,
    pullIn,
    pushTo,
    refFormat,
    remoteNames,
    revParse,
    stoppedOn,
    upstream,
    type Outcome
} from './git-write.ts';

const UNKNOWN = 'that directory is not a workspace oculus knows';

/** Bring the upstream's commits into the checked-out branch, the repository's own way. */
export async function pull(root: string, roots: string[] = allowedRoots()): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(UNKNOWN);
    const up = await upstream(root);
    if (!up.ok) return failed('this branch has no upstream, so there is nothing to pull from');
    const done = await pullIn(root);
    if (done.ok) return done;
    return stoppedOn(root, done, 'the pull');
}

/** Read every remote's branches, taking away the ones the remote no longer has. */
export async function fetchAll(root: string, roots: string[] = allowedRoots()): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(UNKNOWN);
    return fetchIn(root);
}

/**
 * VS Code's Sync Changes: pull, then push what the branch holds that the upstream does not. A
 * pull that stops leaves the push unmade, since what would be pushed is not settled yet.
 */
export async function sync(root: string, roots: string[] = allowedRoots()): Promise<Outcome> {
    const pulled = await pull(root, roots);
    if (!pulled.ok) return pulled;
    const pushed = await pushTo(root, []);
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
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(UNKNOWN);
    const known = await remoteNames(root);
    if (!known.ok) return known;
    const names = known.output.split('\n').filter((one) => one.trim() !== '');
    if (typeof remote !== 'string' || !names.includes(remote)) {
        return failed(`${remote} is not a remote of this repository`);
    }
    const head = await revParse(root, ['--abbrev-ref', 'HEAD']);
    if (!head.ok) return head;
    const branch = head.output.trim();
    if (branch === '' || branch === 'HEAD') {
        return failed('this repository has no branch checked out, so there is nothing to publish');
    }
    const up = await upstream(root);
    if (up.ok) return failed(`this branch already has the upstream ${up.output.trim()}`);
    // The branch is git's own name for what is checked out, and git judges it again here, so a
    // name that reads as an option never reaches the push.
    const judged = await refFormat(root, ['--branch', branch]);
    if (!judged.ok || branch.startsWith('-')) return failed(`${branch} is not a branch to publish`);
    return pushTo(root, ['--set-upstream', remote, branch]);
}

/** Push every tag to the upstream's remote, git's own `push --tags`. */
export async function pushTags(root: string, roots: string[] = allowedRoots()): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(UNKNOWN);
    const known = await remoteNames(root);
    if (!known.ok) return known;
    if (known.output.trim() === '') return failed('this repository has no remote to push tags to');
    return pushTo(root, ['--tags']);
}
