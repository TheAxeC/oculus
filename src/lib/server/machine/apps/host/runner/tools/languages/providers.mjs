// Layer 2, server. The language features an app registers with
// `oculus.languages.register*Provider`, served as one language server inside the host. Every
// registration carries a document selector; oculus is told the union of the selectors and the
// capabilities the providers answer (`oculus/languages/providers`), starts the server for a folder
// with the first document of a selected language under it, and speaks the protocol with it over a
// `languageServer` stream, so the editor's features are the ones it draws for any server.
//
// A request is answered by the providers whose selector matches the document, in the order they
// registered: lists are concatenated, hovers are joined, and any other answer is the first one that
// is not empty. A provider that throws answers its error to that request alone; the others and the
// server go on. The documents the server was given are the host's `workspace.textDocuments`.

import picomatch from 'picomatch';
import { CancellationTokenSource, Disposable, EventEmitter } from '../../values/events.mjs';
import { TextDocument } from '../../values/document.mjs';
import { toPosition, toRange } from '../../values/position-range.mjs';
import { Uri } from '../../values/uri.mjs';
import * as convert from './convert.mjs';

/** The error code of a provider that threw. */
const INTERNAL_ERROR = -32603;

/** The request cancelled code of the protocol. */
const REQUEST_CANCELLED = -32800;

/**
 * A test of a path for a glob, read as every glob of oculus is (data/helpers/search/glob.ts): dot
 * files match, and a glob without a slash is tested on the file's name.
 */
function globTest(glob) {
    try {
        return picomatch(glob, { dot: true, basename: !glob.includes('/') });
    } catch {
        return (path) => path === glob;
    }
}

/** A selector (a language, a filter or a list of them) as filters, each glob compiled once. */
export function filtersOf(selector) {
    const list = Array.isArray(selector) ? selector : [selector];
    return list.map((one) => {
        const filter =
            typeof one === 'string'
                ? { language: one, scheme: '', pattern: '' }
                : {
                      language: one.language ?? '',
                      scheme: one.scheme ?? '',
                      pattern:
                          typeof one.pattern === 'string'
                              ? one.pattern
                              : (one.pattern?.pattern ?? '')
                  };
        return { ...filter, matches: filter.pattern === '' ? null : globTest(filter.pattern) };
    });
}

/** Whether a document is selected by the filters. */
export function selects(filters, document) {
    return filters.some(
        (one) =>
            (one.language === '' || one.language === '*' || one.language === document.languageId) &&
            (one.scheme === '' || one.scheme === document.uri.scheme) &&
            (one.matches === null || one.matches(document.uri.path))
    );
}

