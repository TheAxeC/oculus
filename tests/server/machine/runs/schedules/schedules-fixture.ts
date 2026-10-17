// Layer 4, test helper. A scratch folder for the schedule suites: the schedules file, the run
// record and the saved commands file at scratch paths, a scratch repository holding one saved
// command, the text of an entry that runs each of the three things a schedule runs, and the
// watcher built over the real start with a recording tmux. Nothing here reads `local.yml`, the
// machine's home folder or a real `claude`; the only paths are the ones the folder holds.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Hub } from '../../../../../src/lib/server/core/channels.ts';
import { fsWrites } from '../../../../../src/lib/server/core/json.ts';
import { stopTerminal } from '../../../../../src/lib/server/machine/pty/sessions.ts';
import type { SchedulesRouteOptions } from '../../../../../src/lib/server/machine/runs/schedules/routes.ts';
import { runEntry } from '../../../../../src/lib/server/machine/runs/schedules/run.ts';
import {
    watchSchedules,
    type SchedulesOptions,
    type SchedulesWatcher
} from '../../../../../src/lib/server/machine/runs/schedules/watch.ts';
import { noop } from '../../../../fixtures/doubles.ts';
import { scratchDir } from '../../../../fixtures/scratch.ts';
import { TEXT } from '../../../text.ts';
import { type tmux } from '../../../../routes/sessions/terminal-fixture.ts';
import { plantRepo } from '../commands/commands-fixture.ts';

/** The stand-in `claude` every run is started with: a path, never run. */
export const CLAUDE = '/stub/claude';

/** The three things a schedule runs. */
export type Kind = 'task' | 'command' | 'prompt';

/** A scratch folder's paths: the three files, the repository, and the hub folder. */
export type World = {
    files: { schedules: string; record: string; commands: string };
    /** A repository under the scratch folder, a served root holding the saved command `sync`. */
    repo: string;
    /** The hub folder of every run, a folder of the scratch folder no other path of it lies in. */
    hub: string;
};

/**
 * The options the schedules route is called with over a world: its files, its root and the watcher.
 */
export function routeOptions(w: World, schedules: SchedulesWatcher): SchedulesRouteOptions {
    return {
        files: () => w.files,
        rootsFor: () => [w.repo],
        hubFor: () => w.hub,
        text: () => TEXT,
        writes: fsWrites(),
        schedules
    };
}

/**
 * A scratch folder with its repository, its saved command, a hub holding the Lit Watch task file
 * and no schedules file.
 */
export function world(): World {
    const dir = scratchDir('oculus-schedules-');
    const repo = plantRepo();
    const files = {
        schedules: join(dir, 'schedules.yml'),
        record: join(dir, 'schedule.json'),
        commands: join(dir, 'commands.json')
    };
    writeFileSync(
        files.commands,
        JSON.stringify({ [repo]: [{ name: 'sync', run: 'echo synced' }] })
    );
    const hub = join(dir, 'hub');
    mkdirSync(join(hub, '.oculus', 'tasks'), { recursive: true });
    writeFileSync(join(hub, '.oculus', 'tasks', 'litwatch.md'), '# Lit Watch\n');
    return { files, repo, hub };
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
        hub: () => w.hub,
        run: (entry, size) =>
            runEntry(entry, size, {
                run: driver.run,
                hub: w.hub,
                claudeBin: CLAUDE,
                text: TEXT,
                rootsFor,
                commands: w.files.commands,
                approvalsFor: () => join(w.files.commands, '..', 'approvals.json')
            }),
        stop: (terminal) => stopTerminal(terminal, { run: driver.run }),
        table,
        refresh: noop,
        listing
    });
}
