// Layer 1, data. Where a project's folder is on disk, nothing checked. Server side only: it
// resolves a path, and no client module may import it.

import { resolve } from 'node:path';
import type { Project } from '../model/index.ts';

/**
 * Where a project's folder is on disk, with nothing checked: the repository it is read from, or its
 * hub-relative folder under the hub it is of.
 */
export function folderOnDisk(hub: string, project: Pick<Project, 'folder' | 'repository'>): string {
    return project.repository?.dir ?? resolve(hub, project.folder);
}