/** One request of the protocol: the provider kind, its call and what it answers. */
const METHODS = {
    'textDocument/completion': {
        kind: 'completion',
        call: (provider, document, params, token) =>
            provider.provideCompletionItems(document, toPosition(params.position), token, {
                triggerKind: params.context?.triggerKind ?? 1,
                triggerCharacter: params.context?.triggerCharacter
            }),
        join: 'list',
        out: convert.fromCompletions
    },
    'textDocument/hover': {
        kind: 'hover',
        call: (provider, document, params, token) =>
            provider.provideHover(document, toPosition(params.position), token),
        join: 'hover',
        out: convert.fromHover
    },
    'textDocument/definition': locations('definition', 'provideDefinition'),
    'textDocument/declaration': locations('declaration', 'provideDeclaration'),
    'textDocument/typeDefinition': locations('typeDefinition', 'provideTypeDefinition'),
    'textDocument/implementation': locations('implementation', 'provideImplementation'),
    'textDocument/references': {
        kind: 'references',
        call: (provider, document, params, token) =>
            provider.provideReferences(
                document,
                toPosition(params.position),
                { includeDeclaration: params.context?.includeDeclaration === true },
                token
            ),
        join: 'list',
        out: (value) =>
            value === undefined || value === null
                ? null
                : value.map((one) => convert.fromLocations(one))
    },
    'textDocument/documentSymbol': {
        kind: 'documentSymbol',
        call: (provider, document, params, token) =>
            provider.provideDocumentSymbols(document, token),
        join: 'list',
        out: (value) =>
            value === undefined || value === null ? null : value.map(convert.fromSymbol)
    },
    'textDocument/documentHighlight': {
        kind: 'documentHighlight',
        call: (provider, document, params, token) =>
            provider.provideDocumentHighlights(document, toPosition(params.position), token),
        join: 'list',
        out: (value) =>
            value === undefined || value === null ? null : value.map(convert.fromHighlight)
    },
    'textDocument/codeAction': {
        kind: 'codeActions',
        call: (provider, document, params, token) =>
            provider.provideCodeActions(
                document,
                toRange(params.range),
                {
                    diagnostics: (params.context?.diagnostics ?? []).map(convert.toDiagnostic),
                    only:
                        params.context?.only?.[0] === undefined
                            ? undefined
                            : { value: params.context.only[0] },
                    triggerKind: params.context?.triggerKind ?? 1
                },
                token
            ),
        join: 'list',
        out: (value) =>
            value === undefined || value === null ? null : value.map(convert.fromCodeAction)
    },
    'textDocument/codeLens': {
        kind: 'codeLens',
        call: (provider, document, params, token) => provider.provideCodeLenses(document, token),
        join: 'list',
        out: (value) =>
            value === undefined || value === null ? null : value.map(convert.fromCodeLens)
    },
    'textDocument/documentLink': {
        kind: 'documentLink',
        call: (provider, document, params, token) => provider.provideDocumentLinks(document, token),
        join: 'list',
        out: (value) => (value === undefined || value === null ? null : value.map(convert.fromLink))
    },
    'textDocument/formatting': {
        kind: 'formatting',
        call: (provider, document, params, token) =>
            provider.provideDocumentFormattingEdits(document, formatOptions(params), token),
        join: 'first',
        out: editsOut
    },
    'textDocument/rangeFormatting': {
        kind: 'rangeFormatting',
        call: (provider, document, params, token) =>
            provider.provideDocumentRangeFormattingEdits(
                document,
                toRange(params.range),
                formatOptions(params),
                token
            ),
        join: 'first',
        out: editsOut
    },
    'textDocument/onTypeFormatting': {
        kind: 'onTypeFormatting',
        call: (provider, document, params, token) =>
            provider.provideOnTypeFormattingEdits(
                document,
                toPosition(params.position),
                params.ch,
                formatOptions(params),
                token
            ),
        join: 'first',
        out: editsOut
    },
    'textDocument/prepareRename': {
        kind: 'rename',
        call: async (provider, document, params, token) => {
            if (typeof provider.prepareRename !== 'function') return undefined;
            return provider.prepareRename(document, toPosition(params.position), token);
        },
        join: 'first',
        out: (value) => {
            if (value === undefined || value === null) return null;
            if (value.range !== undefined) {
                return { range: convert.fromRange(value.range), placeholder: value.placeholder };
            }
            return convert.fromRange(value);
        }
    },
    'textDocument/rename': {
        kind: 'rename',
        call: (provider, document, params, token) =>
            provider.provideRenameEdits(
                document,
                toPosition(params.position),
                params.newName,
                token
            ),
        join: 'first',
        out: convert.fromWorkspaceEdit
    },
    'textDocument/signatureHelp': {
        kind: 'signatureHelp',
        call: (provider, document, params, token) =>
            provider.provideSignatureHelp(document, toPosition(params.position), token, {
                triggerKind: params.context?.triggerKind ?? 1,
                triggerCharacter: params.context?.triggerCharacter,
                isRetrigger: params.context?.isRetrigger === true,
                activeSignatureHelp: undefined
            }),
        join: 'first',
        out: convert.fromSignatureHelp
    },
    'textDocument/foldingRange': {
        kind: 'foldingRange',
        call: (provider, document, params, token) =>
            provider.provideFoldingRanges(document, {}, token),
        join: 'list',
        out: (value) =>
            value === undefined || value === null ? null : value.map(convert.fromFolding)
    },
    'textDocument/selectionRange': {
        kind: 'selectionRange',
        call: (provider, document, params, token) =>
            provider.provideSelectionRanges(document, params.positions.map(toPosition), token),
        join: 'first',
        out: (value) =>
            value === undefined || value === null ? null : value.map(convert.fromSelection)
    },
    'textDocument/inlayHint': {
        kind: 'inlayHints',
        call: (provider, document, params, token) =>
            provider.provideInlayHints(document, toRange(params.range), token),
        join: 'list',
        out: (value) =>
            value === undefined || value === null ? null : value.map(convert.fromInlayHint)
    },
    'textDocument/semanticTokens/full': {
        kind: 'semanticTokens',
        call: (provider, document, params, token) =>
            provider.provideDocumentSemanticTokens(document, token),
        join: 'first',
        out: convert.fromTokens
    },
    'textDocument/prepareCallHierarchy': {
        kind: 'callHierarchy',
        call: (provider, document, params, token) =>
            provider.prepareCallHierarchy(document, toPosition(params.position), token),
        join: 'list',
        out: hierarchyOut
    },
    'textDocument/prepareTypeHierarchy': {
        kind: 'typeHierarchy',
        call: (provider, document, params, token) =>
            provider.prepareTypeHierarchy(document, toPosition(params.position), token),
        join: 'list',
        out: hierarchyOut
    }
};

