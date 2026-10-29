// Layer 2, server. The Save of the This machine scope: the changes of one hub's `.oculus/local.yml`
// written in one write. A key is one of the machine's (the options catalog's `local.yml` entries);
// a hub other than the primary takes only the keys whose rows every hub's file joins
// (`JOINED_LOCAL_KEYS`), since the machine reads every other key from the primary's file alone. The
// user's key `self` goes through its own writer (config-key.ts `writeSelf` by way of
// `writeConfigKey`), which checks it against the people; every other change is set or taken out
// over the file's bytes, so the comments and the other keys stay, and the result must read back as
// the file with exactly those keys changed, each read by the machine's reader with no problem the
// file did not have. An existing file keeps its mode; a file the save makes is written at mode 600
// and named in the hub's `.oculus/.gitignore`, as `writeSelf` makes it.
//
// A `downloads` row's secret is never sent to the page, so a row the page sends with no `secret`
// keeps the secret the file holds for its service, a `secret` of null takes it out (the row is then
// a problem of the reader, which says the secret is not set, and that one problem is allowed), and
// a text replaces it. The record of the save holds each changed key's value with every secret as
// `true` (set) or absent. Its undo writes the values back as a save of its own, the fields of each
// `downloads` row included, and leaves each row's secret as the file holds it then, since the
// record holds no secret to write back.

import { dirname } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { parseDocument } from 'yaml';
import { JOINED_LOCAL_KEYS } from '../../../../../data/helpers/hub-names.ts';
import { fields, isMap } from '../../../../../data/helpers/guards.ts';
import {
    isKeyChange,
    textDigest,
    type KeyChange,
    type SaveChange
} from '../../../../../data/shapes/config-save.ts';
import { LOCAL_NAME } from '../../../../../data/sources/config.ts';
import {
    localFile,
    localSentence,
    readLocalText,
    type DownloadAccount,
    type LocalProblem
} from '../../../../../data/sources/config/local.ts';
import { catalogOf } from '../../../../../data/sources/config/catalog/options.ts';
import type { ChangeRecord } from '../../../../core/changes.ts';
import { isBlockMap } from '../../../../core/files/yaml/yaml-values.ts';
import { addListEntry, removeListEntry, setKeyPath } from '../../../../core/files/yaml/key-path.ts';
import { writeTextAtomic } from '../../../../core/json.ts';
import { words } from '../../../../core/words.ts';
import type { WriteTarget } from '../../../writes.ts';
import { readBack } from '../../../list-edit.ts';
import { mergedAt } from '../config-checks.ts';
import { ignoreLocal, writeConfigKey } from '../config-key.ts';
import {
    heldText,
    landing,
    loadLayers,
    removeMade,
    type ConfigKeyOutcome
} from '../config-place.ts';
import { resetConfig } from '../config-reset.ts';

/** The key of the machine's file whose rows carry a secret, and the field that holds it. */
const DOWNLOADS = 'downloads';
const SECRET = 'secret';

/** The folder of the hub named `root` among the hubs of the target, or null. */
function hubDir(into: WriteTarget, root: string): string | null {
    if (into.primary !== null && root === into.primary) return into.hub;
    return (into.hubs ?? []).find((one) => one.key === root)?.hub ?? null;
}

/** The one refusal of a save, naming the key it is about. */
function refused(field: string, reason: string): ConfigKeyOutcome {
    return { changed: [], refused: [{ field, reason }] };
}

/** The secret each stored row of `downloads` holds, by its service. */
function secretsOf(text: string, dir: string): Map<string, string> {
    const rows: DownloadAccount[] = readLocalText(text, dir).config.downloads;
    return new Map(rows.map((row) => [row.service, row.secret]));
}

/**
 * The rows of a `downloads` change as the file takes them: a row with no `secret` given the secret
 * stored for its service, a row whose `secret` is null left with none, and a text written as it is.
 * The services whose secret the change takes out are named in `cleared`.
 */
