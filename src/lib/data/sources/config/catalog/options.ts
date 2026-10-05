// Layer 1, data. The options catalog, config/catalogs/options.yml: every option of every config
// file described once, and the walk that says which key paths of a config file are options.
//
// The catalog's one top-level key, `options:`, rides in the merged config beside the other
// catalogs' keys. It maps a config file's name (`behavior.yml`, and `local.yml` for the machine's
// own keys) to a map of dotted key path to an entry: what the option does, its `default` (the value
// the Settings view's Reset writes and its Modified filter compares with, and, for a setting
// settings.ts reads, the value used when the key is missing or wrong), the heading and section the
// Settings view lists it under, and the control it is set with. It is there for an editor of the
// settings and a write of one key to look an option up, so a key path has one meaning wherever it
// is used.
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
import { mapShape, readOr } from '../../../shapes/shapes.ts';

/** The controls an option or a family field is set with, which decide what a value may be. */
export const CONTROLS = [
    'toggle',
    'number',
    'text',
    'long',
    'choice',
    'multi',
    'list',
    'glyph',
    'hue',
    'colour',
    'folder',
    'file',
    'path',
    'parked',
    'records'
] as const;

/** One of the words of CONTROLS. */
export type Control = (typeof CONTROLS)[number];

/** The subject headings of the Settings view, in the order they are drawn. */
export const HEADINGS = [
    'appearance',
    'editor',
    'terminal',
    'sessions',
    'cluster',
    'boards',
    'rail',
    'presentation',
    'sources',
    'calendar'
] as const;

/** One of the words of HEADINGS. */
export type Heading = (typeof HEADINGS)[number];

/** The heading of an entry that names none or names one HEADINGS lacks. */
export const UNHEADED = 'unheaded';

/** The lists a choice, a multi or a suggestion box can be drawn from. */
const SOURCES = [
    'domains',
    'clusters',
    'models',
    'languages',
    'arrangements',
    'rail_pages',
    'nav_groups',
    'collections',
    'project_types',
    'status_chips',
    'entry_statuses',
    'deck_framing',
    'deck_summaries',
    'slides',
    'slide_tags',
    'code_themes',
    'views',
    'theme_classes',
    'wallpapers',
    'usage_tiers',
    'bundle_ids'
] as const;

/** One of the words of SOURCES. */
export type Source = (typeof SOURCES)[number];

/** The forms a text can be held to, which value-rule.ts says what each looks like. */
const FORMS = ['program', 'extension', 'bundle_id'] as const;

/** One of the words of FORMS. */
export type Form = (typeof FORMS)[number];

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
 * entry that is not its heading, section or default. `values` is a fixed list; `values_from` the
 * sources whose items are offered together; `suggest_from` the source a text box offers; `empty`
 * adds the empty value as a choice that writes `''` (`true`, or the words that say what empty
 * does, which the choice draws for its empty item); `min` and `max` bound a number, or each item
 * of a list of numbers; `whole` holds a number, or each item of a list of numbers, to a whole
 * number; `form` holds a text, or each item of a list of texts, to one of FORMS; `slots` names the
 * fixed items of a list; `items: number` makes a list's items numbers; `joined` writes a multi as
 * one text separated by spaces; `allow_missing` lets a folder or file be absent, always (true) or
 * while the named toggle field of the record is true; `fields` describes the records of a
 * `records` field.
 */
export type FieldSpec = {
    description: string;
    control: Control;
    values?: string[];
    values_from?: Source[];
    values_by?: ValuesBy;
    suggest_from?: Source;
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
};

/**
 * One option, or one family. A leaf option carries `default`, the value the Settings view's Reset
 * writes and its Modified filter compares with and, for a setting settings.ts reads, the value used
 * when the key is missing or wrong, and a `control`; a family carries `fields` and no control, and
 * so does a `local.yml` key, which has a description alone. A family that is a map may carry
 * `holds: lists`, meaning each key of the map holds a list: of records, or of values for a
 * key/value family (fields `key` and `value`); a family without it takes no list at a key.
 * `heading` is the subject the option is listed under (`unheaded` when it names none a HEADINGS
 * word is), and `section` the group inside that heading, the first segment of the key path when
 * absent.
 */
export type CatalogEntry = Omit<FieldSpec, 'control'> & {
    control?: Control;
    default?: unknown;
    heading?: Heading | typeof UNHEADED;
    section?: string;
    holds?: 'lists';
};

/**
 * Whether a check of this field reads another field of its record: its values come from the field
 * `values_by` names, or its path may be missing while the toggle field `allow_missing` names is
 * true.
 */
export function readsOther(spec: CatalogEntry): boolean {
    return spec.values_by !== undefined || typeof spec.allow_missing === 'string';
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
        | 'no_description'
        | 'no_fields'
        | 'range'
        | 'whole'
        | 'form'
        | 'slots'
        | 'heading_missing'
        | 'heading_unknown';
    file: string;
    path: string;
    /** The dotted path of the field inside the entry, null for the entry itself. */
    field: string | null;
    /** The word the problem is about: the control, the source, the form or the heading. */
    word: string;
};

