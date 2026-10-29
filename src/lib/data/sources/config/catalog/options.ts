// Layer 1, data. The options catalog, the files of config/options/: every option of every config
// file described once, the help line of each group of dotted options, and the walk that says which
// key paths of a config file are options.
//
// loadConfig reads the folder into two keys of the merged config. `options` maps a config file's
// name (`behavior.yml`, and `local.yml` for the machine's own keys) to a map of dotted key path to
// an entry: what the option does, its `default` (the value config/defaults/ holds at the path,
// which the Settings view's Modified filter compares with and, for a setting the readers of
// settings/ read, the value used when the key is missing or wrong), the heading and section the
// Settings view lists it under, the control it is set with, and for a list of records the field
// (`key`) a workspace file's `settings:` overrides one row by. `option_groups` maps the same name
// to the help line of each group (`slurm` of `slurm.poll_min`), which the editor's schema puts on
// the group's map. It is there for an editor of the settings and a write of one key to look an
// option up, so a key path has one meaning wherever it is used.
//
// An option is a leaf of a config file: a scalar, a null, or a list. The walk descends into every
// map and never into a list, so a list is set as a whole. It stops at a family, a list of records
// or a map whose keys are names the data or the reader chooses (page names, tier names, project
// types, file extensions, theme names) rather than names oculus reads: a family is one option
// whose entry describes the record's `fields` once, since its members are not keys of this file in
// any fixed sense and a catalog line per member would be a line per row of someone's data.
//
// The control words, the keys an entry may carry beside `control`, the headings and the sources a
// list of choices is drawn from are the vocabulary below. catalogOf reads an entry into the typed
// form the page and the server writes share; an entry it cannot read is read as a text option
// (or under the `unheaded` heading), and readCatalog hands back what was wrong with it, which
// option-findings.ts words as findings. The lists that the merged config alone holds (the models,
// the rail's pages, the entry statuses) and the palette rule behind the hue and colour controls
// are here too, since the page and the server must agree on them and this is the one data module
// both may import.

import { byKey, isMap, str, strings } from '../../../helpers/guards.ts';
import { holdersOf, keyOf, resolvedId } from '../../../helpers/hub-names.ts';
import {
    CONTROLS,
    FLAG_SOURCES,
    FORMS,
    HEADINGS,
    SOURCES,
    type Control,
    type Form,
    type Heading,
    type Holds,
    type Source
} from '../../../shapes/catalog-words.ts';
import { mapShape, readOr } from '../../../shapes/shapes.ts';
import { coloredWords, vocabKeys } from '../../../shapes/vocab-keys.ts';
import { flagsOf } from '../../../shapes/boards/words.ts';
import { catalogueGroupIds } from '../../../helpers/keys/oculus/rail-letters.ts';

export { CONTROLS, HEADINGS };
export type { Control, Form, Heading, Source };

/** The heading of an entry that names none or names one HEADINGS lacks. */
export const UNHEADED = 'unheaded';

/** Whether a word is one of the list. */
function oneOf<T extends string>(list: readonly T[], word: unknown): word is T {
    return list.some((one) => one === word);
}

/** Whether a word names a source. */
function isSource(word: unknown): word is Source {
    return oneOf(SOURCES, word);
}

/** Whether a word names a form. */
function isForm(word: unknown): word is Form {
    return oneOf(FORMS, word);
}

/**
 * A choice whose source another field of the record names: `field` is that field, and `sources`
 * maps each of its words to a source. A word the map lacks gives no items.
 */
type ValuesBy = { field: string; sources: Record<string, Source> };

/**
 * One option's control and the keys that shape it. A family field is this; so is the part of an
 * entry that is not its heading, section or default. `options` is a fixed list; `from` the sources
 * whose items are offered together, or `{ field, sources }`, the source another field of the record
 * picks; on a text control `from` is the source the box suggests from and holds the value to
 * nothing; `empty`
 * adds the empty value as a choice that writes `''` (`true`, or the words that say what empty
 * does, which the choice draws for its empty item); `min` and `max` bound a number, or each item
 * of a list of numbers; `whole` holds a number, or each item of a list of numbers, to a whole
 * number; `form` holds a text, or each item of a list of texts, to one of FORMS; `slots` names the
 * fixed items of a list; `items: number` makes a list's items numbers; `joined` writes a multi as
 * one text separated by spaces; `allow_missing` lets a folder or file be absent, always (true) or
 * while the named toggle field of the record is true; `fields` describes the records of a
 * `records` field. A text field with `fields` and `holds: record` takes a text or one record of
 * its fields (takesRecord). `sparse` on a family draws each card with the fields its record sets
 * and a menu that adds the others.
 */
