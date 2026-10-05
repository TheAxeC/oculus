// Layer 1, data. This machine's own values: local.yml in the config folder, read by readLocal alone
// and never merged into the shared map, so a machine's paths, port and accounts stay its own. Every
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
import { configDir } from './folder.ts';

/** A port: a whole number. */
const portShape = z.number().refine(Number.isInteger);

export type LocalConfig = {
    /** Absolute path of the research hub whose YAML the portfolio is built from. */
    hub: string;
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
     * Where the file browser's saved workspaces live, `workspaces` in the file. Absent unless the
     * machine sets it, and the file browser then uses ~/.oculus/workspaces.json.
     */
    workspaces?: string;
    /**
     * Where the reader's own bookmarks live, `bookmarks` in the file. Absent unless the machine
     * sets it, and the file browser then uses ~/.oculus/bookmarks.yml.
     */
    bookmarks?: string;
    /**
     * Where the scratch notes live, `notes` in the file. Absent unless the machine sets it, and the
     * file browser then uses ~/.oculus/notes.
     */
    notes?: string;
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
     * Absolute or PATH-resolved Claude CLI the update tasks and the chat terminal are started with.
     */
    claudeBin: string;
    /**
     * The program an `https` address is handed to, `open_bin` in the file: a provider's consent
     * page, an event or a thread at its provider. Absent unless the machine sets it, and the server
     * then hands the address to macOS's /usr/bin/open.
     */
    openBin?: string;
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
};

/** The default development port; the reserved port 8787 is never used. */
export const DEFAULT_PORT = 8790;

/**
 * The name of the machine-local file inside the config directory, which loadConfig never merges.
 */
export const LOCAL_NAME = 'local.yml';

/** The keys local.yml may carry, which readLocal reads and the options catalog describes. */
export const LOCAL_KEYS = [
    'hub',
    'port',
    'hpc_host',
    'sessions_cache',
    'sessions_overrides',
    'workspaces',
    'bookmarks',
    'notes',
    'changes',
    'history',
    'approvals',
    'claude_bin',
    'open_bin',
    'accounts',
    'calendars',
    'calendar_dir',
    'mail',
    'mail_dir'
];

/**
 * The defaults: the hub is two directories above tools/oculus, the port is 8790, and Claude is
 * resolved on PATH.
 */