function downloadRows(value: unknown, stored: Map<string, string>, cleared: Set<string>): unknown {
    if (!Array.isArray(value)) return value;
    return (value as unknown[]).map((row) => {
        if (!isMap(row)) return row;
        const service = typeof row.service === 'string' ? row.service : '';
        if (row[SECRET] === null) {
            cleared.add(service);
            const { [SECRET]: _gone, ...rest } = row;
            return rest;
        }
        if (Object.hasOwn(row, SECRET)) return row;
        const kept = stored.get(service);
        return kept === undefined ? row : { ...row, [SECRET]: kept };
    });
}

/** A value with every `downloads` row's secret as `true`, or absent when the row holds none. */
function masked(key: string, value: unknown): unknown {
    if (key !== DOWNLOADS || !Array.isArray(value)) return value;
    return (value as unknown[]).map((row) => {
        if (!isMap(row) || !Object.hasOwn(row, SECRET)) return row;
        const { [SECRET]: secret, ...rest } = row;
        return typeof secret === 'string' && secret !== '' ? { ...rest, [SECRET]: true } : rest;
    });
}

/** The values a text holds at each key, secrets masked; a key the text does not hold is absent. */
function valuesAt(text: string | null, keys: readonly string[]): Record<string, unknown> {
    const parsed = text === null ? {} : fields(parseDocument(text).toJS());
    const held: Record<string, unknown> = {};
    for (const key of keys) {
        const value = mergedAt(parsed, key);
        if (value !== undefined) held[key] = masked(key, value);
    }
    return held;
}

/**
 * The first problem the reader gives with the edited text that it does not give with the source,
 * leaving out the missing secret of each row whose service the save cleared, or null.
 */
function problemAdded(
    source: string,
    edited: string,
    dir: string,
    cleared: Set<string>
): string | null {
    const named = (one: LocalProblem): string => `${one.key} ${one.kind}`;
    const held = new Set(readLocalText(source, dir).problems.map(named));
    const rows = fields(parseDocument(edited).toJS())[DOWNLOADS];
    const allowed = new Set(
        (Array.isArray(rows) ? rows : []).flatMap((row, at) =>
            isMap(row) && cleared.has(String(row.service)) ? [`${DOWNLOADS}[${at}].${SECRET}`] : []
        )
    );
    const added = readLocalText(edited, dir).problems.find(
        (one) => !held.has(named(one)) && !allowed.has(one.key)
    );
    return added === undefined ? null : localSentence(added, LOCAL_NAME);
}

/**
 * The entry at `at` of the `downloads` list made `row` key by key: each key whose value differs is
 * set, then each key the row does not hold is taken out, so the entry keeps its style and comments.
 */
function intoRow(
    text: string,
    at: number,
    held: Record<string, unknown>,
    row: Record<string, unknown>
): string | null {
    let out: string | null = text;
    for (const [key, value] of Object.entries(row)) {
        if (out === null) return null;
        if (!isDeepStrictEqual(held[key], value))
            out = setKeyPath(out, [DOWNLOADS, at, key], value);
    }
    for (const key of Object.keys(held)) {
        if (out === null) return null;
        if (!Object.hasOwn(row, key)) out = setKeyPath(out, [DOWNLOADS, at, key], null);
    }
    return out;
}

/**
 * The text with the `downloads` list made `rows` entry by entry: each entry past the new rows taken
 * out, a row that differs from the entry at its place written into that entry, and each row past
 * the file's entries added after them, so an entry the save leaves as it was keeps its bytes. A
 * file with no such list, or a value that is no list of maps, takes the value whole.
 */
