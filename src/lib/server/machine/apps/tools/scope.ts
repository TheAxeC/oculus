// Layer 2, server. The files an app's host reaches, and where: the folders of the app's scope (a
// machine app's are every folder of the open workspace, a root app's is its own root alone), a file
// URI turned into a root and a path under it, and the checks that decide whether the host may have
// the file. The checks are the ones `open({ file })` and the app files route make
// (apps/reach/open.ts `locate`): the segment rule and `closed_paths`, a shown root, the real path
// inside the root and outside oculus's config folder, and never a private folder, whichever root
// covers it. A file that does not exist yet is allowed when the folder it would be created in is.
//
// A refusal is one of the words `outside` (a URI that names no file of the scope, or a scheme that
// is not `file:`), `closed` and `missing`.

import { realpathSync, type watch } from 'node:fs';
import { basename, dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { OpsAnswer, OpsRequest } from '../../../../data/file-ops.ts';
import type { LanguageMap } from '../../../../data/helpers/files/languages.ts';
import type { Root } from '../../../files/files.ts';
import { below } from '../../../core/paths.ts';
import { locate, type OpenContext } from '../reach/open.ts';
import type { HeldApp } from '../read/held.ts';
import type { TerminalsEnv } from './run/terminals.ts';

/** The operations of the Files view's writer: every one but the read-only preview. */
export type WriteOperation = Exclude<OpsRequest, { op: 'preview' }>;

/** What the scope reads of the install. */
export type ToolsEnv = {
    /** The roots the file browser shows, with their directories written out. */
    context: () => OpenContext;
    /** The most bytes a file read or written whole may hold. */
    maxBytes: () => number;
    /** The most names a folder lists. */
    scanEntries: () => number;
    languages: () => LanguageMap;
    /**
     * Run one operation that writes in the write chain the Files view's writes run in, recorded in
     * the change log: a file's bytes, a folder made, a rename, a copy, a delete, or the text edits
     * of files no tab holds, recorded with the view id of the app `app` names. An upload that
     * replaces a file writes it in place.
     */
    ops: (operation: WriteOperation, app: string) => Promise<OpsAnswer>;
    /** The terminals the hosts' terminals and tasks run in. */
    terminals: TerminalsEnv;
    /** The platform's recursive folder watch; `fs.watch` unless a test says otherwise. */
    watchFolder?: typeof watch;
};

/** A workspace folder as the host is told it. */
export type ScopeFolder = { uri: string; name: string; root: string; real: string };

/** A file of the scope. */
export type ScopeFile = { root: Root; rootReal: string; path: string; real: string };

/** The answer of a resolve. */
export type Resolved =
    { ok: true; file: ScopeFile } | { ok: false; word: 'outside' | 'closed' | 'missing' };

/** The real path of a path, or null. */
function real(path: string): string | null {
    try {
        return realpathSync.native(path);
    } catch {
        return null;
    }
}

/** The scope of the apps' hosts. */
export class ToolsScope {
    readonly #env: ToolsEnv;

    constructor(env: ToolsEnv) {
        this.#env = env;
    }

    get env(): ToolsEnv {
        return this.#env;
    }

    /** The roots of an app's scope. */
    roots(app: HeldApp): Root[] {
        const all = this.#env.context().roots;
        return app.row.root === '' ? all : all.filter((root) => root.key === app.row.root);
    }

    /** The workspace folders of an app's scope, in the browser's order. */
    folders(app: HeldApp): ScopeFolder[] {
        const out: ScopeFolder[] = [];
        for (const root of this.roots(app)) {
            const at = real(root.dir);
            if (at === null) continue;
            out.push({
                uri: pathToFileURL(at).toString(),
                name: basename(at),
                root: root.key,
                real: at
            });
        }
        return out;
    }

    /** The absolute path a `file:` URI names, or null for any other text. */
    static pathOf(uri: unknown): string | null {
        if (typeof uri !== 'string' || !uri.startsWith('file://')) return null;
        try {
            return fileURLToPath(uri);
        } catch {
            return null;
        }
    }

    /** The URI of an absolute path. */
    static uriOf(path: string): string {
        return pathToFileURL(path).toString();
    }

    /** The root and path a real path lies at in the app's scope, the deepest root first. */
    #placed(app: HeldApp, absolute: string): { root: Root; rootReal: string; path: string } | null {
        let best: { root: Root; rootReal: string } | null = null;
        for (const root of this.roots(app)) {
            const rootReal = real(root.dir);
            if (rootReal === null) continue;
            const inside = absolute === rootReal || absolute.startsWith(rootReal + sep);
            if (inside && (best === null || rootReal.length > best.rootReal.length)) {
                best = { root, rootReal };
            }
        }
        if (best === null) return null;
        return {
            ...best,
            path: relative(best.rootReal, absolute).split(sep).join('/')
        };
    }

    /**
     * The root and path of a URI in the app's scope, the file existing or not, or null for a URI
     * outside the scope or in a closed or private place.
     */
    place(app: HeldApp, uri: unknown): { root: string; path: string } | null {
        const found = this.resolve(app, uri);
        if (found.ok) return { root: found.file.root.key, path: found.file.path };
        if (found.word !== 'missing') return null;
        const absolute = ToolsScope.pathOf(uri);
        if (absolute === null) return null;
        const at = this.#nearest(absolute);
        const placed = at === null ? null : this.#placed(app, at);
        if (placed === null) return null;
        const above = this.resolve(app, ToolsScope.uriOf(dirname(absolute)), true);
        return above.ok ? { root: placed.root.key, path: placed.path } : null;
    }

    /** The file URI of a path of a root, or null when the root is not in the app's scope. */
    uriFor(app: HeldApp, root: string, path: string): string | null {
        const held = this.roots(app).find((one) => one.key === root);
        if (held === undefined) return null;
        const at = real(held.dir);
        return at === null ? null : ToolsScope.uriOf(join(at, ...path.split('/')));
    }

    /**
     * Whether a folder holds a place closed to every app: a private folder or file, oculus's own
     * config folder, or a folder `closed_paths` names under any root of the workspace, below it.
     * The folder itself was judged by `resolve`; this is the question of what an operation on the
     * whole folder would reach.
     */
    holdsClosed(folderReal: string): boolean {
        const context = this.#env.context();
        if (context.privateReal.some((closed) => below(closed, folderReal))) return true;
        const config = context.fs.realPath(context.configDir);
        if (config !== null && below(config, folderReal)) return true;
        const closed = context.closedPaths ?? [];
        return context.roots.some((root) => {
            const rootReal = context.fs.realPath(root.dir);
            if (rootReal === null) return false;
            return closed.some((name) => {
                const at = context.fs.realPath(join(rootReal, ...name.split('/')));
                return at !== null && below(at, folderReal);
            });
        });
    }

    /** Resolve a URI of an existing file or folder. */
    resolve(app: HeldApp, uri: unknown, folder = false): Resolved {
        const absolute = ToolsScope.pathOf(uri);
        if (absolute === null) return { ok: false, word: 'outside' };
        // A path is judged at its real place, so a link out of the scope is never followed.
        const at = real(absolute) ?? this.#nearest(absolute);
        const placed = at === null ? null : this.#placed(app, at);
        if (placed === null) return { ok: false, word: 'outside' };
        const found = locate(
            { app, root: placed.root.key, path: placed.path },
            this.#env.context(),
            folder
        );
        if (found.answer !== 'ok') return { ok: false, word: found.answer };
        return { ok: true, file: { ...placed, real: found.real } };
    }

    /** Resolve a URI for a write: a file that exists, or one the folder above it allows. */
    resolveForWrite(app: HeldApp, uri: unknown): Resolved {
        const here = this.resolve(app, uri);
        if (here.ok || here.word !== 'missing') return here;
        const absolute = ToolsScope.pathOf(uri);
        if (absolute === null) return { ok: false, word: 'outside' };
        const above = this.resolve(app, ToolsScope.uriOf(dirname(absolute)), true);
        if (!above.ok) return above;
        const path = join(above.file.path, basename(absolute)).split(sep).join('/');
        return {
            ok: true,
            file: { ...above.file, path, real: join(above.file.real, basename(absolute)) }
        };
    }

    /**
     * Resolve a URI for a folder to create with the folders above it: the deepest folder above it
     * that exists must lie in the scope and be open, and the folders still to make are named under
     * it.
     */
    resolveForCreate(app: HeldApp, uri: unknown): Resolved {
        const absolute = ToolsScope.pathOf(uri);
        if (absolute === null) return { ok: false, word: 'outside' };
        const rest: string[] = [];
        let probe = absolute;
        for (;;) {
            const found = this.resolve(app, ToolsScope.uriOf(probe), true);
            if (found.ok) {
                const path = [found.file.path, ...rest].filter((one) => one !== '').join('/');
                return {
                    ok: true,
                    file: { ...found.file, path, real: join(found.file.real, ...rest) }
                };
            }
            if (found.word !== 'missing') return found;
            const up = dirname(probe);
            if (up === probe) return { ok: false, word: 'outside' };
            rest.unshift(basename(probe));
            probe = up;
        }
    }

    /** The deepest folder above a path that exists, with the rest after it. */
    #nearest(absolute: string): string | null {
        const rest: string[] = [];
        let probe = absolute;
        for (;;) {
            const found = real(probe);
            if (found !== null) return join(found, ...rest);
            const up = dirname(probe);
            if (up === probe) return null;
            rest.unshift(basename(probe));
            probe = up;
        }
    }
}
