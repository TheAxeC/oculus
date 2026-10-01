// Layer 1, data. This machine's own values: local.yml in the config folder, read by loadLocal alone
// and never merged into the shared map, so a machine's paths, port and accounts stay its own. Every
// key has a default, and a value the file gets wrong is refused with the reason.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { parse } from 'yaml';
import type {
    AccountProvider,
    CalendarAccountConfig,
    MailAccountConfig,
    UsageAccountConfig
} from '../../model/index.ts';
import { isAccountLabel, isCalendarProvider, isProvider } from '../../accounts/connect.ts';
import { configDir } from './folder.ts';

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

/** The keys local.yml may carry, which loadLocal reads and the options catalog describes. */
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

function accountDir(value: string, base: string): string {
    if (value === '~') return homedir();
    if (value.startsWith('~/')) return join(homedir(), value.slice(2));
    return isAbsolute(value) ? value : resolve(base, value);
}

/** The label fragment shared by config validation and hidden usage session names. */
export function usageAccountLabel(label: string): string {
    return label.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
}

function usageAccounts(value: unknown, file: string, base: string): UsageAccountConfig[] {
    if (!Array.isArray(value)) throw new Error(`${file}: accounts must be a list`);
    const claudeLabels = new Set<string>();
    return value.map((item, index) => {
        if (typeof item !== 'object' || item === null || Array.isArray(item)) {
            throw new Error(`${file}: accounts[${index}] must be a map`);
        }
        const row = item as Record<string, unknown>;
        const tool = row.tool;
        if (tool !== 'claude' && tool !== 'codex') {
            throw new Error(`${file}: accounts[${index}].tool must be claude or codex`);
        }
        if (typeof row.dir !== 'string' || row.dir.length === 0) {
            throw new Error(`${file}: accounts[${index}].dir must be a path`);
        }
        if (typeof row.label !== 'string' || row.label.length === 0) {
            throw new Error(`${file}: accounts[${index}].label must be words`);
        }
        if (tool === 'claude') {
            const reduced = usageAccountLabel(row.label);
            if (claudeLabels.has(reduced)) {
                throw new Error(
                    `${file}: accounts[${index}].label duplicates a Claude label or reduced label: ${reduced}`
                );
            }
            claudeLabels.add(reduced);
        }
        return { tool: tool, dir: accountDir(row.dir, base), label: row.label };
    });
}

/**
 * The rows of `calendars:` or `mail:`: one provider the list takes and one label each, the label
 * unique per provider inside its own list. `calendars:` takes the two providers that sign in and a
 * published link, `ics`; `mail:` takes the two alone. A bad row throws the sentence naming the
 * file, the list, the row and the providers the list takes, as the accounts above do, so a machine
 * whose own file is wrong is told at the start rather than served an empty view.
 */
function connectAccounts<P extends AccountProvider>(
    value: unknown,
    file: string,
    list: string,
    takes: { accepts: (value: unknown) => value is P; named: string }
): { provider: P; label: string }[] {
    if (!Array.isArray(value)) throw new Error(`${file}: ${list} must be a list`);
    const seen = new Set<string>();
    return value.map((item, index) => {
        if (typeof item !== 'object' || item === null || Array.isArray(item)) {
            throw new Error(`${file}: ${list}[${index}] must be a map`);
        }
        const row = item as Record<string, unknown>;
        const provider = row.provider;
        if (!takes.accepts(provider)) {
            throw new Error(`${file}: ${list}[${index}].provider must be ${takes.named}`);
        }
        if (!isAccountLabel(row.label)) {
            throw new Error(
                `${file}: ${list}[${index}].label must be lowercase letters, digits and dashes`
            );
        }
        const key = `${provider}-${row.label}`;
        if (seen.has(key)) {
            throw new Error(
                `${file}: ${list}[${index}].label repeats ${row.label} for ${provider}`
            );
        }
        seen.add(key);
        return { provider, label: row.label };
    });
}

/**
 * Which file loadLocal reads: local.yml of the engine's config directory, which is the whole of
 * what the machine's own configuration is. A relative path inside it resolves against the engine
 * rather than the file's own folder, so a relative `hub` is read from the engine directory.
 */
export function localFile(engine: string): string {
    return join(configDir(engine), LOCAL_NAME);
}

/**
 * Apply one machine-local file's text onto the defaults, throwing the sentence a caller shows. The
 * reader and the check the source endpoint makes before it writes that file run this one function,
 * so a body the check accepts is a body the next read accepts.
 */
