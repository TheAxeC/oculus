// Layer 1, data. This machine's own values: the `local.yml` in a hub's `.oculus/` folder, read by
// readLocal alone and never merged into the shared map, so a machine's paths, port, accounts and
// user stay its own (data/sources/config/machine.ts joins the files of the hubs of a workspace).
// Every key has a default. A key whose value the file gets wrong takes its default and is a problem
// naming the key, a row of a list that fails is left out and is a problem naming the row, and a
// file that does not read at all is every default and one problem: no read throws, so the server
// starts and every other key is applied.

import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { z } from 'zod';
import { parse } from 'yaml';
import {
    MAC_TARGET,
    type AccountProvider,
    type CalendarAccountConfig,
    type MailAccountConfig,
    type UsageAccountConfig
} from '../../model/index.ts';
import { isAccountLabel, isCalendarProvider, isProvider } from '../../accounts/connect.ts';
import { filledText, itemsShape, mapShape, readAs } from '../../shapes/shapes.ts';
import { ROOT_FOLDER } from '../../helpers/hub-names.ts';

/** A port: a whole number. */
const portShape = z.number().refine(Number.isInteger);

/**
 * The keys under `literature:` of the file: the contact address a literature source's row sends as
 * its `contact` parameter. Absent unless the machine sets it; a source's secret is a `downloads`
 * row.
 */
type LiteratureKeys = {
    mailto?: string;
};

export type LocalConfig = {
    /** Port the oculus server listens on, bound to 127.0.0.1. */
    port: number;
    /**
     * The user's own person key, `self` in the file, resolved from the primary hub against the
     * people of every hub (data/snapshot/hubs/self.ts); empty when the file names nobody.
     */
    self: string;
    /**
     * This machine's account on each cluster, `clusters` in the file: the user name and the key
     * file ssh connects with, by the cluster's key. Empty unless the machine names any.
     */
    clusters: ClusterAccount[];
    /**
     * Where the session layer keeps its byte-offset cache, `sessions_cache` in the file. Absent
     * unless the machine sets it, and the sessions layer then uses ~/.oculus/transcript-cache.json.
     */
    sessionsCache?: string;
    /**
     * Where the per-session overrides live, `sessions_overrides` in the file. Absent unless the
     * machine sets it, and the sessions layer then uses ~/.oculus/sessions.json.
     */
    sessionsOverrides?: string;
    /**
     * Where the change log lives, `changes` in the file. Absent unless the machine sets it, and the
     * write path then uses ~/.oculus/changes.jsonl.
     */
    changes?: string;
    /**
     * Where the copies made before each save live, `history` in the file. Absent unless the
     * machine sets it, and the save path then uses ~/.oculus/history.
     */
    history?: string;
    /**
     * Where the approvals live, `approvals` in the file: the one file of the texts a reader has
     * approved to run. Absent unless the machine sets it, and the approval check then uses
     * ~/.oculus/approvals.json.
     */
    approvals?: string;
    /**
     * Where the language servers keep this machine's state, `lsp` in the file: a folder per served
     * root holding clangd's index, and `choices.json`, the interpreter and compile database chosen
     * for each repository. Absent unless the machine sets it, and the language servers then use
     * ~/.oculus/lsp.
     */
    lsp?: string;
    /**
     * Where the schedules' run record lives, `schedule_record` in the file. Absent unless the
     * machine sets it, and the schedule watcher then uses ~/.oculus/schedule.json.
     */
    scheduleRecord?: string;
    /**
     * Absolute or PATH-resolved Claude CLI the update tasks and the chat terminal are started with.
     */
    claudeBin: string;
    /**
     * The account the suggested commit message runs under, `commit_message_account` in the file:
     * the label of a `claude` row of the accounts joined from every hub's file, compared reduced
     * as the join compares Claude labels. Absent or empty, the run takes the default folder.
     */
    commitMessageAccount?: string;
    /**
     * The program an `https` address is handed to, `open_bin` in the file: a provider's consent
     * page, an event or a thread at its provider. Absent unless the machine sets it, and the server
     * then hands the address to the platform's opener: /usr/bin/open on macOS, xdg-open on Linux,
     * wslview under WSL2.
     */
    openBin?: string;
    /**
     * The rite debug adapter the Debug view starts, `rite_dap_bin` in the file: an absolute path, a
     * path under `~/` or a name resolved on PATH. A change holds from the next launch.
     */
    riteDapBin: string;
    /** Claude and Codex config folders shown by the Usage view. */
    accounts: UsageAccountConfig[];
    /** The calendar accounts the Calendar view reads, empty unless the machine names any. */
    calendars: CalendarAccountConfig[];
    /**
     * Where the per-account calendar credential files live, `calendar_dir` in the file. Absent
     * unless the machine sets it, and the calendar connector then uses ~/.oculus/calendar.
     */
    calendarDir?: string;
    /** The mail accounts the Inbox view reads, empty unless the machine names any. */
    mail: MailAccountConfig[];
    /**
     * Where the per-account mail credential files and the triage notes live, `mail_dir` in the
     * file. Absent unless the machine sets it, and the mail connector then uses ~/.oculus/mail.
     */
    mailDir?: string;
    /**
     * The literature sources' contact address, `literature` in the file. Absent unless the machine
     * sets it. The Settings view shows it, and the file opens in a source tab like any file of the
     * workspace.
     */
    literature?: LiteratureKeys;
    /**
     * The secrets the reader rows of the hubs' `.oculus/config.yml` and the deposit's
     * `deposit.zenodo` row sign in with, `downloads` in the file: one row per service, the key an
     * `auth` entry names. Empty unless the machine names any; a row no `auth` entry names is read
     * and unused. No value of a row reaches a page, a log or a command line.
     */
    downloads: DownloadAccount[];
};

