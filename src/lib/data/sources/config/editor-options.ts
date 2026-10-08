// Layer 1, data. The `editor:` block of config/behavior.yml and a repository's
// `.oculus/settings.yml` read by the options catalog's rule (catalog/value-rule.ts), like every
// other setting (settings.ts): the editor's keys, and the records of `editor.languages`, each
// field of a record against the fields the catalog's `editor.languages` entry lists.
//
// A key that is missing is the catalog's `default`; a value the rule refuses is the `default` and
// comes back as a problem naming the key, which the Findings view lists. A field of a language
// record the rule refuses is not read and is a problem naming it, and so are a field the entry does
// not list, a language the editor does not colour and a record that is not a map. The records are
// held in maps with no prototype, so a language called `__proto__` is a problem and merges nothing.
//
// The page holds no catalog until the config channel's first message, and no default is written in
// code, so `editorOptions` answers null until then.

import { parseDocument } from 'yaml';
import type {
    Autosave,
    EditorOptions,
    LanguageRecord,
    LanguageRecords,
    WordWrap
} from '../../helpers/editor.ts';
import { byKey, isMap } from '../../helpers/guards.ts';
import { registered } from '../../prose/languages.ts';
import type { FieldSpec } from './catalog/options.ts';
import { valueProblem } from './catalog/value-rule.ts';
import { noRule, settingEntry, settingReader, type SettingProblem } from './settings.ts';

/**
 * Why a value was not read: the rule refused it, or the name or record is not one the editor has.
 */
export type EditorProblem =
    SettingProblem | { key: string; where: 'unknown-language' | 'unknown-field' | 'not-a-map' };

/**
 * Why an entry of a repository's settings file was skipped: an editor problem, or a top-level key
 * the file does not read.
 */
export type RepoProblem = EditorProblem | { key: string; where: 'unknown-key' };

/** What a repository's `.oculus/settings.yml` says: its records, or why it was not read. */
export type RepoSettings =
    | { kind: 'read'; languages: LanguageRecords; skipped: RepoProblem[] }
    | { kind: 'unparsed'; line: string }
    | { kind: 'not-a-map' };

/** A fresh map with no prototype. */
function records(): LanguageRecords {
    return Object.create(null) as LanguageRecords;
}

/** The fields the catalog lists for a language's record, and the one that names the language. */
function languageFields(config: Record<string, unknown>): {
    name: FieldSpec;
    fields: Record<string, FieldSpec>;
} {
    const fields = settingEntry(config, 'editor.languages').fields;
    if (fields?.key === undefined) throw noRule('editor.languages');
    return { name: fields.key, fields };
}

/** Read the fields of one language's record, naming the ones not read under `key`. */
function readRecord(
    raw: Record<string, unknown>,
    key: string,
    specs: Record<string, FieldSpec>,
    problems: EditorProblem[]
): LanguageRecord {
    const record: LanguageRecord = {};
    for (const [field, value] of Object.entries(raw)) {
        const at = `${key}.${field}`;
        const spec = field === 'key' ? undefined : byKey(specs, field);
        if (spec === undefined) {
            problems.push({ key: at, where: 'unknown-field' });
            continue;
        }
        const problem = valueProblem(spec, value);
        if (problem !== null) {
            problems.push({ key: at, where: 'field', problem, spec });
            continue;
        }
        switch (field) {
            case 'tab_size':
                if (typeof value === 'number') record.tabSize = value;
                break;
            case 'insert_spaces':
                if (typeof value === 'boolean') record.insertSpaces = value;
                break;
            case 'word_wrap':
                // The rule has checked the word against the entry's values, which are Monaco's.
                if (typeof value === 'string') record.wordWrap = value as WordWrap;
                break;
            case 'rulers':
                if (Array.isArray(value)) {
                    record.rulers = value.filter((one): one is number => typeof one === 'number');
                }
                break;
            case 'format_on_save':
                if (typeof value === 'boolean') record.formatOnSave = value;
                break;
            case 'trim_trailing_whitespace':
                if (typeof value === 'boolean') record.trimTrailingWhitespace = value;
                break;
            case 'final_newline':
                if (typeof value === 'boolean') record.finalNewline = value;
                break;
            default:
                problems.push({ key: at, where: 'unknown-field' });
        }
    }
    return record;
}

