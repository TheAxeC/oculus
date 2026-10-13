// Layer 2, server. The workspace part of the host's object: the namespace `oculus.workspace` beyond
// the settings the shell part holds, as VS Code's `workspace` names it. The workspace folders of
// the app's scope with their change event, `getWorkspaceFolder` and `asRelativePath`,
// `workspace.fs` over the files of those folders, file system watchers, `findFiles`, `applyEdit`,
// `saveAll` and the content providers of the schemes an app serves, with the documents the app's
// language server was given (`textDocuments`, `openTextDocument` and the open, change, close and
// save events).
//
// Every file and folder call is a request to oculus (`oculus/workspace/fs`, `findFiles`,
// `applyEdit`, `watch`), which holds the rules of the scope: a `Uri` outside every folder of the
// app's scope is refused `outside`, and a private folder is never read or written. A refusal
// reaches the app as a `FileSystemError`. The folders are told at activation and again when they
// change (`oculus/workspace/foldersChanged`).

import { TextDocument } from '../values/document.mjs';
import { Disposable, EventEmitter } from '../values/events.mjs';
import { FileSystemError } from '../values/text.mjs';
import { Uri } from '../values/uri.mjs';

/** A glob relative to a folder, as VS Code's `RelativePattern` is. */
export class RelativePattern {
    constructor(base, pattern) {
        this.baseUri = typeof base === 'string' ? Uri.file(base) : (base.uri ?? base);
        this.base = this.baseUri.fsPath;
        this.pattern = pattern;
    }
}

/** The error a refusal word of oculus stands for. */
function fileError(error, uri) {
    const word = error instanceof Error ? error.message : String(error);
    const text = `${word}: ${uri?.toString() ?? ''}`;
    if (word === 'missing') return FileSystemError.FileNotFound(text);
    if (word === 'exists') return FileSystemError.FileExists(text);
    if (word === 'not_a_folder') return FileSystemError.FileNotADirectory(text);
    if (word === 'is_a_folder') return FileSystemError.FileIsADirectory(text);
    if (word === 'outside' || word === 'closed' || word === 'denied') {
        return FileSystemError.NoPermissions(text);
    }
    return FileSystemError.Unavailable(text);
}

/** The pattern of a glob argument as oculus is sent it. */
function globOf(pattern) {
    if (pattern === null || pattern === undefined) return null;
    if (typeof pattern === 'string') return { pattern };
    return { base: pattern.baseUri.toString(), pattern: pattern.pattern };
}

/**
 * The workspace part.
 * @param {{
 *   connection: import('vscode-jsonrpc').MessageConnection,
 *   report: (error: unknown) => void,
 *   rpc: { CancellationTokenSource: new () => any },
 *   sync: (uri: Uri) => Promise<{ languageId: string, text: string } | null>,
 * }} link
 */
