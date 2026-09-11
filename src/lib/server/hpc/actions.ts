// Layer 2, server. Explicit Live HPC actions. IDs and cached paths are validated before either can enter a remote command.
import { run, type Runner } from './ssh.ts';

export const JOB_ID = /^\d+(_\d+)?(\.\w+)?$/;
export const SAFE_PATH = /^\/[^'"\\\s][^'"\\\n]*$/;
const cache = new Map<string, string>();
const PATH = '@@oculus:logpath=';
const TIMEOUT = '@@oculus:logtimeout@@';

export function validId(id: string): boolean {
    return JOB_ID.test(id);
}
export function safePath(path: string): string {
    const value = path.trim();
    return SAFE_PATH.test(value) ? value : '';
}

export async function cancel(
    host: string,
    id: string,
    runner: Runner = run
): Promise<{ status: string; hint?: string }> {
    if (!validId(id)) return { status: 'error', hint: 'invalid job id' };
    const result = await runner(host, `scancel ${id}`, 20000);
    return result.code === 0
        ? { status: 'ok' }
        : { status: 'error', hint: result.stderr.trim() || 'scancel failed' };
}

export async function log(
    host: string,
    id: string,
    runner: Runner = run
): Promise<{ status: string; log: string; path: string }> {
    if (!validId(id)) return { status: 'error', log: '', path: '' };
    const held = safePath(cache.get(id) ?? '');
    const remote = `jid=${id}; p='${held}'; tmo=0; [ -n "$p" ] && [ ! -f "$p" ] && p=""; if [ -z "$p" ]; then p=$(scontrol show job "$jid" 2>/dev/null | tr " " "\\n" | sed -n "s/^StdOut=//p" | head -1); [ -n "$p" ] && [ ! -f "$p" ] && p=""; fi; if [ -z "$p" ]; then wd=$(sacct -X -j "$jid" -o WorkDir%600 -Pn 2>/dev/null | head -1); if [ -n "$wd" ]; then p=$(timeout 20 sh -c 'wd=$1; jid=$2; p=$(ls -t "$wd"/hpc/logs/*"$jid"* 2>/dev/null | head -1); [ -z "$p" ] && p=$(ls -t "$wd"/logs/*"$jid"* 2>/dev/null | head -1); [ -z "$p" ] && p=$(ls -t "$wd"/slurm-"$jid".out 2>/dev/null | head -1); [ -z "$p" ] && p=$(ls -t "$wd"/*"$jid"*.out 2>/dev/null | head -1); [ -z "$p" ] && p=$(ls -t "$wd"/*/logs/*"$jid"* 2>/dev/null | head -1); echo "$p"' _ "$wd" "$jid"); [ $? = 124 ] && tmo=1; fi; fi; if [ -n "$p" ] && [ -f "$p" ]; then echo "${PATH}$p"; tail -n 200 "$p"; elif [ "$tmo" = 1 ]; then echo "${TIMEOUT}"; fi`;
    try {
        const result = await runner(host, remote, 55000);
        const lines = result.stdout.split('\n');
        const path = safePath(
            lines.find((line) => line.startsWith(PATH))?.slice(PATH.length) ?? ''
        );
        if (path) cache.set(id, path);
        if (lines.includes(TIMEOUT)) return { status: 'timeout', log: '', path: '' };
        return {
            status: result.code === 0 ? 'ok' : 'error',
            path,
            log: lines
                .filter((line) => !line.startsWith(PATH))
                .join('\n')
                .trim()
        };
    } catch (error) {
        return {
            status:
                error instanceof Error && error.message.includes('timeout') ? 'timeout' : 'error',
            log: '',
            path: ''
        };
    }
}
