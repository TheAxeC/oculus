// Layer 1, data. The types of what an app adds to the shell: the contributions its manifest
// declares (the `contributes` key of `app.yml`, in VS Code's names and shapes) and what its running
// host registers and asks of the page (the `app-shell` channel). The manifest's part rides on
// `AppRow` on the `apps` channel; the host's part is a payload of its own, since a host registers
// and asks while the manifest is unchanged.

import type {
    AppBreakpoint,
    AppDebugger,
    AppGrammar,
    AppJsonValidation,
    AppLanguage,
    AppProblemMatcher,
    AppProblemPatternDef,
    AppSemanticModifier,
    AppSemanticScopes,
    AppSemanticType,
    AppSnippetFile,
    AppTaskDefinition
} from './model-apps-tools.ts';

/** A command an app declares. `icon` is `$(<glyph name>)` or a path of a file of the app. */
export type AppCommand = {
    command: string;
    title: string;
    category: string;
    icon: string;
    /** A when clause; the command is drawn disabled while it does not hold. */
    enablement: string;
};

/** A key bound to a command, in VS Code's key syntax; a platform key replaces `key` there. */
export type AppKeybinding = {
    command: string;
    key: string;
    mac: string;
    linux: string;
    win: string;
    when: string;
    args: unknown;
};

/** One entry of a menu: a command in a group, with the clause that shows it. */
export type AppMenuEntry = { command: string; when: string; group: string; alt: string };

/** A container of views in the side bar (`activitybar`) or the panel. */
export type AppContainer = { id: string; title: string; icon: string };

/** The two kinds of container an app may add. */
export type AppContainerKind = 'activitybar' | 'panel';

/** One view of a container: a tree the host fills, or a page of the app. */
export type AppViewEntry = {
    id: string;
    name: string;
    type: 'tree' | 'webview';
    when: string;
    /** The `.html` file of a `webview` view, empty for a tree. */
    entry: string;
};

/** A custom editor: the files it opens and the page of the app that draws them. */
export type AppCustomEditor = {
    viewType: string;
    displayName: string;
    /** The file name patterns the editor opens. */
    selector: string[];
    priority: 'default' | 'option';
    entry: string;
};

/** The kinds a declared setting may have. */
export type AppSettingType = 'boolean' | 'number' | 'integer' | 'string' | 'array';

/** One setting an app declares; `key` is the whole key, the app's name first. */
export type AppSetting = {
    key: string;
    type: AppSettingType;
    /** The value used while none is stored, of the setting's type. */
    default: unknown;
    description: string;
    /** The values a text or number setting is limited to, empty for no limit. */
    enum: (string | number)[];
    enumDescriptions: string[];
    minimum: number | null;
    maximum: number | null;
};

/** The settings an app declares, under the section title the Settings view draws. */
type AppConfiguration = { title: string; properties: AppSetting[] };

/** A VS Code colour theme file of the app. */
type AppTheme = {
    label: string;
    uiTheme: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';
    path: string;
};

/** A VS Code file icon theme file of the app. */
type AppIconTheme = { id: string; label: string; path: string };

/**
 * A display language of the app: VS Code's `languageId` and names, and `path`, the folder of the
 * app's files that holds the translation of oculus's words (the translation whose `id` is
 * `oculus`), YAML files nested as config/text/ is.
 */
type AppLocalization = {
    languageId: string;
    languageName: string;
    localizedLanguageName: string;
    path: string;
};

/** The contributions of an app's manifest as the reader checked them. */
export type AppContributes = {
    commands: AppCommand[];
    keybindings: AppKeybinding[];
    /** Entries by menu id, holding the ids the shell draws and no other. */
    menus: Record<string, AppMenuEntry[]>;
    viewsContainers: Record<AppContainerKind, AppContainer[]>;
    /** Views by the id of their container, or `explorer`. */
    views: Record<string, AppViewEntry[]>;
    customEditors: AppCustomEditor[];
    configuration: AppConfiguration | null;
    themes: AppTheme[];
    iconThemes: AppIconTheme[];
    localizations: AppLocalization[];
    languages: AppLanguage[];
    grammars: AppGrammar[];
    snippets: AppSnippetFile[];
    semanticTokenTypes: AppSemanticType[];
    semanticTokenModifiers: AppSemanticModifier[];
    semanticTokenScopes: AppSemanticScopes[];
    jsonValidation: AppJsonValidation[];
    /**
     * The defaults the app sets: `[<languageId>]` blocks of editor options, and its own settings.
     */
    configurationDefaults: Record<string, unknown>;
    debuggers: AppDebugger[];
    breakpoints: AppBreakpoint[];
    taskDefinitions: AppTaskDefinition[];
    problemMatchers: AppProblemMatcher[];
    problemPatterns: AppProblemPatternDef[];
};

