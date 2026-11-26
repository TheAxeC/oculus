// Layer 4, tool. The oculus server utils/shots/shots.mjs takes the screenshots of: a free port, the
// server started on it from the repository root, the wait until it answers, and its end.
//
// The port is one the system hands out for port 0 on the server's own address, which no running
// server holds at that moment. A program that takes it between the pick and the server's listen
// makes the server print its port_in_use line and exit, and the command then stops with the
// server's output, since the wait below ends on the server's exit as well as on its answer.
//
// The server is `node src/server.ts --default-port <port>`: the scratch HOME holds no hub with a
// `.oculus/local.yml`, so that port is the one it takes. It is ready when `GET /api/health` answers
// as an oculus (src/desktop/server/health.ts `oculusAnswers`, the check the desktop host makes),
// asked again a quarter second after each miss until the server exits or the limit passes. Its
// standard output and error are kept, to be printed when the command stops.

import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { oculusAnswers } from '../../src/desktop/server/health.ts';
import { LISTEN_HOST } from '../../src/lib/server/root/mover.ts';
import { Refusal } from './programs.mjs';

/** How long the server has to answer after it is started, in milliseconds. */
const ANSWER_LIMIT_MS = 60000;

/** How long one health question may wait for its answer, in milliseconds. */
const ASK_LIMIT_MS = 1000;

/** How long after a miss the health question is asked again, in milliseconds. */
const ASK_AGAIN_MS = 250;

/** How long the server has to end after it is asked to, before it is killed, in milliseconds. */
const STOP_LIMIT_MS = 10000;

/** The address of the page a server on `port` serves. */
export function serverOrigin(port) {
    return `http://${LISTEN_HOST}:${port}`;
}

/** A port no server on the server's address holds now, as the system hands one out. */
export function freePort() {
    return new Promise((done, fail) => {
        const probe = createServer();
        probe.once('error', fail);
        probe.listen(0, LISTEN_HOST, () => {
            const address = probe.address();
            const port = typeof address === 'object' && address !== null ? address.port : 0;
            probe.close(() => done(port));
        });
    });
}

/** Whether a child process has ended. */
function ended(child) {
    return child.exitCode !== null || child.signalCode !== null;
}

/**
 * Start the server on `port`. The answer is in hand at once, so the caller can end the server
 * whatever happens next; its `ready` settles once the server answers as an oculus, and is refused
 * with the server's output when the server exits first or does not answer within the limit.
 *
 * @param {string} root the repository root
 * @param {NodeJS.ProcessEnv} env
 * @param {number} port
 * @returns {{ ready: Promise<void>, stop: () => Promise<void>, kill: () => void,
 *     output: () => string }}
 */
export function startServer(root, env, port) {
    const child = spawn('node', ['src/server.ts', '--default-port', String(port)], {
        cwd: root,
        env,
        stdio: ['ignore', 'pipe', 'pipe']
    });
    let output = '';
    const take = (chunk) => {
        output += String(chunk);
    };
    child.stdout.on('data', take);
    child.stderr.on('data', take);
    const exited = once(child, 'exit').catch(() => undefined);
    child.once('error', (error) => {
        output += `${error.message}\n`;
    });

    /**
     * Ask the server until it answers, it exits or the limit passes. The spawn's own outcome comes
     * first: a node that cannot be started emits `error` in place of `spawn`, and its reason (such
     * as `spawn node ENOENT`) is in the output before the first check reads it.
     */
    async function answered() {
        await once(child, 'spawn').catch(() => undefined);
        const deadline = Date.now() + ANSWER_LIMIT_MS;
        for (;;) {
            if (ended(child) || child.pid === undefined) {
                throw new Refusal(
                    'The server stopped before it answered; its output follows.',
                    output
                );
            }
            if (await oculusAnswers(port, ASK_LIMIT_MS)) return;
            if (Date.now() > deadline) {
                throw new Refusal(
                    `The server did not answer within ${ANSWER_LIMIT_MS / 1000} s; its output follows.`,
                    output
                );
            }
            await Promise.race([exited, delay(ASK_AGAIN_MS)]);
        }
    }

    return {
        ready: answered(),
        output: () => output,
        kill: () => {
            if (!ended(child)) child.kill('SIGKILL');
        },
        stop: async () => {
            if (ended(child) || child.pid === undefined) return;
            child.kill('SIGTERM');
            const done = await Promise.race([exited.then(() => true), delay(STOP_LIMIT_MS, false)]);
            if (!done && !ended(child)) {
                child.kill('SIGKILL');
                await exited;
            }
        }
    };
}
