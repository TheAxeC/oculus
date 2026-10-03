// Layer 1, data. The `editor:` block of config/behavior.yml and a repository's
// `.oculus/settings.yml`: the size above which the source tab's editor opens a file as plaintext,
// and the options the editor takes (tab size, spaces or tabs, word wrap, rulers, the minimap,
// whitespace and sticky scroll), with the order a value is taken in.
//
// Both readers of the paint limit are here because the two sides must give the same answer. The
// server requires the key at start, so a missing or mistyped one stops it with the key named
// instead of reaching a page, and the editor reads the cap out of the merged configuration on every
// paint. The editor's read answers null for a configuration that carries no usable value, which is
// what the page holds until the config channel's first message lands; the editor paints plain over
// that, and the server's check at start is what makes a served run always carry a cap.
//
// The options are read leniently: a key that is missing is its default and says nothing, and a
// value of the wrong type or outside its words or range is read as the default and comes back as a
// problem naming the key, which the Findings view lists. The defaults are VS Code's. A language's
// record holds any of `tab_size` (1 to 8), `insert_spaces`, `word_wrap` and `rulers`; the records
// are held in maps with no prototype, so a language called `__proto__` is a problem and merges
// nothing.
//
// A value is taken from the first layer that sets it: the tab's own choice, the file's own
// indentation, the repository's record, `editor.languages`, then the global key (`resolveEditor`).

import { parseDocument } from 'yaml';
import { z } from 'zod';
import { fields, isMap } from './guards.ts';
import { registered } from '../prose/languages.ts';

/** The cap as written: a finite number above zero, in kilobytes. */
const paintLimitShape = z.number().positive();

/** The cap in bytes, and null for a configuration carrying no usable `editor.paint_limit_kb`. */
export function paintLimit(config: Record<string, unknown>): number | null {
    const kb = paintLimitShape.safeParse(fields(config.editor).paint_limit_kb);
    return kb.success ? kb.data * 1024 : null;
}

/**
 * The same cap, required: the server calls it at start, so a bad key is named there and nowhere
 * else.
 */
export function requirePaintLimit(config: Record<string, unknown>): number {
    const bytes = paintLimit(config);
    if (bytes === null) {
        throw new Error('config/behavior.yml: editor.paint_limit_kb must be a number above zero');
    }
    return bytes;
}

/** Monaco's four word wrap settings. */
export const WRAP_WORDS = ['off', 'on', 'wordWrapColumn', 'bounded'] as const;
export type WordWrap = (typeof WRAP_WORDS)[number];

/** Monaco's five whitespace settings. */
export const WHITESPACE_WORDS = ['none', 'boundary', 'selection', 'trailing', 'all'] as const;
export type Whitespace = (typeof WHITESPACE_WORDS)[number];

/** The widest and narrowest tab size. */
const TAB_SIZES = { min: 1, max: 8 };

/** The options one language sets, each absent when the language does not set it. */
export type LanguageRecord = {
    tabSize?: number;
    insertSpaces?: boolean;
    wordWrap?: WordWrap;
    rulers?: number[];
};

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
    languages: LanguageRecords;
};

/** Why a value was not read: outside its words or range, an unknown name, or not a map. */
export type ProblemReason = 'value' | 'unknown-language' | 'unknown-field' | 'not-a-map';

/** One value that was not read, by the dotted key it was written at. */
export type EditorProblem = { key: string; reason: ProblemReason };

/** A fresh map with no prototype. */
function records(): LanguageRecords {
    return Object.create(null) as LanguageRecords;
}

/** The options of a configuration carrying none, VS Code's. */
function defaults(): EditorOptions {
    return {
        tabSize: 4,
        insertSpaces: true,
        wordWrap: 'off',
        minimap: true,
        renderWhitespace: 'selection',
        stickyScroll: true,
        languages: records()
    };
}

/** Whether a value is a whole number from the narrowest tab size to the widest. */
function isTabSize(value: unknown): value is number {
    return (
        typeof value === 'number' &&
        Number.isInteger(value) &&
        value >= TAB_SIZES.min &&
        value <= TAB_SIZES.max
    );
}

/** Whether a value is one of the words. */
function isWord<T extends string>(words: readonly T[], value: unknown): value is T {
    return typeof value === 'string' && (words as readonly string[]).includes(value);
}

/** Whether a value is a list of column numbers, each a whole number from one. */
function isRulers(value: unknown): value is number[] {
    return (
        Array.isArray(value) &&
        value.every((one) => typeof one === 'number' && Number.isInteger(one) && one >= 1)
    );
}

/** Read the fields of one language's record, naming the ones not read under `key`. */
function readRecord(
    raw: Record<string, unknown>,
    key: string,
    problems: EditorProblem[]
): LanguageRecord {
    const record: LanguageRecord = {};
    for (const [field, value] of Object.entries(raw)) {
        const at = `${key}.${field}`;
        if (field === 'tab_size') {
            if (isTabSize(value)) record.tabSize = value;
            else problems.push({ key: at, reason: 'value' });
        } else if (field === 'insert_spaces') {
            if (typeof value === 'boolean') record.insertSpaces = value;
            else problems.push({ key: at, reason: 'value' });
        } else if (field === 'word_wrap') {
            if (isWord(WRAP_WORDS, value)) record.wordWrap = value;
            else problems.push({ key: at, reason: 'value' });
        } else if (field === 'rulers') {
            if (isRulers(value)) record.rulers = [...value];
            else problems.push({ key: at, reason: 'value' });
        } else {
            problems.push({ key: at, reason: 'unknown-field' });
        }
    }
    return record;
}

