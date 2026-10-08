// Layer 2, server. POST /api/lint. A route module may export only its verbs, so everything the
// request does is here and src/routes/api/(machine)/lint/+server.ts is the lines that join them.
//
// A POST carries the write token and names a file by root and path. The action `lint` runs one
// linter on the file on disk and answers `{ ok: true, rows, hash }`, `hash` being the SHA-256 of
// the bytes the rows were read from, or `{ ok: false, state, reason? }` when the linter gave no
// rows: `not_found` (no such program), `failed` (with the first line the program wrote to stderr,
// or `too_large`, `unreadable`, `stopped`), `timeout`, `not_approved`, `no_config` and `off`. The
// action `config` answers the ESLint configuration file the file is linted under and whether its
// text is approved; `approve` and `revoke` write that approval, the first only for the key the
// reader was shown. The action `stop` ends the runs in flight for a file.
//
// The path is resolved inside its root before any process starts (a path that climbs out of the
// root, a link that leads out of it, a folder and a file that is gone are refused), and every
// program is started with an argument list and no shell. A new run of a file and linter stops the
// one in flight. ESLint runs the repository's code, so its child starts only under an approved
// configuration text, and until then no file of the repository is imported.

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import {
    LINT_IDS,
    lintersOf,
    type LintAnswer,
    type LintConfig,
    type LintId,
    type LintRow
} from '../../../../data/model/index.ts';
import type { LintSettings } from '../../../../data/sources/config.ts';
import { tokenedBody } from '../../../core/auth.ts';
import { hashOf } from '../../../core/file-bytes.ts';
import { chained, type FsWrites } from '../../../core/json.ts';
import { inside, realPath } from '../../../core/paths.ts';
import { run as runProgram } from '../../../core/program.ts';
import { resolveRootPath, type Root } from '../../../files/files.ts';
import {
    approveConfig,
    configKey,
    configText,
    isConfigApproved,
    revokeConfig
} from '../../approvals/approvals.ts';
import type { HeldEslints } from './eslint.ts';
import { chktexRc, planOf, programOf, tabSizeOf, type ProcessLinter } from './linters.ts';
import { readChktex, readEslint, readRuff, readShellcheck, sourceOf } from './readers.ts';
import type { LintRuns } from './runs.ts';

/** The milliseconds a run is given before it is stopped. */
const LINT_LIMIT_MS = 30_000;

/** What the route needs of the process. */
export type LintRouteOptions = {
    /** The lint settings in force now. */
    settings: () => LintSettings;
    /** The approvals file. */
    approvals: () => string;
    /** The write chain the approvals are written behind. */
    writes: FsWrites;
    /** The runs in flight, one per file and linter. */
    runs: LintRuns;
    /** The held ESLint children. */
    eslint: HeldEslints;
    /** The environment the programs are found and run in. */
    env?: NodeJS.ProcessEnv;
    /** The milliseconds a run is given; `LINT_LIMIT_MS` unless a test says otherwise. */
    limitMs?: number;
};

const NO_STORE = { 'cache-control': 'no-store' };

const target = z.object({ root: z.string(), path: z.string() });

const bodyShape = z.discriminatedUnion('action', [
    target.extend({ action: z.literal('lint'), linter: z.enum(LINT_IDS) }),
    target.extend({ action: z.literal('stop') }),
    target.extend({ action: z.literal('config') }),
    target.extend({ action: z.literal('approve'), key: z.string() }),
    target.extend({ action: z.literal('revoke') })
]);

/** The names ESLint looks for a flat configuration under, in the order it takes them. */
const ESLINT_CONFIGS = [
    'eslint.config.js',
    'eslint.config.mjs',
    'eslint.config.cjs',
    'eslint.config.ts',
    'eslint.config.mts',
    'eslint.config.cts'
];

function refuse(status: number, error: string): Response {
    return json({ ok: false, error }, { status, headers: NO_STORE });
}

function answer(body: LintAnswer): Response {
    return json(body, { headers: NO_STORE });
}

/** What a linter's run came to before the hash of the file it read is added to the rows. */
type Outcome = { ok: true; rows: LintRow[] } | Extract<LintAnswer, { ok: false }>;

function failed(reason?: string): Outcome {
    return reason === undefined
        ? { ok: false, state: 'failed' }
        : { ok: false, state: 'failed', reason };
}

