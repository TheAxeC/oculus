// Layer 1, data. The types of what an app adds to the tools: the contributions its manifest
// declares for languages, grammars, snippets, semantic tokens, schemas, defaults, debuggers, tasks
// and problem matchers (the `contributes` key of `app.yml`, in VS Code's names and shapes), and
// what its running host registered with the tools (the `app-tools` channel). The manifest's part
// rides on `AppRow` on the `apps` channel; the host's part is a payload of its own, since a host
// registers while the manifest is unchanged.

/** The icon of a language: a file of the app for each theme, empty for none. */
type AppLanguageIcon = { light: string; dark: string };

/** A language an app declares or extends; an id of a shipped language adds file rules to it. */
export type AppLanguage = {
    id: string;
    aliases: string[];
    /** Extensions with their dot. */
    extensions: string[];
    /** Whole file names. */
    filenames: string[];
    /** Globs over the path from the root. */
    filenamePatterns: string[];
    /** A regular expression over the first line of a file no name rule decides. */
    firstLine: string;
    /** The language configuration file of the app (comments, brackets, folding), or empty. */
    configuration: string;
    icon: AppLanguageIcon | null;
};

/** A TextMate grammar of the app. */
export type AppGrammar = {
    language: string;
    scopeName: string;
    path: string;
    embeddedLanguages: Record<string, string>;
    injectTo: string[];
    tokenTypes: Record<string, string>;
};

/** A snippet file of the app for one language. */
export type AppSnippetFile = { language: string; path: string };

/** A semantic token type or modifier an app's server or provider may answer. */
export type AppSemanticType = { id: string; superType: string; description: string };
export type AppSemanticModifier = { id: string; description: string };

/** The TextMate scopes that colour semantic token selectors, for one language or all. */
export type AppSemanticScopes = { language: string; scopes: Record<string, string[]> };

/** A JSON schema file of the app applied to the files whose paths match. */
export type AppJsonValidation = { fileMatch: string[]; url: string };

/** One initial configuration or snippet an Add Configuration offers. */
type AppConfigurationSnippet = { label: string; description: string; body: unknown };

/** A debugger an app declares. */
export type AppDebugger = {
    type: string;
    label: string;
    languages: string[];
    program: string;
    args: string[];
    /** `node` is the Node that runs oculus; any other name a program on the PATH. */
    runtime: string;
    runtimeArgs: string[];
    /** The keys a `launch` or `attach` configuration may carry, by request. */
    configurationAttributes: { launch: Record<string, unknown>; attach: Record<string, unknown> };
    initialConfigurations: Record<string, unknown>[];
    configurationSnippets: AppConfigurationSnippet[];
};

/** A language the breakpoints of the gutter are allowed in. */
export type AppBreakpoint = { language: string };

/** A task type an app defines, with the properties its tasks carry. */
export type AppTaskDefinition = {
    type: string;
    required: string[];
    properties: Record<string, unknown>;
};

/** One pattern of a problem matcher: a regular expression and the groups that name each part. */
export type AppProblemPattern = {
    regexp: string;
    file: number;
    /** The group holding `line,column` or `line,column,endLine,endColumn`; 0 for none. */
    location: number;
    line: number;
    column: number;
    endLine: number;
    endColumn: number;
    severity: number;
    code: number;
    message: number;
    /** A last pattern with `loop` is matched again for every line that follows. */
    loop: boolean;
};

/** A problem matcher an app declares; its tasks name it as `$<name>`. */
export type AppProblemMatcher = {
    name: string;
    owner: string;
    source: string;
    /** `absolute`, `relative` or `autoDetect`; relative to the folder the task runs in. */
    fileLocation: string;
    patterns: AppProblemPattern[];
    severity: string;
    /** A task that never ends: the lines that begin and end one round of its output. */
    background: { activeOnStart: boolean; beginsPattern: string; endsPattern: string } | null;
};

/** A named pattern a matcher may refer to. */
export type AppProblemPatternDef = { name: string; patterns: AppProblemPattern[] };

/** A task an app's host gave, as plain data. */
export type AppTaskDescription = {
    /** The key the host holds the task by. */
    key: string;
    name: string;
    /** The task's `source`, the first part of its label. */
    source: string;
    type: string;
    definition: Record<string, unknown>;
    /** `global`, `workspace` or the file URI of the folder the task belongs to. */
    scope: string;
    /**
     * How the task runs: a shell line, a program, a callback with a pseudoterminal, or not at all.
     */
    kind: 'shell' | 'process' | 'custom' | 'none';
    group: { kind: 'build' | 'test'; isDefault: boolean } | null;
    isBackground: boolean;
    detail: string;
    /** The names of the problem matchers, each as the app wrote it (`$name`). */
    problemMatchers: string[];
};

/**
 * What a command that an app's host runs carries: the app, the task type and definition, and the
 * problem matchers to read the output with. `key` names the task in the host that gave it, and is
 * empty for a `commands.yml` entry the host has not resolved.
 */
