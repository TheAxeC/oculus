// Layer 1, data. The JSON Schema of one defaults file of oculus (its `config/defaults/*.yml`), made
// from its options file (`config/options/*.yml`): each entry's control says what its key may hold,
// the entry's `help` is the key's description, a group of dotted options takes its help line from
// the file's `groups:`, and a family describes the records of a list, the values of a map or the
// one record of a field marked `holds: record` once.
// The same schema, with every option of every defaults file, describes a workspace file's
// `settings:`, where a keyed list also takes a row `{ <key>: x, removed: true }` and a map family
// a key set to null (merge/keyed.ts).
//
// The schema is the catalog's rule (catalog/value-rule.ts) in JSON Schema's words, so the editor
// marks what the Settings view refuses: a toggle holds a flag, a number its range, a choice the
// words of its `options` and of the sources it names, a list its items and its slots, a word block
// its four lists of the words and the flags of the list it names. A source that only the page holds
// (the views, the theme classes, the usage tiers, the file icon themes) offers its words nowhere
// else, so a choice drawn from one is any text.

import type { CatalogEntry, FieldSpec, Source } from '../options.ts';
import {
    blockFlags,
    flagSources,
    hueNames,
    isPairs,
    listedSources,
    pickedSources
} from '../options.ts';
import { BLOCK_LISTS } from '../../../../shapes/boards/words.ts';
import { glyphNames } from '../../rail.ts';
import { FORM_PATTERNS } from '../value-rule.ts';
import type { JsonSchema } from '../../../../snapshot/schema/json.ts';

/** What a conversion reads besides the entries: the merged configuration and the source lists. */
export type OptionLists = {
    merged: Record<string, unknown>;
    /** The items of a source, or null when the build does not hold them. */
    items: (source: Source) => string[] | null;
    /**
     * True for the schema of a workspace file's `settings:`, whose keyed lists and map families
     * take the rows and keys that take oculus's entries out.
     */
    overrides?: boolean;
};

/** The description of the field that takes oculus's entry of a keyed list out. */
const REMOVED_HELP = "true takes oculus's entry with this row's key out of the list.";

/** The description of a key of a map family set to null. */
const NULL_HELP = "null takes oculus's entry of this key out of the map.";

/**
 * The families whose records hold a value the options catalog cannot describe, a layout tree, and
 * whose own reader (data/sources/config/rail.ts) checks it. A text field of such a family takes any
 * value, and one with no `key` field is the single record the key holds, not a list of records.
 */
const OWN_READER = ['arrangements', 'workbench'];

/** The words a choice or a multi takes, or null when a source it names is not held. */
function wordsOf(spec: FieldSpec, lists: OptionLists): string[] | null {
    const words = [...(spec.options ?? [])];
    for (const source of listedSources(spec)) {
        const items = lists.items(source);
        if (items === null) return null;
        words.push(...items);
    }
    return [...new Set(words)];
}

/** A number, its bounds and whether it is whole. */
function numberSchema(spec: FieldSpec): JsonSchema {
    const schema: JsonSchema = { type: spec.whole === true ? 'integer' : 'number' };
    if (spec.min !== undefined) schema.minimum = spec.min;
    if (spec.max !== undefined) schema.maximum = spec.max;
    return schema;
}

/**
 * A text, held to its form; the empty text also fits an entry that sets `empty`, as the value rule
 * (catalog/value-rule.ts) reads it.
 */
function textSchema(spec: FieldSpec): JsonSchema {
    const schema: JsonSchema = { type: 'string' };
    if (spec.form === undefined) return schema;
    const form = FORM_PATTERNS[spec.form].source;
    schema.pattern = spec.empty === undefined ? form : `^$|${form}`;
    return schema;
}

/** The suggestions a text box offers: the words of the sources it names. */
function suggestions(spec: FieldSpec, lists: OptionLists): string[] {
    return (wordsOf(spec, lists) ?? []).filter((word) => word !== '');
}

/** A choice, held to its words when every source it names is held. */
function choiceSchema(spec: FieldSpec, lists: OptionLists): JsonSchema {
    const words = pickedSources(spec) === undefined ? wordsOf(spec, lists) : null;
    if (words === null || words.length === 0) return { type: 'string' };
    const sources = listedSources(spec);
    const schema: JsonSchema = {
        enum: spec.empty === undefined ? words : [...words, '']
    };
    if (sources.length > 0) schema['x-from'] = sources.join(' ');
    return schema;
}

/** A list of words: a list of the words, or one text of words joined by spaces. */
function multiSchema(spec: FieldSpec, lists: OptionLists): JsonSchema {
    const words = pickedSources(spec) === undefined ? wordsOf(spec, lists) : null;
    const item: JsonSchema =
        words === null || words.length === 0 ? { type: 'string' } : { enum: words };
    if (spec.joined === true) return { type: 'string' };
    return { type: ['array', 'string'], items: item };
}

