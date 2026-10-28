// Layer 2, server. Put the key on the cluster: the one ssh of oculus that logs in with a password.
// It runs with password login alone (`PubkeyAuthentication=no`, `PreferredAuthentications=password,
// keyboard-interactive`, one prompt), `StrictHostKeyChecking=yes`, so a host whose key the reader
// has not trusted is refused, and with `BatchMode=no`, since a `BatchMode yes` of the oculus ssh
// options or of the reader's ssh config would forbid the prompt. The password reaches it through
// the one-shot helper of askpass.ts and nothing else.
//
// The remote command reads the public key from its standard input; the key is never spliced into
// the command. It is one line, run by `sh -c` whatever the login shell, and holds no single quote:
// it makes `~/.ssh` (0700) and `~/.ssh/authorized_keys` (0600) when they are missing, does nothing
// when a line of the file equals the key, and otherwise appends the key as a line of its own, after
// a line break when the file's last line has none, so no line the file holds is changed.
//
// How the ssh ended is told apart: the key put, the cluster offering no password method (no ask,
// and an ssh that names the methods it was refused by without `password` or
// `keyboard-interactive`), the cluster asking for more than the password (a second ask), or the
// first line ssh wrote.

import { spawn } from 'node:child_process';
import { openAskpass, type Askpass } from './askpass.ts';
import { loginOptions, SSH_PROGRAM, type Connection } from '../ssh.ts';
import { firstLine } from './keys.ts';

/** How long the put-key ssh is given, password typing excluded since the helper answers at once. */
const PUT_MS = 30000;

/**
 * The options of the put-key ssh: one connection of its own, prompts on (`BatchMode=no`, since a
 * `BatchMode yes` of the reader's ssh config would keep ssh from asking the helper), password
 * login, a strict host key.
 */
const PUT_OPTIONS = [
    '-o',
    'ConnectTimeout=8',
    '-o',
    'ControlMaster=no',
    '-o',
    'ControlPath=none',
    '-o',
    'BatchMode=no',
    '-o',
    'StrictHostKeyChecking=yes',
    '-o',
    'PubkeyAuthentication=no',
    '-o',
    'PreferredAuthentications=password,keyboard-interactive',
    '-o',
    'NumberOfPasswordPrompts=1'
];

/** The commands the remote shell runs, each holding no single quote, joined by `; `. */
const AUTHORIZE_STEPS = [
    'umask 077',
    'IFS= read -r key',
    '[ -n "$key" ] || exit 2',
    'cd || exit 3',
    '[ -d .ssh ] || mkdir .ssh || exit 3',
    'f=.ssh/authorized_keys',
    '[ -e "$f" ] || { : > "$f" && chmod 600 "$f"; } || exit 3',
    'grep -qxF -- "$key" "$f" && exit 0',
    '{ [ -s "$f" ] && [ -n "$(tail -c 1 "$f")" ]; } && { printf "\\n" >> "$f" || exit 3; }',
    'printf "%s\\n" "$key" >> "$f"'
];

/** The remote command: the steps run by `sh -c`, quoted once in single quotes. */
const AUTHORIZE = `sh -c '${AUTHORIZE_STEPS.join('; ')}'`;

/** How the put-key ssh ended, and what it wrote to its error output. */
type PutRun = (
    args: string[],
    env: Record<string, string>,
    input: string
) => Promise<{ code: number; stderr: string }>;

/** The real ssh, with the helper's variables added to this process's environment. */
const runPut: PutRun = (args, env, input) =>
    new Promise((answer) => {
        const child = spawn(SSH_PROGRAM, args, {
            env: { ...process.env, ...env },
            stdio: ['pipe', 'ignore', 'pipe']
        });
        let stderr = '';
        const timer = setTimeout(() => child.kill('SIGKILL'), PUT_MS);
        child.stderr.on('data', (part) => (stderr += String(part)));
        child.stdin.on('error', () => undefined);
        child.stdin.end(input);
        child.on('error', (error) => {
            clearTimeout(timer);
            answer({ code: -1, stderr: error.message });
        });
        child.on('close', (code) => {
            clearTimeout(timer);
            answer({ code: code ?? -1, stderr });
        });
    });

/** What Put the key did. */
export type PutAnswer =
    { put: true } | { noPassword: true } | { moreThanPassword: true } | { failed: string };

/** The put-key ssh's arguments: its options, the login without the key, the host, the command. */
function putArgs(connection: Connection): string[] {
    const login = loginOptions({ host: connection.host, ...withUser(connection) });
    return [...PUT_OPTIONS, ...login, connection.host, AUTHORIZE];
}

/** The user name of a connection alone, since the put-key ssh offers no key. */
function withUser(connection: Connection): { user?: string } {
    return connection.user === undefined ? {} : { user: connection.user };
}

/** Whether ssh's refusal names the methods it was refused by, none of them a password method. */
function offersNoPassword(stderr: string): boolean {
    const named = /Permission denied \(([^)]*)\)/.exec(stderr);
    if (named === null) return false;
    const methods = named[1].split(',').map((one) => one.trim());
    return !methods.includes('password') && !methods.includes('keyboard-interactive');
}

/** What the helper and the ssh are made with, injected so a test starts neither. */
export type PutDeps = {
    run: PutRun;
    askpass: (password: string) => Promise<Askpass>;
};

/** The real helper and ssh. */
export const PUT_DEPS: PutDeps = { run: runPut, askpass: (password) => openAskpass(password) };

/**
 * Put the public key (`publicKey`, one line) on the cluster of `connection` with the password the
 * reader typed, which the caller has checked holds no line break. The helper is closed when the
 * ssh has ended, whichever way.
 */
export async function putKey(
    connection: Connection,
    password: string,
    publicKey: string,
    deps: PutDeps = PUT_DEPS
): Promise<PutAnswer> {
    const helper = await deps.askpass(password);
    let done: { code: number; stderr: string };
    try {
        done = await deps.run(putArgs(connection), helper.env, `${publicKey.trim()}\n`);
    } finally {
        await helper.close();
    }
    if (done.code === 0) return { put: true };
    if (helper.asked() > 1) return { moreThanPassword: true };
    if (helper.asked() === 0 && offersNoPassword(done.stderr)) return { noPassword: true };
    return { failed: firstLine(done.stderr) };
}