export type FieldSpec = {
    help: string;
    control: Control;
    options?: string[];
    from?: Source[] | ValuesBy;
    empty?: true | string;
    min?: number;
    max?: number;
    whole?: true;
    form?: Form;
    slots?: string[];
    items?: 'number';
    joined?: boolean;
    allow_missing?: boolean | string;
    fields?: Record<string, FieldSpec>;
    holds?: Holds;
    sparse?: true;
};

/** Whether a field takes a text or one record of its fields: a text with `holds: record`. */
export function takesRecord(spec: Pick<CatalogEntry, 'control' | 'fields' | 'holds'>): boolean {
    return spec.control === 'text' && spec.holds === 'record' && spec.fields !== undefined;
}

/**
 * What the value of a family field is: `list`, a list of records; `pairs`, a map from a key to a
 * value, for a family whose fields are `key` and `value`; `record`, one record of its fields, for
 * a family field marked `holds: record`.
 */
export type FamilyForm = 'list' | 'pairs' | 'record';

/** Whether a family's fields are `key` and `value` and no more: a map from a key to one value. */
export function isPairs(fields: Record<string, FieldSpec>): boolean {
    const names = Object.keys(fields);
    return names.length === 2 && names.includes('key') && names.includes('value');
}

/** The form of a family field's value; see FamilyForm. */
export function familyForm(spec: Pick<FieldSpec, 'fields' | 'holds'>): FamilyForm {
    if (spec.holds === 'record') return 'record';
    return isPairs(spec.fields ?? {}) ? 'pairs' : 'list';
}

/**
 * One option, or one family. An option of a defaults file carries `default`, the value
 * config/defaults/ holds at its path, which the Settings view's Modified filter compares with and,
 * for a setting the readers of settings/ read, the value used when the key is missing or wrong. An
 * option a hub's or a workspace's value is laid over oculus's in oculus's place
 * (data/sources/config/merge/in-place.ts) carries `in_place`, since its entries keep oculus's order
 * whatever order a file writes them in. A leaf option carries a `control`; a family carries
 * `fields` and no control, and a family that is a list of records may carry `key`, the field a
 * workspace file's `settings:` tells its rows apart by. A `local.yml` key has a help line, and a
 * `control` only where it takes a number or a choice. A key/value family (fields `key` and
 * `value`), an entry or a field, may carry `holds: lists`, meaning each key of the map holds a list
 * of values or one value; a family, or a family field with no `key` field, may carry `holds:
 * record`, meaning it holds one record of its fields, and a text field may carry it with `fields`.
 * The reader refuses either word anywhere else, and a key/value family without `holds: lists`
 * takes no list at a key. `heading` is the subject the option is listed under (`unheaded` when it
 * names none a HEADINGS word is), and `section` the group inside that heading, the first segment
 * of the key path when absent.
 */
export type CatalogEntry = Omit<FieldSpec, 'control'> & {
    control?: Control;
    default?: unknown;
    in_place?: true;
    heading?: Heading | typeof UNHEADED;
    section?: string;
    key?: string;
};

/** The sources a field's `from` lists, offered together; none when it picks by another field. */
export function listedSources(spec: Pick<FieldSpec, 'from'>): Source[] {
    return Array.isArray(spec.from) ? spec.from : [];
}

/**
 * The lists of flags of the sources a spec's `from` lists, each a source whose words carry flags
 * (FLAG_SOURCES): the flags a word block drawn from them takes.
 */
export function flagSources(spec: Pick<FieldSpec, 'from'>): Source[] {
    return listedSources(spec).flatMap((source) => {
        const flags = FLAG_SOURCES[source];
        return flags === undefined ? [] : [flags];
    });
}

/**
 * The flags a word block drawn from a spec's `from` takes: the items of every list of flags
 * `flagSources` gives, together, each read with `items`. Null while one of them is not held.
 */
