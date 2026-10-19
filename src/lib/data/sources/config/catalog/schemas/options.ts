// Layer 1, data. The JSON Schema of one config file of oculus (its `config/*.yml`), made
// from its section of the options catalog: each entry's control says what its key may hold, the
// entry's `help` is the key's description, and a family describes the records of a list or the
// values of a map once.
//
// The schema is the catalog's rule (catalog/value-rule.ts) in JSON Schema's words, so the editor
// marks what the Settings view refuses: a toggle holds a flag, a number its range, a choice the
// words of its `options` and of the sources it names, a list its items and its slots. A source that
// only the page holds (the views, the theme classes, the usage tiers, the file icon themes) offers
// its words nowhere else, so a choice drawn from one is any text.

import type { CatalogEntry, FieldSpec, Source } from '../options.ts';
import { hueNames, listedSources, pickedSources } from '../options.ts';
import { glyphNames } from '../../rail.ts';
import { FORM_PATTERNS } from '../value-rule.ts';
import type { JsonSchema } from '../../../../snapshot/schema/json.ts';

/** What a conversion reads besides the entries: the merged configuration and the source lists. */
export type OptionLists = {
    merged: Record<string, unknown>;
    /** The items of a source, or null when the build does not hold them. */
    items: (source: Source) => string[] | null;
};

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

/** A text, held to its form. */
function textSchema(spec: FieldSpec): JsonSchema {
    const schema: JsonSchema = { type: 'string' };
    if (spec.form !== undefined) schema.pattern = FORM_PATTERNS[spec.form].source;
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

/** Whether a family is a map from a key to one value: fields `key` and `value` and no more. */
export function isPairs(fields: Record<string, FieldSpec>): boolean {
    const names = Object.keys(fields);
    return names.length === 2 && names.includes('key') && names.includes('value');
}

/** The schema of a family: a list of its records, or a map from a key to a record or a value. */
function familySchema(entry: CatalogEntry, lists: OptionLists, loose = false): JsonSchema {
    const fields = entry.fields ?? {};
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
    return schema;
}

/** The schema of one field of a family: its control, or its help line alone as a text. */
function fieldSchema(spec: FieldSpec, lists: OptionLists): JsonSchema {
    if (spec.fields !== undefined) {
        return described(familySchema(spec, lists), spec.help);
    }
    return described(controlSchema(spec, lists), spec.help);
}

/** The schema of one option or family of a config file. */
function entrySchema(path: string, entry: CatalogEntry, lists: OptionLists): JsonSchema {
    const schema =
        entry.fields === undefined
            ? controlSchema({ ...entry, control: entry.control ?? 'text' }, lists)
            : familySchema(entry, lists, OWN_READER.includes(path));
    if (Object.hasOwn(entry, 'default')) schema.default = entry.default;
    return described(schema, entry.help);
}

/** An object of the tree of key paths, before its leaves are known. */
type Branch = { properties: Record<string, JsonSchema> };

/**
 * The schema of a config file from its section of the options catalog, with the top-level keys of
 * `extra` after the catalog's own.
 */
export function optionsSchema(
    entries: Record<string, CatalogEntry>,
    lists: OptionLists,
    extra: Record<string, JsonSchema> = {}
): JsonSchema {
    const root: JsonSchema = { type: 'object', properties: {}, additionalProperties: false };
    for (const [path, entry] of Object.entries(entries)) {
        const names = path.split('.');
        let at: Branch = root as Branch;
        for (const name of names.slice(0, -1)) {
            if (!Object.hasOwn(at.properties, name)) {
                at.properties[name] = {
                    type: 'object',
                    properties: {},
                    additionalProperties: false
                };
            }
            at = at.properties[name] as Branch;
        }
        at.properties[names[names.length - 1]] = entrySchema(path, entry, lists);
    }
    Object.assign((root as Branch).properties, extra);
    return root;
}

/**
 * The schema of the `app_settings:` map of config/behavior.yml: a value for each whole key of a
 * setting an app declares, a flag, a number, a text or a list of texts. Which keys exist and what
 * each takes depends on the apps that are installed, which the file's schema does not know, so the
 * apps watcher judges each value against its declaration.
 */
export function appSettingsSchema(): JsonSchema {
    return {
        type: 'object',
        additionalProperties: {
            anyOf: [
                { type: 'boolean' },
                { type: 'number' },
                { type: 'string' },
                { type: 'array', items: { type: 'string' } }
            ]
        }
    };
}
