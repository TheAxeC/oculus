// Layer 2, server. The writers of the Lit Watch radar that feeds.ts holds no counterpart of: the
// append of one paper from the Literature search and the undo that takes it out again. A paper is
// addressed by its file's primary key (`FeedData.primary_key`), and a file with none takes no
// write. The reads, the field writes, the deletion and the restore of a deletion are the feed
// writers of feeds.ts, which the radar shares with the leads.

import { existsSync, readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { z } from 'zod';
import { localDate } from '../../../data/helpers/dates.ts';
import { scalar } from '../../../data/helpers/guards.ts';
import { addressKey, radarText, sameTitle } from '../../../data/prose/literature.ts';
import { words } from '../../core/words.ts';
import { appendEntry, renderEntry, takeOutAppended } from '../entry-edit/index.ts';
import { replacedText } from '../writes/config/config-checks.ts';
import { saved } from '../writes/entries.ts';
import { asFieldValue } from '../yaml/yaml-edit.ts';
import {
    feedFile,
    outcome,
    readFeedFile,
    readFeedFileText,
    replacedShape,
    unkeyed
} from './feeds.ts';
import type { FeedRead } from './feeds.ts';
import type { FieldValue } from '../yaml/yaml-values.ts';
import type { PortfolioConfig } from '../../../data/model/index.ts';
import type { WriteOutcome } from '../writes.ts';

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

/**
 * The keys of the radar buckets a hub's merged configuration `config` holds: oculus's, or the list
 * the hub's settings write in their place.
 */
export function radarBucketKeys(config: Record<string, unknown>): string[] {
    const held = config.radar_buckets;
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

/** The radar file read, or the refusal of a file that does not parse. */
function readRadar(hub: string, config: PortfolioConfig): FeedRead | null | WriteOutcome {
    try {
        return readFeedFile(hub, config, 'radar');
    } catch {
        const reason = words(config.text, 'server.feeds.file_unread');
        return outcome([], [{ field: 'entries', reason }]);
    }
}

/** Whether a read of the radar is the refusal of a file that does not parse. */
function isRefusal(read: FeedRead | WriteOutcome): read is WriteOutcome {
    return 'refused' in read;
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
 * new paper's value of the file's primary key, which its hub's file names it by; a file with no
 * primary key, and a paper with no value of it, are refused.
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
    const parsed = readRadar(hub, config);
    if (parsed === null) return { found: false, changed: [], refused: [] };
    if (isRefusal(parsed)) return parsed;

    const text = (field: string): string => radarField(fields[field]);
    const refuse = (field: string, reason: string): WriteOutcome =>
        outcome([], [{ field, reason }]);
    const title = text('title');
    if (title === '') {
        return refuse('title', words(config.text, 'server.feeds.paper_needs_title'));
    }
    const bucket = text('bucket');
    if (!buckets.includes(bucket)) {
        return refuse('bucket', words(config.text, 'server.feeds.bucket_unknown'));
    }
    const relevance = text('relevance');
    if (relevance !== '' && !RELEVANCE.includes(relevance)) {
        return refuse('relevance', words(config.text, 'server.feeds.relevance_unknown'));
    }
    const url = text('url');
    const known = (field: string, same: (held: string) => boolean): boolean =>
        parsed.entries.some((one) => same(scalar(one[field])));
    if (known('title', (held) => sameTitle(held, title))) {
        return refuse('title', words(config.text, 'server.feeds.paper_in_file'));
    }
    if (url !== '' && known('url', (held) => addressKey(held) === addressKey(url))) {
        return refuse('url', words(config.text, 'server.feeds.paper_in_file'));
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
    const key = parsed.primary_key;
    if (key === undefined) return unkeyed(config, parsed);
    const id = scalar(values[key]).trim();
    if (id === '') return refuse(key, words(config.text, 'server.feeds.entry_needs_key', key));
    const block = renderEntry(RADAR_ORDER, key, values);
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
        return refuse('entries', words(config.text, 'server.edit.unverified'));
    }
    const out = saved(full, source, edit);
    const replaced = replacedText(source, edit.text);
    return {
        ...out,
        ...(out.changed.length === 0 ? {} : { id }),
        records: [
            {
                file: full,
                key: id,
                field: 'entries',
                before: null,
                after: values,
                undo: 'create',
                ...(replaced === null ? {} : { replaced })
            }
        ]
    };
}

/**
 * Take one Lit Watch entry out again, the way an undo of its append does, by its value `id` of the
 * file's primary key. The text the append added goes back over what the append left when the file
 * still holds it there, so the file is what it was byte for byte; a file edited since has the
 * entry's lines and the blank line the append put over them taken out. The reader's own Delete
 * never reaches this.
 */
export function removeRadarEntry(
    hub: string,
    config: PortfolioConfig,
    id: string,
    replaced: unknown
): WriteOutcome {
    const full = feedFile(hub, config, 'radar');
    if (full === null || !existsSync(full)) return { found: false, changed: [], refused: [] };
    const source = readFileSync(full, 'utf8');
    const parsed = readRadar(hub, config);
    if (parsed === null) return { found: false, changed: [], refused: [] };
    if (isRefusal(parsed)) return parsed;
    const key = parsed.primary_key;
    if (key === undefined) return unkeyed(config, parsed);
    const at = parsed.entries.findIndex((one) => scalar(one[key]) === id);
    if (at < 0) return { found: false, changed: [], refused: [] };

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
    return saved(full, source, takeOutAppended(source, key, id, config.text));
}
