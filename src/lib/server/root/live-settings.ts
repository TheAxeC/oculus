// Layer 2, server. Hands the pollers the settings of every config push. The pollers are built from
// the configuration read at start; this module subscribes to the `config` channel the portfolio
// watcher publishes on, reads each group of settings again through its reader, and gives the
// poller the settings that changed. The Live HPC host is the one setting with other sources: the
// `hpc_host` of local.yml, read from the context at each push and again when local.yml changes, and
// the cluster entry of the resources registry that `slurm.resource` names, read again after each
// portfolio rebuild.
//
// Each group is read on its own, so one a hand edit made unreadable keeps the settings in force
// while the others take theirs. A value the options catalog's rule refuses is read as the entry's
// default and is a finding (settingFindings), so it never reaches this module as a refusal; a
// setter that throws, or a group whose key the catalog holds no entry for, is a refusal. A refusal
// is said once on stderr: the same message on a later push says nothing, a different one says its
// own line, and a push that reads the group again clears what was said, so a later refusal is said
// again. A push whose merge dropped behavior.yml (a finding on the whole file) leaves every group
// read from it as it is, since the merged map holds none of the file's keys.

import { isDeepStrictEqual } from 'node:util';
import { z } from 'zod';
import {
    calendarSettings,
    droppedFile,
    mailSettings,
    processesSettings,
    refreshSettings,
    slurmSettings,
    textCatalog,
    usageTiers,
    type CalendarSettings,
    type MailSettings,
    type ProcessesSettings,
    type SlurmSettings
} from '../../data/sources/config.ts';
import type { Id, Resource } from '../../data/model/index.ts';
import { mapShape, readAs } from '../../data/shapes/shapes.ts';
import type { CalendarWords } from '../accounts/calendar/poll.ts';
import type { MailWords } from '../accounts/mail/poll.ts';
import type { Hub, Sink } from '../core/channels.ts';
import { hostWordsOf, hpcSettingsOf, type HostWords } from '../machine/hpc/host.ts';
import type { HpcSettings } from '../machine/hpc/poll.ts';

/** The settings the pollers were built with, which a push is compared with. */
export type LiveStart = {
    /** The host `local.yml` names now, which a pushed `slurm.resource` does not replace. */
    hpcHost: () => string | undefined;
    /** The resources of the latest portfolio snapshot, or null while there is none. */
    resources: () => Record<Id, Resource> | null;
    /** The sentences for having no host, which each push renews. */
    hostWords: HostWords;
    /** The Live HPC settings as the configuration reads them, `slurm.resource` included. */
    slurm: SlurmSettings;
    calendar: CalendarSettings;
    mail: MailSettings;
    refresh: { refreshMin: number; model: string };
    tiers: Record<string, string>;
    processes: ProcessesSettings;
    /** The text catalog the Processes view's failures are worded from. */
    processesText: Record<string, string>;
    calendarWords: CalendarWords;
    mailWords: MailWords;
};

/** What a poller is told when a group of settings changes. */
export type LiveTargets = {
    hpc: { set(settings: HpcSettings): void };
    calendar: {
        setSettings(settings: CalendarSettings): void;
        setWords(words: CalendarWords): void;
    };
    mail: { setSettings(settings: MailSettings): void; setWords(words: MailWords): void };
    usageRefresh: { set(settings: { refreshMin: number; model: string }): void };
    usage: { setTiers(tiers: Record<string, string>): void };
    processes: {
        set(settings: ProcessesSettings): void;
        setText(text: Record<string, string>): void;
    };
};

/** The message of the `config` channel, narrowed to the one field this module reads. */
const configMessageShape = z.object({
    channel: z.literal('config'),
    payload: z.object({
        config: z.unknown(),
        findings: z.array(z.object({ file: z.string(), key: z.string() })).catch([])
    })
});

const KEPT = 'the settings in force are kept';

/** What a started `liveSettings` offers beside the subscription. */
export type LiveSettings = {
    /**
     * Hand the Live HPC poller the host `local.yml` names, or the host of the cluster
     * `slurm.resource` names in the resources of the latest portfolio snapshot.
     */
    hostChanged(): void;
    /** The usage settings in force, which a watcher built again is started with. */
    held(): { refresh: { refreshMin: number; model: string }; tiers: Record<string, string> };
    /** Take the sink off the hub. */
    close(): void;
};

