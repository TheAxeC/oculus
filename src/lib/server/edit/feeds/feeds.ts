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
import { openWord } from '../../../data/accounts/leads.ts';
import { localDate } from '../../../data/helpers/dates.ts';
import { isMap, scalar, slugOf } from '../../../data/helpers/guards.ts';
import { addressKey, radarText, sameTitle } from '../../../data/prose/literature.ts';
import { ideaStub } from '../../../data/prose/linkedin-idea.ts';
import { FEED_IDENTITY } from '../../../data/snapshot/hubs/feeds.ts';
import { collectionSchema } from '../../../data/snapshot/normalise.ts';
import { fieldNames } from '../../../data/snapshot/validate.ts';
import { plain } from '../../core/changes.ts';
import { writeTextAtomic } from '../../core/json.ts';
import { words } from '../../core/words.ts';
import { mapShape, unchanged } from '../../../data/shapes/shapes.ts';
import {
    appendEntry,
    deleteEntry,
    renderEntry,
    setEntryFields,
    startEntries,
    takeOutAppended
} from '../entry-edit/index.ts';
import { putBack, replacedLines, replacedText } from '../writes/config/config-checks.ts';
import { saved, sharedRefusal, typeRefusals } from '../writes/entries.ts';
import { asFieldValue } from '../yaml/yaml-edit.ts';
import type { ChangeRecord } from '../../core/changes.ts';
import type { Refusal } from '../yaml/yaml-edit.ts';
import type { FieldValue } from '../yaml/yaml-values.ts';
import type {
    FeedData,
    FeedKind,
    FeedsPayload,
    PortfolioConfig,
    SchemaField
} from '../../../data/model/index.ts';
import type { WriteOutcome } from '../writes.ts';
import { inside } from '../../core/paths.ts';

export type FeedRead = FeedData & { kind: FeedKind; file: string };

/**
 * What a feed's entries are addressed and edited by. `fields` are always writable. With `schema`,
 * every other field the feed file's own `schema:` names is writable too, the identity excepted,
 * since the identity is what every write and every reference addresses an entry by.
 */
type FeedRule = { identity: string; fields: string[]; schema: boolean; deletable: boolean };

export const FEED_RULES: Record<FeedKind, FeedRule> = {
    radar: { identity: FEED_IDENTITY.radar, fields: ['dismissed'], schema: true, deletable: true },
    leads: { identity: FEED_IDENTITY.leads, fields: ['status'], schema: true, deletable: true },
    linkedin: { identity: FEED_IDENTITY.linkedin, fields: [], schema: false, deletable: false }
};

/** The fields of a feed an entry may be written at: the rule's own and its file's schema's. */
function writableFields(rule: FeedRule, schema: SchemaField[] | undefined): string[] {
    const named = rule.schema ? (schema ?? []).map((one) => one.field) : [];
    return [...new Set([...rule.fields, ...named])].filter((one) => one !== rule.identity);
}

export function isFeedKind(value: string): value is FeedKind {
    return value === 'radar' || value === 'leads' || value === 'linkedin';
}

