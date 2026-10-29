// Layer 2, client state. Where the Save of the changes kept under one file's name (scope.ts
// `fileOf`) goes, as the workspace stands now: the kind of file and the hub or folder the Save
// names, with the digest of the text the page read it as; or why it cannot go. The unsaved
// workspace's changes wait for a name; the changes of a hub or a repository that left the
// workspace, and of a workspace file that is no longer the open one, are kept and go nowhere; a
// file being read, unreadable, cut or not parsed says why and is not written.

import type { SaveScope } from '../../../../data/shapes/config-save.ts';
import { message, type Message } from '../messages.ts';
import type { ScopeFile } from './rows.ts';
import { hubsOf, reposOf, scopeOfFile, type Scope, type ScopeGround } from './scope.ts';

/** Where one file's changes go, or why they do not. */
export type SaveTarget =
    | { kind: 'ready'; scope: SaveScope; root?: string; digest: string; name: string }
    | { kind: 'name' }
    | { kind: 'gone'; name: string }
    | { kind: 'blocked'; said: Message };

/** The kind of file a scope's Save writes. */
function saveScope(scope: Scope): SaveScope {
    if (scope.kind === 'local') return 'local';
    if (scope.kind === 'repo') return 'repo';
    return 'settings';
}

/** The hub or folder a scope's Save names: none for the workspace file and the primary's file. */
function rootOf(scope: Scope): string | undefined {
    if (scope.kind === 'hub' || scope.kind === 'local') return scope.hub;
    if (scope.kind === 'repo') return scope.root;
    return undefined;
}

/** The name a file is said by while it is not in the workspace: its hub, folder or path. */
function nameOf(file: string): string {
    return file.slice(file.indexOf(':') + 1);
}

/**
 * Where the changes kept under `file` go. `read` answers the file of a scope as the view reads it,
 * which gives the digest and why it cannot be written.
 */
export function saveTarget(
    file: string,
    ground: ScopeGround,
    read: (scope: Scope) => ScopeFile
): SaveTarget {
    const scope = scopeOfFile(file, ground.primary);
    if (scope === null) return { kind: 'gone', name: file };
    if (scope.kind === 'workspace') {
        const path = nameOf(file);
        if (ground.workspaceFile === null) {
            return path === '' ? { kind: 'name' } : { kind: 'gone', name: path };
        }
        if (path !== ground.workspaceFile) return { kind: 'gone', name: path };
    } else if (scope.kind === 'repo') {
        if (!reposOf(ground).includes(scope.root)) return { kind: 'gone', name: scope.root };
    } else if (scope.kind !== 'primary' && !hubsOf(ground).includes(scope.hub)) {
        return { kind: 'gone', name: scope.hub };
    }
    const held = read(scope);
    if (held.blocked !== null) return { kind: 'blocked', said: held.blocked };
    if (held.digest === null) return { kind: 'blocked', said: message('loading', held.name) };
    const root = rootOf(scope);
    return {
        kind: 'ready',
        scope: saveScope(scope),
        ...(root === undefined ? {} : { root }),
        digest: held.digest,
        name: held.name
    };
}
