// Layer 4, server test. What the lint route runs before the reader approves the ESLint
// configuration of a repository (G55): no child starts and no file of the repository is imported.
// The repository's `eslint.config.js` writes a marker file beside itself when it is imported, so
// the marker is the proof that code of the repository ran.
//
// The repository's `eslint` package is a stand-in (lint-fixture.ts) that imports the configuration
// it is given as ESLint does; the child that loads it is oculus's own eslint-child.mjs. The
// approvals file is under the scratch directory.
//
// What this does not cover: the real ESLint package and its plugins, and the palette's confirm
// dialog, which are checked by hand.

import { appendFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect } from 'vitest';
import { it } from '../../../../fixtures/scratch.ts';
import { eslintRepo, plant, route, scratch, settingsOf, starts } from './lint-fixture.ts';

type Route = ReturnType<typeof route>;
let live: Route | null = null;

afterEach(() => {
    live?.eslint.close();
    live = null;
});

function world() {
    const base = scratch('oculus-lint-trust-');
    const dir = eslintRepo(base);
    const lint = route(
        () => [{ key: 'repo', dir }],
        () => settingsOf()
    );
    live = lint;
    const at = { root: 'repo', path: 'a.js' };
    return { dir, lint, at };
}

describe('the lint route before an ESLint configuration is approved', () => {
    it('starts no child and imports nothing until the configuration is approved, then lints', async () => {
        const { dir, lint, at } = world();
        const before = await lint.post({ action: 'lint', linter: 'eslint', ...at });
        expect(before.body).toEqual({ ok: false, state: 'not_approved' });
        expect(existsSync(join(dir, 'config.marker'))).toBe(false);
        expect(starts(dir)).toEqual([]);
        expect(lint.eslint.running()).toEqual([]);

        const shown = (await lint.post({ action: 'config', ...at })).body as {
            config: { approved: boolean; key: string };
        };
        expect(shown.config.approved).toBe(false);
        const wrong = await lint.post({ action: 'approve', key: 'not-the-key', ...at });
        expect(wrong.status).toBe(409);
        expect(existsSync(join(dir, 'config.marker'))).toBe(false);

        const approved = await lint.post({ action: 'approve', key: shown.config.key, ...at });
        expect((approved.body as { config: { approved: boolean } }).config.approved).toBe(true);
        expect(existsSync(join(dir, 'config.marker'))).toBe(false);

        const after = (await lint.post({ action: 'lint', linter: 'eslint', ...at })).body as {
            ok: boolean;
            rows: unknown[];
        };
        expect(after.ok).toBe(true);
        expect(after.rows).toHaveLength(1);
        expect(existsSync(join(dir, 'config.marker'))).toBe(true);
        expect(starts(dir)).toHaveLength(1);
    });

    it('asks again when the configuration text changes, ending the child', async () => {
        const { dir, lint, at } = world();
        const shown = (await lint.post({ action: 'config', ...at })).body as {
            config: { key: string };
        };
        await lint.post({ action: 'approve', key: shown.config.key, ...at });
        expect(
            ((await lint.post({ action: 'lint', linter: 'eslint', ...at })).body as { ok: boolean })
                .ok
        ).toBe(true);
        expect(lint.eslint.running()).toHaveLength(1);

        appendFileSync(join(dir, 'eslint.config.js'), '// changed\n');
        const changed = (await lint.post({ action: 'config', ...at })).body as {
            config: { approved: boolean; key: string };
        };
        expect(changed.config.approved).toBe(false);
        expect(changed.config.key).not.toBe(shown.config.key);
        const again = await lint.post({ action: 'lint', linter: 'eslint', ...at });
        expect(again.body).toEqual({ ok: false, state: 'not_approved' });
        expect(lint.eslint.running()).toEqual([]);
    });

    it('ends the child when the approval is taken back', async () => {
        const { lint, at } = world();
        const shown = (await lint.post({ action: 'config', ...at })).body as {
            config: { key: string };
        };
        await lint.post({ action: 'approve', key: shown.config.key, ...at });
        await lint.post({ action: 'lint', linter: 'eslint', ...at });
        expect(lint.eslint.running()).toHaveLength(1);
        const revoked = (await lint.post({ action: 'revoke', ...at })).body as {
            config: { approved: boolean };
        };
        expect(revoked.config.approved).toBe(false);
        expect(lint.eslint.running()).toEqual([]);
        const refused = await lint.post({ action: 'lint', linter: 'eslint', ...at });
        expect(refused.body).toEqual({ ok: false, state: 'not_approved' });
    });

    it('keeps a documentation address only when it is an http or https address', async () => {
        const { lint } = world();
        const shown = (await lint.post({ action: 'config', root: 'repo', path: 'a.js' })).body as {
            config: { key: string };
        };
        await lint.post({ action: 'approve', key: shown.config.key, root: 'repo', path: 'a.js' });
        const rowOf = async (path: string) =>
            (
                (await lint.post({ action: 'lint', linter: 'eslint', root: 'repo', path }))
                    .body as {
                    rows: { href?: string }[];
                }
            ).rows[0];
        expect(await rowOf('a.js')).not.toHaveProperty('href');
        expect(await rowOf('plain.js')).not.toHaveProperty('href');
        expect((await rowOf('docs.js')).href).toBe('https://eslint.org/docs/rules/no-undef');
    });

    it('asks for a nested configuration on its own, and its approval covers that folder alone', async () => {
        const { dir, lint, at } = world();
        plant(join(dir, 'sub', 'eslint.config.js'), 'export default [];\n');
        plant(join(dir, 'sub', 'b.js'), 'x;\n');
        const nested = { root: 'repo', path: 'sub/b.js' };
        const rootKey = (
            (await lint.post({ action: 'config', ...at })).body as { config: { key: string } }
        ).config.key;
        await lint.post({ action: 'approve', key: rootKey, ...at });
        const ask = async (place: { root: string; path: string }) =>
            (await lint.post({ action: 'lint', linter: 'eslint', ...place })).body;
        expect(((await ask(at)) as { ok: boolean }).ok).toBe(true);
        expect(await ask(nested)).toEqual({ ok: false, state: 'not_approved' });
        const own = (await lint.post({ action: 'config', ...nested })).body as {
            config: { approved: boolean; key: string; file: string };
        };
        expect(own.config.approved).toBe(false);
        expect(own.config.key).not.toBe(rootKey);
        await lint.post({ action: 'approve', key: own.config.key, ...nested });
        expect(((await ask(nested)) as { ok: boolean }).ok).toBe(true);
        expect(lint.eslint.running().sort()).toEqual([dir, join(dir, 'sub')].sort());
        await lint.post({ action: 'revoke', ...nested });
        expect(lint.eslint.running()).toEqual([dir]);
        expect(await ask(nested)).toEqual({ ok: false, state: 'not_approved' });
        expect(((await ask(at)) as { ok: boolean }).ok).toBe(true);
    });
});
