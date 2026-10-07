// Layer 2, server. The language servers' registry: one entry per program, describing how a server
// is run. An entry names how its program is found and started, what it is asked at `initialize`,
// how its `workspace/configuration` requests are answered, and the capabilities the page is told it
// has. The other half of a server is data/prose/lsp-servers.ts, keyed by the same ids: its
// languages, the catalog keys of its words, its semantic tokens, its format-on-type, its Organize
// Imports and the choices its root asks for. A new server is one entry in each of the two places,
// and the `adapter` of its entry here names what it needs of a root (written in a folder of its own
// beside this file); nothing else names a server or a language.
//
// The registry is code and no reader edits it. There are four entries. pyright serves `python` and
// the TypeScript server `javascript` and `typescript`; each runs under the node that runs oculus,
// from its package in oculus's own `node_modules`, never a global install, never a `node` found on
// PATH, as does the Svelte server, which serves `svelte`. The TypeScript server runs on oculus's
// own TypeScript, with automatic type acquisition and tsserver's log off, so no `npm` runs and
// nothing is written into a repository. clangd serves `c` and `cpp` and is the `clangd` on the
// oculus process's PATH, with oculus's own arguments and no `--query-driver`; its index is written
// under the folder oculus links the chosen compile database into, never into a repository.
//
// Every command is an argument array: a root's path is one argument whatever characters it
// holds, and nothing is passed through a shell.

import { existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { LspCode, LspToPage, LspToServer } from '../../../data/model/index.ts';
import { serverFacts, type LspServerId } from '../../../data/prose/lsp-servers.ts';
import { clangdAdapter } from './clangd/adapter.ts';
import { pyrightAdapter } from './pyright/adapter.ts';
import { svelteAdapter } from './web/svelte-adapter.ts';
import { typescriptAdapter } from './web/typescript-adapter.ts';

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
    /**
     * Whether the reader approved the repository's own Svelte and Vite configuration, which the
     * Svelte server runs trusted on and the TypeScript server loads the Svelte plugin on.
     */
    configApproved?: boolean;
};

/** The program, its arguments and the folder it runs in. */
export type Launch = { command: string; args: string[]; cwd: string; program: string };

type ServerId = LspServerId;

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

/** The body of a `choices` message: the lists of one root, each present for the server asking. */
type ChoicesBody = Omit<Extract<LspToPage, { oculus: 'choices' }>, 'oculus' | 'root'>;

/** What the reader chose, as it is written: a field is absent until it was chosen. */
export type Choice = { interpreter?: string; database?: string };

/** A value an adapter may have at once or after asking a program. */
type Eventually<T> = T | Promise<T>;

/** How a running server is put through a choice: asked its settings again, or restarted. */
export type Applying = 'configuration' | 'restart';

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
    ): Eventually<{ choice: Choice; note?: string; apply: Applying }>;
    /**
     * Approve what the message names. `apply` is what the running server is put through for it:
     * its settings asked again, a restart, or nothing when the approval changed neither.
     */
    approve(
        env: RootEnv,
        message: Extract<LspToServer, { oculus: 'approve' }>
    ): Eventually<{ ok: boolean; apply: Applying | null }>;
    /** Take an approval back; `apply` as for `approve`. */
    revoke(
        env: RootEnv,
        message: Extract<LspToServer, { oculus: 'revoke' }>
    ): Eventually<{ ok: boolean; apply: Applying | null }>;
    /** The setup of a running server after a choice or an approval, for its next question. */
    settings(env: RootEnv, setup: Setup): Eventually<Setup>;
};

export type ServerEntry = {
    id: ServerId;
    /** The Monaco language ids it serves. */
    languages: readonly string[];
    /** The program's name, which the status item names when it is not found. */
    program: string;
    /** What the server needs of a root beyond its program: its settings, choices and approvals. */
    adapter: Adapter;
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
    /** What the server needs of the page's client beyond what the page declared, by section. */
    clientTextDocument?: Record<string, unknown>;
};

/** The registry: the entries and the lookup by language. */
export type Servers = {
    entries: readonly ServerEntry[];
    forLanguage(language: string): ServerEntry | undefined;
    forId(id: ServerId): ServerEntry;
};

