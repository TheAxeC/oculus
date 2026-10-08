// Layer 1, data. The types of the editor's options, the order a value is taken in, and the path of
// a repository's `.oculus/settings.yml`. The options themselves are read from the merged
// configuration and the repository's file by the options catalog's rule, in
// data/sources/config/editor-options.ts.
//
// A value is taken from the first layer that sets it: the tab's own choice, the file's own
// indentation, the repository's record, `editor.languages`, then the global key (`resolveEditor`);
// `format_on_save` has no global key, so it is the record's or off. The trim of trailing whitespace
// and the final newline of a save are global keys the records override the same way.
// A tab's own indentation or word wrap is taken only when the catalog's entry for the key takes it
// too, which the options carry as `fitsTabSize` and `fitsWrap`.

import type { editor } from 'monaco-editor';

/** Monaco's word wrap settings. */
export type WordWrap = NonNullable<editor.IEditorOptions['wordWrap']>;

/** Monaco's whitespace settings. */
export type Whitespace = NonNullable<editor.IEditorOptions['renderWhitespace']>;

/** The options one language sets, each absent when the language does not set it. */
export type LanguageRecord = {
    tabSize?: number;
    insertSpaces?: boolean;
    wordWrap?: WordWrap;
    rulers?: number[];
    formatOnSave?: boolean;
    trimTrailingWhitespace?: boolean;
    finalNewline?: boolean;
};

/** When a tab with unsaved text is saved without a press of Save: `editor.autosave`. */
export type Autosave = 'off' | 'after_delay' | 'on_focus_change';

/** The records of a configuration or of a repository, by language, in a map with no prototype. */
export type LanguageRecords = Record<string, LanguageRecord | undefined>;

/** The editor's options: the global keys and the records of `editor.languages`. */
export type EditorOptions = {
    tabSize: number;
    insertSpaces: boolean;
    wordWrap: WordWrap;
    minimap: boolean;
    renderWhitespace: Whitespace;
    stickyScroll: boolean;
    autosave: Autosave;
    /** The milliseconds after the last edit that `after_delay` saves a tab. */
    autosaveDelay: number;
    trimTrailingWhitespace: boolean;
    finalNewline: boolean;
    languages: LanguageRecords;
    /** Whether a width of a step is one the catalog's `editor.tab_size` takes. */
    fitsTabSize: (size: number) => boolean;
    /** Whether a word is one the catalog's `editor.word_wrap` takes. */
    fitsWrap: (word: string) => word is WordWrap;
};

/** The path of a repository's settings file, in the root its files are served from. */
export const REPO_SETTINGS = '.oculus/settings.yml';

/** The indentation of a tab: spaces or a tab, and the width of a step. */
export type TabIndent = { tabs: boolean; size: number };

/** What a tab holds of its own: the indentation and the word wrap its reader chose. */
export type TabChoice = { indent: TabIndent | null; wrap: string | null };

/** What `resolveEditor` is asked: the tab's language, the layers it takes values from. */
export type EditorAsk = {
    language: string;
    options: EditorOptions;
    /** The records of the tab's repository file, null for a tab with no such file. */
    root: LanguageRecords | null;
    /** The indentation the file's own lines give, null for a file with nothing to detect. */
    detected: TabIndent | null;
    tab: TabChoice;
};

/** What a tab's editor takes. */
export type EditorResolved = {
    indent: TabIndent;
    wordWrap: WordWrap;
    /** The word wrap without the tab's own choice, which Alt+Z returns to. */
    configuredWrap: WordWrap;
    rulers: number[];
    /** Whether a save first formats the document with its language server. */
    formatOnSave: boolean;
    /** Whether a save takes the spaces and tabs off the end of each line. */
    trimTrailingWhitespace: boolean;
    /** Whether a save ends the text with one line ending and takes off the empty lines after it. */
    finalNewline: boolean;
};

/**
 * The first layer that sets a field: the repository's record, `editor.languages`, then the global
 * key. A field the language's record does not set falls to the next layer on its own.
 */
function layered<K extends keyof LanguageRecord, G>(
    ask: EditorAsk,
    field: K,
    global: G
): NonNullable<LanguageRecord[K]> | G {
    const own = ask.root?.[ask.language]?.[field] ?? ask.options.languages[ask.language]?.[field];
    return own ?? global;
}

/**
 * The options a tab's editor takes. Indentation: the tab's choice from the status bar when the
 * catalog takes its width, else the file's own when it indents with spaces, else the configured
 * order for the width, with a file indented by tabs keeping its tabs. Word wrap: the tab's toggle
 * when the catalog takes its word, else the configured order.
 * Rulers: the repository's record, else `editor.languages`, else none.
 */
export function resolveEditor(ask: EditorAsk): EditorResolved {
    const { detected, tab, options } = ask;
    const configuredWrap = layered(ask, 'wordWrap', options.wordWrap);
    let indent: TabIndent;
    if (tab.indent !== null && options.fitsTabSize(tab.indent.size)) {
        indent = tab.indent;
    } else if (detected !== null && !detected.tabs) {
        indent = detected;
    } else {
        indent = {
            tabs: detected?.tabs ?? !layered(ask, 'insertSpaces', options.insertSpaces),
            size: layered(ask, 'tabSize', options.tabSize)
        };
    }
    return {
        indent,
        wordWrap: tab.wrap !== null && options.fitsWrap(tab.wrap) ? tab.wrap : configuredWrap,
        configuredWrap,
        rulers: [...layered(ask, 'rulers', [] as number[])],
        formatOnSave: layered(ask, 'formatOnSave', false),
        trimTrailingWhitespace: layered(
            ask,
            'trimTrailingWhitespace',
            options.trimTrailingWhitespace
        ),
        finalNewline: layered(ask, 'finalNewline', options.finalNewline)
    };
}

/**
 * The tab's word wrap after Alt+Z, as VS Code's toggle gives it: off when the value in force wraps,
 * the configured value when it is off and the configured one wraps, on when both are off. The tab
 * keeps null for the configured value.
 */
export function toggleWrap(inForce: WordWrap, configured: WordWrap): WordWrap | null {
    const next = inForce !== 'off' ? 'off' : configured !== 'off' ? configured : 'on';
    return next === configured ? null : next;
}
