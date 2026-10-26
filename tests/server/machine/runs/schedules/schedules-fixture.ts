// Layer 4, test helper. A scratch folder for the schedule suites: the schedules file, the run
// record and the approvals file at scratch paths, a scratch repository whose `.oculus/commands.yml`
// holds one command with its chain approved, the text of an entry that runs each of the three
// things a schedule runs, and the watcher built over the real start with a recording tmux. Nothing
// here reads `local.yml`, the machine's home folder or a real `claude`; the only paths are the
// ones the folder holds.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect } from 'vitest';
import type { Hub } from '../../../../../src/lib/server/core/channels.ts';
import { fsWrites } from '../../../../../src/lib/server/core/json.ts';
import {
    approveTexts,
    chainText
} from '../../../../../src/lib/server/machine/approvals/approvals.ts';
import { stopTerminal } from '../../../../../src/lib/server/machine/pty/sessions.ts';
import type { SchedulesRouteOptions } from '../../../../../src/lib/server/machine/runs/schedules/routes.ts';
import { runEntry } from '../../../../../src/lib/server/machine/runs/schedules/run.ts';
import type { TaskHubs } from '../../../../../src/lib/server/machine/runs/schedules/task.ts';
import {
    watchSchedules,
    type SchedulesOptions,
    type SchedulesWatcher
} from '../../../../../src/lib/server/machine/runs/schedules/watch.ts';
import { noop } from '../../../../fixtures/doubles.ts';
import { scratchDir } from '../../../../fixtures/scratch.ts';
import { TEXT } from '../../../text.ts';
import { type tmux } from '../../../../routes/sessions/terminal-fixture.ts';
import { commandsYml, plantRepo } from '../commands/commands-fixture.ts';

/** The stand-in `claude` every run is started with: a path, never run. */
export const CLAUDE = '/stub/claude';

/** The three things a schedule runs. */
export type Kind = 'task' | 'command' | 'prompt';

/** The command `sync` of the world's repository, as its `.oculus/commands.yml` lists it. */
export const SYNC = '  - name: sync\n    run: echo synced\n';

/** A scratch folder's paths: the two files, the approvals, the repository and the hub folder. */
export type World = {
    files: { schedules: string; record: string };
    /** The approvals file every command start is checked against. */
    approvals: string;
    /**
     * A repository under the scratch folder, a served root whose `.oculus/commands.yml` holds the
     * command `sync`, its chain approved.
     */
    repo: string;
    /** The hub folder of every run, a folder of the scratch folder no other path of it lies in. */
    hub: string;
    /** A second hub of the scratch folder, holding no task file. */
    other: string;
    /** The open workspace's hubs: `hub` as the primary `A`, then `other` as `B`. */
    hubs: TaskHubs;
};

/**
 * The options the schedules route is called with over a world: its files, its root, its approvals
 * file and the watcher.
 */
export function routeOptions(w: World, schedules: SchedulesWatcher): SchedulesRouteOptions {
    return {
        files: () => w.files,
        rootsFor: () => [w.repo],
        hubsFor: () => w.hubs,
        text: () => TEXT,
        approvalsFor: () => w.approvals,
        writes: fsWrites(),
        schedules
    };
}

/** Write the repository's `.oculus/commands.yml` with the entries written as YAML lines. */
export function plantCommands(w: World, entries: string): void {
    mkdirSync(join(w.repo, '.oculus'), { recursive: true });
    writeFileSync(join(w.repo, '.oculus', 'commands.yml'), commandsYml(entries));
}

/**
 * A scratch folder with its repository, the repository's command `sync` with its chain approved, a
 * primary hub holding the Lit Watch task file, a second hub holding no task file, and no schedules
 * file.
 */
export function world(): World {
    const dir = scratchDir('oculus-schedules-');
    const repo = plantRepo();
    const files = {
        schedules: join(dir, 'schedules.yml'),
        record: join(dir, 'schedule.json')
    };
    const hub = join(dir, 'hub');
    mkdirSync(join(hub, '.oculus', 'tasks'), { recursive: true });
    writeFileSync(join(hub, '.oculus', 'tasks', 'litwatch.md'), '# Lit Watch\n');
    const other = join(dir, 'other');
    mkdirSync(join(other, '.oculus'), { recursive: true });
    const hubs = {
        primary: 'A',
        primaryDir: hub,
        hubs: [
            { name: 'A', dir: hub },
            { name: 'B', dir: other }
        ]
    };
    const w = { files, approvals: join(dir, 'approvals.json'), repo, hub, other, hubs };
    plantCommands(w, SYNC);
    const approved = approveTexts(w.approvals, [
        chainText(repo, [{ folder: '.', run: 'echo synced' }])
    ]);
    expect(approved).toEqual({ ok: true });
    return w;
}

/** The YAML of the entry `Weekly radar` that runs what `kind` says, on `when`. */
export function entryText(w: World, kind: Kind, when = '0 7 * * *', extra = ''): string {
    const runs = {
        task: '{ task: litwatch }',
        command: `{ command: sync, folder: ${JSON.stringify(w.repo)} }`,
        prompt: '{ prompt: "Summarise what is blocked", folder: hub }'
    }[kind];
    const pattern = when === '' ? '' : `  when: ${JSON.stringify(when)}\n`;
    return `- name: Weekly radar\n  runs: ${runs}\n${pattern}${extra}`;
}

/** Write the schedules file of the world. */
export function plantSchedules(w: World, text: string): void {
    writeFileSync(w.files.schedules, text);
}

/** Write a record holding the entry `Weekly radar` with the given handled due time and runs. */
export function plantRecord(
    w: World,
    entry: { handled: Date | null; runs?: object[]; since: Date; pattern?: string }
): void {
    writeFileSync(
        w.files.record,
        JSON.stringify({
            'Weekly radar': {
                pattern: entry.pattern ?? '0 7 * * *',
                since: entry.since.toISOString(),
                handled: entry.handled?.toISOString() ?? null,
                runs: entry.runs ?? []
            }
        })
    );
}

/**
 * A watcher over the world's files and the real start, with the recording tmux handed in. The
 * terminal list reads unless the case hands in a listing of its own.
 */
export function watcherOver(
    w: World,
    hub: Hub,
    driver: ReturnType<typeof tmux>,
    table: SchedulesOptions['table'] = () => Promise.resolve([]),
    listing: SchedulesOptions['listing'] = { unreadable: () => null, onChange: () => noop }
): SchedulesWatcher {
    const rootsFor = (): string[] => [w.repo];
    return watchSchedules(hub, {
        files: w.files,
        rootsFor,
        hubs: () => w.hubs,
        run: (entry, size) =>
            runEntry(entry, size, {
                run: driver.run,
                hubs: w.hubs,
                claudeBin: CLAUDE,
                text: TEXT,
                rootsFor,
                approvalsFor: () => w.approvals
            }),
        stop: (terminal) => stopTerminal(terminal, { run: driver.run }),
        table,
        refresh: noop,
        listing
    });
}
