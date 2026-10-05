// Layer 2, server. Reads and edits the generated YAML feeds and the LinkedIn Markdown folder.
// The feed table keeps paths, identities, and writable fields together so reads and writes cannot
// disagree about which generated file or entry they address. The feed writes go through the entry
// edits of server/edit and the write route reaches them from server/edit/writes.ts, so the module
// sits in server/edit with both.
//
// Whether a path lies in a folder is read from server/core/paths.ts (`inside`).

import { existsSync, readFileSync, readdirSync, renameSync, statSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { parse } from 'yaml';
import { z } from 'zod';
import { localDate } from '../../data/helpers/dates.ts';
import { isMap, scalar } from '../../data/helpers/guards.ts';
import { addressKey, radarText, sameTitle } from '../../data/prose/literature.ts';
import { loadConfig } from '../../data/sources/config.ts';
import { collectionSchema } from '../../data/snapshot/normalise.ts';
import { fieldNames } from '../../data/snapshot/validate.ts';
import { plain } from '../core/changes.ts';
import { writeTextAtomic } from '../core/json.ts';
import { mapShape, unchanged } from '../../data/shapes/shapes.ts';
import {
    appendEntry,
    deleteEntry,
    renderEntry,
    setEntryFields,
    startEntries,
    takeOutAppended
} from './entry-edit/index.ts';
import { replacedText } from './writes/config/config-checks.ts';
import { saved } from './writes/entries.ts';
import { NOT_A_FIELD_VALUE, asFieldValue } from './yaml/yaml-edit.ts';
import type { ChangeRecord } from '../core/changes.ts';
import type { Refusal } from './yaml/yaml-edit.ts';
import type { FieldValue } from './yaml/yaml-values.ts';
import type { FeedData, FeedKind, FeedsPayload, PortfolioConfig } from '../../data/model/index.ts';
import type { WriteOutcome } from './writes.ts';
import { inside } from '../core/paths.ts';

export type FeedRead = FeedData & { kind: FeedKind; file: string };

type FeedRule = { identity: string; fields: string[]; deletable: boolean };

export const FEED_RULES: Record<FeedKind, FeedRule> = {
    radar: { identity: 'title', fields: ['dismissed'], deletable: false },
    leads: { identity: 'title', fields: ['status'], deletable: true },
    linkedin: { identity: 'file', fields: [], deletable: false }
};

export function isFeedKind(value: string): value is FeedKind {
    return value === 'radar' || value === 'leads' || value === 'linkedin';
}

/** Resolve one configured feed path only when it remains inside the hub. */
export function feedFile(hub: string, config: PortfolioConfig, kind: FeedKind): string | null {
    const path = resolve(join(hub, config.feeds[kind]));
    return inside(path, hub) ? path : null;
}

/** The `meta` of a feed file: a map, and the empty map when the file has none. */
const feedMetaShape = z.optional(mapShape).transform((held) => held ?? {});

/** The `entries` of a feed file: a list of maps, and the empty list when the file has none. */
const feedEntriesShape = unchanged(z.array(z.looseObject({})))
    .nullish()
    .transform((held) => held ?? []);

/** A feed file whose `entries` is a list, which is where an append goes. */
const feedListedShape = z.looseObject({ entries: z.array(z.unknown()) });

/** Parse one feed, requiring its root, meta, and every entry to be maps. */
export function readFeedFile(
    hub: string,
    config: PortfolioConfig,
    kind: FeedKind
): FeedRead | null {
    const file = feedFile(hub, config, kind);
    if (file === null) throw new Error(`the ${kind} feed path is outside the hub`);
    if (!existsSync(file)) return null;
    if (kind === 'linkedin' && !statSync(file).isDirectory()) return null;
    if (kind === 'linkedin') return readLinkedinFolder(file, config);
    const parsed: unknown = parse(readFileSync(file, 'utf8'));
    if (!isMap(parsed)) throw new Error(`${file}: expected a map of keys`);
    const meta = feedMetaShape.safeParse(parsed.meta);
    if (!meta.success) throw new Error(`${file}: meta is not a map`);
    const entries = feedEntriesShape.safeParse(parsed.entries);
    if (!entries.success) throw new Error(`${file}: every entry must be a map`);
    const schema = collectionSchema(parsed.schema);
    return {
        kind,
        file: config.feeds[kind],
        meta: meta.data,
        entries: entries.data,
        ...(schema === undefined ? {} : { schema })
    };
}

/** Read every feed into the complete state payload published on the socket. */
export function buildFeeds(hub: string, config: PortfolioConfig): FeedsPayload {
    const read = (kind: FeedKind): FeedsPayload[FeedKind] => {
        const base = {
            ok: true as const,
            kind,
            file: config.feeds[kind],
            meta: {},
            entries: []
        };
        try {
            const found = readFeedFile(hub, config, kind);
            if (found !== null) return { ok: true, ...found };
            return {
                ...base,
                missing: true,
                ...(kind === 'linkedin' ? { cadenceDays: config.linkedinCadenceDays } : {})
            };
        } catch (error) {
            return {
                ...base,
                error: error instanceof Error ? error.message : String(error),
                ...(kind === 'linkedin' ? { cadenceDays: config.linkedinCadenceDays } : {})
            };
        }
    };
    return {
        radar: read('radar'),
        leads: read('leads'),
        linkedin: read('linkedin')
    };
}

/**
 * One small Markdown front matter block and the prose after its closing fence. A key the block does
 * not hold is not in the answer, so every reader of one falls back for itself.
 */
export function linkedinFrontMatter(
    source: string
): Record<string, string | undefined> & { body: string } {
    const matched = /^\s*---\s*\r?\n([\s\S]*?)\r?\n---(?:\r?\n)?/.exec(source);
    const fields: Record<string, string> = {};
    if (matched !== null) {
        for (const line of matched[1].split(/\r?\n/)) {
            const split = line.indexOf(':');
            if (split < 0) continue;
            const key = line.slice(0, split).trim();
            let value = line.slice(split + 1).trim();
            if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
                try {
                    const decoded: unknown = JSON.parse(value);
                    value = typeof decoded === 'string' ? decoded : value.slice(1, -1);
                } catch {
                    value = value.slice(1, -1);
                }
            }
            if (key !== '') fields[key] = value;
        }
    }
    return {
        ...fields,
        body: (matched === null ? source : source.slice(matched[0].length)).trim()
    };
}