function intoRows(text: string, rows: unknown): string | null {
    const held = fields(parseDocument(text).toJS())[DOWNLOADS];
    const maps = (list: unknown): list is Record<string, unknown>[] =>
        Array.isArray(list) && list.every(isMap);
    if (!maps(held) || !maps(rows)) return setKeyPath(text, [DOWNLOADS], rows);
    let out: string | null = text;
    for (let at = held.length - 1; at >= rows.length && out !== null; at -= 1) {
        out = removeListEntry(out, DOWNLOADS, at);
    }
    for (const [at, row] of rows.entries()) {
        if (out === null) return null;
        if (at >= held.length) {
            out = isBlockMap(row) ? addListEntry(out, DOWNLOADS, row) : null;
        } else if (!isDeepStrictEqual(held[at], row)) {
            out = intoRow(out, at, held[at], row);
        }
    }
    return out;
}

/**
 * The edited text with every change but `self` made over the file's bytes (key-path.ts), so the
 * comments, the style and the keys a change does not name stay as they are; or the refusal.
 */
function edit(
    source: string,
    changes: KeyChange[],
    stored: Map<string, string>,
    cleared: Set<string>,
    text: Record<string, string>
): string | ConfigKeyOutcome {
    const doc = parseDocument(source);
    if (doc.errors.length > 0) {
        const line = doc.errors[0].linePos?.[0].line ?? 1;
        return refused(LOCAL_NAME, words(text, 'server.config_save.not_parsed', LOCAL_NAME, line));
    }
    let out: string | null = source;
    for (const change of changes) {
        if (out === null) break;
        const path = change.key.split('.');
        if ('reset' in change) out = setKeyPath(out, path, null);
        else if (change.key === DOWNLOADS) {
            out = intoRows(out, downloadRows(change.value, stored, cleared));
        } else out = setKeyPath(out, path, change.value);
    }
    return out ?? refused(LOCAL_NAME, words(text, 'server.config_key.not_kept'));
}

/**
 * Whether the edited text holds exactly the source with the changed keys set as asked, the
 * `downloads` rows as the file takes them with the secrets `stored` holds.
 */
function keptAsAsked(
    source: string,
    edited: string,
    changes: KeyChange[],
    stored: Map<string, string>
): boolean {
    const back = readBack(source, edited);
    if (back === null) return false;
    const touched = new Set(changes.map((one) => one.key.split('.')[0]));
    for (const name of new Set([...Object.keys(back.before), ...Object.keys(back.after)])) {
        if (touched.has(name)) continue;
        if (!isDeepStrictEqual(back.before[name], back.after[name])) return false;
    }
    return changes.every((change) => {
        const now = mergedAt(back.after, change.key);
        if ('reset' in change) return now === undefined;
        if (change.key === DOWNLOADS) {
            return isDeepStrictEqual(now, downloadRows(change.value, stored, new Set()));
        }
        return isDeepStrictEqual(now, change.value);
    });
}

/**
 * Write the changes of the This machine scope of the hub `root` into its `local.yml`. `digest` is
 * the digest of the text the server answered the page with.
 */
