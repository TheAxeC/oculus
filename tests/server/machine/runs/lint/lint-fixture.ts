// Layer 4, test helper. What the lint route's tests run over: scratch roots holding files, linter
// programs that are scripts of the case's own recording the argument list they were given, an
// approvals file under the scratch directory, and the request the page sends.
//
// A recording program writes its arguments, each ended by a NUL byte, to the file named by the
// `LINT_RECORD` variable of the environment it is run in, and answers an empty list of findings.

import { chmodSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { LintRuns } from '../../../../../src/lib/server/machine/runs/lint/runs.ts';
import { HeldEslints } from '../../../../../src/lib/server/machine/runs/lint/eslint.ts';
import {
    handleLint,
    type LintRouteOptions
} from '../../../../../src/lib/server/machine/runs/lint/routes.ts';
import type { LintSettings } from '../../../../../src/lib/data/sources/config.ts';
import { fsWrites } from '../../../../../src/lib/server/core/json.ts';
import type { Root } from '../../../../../src/lib/server/files/files.ts';
import type { Clock } from '../../../../../src/lib/server/core/file-poll.ts';
import { scratchDir } from '../../../../fixtures/scratch.ts';

export const TOKEN = 'lint-test-token';

/** A program that records its arguments and prints `answer` on standard output. */
export function plantProgram(dir: string, name: string, answer: string): string {
    const path = join(dir, name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
        path,
        `#!/bin/sh\nprintf '%s\\0' "$@" > "$LINT_RECORD"\nprintf '%s' '${answer}'\n`
    );
    chmodSync(path, 0o755);
    return path;
}

/** The arguments a recording program was run with, or null when it did not run. */
export function recorded(file: string): string[] | null {
    try {
        return readFileSync(file, 'utf8').split('\0').slice(0, -1);
    } catch {
        return null;
    }
}

/** The settings of a case: every linter on, the paths named, ChkTeX's own arguments. */
export function settingsOf(paths: Partial<LintSettings['paths']> = {}): LintSettings {
    return {
        on: { chktex: true, ruff: true, eslint: true, shellcheck: true },
        paths: { chktex: '', ruff: '', shellcheck: '', ...paths },
        chktexArgs: ['-wall', '-n22', '-n30', '-e16', '-q']
    };
}

/**
 * A clock that runs a scheduled call only when the test moves it past the call's time. `armed(ms)`
 * settles once a call is scheduled to run `ms` from now, so a case moves the clock only after the
 * call it means to run exists.
 */
export function steppedClock(): Clock & {
    advance: (ms: number) => void;
    pending: () => number;
    armed: (ms: number) => Promise<void>;
} {
    let now = 0;
    let next = 1;
    const scheduled = new Map<number, { at: number; run: () => void }>();
    const waiting: { ms: number; settle: () => void }[] = [];
    return {
        setTimeout: (run, ms) => {
            const id = next++;
            scheduled.set(id, { at: now + ms, run });
            for (const one of waiting.filter((wait) => wait.ms === ms)) {
                waiting.splice(waiting.indexOf(one), 1);
                one.settle();
            }
            return id;
        },
        armed: (ms) =>
            new Promise((settle) => {
                waiting.push({ ms, settle });
            }),
        clearTimeout: (timer) => {
            scheduled.delete(timer as number);
        },
        pending: () => scheduled.size,
        advance: (ms) => {
            now += ms;
            for (const [id, one] of [...scheduled]) {
                if (one.at > now) continue;
                scheduled.delete(id);
                one.run();
            }
        }
    };
}

/** A scratch directory under the temporary directory, by its real path. */
export function scratch(prefix: string): string {
    return realpathSync(scratchDir(prefix));
}

/** Write a file with its folders. */
export function plant(path: string, text: string): string {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
    return path;
}

/** The route over the given roots, with its own runs, held ESLints and approvals file. */
export function route(
    roots: () => Root[],
    settings: () => LintSettings,
    extra: {
        env?: NodeJS.ProcessEnv;
        clock?: Clock;
        exited?: (pid: number) => void;
        limitMs?: number;
        approvals?: string;
    } = {}
): {
    options: LintRouteOptions;
    eslint: HeldEslints;
    approvals: string;
    post: (body: unknown, token?: string | null) => Promise<{ status: number; body: unknown }>;
} {
    const approvals = extra.approvals ?? join(scratch('oculus-lint-approvals-'), 'approvals.json');
    const eslint = new HeldEslints({
        roots: () => roots().map((root) => realpathSync(root.dir)),
        ...(extra.clock === undefined ? {} : { clock: extra.clock }),
        ...(extra.exited === undefined ? {} : { exited: extra.exited })
    });
    const options: LintRouteOptions = {
        settings,
        approvals: () => approvals,
        writes: fsWrites(),
        runs: new LintRuns(),
        eslint,
        env: extra.env ?? process.env,
        ...(extra.limitMs === undefined ? {} : { limitMs: extra.limitMs })
    };
    return {
        options,
        eslint,
        approvals,
        post: async (body, token = TOKEN) => {
            const headers: Record<string, string> = { 'content-type': 'application/json' };
            if (token !== null) headers['x-oculus-token'] = token;
            const response = await handleLint(
                new Request('http://localhost/api/lint', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body)
                }),
                TOKEN,
                roots(),
                options
            );
            return { status: response.status, body: await response.json() };
        }
    };
}