/** Read a map of language records; the entries not read are named under `prefix`. */
function readLanguages(
    raw: Record<string, unknown>,
    prefix: string,
    config: Record<string, unknown>,
    problems: EditorProblem[]
): LanguageRecords {
    const { name: nameSpec, fields } = languageFields(config);
    const known = { sourced: registered() };
    const read = records();
    for (const [name, record] of Object.entries(raw)) {
        const key = `${prefix}${name}`;
        if (valueProblem(nameSpec, name, known) !== null) {
            problems.push({ key, where: 'unknown-language' });
        } else if (!isMap(record)) {
            problems.push({ key, where: 'not-a-map' });
        } else {
            const got = readRecord(record, key, fields, problems);
            if (Object.keys(got).length > 0) read[name] = got;
        }
    }
    return read;
}

/**
 * The editor's options out of the merged configuration, and the keys that were not read. A key that
 * is missing is the catalog's default with no problem; a value the rule refuses is the default with
 * a problem naming the key; a language record is read field by field. It throws when the catalog
 * holds no rule for one of the keys.
 */
export function readEditorOptions(config: Record<string, unknown>): {
    options: EditorOptions;
    problems: EditorProblem[];
} {
    const found: SettingProblem[] = [];
    const read = settingReader(config, found);
    const tabSize = settingEntry(config, 'editor.tab_size');
    const wrap = settingEntry(config, 'editor.word_wrap');
    const options: EditorOptions = {
        tabSize: read.number('editor.tab_size'),
        insertSpaces: read.flag('editor.insert_spaces'),
        // The rule has checked the word against the entry's values, which are Monaco's.
        wordWrap: read.text('editor.word_wrap') as WordWrap,
        minimap: read.flag('editor.minimap'),
        renderWhitespace: read.text(
            'editor.render_whitespace'
        ) as EditorOptions['renderWhitespace'],
        stickyScroll: read.flag('editor.sticky_scroll'),
        // The rule has checked the word against the entry's values, which are the three modes.
        autosave: read.text('editor.autosave') as Autosave,
        autosaveDelay: read.number('editor.autosave_delay_ms'),
        trimTrailingWhitespace: read.flag('editor.trim_trailing_whitespace'),
        finalNewline: read.flag('editor.final_newline'),
        languages: records(),
        fitsTabSize: (size) => valueProblem(tabSize, size) === null,
        fitsWrap: (word): word is WordWrap => valueProblem(wrap, word) === null
    };
    const problems: EditorProblem[] = [...found];
    const block = isMap(config.editor) ? config.editor : {};
    const languages = block.languages;
    if (languages === undefined || languages === null) return { options, problems };
    if (!isMap(languages)) {
        problems.push({ key: 'editor.languages', where: 'not-a-map' });
        return { options, problems };
    }
    options.languages = readLanguages(languages, 'editor.languages.', config, problems);
    return { options, problems };
}

/**
 * The editor's options out of the merged configuration, each unread value its default, and null for
 * a configuration that holds no catalog yet, which is what the page holds until the config
 * channel's first message lands.
 */
export function editorOptions(config: Record<string, unknown>): EditorOptions | null {
    try {
        return readEditorOptions(config).options;
    } catch {
        return null;
    }
}

/**
 * Read a repository's settings file: the `languages:` map of the same records as
 * `editor.languages`, each record read by the same rule against the same entry of the merged
 * configuration. Any other top-level key is skipped and named. An empty file, a file without
 * `languages:` and `languages: null` set nothing. A file that does not parse is `unparsed` with
 * the parser's first line, and a
 * `languages:` that is not a map is `not-a-map`. An entry or field that cannot be read is skipped
 * and named under `languages.`, and the rest is read. A configuration that holds no catalog yet
 * sets nothing.
 */
export function parseRepoSettings(text: string, config: Record<string, unknown>): RepoSettings {
    const document = parseDocument(text);
    if (document.errors.length > 0) {
        return { kind: 'unparsed', line: document.errors[0].message.split('\n')[0] };
    }
    const top: unknown = document.toJS();
    const languages = isMap(top) ? top.languages : undefined;
    const keys: RepoProblem[] = isMap(top)
        ? Object.keys(top)
              .filter((key) => key !== 'languages')
              .map((key) => ({ key, where: 'unknown-key' }))
        : [];
    if (languages === undefined || languages === null) {
        return { kind: 'read', languages: records(), skipped: keys };
    }
    if (!isMap(languages)) return { kind: 'not-a-map' };
    const problems: EditorProblem[] = [];
    try {
        const read = readLanguages(languages, 'languages.', config, problems);
        return { kind: 'read', languages: read, skipped: [...keys, ...problems] };
    } catch {
        return { kind: 'read', languages: records(), skipped: keys };
    }
}
