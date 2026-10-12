// Layer 2, client state, pure. The choices of the palette's `:workspace` command: the workspace
// files the open workspace's recent list and its hubs offer, the open one marked, narrowed by the
// words after the command. A name two files share is listed with its hub in front, and every file
// is matched as `<hub>/<name>`, which is how the palette takes a name.

import type { RecentWorkspace, WorkspaceFile } from '../../fs-transport.ts';

/** One workspace file the palette lists. */
export type WorkspaceChoice = {
    path: string;
    /** The name the row is drawn and matched under: the file's name, with the hub when shared. */
    label: string;
    current: boolean;
    /** True for a recent file that is gone from the disk. */
    missing: boolean;
};

/**
 * The workspace files whose `<hub>/<name>` holds every word of the argument, without regard to
 * case: the recent files first in their order, then the files of the hubs that are not among them.
 * A file's name is listed with its hub when another listed file has the same name.
 */
export function workspaceMatches(
    argument: string,
    saved: { open: WorkspaceFile | null; recent: RecentWorkspace[]; available: WorkspaceFile[] }
): WorkspaceChoice[] {
    const words = argument
        .toLowerCase()
        .split(/\s+/)
        .filter((one) => one !== '');
    const recent = saved.recent.map((one) => ({ ...one }));
    const rest = saved.available
        .filter((one) => !recent.some((held) => held.path === one.path))
        .map((one) => ({ ...one, missing: false }));
    const all = [...recent, ...rest];
    const shared = (name: string) => all.filter((one) => one.name === name).length > 1;
    return all
        .filter((one) => {
            const full = `${one.hub}/${one.name}`.toLowerCase();
            return words.every((word) => full.includes(word));
        })
        .map((one) => ({
            path: one.path,
            label: shared(one.name) ? `${one.hub}/${one.name}` : one.name,
            current: saved.open?.path === one.path,
            missing: one.missing
        }));
}