/**
 * One row of `clusters:`: the key of the cluster entry it is this machine's account on, the user
 * name on that cluster and the absolute path of the key file, each absent when the row leaves it
 * out, and the hub whose file holds the row.
 */
export type ClusterAccount = { resource: string; user?: string; keyFile?: string; hub?: string };

/**
 * A user name ssh's `-l` takes as one word that is no option: a letter, a digit or an underscore,
 * then letters, digits, dots, dashes and underscores.
 */
export const USER_NAME = /^[A-Za-z0-9_][A-Za-z0-9._-]*$/;

/**
 * One row of `downloads:`: the service, the key a reader row's or `deposit.zenodo`'s `auth` entry
 * names it by; the user name an entry that signs in with `basic` sends; and the secret.
 */
export type DownloadAccount = { service: string; user?: string; secret: string };

/** The default development port. */
export const DEFAULT_PORT = 8790;

/** The name of the machine-local file inside a hub's `.oculus/` folder. */
export const LOCAL_NAME = 'local.yml';

/** The keys local.yml may carry, which readLocal reads and the options catalog describes. */
export const LOCAL_KEYS = [
    'port',
    'self',
    'clusters',
    'sessions_cache',
    'sessions_overrides',
    'changes',
    'history',
    'approvals',
    'lsp',
    'schedule_record',
    'claude_bin',
    'commit_message_account',
    'open_bin',
    'rite_dap_bin',
    'accounts',
    'calendars',
    'calendar_dir',
    'mail',
    'mail_dir',
    'literature',
    'downloads'
];

/** The keys under `literature:`, with the field of LiteratureKeys each sets. */
const LITERATURE_KEYS = [['mailto', 'mailto']] as const;

/**
 * The defaults: the port is 8790, nobody is the user, and Claude and the rite debug adapter are
 * resolved on PATH.
 */
export function localDefaults(): LocalConfig {
    return {
        port: DEFAULT_PORT,
        self: '',
        clusters: [],
        claudeBin: 'claude',
        riteDapBin: 'rite_dap',
        accounts: [
            { tool: 'claude', dir: join(homedir(), '.claude'), label: 'claude' },
            { tool: 'codex', dir: join(homedir(), '.codex'), label: 'codex' }
        ],
        calendars: [],
        mail: [],
        downloads: []
    };
}

