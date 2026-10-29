// Layer 2, client state. The scopes of the Settings view: Workspace (the open workspace file's
// `settings:`), Primary hub (the primary's `.oculus/config.yml`), Hub (a hub's
// `.oculus/config.yml`), This machine (a hub's `.oculus/local.yml`) and Repository (a repository's
// `.oculus/settings.yml`). A scope names the file every row on screen reads and writes, and a key
// the file does not take is not drawn in it: the workspace file takes the options outside the hub
// list, a hub's settings file the keys of the hub list (another hub than the primary only those
// each hub's own file is read for), a hub's `local.yml` the machine's keys (another hub than the
// primary only those whose rows every hub's file joins), and a repository's file
// `editor.languages`.
//
// The scope on screen is the tab's own: its kind and the hub or folder it names, kept in the tab's
// instance state. The hubs and repositories a picker offers are those of the workspace now, so a
// folder added, a hub made and a primary changed redraw the pickers at the next push; a scope whose
// hub or folder left the workspace is offered no more, and the view falls back to the first one.
//
// The changes a scope holds are kept per file (`fileOf`), named so a change stays with the file it
// was made for: the workspace file by its path, a hub's settings file by the hub's name, so the
// Primary hub scope and the Hub scope with the primary picked hold one set of changes, a hub's
// `local.yml` by the hub and a repository's file by the folder.

import { z } from 'zod';
import { JOINED_LOCAL_KEYS } from '../../../../data/helpers/hub-names.ts';
import { readPerHub } from '../../../../data/shapes/hub-keys.ts';
import { readOr } from '../../../../data/shapes/shapes.ts';
import type { FsRoot } from '../../../sources/explorer/view/place.ts';

/** One scope of the Settings view. */
export type Scope =
    | { kind: 'workspace' }
    | { kind: 'primary' }
    | { kind: 'hub'; hub: string }
    | { kind: 'local'; hub: string }
    | { kind: 'repo'; root: string };

/** The kinds of scope, in the order the picker offers them. */
export const SCOPE_KINDS = ['workspace', 'primary', 'hub', 'local', 'repo'] as const;

export type ScopeKind = (typeof SCOPE_KINDS)[number];

/** The scope a tab with no scope of its own shows. */
const FIRST_SCOPE: Scope = { kind: 'workspace' };

/** What the scope pickers are built from: the workspace's folders and its primary. */
export type ScopeGround = {
    folders: readonly FsRoot[];
    primary: string | null;
    /** The open workspace file's path, or null for the unsaved workspace. */
    workspaceFile: string | null;
};

/** The hubs of the workspace, the primary first and the others in the workspace's order. */
export function hubsOf(ground: ScopeGround): string[] {
    const hubs = ground.folders.filter((one) => one.hub === true).map((one) => one.key);
    const primary = ground.primary;
    return primary !== null && hubs.includes(primary)
        ? [primary, ...hubs.filter((one) => one !== primary)]
        : hubs;
}

/** The folders of the workspace that are git repositories, in the workspace's order. */
export function reposOf(ground: ScopeGround): string[] {
    return ground.folders.filter((one) => one.marks?.git === true).map((one) => one.key);
}

/** The names a scope of a kind may pick among: its hubs, its repositories, or none. */
export function picks(kind: ScopeKind, ground: ScopeGround): string[] {
    if (kind === 'hub' || kind === 'local') return hubsOf(ground);
    if (kind === 'repo') return reposOf(ground);
    return [];
}

/** The scope of a kind, naming its first pick; null when the kind has nothing to pick. */
export function scopeOfKind(kind: ScopeKind, ground: ScopeGround): Scope | null {
    if (kind === 'workspace') return { kind };
    if (kind === 'primary') return ground.primary === null ? null : { kind };
    const first = picks(kind, ground).at(0);
    if (first === undefined) return null;
    return kind === 'repo' ? { kind, root: first } : { kind, hub: first };
}

/** The name a scope picks, or null for one that picks none. */
export function pickOf(scope: Scope): string | null {
    if (scope.kind === 'hub' || scope.kind === 'local') return scope.hub;
    if (scope.kind === 'repo') return scope.root;
    return null;
}

