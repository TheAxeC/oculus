// Layer 2, server. The machine's values for the open workspace, as the context carries them: the
// `.oculus/local.yml` of each hub joined by data/sources/config/machine.ts and held until the next
// read. A read happens when a file it is made from changed (the watch on the hubs' files), when the
// workspace moved, or when a route that wrote a file asks for it; a request takes the held values
// and reads no disk. The port and the paths of the machine's own state (the change log, the
// history, the approvals, the session cache and overrides, the schedule record) are read at start
// only: a switch to a workspace whose primary sets another value keeps the running one, and the key
// stays held, and named by `heldBack()`, until a read agrees with the running value again.

import { isDeepStrictEqual } from 'node:util';
import type { LocalConfig } from '../../../../data/sources/config.ts';
import type { MachineRead } from '../../../../data/sources/config/machine.ts';
import type { OpenWorkspace } from '../../../files/workspace/open.ts';

/** The keys the process is started with and keeps until a restart, with the key of the file. */
const STARTED_KEYS = {
    port: 'port',
    changes: 'changes',
    history: 'history',
    approvals: 'approvals',
    sessionsCache: 'sessions_cache',
    sessionsOverrides: 'sessions_overrides',
    scheduleRecord: 'schedule_record'
} as const satisfies Partial<Record<keyof LocalConfig, string>>;

type StartedKey = keyof typeof STARTED_KEYS;

/** A key a switch did not apply: the field of the values and the key of the file. */
type HeldBack = { key: StartedKey; file: string };

/** What the context reads the values with. */
export type MachineDeps = {
    read: (hubs: OpenWorkspace['hubs'], primary: string | null, warn: boolean) => MachineRead;
    open: () => OpenWorkspace;
    /** The values in force, which the context updates in place. */
    local: LocalConfig;
    /** The read made at start, which is the first held one. */
    initial: MachineRead;
};

/** The machine's values as the context holds them. */
export type Machine = {
    /** The held read, the held keys at their running values. */
    held: () => MachineRead;
    /** The held values. */
    values: () => LocalConfig;
    /** Read the open workspace's files now and hold the read. */
    refresh: (warn: boolean) => MachineRead;
    /**
     * Hold every started key of `next` that differs from the running value, for a read made on a
     * switch of workspace: the keys newly held back.
     */
    holdOnSwitch: (next: LocalConfig) => HeldBack[];
    /** Every key held at its running value now, which a restart would change. */
    heldBack: () => HeldBack[];
};

/** Make the holder over the context's values. */
export function createMachine(deps: MachineDeps): Machine {
    const held = new Set<StartedKey>();
    const withHeld = (config: LocalConfig): LocalConfig => {
        const out: LocalConfig = { ...config };
        for (const key of [...held]) {
            if (isDeepStrictEqual(out[key], deps.local[key])) {
                held.delete(key);
                continue;
            }
            if (deps.local[key] === undefined) Reflect.deleteProperty(out, key);
            else Reflect.set(out, key, deps.local[key]);
        }
        return out;
    };
    let current: MachineRead = deps.initial;
    const refresh = (warn: boolean): MachineRead => {
        const open = deps.open();
        const fresh = deps.read(open.hubs, open.primary, warn);
        current = { ...fresh, config: withHeld(fresh.config) };
        return current;
    };
    return {
        held: () => current,
        values: () => ({ ...current.config }),
        refresh,
        holdOnSwitch(next) {
            const back: HeldBack[] = [];
            for (const key of Object.keys(STARTED_KEYS) as StartedKey[]) {
                if (isDeepStrictEqual(next[key], deps.local[key])) continue;
                if (held.has(key)) continue;
                held.add(key);
                back.push({ key, file: STARTED_KEYS[key] });
            }
            return back;
        },
        heldBack: () => [...held].map((key) => ({ key, file: STARTED_KEYS[key] }))
    };
}