export function blockFlags(
    spec: Pick<FieldSpec, 'from'>,
    items: (source: Source) => string[] | null
): string[] | null {
    let flags: string[] | null = [];
    for (const source of flagSources(spec)) {
        const listed = items(source);
        flags = listed === null || flags === null ? null : [...flags, ...listed];
    }
    return flags;
}

/** The `{ field, sources }` a field's `from` is, when the source is picked by another field. */
export function pickedSources(spec: Pick<FieldSpec, 'from'>): ValuesBy | undefined {
    return Array.isArray(spec.from) ? undefined : spec.from;
}

/**
 * Whether a check of this field reads another field of its record: its options come from the field
 * `from` picks by, or its path may be missing while the toggle field `allow_missing` names is true.
 */
export function readsOther(spec: CatalogEntry): boolean {
    return pickedSources(spec) !== undefined || typeof spec.allow_missing === 'string';
}

/** Config file name, then dotted key path, then entry. */
export type Catalog = Record<string, Record<string, CatalogEntry>>;

/** What was wrong with an entry or a field of it, and where. */
export type OptionProblem = {
    kind:
        | 'control'
        | 'control_missing'
        | 'source'
        | 'no_values'
        | 'no_help'
        | 'no_fields'
        | 'range'
        | 'whole'
        | 'form'
        | 'slots'
        | 'holds'
        | 'sparse'
        | 'heading_missing'
        | 'heading_unknown'
        | 'key'
        | 'groups'
        | 'group_missing'
        | 'group_unknown';
    file: string;
    /** The entry's key path, or for a group problem the group's (`groups` itself for `groups`). */
    path: string;
    /** The dotted path of the field inside the entry, null for the entry itself. */
    field: string | null;
    /** The word the problem is about: the control, the source, the form, the heading or the key. */
    word: string;
};

/** Whether a problem is about a line of the file's `groups:` rather than an entry. */
export function groupProblem(problem: OptionProblem): boolean {
    return (
        problem.kind === 'groups' ||
        problem.kind === 'group_missing' ||
        problem.kind === 'group_unknown'
    );
}

/** Where in the catalog a spec is read from. */
type Spot = { file: string; path: string; field: string | null };

