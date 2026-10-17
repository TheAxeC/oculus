// Layer 2, server. Save to Literature: one paper written to the `literature` collection file of a
// hub, and the undo that takes it out again byte for byte.
//
// The file is the one the hub's `collections:` list names under the key `literature`, else the
// engine's path for that key when the hub holds a file there. The paper's text is cleaned to plain
// text as Lit Watch cleans it (data/prose/literature.ts), its key is made by literature-key.ts from
// the file as it is read here, and a paper the file holds already is refused: the same DOI, or,
// when either has no DOI, the same title, and for a paper saved from an address alone the same
// address. The result is parsed again and kept only when it is the file as it was with this one
// entry added.

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { parse } from 'yaml';
import { z } from 'zod';
import { localDate } from '../../../data/helpers/dates.ts';
import { isMap, scalar } from '../../../data/helpers/guards.ts';
import {
    addressKey,
    normalDoi,
    plainText,
    samePaper,
    wholeNumber
} from '../../../data/prose/literature.ts';
import { fieldNames } from '../../../data/snapshot/validate.ts';
import { inside } from '../../core/paths.ts';
import { words } from '../../core/words.ts';
import { appendEntry, renderEntry, startEntries, takeOutAppended } from '../entry-edit/index.ts';
import { replacedText } from '../writes/config/config-checks.ts';
import { saved, sharedRefusal, typeRefusals } from '../writes/entries.ts';
import { asFieldValue } from '../yaml/yaml-edit.ts';
import { addressBase, citationBase, freeKey } from './literature-key.ts';
import type { FieldValue } from '../yaml/yaml-values.ts';
import type { LiteratureSaveWrite } from '../writes/bodies.ts';
import type { PortfolioConfig } from '../../../data/model/index.ts';
import type { WriteOutcome } from '../writes.ts';

/** The collection key of the saved papers. */
const LITERATURE = 'literature';

/** The field a literature entry is keyed by. */
const KEY = 'key';

/** Where a saved paper came from, one of the options of the file's `source` field. */
type LiteratureSource = LiteratureSaveWrite['source'];

/** The `collections:` entries of a configuration, each a key and a file. */
const listedShape = z.array(z.looseObject({ key: z.string(), file: z.string() })).catch([]);

/**
 * The path the engine's own `collections:` list, in its configuration `engineConfig`, gives the
 * Literature file, if it names one.
 */
export function engineLiteraturePath(engineConfig: Record<string, unknown>): string | undefined {
    const listed = listedShape.parse(engineConfig.collections);
    return listed.find((one) => one.key === LITERATURE)?.file;
}

/**
 * The Literature file of a hub: the file its `collections:` list names, else the engine's path
 * when the hub holds a file there, and null when there is neither or the path leaves the hub.
 */
function literatureFile(
    hub: string,
    config: PortfolioConfig,
    enginePath: string | undefined
): string | null {
    const named = config.collections.find((one) => one.key === LITERATURE)?.file ?? enginePath;
    if (named === undefined) return null;
    const path = resolve(join(hub, named));
    return inside(path, hub) && existsSync(path) ? path : null;
}

/** A field of the paper as one line of plain text, the empty text for anything not text. */
function textOf(raw: unknown): string {
    return typeof raw === 'string' || typeof raw === 'number' ? plainText(String(raw)) : '';
}

/** The authors of the paper, each a name of plain text: a list, or one line of names. */
function authorsOf(raw: unknown): string[] {
    const names = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(',') : [];
    return names.map((one) => textOf(one)).filter((one) => one !== '');
}

/** A Literature file as it reads: its schema, its entries and whether `entries` is a list. */
type Read = { schema: unknown; entries: Record<string, unknown>[]; listed: boolean };

/**
 * A Literature file's text as it reads, or null when it is no map or its entries are no list of
 * maps. An `entries:` with nothing under it, or no `entries:` at all, holds no entry.
 */
function readText(text: string): Read | null {
    const held: unknown = parse(text);
    if (!isMap(held)) return null;
    const list: unknown = held.entries ?? [];
    if (!Array.isArray(list) || !list.every(isMap)) return null;
    return { schema: held.schema, entries: list, listed: Array.isArray(held.entries) };
}

/** A write that changed nothing, with the one reason it was refused. */
function refusal(field: string, reason: string): WriteOutcome {
    return { found: true, changed: [], refused: [{ field, reason }] };
}

/** Whether an entry of the file is the paper with these identifiers. */
function holds(entry: Record<string, unknown>, doi: string, title: string, url: string): boolean {
    const held = { doi: scalar(entry.doi), title: scalar(entry.title) };
    if (samePaper(held, { doi, title })) return true;
    if (title !== '' || doi !== '' || url === '') return false;
    return scalar(entry.title) === '' && addressKey(scalar(entry.url)) === addressKey(url);
}

/**
 * Write one paper to the Literature file: the fields it carries, `source` where it came from and
 * `added` today, under the key literature-key.ts makes from the file just read. `found` is false
 * when the hub has no Literature file. The record carries the text the append added, which the undo
 * takes out again.
 */
