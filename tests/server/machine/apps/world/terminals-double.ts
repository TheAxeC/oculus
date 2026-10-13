// The terminals env of the apps' hosts over doubles: the terminals live in memory, a start adds a
// row that never runs, and a stop removes it. A suite that needs a program to run builds the env
// over a private tmux server instead (terminalsEnv in src/lib/server/machine/apps/tools/run/).

import type { Terminal } from '../../../../../src/lib/data/model/index.ts';
import { StreamTerminalSet } from '../../../../../src/lib/server/machine/apps/tools/run/stream-terminals.ts';
import type { TerminalsEnv } from '../../../../../src/lib/server/machine/apps/tools/run/terminals.ts';

/** An env whose tmux terminals are rows in memory. */
export function terminalsDouble(): TerminalsEnv & {
    rows: Terminal[];
    /** Resolves when `accepts` is true, at once or after the first list change that makes it so. */
    until: (accepts: () => boolean) => Promise<void>;
} {
    const streams = new StreamTerminalSet();
    const rows: Terminal[] = [];
    const listeners = new Set<() => void>();
    const tell = (): void => {
        for (const listener of [...listeners]) listener();
    };
    streams.onChange(tell);
    let next = 0;
    return {
        rows,
        until: (accepts) =>
            new Promise((resolve) => {
                const look = (): void => {
                    if (!accepts()) return;
                    listeners.delete(look);
                    resolve();
                };
                listeners.add(look);
                look();
            }),
        streams,
        start(request) {
            next += 1;
            const row: Terminal = {
                id: `d${next}-app`,
                name: request.name,
                title: '',
                icon: '',
                color: '',
                kind: 'app',
                app: request.app,
                cwd: request.cwd,
                command: request.argv.join(' '),
                pid: 1000 + next,
                created: new Date(0).toISOString(),
                attached: false,
                resumes: null,
                task: request.job !== undefined,
                exit: null,
                job: request.job ?? null
            };
            rows.push(row);
            tell();
            return Promise.resolve(row);
        },
        list: () => [...rows, ...streams.list()],
        onChange(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        send: () => Promise.resolve(),
        stop(id) {
            const at = rows.findIndex((one) => one.id === id);
            if (at >= 0) rows.splice(at, 1);
            tell();
            return Promise.resolve();
        },
        interrupt: () => Promise.resolve(),
        respawn: () => Promise.resolve(),
        output: () => Promise.resolve(''),
        shell: () => '/bin/sh'
    };
}
