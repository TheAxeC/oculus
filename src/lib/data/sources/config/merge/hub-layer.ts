// Layer 1, data. The hub's settings file, `<hub>/.oculus/config.yml`, laid over oculus's values:
// the keys of HUB_LIST (data/helpers/hub-names.ts), which describe the hub rather than the reader.
// A key of config/catalogs/vocab.yml is laid over oculus's value by its shape (in-place.ts): a map
// by its words in oculus's place, `categories` by its rows' `key`, and the lists whose order is
// their meaning whole. A word the hub's values no longer give, taken out with `<word>: null` or by
// a list replaced whole, also leaves every word list that names it, each option and each field of
// an option's rows the options catalog describes with a `from` naming that list: in oculus's own
// values, a row left with no word stays and a board's one-word `tier` or `role` becomes an empty
// list; in a list or row the hub wrote, each such word is one finding naming the hub's file at the
// word's place there. The options' defaults lose the word the same way. `manifest_fields`, the
// fields the hub adds to the project form, is read row by row here: a row is a field of
// `manifest_schema` under the key `field` it adds to project.yml, and a row that would change a
// field oculus's form has, or that the form cannot draw, is left out. Every other key replaces
// oculus's value whole.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { findingText } from '../../../helpers/finding-text.ts';
import { isMap } from '../../../helpers/guards.ts';
import { HUB_FILE, hubFileOf, hubKeys } from '../../../helpers/hub-names.ts';
import { issueText, shapeIssues } from '../../../shapes/shape-issues.ts';
import { readAs } from '../../../shapes/shapes.ts';
import { SOURCES, type Source } from '../../../shapes/catalog-words.ts';
import { configItems } from '../catalog/options.ts';
import {
    VOCAB_SHAPES,
    layInPlace,
    problemFinding,
    wrongKindFinding,
    type InPlace
} from './in-place.ts';
import { LOCAL_NAME } from '../local.ts';
import { MANIFEST_WIDGETS, manifestFieldRow } from '../../../shapes/catalog-files/manifest.ts';
import { MANIFEST_FIELDS_KEY } from '../../../shapes/vocab-keys.ts';
import { keysShape, notAMap, unparsed, type PendingFinding } from './text.ts';
import { setAt, valueAt } from './tree.ts';

/**
 * A value the hub's settings file holds for a key of oculus's vocabulary, laid over oculus's by
 * the key's shape, with the finding of each part that cannot be applied, oculus's entry standing
 * for it; a value of the wrong kind leaves oculus's value whole. Undefined for a key merged whole.
 */
function vocabValue(
    path: string,
    oculus: unknown,
    value: unknown,
    file: string,
    pending: PendingFinding[]
): { value: unknown; wrong?: true } | undefined {
    if (!Object.hasOwn(VOCAB_SHAPES, path)) return undefined;
    const shape = VOCAB_SHAPES[path];
    const laid = layInPlace(shape, oculus, value);
    if ('wrong' in laid) {
        pending.push(wrongKindFinding(file, path, path, laid.wrong));
        return { value: oculus, wrong: true };
    }
    for (const problem of laid.problems) {
        const key = shape.kind === 'map' ? `${path}.${problem.entry}` : path;
        pending.push(problemFinding(file, key, path, problem));
    }
    return { value: laid.value };
}

/** The shape of a value the hub's file writes whole. */
const WHOLE_LIST: InPlace = { kind: 'whole' };

/** The lists of a word block that name words; its `flags` and `not_flags` name flags. */
const BLOCK_WORDS = ['words', 'not_words'] as const;

/** The words each source of the options catalog gives under the merged config `config`. */
function sourceWords(config: Record<string, unknown>): Map<Source, Set<string>> {
    const words = new Map<Source, Set<string>>();
    for (const source of SOURCES) {
        const items = configItems(source, config);
        if (items !== null) words.set(source, new Set(items));
    }
    return words;
}

/**
 * The words each source gave before the hub's values were laid and gives no longer: those the
 * hub's file takes out with `<word>: null`, and those a list it replaces whole leaves out.
 */