/** The ESLint configuration a file is linted under: its folder, file name and text key. */
type EslintTarget = { folder: string; file: string; hash: string };

/**
 * The nearest `eslint.config.*` from the file's folder up to its root, when the ESLint package is
 * installed in a `node_modules` between that folder and the root. Null when there is none.
 */
function eslintTargetOf(real: string, rootReal: string): EslintTarget | null {
    for (let folder = dirname(real); inside(folder, rootReal); folder = dirname(folder)) {
        const file = ESLINT_CONFIGS.find((name) => existsSync(join(folder, name)));
        if (file !== undefined) {
            if (!packageInstalled(folder, rootReal)) return null;
            try {
                const hash = createHash('sha256')
                    .update(readFileSync(join(folder, file)))
                    .digest('hex');
                return { folder, file, hash };
            } catch {
                return null;
            }
        }
        if (dirname(folder) === folder) break;
    }
    return null;
}

/** Whether a `node_modules/eslint` is at the folder or above it, up to the root. */
function packageInstalled(folder: string, rootReal: string): boolean {
    for (let at = folder; inside(at, rootReal); at = dirname(at)) {
        if (existsSync(join(at, 'node_modules', 'eslint', 'package.json'))) return true;
        if (dirname(at) === at) break;
    }
    return false;
}

/** The first line of ruff's standard error that starts `Cause:`, else the program's first line. */
function reasonOf(linter: ProcessLinter, reason: string, stderr: string): string {
    if (linter !== 'ruff') return reason;
    const cause = stderr.split('\n').find((line) => line.trim().startsWith('Cause:'));
    return cause?.trim() ?? reason;
}

/** The rows of one process linter on one file, or the state it gave none in. */
async function runProcess(
    linter: ProcessLinter,
    real: string,
    rootReal: string,
    content: string,
    options: LintRouteOptions,
    signal: AbortSignal
): Promise<Outcome> {
    const settings = options.settings();
    const found = programOf(linter, settings, options.env ?? process.env);
    if ('missing' in found) return { ok: false, state: 'not_found' };
    const rc = linter === 'chktex' ? chktexRc(settings.chktexArgs, real, rootReal) : null;
    const plan = planOf(linter, found.path, real, settings, rc);
    const ran = await runProgram(
        plan.program,
        plan.args,
        { cwd: plan.cwd, findings: plan.findings, signal },
        { env: options.env, timeoutMs: options.limitMs ?? LINT_LIMIT_MS }
    );
    switch (ran.kind) {
        case 'missing':
            return { ok: false, state: 'not_found' };
        case 'timeout':
            return { ok: false, state: 'timeout' };
        case 'overflow':
            return failed('too_large');
        case 'stopped':
            return failed('stopped');
        case 'failed':
            return failed(reasonOf(linter, ran.reason, ran.stderr));
        case 'done':
            break;
    }
    if (linter === 'chktex' && ran.code === 0 && ran.stderr.includes('Unable to open')) {
        return failed(
            ran.stderr
                .split('\n')
                .find((line) => line.trim() !== '')
                ?.trim()
        );
    }
    const file = sourceOf(content);
    let rows: LintRow[] | null;
    switch (linter) {
        case 'chktex':
            rows = readChktex(ran.stdout, file, tabSizeOf(rc), content.startsWith('\uFEFF'));
            break;
        case 'ruff':
            rows = readRuff(ran.stdout, file);
            break;
        case 'shellcheck':
            rows = readShellcheck(ran.stdout, file);
            break;
    }
    return rows === null ? failed('unreadable') : { ok: true, rows };
}

/** The rows of the repository's own ESLint on one file, or the state it gave none in. */
async function runEslint(
    real: string,
    rootReal: string,
    content: string,
    options: LintRouteOptions,
    signal: AbortSignal
): Promise<Outcome> {
    const config = eslintTargetOf(real, rootReal);
    if (config === null) return { ok: false, state: 'no_config' };
    const text = configText(config.folder, [{ path: config.file, hash: config.hash }]);
    if (!isConfigApproved(options.approvals(), 'eslint-config', text)) {
        options.eslint.end(config.folder);
        return { ok: false, state: 'not_approved' };
    }
    const ran = await options.eslint.lint(
        config.folder,
        join(config.folder, config.file),
        configKey('eslint-config', text),
        real,
        signal,
        options.limitMs ?? LINT_LIMIT_MS
    );
    switch (ran.kind) {
        case 'timeout':
            return { ok: false, state: 'timeout' };
        case 'stopped':
            return failed('stopped');
        case 'failed':
            return failed(ran.reason);
        case 'done': {
            const rows = readEslint(ran.answer, sourceOf(content));
            return rows === null ? failed('unreadable') : { ok: true, rows };
        }
    }
}

