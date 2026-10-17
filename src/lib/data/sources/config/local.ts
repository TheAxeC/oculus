// Layer 1, data. This machine's own values: the `local.yml` in a hub's `.oculus/` folder, read by
// readLocal alone and never merged into the shared map, so a machine's paths, port and accounts
// stay its own (data/sources/config/machine.ts joins the files of the hubs of a workspace). Every
// key has a default. A key whose value the file gets wrong takes its default and is a problem
// naming the key, a row of a list that fails is left out and is a problem naming the row, and a
// file that does not read at all is every default and one problem: no read throws, so the server
// starts and every other key is applied.

import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { z } from 'zod';
import { parse } from 'yaml';
import type {
    AccountProvider,
    CalendarAccountConfig,
    MailAccountConfig,
    UsageAccountConfig
} from '../../model/index.ts';
import { isAccountLabel, isCalendarProvider, isProvider } from '../../accounts/connect.ts';
import { filledText, itemsShape, mapShape, readAs } from '../../shapes/shapes.ts';
import { ROOT_FOLDER } from '../../helpers/hub-names.ts';

/** A port: a whole number. */
const portShape = z.number().refine(Number.isInteger);

/**
 * The keys under `literature:` of the file: the API keys of the sources that take one and the
 * contact address three of them ask callers to send. Each is absent unless the machine sets it.
 */
type LiteratureKeys = {
    wosKey?: string;
    scopusKey?: string;
    scopusInsttoken?: string;
    openalexKey?: string;
    semanticScholarKey?: string;
    ncbiKey?: string;
    mailto?: string;
};

export type LocalConfig = {
    /** Port the oculus server listens on, bound to 127.0.0.1. */
    port: number;
    /** Per-machine ssh alias for the Live HPC view. */
    hpcHost?: string;
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
     * Where the reader's own bookmarks live, `bookmarks` in the file. Absent unless the machine
     * sets it, and the file browser then uses .oculus/bookmarks.yml in the primary's folder.
     */
    bookmarks?: string;
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
     * Where the schedules live, `schedules` in the file. Absent unless the machine sets it, and the
     * schedule watcher then uses .oculus/schedules.yml in the primary's folder.
     */
    schedules?: string;
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
    /**
     * Where the machine's apps live, `apps_dir` in the file. Absent unless the machine sets it, and
     * the apps watcher then reads .oculus/apps in the primary's folder.
     */
    appsDir?: string;
    /** The mail accounts the Inbox view reads, empty unless the machine names any. */
    mail: MailAccountConfig[];
    /**
     * Where the per-account mail credential files and the triage notes live, `mail_dir` in the
     * file. Absent unless the machine sets it, and the mail connector then uses ~/.oculus/mail.
     */
    mailDir?: string;
    /**
     * The literature sources' keys and contact address, `literature` in the file. Absent unless
     * the machine sets at least one of them. The Settings view shows their values, and the file
     * opens in a source tab like any file of the workspace; no log holds a value.
     */
    literature?: LiteratureKeys;
};

/** The default development port. */
export const DEFAULT_PORT = 8790;

/** The name of the machine-local file inside a hub's `.oculus/` folder. */
export const LOCAL_NAME = 'local.yml';

/** The keys local.yml may carry, which readLocal reads and the options catalog describes. */
export const LOCAL_KEYS = [
    'port',
    'hpc_host',
    'sessions_cache',
    'sessions_overrides',
    'bookmarks',
    'changes',
    'history',
    'approvals',
    'lsp',
    'schedules',
    'schedule_record',
    'claude_bin',
    'commit_message_account',
    'open_bin',
    'rite_dap_bin',
    'accounts',
    'calendars',
    'calendar_dir',
    'apps_dir',
    'mail',
    'mail_dir',
    'literature'
];

/** The keys under `literature:`, with the field of LiteratureKeys each sets. */
export const LITERATURE_KEYS = [
    ['wos_key', 'wosKey'],
    ['scopus_key', 'scopusKey'],
    ['scopus_insttoken', 'scopusInsttoken'],
    ['openalex_key', 'openalexKey'],
    ['semantic_scholar_key', 'semanticScholarKey'],
    ['ncbi_key', 'ncbiKey'],
    ['mailto', 'mailto']
] as const;

/** The defaults: the port is 8790, and Claude and the rite debug adapter are resolved on PATH. */
export function localDefaults(): LocalConfig {
    return {
        port: DEFAULT_PORT,
        claudeBin: 'claude',
        riteDapBin: 'rite_dap',
        accounts: [
            { tool: 'claude', dir: join(homedir(), '.claude'), label: 'claude' },
            { tool: 'codex', dir: join(homedir(), '.codex'), label: 'codex' }
        ],
        calendars: [],
        mail: []
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

/** The keys of the file that name a program or a host, with the field each sets. */
export const PROGRAM_KEYS = [
    ['hpc_host', 'hpcHost'],
    ['claude_bin', 'claudeBin'],
    ['open_bin', 'openBin'],
    ['rite_dap_bin', 'riteDapBin']
] as const;

/** The keys of the file that name a folder or file of this machine, with the field each sets. */
export const STATE_PATHS = [
    ['sessions_cache', 'sessionsCache'],
    ['sessions_overrides', 'sessionsOverrides'],
    ['bookmarks', 'bookmarks'],
    ['changes', 'changes'],
    ['history', 'history'],
    ['approvals', 'approvals'],
    ['lsp', 'lsp'],
    ['schedules', 'schedules'],
    ['schedule_record', 'scheduleRecord'],
    ['calendar_dir', 'calendarDir'],
    ['apps_dir', 'appsDir'],
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
    // Empty is the default folder and no problem; whether the label is a Claude row's is read
    // after every hub's accounts are joined (data/sources/config/machine.ts).
    const account = record.commit_message_account;
    if (account !== undefined) {
        if (typeof account !== 'string') problems.push(wrong('commit_message_account', 'a label'));
        else if (account !== '') config.commitMessageAccount = account;
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