export function createWorkspace(link) {
    const { connection, report } = link;
    let folders = [];
    const folderEvents = new EventEmitter(report);
    const documentEvents = {
        open: new EventEmitter(report),
        change: new EventEmitter(report),
        close: new EventEmitter(report),
        save: new EventEmitter(report)
    };
    const documents = new Map();
    const schemes = new Map();
    const contentChanges = new Map();
    const watchers = new Map();
    let watchCounter = 0;

    const send = (op, uri, extra = {}) =>
        connection
            .sendRequest('oculus/workspace/fs', { op, uri: uri.toString(), ...extra })
            .catch((error) => {
                throw fileError(error, uri);
            });

    const bytesOf = (value) => Buffer.from(value).toString('base64');

    const fs = {
        async readFile(uri) {
            const answer = await send('readFile', uri);
            return new Uint8Array(Buffer.from(answer.bytes, 'base64'));
        },
        async writeFile(uri, content) {
            await send('writeFile', uri, { bytes: bytesOf(content) });
        },
        async stat(uri) {
            const answer = await send('stat', uri);
            return {
                type: answer.type,
                ctime: answer.ctime,
                mtime: answer.mtime,
                size: answer.size
            };
        },
        readDirectory: (uri) => send('readDirectory', uri),
        async createDirectory(uri) {
            await send('createDirectory', uri);
        },
        async delete(uri, options = {}) {
            await send('delete', uri, {
                recursive: options.recursive === true,
                useTrash: options.useTrash === true
            });
        },
        async rename(source, target, options = {}) {
            await send('rename', source, {
                target: target.toString(),
                overwrite: options.overwrite === true
            });
        },
        async copy(source, target, options = {}) {
            await send('copy', source, {
                target: target.toString(),
                overwrite: options.overwrite === true
            });
        }
    };

    /** The folder holding a uri, or undefined. */
    const folderOf = (uri) => {
        const path = uri.scheme === 'file' ? uri.path : '';
        let found;
        for (const folder of folders) {
            const base = folder.uri.path.replace(/\/$/, '');
            if (path === base || path.startsWith(`${base}/`)) {
                if (found === undefined || base.length > found.uri.path.length) found = folder;
            }
        }
        return found;
    };

    /** A document by uri text, read through the language server's set or from disk. */
    const open = async (target) => {
        if (target !== null && typeof target === 'object' && !(target instanceof Uri)) {
            const document = new TextDocument(
                Uri.parse(`untitled:Untitled-${documents.size + 1}`),
                target.language ?? 'plaintext',
                1,
                target.content ?? ''
            );
            document.isUntitled = true;
            documents.set(document.uri.toString(), document);
            documentEvents.open.fire(document);
            return document;
        }
        const uri = target instanceof Uri ? target : Uri.file(String(target));
        const held = documents.get(uri.toString());
        if (held !== undefined) return held;
        const provider = schemes.get(uri.scheme);
        if (provider !== undefined) {
            const text = await provider.provideTextDocumentContent(uri, {
                isCancellationRequested: false,
                onCancellationRequested: () => new Disposable(() => undefined)
            });
            const made = new TextDocument(uri, 'plaintext', 1, text ?? '');
            documents.set(uri.toString(), made);
            documentEvents.open.fire(made);
            return made;
        }
        const read = await link.sync(uri);
        if (read === null) throw FileSystemError.FileNotFound(uri.toString());
        const made = new TextDocument(uri, read.languageId, 1, read.text);
        documents.set(uri.toString(), made);
        documentEvents.open.fire(made);
        return made;
    };

    const api = {
        get workspaceFolders() {
            return folders.length === 0 ? undefined : folders;
        },
        get name() {
            return folders[0]?.name;
        },
        get isTrusted() {
            return true;
        },
        onDidChangeWorkspaceFolders: folderEvents.event,
        getWorkspaceFolder: (uri) => folderOf(uri),
        asRelativePath(pathOrUri, includeWorkspaceFolder) {
            const uri = typeof pathOrUri === 'string' ? Uri.file(pathOrUri) : pathOrUri;
            const folder = folderOf(uri);
            if (folder === undefined) return uri.fsPath;
            const base = folder.uri.path.replace(/\/$/, '');
            const rest = uri.path.slice(base.length + 1);
            const named = includeWorkspaceFolder ?? folders.length > 1;
            return named ? `${folder.name}/${rest}` : rest;
        },
        fs,
        async findFiles(include, exclude, maxResults, token) {
            const source = new link.rpc.CancellationTokenSource();
            const hear = token?.onCancellationRequested?.(() => source.cancel());
            try {
                const list = await connection.sendRequest(
                    'oculus/workspace/findFiles',
                    {
                        include: globOf(include),
                        exclude: exclude === undefined ? undefined : globOf(exclude),
                        maxResults: maxResults ?? 0
                    },
                    source.token
                );
                return list.map((one) => Uri.parse(one));
            } finally {
                hear?.dispose();
                source.dispose();
            }
        },
        createFileSystemWatcher(
            glob,
            ignoreCreate = false,
            ignoreChange = false,
            ignoreDelete = false
        ) {
            watchCounter += 1;
            const id = `w${watchCounter}`;
            const events = {
                create: new EventEmitter(report),
                change: new EventEmitter(report),
                delete: new EventEmitter(report)
            };
            const entry = { ignoreCreate, ignoreChange, ignoreDelete, events };
            watchers.set(id, entry);
            connection
                .sendRequest('oculus/workspace/watch', { id, glob: globOf(glob) })
                .catch(report);
            return {
                ignoreCreateEvents: ignoreCreate,
                ignoreChangeEvents: ignoreChange,
                ignoreDeleteEvents: ignoreDelete,
                onDidCreate: events.create.event,
                onDidChange: events.change.event,
                onDidDelete: events.delete.event,
                dispose() {
                    if (!watchers.delete(id)) return;
                    connection.sendRequest('oculus/workspace/unwatch', { id }).catch(report);
                }
            };
        },
        async applyEdit(edit) {
            const changes = {};
            for (const [uri, edits] of edit.entries()) {
                changes[uri.toString()] = edits.map((one) => ({
                    range: {
                        start: { line: one.range.start.line, character: one.range.start.character },
                        end: { line: one.range.end.line, character: one.range.end.character }
                    },
                    newText: one.newText
                }));
            }
            const files = edit.fileOperations().map((one) => ({
                kind: one.kind,
                uri: one.uri.toString(),
                to: one.to?.toString(),
                overwrite: one.options?.overwrite === true,
                ignoreIfExists: one.options?.ignoreIfExists === true,
                recursive: one.options?.recursive === true
            }));
            try {
                const answer = await connection.sendRequest('oculus/workspace/applyEdit', {
                    changes,
                    files
                });
                return answer.applied === true;
            } catch (error) {
                report(error);
                return false;
            }
        },
        saveAll: (includeUntitled) =>
            connection
                .sendRequest('oculus/workspace/saveAll', {
                    includeUntitled: includeUntitled === true
                })
                .then((answer) => answer === true),
        registerTextDocumentContentProvider(scheme, provider) {
            if (schemes.has(scheme)) throw new Error('refused:registered');
            schemes.set(scheme, provider);
            const registered = connection.sendRequest('oculus/workspace/content/register', {
                scheme
            });
            registered.catch((error) => {
                if (schemes.get(scheme) === provider) schemes.delete(scheme);
                report(error);
            });
            const listening = provider.onDidChange?.((uri) => {
                const held = documents.get(uri.toString());
                if (held === undefined) return;
                Promise.resolve(provider.provideTextDocumentContent(uri, undefined))
                    .then((text) => {
                        held.replace(held.version + 1, text ?? '');
                        documentEvents.change.fire({
                            document: held,
                            contentChanges: [],
                            reason: undefined
                        });
                    })
                    .catch(report);
            });
            void contentChanges;
            return new Disposable(() => {
                listening?.dispose?.();
                if (schemes.get(scheme) !== provider) return;
                schemes.delete(scheme);
                connection
                    .sendRequest('oculus/workspace/content/unregister', { scheme })
                    .catch(report);
            });
        },
        get textDocuments() {
            return [...documents.values()].filter((one) => !one.isClosed);
        },
        openTextDocument: open,
        onDidOpenTextDocument: documentEvents.open.event,
        onDidChangeTextDocument: documentEvents.change.event,
        onDidCloseTextDocument: documentEvents.close.event,
        onDidSaveTextDocument: documentEvents.save.event
    };

    connection.onNotification('oculus/workspace/foldersChanged', (params) => {
        const before = folders;
        folders = (params.folders ?? []).map((one, index) => ({
            uri: Uri.parse(one.uri),
            name: one.name,
            index
        }));
        const keep = new Set(folders.map((one) => one.uri.toString()));
        const was = new Set(before.map((one) => one.uri.toString()));
        folderEvents.fire({
            added: folders.filter((one) => !was.has(one.uri.toString())),
            removed: before.filter((one) => !keep.has(one.uri.toString()))
        });
    });

    connection.onNotification('oculus/workspace/watched', (params) => {
        const entry = watchers.get(params.id);
        if (entry === undefined) return;
        for (const event of params.events ?? []) {
            const uri = Uri.parse(event.uri);
            if (event.type === 1 && !entry.ignoreCreate) entry.events.create.fire(uri);
            else if (event.type === 2 && !entry.ignoreChange) entry.events.change.fire(uri);
            else if (event.type === 3 && !entry.ignoreDelete) entry.events.delete.fire(uri);
        }
    });

    connection.onRequest('oculus/workspace/content/provide', async (params) => {
        const provider = schemes.get(String(params.uri).split(':')[0]);
        if (provider === undefined) throw new Error('missing');
        return (await provider.provideTextDocumentContent(Uri.parse(params.uri), undefined)) ?? '';
    });

    return {
        api,
        documents,
        documentEvents,
        /** Hold the folders told at activation. */
        start(held) {
            folders = (held ?? []).map((one, index) => ({
                uri: Uri.parse(one.uri),
                name: one.name,
                index
            }));
        }
    };
}