/** What the registry needs of the machine. */
export type ServersOptions = {
    /**
     * The oculus folder, which holds `node_modules` with the servers' packages: `ownFolder()` in a
     * server.
     */
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

/** What a server offers of the capabilities every server here keeps. */
type Offers = {
    /** Go to Declaration. */
    declaration: boolean;
    /** Rename, which asks where the symbol is first. */
    rename: boolean;
    /** The call hierarchy, and the type hierarchy. */
    callHierarchy: boolean;
    typeHierarchy: boolean;
};

/** The capabilities every server keeps, each for one language. */
function common(language: string, offers: Offers): Record<string, unknown> {
    return {
        textDocumentSync: INCREMENTAL,
        hoverProvider: serving(language),
        definitionProvider: serving(language),
        ...(offers.declaration ? { declarationProvider: serving(language) } : {}),
        typeDefinitionProvider: serving(language),
        referencesProvider: serving(language),
        documentHighlightProvider: serving(language),
        documentSymbolProvider: serving(language),
        workspaceSymbolProvider: serving(language),
        ...(offers.rename ? { renameProvider: serving(language, { prepareProvider: true }) } : {}),
        ...(offers.callHierarchy ? { callHierarchyProvider: serving(language) } : {}),
        ...(offers.typeHierarchy ? { typeHierarchyProvider: serving(language) } : {})
    };
}

/**
 * The command pyright runs for Organize Imports, which it offers as a command and no code action.
 */
const PYRIGHT_COMMANDS = ['pyright.organizeimports'] as const;

/** The commands the TypeScript server's code actions and completions run. */
const TYPESCRIPT_COMMANDS = [
    '_typescript.applyRefactoring',
    '_typescript.configurePlugin',
    '_typescript.organizeImports',
    '_typescript.applyRenameFile',
    '_typescript.goToSourceDefinition',
    '_typescript.applyCodeActionCommand',
    '_typescript.applyFixAllCodeAction',
    'typescript.tsserverRequest'
] as const;

/** The commands the Svelte server's code actions run. */
const SVELTE_COMMANDS = [
    'function_scope_0',
    'function_scope_1',
    'function_scope_2',
    'function_scope_3',
    'constant_scope_0',
    'constant_scope_1',
    'constant_scope_2',
    'constant_scope_3',
    'extract_to_svelte_component',
    'migrate_to_svelte_5',
    'Infer function return type'
] as const;

/** The characters the Svelte server completes after: its own, with those of its HTML and CSS. */
const SVELTE_TRIGGERS = [
    ...['.', '"', "'", '`', '/', '@', '<', '>', '*', '#', '$', '+', '^'],
    ...['(', '[', '-', ':', '|']
];

const CLANGD_COMMANDS = ['clangd.applyFix', 'clangd.applyRename', 'clangd.applyTweak'] as const;

/**
 * The folder oculus's code runs from, the one whose `node_modules` holds the servers' packages: the
 * nearest folder above this module that holds a `package.json`, so a server given another
 * `--engine` folder finds them, and a missing package is the server's `not_found` and never a
 * failed start.
 */
export function ownFolder(): string {
    let folder = dirname(fileURLToPath(import.meta.url));
    while (!existsSync(join(folder, 'package.json')) && dirname(folder) !== folder) {
        folder = dirname(folder);
    }
    return folder;
}

/** The facts of a server the registry does not repeat: its languages and program name. */
function factsOf(id: ServerId): Pick<ServerEntry, 'id' | 'languages' | 'program'> {
    const { languages, program } = serverFacts(id);
    return { id, languages, program };
}

/** The launch of a package that runs under oculus's own node, or null when it is not installed. */
function packaged(
    options: ServersOptions,
    id: ServerId,
    entry: string[],
    setup: Setup
): Launch | null {
    const exists = options.exists ?? existsSync;
    const script = join(options.oculus, 'node_modules', ...entry);
    return exists(script)
        ? {
              command: options.node,
              args: [script, '--stdio'],
              cwd: setup.root,
              program: serverFacts(id).program
          }
        : null;
}

/** The pyright entry, from the `pyright` package under oculus's own folder. */
function pyright(options: ServersOptions): ServerEntry {
    return {
        ...factsOf('pyright'),
        adapter: pyrightAdapter,
        launch: (setup) => packaged(options, 'pyright', ['pyright', 'langserver.index.js'], setup),
        initializationOptions: () => ({}),
        // pyright asks for the sections `python` and `pyright`; the interpreter reaches it through
        // the first, as `pythonPath`.
        configuration: (section, setup) =>
            section === 'python' && setup.interpreter !== null
                ? { pythonPath: setup.interpreter }
                : null,
        capabilities: (language) => ({
            ...common(language, {
                declaration: true,
                rename: true,
                callHierarchy: true,
                typeHierarchy: false
            }),
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
        ...factsOf('clangd'),
        adapter: clangdAdapter,
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
        clientTextDocument: { inactiveRegionsCapabilities: { inactiveRegions: true } },
        capabilities: (language) => ({
            ...common(language, {
                declaration: true,
                rename: true,
                callHierarchy: true,
                typeHierarchy: true
            }),
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

/**
 * The TypeScript entry: `typescript-language-server` over oculus's own TypeScript, with automatic
 * type acquisition and tsserver's log off. The Svelte plugin is given to tsserver only for a
 * repository whose Svelte configuration the reader approved, since the plugin loads the
 * repository's own `svelte/compiler`.
 */
function typescript(options: ServersOptions): ServerEntry {
    const tsserver = join(options.oculus, 'node_modules', 'typescript', 'lib', 'tsserver.js');
    return {
        ...factsOf('typescript'),
        adapter: typescriptAdapter,
        launch: (setup) =>
            (options.exists ?? existsSync)(tsserver)
                ? packaged(
                      options,
                      'typescript',
                      ['typescript-language-server', 'lib', 'cli.mjs'],
                      setup
                  )
                : null,
        initializationOptions: (setup) => ({
            disableAutomaticTypingAcquisition: true,
            tsserver: { path: tsserver, logVerbosity: 'off' },
            plugins:
                setup.configApproved === true
                    ? [
                          {
                              name: 'typescript-svelte-plugin',
                              location: options.oculus,
                              languages: ['svelte']
                          }
                      ]
                    : []
        }),
        // The server asks for the formatting options of the file an edit is made in.
        configuration: (section) =>
            section === 'formattingOptions' ? { tabSize: 4, insertSpaces: true } : null,
        capabilities: (language) => ({
            ...common(language, {
                declaration: false,
                rename: true,
                callHierarchy: true,
                typeHierarchy: false
            }),
            implementationProvider: serving(language),
            completionProvider: serving(language, {
                triggerCharacters: ['.', '"', "'", '/', '@', '<'],
                resolveProvider: true
            }),
            signatureHelpProvider: serving(language, {
                triggerCharacters: ['(', ',', '<'],
                retriggerCharacters: [')']
            }),
            codeActionProvider: serving(language, {
                codeActionKinds: [
                    'quickfix',
                    'refactor',
                    'source.organizeImports.ts',
                    'source.removeUnusedImports.ts',
                    'source.sortImports.ts',
                    'source.addMissingImports.ts',
                    'source.removeUnused.ts',
                    'source.fixAll.ts'
                ],
                resolveProvider: true
            }),
            documentFormattingProvider: serving(language),
            documentRangeFormattingProvider: serving(language),
            foldingRangeProvider: serving(language),
            selectionRangeProvider: serving(language),
            inlayHintProvider: serving(language),
            executeCommandProvider: { commands: [...TYPESCRIPT_COMMANDS] }
        }),
        commands: TYPESCRIPT_COMMANDS
    };
}

/**
 * The Svelte entry: `svelte-language-server`, started untrusted (`isTrusted: false`: it loads no
 * configuration and no package of the repository) until the reader approved the repository's
 * configuration, and trusted after.
 */
function svelte(options: ServersOptions): ServerEntry {
    return {
        ...factsOf('svelte'),
        adapter: svelteAdapter,
        launch: (setup) =>
            packaged(options, 'svelte', ['svelte-language-server', 'bin', 'server.js'], setup),
        initializationOptions: (setup) => ({ isTrusted: setup.configApproved === true }),
        configuration: () => null,
        capabilities: (language) => ({
            ...common(language, {
                declaration: false,
                rename: true,
                callHierarchy: true,
                typeHierarchy: false
            }),
            implementationProvider: serving(language),
            completionProvider: serving(language, {
                triggerCharacters: SVELTE_TRIGGERS,
                resolveProvider: true
            }),
            signatureHelpProvider: serving(language, {
                triggerCharacters: ['(', ',', '<'],
                retriggerCharacters: [')']
            }),
            codeActionProvider: serving(language, {
                codeActionKinds: [
                    'quickfix',
                    'refactor',
                    'source.organizeImports',
                    'source.sortImports',
                    'source.addMissingImports',
                    'source.removeUnusedImports'
                ],
                resolveProvider: true
            }),
            documentFormattingProvider: serving(language),
            foldingRangeProvider: serving(language),
            selectionRangeProvider: serving(language),
            inlayHintProvider: serving(language),
            executeCommandProvider: { commands: [...SVELTE_COMMANDS] }
        }),
        commands: SVELTE_COMMANDS
    };
}

/** The registry for this machine. */
export function createServers(options: ServersOptions): Servers {
    const entries = [pyright(options), clangd(), typescript(options), svelte(options)];
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
        ...(caps.textDocument as Record<string, unknown> | undefined),
        ...entry.clientTextDocument
    };
    delete textDocument.diagnostic;
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
