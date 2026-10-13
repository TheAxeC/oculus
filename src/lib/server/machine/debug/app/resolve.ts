// Layer 2, server. What a launch of an app's debugger does to a `launch.yml` entry before the
// adapter sees it: every text in it has its placeholders filled (`${file}`, `${workspaceFolder}`
// and the others fillText knows), the providers of the type resolve it, and the adapter is
// started as the debugger's manifest or the app's descriptor factory says. The entry's own keys
// beside the ones oculus reads are checked against the debugger's `configurationAttributes` when
// the file is read (launch/read.ts), so a key the debugger does not name never gets here.

import { join, isAbsolute } from 'node:path';
import type { AppDebugger, CommandContext, TerminalRefusal } from '../../../../data/model/index.ts';
import { fillText } from '../../runs/commands/placeholders.ts';

/** What a debugger's manifest says to run, as the host's `DebugAdapterExecutable` takes it. */
export type ManifestExecutable = {
    command: string;
    args: string[];
    options: { cwd: string };
};

/** A refusal of the placeholders: the word and the placeholder it is about. */
export type FillRefusal = { error: TerminalRefusal; names: string[] };

/** A value with the placeholders of every text in it filled, or the first refusal. */
export function fillConfiguration(value: unknown, context: CommandContext, repo: string): unknown {
    if (typeof value === 'string') return fillText(value, context, repo);
    if (Array.isArray(value)) {
        const out: unknown[] = [];
        for (const item of value) {
            const filled = fillConfiguration(item, context, repo);
            if (isRefusal(filled)) return filled;
            out.push(filled);
        }
        return out;
    }
    if (typeof value === 'object' && value !== null) {
        const out: Record<string, unknown> = {};
        for (const [key, item] of Object.entries(value)) {
            const filled = fillConfiguration(item, context, repo);
            if (isRefusal(filled)) return filled;
            out[key] = filled;
        }
        return out;
    }
    return value;
}

/** Whether a filled value is the refusal and not a value. */
export function isRefusal(value: unknown): value is FillRefusal {
    return (
        typeof value === 'object' &&
        value !== null &&
        'error' in value &&
        'names' in value &&
        Array.isArray((value as { names: unknown }).names)
    );
}

/**
 * The executable a debugger's manifest names, or null when it names none. `node` as the runtime is
 * the Node that runs oculus; any other runtime is a program on the PATH; with no runtime the
 * `program` is the executable. A `program` is a path inside the app's folder.
 */
export function manifestExecutable(
    debuggerOf: AppDebugger,
    folder: string,
    node: string
): ManifestExecutable | null {
    if (debuggerOf.program === '') return null;
    const program = isAbsolute(debuggerOf.program)
        ? debuggerOf.program
        : join(folder, debuggerOf.program);
    if (debuggerOf.runtime === '') {
        return { command: program, args: debuggerOf.args, options: { cwd: folder } };
    }
    const command = debuggerOf.runtime === 'node' ? node : debuggerOf.runtime;
    return {
        command,
        args: [...debuggerOf.runtimeArgs, program, ...debuggerOf.args],
        options: { cwd: folder }
    };
}