/** Resolve one configured feed path only when it remains inside the hub. */
export function feedFile(hub: string, config: PortfolioConfig, kind: FeedKind): string | null {
    if (config.feeds[kind] === '') return null;
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
    if (config.feeds[kind] === '') return null;
    const file = feedFile(hub, config, kind);
    if (file === null) throw new Error(words(config.text, 'server.feeds.path_outside', kind));
    if (!existsSync(file)) return null;
    if (kind === 'linkedin' && !statSync(file).isDirectory()) return null;
    if (kind === 'linkedin') return readLinkedinFolder(file, config);
    const parsed: unknown = parse(readFileSync(file, 'utf8'));
    if (!isMap(parsed)) throw new Error(words(config.text, 'server.feeds.not_a_map', file));
    const meta = feedMetaShape.safeParse(parsed.meta);
    if (!meta.success) throw new Error(words(config.text, 'server.feeds.meta_not_a_map', file));
    const entries = feedEntriesShape.safeParse(parsed.entries);
    if (!entries.success) {
        throw new Error(words(config.text, 'server.feeds.entries_not_maps', file));
    }
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
export function buildFeeds(hub: string | null, config: PortfolioConfig): FeedsPayload {
    const read = (kind: FeedKind): FeedsPayload[FeedKind] => {
        const base = {
            ok: true as const,
            kind,
            file: config.feeds[kind],
            meta: {},
            entries: []
        };
        try {
            const found = hub === null ? null : readFeedFile(hub, config, kind);
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
    if (!statSync(folder).isDirectory()) {
        throw new Error(words(config.text, 'server.feeds.not_a_directory', folder));
    }
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

/**
 * Add one empty LinkedIn idea file without leaving its configured folder. The outcome's `id` is the
 * file's name, which the page opens the new file by.
 */
export function addLinkedinIdea(
    hub: string,
    config: PortfolioConfig,
    titleValue: unknown,
    categoryValue: unknown
): WriteOutcome {
    const title = typeof titleValue === 'string' ? titleValue.trim() : '';
    if (title === '') {
        return outcome(
            [],
            [{ field: 'title', reason: words(config.text, 'server.feeds.idea_needs_title') }]
        );
    }
    const folder = linkedinFolder(hub, config);
    if (folder === null) return { found: false, changed: [], refused: [] };
    const category = typeof categoryValue === 'string' ? categoryValue.trim() : '';
    const slug = slugOf(title, SLUG_MAX) || 'post';
    let file = `xx-${slug}.md`;
    let suffix = 2;
    while (existsSync(join(folder, file))) {
        file = `xx-${slug}-${suffix}.md`;
        suffix += 1;
    }
    writeTextAtomic(join(folder, file), ideaStub(title, category, localDate(Date.now())));
    // A scaffolded Markdown file has no inverse writer: deleting a post is done in the folder, not
    // from a list, so the record says what was made and offers no way back.
    return {
        ...outcome(['file']),
        id: file,
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
            [{ field: 'file', reason: words(config.text, 'server.feeds.post_needs_idea') }]
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
            [{ field: 'file', reason: words(config.text, 'server.feeds.post_exists') }]
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

/**
 * Append one position lead in the order of the feed file's own schema. A lead given no status gets
 * the word of `statuses` carrying `default_lead`, and none when no word carries it. The outcome's
 * `id` is the new lead's title, which its hub's file names it by.
 */
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
            refused: [
                { field: 'schema', reason: words(config.text, 'server.feeds.leads_no_schema') }
            ]
        };
    }
    const title = typeof fields.title === 'string' ? fields.title.trim() : '';
    if (title === '') {
        return {
            found: true,
            changed: [],
            refused: [
                { field: 'title', reason: words(config.text, 'server.feeds.lead_needs_title') }
            ]
        };
    }
    if (parsed.entries.some((entry) => scalar(entry.title).trim() === title)) {
        return {
            found: true,
            changed: [],
            refused: [
                { field: 'title', reason: words(config.text, 'server.feeds.lead_title_taken') }
            ]
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
        if (field === 'status' && (typeof raw !== 'string' || raw.trim() === '')) {
            raw = openWord(config.merged) || undefined;
        }
        const value = asFieldValue(raw);
        if (value === undefined) {
            if (raw !== undefined) {
                refused.push({
                    field,
                    reason: words(config.text, 'server.edit.not_a_field_value')
                });
            }
            continue;
        }
        values[field] = value;
    }
    const block = renderEntry(fieldNames(schema), 'title', values);
    const out = saved(full, source, appendEntry(source, 'entries', block, config.text));
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
    return {
        ...out,
        refused: [...refused, ...out.refused],
        records,
        ...(out.changed.length === 0 ? {} : { id: title })
    };
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

/** The shape of the radar buckets in the vocabulary, each with its key. */
const bucketKeysShape = z.array(z.looseObject({ key: z.string() })).catch([]);

/** The keys of the radar buckets the engine's own configuration `engineConfig` holds. */
export function radarBucketKeys(engineConfig: Record<string, unknown>): string[] {
    const held = engineConfig.radar_buckets;
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
 * text the append added, which the undo takes out again byte for byte. The outcome's `id` is the
 * new paper's title, which its hub's file names it by.
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
        return outcome(
            [],
            [{ field: 'entries', reason: words(config.text, 'server.feeds.file_unread') }]
        );
    }
    if (parsed === null) return { found: false, changed: [], refused: [] };

    const text = (field: string): string => radarField(fields[field]);
    const title = text('title');
    if (title === '') {
        return outcome(
            [],
            [{ field: 'title', reason: words(config.text, 'server.feeds.paper_needs_title') }]
        );
    }
    const bucket = text('bucket');
    if (!buckets.includes(bucket)) {
        return outcome(
            [],
            [{ field: 'bucket', reason: words(config.text, 'server.feeds.bucket_unknown') }]
        );
    }
    const relevance = text('relevance');
    if (relevance !== '' && !RELEVANCE.includes(relevance)) {
        return outcome(
            [],
            [{ field: 'relevance', reason: words(config.text, 'server.feeds.relevance_unknown') }]
        );
    }
    const url = text('url');
    const known = (field: string, same: (held: string) => boolean): boolean =>
        parsed.entries.some((one) => same(scalar(one[field])));
    if (known('title', (held) => sameTitle(held, title))) {
        return outcome(
            [],
            [{ field: 'title', reason: words(config.text, 'server.feeds.paper_in_file') }]
        );
    }
    if (url !== '' && known('url', (held) => addressKey(held) === addressKey(url))) {
        return outcome(
            [],
            [{ field: 'url', reason: words(config.text, 'server.feeds.paper_in_file') }]
        );
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
    const edit = appendEntry(source, 'entries', block, config.text);
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
            [{ field: 'entries', reason: words(config.text, 'server.edit.unverified') }]
        );
    }
    const out = saved(full, source, edit);
    const replaced = replacedText(source, edit.text);
    return {
        ...out,
        ...(out.changed.length === 0 ? {} : { id: title }),
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
        return outcome(
            [],
            [{ field: 'entries', reason: words(config.text, 'server.feeds.file_unread') }]
        );
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
    return saved(full, source, takeOutAppended(source, 'title', title, config.text));
}

/**
 * Put one recorded feed entry back exactly as it was recorded: every field it held, in the order
 * the file's own schema names them, and nothing derived. It is what an undo of a deletion goes
 * through, since addLead fills a missing status and today's date for a new entry and an entry that
 * is coming back needs neither.
 *
 * The text the deletion replaced (`replaced`, of its record) goes back at its place first, so the
 * file is what it was byte for byte, while the file still holds what the deletion left there and
 * the file with the text back lists the recorded entry and every other entry as it is now; a file
 * edited since gets the entry rendered and appended, and no hand change is written over.
 *
 * A feed whose last entry was deleted keeps its `entries:` key with nothing under it, which is not
 * a list to append to; the entry is then written under that key the way a first entry is.
 */
export function restoreFeedEntry(
    hub: string,
    config: PortfolioConfig,
    feed: FeedKind,
    fields: Record<string, unknown>,
    replaced?: unknown
): WriteOutcome {
    const full = feedFile(hub, config, feed);
    if (full === null || !existsSync(full)) return { found: false, changed: [], refused: [] };
    const source = readFileSync(full, 'utf8');
    const parsed = readFeedFile(hub, config, feed);
    if (parsed === null) return { found: false, changed: [], refused: [] };
    const ident = FEED_RULES[feed].identity;
    const value = scalar(fields[ident]).trim();
    if (value === '') {
        return outcome(
            [],
            [{ field: ident, reason: words(config.text, 'server.feeds.entry_needs_key', ident) }]
        );
    }
    if (parsed.entries.some((one) => scalar(one[ident]).trim() === value)) {
        return outcome(
            [],
            [{ field: ident, reason: words(config.text, 'server.entries.key_taken', ident) }]
        );
    }
    const back = putBackDeleted(source, parsed.entries, ident, value, fields, replaced);
    if (back !== null)
        return saved(full, source, { text: back, changed: ['entries'], refused: [] });
    const values: Record<string, FieldValue> = {};
    const refused: Refusal[] = [];
    for (const [field, given] of Object.entries(fields)) {
        const held = asFieldValue(given);
        if (held === undefined) {
            refused.push({ field, reason: words(config.text, 'server.edit.not_a_field_value') });
            continue;
        }
        values[field] = held;
    }
    const block = renderEntry(fieldNames(parsed.schema), ident, values);
    if (block === '') {
        const nothing = words(config.text, 'server.entries.nothing_to_write');
        return outcome([], [...refused, { field: ident, reason: nothing }]);
    }
    let held: unknown;
    try {
        held = parse(source);
    } catch {
        return outcome(
            [],
            [
                ...refused,
                { field: 'entries', reason: words(config.text, 'server.edit.file_no_parse') }
            ]
        );
    }
    const edit = feedListedShape.safeParse(held).success
        ? appendEntry(source, 'entries', block, config.text)
        : startEntries(source, 'entries', block, config.text);
    const out = saved(full, source, edit);
    return { ...out, refused: [...refused, ...out.refused] };
}

/**
 * The feed file's text with the text a deletion replaced put back at its place, or null when the
 * file no longer holds what the deletion left there, or the text back would not list `fields` as
 * the entry `value` names and every entry of `entries` as it is now.
 */
function putBackDeleted(
    source: string,
    entries: Record<string, unknown>[],
    ident: string,
    value: string,
    fields: Record<string, unknown>,
    replaced: unknown
): string | null {
    const put = replacedShape.safeParse(replaced);
    const text = put.success ? putBack(source, put.data) : null;
    if (text === null) return null;
    let reread: { entries: Record<string, unknown>[] } | null;
    try {
        reread = readFeedFileText(text);
    } catch {
        reread = null;
    }
    if (reread === null) return null;
    const named = (one: Record<string, unknown>) => scalar(one[ident]).trim() === value;
    const restored = reread.entries.filter(named);
    const fits =
        restored.length === 1 &&
        isDeepStrictEqual(restored[0], fields) &&
        isDeepStrictEqual(
            reread.entries.filter((one) => !named(one)),
            entries
        );
    return fits ? text : null;
}

/**
 * Set or clear one field that a feed allows on the entry named by its identity. The value is held
 * to the type the feed file's schema gives the field, and a file with two entries of one identity
 * is refused, since the second could not be addressed.
 */
export function writeFeedField(
    hub: string,
    config: PortfolioConfig,
    feed: FeedKind,
    id: string,
    field: string,
    value: unknown
): WriteOutcome {
    const rule = FEED_RULES[feed];
    const full = feedFile(hub, config, feed);
    if (full === null || !existsSync(full)) return { found: false, changed: [], refused: [] };
    const source = readFileSync(full, 'utf8');
    const parsed = readFeedFile(hub, config, feed);
    if (parsed === null) return { found: false, changed: [], refused: [] };
    if (!writableFields(rule, parsed.schema).includes(field)) {
        return {
            found: true,
            changed: [],
            refused: [{ field, reason: words(config.text, 'server.feeds.field_not_allowed', feed) }]
        };
    }
    const entry = parsed.entries.find((one) => scalar(one[rule.identity]) === id);
    if (entry === undefined) return { found: false, changed: [], refused: [] };
    const shared = sharedRefusal(parsed.entries, rule.identity, config.text);
    if (shared !== null) return shared;
    const typed = typeRefusals(parsed.schema, { [field]: value }, config.text);
    if (typed.length > 0) return { found: true, changed: [], refused: typed };
    const out = saved(
        full,
        source,
        setEntryFields(source, rule.identity, id, { [field]: value }, config.text)
    );
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

/** Delete one lead or paper; the LinkedIn folder is not a list of entries and is refused. */
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
            refused: [
                {
                    field: 'feed',
                    reason: words(config.text, 'server.feeds.delete_not_allowed', feed)
                }
            ]
        };
    }
    const full = feedFile(hub, config, feed);
    if (full === null || !existsSync(full)) return { found: false, changed: [], refused: [] };
    const source = readFileSync(full, 'utf8');
    const parsed = readFeedFile(hub, config, feed);
    const entry = parsed?.entries.find((one) => scalar(one[rule.identity]) === id);
    if (parsed === null || entry === undefined) return { found: false, changed: [], refused: [] };
    const shared = sharedRefusal(parsed.entries, rule.identity, config.text);
    if (shared !== null) return shared;
    const edit = deleteEntry(source, rule.identity, id, config.text);
    const out = saved(full, source, edit);
    if (out.changed.length === 0) return out;
    const replaced = replacedLines(source, edit.text);
    return {
        ...out,
        records: [
            {
                file: full,
                key: id,
                field: 'entries',
                before: entry,
                after: null,
                undo: 'delete',
                ...(replaced === null ? {} : { replaced })
            }
        ]
    };
}
