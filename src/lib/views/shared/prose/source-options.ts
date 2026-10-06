// Layer 3, shared view partial, read by Source.svelte and the diff sections. What a source tab
// hands its editor for the indentation, the word wrap and the rulers: the configured values, the
// repository's `.oculus/settings.yml` read through the file store, the file's own indentation and
// the tab's own choices, resolved in the order data/helpers/editor.ts's `resolveEditor` states.
// The record looked up is the one of the language the editor draws the text in: the one chosen
// from the status bar, else the name's, and plaintext for a text past the paint limit.
//
// Every getter reads what it is handed afresh, so a `$derived` over one of them is made again when
// the tab's draft, the configuration, the root's settings file or the file store moves. The
// settings file is asked of the store once per read and parsed once per text and configuration, so
// a save of the file takes effect without a reload and a tab with no root asks for nothing.
//
// The page holds no default for any of these values. Until the config channel's first message the
// configured options are null, and so are the indentation, the word wrap and the rulers here, which
// the editor leaves to its own until the configuration arrives.

import { languageOf, type LanguageMap } from '$lib/state/sources/fs';
import type { FileText } from '$lib/state/sources/fs-transport';
import {
    detectIndent,
    REPO_SETTINGS,
    resolveEditor,
    shownLanguage,
    toggleWrap,
    type ConfiguredEditor,
    type Indent,
    type LanguageRecords,
    type RepoSettings,
    type WordWrap
} from '$lib/state/workbench/navigation/editor-text';

/** What the module reads, each as a function so that a read is a tracked one. */
export type SourceOptionsInput = {
    path: () => string;
    root: () => string;
    draft: () => { text: string; language: string; indent: Indent | null; wrap: string | null };
    languages: () => LanguageMap;
    options: () => ConfiguredEditor | null;
    /** A settings file's text read by the rule of the configuration the page holds. */
    repoSettings: (text: string) => RepoSettings;
    paintLimit: () => number | null;
    fileText: (root: string, path: string) => FileText;
};

/** The options of a tab as the editor takes them. */
export type SourceOptions = {
    /** The language the tab paints in: the one chosen from the status bar, or the name's. */
    readonly language: string;
    /** The language the editor opens the text under, plaintext past the paint limit. */
    readonly shown: string;
    /** The indentation in force, null until the configuration has arrived. */
    readonly indent: Indent | null;
    /** The word wrap in force: the tab's toggle, else the configured one; null until then. */
    readonly wrap: WordWrap | null;
    /** The word wrap without the tab's toggle; null until the configuration has arrived. */
    readonly configuredWrap: WordWrap | null;
    readonly rulers: number[] | null;
    /** The word wrap after Alt+Z, or null when it returns to the configured one. */
    readonly toggled: WordWrap | null;
    /** Whether a save first formats the document with its language server. */
    readonly formatOnSave: boolean;
};

/** Make the options of one tab over what it is handed. */
export function createSourceOptions(input: SourceOptionsInput): SourceOptions {
    // The last settings text parsed and the last indentation detected, each kept by its text.
    let parsed: {
        text: string;
        options: ConfiguredEditor;
        records: LanguageRecords | null;
    } | null = null;
    let detected: { text: string; indent: Indent | null } | null = null;

    /** The records of the root's settings file, null when it has none that can be read. */
    function repository(options: ConfiguredEditor): LanguageRecords | null {
        const root = input.root();
        if (root === '') return null;
        const file = input.fileText(root, REPO_SETTINGS);
        if (file.loading || file.error !== '' || file.truncated) return null;
        if (parsed?.text !== file.text || parsed.options !== options) {
            const read = input.repoSettings(file.text);
            parsed = {
                text: file.text,
                options,
                records: read.kind === 'read' ? read.languages : null
            };
        }
        return parsed.records;
    }

    /** The indentation the text's own lines give. */
    function detect(text: string): Indent | null {
        if (detected?.text !== text) detected = { text, indent: detectIndent(text) };
        return detected.indent;
    }

    function language(): string {
        const { language: chosen } = input.draft();
        return chosen === '' ? languageOf(input.path(), input.languages()) : chosen;
    }

    function shown(): string {
        return shownLanguage(language(), input.draft().text, input.paintLimit());
    }

    function resolved(): ReturnType<typeof resolveEditor> | null {
        const options = input.options();
        if (options === null) return null;
        const { text, indent, wrap } = input.draft();
        return resolveEditor({
            language: shown(),
            options,
            root: repository(options),
            detected: detect(text),
            tab: { indent, wrap }
        });
    }

    return {
        get language() {
            return language();
        },
        get shown() {
            return shown();
        },
        get indent() {
            return resolved()?.indent ?? null;
        },
        get wrap() {
            return resolved()?.wordWrap ?? null;
        },
        get configuredWrap() {
            return resolved()?.configuredWrap ?? null;
        },
        get rulers() {
            return resolved()?.rulers ?? null;
        },
        get toggled() {
            const one = resolved();
            return one === null ? null : toggleWrap(one.wordWrap, one.configuredWrap);
        },
        get formatOnSave() {
            return resolved()?.formatOnSave ?? false;
        }
    };
}
