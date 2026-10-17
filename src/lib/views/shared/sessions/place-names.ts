// Layer 3, shared view helper. The words the workspace picker (WorkspacePicker.svelte) lists each
// folder by, so no two places read the same, as VS Code's Open Recent tells two folders of one name
// apart by the folders above them. A hub of the open workspace is named by its own name, the name
// the workspace file gives it; any other folder by its last segment. While two places read the
// same, each of them takes one more segment of the path above it: a folder reads `research-hub/x`
// and `ordo/x`, and a hub reads its name with the folders above it after it, `hub (ordo)`. A place
// that has run out of segments reads its whole path. A folder whose last segment is a hub's name,
// and two hubs of one name, are told apart by the same rule.

import { t } from '$lib/state/shared/words/text';

/** A hub of the open workspace: its folder, absolute, and the name the workspace file gives it. */
export type HubPlace = { dir: string; name: string };

/**
 * The hubs among the open workspace's folders, by their names: every folder marked a hub, and the
 * primary, which is one.
 */
export function hubPlaces(
    folders: readonly { key: string; dir: string; hub?: boolean }[],
    primary: string | null
): HubPlace[] {
    return folders
        .filter((one) => one.hub === true || one.key === primary)
        .map((one) => ({ dir: one.dir, name: one.key }));
}

/** The words of each of `dirs`, absolute folders, by folder; `hubs` names the hubs among them. */
export function placeNames(
    dirs: readonly string[],
    hubs: readonly HubPlace[]
): Map<string, string> {
    const hubName = new Map(hubs.map((one) => [one.dir, one.name]));
    const segments = dirs.map((dir) => dir.split('/').filter((one) => one !== ''));
    // How many segments of the path above its name a hub shows, and how many of its last segments
    // a folder shows; at as many as its path has, either shows its whole path.
    const shown = dirs.map((dir) => (hubName.has(dir) ? 0 : 1));
    const most = (at: number): number => segments[at].length;
    const nameAt = (at: number): string => {
        const own = segments[at];
        const name = hubName.get(dirs[at]);
        if (name === undefined) {
            return shown[at] >= own.length ? dirs[at] : own.slice(-shown[at]).join('/');
        }
        if (shown[at] === 0) return name;
        if (shown[at] >= own.length) return dirs[at];
        return t('composer.hub_in', name, own.slice(-shown[at] - 1, -1).join('/'));
    };
    let moved = true;
    while (moved) {
        moved = false;
        const names = dirs.map((_, at) => nameAt(at));
        for (let at = 0; at < dirs.length; at += 1) {
            if (shown[at] >= most(at)) continue;
            if (names.some((name, other) => other !== at && name === names[at])) {
                shown[at] += 1;
                moved = true;
            }
        }
    }
    return new Map(dirs.map((dir, at) => [dir, nameAt(at)]));
}
