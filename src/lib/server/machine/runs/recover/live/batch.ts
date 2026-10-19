// Layer 2, server. Recover's section of the Live HPC batch (machine/hpc/poll.ts), which runs it in
// its one ssh command per poll. The section lists oculus's sessions on the socket
// `oculus-recover`, each with the bytes of the folder of the dataset its name gives (`du -sb`),
// and for each dataset Recover follows on the cluster the bytes of its folder and the last lines
// of its fetch log and of its latest job's output. Every line the section prints that is not log
// text starts with a marker, so the answer is read back line by line.

import { shellWord } from '../../../pty/shell-word.ts';
import { clusterLogTails, sessionName, SOCKET, type ClusterPlace } from '../cluster.ts';
import { pathWord } from '../plan.ts';
import { lastLines } from './log.ts';

const SESSION = '@@oculus:session ';
const RUN = '@@oculus:run ';
const BYTES = '@@oculus:bytes ';

/**
 * The command printing the marker and a folder's bytes, the bytes left out when the folder is
 * absent or `du` takes over five seconds, so one slow folder never holds the Live HPC poll.
 */
function bytesLine(folder: string): string {
    return `printf '%s%s\\n' ${shellWord(BYTES)} "$(timeout 5 du -sb ${pathWord(folder)} 2>/dev/null | cut -f 1)"`;
}

/**
 * The section's commands: each session on the socket with the bytes of the folder of the dataset
 * of `places` it names, then for each run of `followed` its folder's bytes and its log lines.
 * `home` is this Mac's home folder, where the job records are kept.
 */
export function sectionCommand(
    places: ClusterPlace[],
    followed: ClusterPlace[],
    home: string
): string {
    return [
        `tmux -L ${SOCKET} ls -F '#{session_name}' 2>/dev/null | while IFS= read -r s; do`,
        `    printf '%s%s\\n' ${shellWord(SESSION)} "$s"`,
        '    case "$s" in',
        ...places.map(
            (one) =>
                `        ${shellWord(sessionName(one.hub, one.key))}) ${bytesLine(one.folder)} ;;`
        ),
        '    esac',
        'done',
        ...followed.flatMap((one) => [
            `printf '%s\\n' ${shellWord(`${RUN}${one.hub}/${one.key}`)}`,
            bytesLine(one.folder),
            clusterLogTails(one, home)
        ]),
        'true'
    ].join('\n');
}

/** One session the section listed, with its folder's bytes when its name gives a dataset. */
type SectionSession = { name: string; bytes: number | null };

/** One followed run as the section answered it, by `<hub>/<key>`. */
type SectionRun = { bytes: number | null; log: string[] };

/** What one section answered. */
export type SectionAnswer = { sessions: SectionSession[]; runs: Map<string, SectionRun> };

/** A byte count as `du` prints it, or null for anything else. */
function bytesOf(text: string): number | null {
    return /^\d+$/.test(text) ? Number(text) : null;
}

/** Read the section's answer back into its sessions and its followed runs. */
export function readSection(text: string): SectionAnswer {
    const sessions: SectionSession[] = [];
    const runs = new Map<string, SectionRun>();
    let at: { bytes: number | null } | null = null;
    let log: string[] | null = null;
    for (const line of text.split('\n')) {
        if (line.startsWith(SESSION)) {
            const one: SectionSession = { name: line.slice(SESSION.length), bytes: null };
            sessions.push(one);
            at = one;
            log = null;
        } else if (line.startsWith(RUN)) {
            const one: SectionRun = { bytes: null, log: [] };
            runs.set(line.slice(RUN.length), one);
            at = one;
            log = one.log;
        } else if (line.startsWith(BYTES)) {
            if (at !== null) at.bytes = bytesOf(line.slice(BYTES.length).trim());
        } else if (log !== null) {
            log.push(line);
        }
    }
    for (const one of runs.values()) one.log = lastLines(one.log.join('\n'));
    return { sessions, runs };
}

/**
 * The hub and the key a session's name gives: the longest hub name it starts with, or no hub and
 * the whole name as the key.
 */
export function sessionOwner(name: string, hubs: string[]): { hub: string; key: string } {
    const hub = [...hubs]
        .sort((one, two) => two.length - one.length)
        .find((one) => name.startsWith(`${one}-`));
    return hub === undefined ? { hub: '', key: name } : { hub, key: name.slice(hub.length + 1) };
}
