// Layer 2, server. The language servers' registry: one entry per program, describing how a server
// is run. An entry names how its program is found and started, what it is asked at `initialize`,
// how its `workspace/configuration` requests are answered, and the capabilities the page is told it
// has. The other half of a server is data/prose/lsp-servers.ts, keyed by the same ids: its
// languages, the catalog keys of its words, its semantic tokens, its format-on-type, its Organize
// Imports and the choices its root asks for. A new server is one entry in each of the two places,
// and the `adapter` of its entry here names what it needs of a root (written in a folder of its own
// under adapters/); nothing else names a server or a language.
//
// The registry is code and no reader edits it. There are seven entries. pyright serves `python`,
// the TypeScript server `javascript` and `typescript`, the Svelte server `svelte`, the YAML server
// `yaml`, the Markdown server `markdown`, clangd `c` and `cpp`, and texlab `latex` and `bibtex`.
// The first five run under the node that runs oculus, from their packages in oculus's own
// `node_modules`, never a global install, never a `node` found on PATH. The TypeScript server runs
// on oculus's own TypeScript, with automatic type acquisition and tsserver's log off, so no `npm`
// runs and nothing is written into a repository. The YAML server runs under node's permission
// model, which lets it read only oculus's own `node_modules`: a schema it is told of by a modeline
// or a `$schema:` key that names a file on disk is not loaded, and the schemas it uses are the ones
// the entry hands it from memory. The Markdown server runs under the same permission model and
// reads no file itself: the entry answers the requests it makes of its client inside the served
// root (adapters/markdown/). An entry may answer a request of the page itself (`answers`) before it
// reaches the server: the YAML entry does so for the definition, references and rename of a hub
// key, from the index the snapshot build makes, and the Markdown entry for the definition of a
// backticked path and the rename of a note a link names. An entry may also add a result of its own
// to its server's answer (`adds`), which the relay joins to it: the Markdown entry adds the
// completions, definitions and references of the links between notes (adapters/markdown/own/
// wiki.ts). The Markdown server takes the notice of a created file only for a file it holds,
// so the entry's `introduce` words the request that makes it read the file first
// (adapters/markdown/requests.ts). clangd is the `clangd` on the oculus process's PATH, with
// oculus's own arguments and no `--query-driver`; its index is written under the folder oculus
// links the chosen compile database into, never into a repository. texlab is the program
// `latex.texlab_path` names, else the `texlab` on the oculus process's PATH, started by its
// absolute path with a PATH of its own that holds links to the TeX programs and no `latexmk`, so it
// never runs the code of a latexmkrc.
//
// The types of an entry and of the registry are in adapters/entry.ts, and this module names them
// again so the code that reads a server entry imports one place.
//
// Every command is an argument array: a root's path is one argument whatever characters it
// holds, and nothing is passed through a shell.