/**
 * A path local.yml names: `~` and a value starting with `~/` are under the home folder, an absolute
 * one stands, and any other is resolved against `base`, the folder of the hub whose file names it.
 */
function localPath(value: string, base: string): string {
    if (value === '~') return homedir();
    if (value.startsWith('~/')) return join(homedir(), value.slice(2));
    return isAbsolute(value) ? value : resolve(base, value);
}

/** The label fragment shared by config validation and hidden usage session names. */
export function usageAccountLabel(label: string): string {
    return label.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
}

/** The text at `key` of `record`, which must carry something, or undefined. */
function filledAt(record: Record<string, unknown>, key: string): string | undefined {
    return filledText(record[key]);
}

/** What is wrong with a key of the file, or with a row of a list, or with the file as a whole. */
export type LocalProblem =
    | { key: string; kind: 'value' | 'row'; words: string; sentence: string }
    | { key: string; kind: 'repeat'; sentence: string }
    | { key: string; kind: 'other-hub'; hub: string; sentence: string }
    | { key: string; kind: 'label'; sentence: string }
    | { key: string; kind: 'user'; service: string; sentence: string }
    | { key: ''; kind: 'unparsed' | 'not-a-map'; sentence: string }
    | { key: ''; kind: 'unreadable'; code: string; sentence: string };

/**
 * What a read of the file answers: the values with a default in place of each key that is wrong,
 * the problems in the order the keys are read, the keys the file carries that oculus does not read,
 * and whether the file read at all. `sentence` of a problem is the sentence the source tab's save
 * is refused with; it may hold a label of the file, so a finding never uses it.
 */
export type LocalRead = {
    config: LocalConfig;
    problems: LocalProblem[];
    unknown: string[];
    /**
     * The known keys the file carries with a value that reads, so a reader tells a key the file
     * sets from a default. A key whose value is wrong is left out, as a missing key is, and its
     * problem is in `problems`: the default in force for it is the one a missing key has.
     */
    set: string[];
    unread: boolean;
};

/** The problems of a key that must be `words`; `sentence` names the key. */
function wrong(
    key: string,
    words: string,
    kind: 'value' | 'row' = 'value'
): Extract<LocalProblem, { kind: 'value' | 'row' }> {
    return { key, kind, words, sentence: `${key} must be ${words}` };
}

/** The rows of `accounts:` that read: a Claude or Codex folder and a label each. */
function usageAccounts(
    value: unknown,
    base: string,
    problems: LocalProblem[]
): UsageAccountConfig[] | null {
    const list = readAs(itemsShape, value);
    if (list === null) {
        problems.push(wrong('accounts', 'a list'));
        return null;
    }
    const claudeLabels = new Set<string>();
    const rows: UsageAccountConfig[] = [];
    list.forEach((item, index) => {
        const at = `accounts[${index}]`;
        const row = readAs(mapShape, item);
        if (row === null) {
            problems.push(wrong(at, 'a map', 'row'));
            return;
        }
        const tool = row.tool;
        if (tool !== 'claude' && tool !== 'codex') {
            problems.push(wrong(`${at}.tool`, 'claude or codex', 'row'));
            return;
        }
        const dir = filledText(row.dir);
        if (dir === undefined) {
            problems.push(wrong(`${at}.dir`, 'a path', 'row'));
            return;
        }
        const label = filledText(row.label);
        if (label === undefined) {
            problems.push(wrong(`${at}.label`, 'words', 'row'));
            return;
        }
        if (tool === 'claude') {
            const reduced = usageAccountLabel(label);
            if (claudeLabels.has(reduced)) {
                problems.push({
                    key: `${at}.label`,
                    kind: 'repeat',
                    sentence: `${at}.label duplicates a Claude label or reduced label: ${reduced}`
                });
                return;
            }
            claudeLabels.add(reduced);
        }
        rows.push({ tool, dir: localPath(dir, base), label });
    });
    return rows;
}