function gone(
    before: ReadonlyMap<Source, ReadonlySet<string>>,
    after: ReadonlyMap<Source, ReadonlySet<string>>
): Map<Source, Set<string>> {
    const out = new Map<Source, Set<string>>();
    for (const [source, words] of before) {
        const left = after.get(source);
        const lost = [...words].filter((word) => left?.has(word) !== true);
        if (lost.length > 0) out.set(source, new Set(lost));
    }
    return out;
}

/**
 * The sources a field of an options family names its words from, for the row `row`: its `from` as
 * one source, a list of them, or the source its row's `field` picks.
 */
function fieldSources(spec: unknown, row: Record<string, unknown>): Source[] {
    if (!isMap(spec)) return [];
    const from = spec.from;
    let named: unknown[] = [];
    if (typeof from === 'string') named = [from];
    else if (Array.isArray(from)) named = from;
    else if (isMap(from) && isMap(from.sources) && typeof from.field === 'string') {
        const picked = row[from.field];
        named = typeof picked === 'string' ? [from.sources[picked]] : [];
    }
    return SOURCES.filter((source) => named.includes(source));
}

/** Whether the spec `spec` takes a word or a list of words (`control: multi`). */
function takesList(spec: unknown): boolean {
    return isMap(spec) && spec.control === 'multi';
}

/**
 * A field's value without the words of `lost`: a list of words, a word block's word lists, and,
 * for a field that takes a word or a list (`list`), its one word, which leaves an empty list.
 */
function withoutWords(value: unknown, lost: ReadonlySet<string>, list = false): unknown {
    if (typeof value === 'string') return list && lost.has(value) ? [] : value;
    if (Array.isArray(value)) {
        return value.filter((word) => typeof word !== 'string' || !lost.has(word));
    }
    if (!isMap(value)) return value;
    const kept = { ...value };
    for (const list of BLOCK_WORDS) {
        if (Array.isArray(kept[list])) kept[list] = withoutWords(kept[list], lost);
    }
    return kept;
}

/** The words of `lost` that the spec `spec` names its words from for the row `row`. */
function lostOf(
    spec: unknown,
    row: Record<string, unknown>,
    lost: ReadonlyMap<Source, ReadonlySet<string>>
): Set<string> {
    return new Set(fieldSources(spec, row).flatMap((source) => [...(lost.get(source) ?? [])]));
}

/**
 * The value of the field `field` of the row `row` without the words of `lost` its spec names: a
 * list of words or a word block when the spec has a `from`, and, for a field described as a map
 * of `key` to `value` (a board's word block, keyed by `words`, `not_words`, `flags` and
 * `not_flags`), each entry's list without the words the `value` spec names for that key.
 */
function fieldWithout(
    spec: unknown,
    row: Record<string, unknown>,
    field: string,
    lost: ReadonlyMap<Source, ReadonlySet<string>>
): unknown {
    const value = row[field];
    const gone = lostOf(spec, row, lost);
    if (gone.size > 0) return withoutWords(value, gone, takesList(spec));
    const inner = isMap(spec) && isMap(spec.fields) ? spec.fields.value : undefined;
    if (inner === undefined || !isMap(value)) return value;
    const entries = Object.entries(value).map(([key, words]) => {
        const named = lostOf(inner, { key, value: words }, lost);
        return [key, named.size > 0 ? withoutWords(words, named, takesList(inner)) : words];
    });
    return Object.fromEntries(entries);
}

/**
 * Whether the hub's file wrote the row `row` (named `name` in a map) of the value `written` it
 * holds for a key of the shape `shape`: a word of a map, or a row of a keyed list by its field.
 */
function hubWrote(shape: InPlace, written: unknown, name: string, row: unknown): boolean {
    if (written === undefined) return false;
    if (shape.kind === 'map') return isMap(written) && Object.hasOwn(written, name);
    if (shape.kind !== 'rows') return true;
    const field = shape.field;
    return (
        Array.isArray(written) &&
        written.some((one) => isMap(one) && isMap(row) && one[field] === row[field])
    );
}

/** The texts a value holds: itself, each item of a list, and those of each entry of a map. */
function textsOf(value: unknown): string[] {
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.flatMap(textsOf);
    return isMap(value) ? Object.values(value).flatMap(textsOf) : [];
}

/**
 * Words a value of the hub's file lost, said at `key`, the place of that value in the hub's file:
 * one finding for each text `before` holds and `after` does not, said at the entry of a map that
 * holds it (`stages.words` of a word block).
 */
