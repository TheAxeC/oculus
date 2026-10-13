// Layer 2, client state, pure. The rows of an app's source control as the Repositories view draws
// them and its keyboard walks them: the section head, the groups that show, and in list mode the
// resources of each group, in tree mode its folders and resources. A group with `hideWhenEmpty`
// and no resource is not drawn. A resource is named by its path under its workspace folder, and
// one outside every workspace folder by its URI, so it is drawn and never opened.

import type { AppScmGroup, AppScmResource, AppScmState } from '../../../../data/model/index.ts';
import {
    changeTree,
    folderId,
    leafOf,
    visibleRows,
    type KeyRow,
    type TreeRow
} from '../../../sources/repositories/change-tree.ts';

/** The groups of a control that are drawn. */
export function drawnGroups(state: AppScmState): AppScmGroup[] {
    return state.groups.filter((group) => !(group.hideWhenEmpty && group.resources.length === 0));
}

/** The path a resource is shown and sorted under. */
function shownPath(resource: AppScmResource): string {
    return resource.path === '' ? resource.uri : resource.path;
}

/** The last part of a resource's path, which its row is named by. */
export function resourceName(resource: AppScmResource): string {
    const name = leafOf(shownPath(resource));
    return name === '' ? resource.uri : name;
}

/** The id of a resource row, apart in each control and group. */
export function resourceId(key: string, group: string, uri: string): string {
    return `scm:${key}:${group}:${uri}`;
}

/** The id of a group's head. */
export function groupId(key: string, group: string): string {
    return `scmgroup:${key}:${group}`;
}

/** The id of the control's section head. */
export function sectionId(key: string): string {
    return `scmsource:${key}`;
}

/** The entries of a group, a resource under the path it is shown at. */
function entriesOf(group: AppScmGroup): (AppScmResource & { path: string })[] {
    return group.resources.map((one) => ({ ...one, path: shownPath(one) }));
}

/** The rows a group draws: its resources in list mode, its folders and resources in tree mode. */
export function groupRows(
    key: string,
    group: AppScmGroup,
    mode: 'list' | 'tree',
    collapsed: readonly string[]
): TreeRow<AppScmResource & { path: string }>[] {
    const entries = entriesOf(group);
    if (mode === 'list') {
        return entries.map((entry) => ({
            kind: 'file' as const,
            name: resourceName(entry),
            path: entry.path,
            depth: 0,
            entry
        }));
    }
    return visibleRows(changeTree(entries), (path) =>
        collapsed.includes(folderId(key, group.id, path))
    );
}

/** The rows of a control as the keyboard reads them. */
export function sourceKeyRows(
    key: string,
    state: AppScmState,
    mode: 'list' | 'tree',
    collapsed: readonly string[]
): KeyRow[] {
    const section = sectionId(key);
    const open = !collapsed.includes(section);
    const rows: KeyRow[] = [{ id: section, parent: null, open }];
    if (!open) return rows;
    for (const group of drawnGroups(state)) {
        const head = groupId(key, group.id);
        const groupOpen = !collapsed.includes(head);
        rows.push({ id: head, parent: section, open: groupOpen });
        if (!groupOpen) continue;
        const folders: string[] = [];
        for (const row of groupRows(key, group, mode, collapsed)) {
            const parent = row.depth === 0 ? head : folders[row.depth - 1];
            if (row.kind === 'folder') {
                const id = folderId(key, group.id, row.path);
                folders[row.depth] = id;
                rows.push({ id, parent, open: !collapsed.includes(id) });
            } else {
                rows.push({ id: resourceId(key, group.id, row.entry.uri), parent });
            }
        }
    }
    return rows;
}
