// Layer 1, data. The editor options an app's `configurationDefaults` may set for one language, by
// the names VS Code gives them, and the record each becomes: the same fields as an entry of
// `editor.languages` (data/helpers/editor/editor.ts). A name oculus has no option for, and a value
// of another kind than the option takes, is not read; the reader of the manifest words each as a
// finding, and the editor reads the rest as the layer between the user's `editor.languages` and
// the global keys.

import type { LanguageRecord, LanguageRecords } from '../../../editor/editor.ts';
import { isMap } from '../../../guards.ts';
import { appActive } from '../apps.ts';

/** The words Monaco's `wordWrap` takes. */
const WRAPS = ['off', 'on', 'wordWrapColumn', 'bounded'];

/** One option: the field of the record, and whether a value is of the kind it takes. */
type Option = { field: keyof LanguageRecord; takes: (value: unknown) => boolean };

const OPTIONS: Record<string, Option> = {
    'editor.tabSize': {
        field: 'tabSize',
        takes: (value) => typeof value === 'number' && Number.isInteger(value) && value > 0
    },
    'editor.insertSpaces': { field: 'insertSpaces', takes: (value) => typeof value === 'boolean' },
    'editor.wordWrap': {
        field: 'wordWrap',
        takes: (value) => typeof value === 'string' && WRAPS.includes(value)
    },
    'editor.rulers': {
        field: 'rulers',
        takes: (value) =>
            Array.isArray(value) &&
            value.every((one) => typeof one === 'number' && Number.isInteger(one) && one > 0)
    },
    'editor.formatOnSave': { field: 'formatOnSave', takes: (value) => typeof value === 'boolean' },
    'files.trimTrailingWhitespace': {
        field: 'trimTrailingWhitespace',
        takes: (value) => typeof value === 'boolean'
    },
    'files.insertFinalNewline': {
        field: 'finalNewline',
        takes: (value) => typeof value === 'boolean'
    }
};

/** What a block of one language's defaults came to: the record, and the names left out. */
export type LanguageDefaults = { record: LanguageRecord; dropped: string[] };

/** The language a `[<languageId>]` key of `configurationDefaults` names, or null for any other. */
export function languageOfBlock(key: string): string | null {
    const found = /^\[([^\]\s]+)\]$/.exec(key);
    return found === null ? null : found[1];
}

/** Read the block of one language: the options oculus has, and the names it left out. */
export function readLanguageDefaults(block: unknown): LanguageDefaults {
    const record: Record<string, unknown> = {};
    const dropped: string[] = [];
    if (!isMap(block)) return { record, dropped };
    for (const [name, value] of Object.entries(block)) {
        const option = Object.hasOwn(OPTIONS, name) ? OPTIONS[name] : undefined;
        if (!option?.takes(value)) dropped.push(name);
        else record[option.field] = value;
    }
    return { record: record, dropped };
}

/**
 * The defaults of several apps for one language joined: the first app in the Views list's order
 * that sets a field keeps it.
 */
function joinLanguageDefaults(records: readonly LanguageRecord[]): LanguageRecord {
    const joined: Record<string, unknown> = {};
    for (const record of records) {
        for (const [field, value] of Object.entries(record)) {
            if (!Object.hasOwn(joined, field)) joined[field] = value;
        }
    }
    return joined;
}

/** What the defaults read of an app's row: whether it acts and its `configurationDefaults`. */
export type DefaultsRow = {
    disabled: boolean;
    hashApproved: boolean;
    contributes: { configurationDefaults: Record<string, unknown> };
};

/**
 * The records the acting apps' `[<languageId>]` blocks give, by language, the apps taken in the
 * Views list's order so the first to set a field keeps it. The map has no prototype, as the
 * records of `editor.languages` have none.
 */
export function appDefaults(rows: readonly DefaultsRow[]): LanguageRecords {
    const blocks = new Map<string, LanguageRecord[]>();
    for (const row of rows.filter((one) => appActive(one))) {
        for (const [key, block] of Object.entries(row.contributes.configurationDefaults)) {
            const language = languageOfBlock(key);
            if (language === null) continue;
            blocks.set(language, [
                ...(blocks.get(language) ?? []),
                readLanguageDefaults(block).record
            ]);
        }
    }
    const records = Object.create(null) as LanguageRecords;
    for (const [language, list] of blocks) records[language] = joinLanguageDefaults(list);
    return records;
}
