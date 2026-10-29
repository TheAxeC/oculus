// Layer 2, server. Reads and edits the generated YAML feeds and the LinkedIn Markdown folder.
// A lead and a Lit Watch paper are addressed by their file's primary key, the field its schema
// flags `primary_key: true` or, for a file with no schema, the one its `collections:` entry names
// (`FeedData.primary_key`); a file with neither takes no write. The feed table keeps the writable
// fields together so reads and writes cannot disagree about which entry they address. The feed
// writes go through the entry edits of server/edit and the write route reaches them from
// server/edit/writes.ts, so the module sits in server/edit with both. The append of a Lit Watch
// paper and its undo are the radar's own, in radar.ts.
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
import { ideaStub } from '../../../data/prose/linkedin-idea.ts';
import { splitFrontmatter } from '../../../data/sources/documents/docs.ts';
import { feedPrimaryKey } from '../../../data/helpers/hub-names.ts';
import { primaryKeyOf } from '../../../data/model/index.ts';
import { keyFaultOf } from '../../../data/model/model-collections.ts';
import { collectionSchema } from '../../../data/snapshot/normalise.ts';
import { keyedSchema } from '../../../data/snapshot/schema/field.ts';
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
    startEntries
} from '../entry-edit/index.ts';
import { putBack, replacedLines } from '../writes/config/config-checks.ts';
import { noPrimaryKey, saved, sharedRefusal, typeRefusals } from '../writes/entries.ts';
import { asFieldValue } from '../../core/files/yaml/yaml-edit.ts';
import type { ChangeRecord } from '../../core/changes.ts';
import type { Refusal } from '../../core/files/yaml/yaml-edit.ts';
import type { FieldValue } from '../../core/files/yaml/yaml-values.ts';
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
 * What a feed's entries are edited by. `fields` are always writable. With `schema`, every other
 * field the feed file's own `schema:` names is writable too, the primary key excepted, since the
 * primary key is what every write and every reference addresses an entry by.
 */
type FeedRule = { fields: string[]; schema: boolean; deletable: boolean };

const FEED_RULES: Record<FeedKind, FeedRule> = {
    radar: { fields: ['dismissed'], schema: true, deletable: true },
    leads: { fields: ['status'], schema: true, deletable: true },
    linkedin: { fields: [], schema: false, deletable: false }
};

/**
 * The fields of a feed an entry may be written at: the rule's own and its file's schema's, the
 * primary key `key` left out.
 */
function writableFields(rule: FeedRule, schema: SchemaField[] | undefined, key: string): string[] {
    const named = rule.schema ? (schema ?? []).map((one) => one.field) : [];
    return [...new Set([...rule.fields, ...named])].filter((one) => one !== key);
}

