// Layer 1, data. This machine's own values for the open workspace: the `.oculus/local.yml` of each
// hub the workspace lists, read by data/sources/config/local.ts one file at a time and joined here.
// The three account lists (`accounts`, `calendars`, `mail`) are the files' rows in folder order,
// each row marked with the hub whose file holds it, and a label two files both give is a problem
// naming the later row, which is left out. Every other key is one value per oculus, read from the
// primary hub's file alone: a hub that is not the primary and sets such a key is a problem naming
// the hub and the key, and its value is not used. A workspace with no primary holds the defaults.

import type {
    CalendarAccountConfig,
    MailAccountConfig,
    UsageAccountConfig
} from '../../model/index.ts';
import {
    literatureSet,
    localDefaults,
    localFile,
    readLocal,
    usageAccountLabel,
    type LocalConfig,
    type LocalProblem
} from './local.ts';

/** A hub of the workspace as the machine's values need it: its name and its folder. */
export type MachineHub = { name: string; dir: string };

/** One problem of the machine's files, with the file it is about. */
export type MachineProblem = { file: string; problem: LocalProblem };

/**
 * What a read of the workspace's `local.yml` files answers: the joined values, every problem in
 * folder order, and the first problem of a file that did not read at all, or null when each did.
 */
export type MachineRead = {
    config: LocalConfig;
    problems: MachineProblem[];
    unread: MachineProblem | null;
    /**
     * The names of the keys the primary hub's file sets (`literature.<key>` for a key under
     * `literature:`), none with no primary. The values are in `config`.
     */
    set: string[];
    /**
     * For each of the three joined lists, the names of the hubs whose file sets the key, in the
     * workspace's folder order, whether or not a row of the file is in force. A list no file sets
     * has no entry.
     */
    lists: Record<string, string[]>;
};

/** The keys that are rows of a list joined over every hub's file. */
const JOINED = ['accounts', 'calendars', 'mail'];

/** The rows of one list joined over the files, a row whose label an earlier file gave left out. */
function joinRows<T extends { label: string; hub?: string }>(
    list: string,
    rows: { file: string; rows: T[] }[],
    reduced: (row: T) => string | null,
    problems: MachineProblem[]
): T[] {
    const seen = new Set<string>();
    const joined: T[] = [];
    for (const one of rows) {
        for (const row of one.rows) {
            const key = reduced(row);
            if (key !== null && seen.has(key)) {
                problems.push({
                    file: one.file,
                    problem: {
                        key: list,
                        kind: 'repeat',
                        sentence: `${list} repeats the label of an earlier hub's row`
                    }
                });
                continue;
            }
            if (key !== null) seen.add(key);
            joined.push(row);
        }
    }
    return joined;
}

/**
 * Read the `.oculus/local.yml` of every hub in `hubs` (in the workspace's folder order) and join
 * them. `primary` is the name of the hub whose file gives the one-per-oculus keys, or null. Nothing
 * throws, and an unknown key is warned of on stderr when `warn` is true.
 */
export function readMachine(
    hubs: readonly MachineHub[],
    primary: string | null,
    warn = false
): MachineRead {
    const reads = hubs.map((hub) => ({
        hub,
        file: localFile(hub.dir),
        read: readLocal(hub.dir, warn, hub.name)
    }));
    const own = reads.find((one) => primary !== null && one.hub.name === primary);
    const config: LocalConfig = { ...(own?.read.config ?? localDefaults()) };
    const problems: MachineProblem[] = reads.flatMap((one) =>
        one.read.problems.map((problem) => ({ file: one.file, problem }))
    );
    for (const one of reads) {
        if (one === own) continue;
        for (const key of one.read.set) {
            if (JOINED.includes(key)) continue;
            problems.push({
                file: one.file,
                problem: {
                    key,
                    kind: 'other-hub',
                    hub: one.hub.name,
                    sentence: `${key} is read from the primary hub's file only`
                }
            });
        }
    }
    const setting = (key: string) => reads.filter((one) => one.read.set.includes(key));
    const accounts = setting('accounts');
    const calendars = setting('calendars');
    const mail = setting('mail');
    const defaults = localDefaults();
    config.accounts =
        accounts.length === 0
            ? defaults.accounts
            : joinRows<UsageAccountConfig>(
                  'accounts',
                  accounts.map((one) => ({ file: one.file, rows: one.read.config.accounts })),
                  (row) => (row.tool === 'claude' ? usageAccountLabel(row.label) : null),
                  problems
              );
    config.calendars = joinRows<CalendarAccountConfig>(
        'calendars',
        calendars.map((one) => ({ file: one.file, rows: one.read.config.calendars })),
        (row) => `${row.provider}-${row.label}`,
        problems
    );
    config.mail = joinRows<MailAccountConfig>(
        'mail',
        mail.map((one) => ({ file: one.file, rows: one.read.config.mail })),
        (row) => `${row.provider}-${row.label}`,
        problems
    );
    const lists: Record<string, string[]> = {};
    for (const key of JOINED) {
        const names = setting(key).map((one) => one.hub.name);
        if (names.length > 0) lists[key] = names;
    }
    const failed = reads.find((one) => one.read.unread);
    const unread =
        failed === undefined ? null : { file: failed.file, problem: failed.read.problems[0] };
    const set = own === undefined ? [] : [...own.read.set, ...literatureSet(own.read.config)];
    return { config, problems, unread, set, lists };
}

/** The joined values of the workspace's files, with the default of each key that is wrong. */
export function loadMachine(hubs: readonly MachineHub[], primary: string | null): LocalConfig {
    return readMachine(hubs, primary, true).config;
}