export function saveLiterature(
    hub: string,
    config: PortfolioConfig,
    enginePath: string | undefined,
    source: LiteratureSource,
    paper: Record<string, unknown>
): WriteOutcome {
    const file = literatureFile(hub, config, enginePath);
    if (file === null) return { found: false, changed: [], refused: [] };
    const text = readFileSync(file, 'utf8');
    let read: Read | null;
    try {
        read = readText(text);
    } catch {
        read = null;
    }
    const unread = words(config.text, 'server.literature.file_unread');
    if (read === null) return refusal('entries', unread);
    const shared = sharedRefusal(read.entries, KEY, config.text);
    if (shared !== null) return shared;

    const title = textOf(paper.title);
    const authors = authorsOf(paper.authors);
    const doi = normalDoi(textOf(paper.doi)) ?? '';
    const url = textOf(paper.url) || (doi === '' ? '' : `https://doi.org/${doi}`);
    if (title === '' && doi === '' && url === '') {
        return refusal('title', words(config.text, 'server.literature.paper_needs_address'));
    }
    if (read.entries.some((entry) => holds(entry, doi, title, url))) {
        return refusal('title', words(config.text, 'server.literature.paper_in_file'));
    }
    const year = wholeNumber(textOf(paper.year));
    const base =
        title === ''
            ? addressBase(doi === '' ? url : doi)
            : citationBase(authors, year === null ? '' : String(year), title);
    const taken = new Set(read.entries.map((entry) => scalar(entry[KEY])));
    const key = freeKey(base === '' ? citationBase([], '', '') : base, taken);

    const given: Record<string, unknown> = {
        key,
        title,
        authors,
        venue: textOf(paper.venue),
        year: year ?? '',
        doi,
        url,
        abstract: textOf(paper.abstract),
        source,
        added: localDate(Date.now())
    };
    const refused = typeRefusals(read.schema, given, config.text);
    const values: Record<string, FieldValue> = {};
    for (const [name, raw] of Object.entries(given)) {
        if (refused.some((one) => one.field === name)) continue;
        const value = asFieldValue(raw);
        const empty = value === '' || (Array.isArray(value) && value.length === 0);
        if (value !== undefined && value !== null && !empty) values[name] = value;
    }
    const block = renderEntry(fieldNames(read.schema), KEY, values);
    const edit = read.listed
        ? appendEntry(text, 'entries', block, config.text)
        : startEntries(text, 'entries', block, config.text);
    if (edit.changed.length === 0) return { found: true, changed: [], refused: edit.refused };
    let reread: Read | null;
    try {
        reread = readText(edit.text);
    } catch {
        reread = null;
    }
    if (reread === null || !isDeepStrictEqual(reread.entries, [...read.entries, values])) {
        return refusal('entries', words(config.text, 'server.edit.unverified'));
    }
    const out = saved(file, text, edit);
    const replaced = replacedText(text, edit.text);
    return {
        ...out,
        refused: [...refused, ...out.refused],
        id: key,
        records: [
            {
                file,
                key,
                field: 'entries',
                before: null,
                after: values,
                undo: 'create',
                ...(replaced === null ? {} : { replaced })
            }
        ]
    };
}

/** A record's replaced text as the log holds it: a whole offset and two texts, else none. */
const replacedShape = z.object({ offset: z.int().min(0), before: z.string(), after: z.string() });

/** The entry of a Literature file under one key, or undefined when the file holds none. */
export function literatureEntry(file: string, key: string): Record<string, unknown> | undefined {
    const read = readText(readFileSync(file, 'utf8'));
    return read?.entries.find((entry) => scalar(entry[KEY]) === key);
}

/**
 * Take one saved paper out again, the way the undo of its save does, by its key. The text the save
 * added goes back over what it left when the file still holds it there, so the file is what it was
 * byte for byte; a file edited since has the entry's lines and the blank line the append put over
 * them taken out.
 */
export function removeLiterature(
    file: string,
    key: string,
    replaced: unknown,
    catalog: Record<string, string>
): WriteOutcome {
    const text = readFileSync(file, 'utf8');
    let read: Read | null;
    try {
        read = readText(text);
    } catch {
        read = null;
    }
    const at = read?.entries.findIndex((entry) => scalar(entry[KEY]) === key) ?? -1;
    if (read === null || at < 0) return { found: false, changed: [], refused: [] };
    const put = replacedShape.safeParse(replaced);
    if (put.success && text.startsWith(put.data.after, put.data.offset)) {
        const { offset, before, after } = put.data;
        const back = `${text.slice(0, offset)}${before}${text.slice(offset + after.length)}`;
        let reread: Read | null;
        try {
            reread = readText(back);
        } catch {
            reread = null;
        }
        const wanted = read.entries.filter((_entry, index) => index !== at);
        if (reread !== null && isDeepStrictEqual(reread.entries, wanted)) {
            return saved(file, text, { text: back, changed: ['entries'], refused: [] });
        }
    }
    return saved(file, text, takeOutAppended(text, KEY, key, catalog));
}
