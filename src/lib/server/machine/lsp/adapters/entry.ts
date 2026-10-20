// Layer 2, server. The types of the language servers' registry (servers.ts): what an entry is told
// about the root it starts a server for, how its program is launched and made ready, the hooks of
// its adapter, the entry itself, what it knows of the page it answers, and what the registry needs
// of the machine. They live here and servers.ts names them again, so an adapter reads them without
// importing the registry.

import type { LspCode, LspToPage, LspToServer } from '../../../../data/model/index.ts';
import type { ReferenceIndex } from '../../../../data/snapshot/references/model.ts';
import type { FileText } from '../../../../data/snapshot/references/rename.ts';
import type { LatexBuilding } from '../../../../data/sources/config/settings/latex.ts';
import type { ServedRoot } from '../uris.ts';
import type { DiagnosticView, Introduction, Registration, ServerAsk } from './asks.ts';

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
    /**
     * The program an adapter found at an absolute path, with the environment it runs in, for an
     * entry whose child gets an environment of its own (texlab).
     */
    resolved?: { path: string; env: NodeJS.ProcessEnv };
};

/**
 * The program, its arguments and the folder it runs in. `env` is the whole environment of the
 * child; absent, the child has oculus's own.
 */
export type Launch = {
    command: string;
    args: string[];
    cwd: string;
    program: string;
    env?: NodeJS.ProcessEnv;
};

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
    /** oculus's own environment, whose PATH finds the programs a server is started with. */
    env: NodeJS.ProcessEnv;
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

/** A server an app registered, as the relay reads it. */
export type AppServerInfo = {
    /** The view id of the app. */
    app: string;
    /** The root key the app is confined to; empty for a machine app, which has every root. */
    root: string;
    id: string;
    /** The name the status item and the diagnostics' source show. */
    name: string;
    selector: readonly { language: string; pattern: string }[];
    sections: readonly string[];
    initializationOptions: unknown;
};

export type ServerEntry = {
    /** A shipped server's id, or `<app>#<server>` for a server an app registered. */
    id: string;
    /** The registration of the app's server this entry was made for; none for a shipped entry. */
    app?: AppServerInfo;
    /** The Monaco language ids it serves. */
    languages: readonly string[];
    /** The program's name, which the status item names when it is not found. */
    program: string;
    /** What the server needs of a root beyond its program: its settings, choices and approvals. */
    adapter: Adapter;
    /** How to start it for this root, or null when its program is not there. */
    launch(setup: Setup): Launch | null;
    /** The source its diagnostics carry when the server names none: an app server's name. */
    source?: string;
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
    /** What the server needs of the client's `workspace` capabilities, which only it is told. */
    clientWorkspace?: Record<string, unknown>;
    /**
     * The requests the server makes of its client that are the entry's to answer, by method. A
     * handler returns the result or a promise of it, or throws or rejects to answer with an error;
     * a method it does not name is left to the relay.
     */
    requests?: Readonly<Record<string, (params: unknown, ask: ServerAsk) => unknown>>;
    /** The notifications sent to the server right after `initialized`. */
    registrations?: readonly Registration[];
    /**
     * Whether the server answers `textDocument/diagnostic` and publishes nothing: the relay then
     * asks for a document's diagnostics 500 ms after it was opened or last changed, and for every
     * open document when the server asks for a refresh.
     */
    pulls?: boolean;
    /**
     * The globs of the files whose changes on disk the server is told of whether or not it
     * registered a watcher for them, as a client that synchronizes file events tells it: the
     * server keeps the files it read until it hears they changed.
     */
    fileEvents?: () => string[];
    /**
     * The requests the server is asked ahead of the notice of changes on disk, one for each change
     * it would otherwise drop; it is told after the last answer, or after a bound on the wait.
     */
    introduce?(changes: readonly { uri: string; type: number }[]): Introduction[];
    /** The files of the entry's kind under a folder, from disk: the notice of a folder created. */
    filesUnder?(folder: string, root: ServedRoot, roots: readonly ServedRoot[]): Promise<string[]>;
    /**
     * How many times a server that exits on its own is started again within three minutes before
     * it stays stopped until Restart; one when absent.
     */
    restarts?: number;
    /** Whether a file is kept from the server: it is never put on one. */
    refuses?(real: string, roots: readonly ServedRoot[]): boolean;
    /**
     * The diagnostics of a file before the page sees them: the `publishDiagnostics` params with
     * the entries the page is not shown taken out.
     */
    diagnostics?(params: Record<string, unknown>, view: DiagnosticView): Record<string, unknown>;
    /**
     * An answer of the server to a request of the page, by the request's method, before it goes
     * to the page: the result with whatever must not reach the page taken out.
     */
    results?(method: string, result: unknown, root: ServedRoot): unknown;
    /**
     * An answer to a request of the page that the entry gives itself, from what the relay holds,
     * before the request goes to the server. The result or the error is the page's answer; nothing
     * means the request goes on to the server. It answers whether or not the server is running.
     */
    answers?(request: PageRequest, view: PageView): PageAnswer | undefined;
    /**
     * A result of the entry's own for a request of the page that its server answers too, from what
     * the relay holds: the relay joins it to the server's (held/requests/merged.ts), the entry's
     * first, and answers it alone when the server has none to give. Nothing means the server's
     * answer goes as it is.
     */
    adds?(request: PageRequest, view: PageView): unknown;
    /**
     * The sections of `workspace/configuration` that follow the shipped settings: the server is
     * asked again when the answer for one changes.
     */
    followed?: readonly string[];
};

/** A request of the page, as it came: the method and its params with the page's addresses. */
export type PageRequest = { method: string; params: unknown };

/** A document the page holds open, as the page sees it. */
export type OpenDocument = {
    /** The file's real path. */
    real: string;
    /** The address the page holds it open under. */
    pageUri: string;
    /** The version the page holds it at. */
    version: number;
    text: string;
};

/** What an entry's `answers` knows of the page it answers. */
export type PageView = {
    roots: readonly ServedRoot[];
    /** The index of the hub keys the latest snapshot build made. */
    references: ReferenceIndex;
    /** The flat text catalog, which the words of an answer are read from. */
    catalog: Record<string, string>;
    /** Every document the page holds open, one for each file. */
    documents: readonly OpenDocument[];
    /** The document the page names by an address, or undefined when it holds none by it. */
    document(uri: unknown): OpenDocument | undefined;
    /** The text of a file on disk by its real path, or why it cannot be had. */
    read(real: string): FileText;
    /** Whether a page other than this one holds the file, by its real path, open in a tab. */
    heldElsewhere(real: string): boolean;
};

/** The page's answer to a request: its result, or an error with the words of the refusal. */
export type PageAnswer = { result: unknown } | { error: { code: number; message: string } };

/** The registry: the entries and the lookup by language. */
export type Servers = {
    entries: readonly ServerEntry[];
    forLanguage(language: string): ServerEntry | undefined;
    forId(id: string): ServerEntry;
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
    /** The LaTeX settings in force, read at each start and each configuration answer. */
    latex: () => LatexBuilding;
    /** The extensions of Markdown files, without the dot; `md` alone when absent. */
    markdown?: () => string[];
};