/** A definition-like request. */
function locations(kind, name) {
    return {
        kind,
        call: (provider, document, params, token) =>
            provider[name](document, toPosition(params.position), token),
        join: 'list',
        out: convert.fromLocations
    };
}

function formatOptions(params) {
    return {
        tabSize: params.options?.tabSize ?? 4,
        insertSpaces: params.options?.insertSpaces !== false
    };
}

function editsOut(value) {
    return value === undefined || value === null ? null : value.map(convert.fromTextEdit);
}

function hierarchyOut(value) {
    if (value === undefined || value === null) return null;
    return (Array.isArray(value) ? value : [value]).map(convert.fromHierarchyItem);
}

/** The requests that follow an item the provider answered, by method. */
const FOLLOWS = {
    'completionItem/resolve': {
        kind: 'completion',
        method: 'resolveCompletionItem',
        arg: (params) => convert.toCompletionItem(params),
        out: convert.fromCompletionItem
    },
    'codeAction/resolve': {
        kind: 'codeActions',
        method: 'resolveCodeAction',
        arg: (params) => params,
        out: convert.fromCodeAction
    },
    'codeLens/resolve': {
        kind: 'codeLens',
        method: 'resolveCodeLens',
        arg: (params) => ({ ...params, range: toRange(params.range) }),
        out: convert.fromCodeLens
    },
    'documentLink/resolve': {
        kind: 'documentLink',
        method: 'resolveDocumentLink',
        arg: (params) => ({ ...params, range: toRange(params.range) }),
        out: convert.fromLink
    },
    'inlayHint/resolve': {
        kind: 'inlayHints',
        method: 'resolveInlayHint',
        arg: (params) => ({ ...params, position: toPosition(params.position) }),
        out: convert.fromInlayHint
    },
    'callHierarchy/incomingCalls': {
        kind: 'callHierarchy',
        method: 'provideCallHierarchyIncomingCalls',
        arg: (params) => convert_item(params.item),
        out: (value) =>
            value === undefined || value === null
                ? null
                : value.map((one) => ({
                      from: convert.fromHierarchyItem(one.from),
                      fromRanges: one.fromRanges.map(convert.fromRange)
                  }))
    },
    'callHierarchy/outgoingCalls': {
        kind: 'callHierarchy',
        method: 'provideCallHierarchyOutgoingCalls',
        arg: (params) => convert_item(params.item),
        out: (value) =>
            value === undefined || value === null
                ? null
                : value.map((one) => ({
                      to: convert.fromHierarchyItem(one.to),
                      fromRanges: one.fromRanges.map(convert.fromRange)
                  }))
    },
    'typeHierarchy/supertypes': {
        kind: 'typeHierarchy',
        method: 'provideTypeHierarchySupertypes',
        arg: (params) => convert_item(params.item),
        out: hierarchyOut
    },
    'typeHierarchy/subtypes': {
        kind: 'typeHierarchy',
        method: 'provideTypeHierarchySubtypes',
        arg: (params) => convert_item(params.item),
        out: hierarchyOut
    }
};