type Say = (key: string, before: unknown, after: unknown) => void;

/**
 * The place in the hub's file of the row at `index` of the list `value` the merged config holds
 * at `path`, or null for a row of oculus's: every row of a list the hub's file wrote whole, and a
 * row of a keyed list the hub's file names by its field, at its index there.
 */
function rowPlace(
    path: string,
    shape: InPlace,
    written: unknown,
    row: unknown,
    index: number
): string | null {
    if (written === undefined || !Array.isArray(written)) return null;
    if (shape.kind !== 'rows') return `${path}[${index}]`;
    const field = shape.field;
    const at = written.findIndex((one) => isMap(one) && isMap(row) && one[field] === row[field]);
    return at < 0 ? null : `${path}[${at}]`;
}

/**
 * The value `value` an option `entry` at `path` describes without the words of `lost`, as
 * `dropRemovedWords` says. `written` is the hub's file's value at `path`, and `say`, when given,
 * words each word taken out of a list or a row the hub's file wrote, at its place there; without
 * `say` no part of the value is the hub's (oculus's default of the option).
 */
function prunedValue(
    path: string,
    value: unknown,
    entry: Record<string, unknown>,
    written: unknown,
    lost: ReadonlyMap<Source, ReadonlySet<string>>,
    say: Say | null
): unknown {
    const shape = Object.hasOwn(VOCAB_SHAPES, path) ? VOCAB_SHAPES[path] : WHOLE_LIST;
    const hub = say !== null && written !== undefined;
    const words = lostOf(entry, {}, lost);
    if (words.size > 0 && (Array.isArray(value) || typeof value === 'string')) {
        const next = withoutWords(value, words, takesList(entry));
        if (hub) say(path, value, next);
        return next;
    }
    const fields = isMap(entry.fields) ? entry.fields : {};
    const prune = (row: unknown, name: string, place: string | null): unknown => {
        if (!isMap(row)) {
            const spec = fields.value;
            if (spec === undefined) return row;
            const next = withoutWords(
                row,
                lostOf(spec, { key: name, value: row }, lost),
                takesList(spec)
            );
            if (place !== null) say?.(place, row, next);
            return next;
        }
        const kept = { ...row };
        for (const [field, spec] of Object.entries(fields)) {
            if (!Object.hasOwn(kept, field)) continue;
            const next = fieldWithout(spec, kept, field, lost);
            if (place !== null) say?.(`${place}.${field}`, kept[field], next);
            kept[field] = next;
        }
        return kept;
    };
    if (Array.isArray(value)) {
        return value.map((row, index) =>
            prune(row, '', hub ? rowPlace(path, shape, written, row, index) : null)
        );
    }
    if (!isMap(value)) return value;
    const rows = Object.entries(value).map(([name, row]) => {
        const place = hub && hubWrote(shape, written, name, row) ? `${path}.${name}` : null;
        return [name, prune(row, name, place)];
    });
    return Object.fromEntries(rows);
}

/**
 * The words a hub's values no longer give, taken out of every word list that names words of that
 * list: each option, and each field of an option's rows, that the options catalog
 * (config/options/) describes with a `from` naming the list, the vocabulary's own rows among them
 * (config/options/catalogs/vocab.yml). A field that takes a word or a list of words (`control:
 * multi`, a board's `tier` or `role`) and holds the one word taken out is left an empty list, and a
 * field that takes one word alone is left as it is. A row of oculus's left with no word stays with
 * its other fields. A word taken out of a list or a row the hub's file wrote is one finding naming
 * the hub's file `file` and the word's place there, so no reader words it again at the merged
 * place. `hub` holds the values of the hub's file the merge applied. Each option's `default` loses
 * the words the same way, so the Settings view compares a value with oculus's as this hub reads
 * it. The machine's own options (local.yml) hold no value of the merge and are not read.
 */
