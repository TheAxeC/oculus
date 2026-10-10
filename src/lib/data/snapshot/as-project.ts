// Layer 1, data. A side project seen as a project, and where any project's folder is. The project
// card, the project page, the manifest form, the chat and the document route are written for a
// `Project`; a side project reaches them through this record, so each of them is one piece of code
// for both kinds and a change to one reaches the other. Pure: the record is made from the side
// project alone and is never part of the snapshot.

import type { Project, SideProject, Tier } from '../model/index.ts';
import { rootOf } from '../helpers/hub-names.ts';
import { compact } from './compact.ts';

/** The tier a side project's record carries, which no board of research projects lists. */
export const SIDE_PROJECT_TIER: Tier = 'side-projects';

/**
 * The project a side project stands for. The keys a side project does not hold are empty: no
 * results, ideas, resources or venue. Its status is its one chip. A repository's record names the
 * Files root that holds it and its absolute folder (`repository`), since the manifest sits in the
 * folder's `.oculus/`.
 */
export function projectOfSide(side: SideProject): Project {
    return compact<Project>({
        id: side.id,
        root: side.root,
        tier: SIDE_PROJECT_TIER,
        ghost: false,
        title: side.title,
        short: side.short,
        pin: side.pin,
        chips: [side.status],
        priority: side.priority,
        eli5: side.eli5,
        next: side.next,
        latest: side.latest,
        results: [],
        ideas: [],
        deadline: side.deadline,
        waitingOn: side.waitingOn ?? [],
        followups: side.followups ?? [],
        snooze: side.snooze,
        subtasks: side.subtasks ?? [],
        resourceIds: [],
        relatedIds: side.relatedIds ?? [],
        fundingIds: [],
        datasetIds: [],
        pillarIds: [],
        domainIds: [],
        collaborators: side.collaborators ?? [],
        docs: side.docs,
        deck: side.deck,
        folder: side.folder,
        file: side.file,
        links: side.links,
        repository:
            side.source.kind === 'root'
                ? { root: side.source.key, dir: side.source.dir }
                : undefined
    });
}

/**
 * Where a project's folder is: the Files root that holds it, its path in that root and its absolute
 * path. A project of a hub folder is in its hub's root at its folder, and its folder is the
 * manifest's; a repository's is in the root of that name at the top, at the folder `repository`
 * names.
 */
export function placeOf(project: Project): { root: string; path: string; dir: string } {
    if (project.repository !== undefined) {
        return { root: project.repository.root, path: '', dir: project.repository.dir };
    }
    const cut = project.file.lastIndexOf('/');
    return {
        root: rootOf(project),
        path: project.folder,
        dir: cut < 0 ? '' : project.file.slice(0, cut)
    };
}
