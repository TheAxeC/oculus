// Layer 1, data. The JSON Schema of one defaults file of oculus (its `config/defaults/*.yml`), made
// from its options file (`config/options/*.yml`): each entry's control says what its key may hold,
// the entry's `help` is the key's description, a group of dotted options takes its help line from
// the file's `groups:`, and a family describes the records of a list, the values of a map or the
// one record of a field marked `holds: record` once. A record of the options file's
// `descriptions:` that fields name is one definition at the schema's root, which they refer to.
// The same schema, with every option of every defaults file, describes a workspace file's
// `settings:`, where a keyed list also takes a row `{ <key>: x, removed: true }` and a map family
// a key set to null (merge/keyed.ts).
//
// The schema is the catalog's rule (catalog/value-rule.ts) in JSON Schema's words, so the editor
// marks what the Settings view refuses: a toggle holds a flag, a number its range, a scalar a text
// of its form, a number or a flag, a choice the words of its `options` and of the sources it names,
// a multi one of those words alone or a list of them, a list its items and its slots, a word block
// its four lists of the words and the flags of the list it names. A source that only the page holds
// (the views, the theme classes, the usage tiers, the file icon themes) offers its words nowhere
// else, so a choice drawn from one is any text, a multi drawn from one is one text or a list of
// texts, and a `joined` one is one text of words separated by single spaces. The schema and the
// rule part on these kinds of value: a word outside a multi's words that the file already holds,
// which the rule takes from the Settings write alone, is refused here; a multi with no words, whose
// every word the rule refuses, is any text or a list of texts here; and a list of lists in a map
// that holds lists (`holds: lists`), refused by the rule, is taken here.
//
// A keyed family, one whose fields hold a `key` field, takes one form here, the form its reader
// takes, since each reader takes the form oculus's own file is written in: a key/value family a
// map, and any other keyed family the form of oculus's value of it, its entry's `default`. A family
// field's map is the form the rule holds it to (familyProblem); the rule reads no form of a
// top-level family, which has no control, and the schema holds such a family to the form its
// reader takes. A keyed family written in the other form is told so in oculus's checker's words
// (`boards must be a map, not a list`), and any other value of the wrong type keeps the editor's
// own message (heldToForm).

import type { CatalogEntry, FieldSpec, Source } from '../options.ts';
import {
    blockFlags,
    flagSources,
    hueNames,
    isPairs,
    listedSources,
    pickedSources,
    takesRecord
} from '../options.ts';
import { findingText, type TextCatalog } from '../../../../helpers/finding-text.ts';
import { isMap } from '../../../../helpers/guards.ts';
import { SETTINGS_KEY } from '../../merge/workspace-layer.ts';
import { BLOCK_LISTS } from '../../../../shapes/boards/words.ts';
import { glyphNames } from '../../rail.ts';
import { FORM_PATTERNS, JOINED_FORM } from '../value-rule.ts';
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
    /** The text catalog that words the editor's message for a keyed family in the wrong form. */
    text: TextCatalog;
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

/**
 * A multi: one of its words alone or a list of them, as the value rule reads a multi that is not
 * `joined`, the text first so the editor's message for a wrong word lists the words. A word outside
 * them is refused even where the file already holds it, which the rule takes only from the Settings
 * write. While its words are not held (its picking field names the source, or the build does not
 * hold a source it names) it is one text or a list of texts, and so is a multi with no words, whose
 * every word the rule refuses. A `joined` multi is one text of words separated by single spaces,
 * any words, since its one field draws from a source the schema never holds.
 */
