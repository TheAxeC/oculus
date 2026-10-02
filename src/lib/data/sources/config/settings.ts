// Layer 1, data. The typed readers of single settings out of the merged map: the cluster, the
// calendar, the search, the open list, the mail, the change log's length and the usage tiers. Each
// reads its block and falls back to the default the config file carries.

import { z } from 'zod';
import { programApps, type ProgramApps } from '../../helpers/files/opens-in-program.ts';
import { mapShape, readAs, unchangedAs, valuesOfShape } from '../../shapes/shapes.ts';

/** A text, empty or not. */
const labelShape = z.string();

/** The longest period, in minutes, a timer can wait: 2^31-1 ms, past which it fires at once. */
const MAX_CADENCE_MIN = 35791;

/** The longest day window a setting can name. */
const MAX_DAYS = 3650;

/** The most threads a mail signal can ask a provider for. */
const MAX_PER_SIGNAL = 500;

/** A number of minutes a timer can wait, from 1 to 35791. */
export const cadenceShape = z.number().min(1).max(MAX_CADENCE_MIN);

/** A whole number of days, from 0 to 3650. */
const dayWindowShape = z.number().refine(Number.isInteger).min(0).max(MAX_DAYS);

/** A whole number of threads, from 1 to 500. */
const perSignalShape = z.number().refine(Number.isInteger).min(1).max(MAX_PER_SIGNAL);

/** The words a cadence is refused with. */
export const CADENCE_WORDS = `a number from 1 to ${MAX_CADENCE_MIN}`;

/** The words a day window is refused with. */
const DAY_WORDS = `a whole number from 0 to ${MAX_DAYS}`;

/** The words a mail count is refused with. */
const PER_SIGNAL_WORDS = `a whole number from 1 to ${MAX_PER_SIGNAL}`;

/** A finite number above zero. */
const positiveShape = z.number().positive();

/** A whole number above zero. */
const wholePositiveShape = z.number().refine(Number.isInteger).positive();

/** A text with something in it. */
const nonEmptyShape = z.string().min(1);

/** True or false. */
const flagShape = z.boolean();

/**
 * A map whose every own value is a text, an own `__proto__` key's included, answered as the map it
 * was given.
 */
const tiersShape = unchangedAs<Record<string, string>>(valuesOfShape(labelShape));

/** The block `name` of the merged map, or a throw saying it must be a map. */
function blockOf(config: Record<string, unknown>, name: string): Record<string, unknown> {
    const block = readAs(mapShape, config[name]);
    if (block === null) throw new Error(`config/behavior.yml: ${name} must be a map`);
    return block;
}

/** The setting `name.key` of `block` read through `shape`, or a throw saying it must be `words`. */
function settingOf<T>(
    shape: z.ZodType<T>,
    block: Record<string, unknown>,
    name: string,
    key: string,
    words: string
): T {
    const parsed = shape.safeParse(block[key]);
    if (!parsed.success) throw new Error(`config/behavior.yml: ${name}.${key} must be ${words}`);
    return parsed.data;
}

/** The Live HPC settings of config/behavior.yml, every key required. */
export type SlurmSettings = {
    /** The key of the cluster entry of registries/resources.yml the poller queries. */
    resource: string;
    days: number;
    pollMin: number;
    quotaMin: number;
    prewarm: boolean;
};

/** Read `slurm:` with its five keys, or throw naming the key that is missing or mistyped. */
export function slurmSettings(config: Record<string, unknown>): SlurmSettings {
    const slurm = blockOf(config, 'slurm');
    const resource = settingOf(nonEmptyShape, slurm, 'slurm', 'resource', 'a non-empty string');
    const prewarm = settingOf(flagShape, slurm, 'slurm', 'prewarm', 'true or false');
    return {
        resource,
        days: settingOf(dayWindowShape, slurm, 'slurm', 'days', DAY_WORDS),
        pollMin: settingOf(cadenceShape, slurm, 'slurm', 'poll_min', CADENCE_WORDS),
        quotaMin: settingOf(cadenceShape, slurm, 'slurm', 'quota_min', CADENCE_WORDS),
        prewarm
    };
}

/** The calendar connector's settings of config/behavior.yml, every key required. */
export type CalendarSettings = {
    pollMin: number;
    /** Days before now the calendar window opens. */
    daysBack: number;
    /** Days after now the calendar window closes. */
    daysAhead: number;
};

/** Read `calendar:` with its three keys, or throw naming the key that is missing or mistyped. */
export function calendarSettings(config: Record<string, unknown>): CalendarSettings {
    const calendar = blockOf(config, 'calendar');
    return {
        pollMin: settingOf(cadenceShape, calendar, 'calendar', 'poll_min', CADENCE_WORDS),
        daysBack: settingOf(dayWindowShape, calendar, 'calendar', 'days_back', DAY_WORDS),
        daysAhead: settingOf(dayWindowShape, calendar, 'calendar', 'days_ahead', DAY_WORDS)
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
    const search = blockOf(config, 'search');
    return {
        maxHits: settingOf(positiveShape, search, 'search', 'max_hits', 'a number above zero'),
        timeoutS: settingOf(positiveShape, search, 'search', 'timeout_s', 'a number above zero')
    };
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

/** The Files view's settings of config/behavior.yml. */
export type FilesSettings = {
    /** Whether moving a file or folder to the Trash asks first. */
    confirmDelete: boolean;
};

/** Read `files:` with its one key, or throw naming the key that is missing or mistyped. */
export function filesSettings(config: Record<string, unknown>): FilesSettings {
    const files = blockOf(config, 'files');
    return {
        confirmDelete: settingOf(flagShape, files, 'files', 'confirm_delete', 'true or false')
    };
}

/**
 * Whether a move to the Trash asks first, for the page: `files.confirm_delete`, and true for a
 * configuration that does not carry a usable value, which is what the page holds until the config
 * channel's first message lands, so a delete asks until the setting says it need not.
 */
export function confirmDelete(config: Record<string, unknown>): boolean {
    const files = readAs(mapShape, config.files);
    return files?.confirm_delete !== false;
}

/** The mail connector's settings of config/behavior.yml, every key required. */
export type MailSettings = {
    pollMin: number;
    /** How many threads each of the plate's three signals is read at most. */
    perSignal: number;
};

/** Read `mail:` with its two keys, or throw naming the key that is missing or mistyped. */
export function mailSettings(config: Record<string, unknown>): MailSettings {
    const mail = blockOf(config, 'mail');
    return {
        pollMin: settingOf(cadenceShape, mail, 'mail', 'poll_min', CADENCE_WORDS),
        perSignal: settingOf(perSignalShape, mail, 'mail', 'per_signal', PER_SIGNAL_WORDS)
    };
}

/** Read `changes.keep`, how many change-log lines are kept, or throw naming what is wrong. */
export function changesKeep(config: Record<string, unknown>): number {
    const changes = blockOf(config, 'changes');
    return settingOf(wholePositiveShape, changes, 'changes', 'keep', 'a whole number above zero');
}

/** Read `usage_tiers:`, a map of plan id to label, or throw. */
export function usageTiers(config: Record<string, unknown>): Record<string, string> {
    const held = blockOf(config, 'usage_tiers');
    const refused = Object.entries(held).find(([, value]) => !labelShape.safeParse(value).success);
    if (refused !== undefined) {
        throw new Error(`config/behavior.yml: usage_tiers.${refused[0]} must be a string`);
    }
    return tiersShape.parse(held);
}
