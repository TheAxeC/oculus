// Layer 4, server test. How long the ESLint oculus holds for a repository lives (G36): it ends
// after 15 minutes without a request, when no served root holds its folder, when the approval it
// started under is not the one in force, and with the oculus server. A child that exits while a
// lint is in flight answers `failed` for that lint, a child that does not answer within the time of
// a lint is ended and the lint answers `timeout`, and the next lint after either starts a new
// child.
//
// The idle time and the time of a lint run on a stepped clock the case moves; the children are real
// processes of oculus's own eslint-child.mjs over the stand-in `eslint` package of lint-fixture.ts.
// A child's end is read from the exit event `HeldEslints` reports through its `exited` option,
// keyed by the process id the stand-in recorded.
//
// What this does not cover: the real ESLint package and its start-up time.

import { appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect } from 'vitest';
import { it } from '../../../../fixtures/scratch.ts';
import {
    alive,
    eslintRepo,
    route,
    scratch,
    settingsOf,
    exitWatch,
    starts,
    steppedClock
} from './lint-fixture.ts';

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const LIMIT_MS = 1000;

type Route = ReturnType<typeof route>;
let live: Route | null = null;

afterEach(() => {
    live?.eslint.close();
    live = null;
});

/** A repository whose configuration is approved, and a route that can lint it. */
async function world() {
    const base = scratch('oculus-lint-life-');
    const dir = eslintRepo(base);
    const served = { list: [{ key: 'repo', dir }] };
    const clock = steppedClock();
    const { told, gone } = exitWatch();
    const lint = route(
        () => served.list,
        () => settingsOf(),
        { clock, exited: told, limitMs: LIMIT_MS }
    );
    live = lint;
    const at = { root: 'repo', path: 'a.js' };
    const shown = (await lint.post({ action: 'config', ...at })).body as {
        config: { key: string };
    };
    await lint.post({ action: 'approve', key: shown.config.key, ...at });
    const ask = async (path = 'a.js') =>
        (await lint.post({ action: 'lint', linter: 'eslint', root: 'repo', path })).body as {
            ok: boolean;
            state?: string;
            reason?: string;
        };
    return { dir, served, clock, lint, ask, gone };
}

/** The process id of the newest child, once it has started. */
function newest(dir: string): number {
    return starts(dir).at(-1) ?? 0;
}

describe('the life of a held ESLint', () => {
    it('ends after 15 minutes without a lint and not a moment before', async () => {
        const { dir, clock, lint, ask, gone } = await world();
        expect((await ask()).ok).toBe(true);
        const pid = newest(dir);
        expect(alive(pid)).toBe(true);
        clock.advance(FIFTEEN_MINUTES - 1);
        expect(lint.eslint.running()).toHaveLength(1);
        expect(alive(pid)).toBe(true);
        clock.advance(1);
        expect(lint.eslint.running()).toEqual([]);
        await gone(pid);
    });

    it('keeps one child for the lints of a folder and restarts the idle wait at each', async () => {
        const { dir, clock, lint, ask } = await world();
        await ask();
        clock.advance(FIFTEEN_MINUTES - 1);
        await ask();
        clock.advance(FIFTEEN_MINUTES - 1);
        expect(lint.eslint.running()).toHaveLength(1);
        expect(starts(dir)).toHaveLength(1);
    });

    it('ends when no served root holds its folder', async () => {
        const { dir, served, lint, ask, gone } = await world();
        await ask();
        const pid = newest(dir);
        served.list = [];
        lint.eslint.reconcile();
        expect(lint.eslint.running()).toEqual([]);
        await gone(pid);
    });

    it('ends when the approval it started under is not the one in force', async () => {
        const { dir, lint, ask, gone } = await world();
        await ask();
        const pid = newest(dir);
        appendFileSync(join(dir, 'eslint.config.js'), '// changed\n');
        expect(await ask()).toEqual({ ok: false, state: 'not_approved' });
        expect(lint.eslint.running()).toEqual([]);
        await gone(pid);
    });

    it('ends with the server and starts no child afterwards', async () => {
        const { dir, lint, ask, gone } = await world();
        await ask();
        const pid = newest(dir);
        lint.eslint.close();
        expect(lint.eslint.running()).toEqual([]);
        await gone(pid);
        expect(await ask()).toEqual({ ok: false, state: 'failed', reason: 'stopped' });
        expect(starts(dir)).toHaveLength(1);
    });

    it('answers failed for a lint in flight when the child exits, and starts a new child for the next', async () => {
        const { dir, lint, ask, gone } = await world();
        expect((await ask()).ok).toBe(true);
        const first = newest(dir);
        const lost = await ask('crash.js');
        expect(lost.ok).toBe(false);
        expect(lost.state).toBe('failed');
        await gone(first);
        expect(lint.eslint.running()).toEqual([]);
        expect((await ask()).ok).toBe(true);
        expect(starts(dir)).toHaveLength(2);
        expect(alive(newest(dir))).toBe(true);
    });

    it('ends a child that does not answer within the time of a lint, answers timeout and starts a new child for the next', async () => {
        const { dir, clock, lint, ask, gone } = await world();
        expect((await ask()).ok).toBe(true);
        const hung = newest(dir);
        const armed = clock.armed(LIMIT_MS);
        const stuck = ask('hang.js');
        await armed;
        clock.advance(LIMIT_MS);
        expect(await stuck).toEqual({ ok: false, state: 'timeout' });
        await gone(hung);
        expect(lint.eslint.running()).toEqual([]);
        expect((await ask()).ok).toBe(true);
        expect(starts(dir)).toHaveLength(2);
        expect(alive(newest(dir))).toBe(true);
    });
});
