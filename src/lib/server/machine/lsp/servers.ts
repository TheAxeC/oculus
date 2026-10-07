// Layer 2, server. The language servers' registry: one entry per program, the one place a server
// is described. An entry names the Monaco language ids it serves, how its program is found and
// started, what it is asked at `initialize`, how its `workspace/configuration` requests are
// answered, and the capabilities the page is told it has.
//
// The registry is code and no reader edits it: a new server is one entry here and nothing else.
// There are two entries. pyright serves `python` and runs under the node that runs oculus, from the
// `pyright` package in oculus's own `node_modules`, never a global install, never a `node` found on
// PATH. clangd serves `c` and `cpp` and is the `clangd` on the oculus process's PATH, with oculus's
// own arguments and no `--query-driver`; its index is written under the folder oculus links the
// chosen compile database into, never into a repository.
//
// Every command is an argument array: a root's path is one argument whatever characters it
// holds, and nothing is passed through a shell.

import { existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { LspCode, LspToPage, LspToServer } from '../../../data/model/index.ts';

/** What an entry is told about the root it starts a server for. */
export type Setup = {
    /** The served root's real path. */
    root: string;
    /** The interpreter pyright is answered, null when there is none. */
    interpreter: string | null;
    /**
     * The `sys.prefix` and `sys.base_prefix` of that interpreter: the folders a definition may lie
     * under and be opened as a library file although its path holds a dot segment.
     */
    interpreterPrefixes: string[];
    /** The folder holding the link to the chosen `compile_commands.json`, null for none. */
    databaseFolder: string | null;
    /** The flags clangd uses for a file the database has no entry for. */
    fallbackFlags: string[];
};

/** The program, its arguments and the folder it runs in. */
export type Launch = { command: string; args: string[]; cwd: string; program: string };

export type ServerId = 'pyright' | 'clangd';

/** What an entry's server was made ready with, or why it could not be. */
export type Prepared =
    | { ok: true; setup: Setup; launch: Launch; note?: string }
    | { ok: false; state: 'not_found' | 'failed'; code: LspCode; program: string; note: string };

/** What an adapter knows of the machine and of the root it works for. */
export type RootEnv = {
    /** The root's real path, which is the repository's. */
    root: string;
    /** The folder the `lsp` key names. */
    lsp: string;
    /** The approvals file. */
    approvals: string;
    /** How a program is run to ask it a question; `execFile` unless a test hands one. */
    run?: (command: string, args: string[]) => Promise<string | null>;
    exists?: (path: string) => boolean;
};

/** The body of a `choices` message: the lists of one root, the other server's fields empty. */
type ChoicesBody = Omit<Extract<LspToPage, { oculus: 'choices' }>, 'oculus' | 'root'>;

/** What the reader chose, as it is written: a field is absent until it was chosen. */
export type Choice = { interpreter?: string; database?: string };

/** A value an adapter may have at once or after asking a program. */
type Eventually<T> = T | Promise<T>;

/**
 * What a server needs of a root beyond its program: its settings, the lists the reader picks from
 * and the choices the reader makes. Each entry has one.
 */
export type Adapter = {
    /** Read the root's settings and make the entry's launch for them. */
    prepare(entry: ServerEntry, env: RootEnv): Eventually<Prepared>;
    /** The lists of the picker. */
    choices(env: RootEnv): Eventually<ChoicesBody>;
    /**
     * The choice a `choose` message asks for, checked: empty when it names nothing the root offers,
     * with the reason in `note`. `apply` is what the running server is put through for it.
     */
    choose(
        env: RootEnv,
        message: Extract<LspToServer, { oculus: 'choose' }>
    ): Eventually<{ choice: Choice; note?: string; apply: 'configuration' | 'restart' }>;
    /** Approve what the message names; whether the approval changed the server's settings. */
    approve(
        env: RootEnv,
        message: Extract<LspToServer, { oculus: 'approve' }>
    ): Eventually<{ ok: boolean; changed: boolean }>;
    /** The setup of a running server after a choice or an approval, for its next question. */
    settings(env: RootEnv, setup: Setup): Eventually<Setup>;
};

export type ServerEntry = {
    id: ServerId;
    /** The Monaco language ids it serves. */
    languages: readonly string[];
    /** The program's name, which the status item names when it is not found. */
    program: string;
    /** How to start it for this root, or null when its program is not there. */
    launch(setup: Setup): Launch | null;
    /** What it is asked at `initialize`, as `initializationOptions`. */
    initializationOptions(setup: Setup): Record<string, unknown>;
    /** The answer to one item of a `workspace/configuration` request. */
    configuration(section: string | undefined, setup: Setup): unknown;
    /** The capabilities the page is told for one of its languages, each with its selector. */
    capabilities(language: string): Record<string, unknown>;
    /** The commands the server may be asked to run, which the page registers. */
    commands: readonly string[];
};

/** The registry: the entries and the lookup by language. */
export type Servers = {
    entries: readonly ServerEntry[];
    forLanguage(language: string): ServerEntry | undefined;
    forId(id: ServerId): ServerEntry;
};

/** What the registry needs of the machine. */
export type ServersOptions = {
    /** The oculus folder, which holds `node_modules/pyright`: `ownFolder()` in a server. */
    oculus: string;
    /** The node that runs oculus, `process.execPath`. */
    node: string;
    /** Whether a path exists; `existsSync` unless a test says otherwise. */
    exists?: (path: string) => boolean;
};

/**
 * The incremental text synchronisation the page's client is told,
 * `TextDocumentSyncKind.Incremental`.
 */
const INCREMENTAL = 2;

/**
 * A provider that is on for one language: an options object that carries the language's selector.
 */
function serving(language: string, options: Record<string, unknown> = {}): Record<string, unknown> {
    return { ...options, documentSelector: [{ language }] };
}

/** The capabilities both servers keep, each for one language. */
function common(language: string): Record<string, unknown> {
    return {
        textDocumentSync: INCREMENTAL,
        hoverProvider: serving(language),
        definitionProvider: serving(language),
        declarationProvider: serving(language),
        typeDefinitionProvider: serving(language),
        referencesProvider: serving(language),
        documentHighlightProvider: serving(language),
        documentSymbolProvider: serving(language)
    };
}

/**
 * The command pyright runs for Organize Imports, which it offers as a command and no code action.
 */
const PYRIGHT_COMMANDS = ['pyright.organizeimports'] as const;

/**
 * The folder oculus's code runs from, the one whose `node_modules` holds `pyright`: the nearest
 * folder above this module that holds a `package.json`, so a server given another `--engine`
 * folder finds it, and a missing `pyright` is the server's `not_found` and never a failed start.
 */
export function ownFolder(): string {
    let folder = dirname(fileURLToPath(import.meta.url));
    while (!existsSync(join(folder, 'package.json')) && dirname(folder) !== folder) {
        folder = dirname(folder);
    }
    return folder;
}

/** The pyright entry, from the `pyright` package under oculus's own folder. */
function pyright(options: ServersOptions): ServerEntry {
    const exists = options.exists ?? existsSync;
    const entry = join(options.oculus, 'node_modules', 'pyright', 'langserver.index.js');
    return {
        id: 'pyright',
        languages: ['python'],
        program: 'pyright',
        launch: (setup) =>
            exists(entry)
                ? {
                      command: options.node,
                      args: [entry, '--stdio'],
                      cwd: setup.root,
                      program: 'pyright'
                  }
                : null,
        initializationOptions: () => ({}),
        // pyright asks for the sections `python` and `pyright`; the interpreter reaches it through
        // the first, as `pythonPath`.
        configuration: (section, setup) =>
            section === 'python' && setup.interpreter !== null
                ? { pythonPath: setup.interpreter }
                : null,
        capabilities: (language) => ({
            ...common(language),
            completionProvider: serving(language, {
                triggerCharacters: ['.', '[', '"', "'"],
                resolveProvider: true
            }),
            signatureHelpProvider: serving(language, { triggerCharacters: ['(', ',', ')'] }),
            codeActionProvider: serving(language, {
                codeActionKinds: ['quickfix', 'source.organizeImports']
            }),
            executeCommandProvider: { commands: [...PYRIGHT_COMMANDS] }
        }),
        commands: PYRIGHT_COMMANDS
    };
}

/** The clangd entry, the program on the oculus process's PATH. */
function clangd(): ServerEntry {
    return {
        id: 'clangd',
        languages: ['c', 'cpp'],
        program: 'clangd',
        launch: (setup) => ({
            command: 'clangd',
            args: [
                '--header-insertion=never',
                '--background-index',
                ...(setup.databaseFolder === null
                    ? []
                    : [`--compile-commands-dir=${setup.databaseFolder}`])
            ],
            cwd: setup.root,
            program: 'clangd'
        }),
        initializationOptions: (setup) => ({ fallbackFlags: setup.fallbackFlags }),
        configuration: () => null,
        capabilities: (language) => ({
            ...common(language),
            implementationProvider: serving(language),
            completionProvider: serving(language, {
                triggerCharacters: ['.', '<', '>', ':', '"', '/', '*']
            }),
            signatureHelpProvider: serving(language, {
                triggerCharacters: ['(', ')', '{', '}', '<', '>', ',']
            }),
            codeActionProvider: serving(language),
            documentFormattingProvider: serving(language),
            documentRangeFormattingProvider: serving(language),
            documentOnTypeFormattingProvider: serving(language, {
                firstTriggerCharacter: '\n',
                moreTriggerCharacter: []
            }),
            foldingRangeProvider: serving(language),
            selectionRangeProvider: serving(language),
            inlayHintProvider: serving(language),
            documentLinkProvider: serving(language),
            executeCommandProvider: { commands: [...CLANGD_COMMANDS] }
        }),
        commands: CLANGD_COMMANDS
    };
}

const CLANGD_COMMANDS = ['clangd.applyFix', 'clangd.applyRename', 'clangd.applyTweak'] as const;

/** The registry for this machine. */
export function createServers(options: ServersOptions): Servers {
    const entries = [pyright(options), clangd()];
    return {
        entries,
        forLanguage: (language) => entries.find((one) => one.languages.includes(language)),
        forId: (id) => {
            const found = entries.find((one) => one.id === id);
            if (found === undefined) throw new Error(`no language server entry ${id}`);
            return found;
        }
    };
}

/**
 * The `initialize` request a server is given: the capabilities the page's client sent, with what a
 * server of this entry needs of its client, rooted at the root's real path.
 */
export function initializeParams(
    entry: ServerEntry,
    root: string,
    caps: Record<string, unknown>,
    setup: Setup
): Record<string, unknown> {
    const textDocument: Record<string, unknown> = {
        ...(caps.textDocument as Record<string, unknown> | undefined)
    };
    delete textDocument.diagnostic;
    if (entry.id === 'clangd') {
        textDocument.inactiveRegionsCapabilities = { inactiveRegions: true };
    }
    const workspace = (caps.workspace ?? {}) as Record<string, unknown>;
    const uri = pathToFileURL(root).href;
    return {
        processId: process.pid,
        clientInfo: { name: 'oculus' },
        rootUri: uri,
        workspaceFolders: [{ uri, name: basename(root) }],
        capabilities: {
            ...caps,
            textDocument,
            workspace: {
                ...workspace,
                didChangeWatchedFiles: {
                    ...(workspace.didChangeWatchedFiles as Record<string, unknown> | undefined),
                    dynamicRegistration: true
                },
                configuration: true,
                semanticTokens: {
                    ...(workspace.semanticTokens as Record<string, unknown> | undefined),
                    refreshSupport: true
                }
            },
            window: {
                ...(caps.window as Record<string, unknown> | undefined),
                workDoneProgress: true
            }
        },
        initializationOptions: entry.initializationOptions(setup)
    };
}