/** The refusal of every write that addresses an entry of a feed file with no primary key. */
export function unkeyed(config: PortfolioConfig, read: FeedRead): WriteOutcome {
    const reason = noPrimaryKey(config.text, read.file, read.key_fault ?? null);
    return { found: true, changed: [], refused: [{ field: 'schema', reason }] };
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
    const named = feedPrimaryKey(config.merged.collections, kind);
    const keyed = keyedSchema(parsed.schema);
    const key = primaryKeyOf(keyed, named);
    const fault = keyFaultOf(keyed, named);
    return {
        kind,
        file: config.feeds[kind],
        meta: meta.data,
        entries: entries.data,
        ...(schema === undefined ? {} : { schema }),
        ...(key === null ? {} : { primary_key: key }),
        ...(fault === null ? {} : { key_fault: fault })
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
 * One small Markdown front matter block and the prose after its closing fence. The block is the
 * one the tree's split, `splitFrontmatter`, finds, the same block Mark posted dates, so the view
 * lists a front matter exactly where the write can date one. A key the block does not hold is not
 * in the answer, so every reader of one falls back for itself.
 */
export function linkedinFrontMatter(
    source: string
): Record<string, string | undefined> & { body: string } {
    const { block, body } = splitFrontmatter(source);
    const fields: Record<string, string> = {};
    if (block !== null) {
        for (const line of block.split(/\r?\n/)) {
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
        body: body.trim()
    };
}

/**
 * Whether a file's base name is a LinkedIn idea: `xx-`, at least one character, then `.md` in any
 * case, with no path separator. The folder's feed marks each entry by it (`idea`), the LinkedIn
 * view offers Mark posted on the entries so marked, and Mark posted promotes only such a file.
 */
function isLinkedinIdea(name: string): boolean {
    return /^xx-[^/\\]+\.[mM][dD]$/.test(name);
}

/**
 * A flat LinkedIn post or idea filename, with a case-insensitive Markdown suffix: an idea by
 * `isLinkedinIdea`, or a name that starts with a number and a dash.
 */
export function isLinkedinFile(file: string | null): boolean {
    return (
        file !== null &&
        (isLinkedinIdea(file) || (!/[/\\]/.test(file) && /\.md$/i.test(file) && /^\d+-/.test(file)))
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
                idea: isLinkedinIdea(file)
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

/** A write that found its file: the fields it changed and the refusals it met. */
export function outcome(changed: string[] = [], refused: Refusal[] = []): WriteOutcome {
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

/**
 * A front matter line whose key, at column 0, is exactly `date` or exactly `publish`, bare or in
 * quotes; `published:` and an indented `date:` are not one.
 */
const POST_KEY = /^(["']?)(date|publish)\1[ \t]*:(?=[ \t]|$)/;

/**
 * The text of an idea once posted on `day`. The front matter is the block the tree's split,
 * `splitFrontmatter`, finds, the one the LinkedIn view reads through `linkedinFrontMatter`: an
 * opening `---` line at the very start, a closing `---` or `...` line, each fence followed by
 * spaces or tabs only, and lines that may end in CRLF. In it, each `date` and `publish` line is
 * replaced by `date: <day>` and `publish: True`, and a key the block lacks is added at its end,
 * before the closing fence, `publish` first, as the idea stub orders them. A replaced line keeps
 * its own line end and an added line takes the opening fence's, so a CRLF file stays CRLF. Every
 * other byte stays as it was: the fences, the other lines, and the body with its own `date:`
 * lines. Null when the split finds no block, a file that opens with a byte order mark included.
 */
function postedText(text: string, day: string): string | null {
    const { block, body } = splitFrontmatter(text);
    if (block === null) return null;
    const open = text.slice(0, text.indexOf('\n') + 1);
    const close = text.slice(open.length + block.length, text.length - body.length);
    const end = open.endsWith('\r\n') ? '\r\n' : '\n';
    const seen = new Set<string>();
    const lines = (block === '' ? [] : block.split(/(?<=\n)/)).map((line) => {
        const content = line.replace(/\r?\n$/, '');
        const key = POST_KEY.exec(content)?.[2];
        if (key === undefined) return line;
        seen.add(key);
        return `${key === 'date' ? `date: ${day}` : 'publish: True'}${line.slice(content.length)}`;
    });
    const added = [
        ...(seen.has('publish') ? [] : [`publish: True${end}`]),
        ...(seen.has('date') ? [] : [`date: ${day}${end}`])
    ];
    return [open, ...lines, ...added, close, body].join('');
}

/**
 * Whether a posted text's front matter reads back with `date` the day and `publish` true. The block
 * is parsed here rather than by `parseFrontmatter`, which refuses a key written twice; such a key
 * reads back, since `postedText` gave both of its lines the same value.
 */
function readsPosted(text: string, day: string): boolean {
    const { block } = splitFrontmatter(text);
    if (block === null) return false;
    try {
        const held: unknown = parse(block, { uniqueKeys: false });
        return isMap(held) && held.date === day && held.publish === true;
    } catch {
        return false;
    }
}

/**
 * Undo a promotion that stopped part way: each moved sidecar renamed back, the post's text
 * written back when it differs from the idea's, and the post renamed back to the idea's name. Each
 * step runs whatever the step before it did, so a step that throws still leaves the others done;
 * its error is dropped, since the caller passes on the error that stopped the promotion, which
 * names the cause.
 */
function putIdeaBack(
    folder: string,
    moving: readonly string[],
    targets: readonly string[],
    moved: readonly number[],
    post: string,
    source: string,
    before: string
): void {
    const steps = [
        ...[...moved]
            .reverse()
            .map((at) => () => renameSync(join(folder, targets[at]), join(folder, moving[at]))),
        () => {
            if (readFileSync(post, 'utf8') !== before) writeTextAtomic(post, before);
        },
        () => renameSync(post, source)
    ];
    for (const step of steps) {
        try {
            step();
        } catch {
            // The next step still runs; the promotion's own error reaches the page.
        }
    }
}

/**
 * Promote an idea to the next numbered post: the idea is renamed, its front matter given the day
 * of the press as `date:` and `True` as `publish:`, then each same-basename sidecar is renamed. An
 * idea is a base name `isLinkedinIdea` accepts, the rule the LinkedIn view offers the button by. A
 * sidecar is a file whose name is the idea's without `.md` followed by a dot, unless that name is
 * itself an idea, which is never moved with another. Every refusal is decided before any file
 * moves. The idea is renamed first and written in place, so the post keeps the idea's file mode
 * and the idea and the post are never both listed. When the write or a sidecar's rename throws,
 * the moved sidecars are renamed back, the post's old text is written back and the post is renamed
 * back to the idea's name, so the folder is as it was before the press, and the error that stopped
 * the promotion is passed on.
 */
export function markLinkedinPosted(
    hub: string,
    config: PortfolioConfig,
    fileValue: unknown
): WriteOutcome {
    const file = typeof fileValue === 'string' ? basename(fileValue) : '';
    if (!isLinkedinIdea(file) || file !== fileValue) {
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
    const stem = file.slice(0, -'.md'.length);
    const moving = names.filter(
        (name) => name === file || (name.startsWith(`${stem}.`) && !isLinkedinIdea(name))
    );
    const targets = moving.map((name) => `${prefix}-${name.slice('xx-'.length)}`);
    const refusal = (reason: string): WriteOutcome => outcome([], [{ field: 'file', reason }]);
    // The highest number of the folder sets the next, so a target exists only when a file was made
    // between the listing and this check.
    if (targets.some((name) => existsSync(join(folder, name)))) {
        return refusal(words(config.text, 'server.feeds.post_exists'));
    }
    const day = localDate(Date.now());
    const before = readFileSync(source, 'utf8');
    const after = postedText(before, day);
    if (after === null) return refusal(words(config.text, 'server.feeds.post_no_front_matter'));
    if (!readsPosted(after, day)) return refusal(words(config.text, 'server.feeds.post_not_dated'));
    const post = join(folder, targets[moving.indexOf(file)]);
    renameSync(source, post);
    const moved: number[] = [];
    try {
        if (after !== before) writeTextAtomic(post, after);
        moving.forEach((name, at) => {
            if (name === file) return;
            renameSync(join(folder, name), join(folder, targets[at]));
            moved.push(at);
        });
    } catch (error) {
        putIdeaBack(folder, moving, targets, moved, post, source, before);
        throw error;
    }
    // A promotion renames the idea and its sidecars and dates the post; there is no writer that
    // renames them back or restores the old front matter, so the record names both lists of names
    // and offers no way back.
    return {
        ...outcome(['file']),
        records: [
            {
                file: post,
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
 * the word of `lead_statuses` carrying `default_lead`, and none when no word carries it. The
 * outcome's `id` is the new lead's value of the file's primary key, which its hub's file names it
 * by; a lead with no such value, one the file holds already and a file with no primary key are
 * refused.
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
        const reason = words(config.text, 'server.feeds.leads_no_schema');
        return outcome([], [{ field: 'schema', reason }]);
    }
    const key = parsed.primary_key;
    if (key === undefined) return unkeyed(config, parsed);
    const given = fields[key];
    const title = typeof given === 'string' ? given.trim() : '';
    if (title === '') {
        return outcome(
            [],
            [{ field: key, reason: words(config.text, 'server.feeds.entry_needs_key', key) }]
        );
    }
    if (parsed.entries.some((entry) => scalar(entry[key]).trim() === title)) {
        return outcome(
            [],
            [{ field: key, reason: words(config.text, 'server.feeds.entry_key_taken', key) }]
        );
    }

    const values: Record<string, FieldValue> = {};
    const refused: Refusal[] = [];
    for (const field of fieldNames(schema)) {
        let raw = fields[field];
        if (field === key) raw = title;
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
    const block = renderEntry(fieldNames(schema), key, values);
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

/** A feed file's entries as a text holds them, or null when it is no map with a list of maps. */
export function readFeedFileText(text: string): { entries: Record<string, unknown>[] } | null {
    const held: unknown = parse(text);
    if (!isMap(held)) return null;
    const entries = feedEntriesShape.safeParse(held.entries);
    return entries.success ? { entries: entries.data } : null;
}

/** A record's replaced text as the log holds it: a whole offset and two texts, else none. */
export const replacedShape = z.object({
    offset: z.int().min(0),
    before: z.string(),
    after: z.string()
});

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
    const ident = parsed.primary_key;
    if (ident === undefined) return unkeyed(config, parsed);
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
            [{ field: ident, reason: words(config.text, 'server.feeds.entry_key_taken', ident) }]
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
 * Set or clear one field that a feed allows on the entry whose value of the file's primary key is
 * `id`. The value is held to the type the feed file's schema gives the field, and a file with two
 * entries of one value of the primary key is refused, since the second could not be addressed.
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
    const key = parsed.primary_key;
    if (key === undefined) return unkeyed(config, parsed);
    if (!writableFields(rule, parsed.schema, key).includes(field)) {
        const reason = words(config.text, 'server.feeds.field_not_allowed', feed);
        return outcome([], [{ field, reason }]);
    }
    const entry = parsed.entries.find((one) => scalar(one[key]) === id);
    if (entry === undefined) return { found: false, changed: [], refused: [] };
    const shared = sharedRefusal(parsed.entries, key, config.text);
    if (shared !== null) return shared;
    const typed = typeRefusals(parsed.schema, { [field]: value }, config.text);
    if (typed.length > 0) return { found: true, changed: [], refused: typed };
    const out = saved(
        full,
        source,
        setEntryFields(source, key, id, { [field]: value }, config.text)
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
    if (parsed === null) return { found: false, changed: [], refused: [] };
    const key = parsed.primary_key;
    if (key === undefined) return unkeyed(config, parsed);
    const entry = parsed.entries.find((one) => scalar(one[key]) === id);
    if (entry === undefined) return { found: false, changed: [], refused: [] };
    const shared = sharedRefusal(parsed.entries, key, config.text);
    if (shared !== null) return shared;
    const edit = deleteEntry(source, key, id, config.text);
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