/**
 * The rows of `calendars:` or `mail:`: one provider the list takes and one label each, the label
 * unique per provider inside its own list. `calendars:` takes the two providers that sign in and a
 * published link, `ics`; `mail:` takes the two alone. A row that fails is left out with a problem
 * naming the list, the row and what it must be, and the rows around it are read; a list that is
 * not a list is null.
 */
function connectAccounts<P extends AccountProvider>(
    value: unknown,
    list: string,
    takes: { accepts: (value: unknown) => value is P; named: string },
    problems: LocalProblem[]
): { provider: P; label: string }[] | null {
    const rows = readAs(itemsShape, value);
    if (rows === null) {
        problems.push(wrong(list, 'a list'));
        return null;
    }
    const seen = new Set<string>();
    const read: { provider: P; label: string }[] = [];
    rows.forEach((item, index) => {
        const at = `${list}[${index}]`;
        const row = readAs(mapShape, item);
        if (row === null) {
            problems.push(wrong(at, 'a map', 'row'));
            return;
        }
        const provider = row.provider;
        if (!takes.accepts(provider)) {
            problems.push(wrong(`${at}.provider`, takes.named, 'row'));
            return;
        }
        if (!isAccountLabel(row.label)) {
            problems.push(wrong(`${at}.label`, 'lowercase letters, digits and dashes', 'row'));
            return;
        }
        const key = `${provider}-${row.label}`;
        if (seen.has(key)) {
            problems.push({
                key: `${at}.label`,
                kind: 'repeat',
                sentence: `${at}.label repeats ${row.label} for ${provider}`
            });
            return;
        }
        seen.add(key);
        read.push({ provider, label: row.label });
    });
    return read;
}

/**
 * The path of a cluster's key file a `clusters:` row names: `~/` resolved against the home folder,
 * absolute after that, holding no single quote (rsync's `-e` word quotes it in single quotes) and
 * not ending in `.pub`, the public half; null for any other.
 */
export function keyFilePath(value: string): string | null {
    const path = value.startsWith('~/') ? join(homedir(), value.slice(2)) : value;
    if (!isAbsolute(path) || path.includes("'") || path.endsWith('.pub')) return null;
    return path;
}

/**
 * The rows of `clusters:` that read: the key of a cluster, and the user name and the key file the
 * row gives, an empty one read as absent. A row whose user name is no USER_NAME, or whose key file
 * keyFilePath refuses, is left out with a problem naming the row and the field, and so is a row of
 * the resource `mac`, which names this Mac, and a row of a resource an earlier row names; no
 * problem holds a value of the file. A list that is not a list is null.
 */
function clusterAccounts(value: unknown, problems: LocalProblem[]): ClusterAccount[] | null {
    const rows = readAs(itemsShape, value);
    if (rows === null) {
        problems.push(wrong('clusters', 'a list'));
        return null;
    }
    const read: ClusterAccount[] = [];
    rows.forEach((item, index) => {
        const at = `clusters[${index}]`;
        const row = readAs(mapShape, item);
        if (row === null) {
            problems.push(wrong(at, 'a map', 'row'));
            return;
        }
        const resource = filledText(row.resource);
        if (resource === undefined) {
            problems.push(wrong(`${at}.resource`, 'the key of a cluster', 'row'));
            return;
        }
        if (resource === MAC_TARGET) {
            problems.push(wrong(`${at}.resource`, NOT_THIS_MAC_WORDS, 'row'));
            return;
        }
        const one: ClusterAccount = { resource };
        if (row.user !== undefined && row.user !== '') {
            if (typeof row.user !== 'string' || !USER_NAME.test(row.user)) {
                problems.push(wrong(`${at}.user`, USER_WORDS, 'row'));
                return;
            }
            one.user = row.user;
        }
        if (row.key_file !== undefined && row.key_file !== '') {
            const file = typeof row.key_file === 'string' ? keyFilePath(row.key_file) : null;
            if (file === null) {
                problems.push(wrong(`${at}.key_file`, KEY_FILE_WORDS, 'row'));
                return;
            }
            one.keyFile = file;
        }
        if (read.some((earlier) => earlier.resource === resource)) {
            problems.push(
                wrong(`${at}.resource`, 'the key of a cluster no earlier row names', 'row')
            );
            return;
        }
        read.push(one);
    });
    return read;
}

