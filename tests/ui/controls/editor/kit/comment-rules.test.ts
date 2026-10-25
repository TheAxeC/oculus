// Layer 3, primitive tests. The language settings oculus gives Monaco (kit/rite/settings.ts,
// `registerSettings`). Every language the editor registers has a comment rule, so Cmd+/ and
// Shift+Alt+A comment a line or a selection in a file of any of them: either the settings oculus
// gives hold a `comments` field for the id, or Monaco's own settings of the id do. Monaco's are
// read from the module Monaco loads them from (`definitions/<id>/<id>.js`, C's from C++'s), and
// JSON's from what its language mode sets up, so a row follows a Monaco upgrade rather than a list
// kept here. And Julia, which Monaco has settings of too, keeps VS Code's brackets and pairs
// however late Monaco gives its own.
//
// The settings are given to a stand-in of the ways Monaco takes them, over Monaco's own registry of
// language settings, which resolves a language's settings field by field as the editor does. An
// app's settings of a language (kit/languages/register.ts) win over oculus's for the fields they
// hold, given to the same stand-in.
//
// Monaco's modules read its editor API, which needs a page, at the time they load; the test hands
// them a stand-in of the parts they read (the indent actions, and the calls the JSON mode makes,
// which the stand-in records), and a stand-in of the JSON mode's worker, which needs a page too.

import type * as Monaco from 'monaco-editor';
import { LanguageConfigurationRegistry } from 'monaco-editor/editor/common/languages/languageConfigurationRegistry';
import { describe, expect, it, vi } from 'vitest';
import { SHIKI_LANGUAGES } from '../../../../../src/lib/ui/controls/editor/kit/languages/grammars.ts';
import { registerSettings } from '../../../../../src/lib/ui/controls/editor/kit/rite/settings.ts';
import { applyAppLanguages } from '../../../../../src/lib/ui/controls/editor/kit/languages/register.ts';
import type { AppLanguageKit } from '../../../../../src/lib/data/helpers/files/apps/tools/language-kit.ts';

type Configuration = Monaco.languages.LanguageConfiguration;

vi.mock('monaco-editor/editor/editor.api.js', () => {
    const none = (): { dispose: () => void } => ({ dispose: () => undefined });
    /** The settings Monaco's modules give through the stand-in, by language id. */
    const modes = new Map<string, Configuration>();
    return {
        modes,
        languages: {
            IndentAction: { None: 0, Indent: 1, IndentOutdent: 2, Outdent: 3 },
            setLanguageConfiguration: (id: string, configuration: Configuration) => {
                modes.set(id, configuration);
                return none();
            },
            registerDocumentFormattingEditProvider: none,
            registerDocumentRangeFormattingEditProvider: none,
            registerCompletionItemProvider: none,
            registerHoverProvider: none,
            registerDocumentSymbolProvider: none,
            setTokensProvider: none,
            registerColorProvider: none,
            registerFoldingRangeProvider: none,
            registerSelectionRangeProvider: none
        },
        editor: {},
        Range: class {
            readonly standIn = true;
        },
        Uri: {},
        MarkerSeverity: {}
    };
});

vi.mock('monaco-editor/languages/features/json/workerManager.js', () => ({
    WorkerManager: class {
        disposed = false;
        dispose(): void {
            this.disposed = true;
        }
    }
}));

/** The stand-in of Monaco's editor API, which Monaco's modules import under this name. */
const EDITOR_API = 'monaco-editor/editor/editor.api.js';

/** The rank Monaco's `setLanguageConfiguration` registers settings at (standaloneLanguages.js). */
const MONACO_RANK = 100;

/**
 * A stand-in of the ways Monaco takes a language's settings, over Monaco's own registry of them:
 * its public `setLanguageConfiguration` and its configuration service's `register` at a rank.
 * `given` keeps the last settings either way was handed for a language.
 */
function monacoStandIn(): {
    registry: LanguageConfigurationRegistry;
    given: Map<string, Configuration>;
    register: (id: string, configuration: Configuration, priority: number) => Monaco.IDisposable;
    languages: {
        setLanguageConfiguration: (id: string, configuration: Configuration) => Monaco.IDisposable;
    };
} {
    const registry = new LanguageConfigurationRegistry();
    const given = new Map<string, Configuration>();
    const register = (
        id: string,
        configuration: Configuration,
        priority: number
    ): Monaco.IDisposable => {
        given.set(id, configuration);
        return registry.register(id, configuration, priority);
    };
    return {
        registry,
        given,
        register,
        languages: {
            setLanguageConfiguration: (id, configuration) =>
                register(id, configuration, MONACO_RANK)
        }
    };
}

