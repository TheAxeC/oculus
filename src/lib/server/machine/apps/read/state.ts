// Layer 2, server. Which apps are disabled: the record file `~/.oculus/apps.json`, its reader and
// the writes that change it.
//
// The file holds `{ version: 1, disabled: [<view id>], workspaces: { "<workspace name>": {
// disabled: [<view id>], enabled: [<view id>] } } }`. An app is disabled in a workspace when its
// view id is in that workspace's `disabled`, or in the machine-wide `disabled` and not in that
// workspace's `enabled`. The default workspace is keyed `default`. An entry for a view id no app
// has is kept, so an app removed from a root and put back keeps its state; Remove drops the entries
// of the app it removes.
//
// A file that does not read, or is not that shape, reads every app as disabled and is named by a
// finding, and a write over it is refused with the reason and leaves it as it was, so the bytes the
// reader put there are never replaced. A write replaces the file whole through a temporary file and
// a rename, mode 0600, and reads it back; the caller chains its writes, so two at once both land.

import { homedir } from 'node:os';
import { basename, join } from 'node:path';
import { z } from 'zod';
import { readJsonChecked, writePrivateJson, type PrivateWrite } from '../../../core/json.ts';

/** The key the default workspace has in the file. */
const DEFAULT_KEY = 'default';

/** ~/.oculus/apps.json, resolved at the call rather than at import. */
export function defaultAppsStatePath(): string {
    return join(homedir(), '.oculus', 'apps.json');
}

const ids = z.array(z.string());

const fileShape = z.object({
    version: z.literal(1),
    disabled: ids,
    workspaces: z.record(z.string(), z.object({ disabled: ids, enabled: ids }))
});

type FileState = z.infer<typeof fileShape>;

/** The lists of one workspace. */
type Lists = { disabled: ReadonlySet<string>; enabled: ReadonlySet<string> };

/** What the file says: the machine-wide list and each workspace's lists, or why none reads. */
export type AppsState = {
    /** The sentence of why the file does not read, or null when it does or is not there. */
    problem: string | null;
    machine: ReadonlySet<string>;
    workspaces: ReadonlyMap<string, Lists>;
};

/** How one app stands: disabled here, disabled machine-wide, and what the workspace says. */
export type AppStanding = {
    disabled: boolean;
    machine: boolean;
    workspace: '' | 'disabled' | 'enabled';
};

type Loaded = { ok: true; file: FileState } | { ok: false; error: string };

const EMPTY: FileState = { version: 1, disabled: [], workspaces: {} };

/** The file as it stands: empty when it is not there, and the reason when it does not read. */
function load(file: string): Loaded {
    const read = readJsonChecked(file);
    if (!read.ok) return { ok: false, error: `${basename(file)} ${read.reason}: ${file}` };
    if (read.value === undefined) return { ok: true, file: structuredClone(EMPTY) };
    const parsed = fileShape.safeParse(read.value);
    if (!parsed.success) {
        return { ok: false, error: `${basename(file)} is not the apps shape: ${file}` };
    }
    return { ok: true, file: parsed.data };
}

/** The state the file holds; a file that does not read is `problem` and no list. */
export function readAppsState(file: string): AppsState {
    const loaded = load(file);
    if (!loaded.ok) return { problem: loaded.error, machine: new Set(), workspaces: new Map() };
    const workspaces = new Map<string, Lists>();
    for (const [name, lists] of Object.entries(loaded.file.workspaces)) {
        workspaces.set(name, {
            disabled: new Set(lists.disabled),
            enabled: new Set(lists.enabled)
        });
    }
    return { problem: null, machine: new Set(loaded.file.disabled), workspaces };
}

/** The key a workspace has in the file: its name, `default` for the default workspace. */
export function workspaceKey(current: string): string {
    return current === '' ? DEFAULT_KEY : current;
}

/** How the app of this view id stands in this workspace. A file that does not read disables all. */
export function standingOf(state: AppsState, workspace: string, id: string): AppStanding {
    if (state.problem !== null) return { disabled: true, machine: true, workspace: '' };
    const lists = state.workspaces.get(workspace);
    const machine = state.machine.has(id);
    const here = lists?.disabled.has(id) ? 'disabled' : lists?.enabled.has(id) ? 'enabled' : '';
    return {
        disabled: here === 'disabled' || (machine && here !== 'enabled'),
        machine,
        workspace: here
    };
}

/** One change to the file: an app disabled or enabled machine-wide or in one workspace. */
export type StateChange =
    | { scope: 'machine'; id: string; disabled: boolean }
    | { scope: 'workspace'; workspace: string; id: string; disabled: boolean }
    | { scope: 'forget'; id: string };

/** What a write of the file answers: done, or the reason the file was left as it was. */
export type StateWrite = PrivateWrite;

/** The ids with this one added or taken out. */
function toggled(list: readonly string[], id: string, present: boolean): string[] {
    const rest = list.filter((one) => one !== id);
    return present ? [...rest, id] : rest;
}

/** The file with the change made. */
function changed(file: FileState, change: StateChange): FileState {
    if (change.scope === 'machine') {
        return { ...file, disabled: toggled(file.disabled, change.id, change.disabled) };
    }
    if (change.scope === 'workspace') {
        const held = file.workspaces[change.workspace] ?? { disabled: [], enabled: [] };
        const lists = {
            disabled: toggled(held.disabled, change.id, change.disabled),
            enabled: toggled(held.enabled, change.id, !change.disabled)
        };
        return { ...file, workspaces: { ...file.workspaces, [change.workspace]: lists } };
    }
    const workspaces = Object.fromEntries(
        Object.entries(file.workspaces).map(([name, lists]) => [
            name,
            {
                disabled: toggled(lists.disabled, change.id, false),
                enabled: toggled(lists.enabled, change.id, false)
            }
        ])
    );
    return { ...file, disabled: toggled(file.disabled, change.id, false), workspaces };
}

/** Write the file with the change made, whole by a rename, and read it back. */
export function changeAppsState(file: string, change: StateChange): StateWrite {
    const loaded = load(file);
    if (!loaded.ok) return loaded;
    return writePrivateJson(file, changed(loaded.file, change));
}