function dropRemovedWords(
    config: Record<string, unknown>,
    hub: Record<string, unknown>,
    lost: ReadonlyMap<Source, ReadonlySet<string>>,
    file: string,
    pending: PendingFinding[]
): void {
    const say: Say = (key, before, after) => {
        if (isMap(before) && isMap(after)) {
            for (const [step, one] of Object.entries(before))
                say(`${key}.${step}`, one, after[step]);
            return;
        }
        const left = new Set(textsOf(after));
        for (const word of new Set(textsOf(before))) {
            if (left.has(word)) continue;
            pending.push({
                file,
                key,
                words: (catalog) => findingText(catalog, 'findings.config.hub_word_gone', key, word)
            });
        }
    };
    const options = isMap(config.options) ? config.options : {};
    const described: Record<string, unknown> = {};
    for (const [name, entries] of Object.entries(options)) {
        if (name === LOCAL_NAME || !isMap(entries)) {
            described[name] = entries;
            continue;
        }
        const kept: Record<string, unknown> = {};
        for (const [path, entry] of Object.entries(entries)) {
            kept[path] = entry;
            if (!isMap(entry)) continue;
            const value = valueAt(config, path);
            if (value !== undefined) {
                setAt(config, path, prunedValue(path, value, entry, valueAt(hub, path), lost, say));
            }
            if (Object.hasOwn(entry, 'default')) {
                const shipped = prunedValue(path, entry.default, entry, undefined, lost, null);
                kept[path] = { ...entry, default: shipped };
            }
        }
        described[name] = kept;
    }
    config.options = described;
}

/** The sections and the field names of oculus's `manifest_schema` in the merged config. */
function oculusForm(config: Record<string, unknown>): { sections: string[]; fields: string[] } {
    const schema = isMap(config.manifest_schema) ? config.manifest_schema : {};
    return {
        sections: isMap(schema.sections) ? Object.keys(schema.sections) : [],
        fields: isMap(schema.fields) ? Object.keys(schema.fields) : []
    };
}

/**
 * The rows of a hub's `manifest_fields` the form takes, in the hub's order, each checked against
 * oculus's form: a row with no `field`, one naming a field oculus's form has or an earlier row
 * names, one whose `section` is not a section of the form, one whose `type` is no widget the form
 * draws, and one its row shape refuses otherwise are each a finding naming the hub's file and the
 * row's key (`manifest_fields.0.section`), and are left out. A value that is no list is a finding,
 * and no field is added.
 */
function readManifestFields(
    value: unknown,
    config: Record<string, unknown>,
    file: string,
    pending: PendingFinding[]
): unknown[] {
    const key = MANIFEST_FIELDS_KEY;
    if (!Array.isArray(value)) {
        pending.push(wrongKindFinding(file, key, key, 'list'));
        return [];
    }
    const form = oculusForm(config);
    const named = new Set<string>();
    const taken: unknown[] = [];
    const say = (at: string, words: PendingFinding['words']): void => {
        pending.push({ file, key: at, words });
    };
    value.forEach((row, index) => {
        const at = `${key}.${index}`;
        const field = isMap(row) && typeof row.field === 'string' ? row.field.trim() : '';
        if (!isMap(row) || field === '') {
            say(`${at}.field`, (catalog) =>
                findingText(catalog, 'findings.config.manifest_field_none', `${at}.field`)
            );
            return;
        }
        if (form.fields.includes(field)) {
            say(`${at}.field`, (catalog) =>
                findingText(catalog, 'findings.config.manifest_field_held', `${at}.field`, field)
            );
            return;
        }
        if (named.has(field)) {
            say(`${at}.field`, (catalog) =>
                findingText(
                    catalog,
                    'findings.config.manifest_field_repeated',
                    `${at}.field`,
                    field
                )
            );
            return;
        }
        named.add(field);
        const section = typeof row.section === 'string' ? row.section : '';
        if (!form.sections.includes(section)) {
            say(`${at}.section`, (catalog) =>
                findingText(
                    catalog,
                    'findings.config.manifest_field_section',
                    `${at}.section`,
                    section
                )
            );
            return;
        }
        const type = typeof row.type === 'string' ? row.type : '';
        if (!MANIFEST_WIDGETS.some((one) => one === type)) {
            say(`${at}.type`, (catalog) =>
                findingText(catalog, 'findings.config.manifest_field_type', `${at}.type`, type)
            );
            return;
        }
        const read = manifestFieldRow.safeParse(row);
        if (!read.success) {
            const step = read.error.issues[0]?.path.map(String).join('.') ?? '';
            const where = step === '' ? at : `${at}.${step}`;
            say(where, (catalog) =>
                findingText(catalog, 'findings.config.manifest_field_shape', where)
            );
            return;
        }
        taken.push(row);
    });
    return taken;
}