/** The configuration view of an ESLint target, for the palette list. */
function configView(config: EslintTarget, options: LintRouteOptions): LintConfig {
    const text = configText(config.folder, [{ path: config.file, hash: config.hash }]);
    return {
        files: [join(basename(config.folder), config.file)],
        approved: isConfigApproved(options.approvals(), 'eslint-config', text),
        key: configKey('eslint-config', text)
    };
}

/** Whether a path is a file. */
function isFileAt(path: string): boolean {
    try {
        return statSync(path).isFile();
    } catch {
        return false;
    }
}

/** The file a request names inside its root, or the refusal. */
function fileOf(
    roots: Root[],
    root: string,
    path: string
): { real: string; rootReal: string } | Response {
    const found = resolveRootPath(roots, root, path);
    if ('error' in found) return refuse(404, found.error);
    const dir = roots.find((one) => one.key === root)?.dir ?? '';
    if (!isFileAt(found.path)) return refuse(404, 'not_a_file');
    return { real: found.path, rootReal: realPath(dir) ?? dir };
}

/** POST /api/lint. */
export async function handleLint(
    request: Request,
    token: string,
    roots: Root[],
    options: LintRouteOptions
): Promise<Response> {
    const read = await tokenedBody(request, token, {
        words: { token: 'forbidden', json: 'bad body' },
        fields: { ok: false },
        headers: NO_STORE
    });
    if (read instanceof Response) return read;
    const parsed = bodyShape.safeParse(read.body);
    if (!parsed.success) return refuse(400, 'bad_body');
    const body = parsed.data;
    const file = fileOf(roots, body.root, body.path);
    if (file instanceof Response) return file;
    if (body.action === 'lint') return lint(body, file, options);
    if (body.action === 'stop') {
        options.runs.stopFile(runKey(body.root, file.real, ''));
        return json({ ok: true }, { headers: NO_STORE });
    }
    const config = eslintTargetOf(file.real, file.rootReal);
    if (config === null) return answerConfig(null);
    const text = configText(config.folder, [{ path: config.file, hash: config.hash }]);
    if (body.action === 'approve') {
        if (configKey('eslint-config', text) !== body.key) return refuse(409, 'changed');
        const written = await chained(options.writes, () =>
            approveConfig(options.approvals(), 'eslint-config', text)
        );
        if (!written.ok) return refuse(409, 'not_written');
    } else if (body.action === 'revoke') {
        const written = await chained(options.writes, () =>
            revokeConfig(options.approvals(), 'eslint-config', text)
        );
        if (!written.ok) return refuse(409, 'not_written');
        options.eslint.end(config.folder);
    }
    return answerConfig(configView(config, options));
}

function answerConfig(config: LintConfig | null): Response {
    return json({ ok: true, config }, { headers: NO_STORE });
}

/** The key a run is held under: the root, the file's real path and the linter. */
function runKey(root: string, real: string, linter: string): string {
    return `${root}\n${real}\n${linter}`;
}

/** Run one linter on a resolved file. */
async function lint(
    body: { root: string; path: string; linter: LintId },
    file: { real: string; rootReal: string },
    options: LintRouteOptions
): Promise<Response> {
    if (!lintersOf(body.path).includes(body.linter)) return refuse(400, 'not_taken');
    if (!options.settings().on[body.linter]) return answer({ ok: false, state: 'off' });
    let bytes: Buffer;
    try {
        bytes = readFileSync(file.real);
    } catch {
        return refuse(404, 'not_a_file');
    }
    const content = bytes.toString('utf8');
    const held = options.runs.begin(runKey(body.root, file.real, body.linter));
    try {
        const outcome =
            body.linter === 'eslint'
                ? await runEslint(file.real, file.rootReal, content, options, held.signal)
                : await runProcess(
                      body.linter,
                      file.real,
                      file.rootReal,
                      content,
                      options,
                      held.signal
                  );
        return answer(outcome.ok ? { ...outcome, hash: hashOf(bytes) } : outcome);
    } finally {
        held.end();
    }
}
