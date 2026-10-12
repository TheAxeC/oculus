// Layer 1, data. Which repositories of the workspace are the clones of which projects. A project is
// cloned wherever a repository of the workspace has the project's `repository.url` as its `origin`,
// so where it was cloned is read from the repositories and written nowhere. The caller names the
// repositories, in the order they are listed, and this module reads each one's origin
// (sources/origin.ts) and fills `repository.clones` of the projects of a snapshot. Server side
// only: it reads the filesystem and no client module may import it.
//
// A project with two clones is a finding on the project naming both folders, and its card names the
// first. A project with none keeps an empty list, which is what offers Clone.

import { findingText, type TextCatalog } from '../helpers/finding-text.ts';
import type { Finding, Snapshot } from '../model/index.ts';
import { originOf, sameAddress } from './origin.ts';
import { sortFindings } from '../snapshot/validate.ts';

/**
 * Set `repository.clones` on every project of the snapshot that has a `repository.url`, from the
 * repositories given, and add the finding for each project cloned more than once. The snapshot is
 * changed in place, before it is published.
 */
export function placeClones(
    snapshot: Snapshot,
    repositories: readonly string[],
    catalog: TextCatalog
): void {
    const origins = repositories.flatMap((dir) => {
        const origin = originOf(dir);
        return origin === null ? [] : [{ dir, origin }];
    });
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
