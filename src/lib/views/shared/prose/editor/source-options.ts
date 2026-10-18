// Layer 3, shared view partial, read by Source.svelte and the diff sections. What a source tab
// hands its editor for the indentation, the word wrap and the rulers: the configured values, the
// folder's `.oculus/settings.yml`, the file's own indentation and the tab's own choices, resolved
// in the order data/helpers/editor/editor.ts's `resolveEditor` states. The record looked up is the
// one of the language the editor draws the text in: the one chosen from the status bar, else the
// name's, and plaintext for a text past the paint limit.
//
// Every getter reads what it is handed afresh, so a `$derived` over one of them is made again when
// the tab's draft, the configuration or the folder list moves. The settings text comes with the
// folder list (`settingsOf`), which is read again when the file changes, so no request is sent for
// it and a tab rooted at a folder's repository path reads that folder's file. It is parsed once per
// text and configuration, so a save of the file takes effect without a reload.
//
// The page holds no default for any of these values. Until the config channel's first message the
// configured options are null, and so are the indentation, the word wrap and the rulers here, which
// the editor leaves to its own until the configuration arrives.

import { languageOfFile, settingsOf, type FsRoot, type LanguageMap } from '$lib/state/sources/fs';
import type { EditorOptions } from '$lib/ui/controls/editor/options';
import {
    detectIndent,
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
    draft: () => {
        text: string;
        /** The text on disk, whose first line decides the language of a file no name decides. */
        saved: string;
        language: string;
        indent: Indent | null;
        wrap: string | null;
    };
    languages: () => LanguageMap;
    options: () => ConfiguredEditor | null;
    /** A settings file's text read by the rule of the configuration the page holds. */
    repoSettings: (text: string) => RepoSettings;
    paintLimit: () => number | null;
    /** The folders of the workspace, each with its settings text. */
    folders: () => readonly FsRoot[];
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

/**
 * The options a diff's editor takes: the word wrap and rulers resolved for its file, and the
 * configured whitespace and sticky scroll, none of them until the configuration has arrived. A
 * diff draws no minimap, which the editor's options leave out.
 */
export function diffOptions(
    resolved: SourceOptions,
    configured: EditorOptions | null
): EditorOptions {
    return {
        ...(resolved.wrap === null ? {} : { wordWrap: resolved.wrap }),
        ...(resolved.rulers === null ? {} : { rulers: resolved.rulers }),
        ...(configured === null
            ? {}
            : {
                  renderWhitespace: configured.renderWhitespace,
                  stickyScroll: configured.stickyScroll
              })
    };
}

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
        const text = settingsOf(input.folders(), input.root());
        if (text === null) return null;
        if (parsed?.text !== text || parsed.options !== options) {
            const read = input.repoSettings(text);
            parsed = { text, options, records: read.kind === 'read' ? read.languages : null };
        }
        return parsed.records;
    }

    /** The indentation the text's own lines give. */
    function detect(text: string): Indent | null {
        if (detected?.text !== text) detected = { text, indent: detectIndent(text) };
        return detected.indent;
    }

    function language(): string {
        const { language: chosen, saved } = input.draft();
        return chosen === '' ? languageOfFile(input.path(), saved, input.languages()) : chosen;
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
