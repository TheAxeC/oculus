// Layer 1, data. The typed readers of the settings of the services oculus polls or asks: the
// cluster, the calendar, the mail, the Literature search's sources, and the usage tiers and their
// refresh. Each reads its keys of behavior.yml through settingReader (reader.ts).

import { noRule, settingReader, type SettingProblem } from './reader.ts';

/** The Live HPC settings of behavior.yml. */
export type SlurmSettings = {
    /** The key of the cluster entry of the resources registry the poller queries. */
    resource: string;
    days: number;
    pollMin: number;
    quotaMin: number;
    prewarm: boolean;
};

/** Read `slurm:`'s five keys, each its default when it is missing or wrong. */
export function slurmSettings(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): SlurmSettings {
    const read = settingReader(config, problems);
    return {
        resource: read.text('slurm.resource'),
        days: read.number('slurm.days'),
        pollMin: read.number('slurm.poll_min'),
        quotaMin: read.number('slurm.quota_min'),
        prewarm: read.flag('slurm.prewarm')
    };
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
