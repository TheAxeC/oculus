// Layer 1, data. What the page and the server both know about each language server before any
// message is sent: its id, the Monaco languages it serves, the catalog keys of the words it is
// named by, whether the page draws its semantic tokens, whether the editor formats on type, its
// Organize Imports, the kinds of choice its root asks of the reader, and the actions of its own
// its tab offers.
//
// The registry in server/machine/lsp/servers.ts holds the other half of an entry, how the
// program is found and started and what it is told, keyed by the same ids. A server is one entry
// here and one there, and nothing else names a server or a language: the kit's client, the tab's
// actions, the status bar, the palette, the relay's library rules and the approvals read these.
//
// A `words` value is the key of a catalog line, which the page reads with its own `t`; the module
// holds no sentence.

/** The ids of the language servers. */
export type LspServerId = 'pyright' | 'clangd' | 'typescript' | 'svelte' | 'yaml' | 'texlab';

/**
 * What a server asks its reader to choose for a root: the Python interpreter, the compile
 * database, or whether the repository's own Svelte and Vite configuration may run.
 */
export type LspChoiceKind = 'interpreter' | 'database' | 'config';

/** The catalog keys of the words an entry is named by. */
type LspServerWords = {
    /** The server's name in the status bar and its tooltips. */
    name: string;
    /** The title of the tab's Restart Language Server action. */
    restart: string;
    /** The title of the tab's Show Language Server Output action. */
    output: string;
    /**
     * The catalog key of the program's install command, which the not-found tooltip names. A server
     * without one is told to be installed by name only.
     */
    install?: string;
    /** The title of the tab's action that opens the list of each choice the server asks for. */
    choice: Partial<Record<LspChoiceKind, string>>;
};

/** An action of its own a server's tab offers, beside the ones every server has. */
type LspExtra = 'header' | 'ast' | 'memory';

/** What one server is, as the page and the server both read it. */
export type LspServerFacts = {
    id: LspServerId;
    /** The Monaco language ids it serves. */
    languages: readonly string[];
    /** The program's name, which the log's tab is titled by. */
    program: string;
    words: LspServerWords;
    /** Whether the page draws the server's semantic tokens. */
    semanticTokens: boolean;
    /** Whether the editor formats as the reader types, through the server's own trigger keys. */
    formatOnType: boolean;
    /**
     * Organize Imports: null for a server that has none. `command` is the server's own command,
     * which the page offers as the action when the server answers the request for the kind
     * `source.organizeImports` with no action (pyright, which has it as a command only).
     */
    organizeImports: { command: string | null } | null;
    /** The choices its root asks for, in the order the status bar draws them. */
    choices: readonly LspChoiceKind[];
    /**
     * Whether a file under the folders of the interpreter the server runs with is named to the page
     * although its path holds a dot segment, which a Python library under a virtual environment's
     * folder needs (server/machine/lsp/library/rules.ts).
     */
    interpreterLibrary: boolean;
    /** The actions of its own the tab offers while the server answers. */
    extras: readonly LspExtra[];
    /**
     * The extensions, in lower case with the dot, of the files the server is never given although
     * they are in a language it serves: the page registers no model of such a file, and the relay
     * puts none on the server. Absent for a server that is given every file of its languages.
     */
    refusedExtensions?: readonly string[];
    /**
     * The kind of approval its start depends on beside its own choices: the server is started again
     * when that approval is made or taken back, as the Svelte server is for the Svelte
     * configuration and the TypeScript server, which loads the Svelte plugin on it, is.
     */
    approvedBy: LspChoiceKind | null;
};

