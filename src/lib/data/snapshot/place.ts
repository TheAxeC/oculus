// Layer 1, data. Where any project's folder is. The project card, the project page, the manifest
// form, the chat and the document route are written for a `Project`, and each of them finds the
// project's folder here, so a hub folder and a repository are one piece of code. Pure: the place is
// made from the project alone.

import type { Project } from '../model/index.ts';
import { rootOf } from '../helpers/hub-names.ts';

/**
 * Where a project's folder is: the Files root that holds it, its path in that root and its absolute
 * path. A project of a hub folder is in the workspace folder named for its hub (the primary's name
 * for a record without a prefix) at its folder, and its folder is the manifest's; a project of a
 * repository is in the folder of that name at the top, at the folder `repository` names.
 */
export function placeOf(
    project: Project,
    primary: string | null
): { root: string; path: string; dir: string } {
    if (project.workspaceFolder !== undefined) {
        return { root: project.workspaceFolder.root, path: '', dir: project.workspaceFolder.dir };
    }
    const cut = project.file.lastIndexOf('/');
    return {
        root: rootOf(project, primary),
        path: project.folder,
        dir: cut < 0 ? '' : project.file.slice(0, cut)
    };
}