/** A value a context key holds. */
export type ContextValue = string | number | boolean | null;

/** An item a host's status bar item is drawn with, as `createStatusBarItem` describes it. */
export type AppStatusItem = {
    id: string;
    alignment: 'left' | 'right';
    priority: number;
    visible: boolean;
    text: string;
    tooltip: string;
    command: string;
    name: string;
    /** The tone behind the item, empty for none. */
    background: '' | 'warning' | 'error';
    accessibility: string;
};

/** A tree view a host registered: what changed since the page read it, and what it shows. */
export type AppTreeState = {
    view: string;
    /** How many times the elements of a handle changed; the empty handle is the root. */
    changes: Record<string, number>;
    title: string;
    description: string;
    message: string;
    badge: { value: number; tooltip: string } | null;
    canSelectMany: boolean;
    showCollapseAll: boolean;
    /** The handle the host asked to reveal, with a count that grows with each ask. */
    reveal: { handle: string; count: number } | null;
};

/** A web view panel a host opened. */
export type AppPanelState = {
    /** The panel's tab id, which the host sends it messages by. */
    id: string;
    viewType: string;
    title: string;
    entry: string;
    preserveFocus: boolean;
    /** How many times the host asked to reveal the panel; the page shows its tab on each. */
    reveal: number;
};

/** What one running host registered. */
export type AppShellHost = {
    /** The app's view id. */
    app: string;
    /** The ids of the commands the host registered a handler for. */
    commands: string[];
    statusItems: AppStatusItem[];
    trees: AppTreeState[];
    panels: AppPanelState[];
    /** The context keys the host set, each starting with the app's name and a dot. */
    context: Record<string, ContextValue>;
};

/** A choice of a quick pick. */
export type AppPickItem = {
    label: string;
    description: string;
    detail: string;
    picked: boolean;
};

/** A message the host asks to show, with the buttons it offers. */
export type AppMessageRequest = {
    kind: 'message';
    tone: 'info' | 'warning' | 'error';
    message: string;
    items: string[];
    modal: boolean;
};

/** A quick pick the host asks to show. */
type AppQuickPickRequest = {
    kind: 'quickPick';
    items: AppPickItem[];
    title: string;
    placeHolder: string;
    canPickMany: boolean;
    matchOnDescription: boolean;
    matchOnDetail: boolean;
};

/** An input box the host asks to show; `validate` says the host checks each value. */
type AppInputBoxRequest = {
    kind: 'inputBox';
    title: string;
    prompt: string;
    value: string;
    placeHolder: string;
    password: boolean;
    validate: boolean;
};

/** A progress the host runs, in a notification or in the status bar. */
export type AppProgressRequest = {
    kind: 'progress';
    location: 'notification' | 'window';
    title: string;
    cancellable: boolean;
    message: string;
    /** The share done, 0 to 100, or null while the task reports none. */
    percent: number | null;
};

/**
 * A command the host runs on the page that has the focus: one of oculus's own (`target` empty), or
 * one that only an open tab of the app `target` registered.
 */
type AppCommandRequest = {
    kind: 'command';
    command: string;
    args: unknown[];
    target: string;
};

/** A web view panel the host asks the page that has the focus to open; `panel` is its tab id. */
export type AppPanelRequest = { kind: 'panel'; panel: string } & Omit<
    AppPanelState,
    'reveal' | 'id'
>;

/** Every tab with unsaved text saves it; the answer is whether all of them did. */
type AppSaveAllRequest = { kind: 'saveAll' };

/** A host asks the pages to show or hide one of the terminals of its app in the Terminal tab. */
type AppShowTerminalRequest = { kind: 'showTerminal'; terminal: string; preserveFocus: boolean };
type AppHideTerminalRequest = { kind: 'hideTerminal'; terminal: string };

/** What a request asks. */
export type AppRequestBody =
    | AppMessageRequest
    | AppQuickPickRequest
    | AppInputBoxRequest
    | AppProgressRequest
    | AppCommandRequest
    | AppPanelRequest
    | AppSaveAllRequest
    | AppShowTerminalRequest
    | AppHideTerminalRequest;

/**
 * An open request of a host to the pages. It shows on every page until the first answer settles it;
 * a request of kind `command`, `panel`, `saveAll`, `showTerminal` or `hideTerminal` is taken by the
 * page that has the focus.
 */
export type AppRequest = { id: string; app: string } & AppRequestBody;

/** The `app-shell` channel: what each running host registered and what it waits to be answered. */
export type AppShellPayload = { hosts: AppShellHost[]; requests: AppRequest[] };