import { existsSync, realpathSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { refusesFile, serverFacts, type LspServerId } from '../../../data/prose/lsp-servers.ts';
import { clangdAdapter } from './adapters/clangd/adapter.ts';
import { pyrightAdapter } from './adapters/pyright/adapter.ts';
import { svelteAdapter } from './adapters/web/svelte-adapter.ts';
import { typescriptAdapter } from './adapters/web/typescript-adapter.ts';
import { texlabAdapter } from './adapters/texlab/adapter.ts';
import { texlabSettings } from './adapters/texlab/settings.ts';
import { markdownAdapter } from './adapters/markdown/adapter.ts';
import { answerMarkdown } from './adapters/markdown/own/answers.ts';
import { addedWiki, answerWiki } from './adapters/markdown/own/wiki.ts';
import { markdownDiagnostics } from './adapters/markdown/diagnostics.ts';
import { markdownFiles } from './adapters/markdown/places.ts';
import { introduceMarkdown, markdownRequests } from './adapters/markdown/requests.ts';
import { markdownResults } from './adapters/markdown/scrub.ts';
import { MARKDOWN_SETTINGS } from './adapters/markdown/settings.ts';
import type { Launch, ServerEntry, Servers, ServersOptions, Setup } from './adapters/entry.ts';
import type { ChangeKind, DiagnosticView, Registration, ServerAsk } from './adapters/asks.ts';
import { markdownCapabilities } from './adapters/markdown/capabilities.ts';
import { yamlAdapter } from './adapters/yaml/adapter.ts';
import { yamlRequests } from './adapters/yaml/requests.ts';
import { YAML_SETTINGS } from './adapters/yaml/settings.ts';
import { answerHubKeys } from './adapters/yaml/hub-keys.ts';
import { isPrivateFile } from './adapters/yaml/private-file.ts';

export type { ChangeKind, DiagnosticView, Registration, ServerAsk };
export type {
    Setup,
    Launch,
    Prepared,
    RootEnv,
    Choice,
    Applying,
    Adapter,
    ServerEntry,
    PageRequest,
    OpenDocument,
    PageView,
    PageAnswer,
    Servers,
    ServersOptions
} from './adapters/entry.ts';

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
function factsOf(id: LspServerId): Pick<ServerEntry, 'id' | 'languages' | 'program'> {
    const { languages, program } = serverFacts(id);
    return { id, languages, program };
}

/**
 * Oculus's own `node_modules` by its real path when it is there: node's permission model checks a
 * read against the real path, so a linked folder is named by where it leads, script and flag alike.
 * A missing folder is kept as given, so its packages read as not installed.
 */
function ownModules(options: ServersOptions): string {
    const modules = join(options.oculus, 'node_modules');
    return existsSync(modules) ? realpathSync(modules) : modules;
}

/**
 * The launch of a package that runs under oculus's own node, or null when it is not installed.
 * `flags` are node's own, placed before the script. Under the desktop app that node is Electron's
 * helper, which runs a script as node only with `ELECTRON_RUN_AS_NODE=1`, so the child gets
 * oculus's own environment with it added; node itself ignores the variable.
 */
function packaged(
    options: ServersOptions,
    id: LspServerId,
    entry: string[],
    setup: Setup,
    flags: string[] = []
): Launch | null {
    const exists = options.exists ?? existsSync;
    const script = join(ownModules(options), ...entry);
    return exists(script)
        ? {
              command: options.node,
              args: [...flags, script, '--stdio'],
              cwd: setup.root,
              program: serverFacts(id).program,
              env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
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

/**
 * The YAML entry: `yaml-language-server`, under node's permission model with read access to
 * oculus's own `node_modules` and nothing else, so no file a document names reaches it. No schema
 * comes from the network or the schema store: the server asks its client, which answers from the
 * schemas of the latest snapshot build (adapters/yaml/requests.ts). A file under a hub's `secrets`
 * folder or under `~/.oculus` is never put on it. A hub key in a hub file is a link: the entry
 * answers its definition, references and rename itself from the reference index of the latest build
 * (adapters/yaml/hub-keys.ts), which the server has no notion of, and sends every other request to
 * the server.
 */
function yaml(options: ServersOptions): ServerEntry {
    return {
        ...factsOf('yaml'),
        adapter: yamlAdapter,
        launch: (setup) =>
            packaged(
                options,
                'yaml',
                ['yaml-language-server', 'bin', 'yaml-language-server'],
                setup,
                ['--permission', `--allow-fs-read=${ownModules(options)}`]
            ),
        initializationOptions: () => ({}),
        // Its `initialized` handler throws without this, which skips pulling its settings.
        clientWorkspace: { workspaceFolders: true },
        configuration: (section) => (section === 'yaml' ? YAML_SETTINGS : null),
        requests: yamlRequests,
        registrations: [
            { method: 'yaml/registerCustomSchemaRequest' },
            { method: 'yaml/registerContentRequest' }
        ],
        refuses: (real, roots) => isPrivateFile(real, roots),
        answers: answerHubKeys,
        capabilities: (language) => ({
            textDocumentSync: INCREMENTAL,
            hoverProvider: serving(language),
            completionProvider: serving(language),
            documentSymbolProvider: serving(language),
            definitionProvider: serving(language),
            referencesProvider: serving(language),
            renameProvider: serving(language, { prepareProvider: true }),
            foldingRangeProvider: serving(language),
            selectionRangeProvider: serving(language),
            codeActionProvider: serving(language)
        }),
        commands: []
    };
}

/** The characters texlab completes after: its own. */
const TEXLAB_TRIGGERS = ['\\', '{', '}', '@', '/', ' '];

/** The source texlab names the diagnostics it reads from the build log with. */
const BUILD_LOG_SOURCE = 'latex';

/**
 * The texlab entry, for `latex` and `bibtex` files. It is the `texlab` program under the path
 * `latex.texlab_path` names or on oculus's PATH, started with a PATH of its own (adapters/texlab/).
 * Only what a reader gets from the language is on: no formatting (Format Document is the LaTeX
 * formatter's), no code actions or commands, and none of texlab's build, clean and forward search,
 * which are the LaTeX build's. texlab's ChkTeX is off and the diagnostics it reads from the build
 * log are dropped, since the build's own errors are the LaTeX view's.
 */
function texlab(options: ServersOptions): ServerEntry {
    return {
        ...factsOf('texlab'),
        adapter: texlabAdapter(options.latex),
        launch: (setup) =>
            setup.resolved === undefined
                ? null
                : {
                      command: setup.resolved.path,
                      args: [],
                      cwd: setup.root,
                      program: 'texlab',
                      env: setup.resolved.env
                  },
        initializationOptions: () => ({}),
        configuration: (section) => (section === 'texlab' ? texlabSettings(options.latex()) : null),
        followed: ['texlab'],
        refuses: (real) => refusesFile(serverFacts('texlab'), real),
        diagnostics: (params) => ({
            ...params,
            diagnostics: Array.isArray(params.diagnostics)
                ? params.diagnostics.filter(
                      (one) =>
                          typeof one !== 'object' ||
                          one === null ||
                          (one as { source?: unknown }).source !== BUILD_LOG_SOURCE
                  )
                : params.diagnostics
        }),
        capabilities: (language) => ({
            textDocumentSync: INCREMENTAL,
            hoverProvider: serving(language),
            definitionProvider: serving(language),
            referencesProvider: serving(language),
            documentHighlightProvider: serving(language),
            documentSymbolProvider: serving(language),
            workspaceSymbolProvider: serving(language),
            renameProvider: serving(language, { prepareProvider: true }),
            completionProvider: serving(language, {
                triggerCharacters: TEXLAB_TRIGGERS,
                resolveProvider: true
            }),
            foldingRangeProvider: serving(language),
            documentLinkProvider: serving(language),
            inlayHintProvider: serving(language)
        }),
        commands: []
    };
}

/**
 * The Markdown entry: `vscode-markdown-languageserver`, Microsoft's server for the links of a
 * Markdown file, under node's permission model with read access to oculus's own `node_modules` and
 * nothing else. It reads files only through the requests it makes of its client, which the entry
 * answers inside the served root (adapters/markdown/requests.ts). It publishes no diagnostics: the
 * relay asks for them (`pulls`). The entry adds its own mark and its own definition for a
 * backticked path (adapters/markdown/own/backticks.ts), the answers of the links between notes
 * (adapters/markdown/own/wiki.ts), and keeps every file `yaml` keeps from its server.
 */
function markdown(options: ServersOptions): ServerEntry {
    const extensions = options.markdown ?? ((): string[] => ['md']);
    return {
        ...factsOf('markdown'),
        adapter: markdownAdapter,
        launch: (setup) =>
            packaged(
                options,
                'markdown',
                ['vscode-markdown-languageserver', 'dist', 'node', 'workerMain.js'],
                setup,
                ['--permission', `--allow-fs-read=${ownModules(options)}`]
            ),
        initializationOptions: () => ({ markdownFileExtensions: extensions() }),
        configuration: () => null,
        clientWorkspace: { workspaceFolders: true, diagnostics: { refreshSupport: true } },
        requests: markdownRequests(extensions),
        registrations: [
            { method: 'workspace/didChangeConfiguration', params: { settings: MARKDOWN_SETTINGS } }
        ],
        pulls: true,
        fileEvents: () => extensions().map((extension) => `**/*.${extension}`),
        introduce: (changes) => introduceMarkdown(changes, extensions()),
        filesUnder: (folder, root, roots) => markdownFiles({ root, roots }, extensions(), folder),
        refuses: (real, roots) => isPrivateFile(real, roots),
        diagnostics: markdownDiagnostics,
        answers: (request, view) => answerWiki(request, view) ?? answerMarkdown(request, view),
        adds: addedWiki,
        results: markdownResults,
        capabilities: (language) => markdownCapabilities(language, serving, INCREMENTAL),
        commands: []
    };
}

/** The registry for this machine. */
export function createServers(options: ServersOptions): Servers {
    const entries = [
        pyright(options),
        clangd(),
        typescript(options),
        svelte(options),
        yaml(options),
        texlab(options),
        markdown(options)
    ];
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
                ...entry.clientWorkspace,
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