/** The entries, one per server. */
const LSP_SERVERS: readonly LspServerFacts[] = [
    {
        id: 'pyright',
        languages: ['python'],
        program: 'pyright',
        words: {
            name: 'statusbar.server_pyright',
            restart: 'source.cmd_python_restart',
            output: 'source.cmd_python_output',
            choice: { interpreter: 'source.cmd_python_interpreter' }
        },
        semanticTokens: false,
        formatOnType: false,
        organizeImports: { command: 'pyright.organizeimports' },
        choices: ['interpreter'],
        interpreterLibrary: true,
        extras: [],
        approvedBy: null
    },
    {
        id: 'clangd',
        languages: ['c', 'cpp'],
        program: 'clangd',
        words: {
            name: 'statusbar.server_clangd',
            restart: 'source.cmd_clangd_restart',
            output: 'source.cmd_clangd_output',
            choice: { database: 'source.cmd_clangd_database' }
        },
        semanticTokens: true,
        formatOnType: true,
        organizeImports: null,
        choices: ['database'],
        interpreterLibrary: false,
        extras: ['header', 'ast', 'memory'],
        approvedBy: null
    },
    {
        id: 'typescript',
        languages: ['javascript', 'typescript'],
        program: 'typescript-language-server',
        words: {
            name: 'statusbar.server_typescript',
            restart: 'source.cmd_typescript_restart',
            output: 'source.cmd_typescript_output',
            choice: {}
        },
        semanticTokens: true,
        formatOnType: false,
        organizeImports: { command: null },
        choices: [],
        interpreterLibrary: false,
        extras: [],
        approvedBy: 'config'
    },
    {
        id: 'svelte',
        languages: ['svelte'],
        program: 'svelte-language-server',
        words: {
            name: 'statusbar.server_svelte',
            restart: 'source.cmd_svelte_restart',
            output: 'source.cmd_svelte_output',
            choice: { config: 'source.cmd_svelte_config' }
        },
        semanticTokens: true,
        formatOnType: false,
        organizeImports: { command: null },
        choices: ['config'],
        interpreterLibrary: false,
        extras: [],
        approvedBy: null
    },
    {
        id: 'yaml',
        languages: ['yaml'],
        program: 'yaml-language-server',
        words: {
            name: 'statusbar.server_yaml',
            restart: 'source.cmd_yaml_restart',
            output: 'source.cmd_yaml_output',
            choice: {}
        },
        semanticTokens: false,
        formatOnType: false,
        organizeImports: null,
        choices: [],
        interpreterLibrary: false,
        extras: [],
        approvedBy: null
    },
    {
        id: 'texlab',
        languages: ['latex', 'bibtex'],
        program: 'texlab',
        words: {
            name: 'statusbar.server_texlab',
            restart: 'source.cmd_latex_restart',
            output: 'source.cmd_latex_output',
            install: 'statusbar.ls_install_texlab',
            choice: {}
        },
        semanticTokens: false,
        formatOnType: false,
        organizeImports: null,
        choices: [],
        interpreterLibrary: false,
        extras: [],
        refusedExtensions: ['.rnw', '.jnw', '.pnw'],
        approvedBy: null
    }
];

/** The entry of a server. */
export function serverFacts(id: LspServerId): LspServerFacts {
    const found = LSP_SERVERS.find((one) => one.id === id);
    if (found === undefined) throw new Error(`no language server ${id}`);
    return found;
}

/** Whether a server is never given a file of this name: its extension is one the entry refuses. */
export function refusesFile(facts: LspServerFacts | undefined, name: string): boolean {
    const lower = name.toLowerCase();
    return (facts?.refusedExtensions ?? []).some((extension) => lower.endsWith(extension));
}

/**
 * Whether the library files the server of this id names may lie under its interpreter's folders.
 */
export function namesInterpreterLibrary(id: string): boolean {
    return LSP_SERVERS.find((one) => one.id === id)?.interpreterLibrary === true;
}

/** The entry of the server that serves a Monaco language, or undefined for a language none does. */
export function factsForLanguage(language: string): LspServerFacts | undefined {
    return LSP_SERVERS.find((one) => one.languages.includes(language));
}

/** Every language a server serves. */
export const SERVED_LANGUAGES: readonly string[] = LSP_SERVERS.flatMap((one) => one.languages);

/**
 * The page-level channel `lsp:workspace`: the messages of the page itself, which no language
 * server's document is on (which files other pages hold open). It names no language.
 */
export const WORKSPACE_LANGUAGE = 'workspace';

/** The palette commands that open the list of a kind of choice, without their colon. */
export type LspChoiceCommand = 'interpreter' | 'compile-database' | 'svelte-config';

/** The words and the palette command of each kind of choice. */
export type LspChoiceFacts = {
    /** The palette command that opens the list of the choice. */
    command: LspChoiceCommand;
    /** The status bar item of the choice. */
    item: string;
};

/** The facts of each kind of choice. */
export const LSP_CHOICES: Record<LspChoiceKind, LspChoiceFacts> = {
    interpreter: { command: 'interpreter', item: 'interpreter' },
    database: { command: 'compile-database', item: 'compile_database' },
    config: { command: 'svelte-config', item: 'svelte_config' }
};

/** The kind of choice a palette command opens the list of, or undefined for another command. */
export function choiceOfCommand(name: string): LspChoiceKind | undefined {
    return (Object.keys(LSP_CHOICES) as LspChoiceKind[]).find(
        (kind) => LSP_CHOICES[kind].command === name
    );
}

/** The kinds of choice the server of a language asks for; none for a language no server serves. */
export function choicesOfLanguage(language: string): readonly LspChoiceKind[] {
    return factsForLanguage(language)?.choices ?? [];
}
