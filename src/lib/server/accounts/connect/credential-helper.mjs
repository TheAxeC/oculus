// Layer 2, server. Oculus's git credential helper, run by git, never by the server: every git
// oculus starts and every terminal it opens names it for the credential address of each git host
// the reader signed in to in Account setup whose `sign_in` row names that address
// (server/core/git/credentials.ts), as
// `!ELECTRON_RUN_AS_NODE=1 '<program>' '<this file>' '<key>' '<address>' <action>`. It is plain
// node with no import of oculus's own, since git runs it with the program alone, and it ships with
// `src`.
//
// It reads git's request from standard input (`protocol`, `host` and `port`, one `key=value` a
// line, up to an empty line or the end), and for `get` reads the one git host file it is named
// for in `~/.oculus/connect/` (`git-<key>.json`) and, when the request's origin is the address it
// is named for and the file's `credential_address` is that address too, answers
// `username=<login>` and `password=<token>` from it. It answers nothing for `store` and `erase`,
// for any other origin, for a key that is no row key, for a missing or broken file, and for a
// login or token holding a line break, and it always exits 0, so git goes on to ask as it would
// without it. It writes nothing to its error output and nothing anywhere but its one answer.

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** An https origin: the scheme, the host and an optional port, nothing after. */
const ORIGIN = /^https:\/\/[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*(:[0-9]{1,5})?$/;

/** A row key, the words a git host's file name is made of. */
const ROW_KEY = /^[a-z0-9_-]+$/;

/** The fields of git's request, one `key=value` a line, up to an empty line. */
function requestOf(text) {
    const fields = {};
    for (const line of text.split('\n')) {
        if (line === '') break;
        const at = line.indexOf('=');
        if (at > 0) fields[line.slice(0, at)] = line.slice(at + 1);
    }
    return fields;
}

/** The request's origin, the default port 443 left out, or null for anything but https. */
function originOf(fields) {
    if (fields.protocol !== 'https' || typeof fields.host !== 'string') return null;
    let host = fields.host;
    if (typeof fields.port === 'string' && fields.port !== '' && !host.includes(':')) {
        host = `${host}:${fields.port}`;
    }
    if (host.endsWith(':443')) host = host.slice(0, -4);
    const origin = `https://${host}`;
    return ORIGIN.test(origin) ? origin : null;
}

/** Text that may stand in one line of the answer. */
function oneLine(value) {
    return typeof value === 'string' && value !== '' && !/[\r\n\0]/.test(value);
}

/**
 * The login and the token of the file of `key`, when its credential address is `address`, or
 * null.
 */
function credentialOf(key, address) {
    if (typeof key !== 'string' || !ROW_KEY.test(key)) return null;
    let held;
    try {
        held = JSON.parse(
            readFileSync(join(homedir(), '.oculus', 'connect', `git-${key}.json`), 'utf8')
        );
    } catch {
        return null;
    }
    if (held === null || typeof held !== 'object') return null;
    if (held.credential_address !== address) return null;
    return oneLine(held.login) && oneLine(held.token)
        ? { login: held.login, token: held.token }
        : null;
}

/** Read standard input to its end. */
function input() {
    return new Promise((answer) => {
        const parts = [];
        process.stdin.on('data', (part) => parts.push(part));
        process.stdin.on('end', () => answer(Buffer.concat(parts).toString('utf8')));
        process.stdin.on('error', () => answer(''));
    });
}

const [key, address, action] = process.argv.slice(2);
const text = await input();
if (action === 'get' && typeof address === 'string' && ORIGIN.test(address)) {
    const origin = originOf(requestOf(text));
    const found = origin === address ? credentialOf(key, address) : null;
    if (found !== null) process.stdout.write(`username=${found.login}\npassword=${found.token}\n`);
}
process.exitCode = 0;