/** A flat LinkedIn post or idea filename, with a case-insensitive Markdown suffix. */
export function isLinkedinFile(file: string | null): boolean {
    return (
        file !== null &&
        !/[/\\]/.test(file) &&
        /\.md$/i.test(file) &&
        (file.startsWith('xx-') || /^\d+-/.test(file))
    );
}

/** Read every Markdown entry in the configured LinkedIn folder in filename order. */
function readLinkedinFolder(folder: string, config: PortfolioConfig): FeedRead {
    if (!statSync(folder).isDirectory()) throw new Error(`${folder}: expected a directory`);
    const entries = readdirSync(folder)
        .filter(isLinkedinFile)
        .sort((left, right) => left.localeCompare(right))
        .map((file) => {
            const parsed = linkedinFrontMatter(readFileSync(join(folder, file), 'utf8'));
            return {
                file,
                title: (parsed.title ?? '') || file,
                date: parsed.date ?? '',
                category: parsed.category ?? '',
                body: parsed.body,
                idea: file.startsWith('xx-')
            };
        });
    return {
        kind: 'linkedin',
        file: config.feeds.linkedin,
        meta: {},
        entries,
        cadenceDays: config.linkedinCadenceDays
    };
}

function outcome(changed: string[] = [], refused: Refusal[] = []): WriteOutcome {
    return { found: true, changed, refused };
}

function linkedinFolder(hub: string, config: PortfolioConfig): string | null {
    const folder = feedFile(hub, config, 'linkedin');
    if (folder === null || !existsSync(folder) || !statSync(folder).isDirectory()) return null;
    return folder;
}

/**
 * How many characters of the slug a filename keeps, so a long title stays well inside a name's
 * limit.
 */
const SLUG_MAX = 80;

function slugOf(title: string): string {
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, SLUG_MAX)
        .replace(/-+$/, '');
    return slug || 'post';
}

