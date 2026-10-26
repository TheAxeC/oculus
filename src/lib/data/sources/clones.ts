// Layer 1, data. Which repositories of the workspace are the clones of which projects. A project is
// cloned wherever a repository of the workspace has the project's `repository.url` as its `origin`,
// so where it was cloned is read from the repositories and written nowhere. The caller names the
// repositories, in the order they are listed, and this module reads each one's origin
// (sources/origin.ts) and fills `repository.clones` of the projects of a snapshot. Server side
// only: it reads the filesystem and no client module may import it.
//
// The folders of the list that share one git folder, a main checkout and its linked worktrees, are
// one clone, since a worktree is a second checkout of the same repository and no second clone:
// that clone is named by the main checkout when the list holds it and otherwise by the first of
// them, at the place of the first of them in the list (`repositoryStandIns` of origin.ts).
//
// A project with two clones is a finding on the project naming both folders, and its card names the
// first. A project with none keeps an empty list, which is what offers Clone.

import { findingText, type TextCatalog } from '../helpers/finding-text.ts';
import type { Entities, Finding } from '../model/index.ts';
import { gitFolderOf, originOf, repositoryStandIns, sameAddress } from './origin.ts';
import { sortFindings } from '../snapshot/validate.ts';

/**
 * The clones among the repositories given, in their order: each folder whose repository has an
 * `origin`, the folders of one git folder counted once.
 */
function listedClones(repositories: readonly string[]): { dir: string; origin: string }[] {
    const read = repositories.flatMap((dir) => {
        const origin = originOf(dir);
        return origin === null ? [] : [{ dir, origin }];
    });
    const standIns = repositoryStandIns(read.map((one) => gitFolderOf(one.dir)));
    const named = new Set<number>();
    return read.flatMap((_, at) => {
        const stand = standIns[at];
        if (named.has(stand)) return [];
        named.add(stand);
        return [read[stand]];
    });
}

/**
 * Set `repository.clones` on every project of the snapshot that has a `repository.url`, from the
 * repositories given, and add the finding for each project cloned more than once. The snapshot is
 * changed in place, before it is published; only its projects and its findings are read, so a hub's
 * own snapshot takes it as the merged one does.
 */
export function placeClones(
    snapshot: { entities: Pick<Entities, 'projects'>; findings: Finding[] },
    repositories: readonly string[],
    catalog: TextCatalog
): void {
    const origins = listedClones(repositories);
    const raised: Finding[] = [];
    for (const project of Object.values(snapshot.entities.projects)) {
        const block = project.repository;
        if (block === undefined) continue;
        const url = block.url;
        block.clones =
            url === undefined
                ? []
                : origins.filter((one) => sameAddress(url, one.origin)).map((one) => one.dir);
        if (block.clones.length > 1) {
            raised.push({
                file: project.file,
                key: 'repository.url',
                message: findingText(
                    catalog,
                    'findings.manifests.cloned_twice',
                    url ?? '',
                    block.clones.join(', ')
                )
            });
        }
    }
    if (raised.length > 0) {
        snapshot.findings = sortFindings([...snapshot.findings, ...raised]);
    }
}
