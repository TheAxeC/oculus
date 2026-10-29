// Layer 2, server. The value each key of the machine's `local.yml` files has in force, as the text
// the Settings view shows under the key, built from the values the context holds
// (`server.machine()` is the joined read of the files with the keys a switch did not apply held at
// their running value). A path is shown as it resolved, and the port as the number of the port the
// server listens on, which is the port in force whatever the file names, since a move to the port
// it names can be refused. A key with no value in force has no entry, and the view shows its
// default.
//
// The four lists (`clusters`, `accounts`, `calendars`, `mail`) join the rows of every hub's file,
// so each shows one line per row in YAML flow form followed by the hub whose file holds it in
// parentheses, and `hubs` names the hubs whose files set the list, whether or not a row of the
// file is in force.
// `downloads` is read from the primary's file alone and shows one line per row.
//
// No secret reaches the page: the `secret` of each `downloads` row is sent as the catalog's word
// for a value that is set. `literature.mailto` is a contact address and is sent as written.
//
// Beside the values in force, `localFiles` answers each hub's own file as the This machine scope
// edits it: the values the file writes, its `downloads` secrets as `true`, and its digest.

import { readFileSync } from 'node:fs';
import { parseDocument, stringify } from 'yaml';
import { fields, isMap } from '../../../../data/helpers/guards.ts';
import { textDigest, type LocalFile } from '../../../../data/shapes/config-save.ts';
import {
    PROGRAM_KEYS,
    STATE_PATHS,
    type ClusterAccount,
    type LocalConfig
} from '../../../../data/sources/config.ts';
import { localFile } from '../../../../data/sources/config/local.ts';

/** What the Settings answer carries of the values: the text of each key, and the hubs of a list. */
export type MachineValues = {
    values: Record<string, string>;
    hubs: Record<string, string[]>;
};

/** One row of a list as a line: its fields in flow form, then its hub in parentheses. */
function lineOf(row: { hub?: string; [field: string]: unknown }): string {
    const { hub, ...fields } = row;
    const flow = stringify(fields, { collectionStyle: 'flow', lineWidth: 0 }).trim();
    return hub === undefined ? flow : `${flow} (${hub})`;
}

/** A row of `clusters:` with its fields named as the file names them. */
function clusterLine(row: ClusterAccount): { hub?: string; [field: string]: unknown } {
    return {
        resource: row.resource,
        ...(row.user === undefined ? {} : { user: row.user }),
        ...(row.keyFile === undefined ? {} : { key_file: row.keyFile }),
        ...(row.hub === undefined ? {} : { hub: row.hub })
    };
}

/**
 * The keys with one value, each with the text of its value in force; the port is `listening` and
 * the user's key `self` is the key as written.
 */
function scalarsOf(config: LocalConfig, listening: number): [string, string | undefined][] {
    return [
        ['port', String(listening)],
        ['self', config.self],
        ...[...PROGRAM_KEYS, ...STATE_PATHS].map(([key, field]): [string, string | undefined] => [
            key,
            config[field]
        ]),
        ['literature.mailto', config.literature?.mailto]
    ];
}

/**
 * The values of `config` for the Settings answer, with `listening` the port the server listens on
 * and `hidden` the catalog's word that stands for a secret's value. `set` names the keys the
 * primary hub's file sets and `defaults` is the default text of each key. A key the file does not
 * set has an entry only when its value differs from the default (a started key held at its running
 * value, a port the server could not leave), a key it sets has one always, and a key it sets whose
 * value does not read has its default as the value in force. A list has lines only when some hub's
 * file holds a row of it. `lists` names the hubs whose file sets each list, as the read of the
 * files knows them.
 */
export function machineValues(
    config: LocalConfig,
    listening: number,
    set: readonly string[],
    defaults: Readonly<Record<string, string>>,
    lists: Readonly<Record<string, readonly string[]>>,
    hidden: string
): MachineValues {
    const values: Record<string, string> = {};
    const hubs: Record<string, string[]> = {};
    for (const [key, value] of scalarsOf(config, listening)) {
        const isSet = set.includes(key);
        const fallback = Object.hasOwn(defaults, key) ? defaults[key] : undefined;
        if (value === undefined) {
            if (isSet && fallback !== undefined) values[key] = fallback;
        } else if (isSet || value !== fallback) {
            values[key] = value;
        }
    }
    const joined: [string, { hub?: string }[]][] = [
        ['clusters', config.clusters.map(clusterLine)],
        ['accounts', config.accounts],
        ['calendars', config.calendars],
        ['mail', config.mail]
    ];
    for (const [key, rows] of joined) {
        const setting = lists[key] ?? [];
        if (setting.length > 0) hubs[key] = [...setting];
        if (rows.some((row) => row.hub !== undefined)) values[key] = rows.map(lineOf).join('\n');
    }
    if (config.downloads.length > 0) {
        values.downloads = config.downloads
            .map((row) => lineOf({ ...row, secret: hidden }))
            .join('\n');
    }
    return { values, hubs };
}

/** A `downloads` value with each row's secret as `true` when it holds one, and left out else. */
function maskedRows(value: unknown): unknown {
    if (!Array.isArray(value)) return value;
    return (value as unknown[]).map((row) => {
        if (!isMap(row) || !Object.hasOwn(row, 'secret')) return row;
        const { secret, ...rest } = row;
        return typeof secret === 'string' && secret !== '' ? { ...rest, secret: true } : rest;
    });
}

/**
 * Each hub's `.oculus/local.yml` for the This machine scope of Settings, by the hub's name: its
 * values as the file writes them, each `downloads` secret as `true`, and the digest of its text,
 * which a save of the scope is checked against. A file that does not parse gives the line it
 * stops at and no word of its text; a file that cannot be read is answered as not there.
 */
export function localFiles(
    hubs: readonly { name: string; dir: string }[]
): Record<string, LocalFile> {
    const files: Record<string, LocalFile> = {};
    for (const hub of hubs) {
        let text: string | null;
        try {
            text = readFileSync(localFile(hub.dir), 'utf8');
        } catch {
            text = null;
        }
        if (text === null) {
            files[hub.name] = {
                present: false,
                digest: textDigest(null),
                values: {},
                unparsed: null
            };
            continue;
        }
        const doc = parseDocument(text);
        const line = doc.errors.length > 0 ? (doc.errors[0].linePos?.[0].line ?? 1) : null;
        const read = line === null ? fields(doc.toJS()) : null;
        files[hub.name] = {
            present: true,
            digest: textDigest(text),
            values:
                read === null
                    ? null
                    : Object.hasOwn(read, 'downloads')
                      ? { ...read, downloads: maskedRows(read.downloads) }
                      : read,
            unparsed: line
        };
    }
    return files;
}
