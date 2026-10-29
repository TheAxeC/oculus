// Layer 2, server. The form of a repository's `.oculus/cpp.yml` as the compile database list opens
// it, and its writes: GET /api/cpp?repo= answers the fields of a configuration as
// `config/schemas/cpp-schema.yml` gives them and each entry of `configurations` as the file holds
// it, the entries that do not read included, so a configuration with a finding is mended in the
// same form; POST /api/cpp appends a configuration, makes the changes the form sends to the one at
// a place (each key set to its value, or taken out by a null), or takes it out.
//
// An entry is found by its place in the list and the value it held when the form was filled,
// since a configuration that does not read may have no name or a repeated one. A write is refused
// when the configuration it leaves would be a finding of the file's reader (cpp-file.ts): a name
// another configuration or a compile database oculus found holds, a `compile_commands` that is no
// folder of the repository holding a database, flags that are no list of text; the refusal names
// the field and why. The write itself is server/files/source/list-entries.ts's, recorded in the
// History and taken back by its Undo, as the Debug view's writes of launch.yml are.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { json } from '@sveltejs/kit';
import { isMap, isNode, isSeq, parseDocument } from 'yaml';
import { z } from 'zod';
import type { SchemaField } from '../../../../../data/model/index.ts';
import { fieldsOf } from '../../../../../data/snapshot/schema/field.ts';
import { textCatalog } from '../../../../../data/sources/config.ts';
import { tokenedBody } from '../../../../core/auth.ts';
import { words } from '../../../../core/words.ts';
import { editEntries, type Edited, type EntryEdit } from '../../../../files/source/list-entries.ts';
import type { OpsTarget } from '../../../../files/fs/ops.ts';
import { repositoryOf } from '../../../runs/commands/repo.ts';
import { readCppText } from './cpp-file.ts';
import { databasePlan } from './databases.ts';

/** The list of the file and the file's name in the `.oculus` folder. */
const LIST = 'configurations';
const NAME = 'cpp.yml';

/** What the route needs of the process: the roots, the merged config and the Files writer. */
export type CppRouteOptions = {
    rootsFor: () => string[];
    configFor: () => Record<string, unknown>;
    files: () => OpsTarget;
};

/** What the form is filled from: the fields of a configuration and the entries the file holds. */
type CppForm = { fields: SchemaField[]; entries: unknown[] };

const NO_STORE = { 'cache-control': 'no-store' };

/** The fields of one configuration, as the schema of the file gives them. */
function configurationFields(config: Record<string, unknown>): SchemaField[] {
    const top = fieldsOf(config.cpp_schema) ?? [];
    return top.find((one) => one.field === LIST)?.fields ?? [];
}

/** Each entry of the file's list as it reads, or the empty list for a file with none. */
function cppEntries(repo: string): unknown[] {
    const path = join(repo, '.oculus', NAME);
    if (!existsSync(path)) return [];
    const document = parseDocument(readFileSync(path, 'utf8'));
    if (document.errors.length > 0 || !isMap(document.contents)) return [];
    const list = document.get(LIST, true);
    if (!isSeq(list)) return [];
    return list.items.map((one) => (isNode(one) ? one.toJS(document) : one) as unknown);
}

/** The keys of the compile databases oculus found in the repository, which no name may take. */
function foundKeys(repo: string): string[] {
    return databasePlan(repo)
        .databases.filter((one) => !one.configuration)
        .map((one) => one.key);
}

/**
 * The finding the written text gives the configuration at `place`, as the field and why, or null.
 */
function faultAt(repo: string, found: string[], text: string, place: number): string | null {
    const own = `${LIST}[${place}]`;
    const fault = readCppText(repo, text, found).findings.find(
        (one) => one.field === own || one.field.startsWith(`${own}.`)
    );
    if (fault === undefined) return null;
    const field = fault.field === own ? LIST : fault.field.slice(own.length + 1);
    return `${field} ${fault.message}`;
}

/** Make one write of the repository's `.oculus/cpp.yml`. */
function editCpp(into: OpsTarget, repo: string, edit: EntryEdit): Promise<Edited> {
    const found = foundKeys(repo);
    const check = (text: string, place: number): string | null => faultAt(repo, found, text, place);
    return editEntries(into, repo, { name: NAME, list: LIST, taken: found, check }, edit);
}

function refuse(error: string): Response {
    return json({ error }, { status: 400, headers: NO_STORE });
}

/** GET /api/cpp?repo=<absolute path>: the form of the repository's file. */
export function handleCppGet(request: Request, options: CppRouteOptions): Response {
    const asked = new URL(request.url).searchParams.getAll('repo');
    if (asked.length !== 1) return refuse('repo must be given once');
    const found = repositoryOf(asked[0], options.rootsFor());
    if ('error' in found) return refuse(found.error);
    const form: CppForm = {
        fields: configurationFields(options.configFor()),
        entries: cppEntries(found.repo)
    };
    return json(form, { headers: NO_STORE });
}

const bodyShape = z.object({
    repo: z.unknown(),
    at: z.number().int().nullable(),
    was: z.unknown().optional(),
    changes: z.record(z.string(), z.unknown()).nullable()
});

/** POST /api/cpp: one write of the file. */
export async function handleCppPost(
    request: Request,
    token: string,
    options: CppRouteOptions
): Promise<Response> {
    const catalog = textCatalog(options.configFor());
    const read = await tokenedBody(request, token, { headers: NO_STORE, text: () => catalog });
    if (read instanceof Response) return read;
    const parsed = bodyShape.safeParse(read.body);
    if (!parsed.success) return refuse(words(catalog, 'server.cpp.bad_body'));
    const body = parsed.data;
    if (body.at === null && body.changes === null) {
        return refuse(words(catalog, 'server.cpp.bad_body'));
    }
    const repo = repositoryOf(body.repo, options.rootsFor());
    if ('error' in repo) return refuse(repo.error);
    const found = { at: body.at ?? 0, was: body.was };
    const edit: EntryEdit =
        body.at === null
            ? { kind: 'add', entry: body.changes ?? {} }
            : body.changes === null
              ? { kind: 'delete', found }
              : { kind: 'set', found, changes: body.changes };
    const done = await editCpp(options.files(), repo.repo, edit);
    if (done.ok) return json({ line: done.line }, { headers: NO_STORE });
    if (done.word === 'name') return refuse(words(catalog, 'server.cpp.name'));
    if (done.word === 'exists') return refuse(words(catalog, 'server.cpp.exists', done.detail));
    if (done.word === 'missing' || done.word === 'stale') {
        return refuse(words(catalog, 'server.cpp.changed', done.detail));
    }
    if (done.word === 'fault') return refuse(words(catalog, 'server.cpp.fault', done.detail));
    if (done.word === 'unwritable') {
        return refuse(words(catalog, 'server.cpp.unwritable', done.detail));
    }
    return refuse(words(catalog, 'server.cpp.unreadable', done.detail));
}