/** The part of JSON's language mode the test calls. */
type JsonMode = {
    setupMode: (defaults: {
        languageId: string;
        modeConfiguration: object;
        onDidChange: () => { dispose: () => void };
    }) => void;
};

/** The module of JSON's language mode, which Monaco's package declares no types for. */
const JSON_MODE = 'monaco-editor/languages/features/json/jsonMode.js';

/** The settings JSON's language mode gives Monaco when it is set up for `json`. */
async function jsonMode(): Promise<Configuration | undefined> {
    const mode = (await import(/* @vite-ignore */ JSON_MODE)) as JsonMode;
    mode.setupMode({
        languageId: 'json',
        modeConfiguration: {},
        onDidChange: () => ({ dispose: () => undefined })
    });
    const api = (await import(/* @vite-ignore */ EDITOR_API)) as {
        modes: Map<string, Configuration>;
    };
    return api.modes.get('json');
}

/** Monaco's own settings of a language, or undefined when Monaco has none. */
async function monacoConfiguration(id: string): Promise<Configuration | undefined> {
    if (id === 'json') return jsonMode();
    const folder = id === 'c' ? 'cpp' : id;
    try {
        const found = (await import(
            /* @vite-ignore */ `monaco-editor/languages/definitions/${folder}/${folder}.js`
        )) as { conf?: Configuration };
        return found.conf;
    } catch {
        return undefined;
    }
}

describe('the comment rule of every language the editor registers', () => {
    const monaco = monacoStandIn();
    registerSettings(monaco);

    it.each(SHIKI_LANGUAGES.map((id) => ({ id })))('$id has a comment rule', async ({ id }) => {
        const ours = monaco.registry.getLanguageConfiguration(id)?.underlyingConfig.comments;
        const own = (await monacoConfiguration(id))?.comments;
        expect(ours ?? own).toBeDefined();
    });
});

describe("Julia's settings", () => {
    it("keep VS Code's brackets and auto-closing pairs when Monaco gives its own after them", async () => {
        const monaco = monacoStandIn();
        registerSettings(monaco);
        const vscode = monaco.given.get('julia');
        const { conf } = await import('monaco-editor/languages/definitions/julia/julia.js');
        // Monaco gives its own settings last, as when it loads its Julia module once a Julia file
        // is first opened.
        monaco.languages.setLanguageConfiguration('julia', conf);
        const julia = monaco.registry.getLanguageConfiguration('julia')?.underlyingConfig;
        expect(conf.autoClosingPairs).not.toEqual(vscode?.autoClosingPairs);
        expect(julia?.brackets).toEqual(vscode?.brackets);
        expect(julia?.autoClosingPairs).toEqual(vscode?.autoClosingPairs);
    });
});

/** A kit whose one app gives Shell its own comment rule, and nothing else. */
const SHELL_APP: AppLanguageKit = {
    languages: [
        { id: 'shellscript', label: 'Shell', configuration: { comments: { lineComment: '//' } } }
    ],
    grammars: [],
    snippets: [],
    semantic: { types: [], modifiers: [], scopes: [] },
    schemas: [],
    served: []
};

/** The parts of Monaco's API that putting an app's languages in reads, beside the settings. */
function appApi(): typeof Monaco {
    const json = { diagnosticsOptions: {}, setDiagnosticsOptions: () => undefined };
    return {
        languages: { getLanguages: () => [{ id: 'shellscript' }], register: () => undefined },
        json: { jsonDefaults: json }
    } as unknown as typeof Monaco;
}

describe("an app's settings of a language", () => {
    it('win over the settings oculus gives the language', () => {
        const monaco = monacoStandIn();
        registerSettings(monaco);
        expect(monaco.given.get('shellscript')?.comments).toEqual({ lineComment: '#' });
        applyAppLanguages(appApi(), monaco, SHELL_APP, null);
        const shell = monaco.registry.getLanguageConfiguration('shellscript')?.underlyingConfig;
        expect(shell?.comments).toEqual({ lineComment: '//' });
    });
});
