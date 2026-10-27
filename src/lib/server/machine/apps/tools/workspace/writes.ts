// Layer 2, server. The writes of the workspace requests of a host: `workspace.fs.writeFile`,
// `createDirectory`, `delete`, `rename` and `copy`, and the file operations of `applyEdit`. Each is
// one or two operations of the Files view's writer (files/fs/ops.ts, through `ToolsEnv.ops`), so it
// runs in the write chain, is recorded in the change log the History lists and the undo reads, and
// is followed by the tab that holds the file. The scope judges every path first (scope.ts).
//
// A write of a file that exists replaces it in place and the local history keeps the bytes it
// replaced; a new file is an upload under a name in a folder that exists. A folder made with the
// folders above it is one `create` whose name holds the folders still to make. A rename inside a
// folder is a `rename`, a move to another folder a `paste` in move mode, and both together a
// rename and a move, the one the free name allows first. A copy is a `paste` in copy mode, which
// takes the name the source has, followed by a rename when the target is named otherwise. A
// target that exists is refused `exists`, or with `overwrite` deleted first.
//
// A copy, a rename or a delete of a folder is refused `closed`, with nothing written, when the
// folder holds a private folder or file or oculus's own config folder below it: the private places
// are compared with the folder's path, so no walk of the tree is made. The machine's `local.yml`
// files are protected by the writer itself, which refuses every folder above one.

