// Layer 4, tool. The scratch folder utils/shots/shots.mjs takes the screenshots in, and the
// environment every program it starts runs with.
//
// The folder is made under /tmp, so the path of tmux's socket (`<folder>/tmux/tmux-<uid>/default`)
// is a few dozen characters: a socket path may hold at most 104 on macOS, and the per-user
// temporary folder macOS gives a process is a path of about fifty characters on its own. It holds
// the copy of the demo hub (`demo`, the fixture itself is only read), the server's HOME (`home`),
// tmux's folder (`tmux`), the temporary folder of every program the command starts (`tmp`), the
// stand-ins (`bin`) and the three captures (`shots`).
//
// The stand-ins are the programs a server may run that reach past this machine or onto the
// screen: ssh and its copies, the Claude and Codex programs, gh, and the macOS commands that open
// a file or run a script. Each is `#!/bin/sh` then `exit 255`, put first on the PATH the programs
// get, so a server on the copy reaches none of the real ones; the server finds a program on PATH
// only when it may run it, so each is made executable for everyone.
//
// The environment is this process's with HOME, TMUX_TMPDIR, TMPDIR and PATH set to the scratch
// folder's, and without the variables that point a program back at the reader's own sessions,
// configuration or git: TMUX and TMUX_PANE (with TMUX set, a tmux command talks to the server it
// names, so `tmux kill-server` would end the reader's own), CLAUDE_CONFIG_DIR and CODEX_HOME, the
// XDG folders of configuration, data, state and cache, and every GIT_ variable.

import {
    chmodSync,
    cpSync,
    mkdirSync,
    mkdtempSync,
    realpathSync,
    rmSync,
    statSync,
    writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';

/** The demo hub the copy is made from, relative to the repository root. */
export const FIXTURE = join('tests', 'fixtures', 'hubs', 'demo');

/** The programs a stand-in takes the place of. */
const STAND_INS = ['claude', 'codex', 'gh', 'open', 'osascript', 'scp', 'sftp', 'ssh'];

/** What each stand-in holds: a program that does nothing and fails. */
const STAND_IN = '#!/bin/sh\nexit 255\n';

/** The mode of a stand-in: a program everyone may run. */
const STAND_IN_MODE = 0o755;

/** The variables of this process's environment no program the command starts is given. */
const DROPPED = [
    'TMUX',
    'TMUX_PANE',
    'CLAUDE_CONFIG_DIR',
    'CODEX_HOME',
    'XDG_CONFIG_HOME',
    'XDG_DATA_HOME',
    'XDG_STATE_HOME',
    'XDG_CACHE_HOME'
];

/** The temporary folder the command makes its folders in: /tmp, or the system's where none is. */
function tempBase() {
    try {
        if (statSync('/tmp').isDirectory()) return '/tmp';
    } catch {
        // No /tmp on this machine: the system's temporary folder is the place left.
    }
    return tmpdir();
}

/** A new, empty folder under the temporary folder, by its real path, its name starting `prefix`. */
export function freshFolder(prefix) {
    return realpathSync(mkdtempSync(join(tempBase(), prefix)));
}

/** Remove a folder the command made, and everything in it; a folder already gone is no error. */
export function removeFolder(dir) {
    rmSync(dir, { recursive: true, force: true });
}

/**
 * Make the scratch folder with everything in it but the copy's own changes, which
 * utils/shots/hub.mjs makes.
 *
 * @param {string} root the repository root
 * @returns {{ dir: string, hub: string, home: string, tmux: string, tmp: string, bin: string,
 *     shots: string }}
 */
export function makeScratch(root) {
    const dir = freshFolder('oculus-shots-');
    const scratch = {
        dir,
        hub: join(dir, 'demo'),
        home: join(dir, 'home'),
        tmux: join(dir, 'tmux'),
        tmp: join(dir, 'tmp'),
        bin: join(dir, 'bin'),
        shots: join(dir, 'shots')
    };
    // The caller holds no scratch folder until this answers, so a failure here removes its own.
    try {
        for (const folder of [
            scratch.home,
            scratch.tmux,
            scratch.tmp,
            scratch.bin,
            scratch.shots
        ]) {
            mkdirSync(folder);
        }
        cpSync(join(root, FIXTURE), scratch.hub, { recursive: true });
        for (const name of STAND_INS) {
            const path = join(scratch.bin, name);
            writeFileSync(path, STAND_IN);
            // The mode a write asks for is narrowed by the umask, so the mode is set after it.
            chmodSync(path, STAND_IN_MODE);
        }
    } catch (error) {
        removeFolder(dir);
        throw error;
    }
    return scratch;
}

/**
 * The environment of every program the command starts once the scratch folder is made.
 *
 * @param {{ home: string, tmux: string, tmp: string, bin: string }} scratch
 * @returns {NodeJS.ProcessEnv}
 */
export function scratchEnv(scratch) {
    const kept = Object.entries(process.env).filter(
        ([name]) => !DROPPED.includes(name) && !name.startsWith('GIT_')
    );
    return {
        ...Object.fromEntries(kept),
        HOME: scratch.home,
        TMUX_TMPDIR: scratch.tmux,
        TMPDIR: scratch.tmp,
        PATH: `${scratch.bin}${delimiter}${process.env.PATH ?? ''}`
    };
}