/** Read a map of language records; the entries not read are named under `prefix`. */
function readLanguages(
    raw: Record<string, unknown>,
    prefix: string,
    problems: EditorProblem[]
): LanguageRecords {
    const known = new Set(registered());
    const read = records();
    for (const [name, record] of Object.entries(raw)) {
        const key = `${prefix}${name}`;
        if (!known.has(name)) {
            problems.push({ key, reason: 'unknown-language' });
        } else if (!isMap(record)) {
            problems.push({ key, reason: 'not-a-map' });
        } else {
            const got = readRecord(record, key, problems);
            if (Object.keys(got).length > 0) read[name] = got;
        }
    }
    return read;
}

/**
 * The editor's options out of the merged configuration, and the keys that were not read. A key that
 * is missing is the default with no problem; a value outside its words or range is the default
 * with a problem naming the key; a language record is read field by field.
 */
export function readEditorOptions(config: Record<string, unknown>): {
    options: EditorOptions;
    problems: EditorProblem[];
} {
    const block = fields(config.editor);
    const options = defaults();
    const problems: EditorProblem[] = [];
    const target: Record<string, unknown> = options;
    const take = (name: string, key: string, valid: (value: unknown) => boolean): void => {
        if (!(key in block)) return;
        if (valid(block[key])) target[name] = block[key];
        else problems.push({ key: `editor.${key}`, reason: 'value' });
    };
    take('tabSize', 'tab_size', isTabSize);
    take('insertSpaces', 'insert_spaces', (value) => typeof value === 'boolean');
    take('wordWrap', 'word_wrap', (value) => isWord(WRAP_WORDS, value));
    take('minimap', 'minimap', (value) => typeof value === 'boolean');
    take('renderWhitespace', 'render_whitespace', (value) => isWord(WHITESPACE_WORDS, value));
    take('stickyScroll', 'sticky_scroll', (value) => typeof value === 'boolean');
    const languages = block.languages;
    if (languages === undefined || languages === null) return { options, problems };
    if (!isMap(languages)) {
        problems.push({ key: 'editor.languages', reason: 'not-a-map' });
        return { options, problems };
    }
    options.languages = readLanguages(languages, 'editor.languages.', problems);
    return { options, problems };
}

/** The editor's options out of the merged configuration, each unread value its default. */
export function editorOptions(config: Record<string, unknown>): EditorOptions {
    return readEditorOptions(config).options;
}

/** What a repository's `.oculus/settings.yml` says: its records, or why it was not read. */
export type RepoSettings =
    | { kind: 'read'; languages: LanguageRecords; skipped: EditorProblem[] }
    | { kind: 'unparsed'; line: string }
    | { kind: 'not-a-map' };

/** The path of a repository's settings file, in the root its files are served from. */
export const REPO_SETTINGS = '.oculus/settings.yml';

/**
 * Read a repository's settings file: the `languages:` map of the same records as
 * `editor.languages`, and no other key. An empty file, a file without `languages:` and `languages:
 * null` set nothing. A file that does not parse is `unparsed` with the parser's first line, and a
 * `languages:` that is not a map is `not-a-map`. An entry or field that cannot be read is skipped
 * and named under `languages.`, and the rest is read.
 */
export function parseRepoSettings(text: string): RepoSettings {
    const document = parseDocument(text);
    if (document.errors.length > 0) {
        return { kind: 'unparsed', line: document.errors[0].message.split('\n')[0] };
    }
    const top: unknown = document.toJS();
    const languages = isMap(top) ? top.languages : undefined;
    const skipped: EditorProblem[] = [];
    if (languages === undefined || languages === null) {
        return { kind: 'read', languages: records(), skipped };
    }
    if (!isMap(languages)) return { kind: 'not-a-map' };
    return { kind: 'read', languages: readLanguages(languages, 'languages.', skipped), skipped };
}

/** The indentation of a tab: spaces or a tab, and the width of a step. */
export type TabIndent = { tabs: boolean; size: number };

/** What a tab holds of its own: the indentation and the word wrap its reader chose. */
export type TabChoice = { indent: TabIndent | null; wrap: WordWrap | null };

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
 * The options a tab's editor takes. Indentation: the tab's choice from the status bar, else the
 * file's own when it indents with spaces, else the configured order for the width, with a file
 * indented by tabs keeping its tabs. Word wrap: the tab's toggle, else the configured order.
 * Rulers: the repository's record, else `editor.languages`, else none.
 */
export function resolveEditor(ask: EditorAsk): EditorResolved {
    const { detected, tab, options } = ask;
    const configuredWrap = layered(ask, 'wordWrap', options.wordWrap);
    let indent: TabIndent;
    if (tab.indent !== null) {
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
        wordWrap: tab.wrap ?? configuredWrap,
        configuredWrap,
        rulers: [...layered(ask, 'rulers', [] as number[])]
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