/** Add one empty LinkedIn idea file without leaving its configured folder. */
export function addLinkedinIdea(
    hub: string,
    config: PortfolioConfig,
    titleValue: unknown,
    categoryValue: unknown
): WriteOutcome {
    const title = typeof titleValue === 'string' ? titleValue.trim() : '';
    if (title === '') {
        return outcome([], [{ field: 'title', reason: 'a LinkedIn idea needs a title' }]);
    }
    const folder = linkedinFolder(hub, config);
    if (folder === null) return { found: false, changed: [], refused: [] };
    const category = typeof categoryValue === 'string' ? categoryValue.trim() : '';
    const slug = slugOf(title);
    let file = `xx-${slug}.md`;
    let suffix = 2;
    while (existsSync(join(folder, file))) {
        file = `xx-${slug}-${suffix}.md`;
        suffix += 1;
    }
    const source = [
        '---',
        'layout: post',
        `title: ${JSON.stringify(title)}`,
        `category: ${JSON.stringify(category)}`,
        'publish: True',
        `date: ${localDate(Date.now())}`,
        '---',
        '',
        ''
    ].join('\n');
    writeTextAtomic(join(folder, file), source);
    // A scaffolded Markdown file has no inverse writer: deleting a post is done in the folder, not
    // from a list, so the record says what was made and offers no way back.
    return {
        ...outcome(['file']),
        records: [
            {
                file: join(folder, file),
                key: file,
                field: 'entries',
                before: null,
                after: { title, category },
                undo: 'none'
            }
        ]
    };
}

/** Rename an idea and each same-basename sidecar to the next numbered post basename. */
export function markLinkedinPosted(
    hub: string,
    config: PortfolioConfig,
    fileValue: unknown
): WriteOutcome {
    const file = typeof fileValue === 'string' ? basename(fileValue) : '';
    const matched = /^xx-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/.exec(file);
    if (matched === null || file !== fileValue) {
        return outcome(
            [],
            [{ field: 'file', reason: 'a LinkedIn post must name an xx-*.md idea' }]
        );
    }
    const folder = linkedinFolder(hub, config);
    if (folder === null) return { found: false, changed: [], refused: [] };
    const source = join(folder, file);
    if (!existsSync(source) || !statSync(source).isFile()) {
        return { found: false, changed: [], refused: [] };
    }
    const names = readdirSync(folder);
    const highest = names.reduce((value, name) => {
        const number = /^(\d+)-/.exec(name);
        return number === null ? value : Math.max(value, Number(number[1]));
    }, 0);
    const prefix = String(highest + 1).padStart(2, '0');
    const stem = `xx-${matched[1]}`;
    const moving = names.filter((name) => name === file || name.startsWith(`${stem}.`));
    const targets = moving.map((name) => `${prefix}-${name.slice(3)}`);
    if (targets.some((name) => existsSync(join(folder, name)))) {
        return outcome(
            [],
            [{ field: 'file', reason: 'the numbered LinkedIn post exists already' }]
        );
    }
    moving.forEach((name, at) => renameSync(join(folder, name), join(folder, targets[at])));
    // A promotion renames the idea and its sidecars; there is no writer that renames them back, so
    // the record names both lists and offers no way back.
    return {
        ...outcome(['file']),
        records: [
            {
                file: join(folder, targets[moving.indexOf(file)]),
                key: file,
                field: 'entries',
                before: moving,
                after: targets,
                undo: 'none'
            }
        ]
    };
}

