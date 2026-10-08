// Layer 2, server. How each linter that runs as one process per file is called: where its program
// is, its arguments as a list, the folder it runs in and the exit codes that carry findings. ESLint
// is not here; the repository's own ESLint is held by eslint.ts.
//
// A program is the path `lint.<id>_path` names, else the one on the PATH oculus was started with. A
// named path is an absolute path or one that starts with `~`, and a path that is relative, names a
// folder, names a missing file or names a file that cannot be run is a program that is not found:
// the PATH is not tried in its place, since the reader named a program and another one would be a
// different linter.
//
// ChkTeX is called with the arguments `lint.chktex_args` holds, the rc file found beside the file
// or in the root (`-l`, as LaTeX Workshop passes it), no `\input` followed (`-I0`) and the output
// format the reader reads. The width a tab counts in the rc file (`TabSize`, 8 without one) is read
// for the column conversion.

import { readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join } from 'node:path';
import type { LintSettings } from '../../../../data/sources/config.ts';
import { programPath } from '../../../core/program.ts';
import { expandHome } from '../../../files/files.ts';

/** The linters that run as one process per file. */
export type ProcessLinter = 'chktex' | 'ruff' | 'shellcheck';

/** What one run of a linter is given: the program, its arguments, its folder and its exit codes. */
export type Plan = {
    program: string;
    args: string[];
    cwd: string;
    findings: readonly number[];
};

/** The program, or why it is not found: the path the reader named, empty for the PATH. */
export type Program = { path: string } | { missing: string };

/** The ChkTeX output format: line, column, length, kind, number and message, one warning a line. */
const CHKTEX_FORMAT = '-f%l:%c:%d:%k:%n:%m\n';

/** The width a tab counts when no rc file says. */
const DEFAULT_TAB_SIZE = 8;

/** Where a linter's program is, by `lint.<id>_path` and the PATH of the environment. */
export function programOf(
    id: ProcessLinter,
    settings: LintSettings,
    env: NodeJS.ProcessEnv
): Program {
    const named = settings.paths[id];
    if (named === '') {
        const found = programPath(id, env);
        return found === null ? { missing: '' } : { path: found };
    }
    const path = expandHome(named);
    if (!isAbsolute(path)) return { missing: named };
    const found = programPath(path, env);
    return found === null ? { missing: named } : { path: found };
}

/** Whether a path is a file. */
function isFile(path: string): boolean {
    try {
        return statSync(path).isFile();
    } catch {
        return false;
    }
}

/**
 * The `.chktexrc` ChkTeX is given: the one the arguments name with `-l`, else the one beside the
 * file, else the one in the root's folder. Null when there is none.
 */
export function chktexRc(args: readonly string[], file: string, rootDir: string): string | null {
    const at = args.indexOf('-l');
    if (at >= 0) {
        return at + 1 < args.length && isFile(args[at + 1]) ? args[at + 1] : null;
    }
    for (const folder of [dirname(file), rootDir]) {
        const rc = join(folder, '.chktexrc');
        if (isFile(rc)) return rc;
    }
    return null;
}

/** The width a tab counts in the rc file ChkTeX reads, 8 when none says. */
export function tabSizeOf(rc: string | null): number {
    for (const path of rc === null ? [join(homedir(), '.chktexrc')] : [rc]) {
        try {
            const size = /^\s*TabSize\s*=\s*(\d+)\s*$/m.exec(readFileSync(path, 'utf8'))?.[1];
            if (size !== undefined) return Number(size);
        } catch {
            // No rc file to read: the width stays the default.
        }
    }
    return DEFAULT_TAB_SIZE;
}

/** The call of a linter on one file, in the file's folder. */
export function planOf(
    id: ProcessLinter,
    program: string,
    file: string,
    settings: LintSettings,
    rc: string | null
): Plan {
    const cwd = dirname(file);
    switch (id) {
        case 'chktex': {
            const rcArgs = rc === null || settings.chktexArgs.includes('-l') ? [] : ['-l', rc];
            return {
                program,
                args: [...settings.chktexArgs, ...rcArgs, '-q', '-I0', CHKTEX_FORMAT, file],
                cwd,
                findings: [0, 2, 3]
            };
        }
        case 'ruff':
            return {
                program,
                args: ['check', '--output-format', 'json', '--no-cache', '--force-exclude', file],
                cwd,
                findings: [0, 1]
            };
        case 'shellcheck':
            return { program, args: ['--format=json1', file], cwd, findings: [0, 1] };
    }
}
