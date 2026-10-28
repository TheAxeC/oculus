// Layer 2, server. The one-shot password helper of Put the key on the cluster: ssh asks the program
// `SSH_ASKPASS` names for the password (`SSH_ASKPASS_REQUIRE=force`, so it asks it with no
// terminal), and this module makes that program for one ssh and serves the password to it once.
//
// A temporary folder is made at mode 0700. In it are a socket at mode 0600 that this process
// serves, a small node script that reads one answer from that socket and prints it, and the
// program ssh starts, a shell script at mode 0700 that runs the node script with the program this
// process runs on (`process.execPath`, as node under `ELECTRON_RUN_AS_NODE=1`). The socket's path
// is written into the node script; the password is in none of the three files, in no argument and
// in no environment variable, and travels only over the socket. The first connection is answered
// with the password and every later one is closed with no answer, which the node script exits
// non-zero on, so a second prompt (a one-time code under keyboard-interactive) gets nothing and ssh
// fails; how many times ssh asked is counted, so the section can say the cluster asked for more
// than a password. `close` stops serving and removes the folder, which the caller does when its
// ssh has ended, whichever way.

import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** The helper of one ssh: the variables its environment gets, the count of asks, and its close. */
export type Askpass = {
    /** `SSH_ASKPASS` and `SSH_ASKPASS_REQUIRE`, the only values the ssh's environment gains. */
    env: Record<string, string>;
    /** How many times ssh has asked so far. */
    asked: () => number;
    /** Stop serving and remove the folder. */
    close: () => Promise<void>;
};

/**
 * The node script that reads the answer: it prints what the socket sends followed by a line
 * break, and exits 1 when the socket sends nothing or cannot be reached.
 */
function readerSource(socket: string): string {
    return [
        "'use strict';",
        "const net = require('node:net');",
        `const link = net.createConnection(${JSON.stringify(socket)});`,
        'const parts = [];',
        'link.on("data", (part) => parts.push(part));',
        'link.on("error", () => process.exit(1));',
        'link.on("close", () => {',
        '    if (parts.length === 0) process.exit(1);',
        '    process.stdout.write(Buffer.concat(parts));',
        '    process.stdout.write("\\n");',
        '});',
        ''
    ].join('\n');
}

/** Listen on a socket path, answered once the server listens or fails to. */
function listening(server: Server, path: string): Promise<void> {
    return new Promise((answer, fail) => {
        server.once('error', fail);
        server.listen(path, () => {
            server.off('error', fail);
            answer();
        });
    });
}

/**
 * Make the helper for one ssh and serve `password` to its first ask. `program` is what runs the
 * node script, and a path holding a single quote, which the shell script quotes it in, throws
 * before anything is made; so does a temporary folder whose path holds one.
 */
export async function openAskpass(
    password: string,
    program: string = process.execPath
): Promise<Askpass> {
    if (program.includes("'")) throw new Error('the program path holds a single quote');
    const dir = mkdtempSync(join(tmpdir(), 'oculus-askpass-'));
    if (dir.includes("'")) {
        rmSync(dir, { recursive: true, force: true });
        throw new Error('the temporary folder holds a single quote');
    }
    chmodSync(dir, 0o700);
    const socket = join(dir, 'socket');
    const reader = join(dir, 'read.cjs');
    const script = join(dir, 'askpass');
    let asked = 0;
    const server = createServer((link) => {
        asked += 1;
        if (asked === 1) link.end(password);
        else link.destroy();
    });
    try {
        writeFileSync(reader, readerSource(socket), { mode: 0o600 });
        writeFileSync(script, `#!/bin/sh\nELECTRON_RUN_AS_NODE=1 exec '${program}' '${reader}'\n`, {
            mode: 0o700
        });
        await listening(server, socket);
        chmodSync(socket, 0o600);
    } catch (error) {
        server.close();
        rmSync(dir, { recursive: true, force: true });
        throw error;
    }
    return {
        env: { SSH_ASKPASS: script, SSH_ASKPASS_REQUIRE: 'force' },
        asked: () => asked,
        close: () =>
            new Promise((answer) => {
                server.close(() => {
                    rmSync(dir, { recursive: true, force: true });
                    answer();
                });
            })
    };
}
