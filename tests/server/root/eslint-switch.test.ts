// Layer 2, server test. The server context ends every held ESLint when `lint.eslint` turns false
// (G36): the hook the portfolio watcher runs after each config push reads the setting again and
// ends the children, and a child that is running then exits.
//
// The context is built by `createServerContext` over a scratch copy of the engine's config folder
// (without `local.yml`, which is never copied), with every watcher and the relay replaced by an
// inert stand-in so nothing polls or listens. The child is a real process of oculus's own
// eslint-child.mjs over the stand-in `eslint` package of the lint fixture; its exit is read from
// the event `HeldEslints` reports, not from a wait.
//
// What this does not cover: the portfolio watcher calling the hook after a config push; the case
// calls the hook it was handed.
//
// @module-tag slow: builds the real server context and starts a real ESLint child.

import { cpSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { afterEach, describe, expect, vi } from 'vitest';
import { engineDir, loadConfig, readLocal } from '../../../src/lib/data/sources/config.ts';
import { lintSettings } from '../../../src/lib/data/sources/config/settings.ts';
import {
    createServerContext,
    type ContextDependencies
} from '../../../src/lib/server/root/context.ts';
import type { ServerContext } from '../../../src/lib/server/root/process/server-context.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { HeldEslints } from '../../../src/lib/server/machine/runs/lint/eslint.ts';
import { alive, eslintRepo, exitWatch, starts } from '../machine/runs/lint/lint-fixture.ts';

let live: ServerContext | null = null;

afterEach(() => {
    live?.close();
    live = null;
    vi.restoreAllMocks();
});

/** An object whose every method does nothing and answers nothing, for a watcher nothing reads. */
function inert(): never {
    return new Proxy(
        {},
        { get: (_target, name) => (name === 'then' ? undefined : () => undefined) }
    ) as never;
}

/** The dependencies of a context with no watcher, no poller and no language server. */
function inertDependencies(): Partial<ContextDependencies> {
    return {
        createTerminals: () => inert(),
        createRelay: () => inert(),
        createDebug: () => inert(),
        watchSessions: () => inert(),
        watchGit: () => inert(),
        watchAutofetch: () => inert(),
        watchBookmarks: () => inert(),
        watchSchedules: () => inert(),
        watchHpc: () => inert(),
        watchProcesses: () => inert(),
        watchCalendar: () => inert(),
        watchMail: () => inert(),
        watchLocal: () => inert(),
        watchApps: () => inert(),
        watchUsageRefresh: () => inert(),
        watchUsage: () => inert()
    };
}

/** A scratch engine holding the real engine's config folder without its machine-local file. */
function scratchEngine(): string {
    const engine = scratchDir('oculus-eslint-switch-');
    cpSync(join(engineDir(), 'config'), join(engine, 'config'), {
        recursive: true,
        filter: (source) => basename(source) !== 'local.yml'
    });
    return engine;
}

/** Set `lint.eslint` in the scratch engine's behavior.yml. */
function switchEslint(engine: string, on: boolean): void {
    const file = join(engine, 'config', 'behavior.yml');
    const text = readFileSync(file, 'utf8');
    const block = /(^lint:\n(?:[ ]+.*\n)*?[ ]+eslint: )(true|false)/m;
    expect(block.test(text)).toBe(true);
    writeFileSync(file, text.replace(block, `$1${on}`));
}

describe('the server context when lint.eslint turns false', () => {
    it('ends every held ESLint child from the hook the portfolio watcher runs', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const engine = scratchEngine();
        const repo = realpathSync(eslintRepo(scratchDir('oculus-eslint-switch-repo-')));
        let built: (() => void) | undefined;
        const exits = exitWatch();
        const context = createServerContext(engine, {
            ...inertDependencies(),
            readLocal: (folder, warn) => {
                const read = readLocal(folder, warn);
                const files = {
                    workspaces: join(engine, 'workspaces.json'),
                    approvals: join(engine, 'approvals.json'),
                    bookmarks: join(engine, 'bookmarks.yml'),
                    history: join(engine, 'history'),
                    changes: join(engine, 'changes.jsonl'),
                    notes: join(engine, 'notes')
                };
                return { ...read, config: { ...read.config, ...files } };
            },
            createEslints: (options) => new HeldEslints({ ...options, exited: exits.told }),
            watchPortfolio: ((_hub: unknown, _options: unknown, hooks: { built: () => void }) => {
                built = hooks.built;
                return inert();
            }) as ContextDependencies['watchPortfolio']
        });
        live = context;
        expect(built).toBeDefined();
        expect(lintSettings(loadConfig(engine).config).on.eslint).toBe(true);

        const answer = await context.eslint.lint(
            repo,
            join(repo, 'eslint.config.js'),
            'key',
            join(repo, 'a.js'),
            new AbortController().signal,
            60_000
        );
        expect(answer.kind).toBe('done');
        const pid = starts(repo).at(-1) ?? 0;
        expect(alive(pid)).toBe(true);
        expect(context.eslint.running()).toEqual([repo]);

        built?.();
        expect(context.eslint.running()).toEqual([repo]);

        switchEslint(engine, false);
        expect(lintSettings(loadConfig(engine).config).on.eslint).toBe(false);
        built?.();
        expect(context.eslint.running()).toEqual([]);
        await exits.gone(pid);
    });
});
