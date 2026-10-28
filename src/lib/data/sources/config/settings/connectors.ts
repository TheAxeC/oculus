// Layer 1, data. The typed readers of the settings of the services oculus polls or asks: the
// clusters and the keys Account setup makes for them, the rows that tell a failed connection
// apart, the sign-in providers, Recover's Node.js download, the calendar, the mail, the Literature
// search's sources, and the usage tiers and their refresh. Each reads its keys of behavior.yml
// through settingReader, or a list of records through checkedRows (reader.ts).

import { MAC_TARGET, type ToldFailure } from '../../../model/index.ts';
import {
    checkedRows,
    heldAt,
    noRule,
    settingEntry,
    settingReader,
    type SettingProblem
} from './reader.ts';

/** The Live HPC settings of behavior.yml. */
export type SlurmSettings = {
    /**
     * The keys of the cluster entries of the resources registry the poller queries, in the order
     * the hub lists them, each once.
     */
    resources: string[];
    days: number;
    pollMin: number;
    quotaMin: number;
    prewarm: boolean;
};

/**
 * The keys of `slurm.resource`: a value that is no list of texts (one text among them, which the
 * multi's rule would take as a list of one) is a problem naming the key and gives none, a key
 * named twice is a problem and is kept once, where it first stands, and the key that names this
 * Mac (MAC_TARGET), which is no cluster, is a problem and is left out.
 */
function resourceKeys(config: Record<string, unknown>, problems: SettingProblem[]): string[] {
    const key = 'slurm.resource';
    const held = heldAt(config, key, problems);
    const texts = (value: unknown): boolean =>
        Array.isArray(value) && value.every((one) => typeof one === 'string');
    if (held.present && !texts(held.value)) {
        const spec = settingEntry(config, key);
        problems.push({ key, where: 'value', problem: { kind: 'words' }, spec });
        return [];
    }
    const keys: string[] = [];
    for (const one of settingReader(config, problems).strings(key)) {
        if (one === MAC_TARGET) problems.push({ key, where: 'this-mac' });
        else if (keys.includes(one)) problems.push({ key, where: 'repeat', name: one });
        else keys.push(one);
    }
    return keys;
}

/** Read `slurm:`'s five keys, each its default when it is missing or wrong. */
export function slurmSettings(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): SlurmSettings {
    const read = settingReader(config, problems);
    return {
        resources: resourceKeys(config, problems),
        days: read.number('slurm.days'),
        pollMin: read.number('slurm.poll_min'),
        quotaMin: read.number('slurm.quota_min'),
        prewarm: read.flag('slurm.prewarm')
    };
}

/** The types of key Account setup makes, the words `clusters.key_type` takes. */
const KEY_TYPES = ['ed25519', 'ecdsa', 'rsa'] as const;

/** One of the words of KEY_TYPES. */
export type KeyType = (typeof KEY_TYPES)[number];

/**
 * The key Account setup makes for a cluster: its type, empty when the hub sets none, and the path
 * the hub gives with `{type}` and `{resource}` in it, empty when it sets none.
 */
type ClusterKeySettings = { keyType: KeyType | ''; keyFile: string };

/** Read `clusters.key_type` and `clusters.key_file`, each its default when missing or wrong. */
export function clusterKeySettings(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): ClusterKeySettings {
    const read = settingReader(config, problems);
    const word = read.text('clusters.key_type');
    const keyType = KEY_TYPES.find((one) => one === word) ?? '';
    if (word !== '' && keyType === '') throw noRule('clusters.key_type');
    return { keyType, keyFile: read.text('clusters.key_file') };
}

/** The connections whose error output a row of `connections.failures` reads, the words of `for`. */
const FAILURE_CONNECTIONS = ['cluster', 'git'] as const;

/** One of the words of FAILURE_CONNECTIONS. */
type FailureConnection = (typeof FAILURE_CONNECTIONS)[number];

/**
 * One row of `connections.failures`: the words naming a failure (`kind`), the connections whose
 * error output it reads (`for`: `cluster` for the ssh of a cluster's poll, `git` for a fetch), the
 * text a line of that output holds when it is that failure (`match`), and the words of its fix.
 */
export type FailureRow = { kind: string; for: FailureConnection[]; match: string; fix: string };

/** The connections a row's `for` names, a field the rule has held to the two words, or both. */
function connectionsOf(row: Record<string, unknown>): FailureConnection[] {
    const held = row.for;
    if (held === undefined) return [...FAILURE_CONNECTIONS];
    const named: unknown[] = Array.isArray(held) ? held : [held];
    return FAILURE_CONNECTIONS.filter((one) => named.includes(one));
}

/** The rows that read the error output of `connection`, in their order. */
export function failuresFor(
    rows: readonly FailureRow[],
    connection: FailureConnection
): FailureRow[] {
    return rows.filter((row) => row.for.includes(connection));
}

/** The text a field the rule has already held to a text holds, empty when the row leaves it out. */
function textAt(row: Record<string, unknown>, name: string): string {
    const held = row[name];
    return typeof held === 'string' ? held : '';
}

/**
 * Read `connections.failures`, in its order: a row whose field the rule refuses is a problem and is
 * not read, and so is a row whose `for` is an empty list, which no connection would try, and a row
 * whose `match` is empty, which would hold for every line.
 */
