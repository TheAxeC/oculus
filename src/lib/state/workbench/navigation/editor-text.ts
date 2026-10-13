// Layer 2, client state. The rules the status bar's source items read a file's text by: how the
// file indents, which line ending it uses and how many lines it holds, and the language the editor
// opens it under, the options the editor takes for a tab, and what a save does to a tab's text
// (trim, format, final newline). They are pure functions over the
// text, so the source tab that applies them and the tests that hold them share one rule and no
// browser. The editor itself moves the caret and rewrites the indentation and the line endings, on
// its own model.

import type { Indent, SourceDraft } from '../../sessions/source/draft.ts';
import type { SaveRules } from '../../sessions/source/source.svelte.ts';
import { languageOfFile, type LanguageMap } from '../../sources/fs.ts';
import type { FileText } from '../../sources/fs-transport.ts';
import { PLAIN } from '../../shared/words/languages.ts';
import { REPO_SETTINGS, resolveEditor } from '../../../data/helpers/editor/editor.ts';
import type {
    EditorOptions as ConfiguredEditor,
    LanguageRecords
} from '../../../data/helpers/editor/editor.ts';
import type { RepoSettings } from '../../../data/sources/config/editor-options.ts';

export type { Indent };

// The configured options and the order that resolves them for a tab, which
// data/helpers/editor/editor.ts holds, as the views read them.
export { REPO_SETTINGS, resolveEditor, toggleWrap } from '../../../data/helpers/editor/editor.ts';
export type { RepoSettings };
export type { ConfiguredEditor, LanguageRecords };
export type { WordWrap } from '../../../data/helpers/editor/editor.ts';

/** The two line endings a text file is written with. */
export type LineEnding = 'LF' | 'CRLF';

/** Where the caret is, lines and columns counted from one, and how many characters are selected. */
export type Caret = { line: number; column: number; selected: number };

/** The step sizes the indentation menu offers, VS Code's own three. */
export const INDENT_SIZES = [2, 4, 8] as const;

/** The step an editor is given before any configuration or file says otherwise, VS Code's. */
export const DEFAULT_INDENT: Indent = { tabs: false, size: 4 };

/** The widest step a file's spaces are read as. */
const WIDEST = 8;

/** The caret at the start of a file, before the reader has moved it. */
export const START: Caret = { line: 1, column: 1, selected: 0 };

/**
 * How a file indents, read from its own lines, or null when it does not indent. More lines opening
 * with a tab than with a space make it a tab file, whose step is the default width and is not the
 * file's to give. A space file's step is the change in leading spaces met most often between one
 * indented line and the next, from one to eight.
 */
export function detectIndent(text: string): Indent | null {
    const lines = text.split('\n').filter((line) => line.trim() !== '');
    let tabbed = 0;
    let spaced = 0;
    const steps = new Map<number, number>();
    let previous = 0;
    for (const line of lines) {
        if (line.startsWith('\t')) {
            tabbed += 1;
            continue;
        }
        const spaces = line.length - line.trimStart().length;
        if (spaces > 0 && line.startsWith(' ')) spaced += 1;
        const step = Math.abs(spaces - previous);
        if (step > 0 && step <= WIDEST) steps.set(step, (steps.get(step) ?? 0) + 1);
        previous = spaces;
    }
    if (tabbed > spaced) return { tabs: true, size: DEFAULT_INDENT.size };
    if (steps.size === 0) return null;
    let size = DEFAULT_INDENT.size;
    let seen = 0;
    for (const [step, count] of steps) {
        if (count > seen || (count === seen && step < size)) {
            size = step;
            seen = count;
        }
    }
    return { tabs: false, size };
}

/** The file's line ending: CRLF when any line ends so, and LF otherwise, an empty file included. */
export function lineEnding(text: string): LineEnding {
    return text.includes('\r\n') ? 'CRLF' : 'LF';
}

/** How many lines a text holds, one for an empty text, as the go-to-line range counts them. */
export function lineCount(text: string): number {
    return text.split('\n').length;
}

/**
 * The language the editor opens a text under: the one asked for, or plaintext for a text over the
 * paint limit (`editor.paint_limit_kb` of config/behavior.yml, in bytes), which the editor does not
 * colour, and for any text before the configuration has delivered a limit.
 */
export function shownLanguage(language: string, text: string, limit: number | null): string {
    return limit !== null && text.length <= limit ? language : PLAIN;
}

/** What the rules of a save are resolved from. */
export type SaveRulesInput = {
    options: ConfiguredEditor | null;
    languages: LanguageMap;
    paintLimit: number | null;
    /** The text of a root's settings file, as the file store holds it. */
    fileText: (root: string, path: string) => FileText;
    /** A settings file's text read by the rule of the configuration the page holds. */
    repoSettings: (text: string) => RepoSettings;
};

/** The records of the root's settings file, null when it has none that can be read. */
function recordsOf(input: SaveRulesInput, root: string): LanguageRecords | null {
    if (root === '') return null;
    const file = input.fileText(root, REPO_SETTINGS);
    if (file.loading || file.error !== '' || file.truncated) return null;
    const read = input.repoSettings(file.text);
    return read.kind === 'read' ? read.languages : null;
}

/**
 * What a save does to a source tab's text: whether it trims the spaces and tabs at the end of each
 * line, whether it ends the text with one line ending and whether it formats the document first.
 * They come from the configured options in the order `resolveEditor` states, for the language the
 * editor draws the tab in: the repository's `.oculus/settings.yml` record, then `editor.languages`,
 * then the global key. None is on until the configuration has arrived, since the page holds no
 * default for any of them. The tab's own options (views/shared/prose/source-options.ts) resolve the
 * same values by the same function; this is for the saves that no view makes, such as an automatic
 * save.
 */
export function saveRulesOf(
    input: SaveRulesInput,
    draft: SourceDraft,
    root: string,
    path: string
): SaveRules {
    const { options } = input;
    if (options === null) return { trim: false, finalNewline: false, formatOnSave: false };
    const chosen =
        draft.language === '' ? languageOfFile(path, draft.saved, input.languages) : draft.language;
    const resolved = resolveEditor({
        language: shownLanguage(chosen, draft.text, input.paintLimit),
        options,
        root: recordsOf(input, root),
        detected: null,
        tab: { indent: draft.indent, wrap: draft.wrap }
    });
    return {
        trim: resolved.trimTrailingWhitespace,
        finalNewline: resolved.finalNewline,
        formatOnSave: resolved.formatOnSave
    };
}