/** What a `clusters:` row's resource must be besides the key of a cluster. */
const NOT_THIS_MAC_WORDS = `the key of a cluster other than ${MAC_TARGET}, which names this Mac`;

/** What a `clusters:` row's user name must be. */
const USER_WORDS =
    'a user name of letters, digits, dots, dashes and underscores, starting with a letter, a digit or an underscore';

/** What a `clusters:` row's key file must be. */
const KEY_FILE_WORDS =
    'an absolute path or one under ~/, holding no single quote and not ending in .pub';

/**
 * The keys under `literature:` that read. A value that is no map is a problem and gives none; a key
 * that is not text with something in it is a problem and is absent; a key oculus does not read is
 * added to `unknown` as `literature.<key>` and ignored.
 */
function literatureKeys(
    value: unknown,
    problems: LocalProblem[],
    unknown: string[]
): LiteratureKeys | null {
    const record = readAs(mapShape, value);
    if (record === null) {
        problems.push(wrong('literature', 'a map'));
        return null;
    }
    const keys: LiteratureKeys = {};
    for (const key of Object.keys(record)) {
        if (!LITERATURE_KEYS.some(([name]) => name === key)) unknown.push(`literature.${key}`);
    }
    for (const [name, field] of LITERATURE_KEYS) {
        if (record[name] === undefined) continue;
        const text = filledAt(record, name);
        if (text === undefined) problems.push(wrong(`literature.${name}`, 'a non-empty string'));
        else keys[field] = text;
    }
    return Object.keys(keys).length === 0 ? null : keys;
}

/**
 * The rows of `downloads:` that read: a service, an optional user, and the secret. A row that
 * fails, or names a service an earlier row names, is left out with a problem naming the row and
 * what it must be; no problem holds a value of the file. A list that is not a list is null.
 */
function downloadAccounts(value: unknown, problems: LocalProblem[]): DownloadAccount[] | null {
    const rows = readAs(itemsShape, value);
    if (rows === null) {
        problems.push(wrong('downloads', 'a list'));
        return null;
    }
    const seen = new Set<string>();
    const read: DownloadAccount[] = [];
    rows.forEach((item, index) => {
        const at = `downloads[${index}]`;
        const row = readAs(mapShape, item);
        if (row === null) {
            problems.push(wrong(at, 'a map', 'row'));
            return;
        }
        const service = filledText(row.service);
        if (service === undefined) {
            problems.push(wrong(`${at}.service`, 'a non-empty string', 'row'));
            return;
        }
        const user = filledText(row.user);
        if (row.user !== undefined && user === undefined) {
            problems.push(wrong(`${at}.user`, 'a user name', 'row'));
            return;
        }
        const secret = filledText(row.secret);
        if (secret === undefined) {
            problems.push(wrong(`${at}.secret`, 'a non-empty string', 'row'));
            return;
        }
        if (seen.has(service)) {
            problems.push({
                key: `${at}.service`,
                kind: 'repeat',
                sentence: `${at}.service repeats the service of an earlier row`
            });
            return;
        }
        seen.add(service);
        read.push(user === undefined ? { service, secret } : { service, user, secret });
    });
    return read;
}

/**
 * The keys under `literature:` the config sets, as `literature.<key>` names; none of the values.
 */