/** Subscribe the pollers to the config channel; close() takes the subscription off the hub. */
export function liveSettings(hub: Hub, start: LiveStart, targets: LiveTargets): LiveSettings {
    const { hpcHost, ...held } = start;
    const { resources, hostWords: startWords, slurm: started, ...plain } = held;
    let hostWords = startWords;
    /** The `slurm:` of the last configuration read, whose resource `hpc_host` replaces when set. */
    let pushed = started;
    /** The Live HPC settings for a `slurm:` block, resolved over what the sources hold now. */
    const hpcFor = (slurm: SlurmSettings): HpcSettings =>
        hpcSettingsOf(slurm, hpcHost(), resources(), hostWords);
    const current = { ...structuredClone(plain), hpc: hpcFor(started) };
    /** The message each group last refused with, by group; a group that reads has no entry. */
    const said = new Map<string, string>();
    let closed = false;

    const refuse = (group: string, message: string): void => {
        if (said.get(group) === message) return;
        said.set(group, message);
        console.error(`config: ${message}; ${KEPT}`);
    };

    /** What `read` gives, or undefined after saying why the group is refused. */
    const attempt = <T>(group: string, read: () => T): T | undefined => {
        try {
            const value = read();
            said.delete(group);
            return value;
        } catch (error) {
            refuse(group, error instanceof Error ? error.message : String(error));
            return undefined;
        }
    };

    /** The catalog entry `key` as the text it holds, or a throw saying it is no text. */
    const textOf = (value: unknown, key: string): string => {
        if (typeof value !== 'string') throw new Error(`text catalog: ${key} must be a string`);
        return value;
    };

    /** Resolve the host again; the poller gets the settings when they differ from those held. */
    const handHpc = (): void => {
        const next = hpcFor(pushed);
        if (isDeepStrictEqual(next, current.hpc)) return;
        targets.hpc.set(next);
        current.hpc = next;
    };

    /** The groups read from behavior.yml, each in its own attempt. */
    const takeBehavior = (config: Record<string, unknown>): void => {
        attempt('slurm', () => {
            pushed = slurmSettings(config);
            handHpc();
        });
        attempt('calendar', () => {
            const calendar = calendarSettings(config);
            if (isDeepStrictEqual(calendar, current.calendar)) return;
            targets.calendar.setSettings(calendar);
            current.calendar = calendar;
        });
        attempt('mail', () => {
            const mail = mailSettings(config);
            if (isDeepStrictEqual(mail, current.mail)) return;
            targets.mail.setSettings(mail);
            current.mail = mail;
        });
        attempt('refresh', () => {
            const refresh = refreshSettings(config);
            if (isDeepStrictEqual(refresh, current.refresh)) return;
            targets.usageRefresh.set(refresh);
            current.refresh = refresh;
        });
        attempt('tiers', () => {
            const tiers = usageTiers(config);
            if (isDeepStrictEqual(tiers, current.tiers)) return;
            targets.usage.setTiers(tiers);
            current.tiers = tiers;
        });
        attempt('processes', () => {
            const processes = processesSettings(config);
            if (isDeepStrictEqual(processes, current.processes)) return;
            targets.processes.set(processes);
            current.processes = processes;
        });
    };

    /**
     * Each group is read, compared with the settings in force and handed to its setter inside its
     * own attempt, so a refusal and a setter that throws are logged the same way and the sink stays
     * subscribed. The settings in force change only after the setter took them, so a push that
     * follows a throw offers them again.
     */
    const take = (config: Record<string, unknown>, behaviorDropped: boolean): void => {
        if (!behaviorDropped) takeBehavior(config);
        if (attempt('text', () => textCatalog(config)) === undefined) return;
        attempt('hpc.words', () => {
            const next = hostWordsOf(config);
            if (isDeepStrictEqual(next, hostWords)) return;
            hostWords = next;
            handHpc();
        });
        const words = { ...current.calendarWords };
        const noLink = attempt('calendar.ics_no_link', () =>
            textOf(textCatalog(config)['calendar.ics_no_link'], 'calendar.ics_no_link')
        );
        if (noLink !== undefined) words.icsNoLink = noLink;
        const failed = attempt('calendar.ics_failed', () =>
            textOf(textCatalog(config)['calendar.ics_failed'], 'calendar.ics_failed')
        );
        if (failed !== undefined) words.icsFailed = failed;
        const timedOut = attempt('accounts.timed_out', () =>
            textOf(textCatalog(config)['accounts.timed_out'], 'accounts.timed_out')
        );
        if (timedOut !== undefined) words.timedOut = timedOut;
        attempt('processes.words', () => {
            const text = textCatalog(config);
            if (isDeepStrictEqual(text, current.processesText)) return;
            targets.processes.setText(text);
            current.processesText = text;
        });
        attempt('calendar.words', () => {
            if (isDeepStrictEqual(words, current.calendarWords)) return;
            targets.calendar.setWords(words);
            current.calendarWords = words;
        });
        attempt('mail.words', () => {
            if (words.timedOut === current.mailWords.timedOut) return;
            const mailWords = { timedOut: words.timedOut };
            targets.mail.setWords(mailWords);
            current.mailWords = mailWords;
        });
    };

    const onMessage = (text: string): void => {
        if (closed) return;
        let parsed: unknown;
        try {
            parsed = JSON.parse(text);
        } catch {
            return;
        }
        const message = configMessageShape.safeParse(parsed);
        if (!message.success) return;
        const config = readAs(mapShape, message.data.payload.config);
        if (config === null) {
            refuse('map', 'the pushed configuration is not a map');
            return;
        }
        said.delete('map');
        take(config, droppedFile(message.data.payload.findings, 'behavior.yml'));
    };

    const sink: Sink = {
        send(text) {
            onMessage(text);
            return Promise.resolve();
        },
        close() {
            // The hub never closes a sink it did not open; there is no socket behind this one.
        }
    };
    hub.subscribe(sink, ['config'], false);
    return {
        hostChanged(): void {
            if (closed) return;
            attempt('hpc_host', handHpc);
        },
        held: () => structuredClone({ refresh: current.refresh, tiers: current.tiers }),
        close(): void {
            closed = true;
            hub.remove(sink);
        }
    };
}
