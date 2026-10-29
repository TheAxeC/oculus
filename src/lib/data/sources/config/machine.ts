// Layer 1, data. This machine's own values for the open workspace: the `.oculus/local.yml` of each
// hub the workspace lists, read by data/sources/config/local.ts one file at a time and joined here.
// The three account lists (`accounts`, `calendars`, `mail`) are the files' rows in folder order,
// each row marked with the hub whose file holds it, and a label two files both give is a problem
// naming the later row, which is left out. The cluster accounts (`clusters`) are joined the same
// way by the cluster they are for, the primary hub's rows first, so the primary's row of a cluster
// is the one used and another hub's row of it is a problem. Every other key is one value per
// oculus, read from the primary hub's file alone: a hub that is not the primary and sets such a key
// is a problem naming the hub and the key, and its value is not used. A workspace with no primary
// holds the defaults. `commit_message_account` is read from the primary's file and checked against
// the joined accounts: a label no `claude` row holds, compared reduced, is a problem naming the
// key, and no account is used.

import { JOINED_LOCAL_KEYS } from '../../helpers/hub-names.ts';
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
    type ClusterAccount,
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
     * For each of the four joined lists, the names of the hubs whose file sets the key, in the
     * workspace's folder order, whether or not a row of the file is in force. A list no file sets
     * has no entry.
     */
    lists: Record<string, string[]>;
};

/** The keys that are rows of a list joined over every hub's file. */
const JOINED = JOINED_LOCAL_KEYS;

/** What the `clusters:` rows of a hub must be, in the form of local.ts's `wrong` problems. */
const CLUSTERS_ONCE_WORDS = 'rows of clusters that no earlier hub has a row for';

/**
 * The rows of one list joined over the files, a row whose label (for `clusters`, whose cluster) an
 * earlier file gave left out.
 */
function joinRows<T extends { hub?: string }>(
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
                    problem:
                        list === 'clusters'
                            ? {
                                  key: list,
                                  kind: 'row',
                                  words: CLUSTERS_ONCE_WORDS,
                                  sentence: `${list} must be ${CLUSTERS_ONCE_WORDS}`
                              }
                            : {
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
 * Clear `commitMessageAccount` when no `claude` row of the joined accounts holds its label,
 * compared reduced, with a problem naming the key against the primary's file.
 */
function checkMessageAccount(config: LocalConfig, file: string, problems: MachineProblem[]): void {
    const label = config.commitMessageAccount;
    if (label === undefined) return;
    const reduced = usageAccountLabel(label);
    const held = config.accounts.some(
        (row) => row.tool === 'claude' && usageAccountLabel(row.label) === reduced
    );
    if (held) return;
    delete config.commitMessageAccount;
    problems.push({
        file,
        problem: {
            key: 'commit_message_account',
            kind: 'label',
            sentence: 'commit_message_account is not the label of a Claude row of accounts:'
        }
    });
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
    const clusters = setting('clusters');
    config.clusters = joinRows<ClusterAccount>(
        'clusters',
        [...clusters.filter((one) => one === own), ...clusters.filter((one) => one !== own)].map(
            (one) => ({ file: one.file, rows: one.read.config.clusters })
        ),
        (row) => row.resource,
        problems
    );
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
    if (own !== undefined) checkMessageAccount(config, own.file, problems);
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

/**
 * A problem of the primary hub's file `file` for each `downloads` row whose service is one of
 * `basic`, the services a reader row signs in to with a user, and that holds no user. The reader
 * takes no such row (server/core/reader/request.ts), so the source is off as with no row.
 */
export function userProblems(
    read: MachineRead,
    file: string,
    basic: ReadonlySet<string>
): MachineProblem[] {
    return read.config.downloads
        .filter((row) => basic.has(row.service) && row.user === undefined)
        .map((row) => ({
            file,
            problem: {
                key: 'downloads',
                kind: 'user',
                service: row.service,
                sentence: `the downloads row of ${row.service} has no user`
            }
        }));
}

/** The joined values of the workspace's files, with the default of each key that is wrong. */
export function loadMachine(hubs: readonly MachineHub[], primary: string | null): LocalConfig {
    return readMachine(hubs, primary, true).config;
}
