// Layer 4, test tool. What npm run test:quick and npm run test:landing share: where the project
// root is, a command run with its output kept and its time taken, the report line for one command,
// and the ASCII gate.
//
// A command runs in a process group of its own so that a time limit can stop it and everything it
// started. Its output is kept whole and printed when it ends, so two commands running together
// never interleave their lines.

import { spawn } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The oculus folder: the working directory of every command, whatever the caller's. */
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** The folder of the installed tools' launchers. */
export const BIN = join(ROOT, 'node_modules', '.bin');

/**
 * The ASCII gate of agents/spec.md: it prints the path, line and text of every line holding a byte
 * outside printable ASCII under src, tests and config, where config alone may hold an accented
 * Latin letter, and prints nothing when the tree is clean. A folder that does not exist is left
 * out of the search.
 */
export const ASCII_GATE = String.raw`LC_ALL=C perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/; close ARGV if eof' $(find src tests bin config -type f ! -name local.yml 2> /dev/null)`;

/** Stop a command and everything it started: the end signal now, the kill signal after 3 s. */
function stop(child) {
    const send = (name) => {
        try {
            process.kill(-child.pid, name);
        } catch {
            // The group has ended already.
        }
    };
    send('SIGTERM');
    setTimeout(() => send('SIGKILL'), 3000).unref();
}

/**
 * Run a command from ROOT and answer, once it has ended, its name, whether it exited 0, the time it
 * took in ms, its output (standard output and standard error together) and whether the time limit
 * stopped it. A limit of 0 is no limit. The variables in `extra` are added to the command's
 * environment.
 */
export function runTask(name, command, args, limit = 0, extra = {}) {
    const started = Date.now();
    const env = { ...process.env, NO_COLOR: '1', ...extra };
    delete env.FORCE_COLOR;
    return new Promise((done) => {
        let output = '';
        let cut = false;
        let timer = null;
        const finish = (code) => {
            if (timer !== null) clearTimeout(timer);
            done({ name, ok: code === 0, ms: Date.now() - started, output, cut });
        };
        const stdio = ['ignore', 'pipe', 'pipe'];
        const child = spawn(command, args, { cwd: ROOT, env, detached: true, stdio });
        child.stdout.setEncoding('utf8');
        child.stderr.setEncoding('utf8');
        child.stdout.on('data', (chunk) => (output += chunk));
        child.stderr.on('data', (chunk) => (output += chunk));
        child.on('error', (error) => {
            output += `${error.message}\n`;
            finish(1);
        });
        child.on('close', (code) => finish(code ?? 1));
        if (limit > 0) {
            timer = setTimeout(() => {
                cut = true;
                stop(child);
            }, limit);
        }
    });
}

/** The last line of an output that holds any text, or an empty string. */
export function lastLine(output) {
    const lines = output.split('\n').filter((line) => line.trim() !== '');
    return lines.length === 0 ? '' : lines[lines.length - 1].trim();
}

/** A time in ms as seconds with one decimal. */
export function seconds(ms) {
    return (ms / 1000).toFixed(1);
}

/** The answer of the ASCII gate: red when it printed a line or exited with an error. */
export function judgeAscii(result) {
    return { ...result, ok: result.ok && result.output.trim() === '' };
}

/**
 * Print one command's line, and its whole output when it failed, so that a red names what to fix.
 * A green command prints the last line of its output, which is the tool's own summary.
 */
export function show(result) {
    const time = `${seconds(result.ms)} s`;
    if (result.ok) {
        const summary = lastLine(result.output);
        console.log(`ok      ${result.name} (${time})${summary === '' ? '' : `: ${summary}`}`);
        return;
    }
    console.log(`FAILED  ${result.name} (${time})`);
    console.log(result.output.trimEnd());
}