/** The scope with another pick. */
export function withPick(scope: Scope, name: string): Scope {
    if (scope.kind === 'hub' || scope.kind === 'local') return { kind: scope.kind, hub: name };
    if (scope.kind === 'repo') return { kind: 'repo', root: name };
    return scope;
}

/**
 * The scope as the workspace stands: the scope itself while its hub or folder is in the workspace
 * (and, for Primary hub, while there is a primary), else the first scope.
 */
export function standing(scope: Scope, ground: ScopeGround): Scope {
    if (scope.kind === 'workspace') return scope;
    if (scope.kind === 'primary') return ground.primary === null ? FIRST_SCOPE : scope;
    const name = pickOf(scope);
    return name !== null && picks(scope.kind, ground).includes(name) ? scope : FIRST_SCOPE;
}

/** The hub a scope writes the settings or machine file of, or null for any other scope. */
function hubOf(scope: Scope, primary: string | null): string | null {
    if (scope.kind === 'primary') return primary;
    if (scope.kind === 'hub' || scope.kind === 'local') return scope.hub;
    return null;
}

/** The name the changes of a scope's file are kept under. */
export function fileOf(scope: Scope, ground: ScopeGround): string {
    if (scope.kind === 'workspace') return `workspace:${ground.workspaceFile ?? ''}`;
    if (scope.kind === 'primary') return `hub:${ground.primary ?? ''}`;
    if (scope.kind === 'hub') return `hub:${scope.hub}`;
    if (scope.kind === 'local') return `local:${scope.hub}`;
    return `repo:${scope.root}`;
}

/** The scope the changes kept under a file's name are made in. */
export function scopeOfFile(file: string, primary: string | null): Scope | null {
    const cut = file.indexOf(':');
    const kind = file.slice(0, cut);
    const name = file.slice(cut + 1);
    if (kind === 'workspace') return { kind: 'workspace' };
    if (kind === 'hub') return name === primary ? { kind: 'primary' } : { kind: 'hub', hub: name };
    if (kind === 'local') return { kind: 'local', hub: name };
    if (kind === 'repo') return { kind: 'repo', root: name };
    return null;
}

/** The kinds of place a row's value lives in, as rows.ts names them. */
type Layer = 'hub' | 'workspace' | 'local' | 'repo';

/**
 * Whether a scope draws a row of the defaults file `file` and key `key`, whose value lives in the
 * layer `layer`: the scope's file takes the key.
 */
export function takes(
    scope: Scope,
    ground: ScopeGround,
    row: { file: string; key: string; layer: Layer }
): boolean {
    if (scope.kind === 'workspace') return row.layer === 'workspace';
    if (scope.kind === 'repo') return row.layer === 'repo';
    if (scope.kind === 'local') {
        if (row.layer !== 'local') return false;
        return scope.hub === ground.primary || JOINED_LOCAL_KEYS.includes(row.key);
    }
    if (row.layer !== 'hub') return false;
    const hub = hubOf(scope, ground.primary);
    return hub === ground.primary || readPerHub(row.file, row.key);
}

const scopeShape = z.union([
    z.object({ kind: z.enum(['workspace', 'primary']) }),
    z.object({ kind: z.enum(['hub', 'local']), hub: z.string().min(1) }),
    z.object({ kind: z.literal('repo'), root: z.string().min(1) })
]);

/** The key of the tab's instance state the scope on screen is kept under. */
const SCOPE_KEY = 'scope';

/** The scope a tab's instance state holds, or the first scope. */
export function scopeIn(state: unknown): Scope {
    const held: unknown =
        typeof state === 'object' && state !== null ? Reflect.get(state, SCOPE_KEY) : null;
    return readOr(scopeShape, held, FIRST_SCOPE);
}

/** The tab's instance state with the scope on screen set. */
export function withScope(state: unknown, scope: Scope): Record<string, unknown> {
    const base = typeof state === 'object' && state !== null ? { ...state } : {};
    return { ...base, [SCOPE_KEY]: scope };
}