export function localDefaults(engine: string): LocalConfig {
    return {
        hub: resolve(engine, '..', '..'),
        port: DEFAULT_PORT,
        claudeBin: 'claude',
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
 * one stands, and any other is resolved against `base`, the engine directory.
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
 * Which file readLocal reads: local.yml of the engine's config directory, which is the whole of
 * what the machine's own configuration is. A relative path inside it resolves against the engine
 * rather than the file's own folder, so a relative `hub` is read from the engine directory.
 */
export function localFile(engine: string): string {
    return join(configDir(engine), LOCAL_NAME);
}

/** The keys of the file that name a folder or file of this machine, with the field each sets. */
const STATE_PATHS = [
    ['sessions_cache', 'sessionsCache'],
    ['sessions_overrides', 'sessionsOverrides'],
    ['workspaces', 'workspaces'],
    ['bookmarks', 'bookmarks'],
    ['notes', 'notes'],
    ['changes', 'changes'],
    ['history', 'history'],
    ['approvals', 'approvals'],
    ['calendar_dir', 'calendarDir'],
    ['mail_dir', 'mailDir']
] as const;

/** Every default, and one problem saying the file did not read. */
function unreadFile(engine: string, problem: LocalProblem): LocalRead {
    return { config: localDefaults(engine), problems: [problem], unknown: [], unread: true };
}

/**
 * Read one machine-local file's text over the defaults. Every key is read on its own: a scalar
 * whose value is wrong keeps its default (or stays absent where the key is optional), a list that
 * is not a list keeps its default list, and a row of a list that fails is left out while the rows
 * around it are read, so a list whose every row fails is the empty list. A text that does not
 * parse, or is not a map, is every default and one problem with the key `''`. The reader and the
 * check the source endpoint makes before it writes that file run this one function, so a body the
 * check accepts is a body the next read takes whole.
 */
export function readLocalText(text: string, engine: string): LocalRead {
    let parsed: unknown;
    try {
        parsed = parse(text);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return unreadFile(engine, {
            key: '',
            kind: 'unparsed',
            sentence: message.split('\n')[0]
        });
    }
    const record = readAs(mapShape, parsed ?? {});
    if (record === null) {
        return unreadFile(engine, {
            key: '',
            kind: 'not-a-map',
            sentence: 'expected a map of keys'
        });
    }

    const config = localDefaults(engine);
    const problems: LocalProblem[] = [];
    const unknown = Object.keys(record).filter((key) => !LOCAL_KEYS.includes(key));

    if (record.hub !== undefined) {
        const hub = filledAt(record, 'hub');
        if (hub === undefined) problems.push(wrong('hub', 'a path'));
        else config.hub = isAbsolute(hub) ? hub : resolve(engine, hub);
    }
    if (record.port !== undefined) {
        const port = readAs(portShape, record.port);
        if (port === null) problems.push(wrong('port', 'an integer'));
        else config.port = port;
    }
    for (const [key, field] of [
        ['hpc_host', 'hpcHost'],
        ['claude_bin', 'claudeBin'],
        ['open_bin', 'openBin']
    ] as const) {
        if (record[key] === undefined) continue;
        const value = filledAt(record, key);
        if (value === undefined) problems.push(wrong(key, 'a non-empty string'));
        else config[field] = value;
    }
    if (record.accounts !== undefined) {
        config.accounts = usageAccounts(record.accounts, engine, problems) ?? config.accounts;
    }
    if (record.calendars !== undefined) {
        config.calendars =
            connectAccounts(
                record.calendars,
                'calendars',
                { accepts: isCalendarProvider, named: 'google, microsoft or ics' },
                problems
            ) ?? config.calendars;
    }
    if (record.mail !== undefined) {
        config.mail =
            connectAccounts(
                record.mail,
                'mail',
                { accepts: isProvider, named: 'google or microsoft' },
                problems
            ) ?? config.mail;
    }
    // The machine-local state paths are absent unless the machine names them, so a config that says
    // nothing about them leaves the defaults to the modules that own them.
    for (const [key, field] of STATE_PATHS) {
        if (record[key] === undefined) continue;
        const value = filledAt(record, key);
        if (value === undefined) problems.push(wrong(key, 'a path'));
        else config[field] = localPath(value, engine);
    }
    return { config, problems, unknown, unread: false };
}

/**
 * Read local.yml of the engine's config directory, and never throw. A missing file is every default
 * and no problem, since every key has one. A file that cannot be read (a folder at its path, no
 * permission) is every default and one problem with the error's code. An unknown key is warned of
 * on stderr when `warn` is true, and ignored.
 */
export function readLocal(engine: string, warn = false): LocalRead {
    const file = localFile(engine);
    let text: string;
    try {
        text = readFileSync(file, 'utf8');
    } catch (error) {
        const code = (error as NodeJS.ErrnoException).code ?? 'unknown';
        if (code === 'ENOENT' || code === 'ENOTDIR') {
            return { config: localDefaults(engine), problems: [], unknown: [], unread: false };
        }
        return unreadFile(engine, {
            key: '',
            kind: 'unreadable',
            code,
            sentence: `could not be read (${code})`
        });
    }
    const read = readLocalText(text, engine);
    if (warn && read.unknown.length > 0) {
        console.warn(`${file}: ignoring unknown key(s) ${read.unknown.join(', ')}`);
    }
    return read;
}

/**
 * The machine's own values, with the default of each key the file gets wrong. An unknown key is
 * warned of at each call. It never throws, so a reader that runs on a request is served whatever
 * the file holds.
 */
export function loadLocal(engine: string): LocalConfig {
    return readLocal(engine, true).config;
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
 * endpoint checks a save of the machine's own file with it, so a body that would cost a key its
 * value is refused with that sentence rather than written. A file name makes the sentence the
 * reader's own ("local.yml: port must be an integer"); a parse error is given by its first line.
 */
export function checkLocal(text: string, file: string = LOCAL_NAME): string | null {
    const first = readLocalText(text, dirname(file)).problems.at(0);
    return first === undefined ? null : localSentence(first, file);
}