export function saveLocal(
    into: WriteTarget,
    root: string | undefined,
    digest: string,
    changes: SaveChange[]
): ConfigKeyOutcome {
    const text = into.config.text;
    const dir = root === undefined ? null : hubDir(into, root);
    if (root === undefined || dir === null) {
        return refused(LOCAL_NAME, words(text, 'server.workspace.no_hub_named', root ?? ''));
    }
    const primary = into.primary !== null && root === into.primary;
    const catalog = catalogOf(loadLayers(into.engine, {}).config)[LOCAL_NAME] ?? {};
    const keyed: KeyChange[] = [];
    for (const change of changes) {
        if (
            !isKeyChange(change) ||
            change.file !== LOCAL_NAME ||
            !Object.hasOwn(catalog, change.key)
        ) {
            const named = isKeyChange(change) ? change.key : LOCAL_NAME;
            return refused(named, words(text, 'server.config_save.not_here', named));
        }
        if (!primary && !JOINED_LOCAL_KEYS.includes(change.key)) {
            return refused(change.key, words(text, 'server.config_save.primary_only', change.key));
        }
        keyed.push(change);
    }
    const path = localFile(dir);
    const onDisk = heldText(path);
    if (textDigest(onDisk) !== digest) {
        return refused(LOCAL_NAME, words(text, 'server.config_save.changed', path));
    }
    const source = onDisk ?? '';
    const self = keyed.filter((one) => one.key === 'self');
    const others = keyed.filter((one) => one.key !== 'self');
    const keys = keyed.map((one) => one.key);
    const cleared = new Set<string>();
    if (others.length > 0) {
        const stored = secretsOf(source, dir);
        const edited = edit(source, others, stored, cleared, text);
        if (typeof edited !== 'string') return edited;
        if (!keptAsAsked(source, edited, others, stored)) {
            return refused(LOCAL_NAME, words(text, 'server.config_key.not_kept'));
        }
        const problem = problemAdded(source, edited, dir, cleared);
        if (problem !== null) return refused(LOCAL_NAME, problem);
        if (edited !== source) writeTextAtomic(path, edited, 0o600);
    }
    for (const change of self) {
        const at = landing(into, LOCAL_NAME, 'self', undefined);
        const outcome = !('layers' in at)
            ? at
            : 'reset' in change
              ? resetConfig(into.engine, LOCAL_NAME, 'self', at.layers)
              : writeConfigKey(into.engine, LOCAL_NAME, 'self', change.value, at.layers, at.inputs);
        if (outcome.refused.length > 0) {
            if (onDisk === null) removeMade(path, [path]);
            else if (heldText(path) !== onDisk) writeTextAtomic(path, onDisk, 0o600);
            return { changed: [], refused: outcome.refused };
        }
    }
    const after = heldText(path);
    if (after === onDisk || after === null) return { changed: [], refused: [] };
    if (onDisk === null) ignoreLocal(dirname(path));
    const record: ChangeRecord = {
        file: path,
        key: 'local',
        field: root,
        before: valuesAt(onDisk, keys),
        after: valuesAt(after, keys),
        undo: 'field',
        ...(onDisk === null ? { created: [path] } : {})
    };
    return { changed: [path], refused: [], records: [record] };
}

/** The values the `local.yml` a record names holds now at the record's keys, secrets masked. */
export function localNow(change: ChangeRecord): { found: boolean; value: unknown } {
    const keys = [
        ...new Set([...Object.keys(fields(change.before)), ...Object.keys(fields(change.after))])
    ];
    const text = heldText(change.file);
    if (text === null) return { found: false, value: null };
    return { found: true, value: valuesAt(text, keys) };
}

/**
 * Take a This machine save back: each key written back to the value the record holds, a key it
 * did not hold taken out, each `downloads` row keeping the secret the file holds for its service.
 */
export function undoLocal(into: WriteTarget, change: ChangeRecord): ConfigKeyOutcome | null {
    const before = fields(change.before);
    const keys = [...new Set([...Object.keys(before), ...Object.keys(fields(change.after))])];
    const changes: SaveChange[] = keys.map((key) =>
        Object.hasOwn(before, key)
            ? { file: LOCAL_NAME, key, value: unmasked(key, before[key]) }
            : { file: LOCAL_NAME, key, reset: true }
    );
    if (changes.length === 0) return null;
    const outcome = saveLocal(into, change.field, textDigest(heldText(change.file)), changes);
    const left = heldText(change.file);
    const empty = left === null || Object.keys(fields(parseDocument(left).toJS())).length === 0;
    if (outcome.changed.length > 0 && (change.created ?? []).length > 0 && empty) {
        removeMade(change.file, change.created ?? []);
    }
    return outcome;
}

/** A recorded value with each `downloads` row's masked secret left out, so the stored one stays. */
function unmasked(key: string, value: unknown): unknown {
    if (key !== DOWNLOADS || !Array.isArray(value)) return value;
    return (value as unknown[]).map((row) => {
        if (!isMap(row)) return row;
        const { [SECRET]: _set, ...rest } = row;
        return rest;
    });
}