/** A list of numbers or texts, with the fixed slots it must fill. */
function listSchema(spec: FieldSpec): JsonSchema {
    const items = spec.items === 'number' ? numberSchema(spec) : textSchema(spec);
    const schema: JsonSchema = { type: 'array', items };
    if (spec.slots !== undefined) {
        schema.minItems = spec.slots.length;
        schema.maxItems = spec.slots.length;
    }
    return schema;
}

/**
 * A word block: a map of the lists `words` and `not_words`, held to the words of the list the
 * spec's `from` names, and `flags` and `not_flags`, held to that list's flags, each a list of texts
 * while the list it is held to is not held.
 */
function blockSchema(spec: FieldSpec, lists: OptionLists): JsonSchema {
    const words = wordsOf(spec, lists);
    const flags = blockFlags(spec, (source) => lists.items(source));
    const listOf = (held: string[] | null): JsonSchema => ({
        type: 'array',
        items: held === null || held.length === 0 ? { type: 'string' } : { enum: held }
    });
    // A block drawn from a list whose words carry no flags takes none.
    const flagged = flagSources(spec).length === 0 ? { type: 'array', maxItems: 0 } : listOf(flags);
    const properties: Record<string, JsonSchema> = {};
    for (const list of BLOCK_LISTS) {
        properties[list] = list.endsWith('words') ? listOf(words) : flagged;
    }
    return { type: 'object', properties, additionalProperties: false };
}

/** The schema of a value of one control. */
function controlSchema(spec: FieldSpec, lists: OptionLists): JsonSchema {
    switch (spec.control) {
        case 'toggle':
            return { type: 'boolean' };
        case 'number':
            return numberSchema(spec);
        case 'choice':
            return choiceSchema(spec, lists);
        case 'multi':
            return multiSchema(spec, lists);
        case 'list':
            return listSchema(spec);
        case 'parked':
            return { type: 'array', items: { type: 'string' } };
        case 'words':
            return blockSchema(spec, lists);
        case 'glyph': {
            const names = glyphNames(lists.merged) ?? [];
            return names.length > 0 ? { enum: names } : { type: 'string' };
        }
        case 'hue': {
            const names = hueNames(lists.merged);
            return names.length > 0 ? { enum: names } : { type: 'string' };
        }
        default: {
            const schema = textSchema(spec);
            const offered = suggestions(spec, lists);
            if (offered.length > 0) schema.examples = offered;
            return schema;
        }
    }
}

/** A field's schema with its help line as the description. */
function described(schema: JsonSchema, help: string): JsonSchema {
    if (help !== '') schema.description = help;
    return schema;
}

/** The rules that hold a field to the source its picking field names. */
function pickedRules(name: string, spec: FieldSpec, lists: OptionLists): JsonSchema[] {
    const picked = pickedSources(spec);
    if (picked === undefined) return [];
    const rules: JsonSchema[] = [];
    for (const [word, source] of Object.entries(picked.sources)) {
        const items = lists.items(source);
        if (items === null || items.length === 0) continue;
        rules.push({
            if: { properties: { [picked.field]: { const: word } }, required: [picked.field] },
            then: {
                properties: { [name]: { enum: items, 'x-from': source } }
            }
        });
    }
    return rules;
}

/** The schema of a record whose fields are those of a family. */
export function recordSchema(
    fields: Record<string, FieldSpec>,
    lists: OptionLists,
    loose = false
): JsonSchema {
    const properties: Record<string, JsonSchema> = {};
    const rules: JsonSchema[] = [];
    for (const [name, spec] of Object.entries(fields)) {
        const free = loose && spec.control === 'text' && spec.fields === undefined;
        properties[name] = free ? described({}, spec.help) : fieldSchema(spec, lists);
        rules.push(...pickedRules(name, spec, lists));
    }
    const schema: JsonSchema = { type: 'object', properties, additionalProperties: false };
    if (rules.length > 0) schema.allOf = rules;
    return schema;
}

/** The fields of a family that a record of it holds, without the `key` a map names it by. */
export function withoutKey(fields: Record<string, FieldSpec>): Record<string, FieldSpec> {
    return Object.fromEntries(Object.entries(fields).filter(([name]) => name !== 'key'));
}

export { isPairs };

/**
 * The value schema of each key of a map from a key to a value whose source the key picks (a
 * board's `stages: { words: [...] }`), or null when the value picks by no key: a map names its key
 * by the pair's key and holds no `key` field the rules of a record could read.
 */
function pickedByKey(
    fields: Record<string, FieldSpec>,
    lists: OptionLists
): Record<string, JsonSchema> | null {
    const picked = pickedSources(fields.value);
    if (picked?.field !== 'key') return null;
    return Object.fromEntries(
        Object.entries(picked.sources).map(([word, source]) => [
            word,
            fieldSchema({ ...fields.value, from: [source] }, lists)
        ])
    );
}

/**
 * The schema of a family: a list of its records, a map from a key to a record or a value, or for
 * a field that holds one record (`holds: record`) that record.
 */