function convert_item(item) {
    return convert.toHierarchyItem(item);
}

/** The first answer that holds something. */
const present = (value) =>
    value !== undefined && value !== null && !(Array.isArray(value) && value.length === 0);

/**
 * The providers of an app.
 * @param {{
 *   connection: any, report: (e: unknown) => void, note: (line: string) => void,
 *   documents: Map<string, TextDocument>, events: any, sync: (uri: Uri) => Promise<any>,
 * }} link
 */
export function createProviders(link) {
    const { connection, report } = link;
    const registrations = [];
    const collections = new Map();
    let sent = '';
    const instances = new Set();

    /** The capabilities the registered providers answer, and the selectors they cover. */
    function capabilities() {
        const has = (kind) => registrations.filter((one) => one.kind === kind);
        const caps = {};
        const flag = (kind, key = `${kind}Provider`) => {
            if (has(kind).length > 0) caps[key] = true;
        };
        const completion = has('completion');
        if (completion.length > 0) {
            caps.completionProvider = {
                triggerCharacters: [
                    ...new Set(completion.flatMap((one) => one.extra.triggers ?? []))
                ],
                resolveProvider: completion.some(
                    (one) => typeof one.provider.resolveCompletionItem === 'function'
                )
            };
        }
        flag('hover');
        flag('definition');
        flag('declaration');
        flag('typeDefinition');
        flag('implementation');
        flag('references');
        flag('documentSymbol');
        flag('documentHighlight');
        const actions = has('codeActions');
        if (actions.length > 0) {
            caps.codeActionProvider = {
                codeActionKinds: [...new Set(actions.flatMap((one) => one.extra.kinds ?? []))],
                resolveProvider: actions.some(
                    (one) => typeof one.provider.resolveCodeAction === 'function'
                )
            };
        }
        const lenses = has('codeLens');
        if (lenses.length > 0) {
            caps.codeLensProvider = {
                resolveProvider: lenses.some(
                    (one) => typeof one.provider.resolveCodeLens === 'function'
                )
            };
        }
        const links = has('documentLink');
        if (links.length > 0) {
            caps.documentLinkProvider = {
                resolveProvider: links.some(
                    (one) => typeof one.provider.resolveDocumentLink === 'function'
                )
            };
        }
        flag('formatting', 'documentFormattingProvider');
        flag('rangeFormatting', 'documentRangeFormattingProvider');
        const typing = has('onTypeFormatting');
        if (typing.length > 0) {
            caps.documentOnTypeFormattingProvider = {
                firstTriggerCharacter: typing[0].extra.first,
                moreTriggerCharacter: typing.flatMap((one) => one.extra.more ?? [])
            };
        }
        const renames = has('rename');
        if (renames.length > 0) {
            caps.renameProvider = {
                prepareProvider: renames.some(
                    (one) => typeof one.provider.prepareRename === 'function'
                )
            };
        }
        const signatures = has('signatureHelp');
        if (signatures.length > 0) {
            caps.signatureHelpProvider = {
                triggerCharacters: [
                    ...new Set(signatures.flatMap((one) => one.extra.triggers ?? []))
                ],
                retriggerCharacters: [
                    ...new Set(signatures.flatMap((one) => one.extra.retriggers ?? []))
                ]
            };
        }
        flag('foldingRange');
        flag('selectionRange');
        const hints = has('inlayHints');
        if (hints.length > 0) {
            caps.inlayHintProvider = {
                resolveProvider: hints.some(
                    (one) => typeof one.provider.resolveInlayHint === 'function'
                )
            };
        }
        const tokens = has('semanticTokens');
        if (tokens.length > 0) {
            caps.semanticTokensProvider = { legend: tokens[0].extra.legend, full: true };
        }
        flag('callHierarchy');
        flag('typeHierarchy');
        const workspaceSymbols = has('workspaceSymbol');
        if (workspaceSymbols.length > 0) caps.workspaceSymbolProvider = true;
        return caps;
    }

    /** Tell oculus what the providers cover, when it changed. */
    function publish() {
        const caps = capabilities();
        const selector = registrations.flatMap((one) => one.filters);
        const text = JSON.stringify({ caps, selector });
        if (text === sent) return;
        sent = text;
        connection
            .sendRequest('oculus/languages/providers', {
                selector: selector.map((one) => ({ language: one.language, pattern: one.pattern })),
                capabilities: registrations.length === 0 ? {} : caps
            })
            .catch(report);
    }

    /** Register a provider of a kind. */
    function add(kind, selector, provider, extra = {}) {
        const registration = { kind, filters: filtersOf(selector), provider, extra };
        registrations.push(registration);
        publish();
        return new Disposable(() => {
            const at = registrations.indexOf(registration);
            if (at < 0) return;
            registrations.splice(at, 1);
            publish();
        });
    }

    /** The providers of a kind that select a document. */
    const providersFor = (kind, document) =>
        registrations.filter((one) => one.kind === kind && selects(one.filters, document));

    /** Answer a request over the providers that select its document. */
    async function answer(spec, document, params, token) {
        const chosen = providersFor(spec.kind, document);
        if (chosen.length === 0) return null;
        const answers = [];
        let failure;
        for (const one of chosen) {
            try {
                const value = await spec.call(one.provider, document, params, token);
                if (present(value)) {
                    answers.push(value);
                    if (spec.join === 'first') break;
                }
            } catch (error) {
                failure = error;
            }
        }
        if (answers.length === 0 && failure !== undefined) throw failure;
        if (answers.length === 0) return spec.out(undefined);
        if (spec.join === 'list') {
            const flat = answers.flatMap((value) => {
                if (Array.isArray(value)) return value;
                if (value !== null && typeof value === 'object' && Array.isArray(value.items)) {
                    return value.items;
                }
                return [value];
            });
            const list = answers.find(
                (value) => !Array.isArray(value) && Array.isArray(value?.items)
            );
            return spec.out(
                list === undefined ? flat : { items: flat, isIncomplete: list.isIncomplete }
            );
        }
        if (spec.join === 'hover') {
            const contents = answers.flatMap((value) =>
                Array.isArray(value.contents) ? value.contents : [value.contents]
            );
            return spec.out({ contents, range: answers[0].range });
        }
        return spec.out(answers[0]);
    }

    /** The document a request names, read from disk when the server was not given it. */
    async function documentOf(uri) {
        const held = link.documents.get(uri);
        if (held !== undefined) return held;
        const read = await link.sync(Uri.parse(uri));
        if (read === null) return undefined;
        const made = new TextDocument(Uri.parse(uri), read.languageId, 0, read.text);
        link.documents.set(uri, made);
        return made;
    }

    /** One instance of the in-host server, for one folder. */
    function instance() {
        const events = { message: [], close: [], stderr: [] };
        const running = new Map();
        const own = new Set();
        const send = (message) => {
            for (const listener of events.message) listener(message);
        };
        const reply = (id, result) => send({ jsonrpc: '2.0', id, result });
        const fail = (id, code, text) =>
            send({ jsonrpc: '2.0', id, error: { code, message: text } });

        const handleNotice = (method, params) => {
            if (method === 'textDocument/didOpen') {
                const item = params.textDocument;
                const document = new TextDocument(
                    Uri.parse(item.uri),
                    item.languageId,
                    item.version,
                    item.text
                );
                link.documents.set(item.uri, document);
                own.add(item.uri);
                link.events.open.fire(document);
            } else if (method === 'textDocument/didChange') {
                const document = link.documents.get(params.textDocument.uri);
                if (document === undefined) return;
                document.apply(params.textDocument.version, params.contentChanges);
                link.events.change.fire({
                    document,
                    contentChanges: params.contentChanges,
                    reason: undefined
                });
            } else if (method === 'textDocument/didClose') {
                const document = link.documents.get(params.textDocument.uri);
                if (document === undefined) return;
                link.documents.delete(params.textDocument.uri);
                own.delete(params.textDocument.uri);
                document.isClosed = true;
                link.events.close.fire(document);
            } else if (method === 'textDocument/didSave') {
                const document = link.documents.get(params.textDocument.uri);
                if (document !== undefined) link.events.save.fire(document);
            } else if (method === '$/cancelRequest') {
                running.get(params.id)?.cancel();
            }
        };

        const handleRequest = async (message) => {
            const { id, method, params } = message;
            if (method === 'initialize') {
                reply(id, {
                    capabilities: {
                        textDocumentSync: { openClose: true, change: 2, save: true },
                        ...capabilities()
                    },
                    serverInfo: { name: 'app' }
                });
                return;
            }
            if (method === 'shutdown') {
                reply(id, null);
                return;
            }
            const source = new CancellationTokenSource();
            running.set(id, source);
            try {
                if (method === 'workspace/symbol') {
                    const found = [];
                    for (const one of registrations.filter(
                        (entry) => entry.kind === 'workspaceSymbol'
                    )) {
                        const value = await one.provider.provideWorkspaceSymbols(
                            params.query ?? '',
                            source.token
                        );
                        if (Array.isArray(value)) found.push(...value);
                    }
                    reply(id, found.map(convert.fromSymbol));
                } else if (FOLLOWS[method] !== undefined) {
                    const spec = FOLLOWS[method];
                    const chosen = registrations.filter(
                        (entry) =>
                            entry.kind === spec.kind &&
                            typeof entry.provider[spec.method] === 'function'
                    );
                    let value;
                    for (const one of chosen) {
                        value = await one.provider[spec.method](spec.arg(params), source.token);
                        if (present(value)) break;
                    }
                    reply(id, value === undefined ? params : spec.out(value));
                } else if (METHODS[method] !== undefined) {
                    const document = await documentOf(params.textDocument?.uri ?? params.item?.uri);
                    if (document === undefined) {
                        fail(id, INTERNAL_ERROR, 'the document is not open');
                    } else {
                        reply(id, await answer(METHODS[method], document, params, source.token));
                    }
                } else {
                    fail(id, -32601, `${method} is not handled`);
                }
            } catch (error) {
                if (source.token.isCancellationRequested) fail(id, REQUEST_CANCELLED, 'cancelled');
                else {
                    link.note(
                        error instanceof Error ? (error.stack ?? error.message) : String(error)
                    );
                    fail(
                        id,
                        INTERNAL_ERROR,
                        error instanceof Error ? error.message : String(error)
                    );
                }
            } finally {
                running.delete(id);
                source.dispose();
            }
        };

        const made = {
            send(message) {
                if (message.method === undefined) return;
                if (message.id !== undefined) void handleRequest(message);
                else if (message.method === 'exit') made.kill();
                else handleNotice(message.method, message.params ?? {});
            },
            onMessage: (listener) => events.message.push(listener),
            onClose: (listener) => events.close.push(listener),
            onStderr: (listener) => events.stderr.push(listener),
            pause: () => undefined,
            resume: () => undefined,
            kill() {
                if (!instances.delete(made)) return;
                for (const uri of own) {
                    const document = link.documents.get(uri);
                    if (document === undefined) continue;
                    link.documents.delete(uri);
                    document.isClosed = true;
                    link.events.close.fire(document);
                }
                for (const source of running.values()) source.cancel();
                for (const listener of events.close) listener(0);
            }
        };
        instances.add(made);
        return made;
    }

    /** A diagnostic collection: its entries are told to oculus as they change. */
    function createDiagnosticCollection(name = '') {
        const key = name === '' ? `collection-${collections.size + 1}` : name;
        if (collections.has(key)) throw new Error('refused:registered');
        const entries = new Map();
        const tell = (uri, diagnostics) =>
            connection.sendNotification('oculus/languages/diagnostics', {
                collection: key,
                uri: uri.toString(),
                diagnostics: diagnostics.map(convert.fromDiagnostic)
            });
        const registered = connection.sendRequest('oculus/languages/register', {
            kind: 'collection',
            id: key,
            options: {}
        });
        registered.catch(report);
        const collection = {
            name: key,
            set(uriOrEntries, diagnostics) {
                if (Array.isArray(uriOrEntries)) {
                    for (const [uri, list] of uriOrEntries) collection.set(uri, list);
                    return;
                }
                const list = diagnostics ?? [];
                if (list.length === 0) {
                    collection.delete(uriOrEntries);
                    return;
                }
                entries.set(uriOrEntries.toString(), [uriOrEntries, list]);
                tell(uriOrEntries, list);
            },
            delete(uri) {
                if (entries.delete(uri.toString())) tell(uri, []);
            },
            clear() {
                for (const [uri] of [...entries.values()]) collection.delete(uri);
            },
            forEach(callback, thisArg) {
                for (const [uri, list] of entries.values())
                    callback.call(thisArg, uri, list, collection);
            },
            get: (uri) => entries.get(uri.toString())?.[1],
            has: (uri) => entries.has(uri.toString()),
            dispose() {
                if (!collections.delete(key)) return;
                collection.clear();
                connection
                    .sendRequest('oculus/languages/unregister', { kind: 'collection', id: key })
                    .catch(report);
            }
        };
        collections.set(key, collection);
        return collection;
    }

    const api = {
        registerCompletionItemProvider: (selector, provider, ...triggers) =>
            add('completion', selector, provider, { triggers }),
        registerHoverProvider: (selector, provider) => add('hover', selector, provider),
        registerDefinitionProvider: (selector, provider) => add('definition', selector, provider),
        registerDeclarationProvider: (selector, provider) => add('declaration', selector, provider),
        registerTypeDefinitionProvider: (selector, provider) =>
            add('typeDefinition', selector, provider),
        registerImplementationProvider: (selector, provider) =>
            add('implementation', selector, provider),
        registerReferenceProvider: (selector, provider) => add('references', selector, provider),
        registerDocumentSymbolProvider: (selector, provider) =>
            add('documentSymbol', selector, provider),
        registerWorkspaceSymbolProvider: (provider) => add('workspaceSymbol', '*', provider),
        registerDocumentHighlightProvider: (selector, provider) =>
            add('documentHighlight', selector, provider),
        registerCodeActionsProvider: (selector, provider, metadata = {}) =>
            add('codeActions', selector, provider, {
                kinds: (metadata.providedCodeActionKinds ?? []).map((one) => one.value ?? one)
            }),
        registerCodeLensProvider: (selector, provider) => add('codeLens', selector, provider),
        registerDocumentLinkProvider: (selector, provider) =>
            add('documentLink', selector, provider),
        registerDocumentFormattingEditProvider: (selector, provider) =>
            add('formatting', selector, provider),
        registerDocumentRangeFormattingEditProvider: (selector, provider) =>
            add('rangeFormatting', selector, provider),
        registerOnTypeFormattingEditProvider: (selector, provider, first, ...more) =>
            add('onTypeFormatting', selector, provider, { first, more }),
        registerRenameProvider: (selector, provider) => add('rename', selector, provider),
        registerSignatureHelpProvider: (selector, provider, ...rest) => {
            const metadata = rest.length === 1 && typeof rest[0] === 'object' ? rest[0] : null;
            return add('signatureHelp', selector, provider, {
                triggers: metadata === null ? rest : (metadata.triggerCharacters ?? []),
                retriggers: metadata === null ? [] : (metadata.retriggerCharacters ?? [])
            });
        },
        registerFoldingRangeProvider: (selector, provider) =>
            add('foldingRange', selector, provider),
        registerSelectionRangeProvider: (selector, provider) =>
            add('selectionRange', selector, provider),
        registerInlayHintsProvider: (selector, provider) => add('inlayHints', selector, provider),
        registerDocumentSemanticTokensProvider: (selector, provider, legend) =>
            add('semanticTokens', selector, provider, { legend }),
        registerCallHierarchyProvider: (selector, provider) =>
            add('callHierarchy', selector, provider),
        registerTypeHierarchyProvider: (selector, provider) =>
            add('typeHierarchy', selector, provider),
        createDiagnosticCollection
    };

    return { api, instance, collections, emitter: EventEmitter, registrations };
}
