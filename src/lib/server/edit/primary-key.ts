// Layer 2, server. The choice of a data file's primary key, which the finding of a file that has
// none offers: a schema that flags no field (`key_none`), one that flags two (`key_two`), a
// `collections:` entry that names a key beside the schema's flag (`key_beside`), and a file with no
// schema whose entry names none (`key_missing`). The field is written where the reader reads it
// (`keyFaultOf`, data/model/model-collections.ts):
//
// - a file with a schema takes `primary_key: true` on the field picked and loses every other
//   field's `primary_key`, and a `primary_key:` its `collections:` entry names beside it is taken
//   out of the hub's `.oculus/config.yml`; two files, each its own write;
// - a file with no schema takes `primary_key: <field>` on its `collections:` entry, and no
//   `schema:` is added to it.
//
// The fields offered are `keyChoices`: those the file's entries hold that are no list and no map,
// and in a file with a schema only the ones it describes with a type a key may be. A `collections:`
// entry is written only in the hub's own list; a hub that lists none reads oculus's entries, and a
// file of those is refused with the sentence saying where its entry belongs.
//
// Each write is an operation of the Files view's writer under Set Primary Key, so the History lists
// it and its Undo puts the file back. Each edit is over the bytes of its file (key-path.ts), and
// the new text must read back as the old one with only those marks changed and leave the file a
// primary key, or nothing is written.

import { join, relative } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { json } from '@sveltejs/kit';
import { parse } from 'yaml';
import { z } from 'zod';
import { isMap } from '../../data/helpers/guards.ts';
import { CHOSEN_KEY_CAUSES, keyChoices } from '../../data/model/index.ts';
import type { PortfolioConfig } from '../../data/model/index.ts';
import { keyFaultOf } from '../../data/model/model-collections.ts';
import { keyedSchema } from '../../data/snapshot/schema/field.ts';
import { tokenedBody } from '../core/auth.ts';
import { words } from '../core/words.ts';
import { readCollection } from '../files/fs/collections.ts';
import type { OpsTarget } from '../files/fs/ops.ts';
import { setKeyPath } from '../core/files/yaml/key-path.ts';
import { editEntries, writeOwnText } from '../files/source/list-entries.ts';

/** What the route hands the handler: a hub by its key, and the Files view's writer. */
export type PrimaryKeyOptions = {
    hubFor: (root: string) => { dir: string; config: PortfolioConfig } | null;
    files: () => OpsTarget;
    text: () => Record<string, string>;
};

/** The body of a choice: the hub, the collection's key, and the field picked. */
const bodyShape = z.object({
    root: z.string(),
    collection: z.string().min(1),
    field: z.string().min(1)
});

/** The answer refusing a choice, with its sentence. */
function refuse(error: string, status = 400): Response {
    return json({ error }, { status });
}

/** The schema rows of a parsed file, each as a map; empty for a file with none. */
function rowsOf(text: string): Record<string, unknown>[] {
    const read: unknown = parse(text);
    const schema = isMap(read) ? read.schema : undefined;
    return Array.isArray(schema) ? schema.map((row) => (isMap(row) ? row : {})) : [];
}

/**
 * The text of a data file with `primary_key: true` on the field picked and no other row's
 * `primary_key`, or null when the bytes cannot take it or the result does not read back as the
 * file with only those marks changed.
 */
function keyedText(text: string, field: string): string | null {
    const rows = rowsOf(text);
    let out: string | null = text;
    for (const [at, row] of rows.entries()) {
        if (out === null) return null;
        if (row.field === field) out = setKeyPath(out, ['schema', at, 'primary_key'], true);
        else if (Object.hasOwn(row, 'primary_key')) {
            out = setKeyPath(out, ['schema', at, 'primary_key'], null);
        }
    }
    if (out === null) return null;
    const expected: unknown = parse(text);
    if (!isMap(expected) || !Array.isArray(expected.schema)) return null;
    expected.schema = rows.map((row) => {
        const { primary_key: _mark, ...rest } = row;
        return row.field === field ? { ...rest, primary_key: true } : rest;
    });
    return isDeepStrictEqual(parse(out), expected) ? out : null;
}

/**
 * Make the choice: the file's schema marked and the `collections:` entry's key taken out, or the
 * entry given the key. Answers the files written, under the hub, or the sentence of why nothing
 * more was.
 */
async function choosePrimaryKey(
    into: OpsTarget,
    hub: { dir: string; config: PortfolioConfig },
    collection: string,
    field: string,
    text: Record<string, string>
): Promise<{ written: string[] } | { error: string }> {
    const held = readCollection(hub.dir, hub.config, collection);
    if (held === null) return { error: words(text, 'server.primary_key.no_file', collection) };
    if (held.fault === null || !CHOSEN_KEY_CAUSES.includes(held.fault.cause)) {
        return { error: words(text, 'server.primary_key.keyed', collection) };
    }
    if (!keyChoices(keyedSchema(held.schema), held.items).includes(field)) {
        return { error: words(text, 'server.primary_key.field', field) };
    }
    const shown = relative(hub.dir, held.file);
    const schemaKept = held.schema !== undefined;
    const named = schemaKept ? undefined : field;
    const rows = schemaKept ? keyedText(held.source, field) : held.source;
    if (rows === null) return { error: words(text, 'server.primary_key.unwritable', shown) };
    const after: unknown = parse(rows);
    if (keyFaultOf(keyedSchema(isMap(after) ? after.schema : undefined), named) !== null) {
        return { error: words(text, 'server.primary_key.unwritable', shown) };
    }
    const written: string[] = [];
    if (schemaKept) {
        const done = await writeOwnText(
            into,
            held.file,
            (now) => {
                const next = keyedText(now, field);
                return next === null ? { why: held.file } : { text: next };
            },
            'set-primary-key'
        );
        if (!('ok' in done) || !done.ok) {
            return { error: words(text, 'server.primary_key.unwritable', shown) };
        }
        written.push(shown);
    }
    if (schemaKept && held.named === undefined) return { written };
    const entry = await editEntries(
        into,
        hub.dir,
        { name: 'config.yml', list: 'collections', nameKey: 'key', recordAs: 'set-primary-key' },
        { kind: 'set', found: { name: collection }, changes: { primary_key: named ?? null } }
    );
    if (entry.ok) return { written: [...written, join('.oculus', 'config.yml')] };
    const where =
        entry.word === 'missing'
            ? words(text, 'server.primary_key.no_entry', collection)
            : words(text, 'server.primary_key.unwritable', join('.oculus', 'config.yml'));
    return {
        error:
            written.length === 0 ? where : words(text, 'server.primary_key.half', written[0], where)
    };
}

/** The route's POST: the token, the body, the hub, then the choice. */
export async function handlePrimaryKeyPost(
    request: Request,
    token: string,
    options: PrimaryKeyOptions
): Promise<Response> {
    const text = options.text();
    const read = await tokenedBody(request, token, { text: () => text });
    if (read instanceof Response) return read;
    const parsed = bodyShape.safeParse(read.body);
    if (!parsed.success) return refuse(words(text, 'server.primary_key.bad_body'));
    const body = parsed.data;
    const hub = options.hubFor(body.root);
    if (hub === null) return refuse(words(text, 'server.primary_key.no_hub', body.root), 404);
    const done = await choosePrimaryKey(options.files(), hub, body.collection, body.field, text);
    return 'error' in done ? refuse(done.error) : json(done);
}