export type AppTaskRef = {
    /** The app's view id. */
    app: string;
    appTitle: string;
    type: string;
    key: string;
    /** The first part of the label, the task's `source`; empty for a `commands.yml` entry. */
    label: string;
    definition: Record<string, unknown>;
    background: boolean;
    /** The group of the task, for the default build and test. */
    group: 'build' | 'test' | null;
    isDefault: boolean;
    /** The folder the task belongs to as a file URI; empty for the workspace and global tasks. */
    folder: string;
};

/** What a terminal that runs an app's task tells the page: whose it is, and the app's title. */
export type AppJob = { app: string; title: string; type: string; background: boolean };

/** A language the editor registers for an app: a new id, its name in the picker, its brackets. */
type AppEditorLanguage = {
    id: string;
    label: string;
    /** The language configuration file as the app wrote it, or null for none. */
    configuration: unknown;
};

/** A TextMate grammar of an app, read, for the language it colours. */
export type AppEditorGrammar = {
    /** The language id; empty for a grammar that only injects into others. */
    language: string;
    scopeName: string;
    grammar: unknown;
    embeddedLanguages: Record<string, string>;
    injectTo: string[];
    tokenTypes: Record<string, string>;
};

/** One snippet of an app's snippet file. */
export type AppEditorSnippet = {
    name: string;
    prefix: string[];
    body: string;
    description: string;
};

/** The snippets of one language, the files of the apps joined. */
export type AppEditorSnippets = { language: string; snippets: AppEditorSnippet[] };

/** A JSON schema applied to the files whose paths match. */
type AppEditorSchema = {
    /** An address that names the schema: the app's view id and the file. */
    url: string;
    fileMatch: string[];
    schema: unknown;
};

/**
 * What the editor of a page is given by the acting apps: the languages to register, their
 * grammars, snippets, semantic token rules and schemas, and the languages a language server
 * serves, shipped and apps' joined.
 */
export type AppLanguageKit = {
    languages: AppEditorLanguage[];
    grammars: AppEditorGrammar[];
    snippets: AppEditorSnippets[];
    semantic: {
        types: AppSemanticType[];
        modifiers: AppSemanticModifier[];
        scopes: AppSemanticScopes[];
    };
    schemas: AppEditorSchema[];
    /** The ids of the languages a language server serves. */
    served: string[];
};

/** A language server an app's host registered, and where it is. */
export type AppToolsServer = {
    id: string;
    selector: { language: string; pattern: string }[];
    output: string;
    /** The sections of settings it is sent. */
    sections: string[];
};

/** The language features an app's host serves from inside, as one server. */
type AppToolsProviders = {
    selector: { language: string; pattern: string }[];
    /** The protocol capabilities the providers answer, as a server's `initialize` result holds. */
    capabilities: Record<string, unknown>;
};

/** A resource state of a source control group, with the root and path of its file in the scope. */
export type AppScmResource = {
    uri: string;
    /** The root key and path of the file; empty for a resource outside every workspace folder. */
    root: string;
    path: string;
    /** The command a press runs; null when a press opens the file. */
    command: { command: string; title: string } | null;
    contextValue: string;
    strikeThrough: boolean;
    faded: boolean;
    tooltip: string;
};

export type AppScmGroup = {
    id: string;
    label: string;
    hideWhenEmpty: boolean;
    resources: AppScmResource[];
};

/** A command of a source control: its id, title and tooltip. */
type AppScmCommand = { command: string; title: string; tooltip: string };

/** A source control an app's host created, drawn as a section of the Repositories view. */
export type AppScmState = {
    /** The view id of the app that holds it. */
    app: string;
    id: string;
    label: string;
    /** The root key of the folder it covers; empty when the folder is outside the scope. */
    root: string;
    rootUri: string;
    input: {
        value: string;
        placeholder: string;
        enabled: boolean;
        visible: boolean;
        /** How many times the host wrote the box's value, so a page applies the last write. */
        writes: number;
    };
    count: number | null;
    acceptCommand: AppScmCommand | null;
    statusCommands: AppScmCommand[];
    commitTemplate: string;
    quickDiff: boolean;
    groups: AppScmGroup[];
};

/** The decoration of a file in the Files view, the answers of the apps' providers joined. */
export type AppDecoration = {
    badge: string;
    tooltip: string;
    /** A VS Code colour id (`charts.blue`); empty for none. */
    color: string;
    propagate: boolean;
};

/**
 * The files whose decorations changed lately, each with the epoch of its change, and the epoch of
 * the last change of every file. A page applies the entries newer than the epoch it read last.
 */
export type AppDecorationChanges = {
    /** Grows with each change. */
    epoch: number;
    /** The epoch at which every file last changed; 0 for never. */
    allAt: number;
    files: { root: string; path: string; epoch: number }[];
};

/** What one running host registered with the tools. */
export type AppToolsHost = {
    /** The app's view id. */
    app: string;
    servers: AppToolsServer[];
    providers: AppToolsProviders | null;
    collections: string[];
    debuggers: { type: string; factory: boolean; configurations: boolean }[];
    taskTypes: string[];
    sources: AppScmState[];
    /** Whether the host serves file decorations. */
    decorations: boolean;
    contentSchemes: string[];
};

/** The `app-tools` channel: what each running host registered with the tools. */
export type AppToolsPayload = { hosts: AppToolsHost[]; decorations: AppDecorationChanges };