export function literatureSet(config: LocalConfig): string[] {
    const keys = config.literature;
    if (keys === undefined) return [];
    return LITERATURE_KEYS.filter(([, field]) => keys[field] !== undefined).map(
        ([name]) => `literature.${name}`
    );
}

/**
 * Which file readLocal reads for the hub in `hub`: its `.oculus/local.yml`, out of git. A relative
 * path inside it resolves against the hub's folder.
 */
export function localFile(hub: string): string {
    return join(hub, ROOT_FOLDER, LOCAL_NAME);
}

/** The keys of the file that name a program, with the field each sets. */
export const PROGRAM_KEYS = [
    ['claude_bin', 'claudeBin'],
    ['open_bin', 'openBin'],
    ['rite_dap_bin', 'riteDapBin']
] as const;

/** The keys of the file that name a folder or file of this machine, with the field each sets. */
export const STATE_PATHS = [
    ['sessions_cache', 'sessionsCache'],
    ['sessions_overrides', 'sessionsOverrides'],
    ['changes', 'changes'],
    ['history', 'history'],
    ['approvals', 'approvals'],
    ['lsp', 'lsp'],
    ['schedule_record', 'scheduleRecord'],
    ['calendar_dir', 'calendarDir'],
    ['mail_dir', 'mailDir']
] as const;

/** Every default, and one problem saying the file did not read. */
function unreadFile(problem: LocalProblem): LocalRead {
    return {
        config: localDefaults(),
        problems: [problem],
        unknown: [],
        set: [],
        unread: true
    };
}

/**
 * Read one machine-local file's text over the defaults. Every key is read on its own: a scalar
 * whose value is wrong keeps its default (or stays absent where the key is optional), a list that
 * is not a list keeps its default list, and either is left out of `set`, as a missing key is; a
 * row of a list that fails is left out while the rows around it are read, so a list whose every
 * row fails is the empty list. A text that does not
 * parse, or is not a map, is every default and one problem with the key `''`. The reader and the
 * check the source endpoint makes before it writes that file run this one function, so a body the
 * check accepts is a body the next read takes whole. `base` is the folder of the hub whose file it
 * is, which a relative path resolves against; `hub` is the name that marks each account row.
 */
export function readLocalText(text: string, base: string, hub?: string): LocalRead {
    let parsed: unknown;
    try {
        parsed = parse(text);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return unreadFile({
            key: '',
            kind: 'unparsed',
            sentence: message.split('\n')[0]
        });
    }
    const record = readAs(mapShape, parsed ?? {});
    if (record === null) {
        return unreadFile({
            key: '',
            kind: 'not-a-map',
            sentence: 'expected a map of keys'
        });
    }

    const config = localDefaults();
    const problems: LocalProblem[] = [];
    const unknown = Object.keys(record).filter((key) => !LOCAL_KEYS.includes(key));
    const carried = Object.keys(record).filter((key) => LOCAL_KEYS.includes(key));

    if (record.port !== undefined) {
        const port = readAs(portShape, record.port);
        if (port === null) problems.push(wrong('port', 'an integer'));
        else config.port = port;
    }
    for (const [key, field] of PROGRAM_KEYS) {
        if (record[key] === undefined) continue;
        const value = filledAt(record, key);
        if (value === undefined) problems.push(wrong(key, 'a non-empty string'));
        else config[field] = value;
    }
    // Empty marks nobody and is no problem; whether a person of any hub holds the key is read once
    // the hubs are merged (data/snapshot/hubs/self.ts).
    if (record.self !== undefined) {
        if (typeof record.self !== 'string') problems.push(wrong('self', 'a person key'));
        else config.self = record.self;
    }
    // Empty is the default folder and no problem; whether the label is a Claude row's is read
    // after every hub's accounts are joined (data/sources/config/machine.ts).
    const account = record.commit_message_account;
    if (account !== undefined) {
        if (typeof account !== 'string') problems.push(wrong('commit_message_account', 'a label'));
        else if (account !== '') config.commitMessageAccount = account;
    }
    if (record.clusters !== undefined) {
        const rows = clusterAccounts(record.clusters, problems);
        if (rows !== null) config.clusters = marked(rows, hub);
    }
    if (record.accounts !== undefined) {
        const rows = usageAccounts(record.accounts, base, problems);
        if (rows !== null) config.accounts = marked(rows, hub);
    }
    if (record.calendars !== undefined) {
        const rows = connectAccounts(
            record.calendars,
            'calendars',
            { accepts: isCalendarProvider, named: 'google, microsoft or ics' },
            problems
        );
        if (rows !== null) config.calendars = marked(rows, hub);
    }
    if (record.mail !== undefined) {
        const rows = connectAccounts(
            record.mail,
            'mail',
            { accepts: isProvider, named: 'google or microsoft' },
            problems
        );
        if (rows !== null) config.mail = marked(rows, hub);
    }
    if (record.literature !== undefined) {
        const literature = literatureKeys(record.literature, problems, unknown);
        if (literature !== null) config.literature = literature;
    }
    if (record.downloads !== undefined) {
        const rows = downloadAccounts(record.downloads, problems);
        if (rows !== null) config.downloads = rows;
    }
    // The machine-local state paths are absent unless the machine names them, so a config that says
    // nothing about them leaves the defaults to the modules that own them.
    for (const [key, field] of STATE_PATHS) {
        if (record[key] === undefined) continue;
        const value = filledAt(record, key);
        if (value === undefined) problems.push(wrong(key, 'a path'));
        else config[field] = localPath(value, base);
    }
    const wrongKeys = new Set(problems.filter((one) => one.kind === 'value').map((one) => one.key));
    const set = carried.filter((key) => !wrongKeys.has(key));
    return { config, problems, unknown, set, unread: false };
}