/** Append one position lead in the order of the feed file's own schema. */
export function addLead(
    hub: string,
    config: PortfolioConfig,
    fields: Record<string, unknown>
): WriteOutcome {
    const full = feedFile(hub, config, 'leads');
    if (full === null || !existsSync(full)) return { found: false, changed: [], refused: [] };
    const source = readFileSync(full, 'utf8');
    const parsed = readFeedFile(hub, config, 'leads');
    if (parsed === null) return { found: false, changed: [], refused: [] };
    const schema = parsed.schema;
    if (schema === undefined) {
        return {
            found: true,
            changed: [],
            refused: [{ field: 'schema', reason: 'the leads feed has no valid schema' }]
        };
    }
    const title = typeof fields.title === 'string' ? fields.title.trim() : '';
    if (title === '') {
        return {
            found: true,
            changed: [],
            refused: [{ field: 'title', reason: 'a lead needs a title' }]
        };
    }
    if (parsed.entries.some((entry) => scalar(entry.title).trim() === title)) {
        return {
            found: true,
            changed: [],
            refused: [{ field: 'title', reason: 'a lead with this title is in the file already' }]
        };
    }

    const values: Record<string, FieldValue> = {};
    const refused: Refusal[] = [];
    for (const field of fieldNames(schema)) {
        let raw = fields[field];
        if (field === 'title') raw = title;
        if (field === 'date' && (typeof raw !== 'string' || raw.trim() === '')) {
            raw = localDate(Date.now());
        }
        if (field === 'status' && (typeof raw !== 'string' || raw.trim() === '')) raw = 'open';
        const value = asFieldValue(raw);
        if (value === undefined) {
            if (raw !== undefined) {
                refused.push({ field, reason: NOT_A_FIELD_VALUE });
            }
            continue;
        }
        values[field] = value;
    }
    const block = renderEntry(fieldNames(schema), 'title', values);
    const out = saved(full, source, appendEntry(source, 'entries', block));
    const records: ChangeRecord[] =
        out.changed.length === 0
            ? []
            : [
                  {
                      file: full,
                      key: title,
                      field: 'entries',
                      before: null,
                      after: values,
                      undo: 'create'
                  }
              ];
    return { ...out, refused: [...refused, ...out.refused], records };
}

/** The fields of a Lit Watch entry in the order the file writes them. */
const RADAR_ORDER = [
    'title',
    'authors',
    'venue',
    'year',
    'url',
    'bucket',
    'project',
    'relevance',
    'why',
    'found'
];

/** The relevance words the file holds. */
const RELEVANCE = ['high', 'med', 'low'];

const PAPER_IN_FILE = 'this paper is in Lit Watch already';
const FILE_UNREAD = "Lit Watch's file does not read";

/** The keys of the radar buckets in the vocabulary the engine's configuration holds. */
const bucketKeysShape = z.array(z.looseObject({ key: z.string() })).catch([]);

export function radarBucketKeys(engine: string): string[] {
    const held = loadConfig(engine).config.radar_buckets;
    return bucketKeysShape.parse(held).map((one) => one.key);
}

/** The text a field of a Lit Watch entry is written as: plain text on one line. */
function radarField(raw: unknown): string {
    if (Array.isArray(raw))
        return raw
            .map((one) => radarField(one))
            .filter(Boolean)
            .join(', ');
    return typeof raw === 'string' ? radarText(raw) : '';
}

/**
 * Append one paper to the Lit Watch radar, in the order of RADAR_ORDER with the empty fields left
 * out and `found` today's date. A title or address the file holds already is refused. A file that
 * does not parse is refused and left as it is; an `entries:` holding nothing, written `entries: []`
 * or with nothing under it, takes the paper as its first entry. The result is parsed again and
 * kept only when it is the file as it was with this one entry added.
 *
 * `buckets` are the keys of the bucket vocabulary a bucket must be one of. The record carries the
 * text the append added, which the undo takes out again byte for byte.
 */
