// Layer 2, server. The Python interpreter pyright is answered for a root: the ones a root can use,
// the one in force, and the path pyright is given.
//
// A root offers `<root>/.venv/bin/python`, then `<root>/venv/bin/python`, then the `python3` of
// the oculus process's PATH, then an interpreter the reader typed a path to. The reader's
// remembered choice is in force while it exists, else the first of those that exists. Each
// one that is run is asked once, with an argument array and a five second limit, for
// `sys.executable`, `sys.version_info[:3]`, `sys.prefix` and `sys.base_prefix`; one that does not
// answer in that time, or answers no version, is left out of the list.
//
// A repository's own interpreter is a program the repository supplies, so DESIGN.md's processes
// rule holds for it: it is run, here to read its version and by pyright to read its search paths,
// only after the reader approved its path on this machine (server/machine/approvals/approvals.ts,
// the `interpreter:` kind). Until then it is listed with the version its `pyvenv.cfg` names, which
// is a file read and not a run, and marked not approved, and pyright is given the PATH `python3`.
// An interpreter the reader typed a path to is text the reader wrote into oculus and needs no
// approval.
//
// A venv interpreter is passed to pyright by the path it was found at, never resolved through its
// link, since the venv is found from that path; the PATH `python3` is passed as the
// `sys.executable` it answers, which for a version manager's shim is the program behind it.

import { execFile } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import type { LspInterpreter } from '../../../../data/model/index.ts';

/** The milliseconds an interpreter may take to answer. */
const PROBE_MS = 5000;

/** The Python the probe runs: the four facts as one JSON line. */
const PROBE =
    'import sys,json;print(json.dumps([sys.executable,list(sys.version_info[:3]),sys.prefix,sys.base_prefix]))';

/** The program the PATH's Python is found by. */
const PATH_PYTHON = 'python3';

/** Run a program with an argument array and answer its standard output, or null on any failure. */
export type Run = (command: string, args: string[]) => Promise<string | null>;

/** The real runner: `execFile`, never a shell, with the limit above. */
const runProgram: Run = (command, args) =>
    new Promise((resolve) => {
        execFile(
            command,
            args,
            { timeout: PROBE_MS, maxBuffer: 1024 * 1024, windowsHide: true },
            (error, stdout) => resolve(error === null ? stdout : null)
        );
    });

/** What an interpreter answered. */
type Answer = { executable: string; version: string; prefix: string; basePrefix: string };

/** The answer of one interpreter, or null when it did not answer or answered no version. */
async function ask(run: Run, program: string): Promise<Answer | null> {
    const out = await run(program, ['-c', PROBE]);
    if (out === null) return null;
    try {
        const [executable, version, prefix, basePrefix] = JSON.parse(out.trim()) as [
            unknown,
            unknown,
            unknown,
            unknown
        ];
        if (typeof executable !== 'string' || !Array.isArray(version) || version.length < 3) {
            return null;
        }
        if (typeof prefix !== 'string' || typeof basePrefix !== 'string') return null;
        return {
            executable,
            version: version.slice(0, 3).join('.'),
            prefix,
            basePrefix
        };
    } catch {
        return null;
    }
}

/** The version a venv's `pyvenv.cfg` names, read as a file and not by running the interpreter. */
function configuredVersion(interpreter: string, read: (path: string) => string | null): string {
    const cfg = read(join(dirname(dirname(interpreter)), 'pyvenv.cfg'));
    if (cfg === null) return '';
    const found = /^version(?:_info)?\s*=\s*(\d+\.\d+(?:\.\d+)?)/m.exec(cfg);
    return found?.[1] ?? '';
}

/** What the list of a root is made from. */
export type InterpreterOptions = {
    /** The repository's real path. */
    root: string;
    /** The interpreter the reader chose for it, absent when none. */
    chosen?: string;
    /** Whether the reader approved this repository's interpreter. */
    approved: (interpreter: string) => boolean;
    run?: Run;
    exists?: (path: string) => boolean;
    read?: (path: string) => string | null;
};

/** The interpreters a root can use, the one in force, and the path pyright is given. */
export type Interpreters = {
    list: LspInterpreter[];
    /** The path of the interpreter in force, null when the list is empty. */
    inForce: string | null;
    /** What pyright is answered as its `pythonPath`, null when it is given none. */
    effective: string | null;
    /**
     * The `sys.prefix` and `sys.base_prefix` the effective interpreter answered, empty when there
     * is none: the folders its standard library and installed packages live under.
     */
    prefixes: string[];
};

function readOrNull(path: string): string | null {
    try {
        return readFileSync(path, 'utf8');
    } catch {
        return null;
    }
}

/** The interpreters of a root, in the order the picker lists them. */
export async function interpretersFor(options: InterpreterOptions): Promise<Interpreters> {
    const run = options.run ?? runProgram;
    const exists = options.exists ?? existsSync;
    const read = options.read ?? readOrNull;
    const list: LspInterpreter[] = [];
    const answered = new Map<string, Answer>();

    for (const folder of ['.venv', 'venv']) {
        const path = join(options.root, folder, 'bin', 'python');
        if (!exists(path)) continue;
        if (!options.approved(path)) {
            list.push({
                path,
                version: configuredVersion(path, read),
                venv: folder,
                found: 'venv',
                approved: false
            });
            continue;
        }
        const answer = await ask(run, path);
        if (answer === null) continue;
        answered.set(path, answer);
        list.push({
            path,
            version: answer.version,
            venv: folder,
            found: 'venv',
            approved: true
        });
    }

    const system = await ask(run, PATH_PYTHON);
    if (system !== null) {
        answered.set(system.executable, system);
        list.push({
            path: system.executable,
            version: system.version,
            venv: venvName(system),
            found: 'path',
            approved: true
        });
    }

    const chosen = options.chosen;
    if (chosen !== undefined && !list.some((one) => one.path === chosen) && exists(chosen)) {
        const answer = await ask(run, chosen);
        if (answer !== null) {
            answered.set(chosen, answer);
            list.push({
                path: chosen,
                version: answer.version,
                venv: venvName(answer),
                found: 'typed',
                approved: true
            });
        }
    }

    const inForce =
        chosen !== undefined && list.some((one) => one.path === chosen)
            ? chosen
            : (list[0]?.path ?? null);
    const forced = list.find((one) => one.path === inForce);
    // A repository's interpreter that is not approved leaves pyright the PATH's Python.
    const effective =
        forced === undefined
            ? null
            : forced.approved
              ? forced.path
              : (list.find((one) => one.found === 'path')?.path ?? null);
    const found = effective === null ? undefined : answered.get(effective);
    const prefixes = found === undefined ? [] : [...new Set([found.prefix, found.basePrefix])];
    return { list, inForce, effective, prefixes };
}

/** The folder name of the venv an interpreter runs in, null when it is not in one. */
function venvName(answer: Answer): string | null {
    return answer.prefix === answer.basePrefix ? null : basename(answer.prefix);
}