/**
 * The hub's settings file, read after oculus's config. A value the file holds at a path of HUB_LIST
 * is laid over oculus's value at that path: a key of the vocabulary by its shape, `manifest_fields`
 * row by row, any other key whole. A map is walked only while its path is a strict prefix of a
 * listed path, so `slurm: { resource: x, poll_min: 3 }` applies `slurm.resource` and names
 * `slurm.poll_min`. A key outside the list is a finding that names the hub's file and the key, and
 * nothing of it is applied; a file that is empty, is no map or does not parse (a key twice
 * included) is a finding and oculus's values stand. The file is not required, and a hub without it
 * adds nothing. The merged values are checked against the shape of oculus's file their key belongs
 * to. `from` names the hub's file for every key it set, and for a map of the vocabulary, oculus's
 * file for each of oculus's words the merged map holds and the hub did not write. `text` is the
 * file's text to read instead of the disk, null for the file removed.
 */
export function mergeHub(
    hub: string,
    text: string | null | undefined,
    config: Record<string, unknown>,
    from: Record<string, string>,
    pending: PendingFinding[]
): void {
    const file = join(hub, HUB_FILE);
    const listed = hubKeys();
    let parsed: unknown;
    if (text === null) return;
    try {
        parsed = parse(text ?? readFileSync(file, 'utf8'));
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
        pending.push(unparsed(file, error));
        return;
    }
    const top = readAs(keysShape, parsed);
    if (top === null) {
        pending.push(notAMap(file));
        return;
    }
    const written: Record<string, unknown> = {};
    const walk = (node: Record<string, unknown>, prefix: string): void => {
        for (const [key, value] of Object.entries(node)) {
            const path = prefix === '' ? key : `${prefix}.${key}`;
            if (listed.includes(path)) {
                setAt(written, path, value);
            } else if (listed.some((one) => one.startsWith(`${path}.`))) {
                if (isMap(value)) walk(value, path);
                else {
                    pending.push({
                        file,
                        key: path,
                        words: (catalog) =>
                            findingText(catalog, 'findings.config.hub_key_not_map', path)
                    });
                }
            } else {
                pending.push({
                    file,
                    key: path,
                    words: (catalog) =>
                        findingText(catalog, 'findings.config.hub_key_unknown', path)
                });
            }
        }
    };
    walk(top, '');
    const applied: Record<string, unknown> = {};
    const hubValues: Record<string, unknown> = {};
    for (const path of listed) {
        const value = valueAt(written, path);
        if (value === undefined) continue;
        const oculus = valueAt(config, path);
        const laid: { value: unknown; wrong?: true } =
            path === MANIFEST_FIELDS_KEY
                ? { value: readManifestFields(value, config, file, pending) }
                : (vocabValue(path, oculus, value, file, pending) ?? { value });
        setAt(applied, path, laid.value);
        if (laid.wrong === undefined) setAt(hubValues, path, value);
    }
    const files = [...new Set(listed.map((key) => hubFileOf(key) ?? ''))];
    for (const name of files) {
        const own: Record<string, unknown> = {};
        for (const key of listed.filter((one) => hubFileOf(one) === name)) {
            const head = key.split('.')[0];
            if (head in applied) own[head] = applied[head];
        }
        for (const issue of shapeIssues(name, own)) {
            pending.push({ file, key: issue.key, words: (catalog) => issueText(catalog, issue) });
        }
    }
    const before = sourceWords(config);
    for (const path of listed) {
        const value = valueAt(applied, path);
        if (value === undefined) continue;
        const earlier = Object.hasOwn(from, path) ? from[path] : undefined;
        const oculus = valueAt(config, path);
        setAt(config, path, value);
        from[path] = HUB_FILE;
        if (!Object.hasOwn(VOCAB_SHAPES, path) || !isMap(value) || !isMap(oculus)) continue;
        const own = valueAt(hubValues, path);
        for (const word of Object.keys(value)) {
            const kept = !isMap(own) || !Object.hasOwn(own, word);
            if (kept && earlier !== undefined) from[`${path}.${word}`] = earlier;
        }
    }
    const lost = gone(before, sourceWords(config));
    if (lost.size > 0) dropRemovedWords(config, hubValues, lost, file, pending);
}