export function addRadarEntry(
    hub: string,
    config: PortfolioConfig,
    fields: Record<string, unknown>,
    buckets: string[]
): WriteOutcome {
    const full = feedFile(hub, config, 'radar');
    if (full === null || !existsSync(full)) return { found: false, changed: [], refused: [] };
    const source = readFileSync(full, 'utf8');
    let parsed: FeedRead | null;
    try {
        parsed = readFeedFile(hub, config, 'radar');
    } catch {
        return outcome([], [{ field: 'entries', reason: FILE_UNREAD }]);
    }
    if (parsed === null) return { found: false, changed: [], refused: [] };

    const text = (field: string): string => radarField(fields[field]);
    const title = text('title');
    if (title === '') return outcome([], [{ field: 'title', reason: 'a paper needs a title' }]);
    const bucket = text('bucket');
    if (!buckets.includes(bucket)) {
        return outcome(
            [],
            [{ field: 'bucket', reason: 'the bucket is not one of the radar buckets' }]
        );
    }
    const relevance = text('relevance');
    if (relevance !== '' && !RELEVANCE.includes(relevance)) {
        return outcome([], [{ field: 'relevance', reason: 'the relevance is high, med or low' }]);
    }
    const url = text('url');
    const known = (field: string, same: (held: string) => boolean): boolean =>
        parsed.entries.some((one) => same(scalar(one[field])));
    if (known('title', (held) => sameTitle(held, title))) {
        return outcome([], [{ field: 'title', reason: PAPER_IN_FILE }]);
    }
    if (url !== '' && known('url', (held) => addressKey(held) === addressKey(url))) {
        return outcome([], [{ field: 'url', reason: PAPER_IN_FILE }]);
    }

    const year = typeof fields.year === 'number' ? fields.year : Number(text('year'));
    const given: Record<string, unknown> = {
        title,
        authors: text('authors'),
        venue: text('venue'),
        year: Number.isInteger(year) && year > 0 ? year : '',
        url,
        bucket,
        project: text('project'),
        relevance,
        why: text('why'),
        found: localDate(Date.now())
    };
    const values: Record<string, FieldValue> = {};
    for (const name of RADAR_ORDER) {
        const held = asFieldValue(given[name]);
        if (held !== undefined && held !== '') values[name] = held;
    }
    const block = renderEntry(RADAR_ORDER, 'title', values);
    const edit = appendEntry(source, 'entries', block);
    if (edit.changed.length === 0) return { found: true, changed: [], refused: edit.refused };
    let reread: { entries: Record<string, unknown>[] } | null;
    try {
        reread = readFeedFileText(edit.text);
    } catch {
        reread = null;
    }
    const wanted = [...parsed.entries, values];
    if (reread === null || !isDeepStrictEqual(reread.entries, wanted)) {
        return outcome(
            [],
            [{ field: 'entries', reason: 'the edit did not verify; nothing was written' }]
        );
    }
    const out = saved(full, source, edit);
    const replaced = replacedText(source, edit.text);
    return {
        ...out,
        records: [
            {
                file: full,
                key: title,
                field: 'entries',
                before: null,
                after: values,
                undo: 'create',
                ...(replaced === null ? {} : { replaced })
            }
        ]
    };
}

/** A radar file's entries as a text holds them, or null when it is no map with a list of maps. */
function readFeedFileText(text: string): { entries: Record<string, unknown>[] } | null {
    const held: unknown = parse(text);
    if (!isMap(held)) return null;
    const entries = feedEntriesShape.safeParse(held.entries);
    return entries.success ? { entries: entries.data } : null;
}

/** A record's replaced text as the log holds it: a whole offset and two texts, else none. */
const replacedShape = z.object({ offset: z.int().min(0), before: z.string(), after: z.string() });

/**
 * Take one Lit Watch entry out again, the way an undo of its append does, by its title. The text
 * the append added goes back over what the append left when the file still holds it there, so the
 * file is what it was byte for byte; a file edited since has the entry's lines and the blank line
 * the append put over them taken out. The reader's own Delete never reaches this.
 */
export function removeRadarEntry(
    hub: string,
    config: PortfolioConfig,
    title: string,
    replaced: unknown
): WriteOutcome {
    const full = feedFile(hub, config, 'radar');
    if (full === null || !existsSync(full)) return { found: false, changed: [], refused: [] };
    const source = readFileSync(full, 'utf8');
    let parsed: FeedRead | null;
    try {
        parsed = readFeedFile(hub, config, 'radar');
    } catch {
        return outcome([], [{ field: 'entries', reason: FILE_UNREAD }]);
    }
    const at = parsed?.entries.findIndex((one) => scalar(one.title) === title) ?? -1;
    if (parsed === null || at < 0) return { found: false, changed: [], refused: [] };

    const put = replacedShape.safeParse(replaced);
    if (put.success && source.startsWith(put.data.after, put.data.offset)) {
        const { offset, before, after } = put.data;
        const text = `${source.slice(0, offset)}${before}${source.slice(offset + after.length)}`;
        let reread: { entries: Record<string, unknown>[] } | null;
        try {
            reread = readFeedFileText(text);
        } catch {
            reread = null;
        }
        const wanted = parsed.entries.filter((_one, index) => index !== at);
        if (reread !== null && isDeepStrictEqual(reread.entries, wanted)) {
            return saved(full, source, { text, changed: ['entries'], refused: [] });
        }
    }
    return saved(full, source, takeOutAppended(source, 'title', title));
}

/**
 * Put one recorded feed entry back exactly as it was recorded: every field it held, in the order
 * the file's own schema names them, and nothing derived. It is what an undo of a deletion goes
 * through, since addLead fills a missing status and today's date for an entry the reader is adding
 * and an entry that is coming back needs neither.
 *
 * A feed whose last entry was deleted keeps its `entries:` key with nothing under it, which is not
 * a list to append to; the entry is then written under that key the way a first entry is.
 */