export function failureRows(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): FailureRow[] {
    const key = 'connections.failures';
    const rows: FailureRow[] = [];
    for (const { at, row } of checkedRows(config, key, problems)) {
        const one = {
            kind: textAt(row, 'kind'),
            for: connectionsOf(row),
            match: textAt(row, 'match'),
            fix: textAt(row, 'fix')
        };
        const empty = one.for.length === 0 ? 'for' : one.match === '' ? 'match' : null;
        if (empty !== null) {
            const spec = settingEntry(config, key).fields?.[empty];
            if (spec === undefined) throw noRule(key);
            problems.push({
                key: `${at}.${empty}`,
                where: 'field',
                problem: { kind: 'empty' },
                spec
            });
            continue;
        }
        rows.push(one);
    }
    return rows;
}

/**
 * The failure the error output `output` is, by the first row whose `match` a line of it holds, or
 * null when no row matches and the output is shown as the program wrote it.
 */
export function toldFailure(rows: readonly FailureRow[], output: string): ToldFailure | null {
    const lines = output.split('\n');
    const row = rows.find((one) => lines.some((line) => line.includes(one.match)));
    return row === undefined ? null : { kind: row.kind, fix: row.fix };
}

/**
 * One row of `sign_in`: a provider's key and name, and each address and scope the row gives, absent
 * when it gives none. A row with `credentialAddress` is a git host.
 */
export type SignInRow = {
    key: string;
    name: string;
    authorize?: string;
    token?: string;
    deviceCode?: string;
    user?: string;
    calendar?: string;
    mail?: string;
    mailLink?: string;
    calendarScope?: string;
    mailScope?: string;
    gitScope?: string;
    credentialAddress?: string;
    register?: string;
};

/** The optional fields of a `sign_in` row, each with the field of SignInRow it sets. */
const SIGN_IN_FIELDS = [
    ['authorize', 'authorize'],
    ['token', 'token'],
    ['device_code', 'deviceCode'],
    ['user', 'user'],
    ['calendar', 'calendar'],
    ['mail', 'mail'],
    ['mail_link', 'mailLink'],
    ['calendar_scope', 'calendarScope'],
    ['mail_scope', 'mailScope'],
    ['git_scope', 'gitScope'],
    ['credential_address', 'credentialAddress'],
    ['register', 'register']
] as const;

/**
 * Read `sign_in`, in its order: a row whose key or address the rule refuses is a problem and is not
 * read, a row whose key an earlier row took is a problem and is not read, and a
 * `credential_address` that is no https origin is a problem and the row is read without it, so it
 * is no git host. An empty field is read as absent.
 */
export function signInRows(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): SignInRow[] {
    const rows: SignInRow[] = [];
    for (const { row } of checkedRows(config, 'sign_in', problems, ['credential_address'])) {
        const key = textAt(row, 'key');
        if (rows.some((one) => one.key === key)) {
            problems.push({ key: 'sign_in', where: 'repeat', name: key });
            continue;
        }
        const name = textAt(row, 'name');
        const one: SignInRow = { key, name: name === '' ? key : name };
        for (const [field, set] of SIGN_IN_FIELDS) {
            const text = textAt(row, field);
            if (text !== '') one[set] = text;
        }
        rows.push(one);
    }
    return rows;
}

/** The https address of the folder of Node.js's releases, empty when the hub sets none. */
export function nodeDownload(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): string {
    return settingReader(config, problems).text('recover.node_download');
}

/** The calendar connector's settings of behavior.yml. */
export type CalendarSettings = {
    pollMin: number;
    /** Days before now the calendar window opens. */
    daysBack: number;
    /** Days after now the calendar window closes. */
    daysAhead: number;
};

/** Read `calendar:`'s three keys, each its default when it is missing or wrong. */
export function calendarSettings(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): CalendarSettings {
    const read = settingReader(config, problems);
    return {
        pollMin: read.number('calendar.poll_min'),
        daysBack: read.number('calendar.days_back'),
        daysAhead: read.number('calendar.days_ahead')
    };
}

/** The Literature search settings of behavior.yml. */
export type LiteratureSettings = {
    /** How long one source is given to answer a request, in seconds. */
    timeoutS: number;
    /** How many hits one page asks of each source. */
    perSource: number;
    /** How long an answer is kept for the same request, in minutes; 0 keeps none. */
    cacheMin: number;
};

/** Read `literature:`'s three keys, each its default when it is missing or wrong. */
export function literatureSettings(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): LiteratureSettings {
    const read = settingReader(config, problems);
    return {
        timeoutS: read.number('literature.timeout_s'),
        perSource: read.number('literature.per_source'),
        cacheMin: read.number('literature.cache_min')
    };
}

/** The mail connector's settings of behavior.yml. */
export type MailSettings = {
    pollMin: number;
    /** How many threads each of the plate's three signals is read at most. */
    perSignal: number;
};

/** Read `mail:`'s two keys, each its default when it is missing or wrong. */
export function mailSettings(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): MailSettings {
    const read = settingReader(config, problems);
    return { pollMin: read.number('mail.poll_min'), perSignal: read.number('mail.per_signal') };
}

/**
 * Read `usage_tiers:`, a map of plan id to label, leaving out each entry the catalog's fields
 * refuse. The map keeps an own `__proto__` key as the file holds it.
 */
export function usageTiers(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): Record<string, string> {
    const members = settingReader(config, problems).family('usage_tiers');
    const labels = members.map(([name, label]): [string, string] => {
        if (typeof label !== 'string') throw noRule('usage_tiers');
        return [name, label];
    });
    return Object.fromEntries(labels);
}

/** The usage refresher's settings of behavior.yml. */
export type RefreshSettings = { refreshMin: number; model: string };

/** Read `usage_refresh_min` and `usage_refresh_model`, each its default when missing or wrong. */
export function refreshSettings(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): RefreshSettings {
    const read = settingReader(config, problems);
    return {
        refreshMin: read.number('usage_refresh_min'),
        model: read.text('usage_refresh_model')
    };
}
