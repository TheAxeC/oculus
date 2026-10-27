// Layer 2, server. The value each key of the machine's `local.yml` files has in force, as the text
// the Settings view shows under the key, built from the values the context holds
// (`server.machine()` is the joined read of the files with the keys a switch did not apply held at
// their running value). A path is shown as it resolved, and the port as the number of the port the
// server listens on, which is the port in force whatever the file names, since a move to the port
// it names can be refused. A key with no value in force has no entry, and the view shows its
// default.
//
// The three lists (`accounts`, `calendars`, `mail`) join the rows of every hub's file, so each
// shows one line per row in YAML flow form followed by the hub whose file holds it in parentheses,
// and `hubs` names the hubs whose files set the list, whether or not a row of the file is in force.
// `downloads` is read from the primary's file alone and shows one line per row.
//
// No secret reaches the page: each literature key and token that holds a value, and the `secret` of
// each `downloads` row, is sent as the catalog's word for a value that is set. `literature.mailto`
// is a contact address and is sent as written.

import { stringify } from 'yaml';
import {
    LITERATURE_KEYS,
    PROGRAM_KEYS,
    STATE_PATHS,
    type LocalConfig
} from '../../../../data/sources/config.ts';

/** What the Settings answer carries of the values: the text of each key, and the hubs of a list. */
export type MachineValues = {
    values: Record<string, string>;
    hubs: Record<string, string[]>;
};

/** The literature keys whose value is shown as it is written: the contact address alone. */
const SHOWN_LITERATURE: readonly string[] = ['mailto'];

/** One row of a list as a line: its fields in flow form, then its hub in parentheses. */
function lineOf(row: { hub?: string; [field: string]: unknown }): string {
    const { hub, ...fields } = row;
    const flow = stringify(fields, { collectionStyle: 'flow', lineWidth: 0 }).trim();
    return hub === undefined ? flow : `${flow} (${hub})`;
}

/**
 * The keys with one value, each with the text of its value in force; the port is `listening`, the
 * user's key `self` is the key as written, and a literature key or token that holds a value is
 * `hidden`.
 */
function scalarsOf(
    config: LocalConfig,
    listening: number,
    hidden: string
): [string, string | undefined][] {
    const literature = config.literature;
    return [
        ['port', String(listening)],
        ['self', config.self],
        ...[...PROGRAM_KEYS, ...STATE_PATHS].map(([key, field]): [string, string | undefined] => [
            key,
            config[field]
        ]),
        ...LITERATURE_KEYS.map(([name, field]): [string, string | undefined] => {
            const value = literature?.[field];
            const shown = value === undefined || SHOWN_LITERATURE.includes(name) ? value : hidden;
            return [`literature.${name}`, shown];
        })
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
    for (const [key, value] of scalarsOf(config, listening, hidden)) {
        const isSet = set.includes(key);
        const fallback = Object.hasOwn(defaults, key) ? defaults[key] : undefined;
        if (value === undefined) {
            if (isSet && fallback !== undefined) values[key] = fallback;
        } else if (isSet || value !== fallback) {
            values[key] = value;
        }
    }
    const joined: [string, { hub?: string }[]][] = [
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