/** The rows with the name of the hub whose file holds them, when there is one. */
function marked<T>(rows: T[], hub: string | undefined): T[] {
    return hub === undefined ? rows : rows.map((row) => ({ ...row, hub }));
}

/**
 * Read the `.oculus/local.yml` of the hub folder `base`, and never throw. A missing file is every
 * default and no problem, since every key has one. A file that cannot be read (a folder at its
 * path, no permission) is every default and one problem with the error's code. An unknown key is
 * warned of on stderr when `warn` is true, and ignored.
 */
export function readLocal(base: string, warn = false, hub?: string): LocalRead {
    const file = localFile(base);
    let text: string;
    try {
        text = readFileSync(file, 'utf8');
    } catch (error) {
        const code = (error as NodeJS.ErrnoException).code ?? 'unknown';
        if (code === 'ENOENT' || code === 'ENOTDIR') {
            return {
                config: localDefaults(),
                problems: [],
                unknown: [],
                set: [],
                unread: false
            };
        }
        return unreadFile({
            key: '',
            kind: 'unreadable',
            code,
            sentence: `could not be read (${code})`
        });
    }
    const read = readLocalText(text, base, hub);
    if (warn && read.unknown.length > 0) {
        console.warn(`${file}: ignoring unknown key(s) ${read.unknown.join(', ')}`);
    }
    return read;
}

/**
 * The sentence for a problem as a caller shows it: the file, a colon and the sentence, and for a
 * text that does not parse the parser's first line alone.
 */
export function localSentence(problem: LocalProblem, file: string): string {
    return problem.kind === 'unparsed' ? problem.sentence : `${file}: ${problem.sentence}`;
}

/**
 * The sentence the first problem of this text gives, or null when every key reads. The source
 * endpoint checks a save of a hub's `local.yml` with it, so a body that would cost a key its value
 * is refused with that sentence rather than written. A file name makes the sentence the reader's
 * own ("local.yml: port must be an integer"); a parse error is given by its first line.
 */
export function checkLocal(text: string, file: string = LOCAL_NAME): string | null {
    const first = readLocalText(text, dirname(file)).problems.at(0);
    return first === undefined ? null : localSentence(first, file);
}
