// Layer 4, server test. What POST /api/lint refuses and how it starts a program: the write token
// (G1), a path that is not a file inside a named root (G2), and a program started with an argument
// list and no shell (G7).
//
// The linters are scripts of the case's own (lint-fixture.ts) that record the arguments they were
// run with, named by `lint.ruff_path`, `lint.shellcheck_path` and `lint.chktex_path`, so a case
// reads whether a program started at all and with what. Nothing here needs ruff, ShellCheck or
// ChkTeX installed.
//
// What this does not cover: the rows a real linter's output becomes, which the readers' own runs
// over real output cover, and ESLint, which eslint-life.test.ts and eslint-trust.test.ts cover.

import { existsSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { it } from '../../../../fixtures/scratch.ts';
import { plant, plantProgram, recorded, route, scratch, settingsOf } from './lint-fixture.ts';

/** A scratch world: a root with one Python file, a file outside it, and a recording ruff. */
function world() {
    const base = scratch('oculus-lint-route-');
    const root = join(base, 'root');
    plant(join(root, 'a.py'), 'import os\n');
    plant(join(base, 'outside.py'), 'import sys\n');
    const record = join(base, 'ruff.args');
    const ruff = plantProgram(join(base, 'bin'), 'ruff', '[]');
    const lint = route(
        () => [{ key: 'repo', dir: root }],
        () => settingsOf({ ruff }),
        { env: { ...process.env, LINT_RECORD: record } }
    );
    return { base, root, record, lint };
}

describe('the lint route', () => {
    it('refuses a request without the write token and runs nothing (G1)', async () => {
        const { record, lint } = world();
        const body = { action: 'lint', root: 'repo', path: 'a.py', linter: 'ruff' };
        expect((await lint.post(body, null)).status).toBe(403);
        expect((await lint.post(body, 'another-token')).status).toBe(403);
        expect(recorded(record)).toBeNull();
        const allowed = await lint.post(body);
        expect(allowed.status).toBe(200);
        expect(recorded(record)).not.toBeNull();
    });

    const REFUSED: [string, string, string][] = [
        ['a path that climbs out of the root', 'repo', '../outside.py'],
        ['a root no list names', 'elsewhere', 'a.py'],
        ['a folder', 'repo', '.'],
        ['a file that is gone', 'repo', 'gone.py']
    ];
    it.each(REFUSED)('refuses %s before any program starts (G2)', async (_, root, path) => {
        const { record, lint } = world();
        const answered = await lint.post({ action: 'lint', root, path, linter: 'ruff' });
        expect(answered.status).toBe(404);
        expect(recorded(record)).toBeNull();
    });

    it('lints a link inside the root as its target and refuses a link that leads out (G2)', async () => {
        const { base, root, record, lint } = world();
        symlinkSync(join(root, 'a.py'), join(root, 'inside.py'));
        symlinkSync(join(base, 'outside.py'), join(root, 'leaves.py'));
        const refused = await lint.post({
            action: 'lint',
            root: 'repo',
            path: 'leaves.py',
            linter: 'ruff'
        });
        expect(refused.status).toBe(404);
        expect(recorded(record)).toBeNull();
        const allowed = await lint.post({
            action: 'lint',
            root: 'repo',
            path: 'inside.py',
            linter: 'ruff'
        });
        expect(allowed.status).toBe(200);
        expect(recorded(record)?.at(-1)).toBe(join(root, 'a.py'));
    });

    const NAMES: [string, string, 'ruff' | 'shellcheck'][] = [
        ['a name holding a semicolon and a space', 'a; touch x.py', 'ruff'],
        ['a name holding a command substitution', '$(touch x).sh', 'shellcheck']
    ];
    it.each(NAMES)(
        'starts a program with %s as one argument and runs no shell (G7)',
        async (_, name, linter) => {
            const base = scratch('oculus-lint-args-');
            const root = join(base, 'root');
            plant(join(root, name), 'x\n');
            const record = join(base, 'program.args');
            const program = plantProgram(
                join(base, 'bin'),
                linter,
                linter === 'ruff' ? '[]' : '{"comments":[]}'
            );
            const lint = route(
                () => [{ key: 'repo', dir: root }],
                () => settingsOf({ [linter]: program }),
                { env: { ...process.env, LINT_RECORD: record } }
            );
            const answered = await lint.post({ action: 'lint', root: 'repo', path: name, linter });
            expect(answered.status).toBe(200);
            expect(recorded(record)?.at(-1)).toBe(join(root, name));
            expect(existsSync(join(root, 'x'))).toBe(false);
            expect(existsSync(join(root, 'x.py'))).toBe(false);
        }
    );

    it('passes a root and a file path holding spaces, and the rc file beside the file, each as one argument (G7)', async () => {
        const base = scratch('oculus-lint-spaces-');
        const root = join(base, 'my root');
        const file = join(root, 'sub dir', 'paper one.tex');
        plant(file, 'text\n');
        const rc = plant(join(root, 'sub dir', '.chktexrc'), 'TabSize = 4\n');
        const record = join(base, 'chktex.args');
        const chktex = plantProgram(join(base, 'bin'), 'chktex', '');
        const lint = route(
            () => [{ key: 'my repo', dir: root }],
            () => settingsOf({ chktex }),
            { env: { ...process.env, LINT_RECORD: record } }
        );
        const answered = await lint.post({
            action: 'lint',
            root: 'my repo',
            path: 'sub dir/paper one.tex',
            linter: 'chktex'
        });
        expect(answered.status).toBe(200);
        const args = recorded(record) ?? [];
        expect(args.at(-1)).toBe(file);
        expect(args[args.indexOf('-l') + 1]).toBe(rc);
    });

    it('keeps a documentation address of a ruff row only when it is an http or https address', async () => {
        const base = scratch('oculus-lint-route-docs-');
        const root = join(base, 'root');
        plant(join(root, 'a.py'), 'import os\n');
        const row = (url: string) => ({
            code: 'F401',
            message: 'unused',
            location: { row: 1, column: 8 },
            end_location: { row: 1, column: 10 },
            fix: null,
            url,
            noqa_row: 1
        });
        const answer = JSON.stringify([
            row('javascript:alert(1)'),
            row('file:///etc/passwd'),
            row('https://docs.astral.sh/ruff/rules/unused-import')
        ]);
        const ruff = plantProgram(join(base, 'bin'), 'ruff', answer);
        const lint = route(
            () => [{ key: 'repo', dir: root }],
            () => settingsOf({ ruff }),
            { env: { ...process.env, LINT_RECORD: join(base, 'ruff.args') } }
        );
        const rows = (
            (await lint.post({ action: 'lint', root: 'repo', path: 'a.py', linter: 'ruff' }))
                .body as { rows: { href?: string }[] }
        ).rows;
        expect(rows).toHaveLength(3);
        expect(rows[0]).not.toHaveProperty('href');
        expect(rows[1]).not.toHaveProperty('href');
        expect(rows[2].href).toBe('https://docs.astral.sh/ruff/rules/unused-import');
    });
});
