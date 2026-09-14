// Layer 2, server. Reads and edits the generated YAML feeds and the LinkedIn Markdown folder.
// The feed table keeps paths, identities, and writable fields together so reads and writes cannot
// disagree about which generated file or entry they address.

import {
    existsSync,
    readFileSync,
    readdirSync,
    renameSync,
    statSync,
    writeFileSync
} from 'node:fs';
import { basename, join, resolve, sep } from 'node:path';
import { parse } from 'yaml';
import { localDate } from '../data/dates.ts';
import { isMap } from '../data/guards.ts';
import { collectionSchema } from '../data/normalise.ts';
import { fieldNames } from '../data/validate.ts';
import { appendEntry, deleteEntry, renderEntry, setEntryFields } from './entry-edit/index.ts';
import { saved } from './writes/entries.ts';
import { asFieldValue } from './yaml-edit.ts';
import type { FieldValue, Refusal } from './yaml-edit.ts';
import type { FeedData, FeedKind, FeedsPayload, PortfolioConfig } from '../data/model.ts';
import type { WriteOutcome } from './writes.ts';

export type FeedRead = FeedData & { kind: FeedKind; file: string };

type FeedRule = { identity: string; fields: string[]; deletable: boolean };

export const FEED_RULES: Record<FeedKind, FeedRule> = {
    radar: { identity: 'title', fields: ['dismissed'], deletable: false },
    inbox: { identity: 'id', fields: ['triaged'], deletable: false },
    leads: { identity: 'title', fields: ['status'], deletable: true },
    linkedin: { identity: 'file', fields: [], deletable: false }
};

export function isFeedKind(value: string): value is FeedKind {
    return value === 'radar' || value === 'leads' || value === 'inbox' || value === 'linkedin';
}

/** Resolve one configured feed path only when it remains inside the hub. */
export function feedFile(hub: string, config: PortfolioConfig, kind: FeedKind): string | null {
    const path = resolve(join(hub, config.feeds[kind]));
    const root = resolve(hub);
    return path === root || path.startsWith(root + sep) ? path : null;
}

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
    const meta = parsed.meta === undefined ? {} : parsed.meta;
    if (!isMap(meta)) throw new Error(`${file}: meta is not a map`);
    const entries = parsed.entries === undefined || parsed.entries === null ? [] : parsed.entries;
    if (!Array.isArray(entries) || !entries.every(isMap)) {
        throw new Error(`${file}: every entry must be a map`);
    }
    const schema = collectionSchema(parsed.schema);
    return {
        kind,
        file: config.feeds[kind],
        meta,
        entries,
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
        inbox: read('inbox'),
        linkedin: read('linkedin')
    };
}

/** One small Markdown front matter block and the prose after its closing fence. */
export function linkedinFrontMatter(source: string): Record<string, string> & { body: string } {
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
                title: parsed.title || file,
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

/** How many characters of the slug a filename keeps, so a long title stays well inside a name's limit. */
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
    writeFileSync(join(folder, file), source, 'utf8');
    return outcome(['file']);
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
    return outcome(['file']);
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
    if (parsed.entries.some((entry) => String(entry.title ?? '').trim() === title)) {
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
                refused.push({
                    field,
                    reason: 'not a string, number, boolean, list of strings, metalist, flat scalar map or null'
                });
            }
            continue;
        }
        values[field] = value;
    }
    const block = renderEntry(fieldNames(schema), 'title', values);
    const out = saved(full, source, appendEntry(source, 'entries', block));
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
    if (
        parsed === null ||
        !parsed.entries.some((entry) => String(entry[rule.identity] ?? '') === id)
    ) {
        return { found: false, changed: [], refused: [] };
    }
    return saved(full, source, setEntryFields(source, rule.identity, id, { [field]: value }));
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
    if (
        parsed === null ||
        !parsed.entries.some((entry) => String(entry[rule.identity] ?? '') === id)
    ) {
        return { found: false, changed: [], refused: [] };
    }
    return saved(full, source, deleteEntry(source, rule.identity, id));
}