/** The text of the stand-in `eslint` package a scratch repository holds. */
const STAND_IN = `import { appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export class ESLint {
    constructor(options) {
        this.options = options;
        appendFileSync(join(options.cwd, 'starts.txt'), process.pid + '\\n');
    }
    async isPathIgnored() {
        return false;
    }
    async lintFiles(files) {
        this.file = files[0];
        await import(pathToFileURL(this.options.overrideConfigFile).href);
        if (files[0].includes('crash')) process.exit(3);
        if (files[0].includes('hang')) await new Promise(() => undefined);
        return [{ messages: [{ ruleId: 'no-undef', severity: 2, message: 'x is not defined', line: 1, column: 1 }] }];
    }
    getRulesMetaForResults() {
        const url = this.file.includes('docs')
            ? 'https://eslint.org/docs/rules/no-undef'
            : this.file.includes('plain')
              ? 'file:///etc/passwd'
              : 'javascript:alert(1)';
        return { 'no-undef': { docs: { url } } };
    }
}
`;

/**
 * A repository under `base` whose ESLint is a stand-in package: its `eslint.config.js` writes
 * `config.marker` beside itself when it is imported, and the stand-in imports the configuration it
 * is given as ESLint does, appends its process id to `starts.txt` when it is made, and answers one
 * message for every file, but exits on a file named `crash` and never answers one named `hang`. The
 * rule it reports names a `javascript:` documentation address, a `file:` one for a file named
 * `plain` and an `https:` one for a file named `docs`.
 * Returns the repository's folder.
 */
export function eslintRepo(base: string): string {
    const dir = join(base, 'repo');
    plant(join(dir, 'package.json'), '{ "type": "module" }\n');
    plant(
        join(dir, 'eslint.config.js'),
        `import { writeFileSync } from 'node:fs';\nwriteFileSync(new URL('./config.marker', import.meta.url), 'ran');\nexport default [];\n`
    );
    const pkg = join(dir, 'node_modules', 'eslint');
    plant(
        join(pkg, 'package.json'),
        '{ "name": "eslint", "version": "9.0.0", "type": "module", "main": "index.js" }\n'
    );
    plant(join(pkg, 'index.js'), STAND_IN);
    plant(join(dir, 'a.js'), 'x;\n');
    plant(join(dir, 'crash.js'), 'x;\n');
    plant(join(dir, 'hang.js'), 'x;\n');
    plant(join(dir, 'plain.js'), 'x;\n');
    plant(join(dir, 'docs.js'), 'x;\n');
    return dir;
}

/** The process ids the stand-in recorded, in the order the children started. */
export function starts(dir: string): number[] {
    try {
        return readFileSync(join(dir, 'starts.txt'), 'utf8')
            .split('\n')
            .filter((line) => line !== '')
            .map(Number);
    } catch {
        return [];
    }
}

/** Whether a process is running. */
export function alive(pid: number): boolean {
    try {
        process.kill(pid, 0);
        return true;
    } catch {
        return false;
    }
}

/**
 * The ends of ESLint children as `HeldEslints` tells of them: pass `told` as its `exited` option,
 * and `gone(pid)` settles once the process with that id has exited, whether it exited before or
 * after the call.
 */
export function exitWatch(): { told: (pid: number) => void; gone: (pid: number) => Promise<void> } {
    const ends = new Map<number, { done: Promise<void>; settle: () => void }>();
    const end = (pid: number) => {
        let one = ends.get(pid);
        if (one === undefined) {
            let settle = (): void => undefined;
            const done = new Promise<void>((resolve) => {
                settle = resolve;
            });
            one = { done, settle };
            ends.set(pid, one);
        }
        return one;
    };
    return { told: (pid) => end(pid).settle(), gone: (pid) => end(pid).done };
}