import { existsSync, lstatSync, readdirSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import type { OpsAnswer, OpsRefusal } from '../../../../../data/file-ops.ts';
import { Refused } from '../../host/connection.ts';
import type { ScopeFile, ToolsScope, WriteOperation } from '../scope.ts';

/** The word an app is refused with for each refusal of the writer. */
const WORDS: Record<OpsRefusal, string> = {
    token: 'denied',
    'not-an-action': 'denied',
    outside: 'outside',
    missing: 'missing',
    root: 'closed',
    invalid_name: 'denied',
    exists: 'exists',
    into_itself: 'denied',
    not_a_folder: 'not_a_folder',
    denied: 'denied',
    trash_failed: 'denied',
    too_large: 'too_large',
    not_base64: 'denied',
    'bad-query': 'denied',
    binary: 'denied',
    'search-failed': 'denied',
    changed: 'denied',
    marker: 'denied',
    local: 'denied'
};

/** The path of the folder a path of a root lies in, `''` for the root itself. */
function parentOf(path: string): string {
    const at = path.lastIndexOf('/');
    return at < 0 ? '' : path.slice(0, at);
}

/** A file or folder as the writer names it: a root's key and a path under it. */
type Place = { root: string; path: string };

/** The path of an entry named `name` in the folder at `parent` of a root. */
function child(parent: string, name: string): string {
    return parent === '' ? name : `${parent}/${name}`;
}

/** What the writes of one host are made from. */
export type WritesOf = {
    scope: ToolsScope;
    /** The operation of the writer; a refusal of it is the app's refusal. */
    ops: (operation: WriteOperation) => Promise<OpsAnswer>;
};

/** The writes of the workspace requests of a host, over the operations of the Files view. */
export class WorkspaceWrites {
    readonly #scope: ToolsScope;
    readonly #ops: WritesOf['ops'];

    constructor(of: WritesOf) {
        this.#scope = of.scope;
        this.#ops = of.ops;
    }

    /** Run one operation; a refusal is thrown as the word an app is told. */
    async #run(operation: WriteOperation): Promise<Extract<OpsAnswer, { ok: true }>> {
        const done = await this.#ops(operation);
        if (!done.ok) throw new Refused(WORDS[done.error]);
        return done;
    }

    /** Whether a folder may be acted on as a whole: nothing closed to apps lies below it. */
    #whole(file: ScopeFile): void {
        if (lstatSync(file.real).isDirectory() && this.#scope.holdsClosed(file.real)) {
            throw new Refused('closed');
        }
    }

    /** One file's bytes written under its name: replaced in place when it exists. */
    async writeFile(target: ScopeFile, bytes: Buffer): Promise<void> {
        const exists = existsSync(target.real);
        if (!exists && !existsSync(dirname(target.real))) throw new Refused('missing');
        await this.#run({
            op: 'upload',
            root: target.root.key,
            path: parentOf(target.path),
            name: basename(target.real),
            data: bytes.toString('base64'),
            replace: exists
        });
    }

    /** A folder made with the folders above it that are missing; one that exists is as it is. */
    async createDirectory(target: ScopeFile): Promise<void> {
        if (existsSync(target.real)) {
            if (lstatSync(target.real).isDirectory()) return;
            throw new Refused('exists');
        }
        const names = target.path.split('/');
        let kept = names.length;
        let probe = target.real;
        while (kept > 0 && !existsSync(probe)) {
            probe = dirname(probe);
            kept -= 1;
        }
        await this.#run({
            op: 'create',
            root: target.root.key,
            path: names.slice(0, kept).join('/'),
            name: names.slice(kept).join('/'),
            folder: true
        });
    }

    /** A file made empty under its name, or the file it was emptied from. */
    async createFile(target: ScopeFile, overwrite: boolean): Promise<void> {
        if (existsSync(target.real) && overwrite) {
            await this.writeFile(target, Buffer.alloc(0));
            return;
        }
        await this.#run({
            op: 'create',
            root: target.root.key,
            path: parentOf(target.path),
            name: basename(target.real),
            folder: false
        });
    }

    /** A file or folder removed, to the Trash when the app asks for it. */
    async remove(target: ScopeFile, how: { recursive: boolean; useTrash: boolean }): Promise<void> {
        this.#whole(target);
        const info = lstatSync(target.real);
        if (info.isDirectory() && !how.recursive && readdirSync(target.real).length > 0) {
            throw new Refused('not_empty');
        }
        await this.#run({
            op: how.useTrash ? 'trash' : 'delete',
            root: target.root.key,
            paths: [target.path]
        });
    }

    /** A taken target deleted when the app overwrites, refused `exists` when it does not. */
    async #cleared(to: ScopeFile, overwrite: boolean): Promise<void> {
        if (!existsSync(to.real)) return;
        if (!overwrite) throw new Refused('exists');
        await this.remove(to, { recursive: true, useTrash: false });
    }

    /** A file or folder moved or renamed to the path of `to`. */
    async rename(from: ScopeFile, to: ScopeFile, overwrite: boolean): Promise<void> {
        this.#whole(from);
        if (from.real === to.real) return;
        await this.#cleared(to, overwrite);
        const name = basename(to.real);
        const old = basename(from.real);
        const here: Place = { root: from.root.key, path: from.path };
        const renamed = (at: Place, as: string): Promise<unknown> =>
            this.#run({ op: 'rename', root: at.root, path: at.path, name: as });
        const moved = (item: Place): Promise<unknown> =>
            this.#run({
                op: 'paste',
                mode: 'move',
                items: [item],
                root: to.root.key,
                path: parentOf(to.path),
                replace: false
            });
        if (dirname(from.real) === dirname(to.real)) {
            await renamed(here, name);
        } else if (old === name) {
            await moved(here);
        } else if (!existsSync(join(dirname(from.real), name))) {
            // Another folder under another name: the rename and the move are made in the order the
            // names that are free allow.
            await renamed(here, name);
            await moved({ root: here.root, path: child(parentOf(here.path), name) });
        } else if (existsSync(join(dirname(to.real), old))) {
            throw new Refused('exists');
        } else {
            await moved(here);
            await renamed({ root: to.root.key, path: child(parentOf(to.path), old) }, name);
        }
    }

    /** A file or folder copied to the path of `to`. */
    async copy(from: ScopeFile, to: ScopeFile, overwrite: boolean): Promise<void> {
        this.#whole(from);
        await this.#cleared(to, overwrite);
        const name = basename(to.real);
        const done = await this.#run({
            op: 'paste',
            mode: 'copy',
            items: [{ root: from.root.key, path: from.path }],
            root: to.root.key,
            path: parentOf(to.path),
            replace: false
        });
        const landed = done.paths?.[0] ?? '';
        if (landed === '' || basename(landed) === name) return;
        await this.#run({ op: 'rename', root: to.root.key, path: landed, name });
    }
}