function applyLocal(
    text: string,
    file: string,
    base: string,
    config: LocalConfig,
    onUnknown?: (keys: string[]) => void
): LocalConfig {
    const raw: unknown = parse(text) ?? {};
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        throw new Error(`${file}: expected a map of keys`);
    }
    const record = raw as Record<string, unknown>;

    const unknown = Object.keys(record).filter((key) => !LOCAL_KEYS.includes(key));
    if (unknown.length > 0) onUnknown?.(unknown);

    if (record.hub !== undefined) {
        if (typeof record.hub !== 'string' || record.hub.length === 0) {
            throw new Error(`${file}: hub must be a path`);
        }
        config.hub = isAbsolute(record.hub) ? record.hub : resolve(base, record.hub);
    }
    if (record.port !== undefined) {
        if (!Number.isInteger(record.port)) throw new Error(`${file}: port must be an integer`);
        config.port = record.port as number;
    }
    if (record.hpc_host !== undefined) {
        if (typeof record.hpc_host !== 'string' || record.hpc_host.length === 0) {
            throw new Error(`${file}: hpc_host must be a non-empty string`);
        }
        config.hpcHost = record.hpc_host;
    }
    if (record.claude_bin !== undefined) {
        if (typeof record.claude_bin !== 'string' || record.claude_bin.length === 0) {
            throw new Error(`${file}: claude_bin must be a non-empty string`);
        }
        config.claudeBin = record.claude_bin;
    }
    if (record.open_bin !== undefined) {
        if (typeof record.open_bin !== 'string' || record.open_bin.length === 0) {
            throw new Error(`${file}: open_bin must be a non-empty string`);
        }
        config.openBin = record.open_bin;
    }
    if (record.accounts !== undefined) config.accounts = usageAccounts(record.accounts, file, base);
    if (record.calendars !== undefined) {
        config.calendars = connectAccounts(record.calendars, file, 'calendars', {
            accepts: isCalendarProvider,
            named: 'google, microsoft or ics'
        });
    }
    if (record.mail !== undefined) {
        config.mail = connectAccounts(record.mail, file, 'mail', {
            accepts: isProvider,
            named: 'google or microsoft'
        });
    }
    // The machine-local state paths are absent unless the machine names them, so a config that says
    // nothing about them leaves the defaults to the modules that own them.
    for (const [key, field] of [
        ['sessions_cache', 'sessionsCache'],
        ['sessions_overrides', 'sessionsOverrides'],
        ['workspaces', 'workspaces'],
        ['bookmarks', 'bookmarks'],
        ['notes', 'notes'],
        ['changes', 'changes'],
        ['calendar_dir', 'calendarDir'],
        ['mail_dir', 'mailDir']
    ] as const) {
        if (record[key] === undefined) continue;
        if (typeof record[key] !== 'string' || record[key] === '') {
            throw new Error(`${file}: ${key} must be a path`);
        }
        const value = record[key];
        config[field] = isAbsolute(value) ? value : resolve(base, value);
    }
    return config;
}

/**
 * Read local.yml of the engine's config directory. A missing file means the defaults, since every
 * key has one. An unknown key is reported on stderr and ignored. A key of the wrong type is an
 * error naming the file and the key, which is what a start reads: a machine whose own file is
 * malformed is told at once rather than served wrongly.
 */
export function loadLocal(engine: string): LocalConfig {
    const file = localFile(engine);
    const config = localDefaults(engine);
    if (!existsSync(file)) return config;
    return applyLocal(readFileSync(file, 'utf8'), file, engine, config, (keys) =>
        console.warn(`${file}: ignoring unknown key(s) ${keys.join(', ')}`)
    );
}

/**
 * Sentences already printed by loadLocalOrDefaults, so a bad file is named once and not per call.
 */
const reportedLocal = new Set<string>();

/**
 * The machine's own values for a reader that runs on a request, with the defaults in place of a
 * file that does not read. The file is the one of the config folder whose bad content would
 * otherwise be fatal: a request would answer 500 rather than a page, and the request that saves the
 * file back would be one of them. The sentence is printed once and the start keeps throwing, so a
 * malformed file is still seen and is still repairable from the source tab.
 */
export function loadLocalOrDefaults(engine: string): LocalConfig {
    try {
        return loadLocal(engine);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!reportedLocal.has(message)) {
            reportedLocal.add(message);
            console.error(`the machine's own configuration is not read: ${message}`);
        }
        return localDefaults(engine);
    }
}

/**
 * The sentence loadLocal would throw over this text, or null when it would read it. The source
 * endpoint checks a save of the machine's own file with it, so a body that would stop the next
 * start is refused with that sentence rather than written. A file name makes the sentence the
 * reader's own ("local.yml: port must be an integer"); a parse error is given by its first line.
 */
export function checkLocal(text: string, file: string = LOCAL_NAME): string | null {
    try {
        applyLocal(text, file, dirname(file), localDefaults(dirname(file)));
        return null;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return message.split('\n')[0];
    }
}