function multiSchema(spec: FieldSpec, lists: OptionLists): JsonSchema {
    if (spec.joined === true) return { type: 'string', pattern: JOINED_FORM.source };
    const words = pickedSources(spec) === undefined ? wordsOf(spec, lists) : null;
    if (words === null || words.length === 0) {
        return { type: ['array', 'string'], items: { type: 'string' } };
    }
    return {
        anyOf: [
            { type: 'string', enum: words },
            { type: 'array', items: { enum: words } }
        ]
    };
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
        case 'scalar':
            return { anyOf: [textSchema(spec), { type: 'number' }, { type: 'boolean' }] };
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

/**
 * The schemas of the records of the files' `descriptions:` (catalog/options.ts, `described_by`)
 * met while a schema is made, each by its definition name, null while it is being made. The file's
 * schema carries them at its root as `definitions`, and every field that names a record refers to
 * its definition, so a record that names itself describes a value nested at any depth.
 */
export type Definitions = Map<string, JsonSchema | null>;

/** The name of the definition of a described record, `behavior.yml#reader_value`, in a pointer. */
function definitionName(described: string): string {
    return described.replace('#', '.');
}

/** The `definitions` a schema's root carries for the described records it refers to. */
export function definitionsOf(defs: Definitions): Record<string, JsonSchema> {
    const held: Record<string, JsonSchema> = {};
    for (const [name, schema] of defs) if (schema !== null) held[name] = schema;
    return held;
}

/** The schema of a record whose fields are those of a family. */
export function recordSchema(
    fields: Record<string, FieldSpec>,
    lists: OptionLists,
    defs: Definitions,
    loose = false
): JsonSchema {
    const properties: Record<string, JsonSchema> = {};
    const rules: JsonSchema[] = [];
    for (const [name, spec] of Object.entries(fields)) {
        const free = loose && spec.control === 'text' && spec.fields === undefined;
        properties[name] = free ? described({}, spec.help) : fieldSchema(name, spec, lists, defs);
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
    lists: OptionLists,
    defs: Definitions
): Record<string, JsonSchema> | null {
    const picked = pickedSources(fields.value);
    if (picked?.field !== 'key') return null;
    // Each value takes the one source of its key, so it is described on its own, not by the
    // definition of a record it may name.
    const { described: _record, ...value } = fields.value;
    return Object.fromEntries(
        Object.entries(picked.sources).map(([word, source]) => [
            word,
            fieldSchema(word, { ...value, from: [source] }, lists, defs)
        ])
    );
}

/**
 * The schema of a family: a list of its records, or for a field that holds one record (`holds:
 * record`) that record. A keyed family, one whose fields hold a `key` field, takes the one form
 * its reader takes: a key/value family a map from a key to a value, and any other keyed family the
 * form of `shipped`, oculus's own value of it, a map from a key to a record when that value is a
 * map and a list of its records otherwise (a family field passes none, and is the list of records
 * the rule reads). Each reader takes the form oculus's own file is written in, so a family written
 * in the other form is refused here as its reader refuses it, in the words of `heldToForm` under
 * `name`, the key or the field the family is.
 */
function familySchema(
    name: string,
    entry: CatalogEntry,
    lists: OptionLists,
    defs: Definitions,
    loose = false,
    shipped?: unknown
): JsonSchema {
    const fields = entry.fields ?? {};
    if (entry.holds === 'record') return recordSchema(fields, lists, defs, loose);
    const keyed = 'key' in fields;
    if (loose && !keyed) return recordSchema(fields, lists, defs, true);
    const pairs = isPairs(fields);
    if (!keyed) return { type: 'array', items: recordSchema(fields, lists, defs, loose) };
    if (!pairs && !isMap(shipped)) {
        return heldToForm(
            { type: 'array', items: recordSchema(fields, lists, defs, loose) },
            name,
            lists.text
        );
    }
    // A key/value family is a map of one value a key, or of a list of such values where it holds
    // lists; a value that is a list already is the list. Any other keyed family that is a map holds
    // one record a key, its fields without the `key` the map names it by.
    const value = pairs ? fieldSchema(name, fields.value, lists, defs) : null;
    const wrapped = value !== null && entry.holds === 'lists' && fields.value.control !== 'list';
    const member: JsonSchema =
        value === null
            ? recordSchema(withoutKey(fields), lists, defs, loose)
            : wrapped
              ? { anyOf: [value, { type: 'array', items: value }] }
              : value;
    const schema: JsonSchema = { type: 'object', additionalProperties: member };
    const byKey = value === null || wrapped ? null : pickedByKey(fields, lists, defs);
    if (byKey !== null) schema.properties = byKey;
    return heldToForm(schema, name, lists.text);
}

/**
 * A keyed family's schema in its one form, `form` a map or a list of rows, with the message the
 * editor shows for a value of the other form: oculus's checker's sentence (`findings.schema.type`,
 * `boards must be a map, not a list`). yaml-language-server shows a schema's `errorMessage` for
 * every value whose type it refuses, a text, a number and an empty key among them, so the message
 * sits on the branch an `if` takes for the other form alone, and every other value is read against
 * `else`, the form with its fields, and keeps the editor's own message. The fields stay beside
 * their type in `else`, where ajv's strict mode reads them; `formOf` gives that branch.
 */
function heldToForm(form: JsonSchema, name: string, text: TextCatalog): JsonSchema {
    const type = form.type as string;
    const map = type === 'object';
    const mapWord = findingText(text, 'findings.schema.is_map');
    const listWord = findingText(text, 'findings.schema.is_list');
    const message = map
        ? findingText(text, 'findings.schema.type', name, mapWord, listWord)
        : findingText(text, 'findings.schema.type', name, listWord, mapWord);
    return {
        if: { type: map ? 'array' : 'object' },
        then: { type, errorMessage: message },
        else: form
    };
}

/** The branch of a schema that holds its form and fields: `else` of a keyed family, else itself. */
export function formOf(schema: JsonSchema): JsonSchema {
    return (schema.else as JsonSchema | undefined) ?? schema;
}

/**
 * The schema of one field of a family as it stands: its control, or its help line alone as a
 * text; a text field that takes one record of its fields (takesRecord) takes either.
 */
function ownSchema(
    name: string,
    spec: FieldSpec,
    lists: OptionLists,
    defs: Definitions
): JsonSchema {
    if (spec.fields === undefined) return described(controlSchema(spec, lists), spec.help);
    const family = familySchema(name, spec, lists, defs);
    if (!takesRecord(spec)) return described(family, spec.help);
    return described({ anyOf: [controlSchema(spec, lists), family] }, spec.help);
}

/**
 * The schema of one field of a family: a field that is a described record refers to the record's
 * definition, made the first time it is met and carrying no help line, with its own help line; any
 * other is its own schema.
 */
function fieldSchema(
    name: string,
    spec: FieldSpec,
    lists: OptionLists,
    defs: Definitions
): JsonSchema {
    if (spec.described === undefined) return ownSchema(name, spec, lists, defs);
    const definition = definitionName(spec.described);
    if (!defs.has(definition)) {
        defs.set(definition, null);
        defs.set(definition, ownSchema(name, { ...spec, help: '' }, lists, defs));
    }
    return described({ allOf: [{ $ref: `#/definitions/${definition}` }] }, spec.help);
}

/**
 * A family's schema as a workspace file's `settings:` takes it: a row of a keyed list may hold
 * `removed: true`, and a key of a map family may hold null.
 */
function withOverrides(schema: JsonSchema, entry: CatalogEntry): void {
    const fields = entry.fields ?? {};
    const form = formOf(schema);
    const rows = form.items as { properties?: Record<string, JsonSchema> } | undefined;
    if (entry.key !== undefined && rows?.properties !== undefined) {
        rows.properties.removed = { const: true, description: REMOVED_HELP };
    }
    const member: unknown = form.additionalProperties;
    if ('key' in fields && typeof member === 'object' && member !== null) {
        form.additionalProperties = {
            anyOf: [member as JsonSchema, { type: 'null', description: NULL_HELP }]
        };
    }
}

/** The schema of one option or family of a config file. */
function entrySchema(
    path: string,
    entry: CatalogEntry,
    lists: OptionLists,
    defs: Definitions
): JsonSchema {
    const schema =
        entry.fields === undefined
            ? controlSchema({ ...entry, control: entry.control ?? 'text' }, lists)
            : familySchema(
                  lists.overrides === true ? `${SETTINGS_KEY}.${path}` : path,
                  entry,
                  lists,
                  defs,
                  OWN_READER.includes(path),
                  entry.default
              );
    if (lists.overrides === true && entry.fields !== undefined) withOverrides(schema, entry);
    if (Object.hasOwn(entry, 'default')) schema.default = entry.default;
    return described(schema, entry.help);
}

/** An object of the tree of key paths, before its leaves are known. */
type Branch = { properties: Record<string, JsonSchema> };

/**
 * The schema of a config file from its options, each group of dotted options described by its
 * help line in `groups` (group path to line), with the top-level keys of `extra` after the
 * options' own, and at its root the `definitions` of the described records its fields name. A
 * caller that puts the schema inside another moves those definitions to that one's root.
 */
export function optionsSchema(
    entries: Record<string, CatalogEntry>,
    lists: OptionLists,
    extra: Record<string, JsonSchema> = {},
    groups: Record<string, string> = {}
): JsonSchema {
    const root: JsonSchema = { type: 'object', properties: {}, additionalProperties: false };
    const defs: Definitions = new Map();
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
        at.properties[names[names.length - 1]] = entrySchema(path, entry, lists, defs);
    }
    Object.assign((root as Branch).properties, extra);
    if (defs.size > 0) root.definitions = definitionsOf(defs);
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
