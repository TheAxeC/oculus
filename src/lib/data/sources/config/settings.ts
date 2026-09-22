// Layer 1, data. The typed readers of single settings out of the merged map: the cluster, the
// calendar, the search, the open list, the mail, the change log's length and the usage tiers. Each
// reads its block and falls back to the default the config file carries.

import { programApps, type ProgramApps } from '../../helpers/opens-in-program.ts';

/** The Live HPC settings of config/behavior.yml, every key required. */
export type SlurmSettings = {
    host: string;
    days: number;
    pollMin: number;
    quotaMin: number;
    prewarm: boolean;
};

/** Read `slurm:` with its five keys, or throw naming the key that is missing or mistyped. */
export function slurmSettings(config: Record<string, unknown>): SlurmSettings {
    const held = config.slurm;
    if (typeof held !== 'object' || held === null || Array.isArray(held)) {
        throw new Error('config/behavior.yml: slurm must be a map');
    }
    const slurm = held as Record<string, unknown>;
    const number = (key: string): number => {
        const value = slurm[key];
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            throw new Error(`config/behavior.yml: slurm.${key} must be a number`);
        }
        return value;
    };
    if (typeof slurm.host !== 'string' || slurm.host === '') {
        throw new Error('config/behavior.yml: slurm.host must be a non-empty string');
    }
    if (typeof slurm.prewarm !== 'boolean') {
        throw new Error('config/behavior.yml: slurm.prewarm must be true or false');
    }
    return {
        host: slurm.host,
        days: number('days'),
        pollMin: number('poll_min'),
        quotaMin: number('quota_min'),
        prewarm: slurm.prewarm
    };
}

/** The calendar connector's settings of config/behavior.yml, every key required. */
export type CalendarSettings = {
    pollMin: number;
    /** Days before now the agenda window opens. */
    daysBack: number;
    /** Days after now the agenda window closes. */
    daysAhead: number;
};

/** Read `calendar:` with its three keys, or throw naming the key that is missing or mistyped. */
export function calendarSettings(config: Record<string, unknown>): CalendarSettings {
    const held = config.calendar;
    if (typeof held !== 'object' || held === null || Array.isArray(held)) {
        throw new Error('config/behavior.yml: calendar must be a map');
    }
    const calendar = held as Record<string, unknown>;
    const number = (key: string): number => {
        const value = calendar[key];
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            throw new Error(`config/behavior.yml: calendar.${key} must be a number`);
        }
        return value;
    };
    return {
        pollMin: number('poll_min'),
        daysBack: number('days_back'),
        daysAhead: number('days_ahead')
    };
}

/** The search settings of config/behavior.yml, every key required. */
export type SearchSettings = {
    /** How many hits one answer carries before it says it was cut. */
    maxHits: number;
    /** How long one root's search is given, in seconds. */
    timeoutS: number;
};

/** Read `search:` with its two keys, or throw naming the key that is missing or mistyped. */
export function searchSettings(config: Record<string, unknown>): SearchSettings {
    const held = config.search;
    if (typeof held !== 'object' || held === null || Array.isArray(held)) {
        throw new Error('config/behavior.yml: search must be a map');
    }
    const search = held as Record<string, unknown>;
    const number = (key: string): number => {
        const value = search[key];
        if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
            throw new Error(`config/behavior.yml: search.${key} must be a number above zero`);
        }
        return value;
    };
    return { maxHits: number('max_hits'), timeoutS: number('timeout_s') };
}

/** The open action's settings of config/behavior.yml, every key required. */
export type OpenSettings = {
    /** Each extension that may open, lowercased with its dot, to the bundle id it opens in. */
    programApps: ProgramApps;
};

/** Read `open:` with its one key, or throw naming the key that is missing or mistyped. */
export function openSettings(config: Record<string, unknown>): OpenSettings {
    const apps = programApps(config);
    if (apps === null) {
        throw new Error(
            'config/behavior.yml: open.program_ext must map extensions, each with its dot, to bundle ids'
        );
    }
    return { programApps: apps };
}

/** The mail connector's settings of config/behavior.yml, every key required. */
export type MailSettings = {
    pollMin: number;
    /** How many threads each of the plate's three signals is read at most. */
    perSignal: number;
};

/** Read `mail:` with its two keys, or throw naming the key that is missing or mistyped. */
export function mailSettings(config: Record<string, unknown>): MailSettings {
    const held = config.mail;
    if (typeof held !== 'object' || held === null || Array.isArray(held)) {
        throw new Error('config/behavior.yml: mail must be a map');
    }
    const mail = held as Record<string, unknown>;
    const number = (key: string): number => {
        const value = mail[key];
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            throw new Error(`config/behavior.yml: mail.${key} must be a number`);
        }
        return value;
    };
    return { pollMin: number('poll_min'), perSignal: number('per_signal') };
}

/** Read `changes.keep`, how many change-log lines are kept, or throw naming what is wrong. */
export function changesKeep(config: Record<string, unknown>): number {
    const held = config.changes;
    if (typeof held !== 'object' || held === null || Array.isArray(held)) {
        throw new Error('config/behavior.yml: changes must be a map');
    }
    const keep = (held as Record<string, unknown>).keep;
    if (typeof keep !== 'number' || !Number.isInteger(keep) || keep <= 0) {
        throw new Error('config/behavior.yml: changes.keep must be a whole number above zero');
    }
    return keep;
}

/** Read `usage_tiers:`, a map of plan id to label, or throw. */
export function usageTiers(config: Record<string, unknown>): Record<string, string> {
    const held = config.usage_tiers;
    if (typeof held !== 'object' || held === null || Array.isArray(held)) {
        throw new Error('config/behavior.yml: usage_tiers must be a map');
    }
    for (const [key, value] of Object.entries(held)) {
        if (typeof value !== 'string') {
            throw new Error(`config/behavior.yml: usage_tiers.${key} must be a string`);
        }
    }
    return held as Record<string, string>;
}
