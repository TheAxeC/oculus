// Layer 4, test helper. The project the revert check's cases run the check over: a rule, cases over
// it, and the dependencies reached by a link to this project's node_modules, so a case costs one
// vitest start rather than an install; with the ways a case writes over it, runs the check on it,
// stops the check by a signal and asks one function of the check what it answers.
//
// Every folder and file a case makes here is removed by sweepFixtures(), which the case file runs
// after each case, and every file a case locks or folder it leaves unwritable is opened first, so
// the removal can walk it.

import { chmodSync, mkdirSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { expect } from 'vitest';
import { scratchDir } from '../../fixtures/scratch.ts';

const made: string[] = [];
const locked: string[] = [];
const opened: string[] = [];

/** A path a case made outside a fixture, removed with the fixtures after the case. */
export function sweepAfter(path: string): void {
    made.push(path);
}

/**
 * A temporary directory for a run that may leave a folder it cannot remove, one whose write bit a
 * case took off; the sweep gives every folder under it its write bit back before removing it.
 */
export function unwritableTemp(): string {
    const dir = scratchDir('oculus-revert-kept-');
    opened.push(dir);
    return dir;
}

/** Unlock every file a case locked and remove every fixture made since the last sweep. */
export function sweepFixtures(): void {
    for (const path of locked.splice(0)) chmodSync(path, 0o600);
    for (const dir of opened.splice(0)) {
        spawnSync('chmod', ['-R', 'u+rwx', dir]);
        rmSync(dir, { recursive: true, force: true });
    }
    for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
}

/** The rule the fixture's cases are written over, whose second line the reverts name. */
export const RULE = ['export function allowed(size) {', '    return size > 2;', '}', ''].join('\n');

/**
 * The word a directive opens with, built here rather than written out.
 *
 * A line of a case file that reads as a directive would be read as one by the check itself when it
 * runs over that file, and would name a path only the fixture has.
 */
export const DIRECTIVE = ['//', 'revert:'].join(' ');

export const CASES = [
    "import { expect, it } from 'vitest';",
    "import { allowed } from '../src/rule.mjs';",
    '',
    "it('refuses a size under the limit', () => {",
    `    ${DIRECTIVE} src/rule.mjs "return size > 2;" => return true;`,
    '    expect(allowed(1)).toBe(false);',
    '});',
    '',
    "it('answers a size over the limit with a boolean', () => {",
    `    ${DIRECTIVE} src/rule.mjs "return size > 2;" => return true;`,
    '    expect(typeof allowed(3)).toBe("boolean");',
    '});',
    '',
    "it('names no revert of its own', () => {",
    '    expect(allowed(5)).toBe(true);',
    '});',
    ''
].join('\n');

/** A project the check can copy and run: the rule, the cases over it, and the dependencies. */
export function fixture(): string {
    const dir = scratchDir('oculus-revert-fixture-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    made.push(dir);
    mkdirSync(join(dir, 'src'), { recursive: true });
    mkdirSync(join(dir, 'tests'), { recursive: true });
    writeFileSync(join(dir, 'package.json'), '{ "name": "fixture", "private": true }\n');
    // A Vitest configuration of its own, so a run over the fixture never takes the one of a project
    // the fixture happens to sit in, as it does inside the copy the check makes of this project.
    writeFileSync(join(dir, 'vitest.config.mjs'), 'export default {};\n');
    writeFileSync(join(dir, 'src', 'rule.mjs'), RULE);
    writeFileSync(join(dir, 'tests', 'rule.test.js'), CASES);
    symlinkSync(join(process.cwd(), 'node_modules'), join(dir, 'node_modules'), 'dir');
    return dir;
}

/** The fixture with one file written over it, for a case that needs another shape. */
export function withFile(dir: string, rel: string, body: string): string {
    const full = join(dir, rel);
    expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
    return dir;
}

/**
 * The fixture with a file the case given the returned line locks as it runs in memory, after the
 * run's copy of the tree was made, so the copy a directive that falls back takes cannot copy it and
 * only a case proven in memory is proven at all. The line locks the real fixture's file through its
 * absolute path, outside the run's copy, which is why the lock reaches the fallback's copy: the
 * check sees what a case writes only inside its own run folder.
 */
export function withLockingCase(dir: string): string {
    const full = join(withFile(dir, 'locked.txt', 'a file the copy cannot read\n'), 'locked.txt');
    locked.push(full);
    return `chmodSync(${JSON.stringify(full)}, 0);`;
}

/** The check over the fixture, as the verification list runs it, with the environment given. */
export function run(
    dir: string,
    files: string[],
    env: NodeJS.ProcessEnv = process.env
): { out: string; status: number | null } {
    const held = spawnSync('node', ['bin/revert-check/revert-check.mjs', '--root', dir, ...files], {
        cwd: process.cwd(),
        encoding: 'utf8',
        env
    });
    return { out: held.stdout, status: held.status };
}

/** Where directives() resolves one directive to, or the problem that leaves it unproven. */
type Resolved = { first: number; last: number; problem: string };

/** The lines directives() resolves each directive of one fixture file to, with its problem. */
export function resolved(dir: string, file: string): Resolved[] {
    const call = `const m = await import('./bin/revert-check/directives.mjs'); process.stdout.write(JSON.stringify(m.directives(process.argv[1], [process.argv[2]]).map(({ first, last, problem }) => ({ first, last, problem }))));`;
    const done = spawnSync(process.execPath, ['--input-type=module', '-e', call, dir, file], {
        cwd: process.cwd(),
        encoding: 'utf8'
    });
    expect(done.status, done.stderr).toBe(0);
    return JSON.parse(done.stdout) as Resolved[];
}

/** The fixture with one case holding the given directive lines. */
export function caseWith(...lines: string[]): string {
    const body = [
        "it('the case', () => {",
        ...lines.map((one) => `    ${DIRECTIVE} ${one}`),
        '});'
    ];
    return withFile(fixture(), 'tests/rule.test.js', [...body, ''].join('\n'));
}

/** The import of the fixture's rule, for a case that calls it. */
export const RULE_IMPORT = ["import { allowed } from '../src/rule.mjs';"];

/** The imports of a case that calls the rule and locks a file. */
export const LOCK_IMPORTS = [...RULE_IMPORT, "import { chmodSync } from 'node:fs';"];

/** The fixture's cases file with one case of the given body lines, under the directive. */
export function oneCase(dir: string, imports: string[], name: string, body: string[]): string {
    return withFile(
        dir,
        'tests/rule.test.js',
        [
            ...imports,
            "import { expect, it } from 'vitest';",
            '',
            `it('${name}', async () => {`,
            `    ${DIRECTIVE} src/rule.mjs "return size > 2;" => return true;`,
            ...body.map((line) => `    ${line}`),
            '});',
            ''
        ].join('\n')
    );
}

/**
 * The check over the fixture as a process of its own, with a temporary directory of the case's,
 * stopped by SIGTERM once that directory holds the given count of the check's folders; the folders
 * of the check it still holds once the process has ended.
 */
export async function stoppedAt(dir: string, file: string, count: number): Promise<string[]> {
    const temp = scratchDir('oculus-revert-signal-');
    expect(resolve(temp).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    const child = spawn('node', ['bin/revert-check/revert-check.mjs', '--root', dir, file], {
        cwd: process.cwd(),
        env: { ...process.env, TMPDIR: temp },
        stdio: 'ignore'
    });
    const ended = new Promise<void>((done) => child.on('exit', () => done()));
    const folders = (): string[] =>
        readdirSync(temp).filter((name) => name.startsWith('oculus-revert-'));
    await expect.poll(folders, { timeout: 90000, interval: 100 }).toHaveLength(count);
    child.kill('SIGTERM');
    await ended;
    return folders();
}

/**
 * A case whose revert leaves something behind where a later case can see it: the module it calls,
 * the directive over that module, the case's imports and body, and what the later case imports and
 * asserts to hold the leftover absent.
 */
export type Writer = {
    source: string[];
    directive: string;
    imports: string[];
    body: string[];
    cleanImports: string[];
    clean: string[];
};

/** A revert that writes a note into the working directory rather than the folder it is given. */
export const NOTE_WRITER: Writer = {
    source: [
        "import { writeFileSync } from 'node:fs';",
        "import { join } from 'node:path';",
        'export function write(dir) {',
        "    const out = join(dir, 'note.txt');",
        "    writeFileSync(out, 'a note');",
        '}'
    ],
    directive: `"const out = join(dir, 'note.txt');" => const out = 'note.txt';`,
    imports: [
        "import { existsSync, mkdtempSync, rmSync } from 'node:fs';",
        "import { tmpdir } from 'node:os';",
        "import { join } from 'node:path';"
    ],
    body: [
        "const dir = mkdtempSync(join(tmpdir(), 'note-'));",
        'write(dir);',
        "const there = existsSync(join(dir, 'note.txt'));",
        'rmSync(dir, { recursive: true, force: true });',
        'expect(there).toBe(true);'
    ],
    cleanImports: ["import { existsSync } from 'node:fs';"],
    clean: ["expect(existsSync('note.txt')).toBe(false);"]
};

/** A revert that leaves a folder in the temporary directory, a sweep taken out. */
export const TEMP_WRITER: Writer = {
    source: [
        "import { mkdtempSync, rmSync } from 'node:fs';",
        "import { tmpdir } from 'node:os';",
        "import { join } from 'node:path';",
        'export function write() {',
        "    const dir = mkdtempSync(join(tmpdir(), 'residue-'));",
        '    rmSync(dir, { recursive: true, force: true });',
        '    return dir;',
        '}'
    ],
    directive: `"rmSync(dir, { recursive: true, force: true });" => delete`,
    imports: ["import { existsSync } from 'node:fs';"],
    body: ['expect(existsSync(write())).toBe(false);'],
    cleanImports: ["import { readdirSync } from 'node:fs';", "import { tmpdir } from 'node:os';"],
    clean: [
        "expect(readdirSync(tmpdir()).filter((one) => one.startsWith('residue-'))).toEqual([]);"
    ]
};

/**
 * A revert that takes every permission off a file of the tree, which its size and time keep; the
 * case run again with no revert does not give them back, as it only reads the file.
 */
export const LOCK_WRITER: Writer = {
    source: [
        "import { chmodSync, readFileSync } from 'node:fs';",
        'export function write(path) {',
        "    const text = readFileSync(path, 'utf8');",
        '    return text;',
        '}',
        'export const lock = chmodSync;'
    ],
    directive: `"const text = readFileSync(path, 'utf8');" => const text = (lock(path, 0), readFileSync(path, 'utf8'));`,
    imports: [],
    body: ["expect(write('data.txt')).toBe('data');"],
    cleanImports: ["import { readFileSync } from 'node:fs';"],
    clean: ["expect(readFileSync('data.txt', 'utf8')).toBe('data');"]
};

/** A revert that writes beside the working directory rather than into the folder it is given. */
export const UP_WRITER: Writer = {
    ...NOTE_WRITER,
    source: [
        "import { writeFileSync } from 'node:fs';",
        "import { join } from 'node:path';",
        'export function write(dir) {',
        "    const out = join(dir, 'up.txt');",
        "    writeFileSync(out, 'up');",
        '}'
    ],
    directive: `"const out = join(dir, 'up.txt');" => const out = join(process.cwd(), '..', 'up.txt');`,
    body: [
        "const dir = mkdtempSync(join(tmpdir(), 'up-'));",
        'write(dir);',
        "const there = existsSync(join(dir, 'up.txt'));",
        'rmSync(dir, { recursive: true, force: true });',
        'expect(there).toBe(true);'
    ],
    cleanImports: ["import { existsSync } from 'node:fs';", "import { join } from 'node:path';"],
    clean: ["expect(existsSync(join('..', 'up.txt'))).toBe(false);"]
};

/** A revert that leaves a folder in the temporary directory with its write permission taken off. */
export const STUCK_WRITER: Writer = {
    source: [
        "import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';",
        "import { tmpdir } from 'node:os';",
        "import { join } from 'node:path';",
        'export function write() {',
        "    const dir = mkdtempSync(join(tmpdir(), 'stuck-'));",
        "    writeFileSync(join(dir, 'f'), 'f');",
        '    chmodSync(dir, 0o500);',
        '    chmodSync(dir, 0o700);',
        '    rmSync(dir, { recursive: true, force: true });',
        '    return dir;',
        '}'
    ],
    directive: `"chmodSync(dir, 0o700);" .. "rmSync(dir, { recursive: true, force: true });" => return dir;`,
    imports: ["import { existsSync } from 'node:fs';"],
    body: ['expect(existsSync(write())).toBe(false);'],
    cleanImports: ["import { readdirSync } from 'node:fs';", "import { tmpdir } from 'node:os';"],
    clean: ["expect(readdirSync(tmpdir()).filter((one) => one.startsWith('stuck-'))).toEqual([]);"]
};

/**
 * The fixture with the writer's case, and a case of another file that holds the leftover absent,
 * with a revert that breaks it and one that changes nothing it reads; the check is run over the
 * clean file on both sides of the writer's, so the clean case's baseline, kept from the first pass,
 * would call red a run that failed only on what the writer left, under the environment given. Its
 * output, with the fixture.
 */
export function afterWriter(
    writer: Writer,
    env: NodeJS.ProcessEnv = process.env
): { dir: string; out: string } {
    const dir = fixture();
    withFile(dir, 'data.txt', 'data');
    withFile(dir, 'src/writer.mjs', [...writer.source, ''].join('\n'));
    withFile(dir, 'src/a.mjs', 'export const a = () => 1;\n');
    withFile(
        dir,
        'tests/writer.test.js',
        [
            ...writer.imports,
            "import { expect, it } from 'vitest';",
            "import { write } from '../src/writer.mjs';",
            '',
            "it('writes and cleans up after itself', () => {",
            `    ${DIRECTIVE} src/writer.mjs ${writer.directive}`,
            ...writer.body.map((line) => `    ${line}`),
            '});',
            ''
        ].join('\n')
    );
    withFile(
        dir,
        'tests/clean.test.js',
        [
            ...writer.cleanImports,
            "import { expect, it } from 'vitest';",
            "import { a } from '../src/a.mjs';",
            '',
            "it('leaves the tree clean', () => {",
            `    ${DIRECTIVE} src/a.mjs "export const a = () => 1;" => export const a = () => 2;`,
            `    ${DIRECTIVE} src/a.mjs "export const a = () => 1;" => export const a = () => 1 + 0;`,
            '    expect(a()).toBe(1);',
            ...writer.clean.map((line) => `    ${line}`),
            '});',
            ''
        ].join('\n')
    );
    const files = ['tests/clean.test.js', 'tests/writer.test.js', 'tests/clean.test.js'];
    const { out } = run(dir, files, env);
    const clean = 'tests/clean.test.js :: leaves the tree clean (revert src/a.mjs:1)';
    expect(out.split('\n').filter((line) => line.endsWith(clean))).toEqual([
        `red       ${clean}`,
        `GREEN     ${clean}`,
        `red       ${clean}`,
        `GREEN     ${clean}`
    ]);
    expect(out).toContain('red       tests/writer.test.js :: writes and cleans up after itself');
    expect(out).toContain('5 reverts, 2 unproven, 0 unchecked');
    return { dir, out };
}