/** A value that is a finite number, and nothing else. */
function finite(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** The sources a `from` list names, each checked against SOURCES. */
function sourcesOf(value: unknown, flag: (word: string) => void): Source[] {
    const words = typeof value === 'string' ? [value] : Array.isArray(value) ? strings(value) : [];
    const sources: Source[] = [];
    for (const word of words) {
        if (isSource(word)) sources.push(word);
        else flag(word);
    }
    return sources;
}

/** A `from` map read, or undefined when it is not `{ field, sources }`. */
function valuesByOf(value: unknown, flag: (word: string) => void): ValuesBy | undefined {
    if (!isMap(value) || typeof value.field !== 'string' || !isMap(value.sources)) return undefined;
    const sources: Record<string, Source> = {};
    for (const [word, source] of Object.entries(value.sources)) {
        if (isSource(source)) sources[word] = source;
        else flag(String(source));
    }
    return { field: value.field, sources };
}

/**
 * One entry or field read into its typed form. `top` is an entry of the file's map (it may carry a
 * heading, a section, a default and `key`; an entry or a field of a family may carry `holds`),
 * `local` an entry of `local.yml` (a control only where it takes a number or a choice, no heading).
 * Everything wrong is pushed to `problems`; a problem with the control reads the control as `text`,
 * one with the heading puts the entry under `unheaded`, and one with the key leaves the entry
 * without it.
 */
function readSpec(
    raw: unknown,
    spot: Spot,
    top: boolean,
    local: boolean,
    problems: OptionProblem[]
): CatalogEntry {
    const map = isMap(raw) ? raw : typeof raw === 'string' ? { help: raw } : {};
    const fieldString = !top && typeof raw === 'string';
    const wrong = { any: false };
    const flag = (kind: OptionProblem['kind'], word = ''): void => {
        problems.push({ ...spot, kind, word });
        // A heading or a key read wrong costs the entry its place or its row-by-row override, and
        // leaves its control as it is.
        if (kind !== 'heading_missing' && kind !== 'heading_unknown' && kind !== 'key') {
            wrong.any = true;
        }
    };
    const entry: CatalogEntry = { help: '' };
    const help = str(map.help);
    if (help === undefined) {
        if (!fieldString) flag('no_help');
    } else {
        entry.help = help;
    }

    if (isMap(map.fields)) {
        const fields: Record<string, FieldSpec> = {};
        for (const [name, field] of Object.entries(map.fields)) {
            const inner = { ...spot, field: spot.field === null ? name : `${spot.field}.${name}` };
            const read = readSpec(field, inner, false, false, problems);
            fields[name] = { ...read, control: read.control ?? 'text' };
        }
        entry.fields = fields;
    }
    const family = entry.fields !== undefined;

    const word = map.control;
    if (top && family) {
        // A family is described by its fields; it has no control of its own.
    } else if (word === undefined) {
        if (family) entry.control = 'records';
        else if (top && !local) flag('control_missing');
        else if (!top) entry.control = 'text';
    } else if (!oneOf(CONTROLS, word)) {
        flag('control', typeof word === 'string' ? word : JSON.stringify(word));
    } else if (word === 'records' && !family) {
        flag('no_fields');
    } else {
        entry.control = word;
    }
    // A text field keeps its fields when it also takes one record of them (takesRecord).
    const either = entry.control === 'text' && map.holds === 'record';
    if (!top && family && entry.control !== 'records' && !either) delete entry.fields;

    const options = Array.isArray(map.options) ? strings(map.options) : undefined;
    if (options !== undefined) entry.options = options;
    const by = valuesByOf(map.from, (source) => flag('source', source));
    const from = by === undefined ? sourcesOf(map.from, (source) => flag('source', source)) : [];
    if (by !== undefined) entry.from = by;
    else if (from.length > 0) entry.from = from;
    if (
        (entry.control === 'choice' || entry.control === 'multi') &&
        (options === undefined || options.length === 0) &&
        map.from === undefined
    ) {
        flag('no_values');
    }
    // A word block draws its words from the list `from` names and its flags from that list's flags,
    // so it names one.
    if (entry.control === 'words' && listedSources(entry).length === 0) flag('no_values');

    if (map.empty === true) entry.empty = true;
    else if (typeof map.empty === 'string' && map.empty !== '') entry.empty = map.empty;
    if (map.joined === true) entry.joined = true;
    if (map.allow_missing === true || typeof map.allow_missing === 'string') {
        entry.allow_missing = map.allow_missing;
    }
    if (map.items === 'number') entry.items = 'number';
    const min = finite(map.min);
    const max = finite(map.max);
    if (min !== undefined) entry.min = min;
    if (max !== undefined) entry.max = max;
    if (min !== undefined && max !== undefined && min > max) flag('range');
    if (map.whole === true) entry.whole = true;
    else if (map.whole !== undefined) flag('whole');
    if (isForm(map.form)) entry.form = map.form;
    else if (map.form !== undefined) {
        flag('form', typeof map.form === 'string' ? map.form : JSON.stringify(map.form));
    }
    if (map.slots !== undefined) {
        const slots = strings(map.slots);
        if (!Array.isArray(map.slots) || slots.length === 0 || slots.length !== map.slots.length) {
            flag('slots');
        } else {
            entry.slots = slots;
        }
    }

    if (top) {
        if (Object.hasOwn(map, 'default')) entry.default = map.default;
        const section = str(map.section);
        if (section !== undefined) entry.section = section;
        // A record list's key names one of its fields; any other word leaves the list replaced
        // whole by a workspace file.
        if (Object.hasOwn(map, 'key')) {
            const key = map.key;
            if (typeof key === 'string' && Object.hasOwn(entry.fields ?? {}, key)) entry.key = key;
            else flag('key', typeof key === 'string' ? key : JSON.stringify(key));
        }
        if (!local) {
            const heading = str(map.heading);
            if (heading === undefined) flag('heading_missing');
            else if (!oneOf(HEADINGS, heading)) flag('heading_unknown', heading);
            entry.heading = oneOf(HEADINGS, heading) ? heading : UNHEADED;
        }
    }
    // Only a key/value family takes `holds: lists`, a map of lists of records being no shape, and
    // only a family, or a family field with no `key` field, takes `holds: record`: a family of one
    // record reads its `key` as one more field, as a record of a list does.
    if (map.holds !== undefined) {
        const fields = entry.fields;
        const lists = map.holds === 'lists' && fields !== undefined && isPairs(fields);
        const record =
            map.holds === 'record' &&
            fields !== undefined &&
            (top || !Object.hasOwn(fields, 'key'));
        if (lists) entry.holds = 'lists';
        else if (record) entry.holds = 'record';
        else flag('holds', typeof map.holds === 'string' ? map.holds : JSON.stringify(map.holds));
    }
    // Only a family is drawn sparse: its cards show the fields set, with a menu for the others.
    if (map.sparse === true && entry.fields !== undefined) entry.sparse = true;
    else if (map.sparse !== undefined) flag('sparse');
    if (wrong.any && entry.fields === undefined) entry.control = 'text';
    return entry;
}

/** Config file name, then group path, then the group's help line. */
export type Groups = Record<string, Record<string, string>>;

/**
 * The catalog read into its typed form, the help lines of the groups that have one, and everything
 * wrong with either.
 */
export type ReadCatalog = { catalog: Catalog; groups: Groups; problems: OptionProblem[] };

/** Every group of a file's options: each proper prefix of a dotted key path, in the order met. */
function groupPaths(paths: readonly string[]): string[] {
    const groups = new Set<string>();
    for (const path of paths) {
        const steps = path.split('.');
        for (let at = 1; at < steps.length; at += 1) groups.add(steps.slice(0, at).join('.'));
    }
    return [...groups];
}

/**
 * The help lines of one file's groups, read against its option paths. A group with no line or an
 * empty one, a line whose path is no group (no option lies under it, or it is an option itself),
 * and a `groups:` that is no map are problems; a line that is no text counts as no line, and with
 * no `groups:` at all every group is a problem of its own.
 */
function readGroups(
    file: string,
    paths: readonly string[],
    raw: unknown,
    problems: OptionProblem[]
): Record<string, string> {
    const spot = { file, field: null, word: '' };
    if (raw !== undefined && !isMap(raw)) {
        problems.push({ ...spot, kind: 'groups', path: 'groups' });
        return {};
    }
    const lines = raw ?? {};
    const groups = groupPaths(paths);
    const read: Record<string, string> = {};
    for (const group of groups) {
        const line = byKey(lines, group);
        if (typeof line === 'string' && line.trim() !== '') read[group] = line;
        else problems.push({ ...spot, kind: 'group_missing', path: group });
    }
    for (const path of Object.keys(lines)) {
        if (!groups.includes(path)) problems.push({ ...spot, kind: 'group_unknown', path });
    }
    return read;
}

/**
 * Every entry of the merged config's `options` key, read as readSpec says, and every file's group
 * help lines of `option_groups`, read as readGroups says.
 */
export function readCatalog(config: Record<string, unknown>): ReadCatalog {
    const catalog: Catalog = {};
    const groups: Groups = {};
    const problems: OptionProblem[] = [];
    const lines = readOr(mapShape, config.option_groups, {});
    for (const [file, entries] of Object.entries(readOr(mapShape, config.options, {}))) {
        if (!isMap(entries)) continue;
        const read: Record<string, CatalogEntry> = {};
        for (const [path, raw] of Object.entries(entries)) {
            read[path] = readSpec(
                raw,
                { file, path, field: null },
                true,
                file === 'local.yml',
                problems
            );
        }
        catalog[file] = read;
        groups[file] = readGroups(file, Object.keys(entries), byKey(lines, file), problems);
    }
    return { catalog, groups, problems };
}

/**
 * The catalog held by the merged config's `options` key, and an empty one when the key is missing
 * or is not a map.
 */
export function catalogOf(config: Record<string, unknown>): Catalog {
    return readCatalog(config).catalog;
}

/** Whether the catalog describes this path as a family, which is an entry holding `fields`. */
function isFamily(entries: Record<string, CatalogEntry>, path: string): boolean {
    const entry: unknown = byKey(entries, path);
    return isMap(entry) && Object.hasOwn(entry, 'fields');
}

/**
 * The key path of every option of one parsed config file. A map is descended into, a family
 * entry's path is returned as it stands without looking inside, and every other value is a leaf:
 * a scalar, a null, a list of any items, and a map with no keys. A file that is not a map has no
 * options. Two different keys can give one path (`a.b` beside `a` holding `b`); the path is
 * returned once for each.
 */
export function optionPaths(file: unknown, entries: Record<string, CatalogEntry>): string[] {
    const paths: string[] = [];
    const visit = (value: unknown, path: string): void => {
        if (path !== '' && isFamily(entries, path)) {
            paths.push(path);
        } else if (isMap(value) && Object.keys(value).length > 0) {
            for (const [key, inner] of Object.entries(value)) {
                visit(inner, path === '' ? key : `${path}.${key}`);
            }
        } else if (path !== '') {
            paths.push(path);
        }
    };
    if (isMap(file)) visit(file, '');
    return paths;
}

/** The keys of a map held at a merged-config path, or nothing when it is not a map. */
function keysAt(value: unknown): string[] {
    return isMap(value) ? Object.keys(value) : [];
}

/** The `key` of each map of a list. */
function keysOfRows(value: unknown): string[] {
    return Array.isArray(value)
        ? value.flatMap((row) => (isMap(row) ? strings([row.key]) : []))
        : [];
}

/** Whether a source's items are held by the merged config alone. */
const FROM_CONFIG: readonly Source[] = [
    'models',
    'arrangements',
    'rail_pages',
    'catalogue_groups',
    'collections',
    'project_stages',
    'project_forms',
    'tiers',
    'roles',
    'stage_flags',
    'status_chips',
    'chip_flags',
    'entry_statuses',
    'ticker_categories',
    'focus_clusters',
    'bundle_ids'
];

/**
 * The records of the hub named `hub` in an entity map of the merged portfolio, by the key their own
 * hub's file gives them, which is how a setting names a record: a setting names a record of the
 * primary hub. None while the workspace has no primary.
 */
export function hubRecords<T>(records: Record<string, T>, hub: string | null): Record<string, T> {
    const own: Record<string, T> = {};
    for (const one of Object.values(records)) {
        if (hub === null || !isMap(one) || one.root !== hub || typeof one.id !== 'string') continue;
        own[keyOf(one.id)] = one;
    }
    return own;
}

/**
 * The records of an entity map of the merged portfolio that a key read from the hub `primary`
 * names, by that key, which is how the key `self` of the primary's `local.yml` names its person:
 * the primary's own record of each key it holds, and the record of the one other hub that holds a
 * key the primary does not. A key two or more other hubs hold names none. None while the workspace
 * has no primary. The Settings choice of `self` and the server's check of a write of it both read
 * this.
 */
export function resolvedRecords<T>(
    records: Record<string, T>,
    primary: string | null
): Record<string, T> {
    if (primary === null) return {};
    const rooted = Object.values(records).flatMap((one) =>
        isMap(one) && typeof one.id === 'string' && typeof one.root === 'string'
            ? [{ record: one, id: one.id, root: one.root }]
            : []
    );
    const holders = holdersOf(rooted);
    const named: Record<string, T> = {};
    for (const one of rooted) {
        const key = keyOf(one.id);
        if (resolvedId(holders, primary, key) === one.id) named[key] = one.record;
    }
    return named;
}

/** The keys of the resources of one kind in an entity map, which the page and the server list. */
export function resourcesOfKind(resources: Record<string, unknown>, kind: string): string[] {
    return Object.entries(resources).flatMap(([id, one]) =>
        isMap(one) && one.kind === kind ? [id] : []
    );
}

/**
 * The items of a source the merged config alone holds, or null for a source that is read from
 * elsewhere (the portfolio, the languages, the code themes, the view registry, the fs). The page
 * and the server both read these lists through here, so they cannot disagree.
 */
export function configItems(source: Source, config: Record<string, unknown>): string[] | null {
    if (!FROM_CONFIG.includes(source)) return null;
    switch (source) {
        case 'models': {
            const agents = isMap(config.agents) ? config.agents : {};
            const claude = isMap(agents.claude) ? agents.claude : {};
            const lists = isMap(claude.lists) ? claude.lists : {};
            const model = isMap(lists.model) ? lists.model : {};
            const values = Array.isArray(model.values) ? model.values : [];
            return values.flatMap((row) =>
                isMap(row) && typeof row.pass === 'string' && typeof row.id === 'string'
                    ? [row.id]
                    : []
            );
        }
        case 'arrangements':
            return keysAt(config.arrangements);
        case 'rail_pages':
            return Array.isArray(config.rail)
                ? config.rail.flatMap((row) => (isMap(row) ? strings([row.page]) : []))
                : [];
        case 'catalogue_groups':
            return catalogueGroupIds(config);
        case 'collections':
            return keysOfRows(config.collections);
        case 'project_stages':
            return vocabKeys(config.stages);
        case 'project_forms':
            return vocabKeys(config.forms);
        case 'tiers':
            return vocabKeys(config.tiers);
        case 'roles':
            return vocabKeys(config.roles);
        case 'stage_flags':
            return flagsOf(config.stages);
        case 'status_chips':
            return vocabKeys(config.chips);
        case 'chip_flags':
            return flagsOf(config.chips);
        case 'entry_statuses':
            return coloredWords(config.statuses);
        case 'ticker_categories':
            return keysAt(config.ticker_categories);
        case 'focus_clusters':
            return keysOfRows(config.focus_clusters);
        default: {
            const open = isMap(config.open) ? config.open : {};
            const programs = isMap(open.program_ext) ? Object.values(open.program_ext) : [];
            return [...new Set(strings(programs))];
        }
    }
}

/**
 * The items of every source a spec's `from` lists, together, from the merged config; null while
 * one of them is a source the config alone does not hold, so a word is not checked against it.
 */
export function sourcedItems(
    spec: Pick<FieldSpec, 'from'>,
    config: Record<string, unknown>
): string[] | null {
    let sourced: string[] | null = [];
    for (const source of listedSources(spec)) {
        const items = configItems(source, config);
        sourced = items === null || sourced === null ? null : [...sourced, ...items];
    }
    return sourced;
}

/**
 * The flags of every source a spec's `from` lists that carries flags, together, from the merged
 * config: the flags a word block takes. Null while one of them is not held.
 */
export function flaggedItems(
    spec: Pick<FieldSpec, 'from'>,
    config: Record<string, unknown>
): string[] | null {
    return blockFlags(spec, (source) => configItems(source, config));
}

/**
 * The hue a palette class names: the class with its `c-` taken off, unless it is a shade (`-s`,
 * `-bg`, `-t`) or not a `c-` class at all (`muted` has no colour token of its own).
 */
export function hueOfClass(name: string): string | undefined {
    if (!name.startsWith('c-')) return undefined;
    const hue = name.slice(2);
    return /-(s|bg|t)$/.test(hue) ? undefined : hue;
}

/** The palette map of the merged config, hex to class, as it is held. */
function paletteOf(config: Record<string, unknown>): [string, string][] {
    const palette = isMap(config.palette) ? config.palette : {};
    return Object.entries(palette).flatMap(([hex, name]) =>
        typeof name === 'string' ? [[hex.toLowerCase(), name] as [string, string]] : []
    );
}

/** The hue names of the palette, each once, in the order the palette first names them. */
export function hueNames(config: Record<string, unknown>): string[] {
    const names = new Set<string>();
    for (const [, name] of paletteOf(config)) {
        const hue = hueOfClass(name);
        if (hue !== undefined) names.add(hue);
    }
    return [...names];
}

/** The first hex the palette gives a hue, or nothing when the palette has no such hue. */
export function hueHex(config: Record<string, unknown>, hue: string): string | undefined {
    return paletteOf(config).find(([, name]) => hueOfClass(name) === hue)?.[0];
}

/**
 * The palette class of a hex, read in lower case, or nothing for a hex the palette does not hold.
 * The class may be a shade or `muted`; hueOfClass says whether it is a hue.
 */
export function classOfHex(config: Record<string, unknown>, hex: string): string | undefined {
    const lower = hex.toLowerCase();
    return paletteOf(config).find(([key]) => key === lower)?.[1];
}

/** The `tag.class` of every project slide the projects' decks hold, each once, in the order met. */
export function slideTagClasses(projects: { deckTags?: string[] }[]): string[] {
    return [...new Set(projects.flatMap((project) => project.deckTags ?? []))];
}