/** Where in the catalog a spec is read from. */
type Spot = { file: string; path: string; field: string | null };

/** A value that is a finite number, and nothing else. */
function finite(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** The sources a `values_from` or `suggest_from` names, each checked against SOURCES. */
function sourcesOf(value: unknown, flag: (word: string) => void): Source[] {
    const words = typeof value === 'string' ? [value] : Array.isArray(value) ? strings(value) : [];
    const sources: Source[] = [];
    for (const word of words) {
        if (isSource(word)) sources.push(word);
        else flag(word);
    }
    return sources;
}

/** A `values_by` map read, or undefined when it is not `{ field, sources }`. */
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
 * heading, a section, a default and `holds`), `local` an entry of `local.yml` (no control, no
 * heading). Everything wrong is pushed to `problems`; a problem with the control reads the control
 * as `text`, one with the heading puts the entry under `unheaded`.
 */
function readSpec(
    raw: unknown,
    spot: Spot,
    top: boolean,
    local: boolean,
    problems: OptionProblem[]
): CatalogEntry {
    const map = isMap(raw) ? raw : typeof raw === 'string' ? { description: raw } : {};
    const fieldString = !top && typeof raw === 'string';
    const wrong = { any: false };
    const flag = (kind: OptionProblem['kind'], word = ''): void => {
        problems.push({ ...spot, kind, word });
        if (kind !== 'heading_missing' && kind !== 'heading_unknown') wrong.any = true;
    };
    const entry: CatalogEntry = { description: '' };
    const description = str(map.description);
    if (description === undefined) {
        if (!fieldString) flag('no_description');
    } else {
        entry.description = description;
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
    if (!top && family && entry.control !== 'records') delete entry.fields;

    const values = Array.isArray(map.values) ? strings(map.values) : undefined;
    if (values !== undefined) entry.values = values;
    const from = sourcesOf(map.values_from, (source) => flag('source', source));
    if (from.length > 0) entry.values_from = from;
    const by = valuesByOf(map.values_by, (source) => flag('source', source));
    if (by !== undefined) entry.values_by = by;
    const suggested = sourcesOf(map.suggest_from, (source) => flag('source', source));
    if (suggested.length > 0) entry.suggest_from = suggested[0];
    if (
        (entry.control === 'choice' || entry.control === 'multi') &&
        (values === undefined || values.length === 0) &&
        map.values_from === undefined &&
        map.values_by === undefined
    ) {
        flag('no_values');
    }

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
        if (map.holds === 'lists') entry.holds = 'lists';
        if (!local) {
            const heading = str(map.heading);
            if (heading === undefined) flag('heading_missing');
            else if (!oneOf(HEADINGS, heading)) flag('heading_unknown', heading);
            entry.heading = oneOf(HEADINGS, heading) ? heading : UNHEADED;
        }
    }
    if (wrong.any && entry.fields === undefined) entry.control = 'text';
    return entry;
}

/** The catalog read into its typed form, with everything wrong in it. */
export type ReadCatalog = { catalog: Catalog; problems: OptionProblem[] };

/** Every entry of the merged config's `options` key, read as readSpec says. */
export function readCatalog(config: Record<string, unknown>): ReadCatalog {
    const catalog: Catalog = {};
    const problems: OptionProblem[] = [];
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
    }
    return { catalog, problems };
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
    'nav_groups',
    'collections',
    'project_types',
    'status_chips',
    'entry_statuses',
    'deck_framing',
    'deck_summaries',
    'bundle_ids'
];

/** The ids of the resources of one kind in an entity map, which the page and the server list. */
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
    const deck = isMap(config.deck) ? config.deck : {};
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
        case 'nav_groups':
            return keysAt(config.nav_groups);
        case 'collections':
            return keysOfRows(config.collections);
        case 'project_types':
            return keysAt(config.type_color);
        case 'status_chips':
            return keysOfRows(config.status_legend);
        case 'entry_statuses':
            return keysAt(config.status_palette);
        case 'deck_framing':
            return keysAt(deck.framing);
        case 'deck_summaries':
            return keysAt(deck.summaries);
        default: {
            const open = isMap(config.open) ? config.open : {};
            const programs = isMap(open.program_ext) ? Object.values(open.program_ext) : [];
            return [...new Set(strings(programs))];
        }
    }
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

/** The `tag.class` of every slide the projects declare, each once, in the order they are met. */
export function slideTagClasses(
    projects: { present?: { tag?: { class?: string } }[] }[]
): string[] {
    const classes = projects.flatMap((project) =>
        (project.present ?? []).flatMap((slide) => {
            const name = slide.tag?.class;
            return name === undefined || name === '' ? [] : [name];
        })
    );
    return [...new Set(classes)];
}