export function restoreFeedEntry(
    hub: string,
    config: PortfolioConfig,
    feed: FeedKind,
    fields: Record<string, unknown>
): WriteOutcome {
    const full = feedFile(hub, config, feed);
    if (full === null || !existsSync(full)) return { found: false, changed: [], refused: [] };
    const source = readFileSync(full, 'utf8');
    const parsed = readFeedFile(hub, config, feed);
    if (parsed === null) return { found: false, changed: [], refused: [] };
    const ident = FEED_RULES[feed].identity;
    const value = scalar(fields[ident]).trim();
    if (value === '') {
        return outcome([], [{ field: ident, reason: `an entry needs a ${ident}` }]);
    }
    if (parsed.entries.some((one) => scalar(one[ident]).trim() === value)) {
        return outcome(
            [],
            [{ field: ident, reason: `an entry with that ${ident} is in the file` }]
        );
    }
    const values: Record<string, FieldValue> = {};
    const refused: Refusal[] = [];
    for (const [field, given] of Object.entries(fields)) {
        const held = asFieldValue(given);
        if (held === undefined) {
            refused.push({ field, reason: NOT_A_FIELD_VALUE });
            continue;
        }
        values[field] = held;
    }
    const block = renderEntry(fieldNames(parsed.schema), ident, values);
    if (block === '')
        return outcome([], [...refused, { field: ident, reason: 'nothing to write' }]);
    let held: unknown;
    try {
        held = parse(source);
    } catch {
        return outcome([], [...refused, { field: 'entries', reason: 'the file does not parse' }]);
    }
    const edit = feedListedShape.safeParse(held).success
        ? appendEntry(source, 'entries', block)
        : startEntries(source, 'entries', block);
    const out = saved(full, source, edit);
    return { ...out, refused: [...refused, ...out.refused] };
}

/** Set or clear the one field that a feed allows on the entry named by its identity. */
export function writeFeedField(
    hub: string,
    config: PortfolioConfig,
    feed: FeedKind,
    id: string,
    field: string,
    value: unknown
): WriteOutcome {
    const rule = FEED_RULES[feed];
    if (!rule.fields.includes(field)) {
        return {
            found: true,
            changed: [],
            refused: [{ field, reason: `the ${feed} feed does not allow that field` }]
        };
    }
    const full = feedFile(hub, config, feed);
    if (full === null || !existsSync(full)) return { found: false, changed: [], refused: [] };
    const source = readFileSync(full, 'utf8');
    const parsed = readFeedFile(hub, config, feed);
    const entry = parsed?.entries.find((one) => scalar(one[rule.identity]) === id);
    if (entry === undefined) return { found: false, changed: [], refused: [] };
    const out = saved(full, source, setEntryFields(source, rule.identity, id, { [field]: value }));
    if (out.changed.length === 0) return out;
    return {
        ...out,
        records: [
            {
                file: full,
                key: id,
                field,
                before: plain(entry[field]),
                after: plain(value),
                undo: 'field'
            }
        ]
    };
}

/** Delete one lead; the other feed histories are append-only and return a field refusal. */
export function deleteFeedEntry(
    hub: string,
    config: PortfolioConfig,
    feed: FeedKind,
    id: string
): WriteOutcome {
    const rule = FEED_RULES[feed];
    if (!rule.deletable) {
        return {
            found: true,
            changed: [],
            refused: [{ field: 'feed', reason: `the ${feed} feed does not allow deletion` }]
        };
    }
    const full = feedFile(hub, config, feed);
    if (full === null || !existsSync(full)) return { found: false, changed: [], refused: [] };
    const source = readFileSync(full, 'utf8');
    const parsed = readFeedFile(hub, config, feed);
    const entry = parsed?.entries.find((one) => scalar(one[rule.identity]) === id);
    if (entry === undefined) return { found: false, changed: [], refused: [] };
    const out = saved(full, source, deleteEntry(source, rule.identity, id));
    if (out.changed.length === 0) return out;
    return {
        ...out,
        records: [
            { file: full, key: id, field: 'entries', before: entry, after: null, undo: 'delete' }
        ]
    };
}