function familySchema(entry: CatalogEntry, lists: OptionLists, loose = false): JsonSchema {
    const fields = entry.fields ?? {};
    if (entry.holds === 'record') return recordSchema(fields, lists, loose);
    const keyed = 'key' in fields;
    if (loose && !keyed) return recordSchema(fields, lists, true);
    const rows = recordSchema(fields, lists, loose);
    // A table holds one value a key, or a list of such values where it holds lists; a value that
    // is a list already is the list. Any other keyed family holds one record a key.
    const value = isPairs(fields) ? fieldSchema(fields.value, lists) : null;
    const wrapped = value !== null && entry.holds === 'lists' && fields.value.control !== 'list';
    const member: JsonSchema =
        value === null
            ? recordSchema(withoutKey(fields), lists, loose)
            : wrapped
              ? { anyOf: [value, { type: 'array', items: value }] }
              : value;
    const schema: JsonSchema = { type: keyed ? ['array', 'object'] : 'array', items: rows };
    if (keyed) schema.additionalProperties = member;
    const byKey = value === null || wrapped ? null : pickedByKey(fields, lists);
    if (byKey !== null) schema.properties = byKey;
    return schema;
}

/** The schema of one field of a family: its control, or its help line alone as a text. */
function fieldSchema(spec: FieldSpec, lists: OptionLists): JsonSchema {
    if (spec.fields !== undefined) {
        return described(familySchema(spec, lists), spec.help);
    }
    return described(controlSchema(spec, lists), spec.help);
}

/**
 * A family's schema as a workspace file's `settings:` takes it: a row of a keyed list may hold
 * `removed: true`, and a key of a map family may hold null.
 */
function withOverrides(schema: JsonSchema, entry: CatalogEntry): void {
    const fields = entry.fields ?? {};
    const rows = schema.items as { properties?: Record<string, JsonSchema> } | undefined;
    if (entry.key !== undefined && rows?.properties !== undefined) {
        rows.properties.removed = { const: true, description: REMOVED_HELP };
    }
    const member: unknown = schema.additionalProperties;
    if ('key' in fields && typeof member === 'object' && member !== null) {
        schema.additionalProperties = {
            anyOf: [member as JsonSchema, { type: 'null', description: NULL_HELP }]
        };
    }
}

/** The schema of one option or family of a config file. */
function entrySchema(path: string, entry: CatalogEntry, lists: OptionLists): JsonSchema {
    const schema =
        entry.fields === undefined
            ? controlSchema({ ...entry, control: entry.control ?? 'text' }, lists)
            : familySchema(entry, lists, OWN_READER.includes(path));
    if (lists.overrides === true && entry.fields !== undefined) withOverrides(schema, entry);
    if (Object.hasOwn(entry, 'default')) schema.default = entry.default;
    return described(schema, entry.help);
}

/** An object of the tree of key paths, before its leaves are known. */
type Branch = { properties: Record<string, JsonSchema> };

/**
 * The schema of a config file from its options, each group of dotted options described by its
 * help line in `groups` (group path to line), with the top-level keys of `extra` after the
 * options' own.
 */
export function optionsSchema(
    entries: Record<string, CatalogEntry>,
    lists: OptionLists,
    extra: Record<string, JsonSchema> = {},
    groups: Record<string, string> = {}
): JsonSchema {
    const root: JsonSchema = { type: 'object', properties: {}, additionalProperties: false };
    for (const [path, entry] of Object.entries(entries)) {
        const names = path.split('.');
        let at: Branch = root as Branch;
        for (const [step, name] of names.slice(0, -1).entries()) {
            if (!Object.hasOwn(at.properties, name)) {
                at.properties[name] = described(
                    { type: 'object', properties: {}, additionalProperties: false },
                    groups[names.slice(0, step + 1).join('.')] ?? ''
                );
            }
            at = at.properties[name] as Branch;
        }
        at.properties[names[names.length - 1]] = entrySchema(path, entry, lists);
    }
    Object.assign((root as Branch).properties, extra);
    return root;
}

/**
 * The schema of the `app_settings:` map of a hub's settings file and of
 * config/defaults/behavior.yml: a value for each whole key of a setting an app declares, a flag, a
 * number, a text or a list of texts. Which keys exist and what each takes depends on the apps that
 * are installed, which the file's schema does not know, so the apps watcher judges each value
 * against its declaration.
 */
export function appSettingsSchema(): JsonSchema {
    return {
        type: 'object',
        description:
            "The values of the settings the installed apps declare, by each setting's whole key (`notes.width` is one key). The Settings view writes them, and each value is checked against the app's declaration.",
        additionalProperties: {
            description:
                'The value of one app setting: a flag, a number, a text or a list of texts, as the app declares it.',
            anyOf: [
                { type: 'boolean' },
                { type: 'number' },
                { type: 'string' },
                { type: 'array', items: { type: 'string' } }
            ]
        }
    };
}
