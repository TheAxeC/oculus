// Layer 3, partial of views/sources/repositories/graph/CommitRow.svelte. The names on one commit of
// the Source Control Graph, in the order the row draws them: the head pill first when HEAD is at
// the commit, then the local branches, the remote branches and the tags. The head pill names the
// checked-out branch, and carries the commit's short hash only while HEAD is detached; the branch
// it names is not drawn a second time among the local branches.

import type { GitGraphCommit } from '$lib/state/sources/repositories/repositories';
import type { BranchFacts, HeadFacts } from '../menus/graph-menu';

export type Pill = { name: string; kind: 'head' | 'local' | 'remote' | 'tag' };

/** The pills of a commit, from the names git gave it and the repository's branches. */
export function commitPills(
    commit: Pick<GitGraphCommit, 'head' | 'short' | 'refs' | 'tags'>,
    branches: BranchFacts,
    here: HeadFacts
): Pill[] {
    const named =
        commit.head &&
        !here.detached &&
        branches.current !== '' &&
        commit.refs.includes(branches.current)
            ? branches.current
            : null;
    return [
        ...(commit.head ? [{ name: named ?? commit.short, kind: 'head' } satisfies Pill] : []),
        ...commit.refs
            .filter((name) => branches.local.includes(name) && name !== named)
            .map((name): Pill => ({ name, kind: 'local' })),
        ...commit.refs
            .filter((name) => !branches.local.includes(name))
            .map((name): Pill => ({ name, kind: 'remote' })),
        ...commit.tags.map((name): Pill => ({ name, kind: 'tag' }))
    ];
}
