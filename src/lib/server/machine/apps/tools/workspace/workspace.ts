// Layer 2, server. What oculus answers to the workspace requests a host makes: the files and
// folders of the app's scope (`oculus/workspace/fs`), the files a glob finds (`findFiles`), the
// edit a `WorkspaceEdit` asks for (`applyEdit`), the file system watchers (`watch`, `unwatch` and
// the `watched` notice back), the schemes the host serves text for (`content/register`) and the
// documents (`readDocument`, which gives a file's text and the language of its name).
//
// Every URI is judged by the scope (scope.ts) before anything is read or written: one outside the
// folders of the app's scope answers `outside`, a closed or private one `closed`, and a missing one
// `missing`. Every write is an operation of the Files view's writer (writes.ts), so it
// runs in the write chain, is recorded in the change log, keeps the file it replaces in the local
// history and is followed by a tab that holds the file; the text edits of `applyEdit` are written
// by the chain a language server's edit uses (files/fs/lsp-edit.ts). A glob is read as
// every glob of oculus is (data/helpers/search/glob.ts).

import { type Stats, existsSync, lstatSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { z } from 'zod';
import { languageOf } from '../../../../../data/helpers/files/languages.ts';
import { globTest } from '../../../../../data/helpers/search/glob.ts';
import { isWholeText } from '../../../../../data/helpers/files/text-kind.ts';
import { hashOf } from '../../../../core/files/file-bytes.ts';
import { skipped } from '../../../../files/fs.ts';
import { RootWatch, type FileChange } from '../../../lsp/held/watch.ts';
import { Refused, parsed, type HostHandler } from '../../host/connection.ts';
import type { HostTools } from '../registry.ts';
import { ToolsScope, type ScopeFile } from '../scope.ts';
import { WorkspaceWrites } from './writes.ts';

/** VS Code's `FileType`. */
const FILE = 1;
const FOLDER = 2;
const LINK = 64;

const fsShape = z.object({
    op: z.enum([
        'readFile',
        'readDocument',
        'writeFile',
        'stat',
        'readDirectory',
        'createDirectory',
        'delete',
        'rename',
        'copy'
    ]),
    uri: z.string(),
    target: z.string().optional(),
    bytes: z.string().optional(),
    recursive: z.boolean().default(false),
    useTrash: z.boolean().default(false),
    overwrite: z.boolean().default(false)
});

const globShape = z.object({ base: z.string().optional(), pattern: z.string() });

/** A glob as the host sends it: a pattern and the folder it is relative to. */
type Glob = z.infer<typeof globShape>;

const findShape = z.object({
    include: globShape.nullable(),
    exclude: globShape.nullable().optional(),
    maxResults: z.number().int().min(0).default(0)
});

const editShape = z.object({
    changes: z.record(
        z.string(),
        z.array(
            z.object({
                range: z.object({
                    start: z.object({ line: z.number(), character: z.number() }),
                    end: z.object({ line: z.number(), character: z.number() })
                }),
                newText: z.string()
            })
        )
    ),
    files: z
        .array(
            z.object({
                kind: z.enum(['create', 'delete', 'rename']),
                uri: z.string(),
                to: z.string().optional(),
                overwrite: z.boolean().default(false),
                ignoreIfExists: z.boolean().default(false),
                recursive: z.boolean().default(false)
            })
        )
        .default([])
});

/** The most entries a `findFiles` walk visits. */
const WALK_LIMIT = 200_000;

/** The type of a path as VS Code's `FileType`, 64 added for a link. */
function typeOf(path: string): number {
    let own;
    try {
        own = lstatSync(path);
    } catch {
        return 0;
    }
    const kind = (info: Stats): number => (info.isFile() ? FILE : info.isDirectory() ? FOLDER : 0);
    if (!own.isSymbolicLink()) return kind(own);
    try {
        return LINK + kind(statSync(path));
    } catch {
        return LINK;
    }
}

/** A test of an absolute path against a glob, read relative to its base or else the root. */
function globIn(glob: Glob, root: string): (whole: string) => boolean {
    const prefix = glob.base === undefined ? root : (ToolsScope.pathOf(glob.base) ?? root);
    const test = globTest(glob.pattern);
    return (whole) => whole.startsWith(`${prefix}/`) && test(whole.slice(prefix.length + 1));
}

/** What a watcher registered: where, and the test of a path under a root. */
type Watching = { root: string; match: (relative: string) => boolean };

/** The handlers and notices of the workspace requests of one host. */
export function workspaceHandlers(host: HostTools): {
    handlers: Record<string, HostHandler>;
    stop: () => void;
} {
    const { scope } = host;
    const watchers = new Map<string, Watching[]>();
    const rootWatches = new Map<string, RootWatch>();
    const base = new Set<string>();

    const file = (uri: unknown, write = false, folder = false): ScopeFile => {
        const app = host.app();
        const found = write ? scope.resolveForWrite(app, uri) : scope.resolve(app, uri, folder);
        if (!found.ok) throw new Refused(found.word);
        return found.file;
    };

    const writes = new WorkspaceWrites({
        scope,
        ops: (operation) => scope.env.ops(operation, host.app().id)
    });

    const read = (target: ScopeFile): Buffer => {
        let info;
        try {
            info = statSync(target.real);
        } catch {
            throw new Refused('missing');
        }
        if (info.isDirectory()) throw new Refused('is_a_folder');
        if (!info.isFile()) throw new Refused('closed');
        if (info.size > scope.env.maxBytes()) throw new Refused('too_large');
        try {
            return readFileSync(target.real);
        } catch {
            throw new Refused('denied');
        }
    };

    const ops: Record<string, (params: z.infer<typeof fsShape>) => unknown> = {
        readFile: (params) => ({ bytes: read(file(params.uri)).toString('base64') }),
        readDocument: (params) => {
            const target = file(params.uri);
            const bytes = read(target);
            if (!isWholeText(bytes)) throw new Refused('binary');
            return {
                text: bytes.toString('utf8'),
                languageId: languageOf(target.path, scope.env.languages())
            };
        },
        stat: (params) => {
            const target = file(params.uri, false, true);
            const info = statSync(target.real);
            const type = typeOf(target.real);
            return {
                type: type === 0 ? (info.isFile() ? FILE : FOLDER) : type,
                ctime: info.ctimeMs,
                mtime: info.mtimeMs,
                size: info.size
            };
        },
        readDirectory: (params) => {
            const target = file(params.uri, false, true);
            if (!statSync(target.real).isDirectory()) throw new Refused('not_a_folder');
            const names: [string, number][] = [];
            for (const entry of readdirSync(target.real, { withFileTypes: true })) {
                if (names.length >= scope.env.scanEntries()) break;
                if (entry.name.startsWith('.')) continue;
                const child = scope.resolve(
                    host.app(),
                    ToolsScope.uriOf(`${target.real}/${entry.name}`),
                    true
                );
                if (child.ok) names.push([entry.name, typeOf(child.file.real)]);
            }
            return names;
        },
        writeFile: async (params) => {
            const target = file(params.uri, true);
            const bytes = Buffer.from(params.bytes ?? '', 'base64');
            if (bytes.length > scope.env.maxBytes()) throw new Refused('too_large');
            if (existsSync(target.real) && hashOf(read(target)) === hashOf(bytes)) return null;
            await writes.writeFile(target, bytes);
            return null;
        },
        createDirectory: async (params) => {
            const found = scope.resolveForCreate(host.app(), params.uri);
            if (!found.ok) throw new Refused(found.word);
            await writes.createDirectory(found.file);
            return null;
        },
        delete: async (params) => {
            await writes.remove(file(params.uri), {
                recursive: params.recursive,
                useTrash: params.useTrash
            });
            return null;
        },
        rename: async (params) => {
            await writes.rename(file(params.uri), file(params.target, true), params.overwrite);
            return null;
        },
        copy: async (params) => {
            await writes.copy(file(params.uri), file(params.target, true), params.overwrite);
            return null;
        }
    };

    /** The files under the roots of the scope that match a glob. */
    const find = (params: z.infer<typeof findShape>): string[] => {
        const app = host.app();
        if (params.include === null) return [];
        const limit = params.maxResults === 0 ? Infinity : params.maxResults;
        const out: string[] = [];
        let visited = 0;
        const walk = (
            root: string,
            folder: string,
            relative: string,
            included: (whole: string) => boolean,
            excluded: (whole: string, name: string) => boolean
        ): void => {
            if (out.length >= limit || visited > WALK_LIMIT) return;
            let entries;
            try {
                entries = readdirSync(folder, { withFileTypes: true });
            } catch {
                return;
            }
            for (const entry of entries) {
                visited += 1;
                if (out.length >= limit || visited > WALK_LIMIT) return;
                if (entry.name.startsWith('.')) continue;
                const here = relative === '' ? entry.name : `${relative}/${entry.name}`;
                const whole = `${folder}/${entry.name}`;
                if (excluded(whole, entry.name)) continue;
                if (entry.isDirectory()) {
                    walk(root, whole, here, included, excluded);
                } else if (entry.isFile() && included(whole)) {
                    const found = scope.resolve(app, ToolsScope.uriOf(whole));
                    if (found.ok) out.push(ToolsScope.uriOf(found.file.real));
                }
            }
        };
        for (const folder of scope.folders(app)) {
            const included = globIn(params.include, folder.real);
            // `exclude` as VS Code reads it: undefined leaves out what the Files view hides, null
            // leaves out nothing, and a glob leaves out what it matches, folders included.
            const skip = params.exclude;
            const excluded =
                skip === undefined
                    ? (_whole: string, name: string) => skipped(name)
                    : skip === null
                      ? () => false
                      : globIn(skip, folder.real);
            walk(folder.real, folder.real, '', included, excluded);
        }
        return out;
    };

    /** The watch of a root, made with the first watcher registered under it. */
    const watchOf = (real: string): RootWatch => {
        let watch = rootWatches.get(real);
        if (watch === undefined) {
            watch = new RootWatch({
                root: real,
                open: () => false,
                changed: (changes) => tell(real, changes),
                ...(scope.env.watchFolder === undefined
                    ? {}
                    : { watchFolder: scope.env.watchFolder })
            });
            rootWatches.set(real, watch);
        }
        return watch;
    };

    /** The changes of a root, told to every watcher whose glob matches each. */
    const tell = (real: string, changes: FileChange[]): void => {
        for (const [id, list] of watchers) {
            const events = changes.filter((change) => {
                const path = ToolsScope.pathOf(change.uri);
                if (!path?.startsWith(`${real}/`)) return false;
                const relative = path.slice(real.length + 1);
                return list.some((one) => one.root === real && one.match(relative));
            });
            if (events.length > 0) host.notify('oculus/workspace/watched', { id, events });
        }
    };

    const handlers: Record<string, HostHandler> = {
        'oculus/workspace/fs': (params) => {
            host.app();
            const body = parsed(fsShape, params);
            return ops[body.op](body);
        },
        'oculus/workspace/findFiles': (params) => find(parsed(findShape, params)),
        'oculus/workspace/applyEdit': async (params) => {
            const app = host.app();
            const body = parsed(editShape, params);
            const files = [];
            for (const [uri, edits] of Object.entries(body.changes)) {
                const target = scope.resolve(app, uri);
                if (!target.ok) return { applied: false, failureReason: target.word };
                const bytes = read(target.file);
                files.push({
                    root: target.file.root.key,
                    path: target.file.path,
                    hash: hashOf(bytes),
                    edits
                });
            }
            // Every file operation is judged before any text is written, so a refused one leaves
            // the files as they were.
            for (const operation of body.files) {
                const first =
                    operation.kind === 'create'
                        ? scope.resolveForWrite(app, operation.uri)
                        : scope.resolve(app, operation.uri);
                if (!first.ok) return { applied: false, failureReason: first.word };
                if (operation.kind !== 'rename') continue;
                const to = scope.resolveForWrite(app, operation.to);
                if (!to.ok) return { applied: false, failureReason: to.word };
            }
            const done =
                files.length === 0
                    ? { ok: true as const }
                    : await scope.env.ops({ op: 'lsp-edit', files }, app.id);
            if (!done.ok) return { applied: false, failureReason: done.error };
            for (const operation of body.files) {
                if (operation.kind === 'create') {
                    const target = file(operation.uri, true);
                    if (existsSync(target.real)) {
                        if (operation.ignoreIfExists) continue;
                        if (!operation.overwrite)
                            return { applied: false, failureReason: 'exists' };
                    }
                    await writes.createFile(target, operation.overwrite);
                } else if (operation.kind === 'delete') {
                    await writes.remove(file(operation.uri), {
                        recursive: operation.recursive,
                        useTrash: false
                    });
                } else {
                    await writes.rename(
                        file(operation.uri),
                        file(operation.to, true),
                        operation.overwrite
                    );
                }
            }
            return { applied: true };
        },
        'oculus/workspace/watch': (params) => {
            const app = host.app();
            const { id, glob } = parsed(
                z.object({ id: z.string().min(1), glob: globShape.nullable() }),
                params
            );
            if (glob === null || watchers.has(id)) throw new Refused('refused:params');
            const entries: Watching[] = [];
            for (const folder of scope.folders(app)) {
                const prefix =
                    glob.base === undefined ? null : (ToolsScope.pathOf(glob.base) ?? null);
                if (
                    prefix !== null &&
                    prefix !== folder.real &&
                    !prefix.startsWith(`${folder.real}/`)
                ) {
                    continue;
                }
                const under =
                    prefix === null || prefix === folder.real
                        ? ''
                        : `${prefix.slice(folder.real.length + 1)}/`;
                const test = globTest(glob.pattern);
                const match = (relative: string): boolean =>
                    (under === '' || relative.startsWith(under)) &&
                    test(relative.slice(under.length));
                entries.push({ root: folder.real, match });
                watchOf(folder.real).registerMatch(id, (relative) =>
                    entries.some((one) => one.root === folder.real && one.match(relative))
                );
            }
            watchers.set(id, entries);
            return null;
        },
        'oculus/workspace/unwatch': (params) => {
            const { id } = parsed(z.object({ id: z.string().min(1) }), params);
            const list = watchers.get(id);
            watchers.delete(id);
            for (const one of list ?? []) rootWatches.get(one.root)?.unregister(id);
            return null;
        },
        'oculus/workspace/content/register': (params) => {
            const { scheme } = parsed(
                z.object({ scheme: z.string().regex(/^[a-z][a-z0-9+.-]*$/) }),
                params
            );
            if (scheme === 'file' || base.has(scheme)) throw new Refused('refused:registered');
            base.add(scheme);
            host.schemes(scheme, true);
            return null;
        },
        'oculus/workspace/content/unregister': (params) => {
            const { scheme } = parsed(z.object({ scheme: z.string() }), params);
            base.delete(scheme);
            host.schemes(scheme, false);
            return null;
        },
        'oculus/workspace/saveAll': async () => {
            host.app();
            return host.saveAll();
        }
    };
    return {
        handlers,
        stop: () => {
            for (const watch of rootWatches.values()) watch.close();
            rootWatches.clear();
            watchers.clear();
        }
    };
}
